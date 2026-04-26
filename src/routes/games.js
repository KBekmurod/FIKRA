const express = require('express');
const router = express.Router();
const { authMiddleware, requireAiAccess, incrementAiUsage } = require('../middleware/auth');
const { addXp } = require('../services/rankService');
const GameSession = require('../models/GameSession');
const TestQuestion = require('../models/TestQuestion');
const User = require('../models/User');

// ─── STROOP ───────────────────────────────────────────────────────────────────
// Free: kuniga 3 partiya, obuna bilan cheksiz
router.post('/stroop/result',
  authMiddleware,
  requireAiAccess('games'),
  async (req, res, next) => {
    try {
      const { gameType, score, correctAnswers, wrongAnswers, durationSec } = req.body;
      const user = req.user;

      if (!['stroop-color', 'stroop-tf'].includes(gameType)) {
        return res.status(400).json({ error: 'Yaroqsiz o\'yin turi' });
      }

      // XP: ball/10, min 10, max 50
      const xpEarned = Math.max(10, Math.min(Math.floor((score || 0) / 10), 50));

      const session = await GameSession.create({
        userId: user._id,
        telegramId: user.telegramId,
        gameType,
        score,
        correctAnswers,
        wrongAnswers,
        durationSec,
        tokensEarned: 0, // tokensiz
      });

      await User.findByIdAndUpdate(user._id, { $inc: { totalGamesPlayed: 1 } });
      await incrementAiUsage(user._id, 'games');

      const xpResult = await addXp(user._id, user.telegramId, xpEarned, 'stroop',
        { gameType, score });

      res.json({
        success: true,
        sessionId: session._id,
        xp: xpResult ? {
          added: xpResult.xpAdded,
          total: xpResult.xpAfter,
          levelUp: xpResult.levelUp,
          newRank: xpResult.levelUp ? xpResult.rankAfter : null,
        } : null,
      });
    } catch (err) { next(err); }
  }
);

// ─── DTM TEST — bu loyihaning markazi ─────────────────────────────────────
// Cheksiz — har kim, har vaqt yechishi mumkin

// GET /api/games/test/questions?subject=math&block=majburiy&limit=10
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
      { $project: { question: 1, options: 1, subject: 1, block: 1 } }, // answer YASHIRIN
    ]);

    res.json(questions);
  } catch (err) { next(err); }
});

// POST /api/games/test/check-answer
router.post('/test/check-answer', authMiddleware, async (req, res, next) => {
  try {
    const { questionId, selectedIndex } = req.body;
    const q = await TestQuestion.findById(questionId).select('answer explanation question options subject');
    if (!q) return res.status(404).json({ error: 'Savol topilmadi' });

    const isCorrect = q.answer === selectedIndex;
    res.json({
      isCorrect,
      correctIndex: q.answer,
      explanation: q.explanation,
      // AI tugmasi bosilsa kerak bo'ladi:
      questionContext: { question: q.question, options: q.options, subject: q.subject },
    });
  } catch (err) { next(err); }
});

// POST /api/games/test/result — test tugagach natija
router.post('/test/result', authMiddleware, async (req, res, next) => {
  try {
    const {
      gameType, subject, direction,
      ballAmount, maxBall, correctCount, totalQuestions
    } = req.body;
    const user = req.user;

    // XP: majburiy = correctCount×3, mutaxassislik = correctCount×4
    const xpPerCorrect = gameType === 'test-mut' ? 4 : 3;
    const xpEarned = Math.max(20, (correctCount || 0) * xpPerCorrect);

    await GameSession.create({
      userId: user._id,
      telegramId: user.telegramId,
      gameType,
      subject,
      direction,
      ballAmount,
      maxBall,
      correctCount,
      totalQuestions,
      tokensEarned: 0,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { totalGamesPlayed: 1 } });

    const xpResult = await addXp(user._id, user.telegramId, xpEarned, 'test',
      { gameType, correctCount });

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

// ─── LEADERBOARD ──────────────────────────────────────────────────────────
router.get('/leaderboard/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { period = 'week' } = req.query;

    const validTypes = ['stroop-color', 'stroop-tf', 'stroop-avg', 'test-maj', 'test-mut', 'xp'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Yaroqsiz reyting turi' });
    }

    if (type === 'xp') {
      const { getTopByXp } = require('../services/rankService');
      const results = await getTopByXp(50);
      return res.json(results);
    }

    const dateFilter = {};
    if (period === 'today') {
      dateFilter.createdAt = { $gte: new Date(new Date().setHours(0, 0, 0, 0)) };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.createdAt = { $gte: weekAgo };
    }

    let pipeline;
    if (type === 'stroop-avg') {
      pipeline = [
        { $match: { gameType: { $in: ['stroop-color', 'stroop-tf'] }, ...dateFilter } },
        { $group: { _id: '$telegramId', avgScore: { $avg: '$score' }, gamesPlayed: { $sum: 1 } } },
        { $sort: { avgScore: -1 } },
        { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: 'telegramId', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: {
          telegramId: '$_id',
          score: { $round: ['$avgScore', 0] },
          gamesPlayed: 1,
          username: { $ifNull: ['$user.firstName', 'Anonim'] },
        } },
      ];
    } else if (type.startsWith('test-')) {
      pipeline = [
        { $match: { gameType: type, ...dateFilter } },
        { $sort: { ballAmount: -1 } },
        { $group: { _id: '$telegramId', bestBall: { $max: '$ballAmount' } } },
        { $sort: { bestBall: -1 } },
        { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: 'telegramId', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: {
          telegramId: '$_id',
          score: { $round: ['$bestBall', 1] },
          username: { $ifNull: ['$user.firstName', 'Anonim'] },
        } },
      ];
    } else {
      pipeline = [
        { $match: { gameType: type, ...dateFilter } },
        { $sort: { score: -1 } },
        { $group: { _id: '$telegramId', bestScore: { $max: '$score' } } },
        { $sort: { bestScore: -1 } },
        { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: 'telegramId', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: {
          telegramId: '$_id',
          score: '$bestScore',
          username: { $ifNull: ['$user.firstName', 'Anonim'] },
        } },
      ];
    }

    const results = await GameSession.aggregate(pipeline);
    res.json(results.map((r, i) => ({ rank: i + 1, ...r })));
  } catch (err) { next(err); }
});

// GET /api/games/my-stats
router.get('/my-stats', authMiddleware, async (req, res, next) => {
  try {
    const tid = req.user.telegramId;

    const [stroopBest, testBest] = await Promise.all([
      GameSession.findOne({ telegramId: tid, gameType: { $in: ['stroop-color', 'stroop-tf'] } })
        .sort({ score: -1 }).select('score gameType'),
      GameSession.findOne({ telegramId: tid, gameType: { $in: ['test-maj', 'test-mut'] } })
        .sort({ ballAmount: -1 }).select('ballAmount subject direction'),
    ]);

    const totalGames = await GameSession.countDocuments({ telegramId: tid });

    res.json({
      stroopBestScore: stroopBest?.score || 0,
      testBestBall: testBest?.ballAmount || 0,
      totalGames,
    });
  } catch (err) { next(err); }
});

module.exports = router;
