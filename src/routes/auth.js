const express = require('express');
const router = express.Router();
const { verifyTelegramInitData, generateTokens, authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { processReferral } = require('../services/tokenService');
const User = require('../models/User');

// POST /api/auth/login
// Telegram initData verify → JWT berish yoki user yaratish
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { initData, referralCode } = req.body;
    if (!initData) return res.status(400).json({ error: 'initData kerak' });

    // Telegram HMAC verify
    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return res.status(401).json({ error: 'Telegram initData yaroqsiz' });
    }

    // Foydalanuvchini topish yoki yaratish
    let user = await User.findOne({ telegramId: tgUser.id });
    let isNew = false;

    if (!user) {
      user = await User.create({
        telegramId: tgUser.id,
        username: tgUser.username || '',
        firstName: tgUser.first_name || '',
        lastName: tgUser.last_name || '',
        photoUrl: tgUser.photo_url || '',
      });
      isNew = true;

      // Referral bonus
      if (referralCode) {
        const refId = parseInt(referralCode.replace('ref_', ''), 10);
        if (!isNaN(refId) && refId !== tgUser.id) {
          processReferral(user._id, tgUser.id, refId).catch(() => {});
        }
      }
    }

    // Streak yangilash
    user.updateStreak();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, tgUser.id);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        tokens: user.tokens,
        plan: user.plan,
        streakDays: user.streakDays,
        isNew,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token kerak' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

    const tokens = generateTokens(user._id, user.telegramId);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token yaroqsiz' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const user = req.user;
  const { getProgress } = require('../services/rankService');
  const rankProgress = getProgress(user.xp || 0);
  res.json({
    id: user._id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    tokens: user.tokens,
    plan: user.plan,
    planExpiresAt: user.planExpiresAt,
    streakDays: user.streakDays,
    totalGamesPlayed: user.totalGamesPlayed,
    totalAiRequests: user.totalAiRequests,
    referralCount: user.referralCount,
    lastLoginDate: user.lastLoginDate,
    // Daraja va lavozim
    xp: user.xp || 0,
    rank: rankProgress,
  });
});

// GET /api/user/rank — batafsil rank ma'lumoti
router.get('/rank', authMiddleware, async (req, res) => {
  const user = req.user;
  const { RANKS, getProgress } = require('../services/rankService');
  const progress = getProgress(user.xp || 0);
  res.json({
    progress,
    allRanks: RANKS,
  });
});

module.exports = router;
