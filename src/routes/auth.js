// ─── Auth Routes ────────────────────────────────────────────────────────
// Ilova autentifikatsiyasi: Email/parol + Google OAuth + Telegram bog'lash
//
// Yo'llar:
//   POST /api/auth/register       — email/parol orqali ro'yxat
//   POST /api/auth/login          — email/parol orqali kirish
//   POST /api/auth/google         — Google ID token orqali kirish/ro'yxat
//   POST /api/auth/telegram-link  — joriy akkountga Telegram bog'lash
//   POST /api/auth/refresh        — refresh token bilan access yangilash
//   GET  /api/auth/me             — joriy foydalanuvchi
//
// Telegram avtologin OLIB TASHLANGAN — Telegram'da ham email/google kerak.

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const {
  verifyTelegramInitData,
  generateTokens,
  authMiddleware,
} = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const User    = require('../models/User');
const { logger } = require('../utils/logger');

// Google OAuth Client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Email regex (oddiy)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    telegramId:    user.telegramId,
    email:         user.email,
    googleId:      user.googleId,
    username:      user.username,
    firstName:     user.firstName,
    lastName:      user.lastName,
    displayName:   user.displayName || user.firstName,
    photoUrl:      user.photoUrl,
    authProvider:  user.authProvider,
    hasPassword:   !!user.passwordHash,
    hasTelegram:   !!user.telegramId,
    hasGoogle:     !!user.googleId,
    plan:          user.plan,
    effectivePlan: effective,
    planExpiresAt: user.planExpiresAt,
    isSubscribed:  user.isSubscribed,
    aiUsage,
    aiLimits:      cleanLimits,
  };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────
// Email/parol orqali yangi ro'yxat
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Email yaroqsiz' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Parol kamida 8 belgi bo\'lsin' });
    }
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Ism kerak (kamida 2 belgi)' });
    }

    // Mavjud email tekshirish
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      email:        email.toLowerCase(),
      passwordHash,
      displayName:  name.trim(),
      firstName:    name.trim(),
      authProvider: 'email',
    });

    const tokens = generateTokens(user._id, null);
    logger.info(`User registered (email): ${email}`);

    res.json({
      ...tokens,
      user: { ..._serializeUser(user), isNew: true },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
// Email/parol orqali kirish
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email va parol kerak' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Email yoki parol noto\'g\'ri' });
    }

    const tokens = generateTokens(user._id, user.telegramId);
    logger.info(`User logged in (email): ${email}`);

    res.json({
      ...tokens,
      user: _serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/google ─────────────────────────────────────────────────
// Google ID token bilan kirish yoki ro'yxat
// Body: { idToken: string }
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    if (!googleClient) {
      return res.status(503).json({
        error: 'Google kirish hozircha sozlanmagan',
        code: 'GOOGLE_NOT_CONFIGURED',
      });
    }

    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: 'idToken kerak' });
    }

    // Google ID token tekshirish
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (e) {
      logger.error('Google verify error:', e.message);
      return res.status(401).json({ error: 'Google token yaroqsiz' });
    }

    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({ error: 'Google ma\'lumot to\'liq emas' });
    }

    const googleId = payload.sub;
    const email    = payload.email.toLowerCase();
    const name     = payload.name || payload.given_name || email.split('@')[0];
    const picture  = payload.picture || '';

    // 1. googleId bo'yicha qidirish
    let user = await User.findOne({ googleId });
    let isNew = false;

    if (!user) {
      // 2. Email bo'yicha mavjud akkountga ulash
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        if (!user.photoUrl && picture) user.photoUrl = picture;
        if (!user.displayName) user.displayName = name;
        await user.save();
      } else {
        // 3. Yangi yaratish
        user = await User.create({
          email,
          googleId,
          displayName:  name,
          firstName:    name,
          photoUrl:     picture,
          authProvider: 'google',
        });
        isNew = true;
      }
    }

    const tokens = generateTokens(user._id, user.telegramId);
    logger.info(`User logged in (google): ${email}`);

    res.json({
      ...tokens,
      user: { ..._serializeUser(user), isNew },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/telegram-link ──────────────────────────────────────────
// Joriy (authentifikatsiyalangan) foydalanuvchiga Telegram bog'lash
// Body: { initData }
router.post('/telegram-link', authMiddleware, async (req, res, next) => {
  try {
    const { initData } = req.body || {};
    if (!initData) return res.status(400).json({ error: 'initData kerak' });

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) return res.status(401).json({ error: 'Telegram initData yaroqsiz' });

    // Bu telegramId boshqa userga tegishlimi?
    const other = await User.findOne({ telegramId: tgUser.id, _id: { $ne: req.user._id } });
    if (other) {
      return res.status(409).json({ error: 'Bu Telegram allaqachon boshqa akkountga bog\'langan' });
    }

    req.user.telegramId = tgUser.id;
    if (!req.user.username && tgUser.username) req.user.username = tgUser.username;
    if (!req.user.photoUrl && tgUser.photo_url) req.user.photoUrl = tgUser.photo_url;
    await req.user.save();

    res.json({ success: true, user: _serializeUser(req.user) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/telegram-unlink ────────────────────────────────────────
router.post('/telegram-unlink', authMiddleware, async (req, res, next) => {
  try {
    // Faqat Telegram orqali kirgan bo'lsa va boshqa auth yo'lini yo'q bo'lsa, ruxsat bermaymiz
    if (!req.user.email && !req.user.googleId) {
      return res.status(400).json({
        error: "Telegram'ni o'chirishdan oldin email yoki Google qo'shing"
      });
    }
    req.user.telegramId = null;
    await req.user.save();
    res.json({ success: true, user: _serializeUser(req.user) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/telegram-only ──────────────────────────────────────────
// FAQAT eski foydalanuvchilar uchun (migratsiya): Telegram orqali kirish.
// Yangi foydalanuvchilar uchun ham xizmat qiladi, lekin ular keyin email
// qo'shishlari mumkin.
//
// Bu endpoint ataylab boshqa nom bilan — auth tizimi asosiy yo'l email/google
// bo'lib qoladi.
router.post('/telegram-only', authLimiter, async (req, res, next) => {
  try {
    const { initData } = req.body || {};
    if (!initData) return res.status(400).json({ error: 'initData kerak' });

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) return res.status(401).json({ error: 'Telegram initData yaroqsiz' });

    let user = await User.findOne({ telegramId: tgUser.id });
    let isNew = false;

    if (!user) {
      user = await User.create({
        telegramId:   tgUser.id,
        username:     tgUser.username   || '',
        firstName:    tgUser.first_name || '',
        lastName:     tgUser.last_name  || '',
        photoUrl:     tgUser.photo_url  || '',
        displayName:  tgUser.first_name || tgUser.username || 'User',
        authProvider: 'telegram',
      });
      isNew = true;
    } else {
      let dirty = false;
      if (tgUser.username && user.username !== tgUser.username) { user.username = tgUser.username; dirty = true; }
      if (tgUser.first_name && user.firstName !== tgUser.first_name) { user.firstName = tgUser.first_name; dirty = true; }
      if (dirty) await user.save();
    }

    const tokens = generateTokens(user._id, tgUser.id);
    res.json({
      ...tokens,
      user: { ..._serializeUser(user), isNew },
    });
  } catch (err) {
    next(err);
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

    const tokens = generateTokens(user._id, user.telegramId);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Refresh token yaroqsiz' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  res.json(_serializeUser(req.user));
});

// ─── POST /api/auth/change-password ───────────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Yangi parol kamida 8 belgi' });
    }

    // Email orqali kirgan foydalanuvchi — eski parolni tekshirish
    if (req.user.passwordHash) {
      if (!oldPassword) return res.status(400).json({ error: 'Eski parol kerak' });
      const ok = await bcrypt.compare(oldPassword, req.user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Eski parol noto\'g\'ri' });
    }

    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
