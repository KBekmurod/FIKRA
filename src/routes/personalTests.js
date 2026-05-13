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
    const { subjectId, wrongAnswers, count } = req.body;
    if (!subjectId) return res.status(400).json({ error: 'subjectId kerak' });
    if (!wrongAnswers || !Array.isArray(wrongAnswers) || wrongAnswers.length === 0) {
      return res.status(400).json({ error: 'wrongAnswers kerak' });
    }

    const { test, questions } = await testGen.generateMiniTest(req.user._id, {
      subjectId,
      wrongAnswers,
      count: count || 10,
    });

    res.json({
      testId:    test._id,
      subjectId: test.subjectId,
      subjectName: test.subjectName,
      testType:  'mini',
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
      totalCorrect,
      totalQuestions,
      scorePercent,
      startTime:  test.startTime,
      endTime:    test.endTime,
      level: levelResult,
    });
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
