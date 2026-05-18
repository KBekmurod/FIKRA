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

    const { test, questions } = await testGen.generateFromMaterials(req.user._id, {
      subjectId,
      materialIds,
      count: count || 10,
    });

    res.json({
      testId:    test._id,
      subjectId: test.subjectId,
      subjectName: test.subjectName,
      totalQuestions: questions.length,
      durationSeconds: questions.length * 60, // Har savol uchun 1 daqiqa
      questions: questions.map(q => ({
        idx:     q.idx,
        question: q.question,
        options:  q.options,
        topic:    q.topic,
        // answer va explanation ko'rsatilmaydi — test davomida ochiladi
      })),
    });
  } catch (err) {
    logger.error('Personal test generate error:', err.message);
    _handleError(err, res, next);
  }
});

// ─── POST /api/personal-tests/mini
// Xato savollardan mini-test yaratish
router.post('/mini', authMiddleware, async (req, res, next) => {
  try {
    const { subjectId, wrongAnswers, count, sourceTestId } = req.body;
    if (!subjectId) return res.status(400).json({ error: 'subjectId kerak' });
    if (!wrongAnswers || !Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
      return res.status(400).json({ error: 'wrongAnswers kerak' });
    }

    // 1 marta qoidasi — agar source testning folder.miniTestGenerated bor bo'lsa rad etamiz
    let folderId = null;
    if (sourceTestId) {
      const PersonalTest = require('../models/PersonalTest');
      const src = await PersonalTest.findOne({ _id: sourceTestId, userId: req.user._id }).lean();
      if (src?.folderId) {
        folderId = src.folderId;
        const MaterialFolder = require('../models/MaterialFolder');
        const folder = await MaterialFolder.findById(folderId);
        if (folder?.miniTestGenerated) {
          return res.status(409).json({
            error: 'Bu test uchun mini-test allaqachon yaratilgan',
            code: 'MINI_ALREADY_EXISTS',
            existingMiniTestId: folder.miniTestId,
          });
        }
      }
    }

    const { test, questions } = await testGen.generateMiniTest(req.user._id, {
      subjectId,
      wrongAnswers,
      count: count || (wrongAnswers.length <= 5 ? 5 : 10),
    });

    // Folder bilan bog'lash
    if (folderId) {
      test.folderId = folderId;
      await test.save();

      const MaterialFolder = require('../models/MaterialFolder');
      const folder = await MaterialFolder.findById(folderId);
      if (folder) {
        folder.miniTestId = test._id;
        folder.miniTestGenerated = true;
        await folder.save();
      }
    }

    res.json({
      testId:    test._id,
      subjectId: test.subjectId,
      subjectName: test.subjectName,
      testType:  'mini',
      folderId,
      totalQuestions: questions.length,
      durationSeconds: questions.length * 60,
      questions: questions.map(q => ({
        idx:      q.idx,
        question: q.question,
        options:  q.options,
        topic:    q.topic,
      })),
    });
  } catch (err) {
    logger.error('Mini test generate error:', err.message);
    _handleError(err, res, next);
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

    const ans = test.answers.find(a => a.qIdx === qIdx);

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
    } catch (e) {
      logger.error('AI explain detail error:', e.message);
      explanation = q.explanation || 'Tushuntirish hozircha mavjud emas. Material va savolni qaytadan ko\'rib chiqing.';
    }

    // Usage counter
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
    const { test, totalCorrect, totalQuestions, scorePercent } = await testGen.finishTest(
      req.params.id,
      req.user._id
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
