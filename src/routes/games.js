// FIKRA — Test routes (faqat DTM testlari)
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { addXp } = require('../services/rankService');
const TestQuestion = require('../models/TestQuestion');
const User = require('../models/User');

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

// ─── GET /api/games/test/offline-pack ────────────────────────────────────
// Oflayn mashq uchun: savol + javob kaliti + izoh
router.get('/test/offline-pack', authMiddleware, async (req, res, next) => {
  try {
    const { subject, block, limit = 10 } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (block) query.block = block;
    const lim = Math.min(Math.max(parseInt(limit) || 10, 1), 50);

    const questions = await TestQuestion.aggregate([
      { $match: query },
      { $sample: { size: lim } },
      { $project: { question: 1, options: 1, subject: 1, block: 1, answer: 1, explanation: 1 } },
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
router.post('/test/result', authMiddleware, async (req, res, next) => {
  try {
    const { gameType, subject, direction, ballAmount, maxBall, correctCount, totalQuestions } = req.body;
    const user = req.user;

    // XP: each correct answer = 5 XP
    const xpEarned = Math.max(20, (correctCount || 0) * 5);

    await User.findByIdAndUpdate(user._id, { $inc: { totalGamesPlayed: 1 } });

    const xpResult = await addXp(user._id, user.telegramId, xpEarned, 'test',
      { gameType, correctCount, subject });

    res.json({
      success: true,
      xp: xpResult ? {
        added: xpResult.xpAdded,
        total: xpResult.xpAfter,
        levelUp: xpResult.levelUp,
        newRank: xpResult.levelUp ? xpResult.rankAfter : null,
      } : null,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/games/leaderboard/xp ────────────────────────────────────────
router.get('/leaderboard/xp', async (req, res, next) => {
  try {
    const { getTopByXp } = require('../services/rankService');
    const results = await getTopByXp(50);
    res.json(results);
  } catch (err) { next(err); }
});

// ─── GET /api/games/my-stats ──────────────────────────────────────────────
router.get('/my-stats', authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;
    const subjectsStudied = await TestQuestion.aggregate([
      { $match: { _id: { $exists: true } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);
    const total = subjectsStudied.reduce((s, x) => s + x.count, 0);

    res.json({
      totalQuestionsAvailable: total,
      bySubject: subjectsStudied,
      myXp: user.xp || 0,
      myStreak: user.streakDays || 0,
      myTotalGames: user.totalGamesPlayed || 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;
