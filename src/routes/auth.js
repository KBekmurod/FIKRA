// ─── Auth Routes (Google-only) ──────────────────────────────────────────
// Faqat Google OAuth orqali autentifikatsiya.
//
// Yo'llar:
//   POST /api/auth/google   — Google token bilan kirish/ro'yxatdan o'tish
//   POST /api/auth/refresh  — refresh token bilan access yangilash
//   GET  /api/auth/me       — joriy foydalanuvchi

const express = require('express');
const router  = express.Router();
const {
  generateTokens,
  authMiddleware,
} = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const User    = require('../models/User');
const { logger } = require('../utils/logger');

// ─── User ma'lumotini frontend uchun formatlash ────────────────────────────
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
  const cleanLimits = {};
  Object.keys(limits).forEach(k => {
    cleanLimits[k] = limits[k] === Infinity ? null : limits[k];
  });

  return {
    id:            user._id,
    email:         user.email,
    firstName:     user.firstName,
    lastName:      user.lastName,
    displayName:   user.displayName || user.firstName,
    photoUrl:      user.photoUrl,
    plan:          user.plan,
    effectivePlan: effective,
    planExpiresAt: user.planExpiresAt,
    isSubscribed:  user.isSubscribed,
    aiUsage,
    aiLimits:      cleanLimits,
  };
}

// ─── Google OAuth ──────────────────────────────────────────────────────────
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy');

// ─── POST /api/auth/google ──────────────────────────────────────────────────
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Google token kerak' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase().trim();
    const firstName = payload.given_name || 'Foydalanuvchi';
    const lastName = payload.family_name || '';
    const photoUrl = payload.picture || '';

    let user = await User.findOne({ email });

    if (!user) {
      // Yangi foydalanuvchi ro'yxatdan o'tmoqda
      user = await User.create({
        email,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        photoUrl,
      });
      logger.info(`User registered via Google: ${email}`);
    } else {
      // Agar rasm bo'lmasa, Google rasmini qo'yib qo'yamiz
      if (!user.photoUrl && photoUrl) {
        user.photoUrl = photoUrl;
        await user.save();
      }
      logger.info(`User logged in via Google: ${email}`);
    }

    const tokens = generateTokens(user._id);

    res.json({
      ...tokens,
      user: _serializeUser(user),
    });
  } catch (err) {
    logger.error('Google Auth xatosi: ' + err.message);
    res.status(401).json({ error: 'Google autentifikatsiyasida xatolik' });
  }
});

// ─── POST /api/auth/refresh ────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token kerak' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });

    const tokens = generateTokens(user._id);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token yaroqsiz' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;
    
    // Streak logic
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate !== today) {
      if (!user.lastActiveDate) {
        user.currentStreak = 1;
      } else {
        const last = new Date(user.lastActiveDate);
        const curr = new Date(today);
        const diffDays = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          user.currentStreak += 1;
        } else if (diffDays > 1) {
          user.currentStreak = 1;
        }
      }
      user.lastActiveDate = today;
      await user.save();
    }

    res.json(_serializeUser(user));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
