// FIKRA — Test routes (faqat DTM testlari)
// Eslatma: bu eski "tezkor test" API. Asosiy DTM sessiyalari /api/exams orqali.
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const TestQuestion = require('../models/TestQuestion');

// ─── GET /api/games/test/questions ────────────────────────────────────────
// Random savollar
router.get('/test/questions', authMiddleware, async (req, res, next) => {
  try {
    const { subject, block, limit = 10 } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (block) query.block = block;
    const lim = Math.min(Math.max(parseInt(limit) || 10, 1), 30);

    const questions = await TestQuestion.aggregate([
      { $match: query },
      { $sample: { size: lim } },
      { $project: { question: 1, options: 1, subject: 1, block: 1 } },
    ]);
    res.json(questions);
  } catch (err) { next(err); }
});

// ─── POST /api/games/test/check-answer ────────────────────────────────────
router.post('/test/check-answer', authMiddleware, async (req, res, next) => {
  try {
    const { questionId, selectedIndex } = req.body;
    const q = await TestQuestion.findById(questionId)
      .select('answer explanation question options subject');
    if (!q) return res.status(404).json({ error: 'Savol topilmadi' });

    const isCorrect = q.answer === selectedIndex;
    res.json({
      isCorrect,
      correctIndex: q.answer,
      explanation: q.explanation || '',
      questionContext: { question: q.question, options: q.options, subject: q.subject },
    });
  } catch (err) { next(err); }
});

// ─── POST /api/games/test/result ──────────────────────────────────────────
// Eslatma: XP/Rank tizimi olib tashlangan. Bu endpoint hozir faqat
// frontend bilan moslik uchun saqlanadi.
router.post('/test/result', authMiddleware, async (req, res) => {
  res.json({ success: true });
});

// ─── GET /api/games/my-stats ──────────────────────────────────────────────
router.get('/my-stats', authMiddleware, async (req, res, next) => {
  try {
    const subjectsStudied = await TestQuestion.aggregate([
      { $match: { _id: { $exists: true } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);
    const total = subjectsStudied.reduce((s, x) => s + x.count, 0);

    res.json({
      totalQuestionsAvailable: total,
      bySubject: subjectsStudied,
    });
  } catch (err) { next(err); }
});

module.exports = router;
