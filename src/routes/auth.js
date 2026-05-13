const express = require('express');
const router = express.Router();
const { verifyTelegramInitData, generateTokens, authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const User = require('../models/User');

// ─── User ma'lumotini frontend uchun formatlash ───────────────────────────────
function _serializeUser(user) {
  const todayKey = User.todayKey();
  const aiUsage = user.aiUsage?.date === todayKey
    ? {
        hints:       user.aiUsage.hints || 0,
        chats:       user.aiUsage.chats || 0,
        docs:        user.aiUsage.docs || 0,
        images:      user.aiUsage.images || 0,
        calories:    user.aiUsage.calories || 0,
        ocrUploads:  user.aiUsage.ocrUploads || 0,
        fileUploads: user.aiUsage.fileUploads || 0,
        testsGen:    user.aiUsage.testsGen || 0,
      }
    : {
        hints: 0, chats: 0, docs: 0, images: 0, calories: 0,
        ocrUploads: 0, fileUploads: 0, testsGen: 0,
      };

  const effective = user.effectivePlan();
  const limits = User.PLAN_LIMITS[effective] || User.PLAN_LIMITS.free;
  // Infinity → null (JSON uchun)
  const cleanLimits = {};
  Object.keys(limits).forEach(k => {
    cleanLimits[k] = limits[k] === Infinity ? null : limits[k];
  });

  return {
    id: user._id,
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    photoUrl: user.photoUrl,
    plan: user.plan,
    effectivePlan: effective,
    planExpiresAt: user.planExpiresAt,
    isSubscribed: user.isSubscribed,
    aiUsage,
    aiLimits: cleanLimits, // null = cheksiz
  };
}

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'initData kerak' });

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) {
      return res.status(401).json({ error: 'Telegram initData yaroqsiz' });
    }

    let user = await User.findOne({ telegramId: tgUser.id });
    let isNew = false;

    if (!user) {
      user = await User.create({
        telegramId: tgUser.id,
        username:   tgUser.username   || '',
        firstName:  tgUser.first_name || '',
        lastName:   tgUser.last_name  || '',
        photoUrl:   tgUser.photo_url  || '',
      });
      isNew = true;
    } else {
      // Mavjud user — Telegram'dagi yangi nom/avatar bilan sinxron
      let dirty = false;
      if (tgUser.username && user.username !== tgUser.username) {
        user.username = tgUser.username; dirty = true;
      }
      if (tgUser.first_name && user.firstName !== tgUser.first_name) {
        user.firstName = tgUser.first_name; dirty = true;
      }
      if (dirty) await user.save();
    }

    const { accessToken, refreshToken } = generateTokens(user._id, tgUser.id);

    res.json({
      accessToken,
      refreshToken,
      user: { ..._serializeUser(user), isNew },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
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

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  res.json(_serializeUser(req.user));
});

module.exports = router;
