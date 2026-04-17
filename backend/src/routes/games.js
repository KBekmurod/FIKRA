const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { earnTokens } = require('../services/tokenService');
const GameSession = require('../models/GameSession');
const TestQuestion = require('../models/TestQuestion');
const User = require('../models/User');

// ─── STROOP ───────────────────────────────────────────────────────────────────

// POST /api/games/stroop/result
router.post('/stroop/result', authMiddleware, async (req, res, next) => {
  try {
    const { gameType, score, correctAnswers, wrongAnswers, durationSec } = req.body;
    const user = req.user;

    if (!['stroop-color', 'stroop-tf'].includes(gameType)) {
      return res.status(400).json({ error: 'Yaroqsiz o\'yin turi' });
    }

    // Token hisoblash: har 10 ball = 1 token, max 20t
    const tokensEarned = Math.min(Math.floor((score || 0) / 10), 20);

    const session = await GameSession.create({
      userId: user._id,
      telegramId: user.telegramId,
      gameType,
      score,
      correctAnswers,
      wrongAnswers,
      durationSec,
      tokensEarned,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { totalGamesPlayed: 1 } });

    let newBalance = user.tokens;
    if (tokensEarned > 0) {
      newBalance = await earnTokens(
        user._id, user.telegramId, tokensEarned,
        `game_stroop`, 'earn', { gameType, score }
      );
    }

    res.json({ success: true, tokensEarned, newBalance, sessionId: session._id });
  } catch (err) { next(err); }
});

// ─── TEST ─────────────────────────────────────────────────────────────────────

// GET /api/games/test/questions?subject=math&limit=10
router.get('/test/questions', authMiddleware, async (req, res, next) => {
  try {
    const { subject, block, limit = 10 } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (block) query.block = block;

    // Tasodifiy savollar
    const questions = await TestQuestion.aggregate([
      { $match: query },
      { $sample: { size: parseInt(limit) } },
      { $project: { question: 1, options: 1, subject: 1, block: 1 } }, // answer yo'q!
    ]);

    res.json(questions);
  } catch (err) { next(err); }
});

// POST /api/games/test/check-answer — bir savol javobini tekshirish
router.post('/test/check-answer', authMiddleware, async (req, res, next) => {
  try {
    const { questionId, selectedIndex } = req.body;
    const q = await TestQuestion.findById(questionId).select('answer explanation');
    if (!q) return res.status(404).json({ error: 'Savol topilmadi' });

    const isCorrect = q.answer === selectedIndex;
    res.json({ isCorrect, correctIndex: q.answer, explanation: q.explanation });
  } catch (err) { next(err); }
});

// POST /api/games/test/result — test tugagach natija saqlash
router.post('/test/result', authMiddleware, async (req, res, next) => {
  try {
    const {
      gameType, subject, direction,
      ballAmount, maxBall, correctCount, totalQuestions
    } = req.body;
    const user = req.user;

    // Token: har to'g'ri javob = 2t, max 30t
    const tokensEarned = Math.min(correctCount * 2, 30);

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
      tokensEarned,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { totalGamesPlayed: 1 } });

    let newBalance = user.tokens;
    if (tokensEarned > 0) {
      newBalance = await earnTokens(
        user._id, user.telegramId, tokensEarned,
        'game_test', 'earn', { subject, ballAmount }
      );
    }

    res.json({ success: true, tokensEarned, newBalance });
  } catch (err) { next(err); }
});

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

// GET /api/games/leaderboard/:type?period=today|week|all
router.get('/leaderboard/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    const { period = 'week' } = req.query;

    const validTypes = ['stroop-color', 'stroop-tf', 'stroop-avg', 'test-maj', 'test-mut'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Yaroqsiz reyting turi' });
    }

    // Vaqt filtri
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
      // Stroop o'rtachasi: ikkala turni birlashtirish
      pipeline = [
        { $match: { gameType: { $in: ['stroop-color', 'stroop-tf'] }, ...dateFilter } },
        { $group: { _id: '$telegramId', avgScore: { $avg: '$score' }, gamesPlayed: { $sum: 1 } } },
        { $sort: { avgScore: -1 } },
        { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: 'telegramId', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            telegramId: '$_id',
            score: { $round: ['$avgScore', 0] },
            gamesPlayed: 1,
            username: { $ifNull: ['$user.firstName', 'Anonim'] },
          }
        },
      ];
    } else if (type.startsWith('test-')) {
      const block = type === 'test-maj' ? 'majburiy' : 'mutaxassislik';
      pipeline = [
        { $match: { gameType: type.replace('test-', 'test-'), ...dateFilter } },
        { $sort: { ballAmount: -1 } },
        { $group: { _id: '$telegramId', bestBall: { $max: '$ballAmount' } } },
        { $sort: { bestBall: -1 } },
        { $limit: 50 },
        { $lookup: { from: 'users', localField: '_id', foreignField: 'telegramId', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            telegramId: '$_id',
            score: { $round: ['$bestBall', 1] },
            username: { $ifNull: ['$user.firstName', 'Anonim'] },
          }
        },
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
        {
          $project: {
            telegramId: '$_id',
            score: '$bestScore',
            username: { $ifNull: ['$user.firstName', 'Anonim'] },
          }
        },
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
