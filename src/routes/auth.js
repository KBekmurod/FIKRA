const express = require('express');
const router = express.Router();
const { verifyTelegramInitData, generateTokens, authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const User = require('../models/User');

// ─── Referral processor (token bonusisiz, faqat statistika) ──────────────────
async function processReferral(newUserId, newUserTelegramId, refByTelegramId) {
  if (!refByTelegramId || refByTelegramId === newUserTelegramId) return;
  const refUser = await User.findOne({ telegramId: refByTelegramId });
  if (!refUser) return;
  await User.findByIdAndUpdate(refUser._id, { $inc: { referralCount: 1 } });
}

// ─── User ma'lumotini frontend uchun formatlash ───────────────────────────────
function _serializeUser(user, rankProgress) {
  const todayKey = User.todayKey();
  const aiUsage = user.aiUsage?.date === todayKey
    ? { hints: user.aiUsage.hints || 0, chats: user.aiUsage.chats || 0,
        docs: user.aiUsage.docs || 0, images: user.aiUsage.images || 0 }
    : { hints: 0, chats: 0, docs: 0, images: 0 };

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
    plan: user.plan,
    effectivePlan: effective,
    planExpiresAt: user.planExpiresAt,
    isSubscribed: user.isSubscribed,
    streakDays: user.streakDays,
    totalGamesPlayed: user.totalGamesPlayed,
    totalAiRequests: user.totalAiRequests,
    referralCount: user.referralCount,
    lastLoginDate: user.lastLoginDate,
    xp: user.xp || 0,
    rank: rankProgress,
    aiUsage,
    aiLimits: cleanLimits, // null = cheksiz
  };
}

// ─── POST /api/auth/register (Standard Auth) ──────────────────────────────────
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { phone, password, firstName, lastName } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Telefon raqam va parol kiritilishi shart' });
    }

    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ error: 'Bu telefon raqami allaqachon ro\'yxatdan o\'tgan' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = await User.create({
      phone,
      password: passwordHash,
      firstName: firstName || '',
      lastName: lastName || '',
    });

    user.updateStreak();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, null); // no telegramId
    const { getProgress } = require('../services/rankService');
    const rankProgress = getProgress(user.xp || 0);

    res.json({
      accessToken,
      refreshToken,
      user: { ..._serializeUser(user, rankProgress), isNew: true },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login-standard (Standard Auth) ──────────────────────────
router.post('/login-standard', authLimiter, async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Telefon raqam va parol kiritilishi shart' });
    }

    const user = await User.findOne({ phone });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Noto\'g\'ri telefon raqami yoki parol' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Noto\'g\'ri telefon raqami yoki parol' });
    }

    user.updateStreak();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, user.telegramId || null);
    const { getProgress } = require('../services/rankService');
    const rankProgress = getProgress(user.xp || 0);

    res.json({
      accessToken,
      refreshToken,
      user: { ..._serializeUser(user, rankProgress), isNew: false },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/login (Telegram WebApp Auth) ────────────────────────────
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { initData, referralCode } = req.body;
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
        username: tgUser.username || '',
        firstName: tgUser.first_name || '',
        lastName: tgUser.last_name || '',
        photoUrl: tgUser.photo_url || '',
      });
      isNew = true;

      if (referralCode) {
        const refId = parseInt(String(referralCode).replace('ref_', ''), 10);
        if (!isNaN(refId)) {
          user.referredBy = refId;
          await user.save();
          processReferral(user._id, tgUser.id, refId).catch(() => {});
        }
      }
    } else {
      // Mavjud user — Telegram'dagi yangi nom/avatar bilan sinxron
      let dirty = false;
      if (tgUser.username && user.username !== tgUser.username) {
        user.username = tgUser.username; dirty = true;
      }
      if (tgUser.first_name && user.firstName !== tgUser.first_name) {
        user.firstName = tgUser.first_name; dirty = true;
      }
      if (tgUser.last_name !== undefined && user.lastName !== (tgUser.last_name || '')) {
        user.lastName = tgUser.last_name || ''; dirty = true;
      }
      if (dirty) await user.save();
    }

    user.updateStreak();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, tgUser.id);
    const { getProgress } = require('../services/rankService');
    const rankProgress = getProgress(user.xp || 0);

    res.json({
      accessToken,
      refreshToken,
      user: { ..._serializeUser(user, rankProgress), isNew },
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
    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ error: 'Server konfiguratsiya xatosi' });
    }
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
  const user = req.user;
  const { getProgress } = require('../services/rankService');
  const rankProgress = getProgress(user.xp || 0);
  res.json(_serializeUser(user, rankProgress));
});

// ─── GET /api/auth/rank ──────────────────────────────────────────────────────
router.get('/rank', authMiddleware, async (req, res) => {
  const user = req.user;
  const { RANKS, getProgress } = require('../services/rankService');
  res.json({
    progress: getProgress(user.xp || 0),
    allRanks: RANKS,
  });
});

// ─── POST /api/auth/google (Google OAuth) ────────────────────────────────────
router.post('/google', authLimiter, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Google token kerak' });
    }

    // Google token verification
    const { OAuth2Client } = require('google-auth-library');
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ error: 'Google OAuth konfiguratsiyasi yo\'q' });
    }

    const client = new OAuth2Client(googleClientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
    } catch (err) {
      return res.status(401).json({ error: 'Google token yaroqsiz' });
    }

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const firstName = payload.given_name || '';
    const lastName = payload.family_name || '';
    const photoUrl = payload.picture || '';

    // User mavjud bo'lsa yoki yangi bo'lsa
    let user = await User.findOne({ googleId });
    let isNew = false;

    if (!user) {
      // Email orqali ham tekshiramiz
      user = await User.findOne({ email });
      if (!user) {
        // Yangi user yarataramiz
        user = await User.create({
          googleId,
          email,
          firstName,
          lastName,
          photoUrl,
          googleName: `${firstName} ${lastName}`.trim(),
        });
        isNew = true;
      } else {
        // Email mavjud edi, googleId'ni qo'shamiz
        user.googleId = googleId;
        if (!user.firstName && firstName) user.firstName = firstName;
        if (!user.lastName && lastName) user.lastName = lastName;
        if (!user.photoUrl && photoUrl) user.photoUrl = photoUrl;
        await user.save();
      }
    } else {
      // Google user mavjud — email va profil yangilanishi
      let dirty = false;
      if (user.email !== email) {
        user.email = email;
        dirty = true;
      }
      if (firstName && user.firstName !== firstName) {
        user.firstName = firstName;
        dirty = true;
      }
      if (lastName && user.lastName !== lastName) {
        user.lastName = lastName;
        dirty = true;
      }
      if (photoUrl && user.photoUrl !== photoUrl) {
        user.photoUrl = photoUrl;
        dirty = true;
      }
      if (dirty) await user.save();
    }

    user.updateStreak();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id, user.telegramId || null);
    const { getProgress } = require('../services/rankService');
    const rankProgress = getProgress(user.xp || 0);

    res.json({
      accessToken,
      refreshToken,
      user: { ..._serializeUser(user, rankProgress), isNew },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/link-telegram ────────────────────────────────────────────
// Chrome'dan (phone/Google) kirgan user Telegram WebApp'da ochilganda
// uning mavjud akkauntiga telegramId'ni ulaydi.
// Auth: Bearer token (mavjud login) + body: { initData }
router.post('/link-telegram', authLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ error: 'initData kerak' });

    const tgUser = verifyTelegramInitData(initData);
    if (!tgUser) return res.status(401).json({ error: 'Telegram initData yaroqsiz' });

    const user = req.user;

    // Bu telegramId boshqa userda mavjudmi?
    const existing = await User.findOne({ telegramId: tgUser.id });
    if (existing && String(existing._id) !== String(user._id)) {
      // Boshqa user allaqachon bu telegramId bilan — xato
      return res.status(409).json({
        error: 'Bu Telegram akkaunt allaqachon boshqa hisob bilan bog\'liq',
        code: 'TELEGRAM_ALREADY_LINKED',
      });
    }

    // O'zida allaqachon bog'liq bo'lsa — ham muvaffaqiyatli
    if (user.telegramId === tgUser.id) {
      const { getProgress } = require('../services/rankService');
      const rankProgress = getProgress(user.xp || 0);
      return res.json({ success: true, alreadyLinked: true, user: _serializeUser(user, rankProgress) });
    }

    // telegramId va Telegram ma'lumotlarini ulash
    user.telegramId = tgUser.id;
    if (!user.username && tgUser.username) user.username = tgUser.username;
    if (!user.firstName && tgUser.first_name) user.firstName = tgUser.first_name;
    if (!user.lastName && tgUser.last_name) user.lastName = tgUser.last_name;
    if (!user.photoUrl && tgUser.photo_url) user.photoUrl = tgUser.photo_url;
    await user.save();

    // Yangi token — telegramId qo'shilgan holda
    const { accessToken, refreshToken } = generateTokens(user._id, tgUser.id);
    const { getProgress } = require('../services/rankService');
    const rankProgress = getProgress(user.xp || 0);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: _serializeUser(user, rankProgress),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
