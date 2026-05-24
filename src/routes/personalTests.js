// ─── Personal Tests API routes ──────────────────────────────────────────────
// /api/personal-tests/*
//
// Foydalanuvchining o'z materiallaridan yaratilgan testlar
// va xato savollardan mini-testlar.

const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { logger }         = require('../utils/logger');
const { SUBJECT_META }   = require('../services/examService');
const testGen = require('../services/testGeneratorService');
const levelService = require('../services/levelService');

function _handleError(err, res, next) {
  if (err?.statusCode || err?.code) {
    return res.status(err.statusCode || 400).json({ error: err.message, code: err.code });
  }
  // Taniqli xatolar
  const msg = err.message || '';
  if (msg.includes('limit') || msg.includes('limitiд')) return res.status(429).json({ error: msg });
  if (msg.includes('Ruxsat') || msg.includes('topilmadi')) return res.status(404).json({ error: msg });
  next(err);
}

// ─── GET /api/personal-tests/estimate/:subjectId
// Materialdan nechta savol yaratish mumkin (UI uchun preview)
router.get('/estimate/:subjectId', authMiddleware, async (req, res, next) => {
  try {
    const result = await testGen.estimateForSubject(req.user._id, req.params.subjectId);
    res.json(result);
  } catch (err) { _handleError(err, res, next); }
});

// ─── POST /api/personal-tests/generate
// Materialdan yangi test yaratish
router.post('/generate', authMiddleware, async (req, res, next) => {
  try {
    const { subjectId, materialIds, count } = req.body;
    if (!subjectId) return res.status(400).json({ error: 'subjectId kerak' });
    if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
      return res.status(400).json({ error: 'materialIds kerak' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const interval = setInterval(() => { res.write(': keep-alive\n\n'); }, 5000);

    try {
      const { test, questions } = await testGen.generateFromMaterials(req.user._id, {
        subjectId,
        materialIds,
        count: count || 10,
      });
      clearInterval(interval);
      res.write(`data: ${JSON.stringify({
        testId:    test._id,
        subjectId: test.subjectId,
        subjectName: test.subjectName,
        totalQuestions: questions.length,
        durationSeconds: questions.length * 60,
        questions: questions.map(q => ({
          idx:     q.idx,
          question: q.question,
          options:  q.options,
          topic:    q.topic,
        })),
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      clearInterval(interval);
      res.write(`data: ${JSON.stringify({ error: err.message, code: err.code })}\n\n`);
      res.end();
    }
  } catch (err) {
    logger.error('Personal test generate error:', err.message);
    if (!res.headersSent) _handleError(err, res, next);
  }
});

// ─── POST /api/personal-tests/mini
// Xato savollardan mini-test yaratish
// ─── POST /api/personal-tests/ai-blok
// AI yo'nalish bo'yicha blok test yaratish (DTM standart)
// Body: { direction: 'engineering', subjects: { uztil: { folderIds }, math: {...}, ... } }
router.post('/ai-blok', authMiddleware, async (req, res, next) => {
  try {
    const aiTestService = require('../services/aiTestService');
    const { direction, subjects } = req.body;

    if (!direction) return res.status(400).json({ error: 'direction kerak' });
    if (!subjects || typeof subjects !== 'object') {
      return res.status(400).json({ error: 'subjects (papkalar) kerak' });
    }

    const result = await aiTestService.generateBlokTest(req.user._id, { direction, subjects });
    
    res.json({
      testId: result.testId,
      dirName: result.dirName,
      status: 'generating'
    });

  } catch (err) {
    logger.error('AI Blok test error:', err.message);
    _handleError(err, res, next);
  }
});

// ─── POST /api/personal-tests/ai-free
// AI erkin tanlov test (2-5 fan)
// Body: { subjects: [{ id, folderIds, count }, ...] }
router.post('/ai-free', authMiddleware, async (req, res, next) => {
  try {
    const aiTestService = require('../services/aiTestService');
    const { subjects } = req.body;

    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ error: 'subjects array kerak' });
    }

    const result = await aiTestService.generateFreeTest(req.user._id, { subjects });

    res.json({
      testId: result.testId,
      status: 'generating'
    });

  } catch (err) {
    logger.error('AI Free test error:', err.message);
    _handleError(err, res, next);
  }
});

// ─── GET /api/personal-tests/:id/status
// Generatsiya bo'layotgan test holatini tekshirish
router.get('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const PersonalTest = require('../models/PersonalTest');
    const test = await PersonalTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!test) return res.status(404).json({ error: 'Test topilmadi' });

    if (test.status === 'generating') {
      return res.json({ status: 'generating' });
    }

    if (test.status === 'failed') {
      return res.json({ status: 'failed', error: test.metadata?.error || 'Test yaratishda xatolik' });
    }

    // Agar in_progress yoki completed bo'lsa, demak tayyor
    res.json({
      status: 'ready',
      testId: test._id,
      subjectId: test.subjectId,
      subjectName: test.subjectName,
      testType: test.testType,
      totalQuestions: test.totalQuestions,
      durationSeconds: test.totalQuestions * 60,
      questions: test.questions.map(q => ({
        idx:         q.idx,
        question:    q.question,
        options:     q.options,
        topic:       q.topic,
        subjectId:   q.subjectId,
        subjectName: q.subjectName,
      })),
    });
  } catch (err) {
    _handleError(err, res, next);
  }
});

router.post('/mini', authMiddleware, async (req, res, next) => {
  try {
    const { subjectId, wrongAnswers, count, sourceTestId } = req.body;
    if (!subjectId) return res.status(400).json({ error: 'subjectId kerak' });
    if (!wrongAnswers || !Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
      return res.status(400).json({ error: 'wrongAnswers kerak' });
    }

    // 1 marta qoidasi (universal — material/ai_blok/ai_free hammasi uchun)
    let folderId = null;
    let sourceTest = null;
    if (sourceTestId) {
      const PersonalTest = require('../models/PersonalTest');
      sourceTest = await PersonalTest.findOne({ _id: sourceTestId, userId: req.user._id });
      if (!sourceTest) return res.status(404).json({ error: 'Asosiy test topilmadi' });

      // Test'ning o'zida mini-test borligini tekshiramiz (universal)
      if (sourceTest.miniTestId) {
        return res.status(409).json({
          error: 'Bu test uchun mini-test allaqachon yaratilgan',
          code: 'MINI_ALREADY_EXISTS',
          existingMiniTestId: sourceTest.miniTestId,
        });
      }

      folderId = sourceTest.folderId || null;

      // Eski folder-based qoida (material testlari uchun backward compat)
      if (folderId) {
        const MaterialFolder = require('../models/MaterialFolder');
        const folder = await MaterialFolder.findById(folderId);
        if (folder?.miniTestGenerated) {
          return res.status(409).json({
            error: 'Bu papka uchun mini-test allaqachon yaratilgan',
            code: 'MINI_ALREADY_EXISTS',
            existingMiniTestId: folder.miniTestId,
          });
        }
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const interval = setInterval(() => { res.write(': keep-alive\n\n'); }, 5000);

    try {
      const { test, questions } = await testGen.generateMiniTest(req.user._id, {
        subjectId,
        wrongAnswers,
        count: count || (wrongAnswers.length <= 5 ? 5 : 10),
      });

      test.sourceTestId = sourceTestId || null;
      if (folderId) test.folderId = folderId;
      await test.save();

      if (sourceTest) {
        sourceTest.miniTestId = test._id;
        await sourceTest.save();
      }

      if (folderId) {
        const MaterialFolder = require('../models/MaterialFolder');
        const folder = await MaterialFolder.findById(folderId);
        if (folder) {
          folder.miniTestId = test._id;
          folder.miniTestGenerated = true;
          await folder.save();
        }
      }

      clearInterval(interval);
      res.write(`data: ${JSON.stringify({
        testId:    test._id,
        subjectId: test.subjectId,
        subjectName: test.subjectName,
        testType:  'mini',
        folderId,
        sourceTestId: sourceTestId || null,
        totalQuestions: questions.length,
        durationSeconds: questions.length * 60,
        questions: questions.map(q => ({
          idx:      q.idx,
          question: q.question,
          options:  q.options,
          topic:    q.topic,
        })),
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      clearInterval(interval);
      res.write(`data: ${JSON.stringify({ error: err.message, code: err.code })}\n\n`);
      res.end();
    }
  } catch (err) {
    logger.error('Mini test generate error:', err.message);
    if (!res.headersSent) _handleError(err, res, next);
  }
});

// ─── POST /api/personal-tests/:id/explain
// Bitta xato savol uchun AI batafsil tushuntirish
router.post('/:id/explain', authMiddleware, async (req, res, next) => {
  try {
    const { qIdx } = req.body;
    if (typeof qIdx !== 'number') return res.status(400).json({ error: 'qIdx kerak' });

    const PersonalTest = require('../models/PersonalTest');
    const User = require('../models/User');
    const test = await PersonalTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!test) return res.status(404).json({ error: 'Test topilmadi' });

    const q = test.questions.find(qq => qq.idx === qIdx);
    if (!q) return res.status(404).json({ error: 'Savol topilmadi' });

    // Limit
    const user = await User.findById(req.user._id);
    const hintsLimit = User.PLAN_LIMITS[user.effectivePlan()].hints;
    if (hintsLimit !== Infinity && (user.getAiUsage('hints') || 0) >= hintsLimit) {
      return res.status(429).json({ error: 'Kunlik AI tushuntirish limiti tugadi' });
    }

    const ans = test.answers.find(a => a.questionIdx === qIdx);

    let explanation;
    try {
      const aiService = require('../services/aiService');
      explanation = await aiService.explainWrongAnswer(
        q.question,
        q.options,
        q.answer,
        ans?.selected ?? -1,
        test.subjectName,
        q.topic || ''
      );

      // Usage counter faqat muvaffaqiyatli bo'lsa oshiriladi
      await User.findOneAndUpdate({ _id: req.user._id }, [{
        $set: {
          aiUsage: {
            $cond: [
              { $eq: ['$aiUsage.date', User.todayKey()] },
              { $mergeObjects: ['$aiUsage', { hints: { $add: [{ $ifNull: ['$aiUsage.hints', 0] }, 1] } }] },
              { date: User.todayKey(), hints: 1 },
            ],
          },
        },
      }]);
    } catch (e) {
      logger.error('AI explain detail error:', e.message);
      explanation = q.explanation || 'Tushuntirish hozircha mavjud emas. Material va savolni qaytadan ko\'rib chiqing.';
    }

    res.json({ explanation });
  } catch (err) {
    logger.error('AI explain error:', err.message);
    _handleError(err, res, next);
  }
});

// ─── POST /api/personal-tests/:id/answer
// Bitta javob saqlash
router.post('/:id/answer', authMiddleware, async (req, res, next) => {
  try {
    const { questionIdx, selectedOption } = req.body;
    if (questionIdx === undefined || selectedOption === undefined) {
      return res.status(400).json({ error: 'questionIdx va selectedOption kerak' });
    }

    const result = await testGen.submitAnswer(
      req.params.id,
      req.user._id,
      questionIdx,
      selectedOption
    );

    res.json({ saved: true, ...result });
  } catch (err) { _handleError(err, res, next); }
});

// ─── POST /api/personal-tests/:id/finish
// Testni yakunlash va darajani yangilash
router.post('/:id/finish', authMiddleware, async (req, res, next) => {
  try {
    const { finalAnswers } = req.body || {};
    const { test, totalCorrect, totalQuestions, scorePercent } = await testGen.finishTest(
      req.params.id,
      req.user._id,
      finalAnswers
    );

    // Folder statistikasini yangilash (agar bog'lanish bor bo'lsa)
    let folderStats = null;
    if (test.folderId) {
      const folderService = require('../services/folderService');
      const updated = await folderService.recordTestAttempt(
        test.folderId, totalCorrect, totalQuestions
      ).catch(e => { logger.error('Folder stats error:', e.message); return null; });
      if (updated) folderStats = updated.stats;
    }

    // Darajani yangilash
    const levelResult = await levelService.recordResult(req.user._id, {
      source:  test.testType === 'mini' ? 'mini' : 'personal',
      correct: totalCorrect,
      total:   totalQuestions,
    }).catch(e => { logger.error('Level update error:', e.message); return null; });

    res.json({
      testId:         test._id,
      subjectId:      test.subjectId,
      subjectName:    test.subjectName,
      testType:       test.testType,
      folderId:       test.folderId || null,
      totalCorrect,
      totalQuestions,
      scorePercent,
      startTime:  test.startTime,
      endTime:    test.endTime,
      folderStats,
      level: levelResult,
    });
  } catch (err) { _handleError(err, res, next); }
});

// ─── POST /api/personal-tests/:id/abandon — bekor qilish ───────────────────
// Test tugatilmagan holda chiqib ketilgan bo'lsa abandoned qilinadi va
// tarixda ko'rinmaydi.
router.post('/:id/abandon', authMiddleware, async (req, res, next) => {
  try {
    const PersonalTest = require('../models/PersonalTest');
    const test = await PersonalTest.findOne({ _id: req.params.id, userId: req.user._id });
    if (!test) return res.status(404).json({ error: 'Test topilmadi' });
    if (test.status === 'in_progress') {
      test.status = 'abandoned';
      test.endTime = new Date();
      await test.save();
    }
    res.json({ success: true });
  } catch (err) { _handleError(err, res, next); }
});

// ─── GET /api/personal-tests
// Test tarixi
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { subject, type, page } = req.query;
    const result = await testGen.getTestHistory(req.user._id, {
      subjectId: subject || null,
      testType:  type || null,
      page:      parseInt(page) || 1,
    });
    res.json(result);
  } catch (err) { _handleError(err, res, next); }
});

// ─── GET /api/personal-tests/:id
// Bitta test (review uchun)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const test = await testGen.getTestReview(req.params.id, req.user._id);
    res.json({ test });
  } catch (err) { _handleError(err, res, next); }
});

module.exports = router;
