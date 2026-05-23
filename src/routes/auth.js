// ─── Auth Routes ────────────────────────────────────────────────────────
// Email yoki telefon nomer + parol orqali autentifikatsiya.
//
// Yo'llar:
//   POST /api/auth/register         — yangi ro'yxat (email yoki phone + parol + ism)
//   POST /api/auth/login            — kirish (email yoki phone + parol)
//   POST /api/auth/refresh          — refresh token bilan access yangilash
//   GET  /api/auth/me               — joriy foydalanuvchi
//   POST /api/auth/change-password  — parol o'zgartirish
//   POST /api/auth/add-identifier   — mavjud akkountga email yoki phone qo'shish

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const {
  generateTokens,
  authMiddleware,
} = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const User    = require('../models/User');
const { logger } = require('../utils/logger');

// ─── Helpers: identifier (email yoki phone) aniqlash va normalize ──────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// E.164 telefon formati: + bilan boshlanadi va 8-15 raqamdan iborat
// Foydalanuvchi kiritishi mumkin: "+998 90 123 45 67", "+998901234567",
// "998901234567", "901234567" (avtomatik +998 qo'shamiz O'zbek bo'lsa).
function normalizePhone(raw) {
  if (!raw) return null;
  // Faqat raqamlar va + ni qoldiramiz
  let s = String(raw).replace(/[^\d+]/g, '');
  if (!s) return null;

  // + bilan boshlanmasa va 998 bilan boshlansa — + qo'shamiz
  if (!s.startsWith('+')) {
    if (s.startsWith('998')) s = '+' + s;
    // 9 ta raqam bo'lsa (oddiy O'zbek mobil nomer) — +998 qo'shamiz
    else if (s.length === 9) s = '+998' + s;
    else s = '+' + s;
  }

  // Validatsiya: Faqat O'zbekiston raqamlari (+998 va 9 ta raqam, to'g'ri operator kodlari)
  const uzbRegex = /^\+998(33|50|55|77|88|90|91|93|94|95|97|98|99)\d{7}$/;
  if (!uzbRegex.test(s)) return null;
  return s;
}

function isEmail(s) {
  return EMAIL_RE.test(String(s || '').trim());
}

// Bitta input qatorini email yoki phone'ga ajratamiz
function parseIdentifier(raw) {
  const s = String(raw || '').trim();
  if (!s) return { type: null, value: null };
  if (s.includes('@')) {
    return isEmail(s) ? { type: 'email', value: s.toLowerCase() } : { type: 'email', value: null };
  }
  const phone = normalizePhone(s);
  return { type: 'phone', value: phone };
}

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
    phone:         user.phone,
    firstName:     user.firstName,
    lastName:      user.lastName,
    displayName:   user.displayName || user.firstName,
    photoUrl:      user.photoUrl,
    hasEmail:      !!user.email,
    hasPhone:      !!user.phone,
    plan:          user.plan,
    effectivePlan: effective,
    planExpiresAt: user.planExpiresAt,
    isSubscribed:  user.isSubscribed,
    aiUsage,
    aiLimits:      cleanLimits,
  };
}

// ─── POST /api/auth/register ──────────────────────────────────────────────
// Body: { identifier: "email@... | +998...", password, name }
// YOKI: { email, phone, password, name }
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { identifier, email: rawEmail, phone: rawPhone, password, name } = req.body || {};

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Parol kamida 8 belgi bo\'lsin' });
    }
    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Ism kerak (kamida 2 belgi)' });
    }

    // Identifier'ni yig'amiz: identifier kiritilgan bo'lsa o'sha, aks holda email/phone
    let email = null;
    let phone = null;

    if (identifier) {
      const parsed = parseIdentifier(identifier);
      if (parsed.type === 'email' && parsed.value) email = parsed.value;
      else if (parsed.type === 'phone' && parsed.value) phone = parsed.value;
      else {
        return res.status(400).json({ error: 'Email yoki telefon nomer yaroqsiz' });
      }
    } else {
      if (rawEmail) {
        if (!isEmail(rawEmail)) return res.status(400).json({ error: 'Email yaroqsiz' });
        email = String(rawEmail).toLowerCase().trim();
      }
      if (rawPhone) {
        const norm = normalizePhone(rawPhone);
        if (!norm) return res.status(400).json({ error: 'Telefon nomer yaroqsiz' });
        phone = norm;
      }
    }

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email yoki telefon nomer kerak' });
    }

    // Mavjudligini tekshirish
    const orChecks = [];
    if (email) orChecks.push({ email });
    if (phone) orChecks.push({ phone });
    if (orChecks.length > 0) {
      const existing = await User.findOne({ $or: orChecks });
      if (existing) {
        if (email && existing.email === email) {
          return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
        }
        if (phone && existing.phone === phone) {
          return res.status(409).json({ error: 'Bu telefon nomer allaqachon ro\'yxatdan o\'tgan' });
        }
        return res.status(409).json({ error: 'Bunday foydalanuvchi allaqachon mavjud' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const cleanName = String(name).trim();

    const userData = {
      passwordHash,
      displayName: cleanName,
      firstName:   cleanName,
    };
    if (email) userData.email = email;
    if (phone) userData.phone = phone;

    const user = await User.create(userData);

    const tokens = generateTokens(user._id);
    logger.info(`User registered: ${email || phone}`);

    res.json({
      ...tokens,
      user: { ..._serializeUser(user), isNew: true },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ error: messages });
    }
    if (err.code === 11000) {
      let msg = 'Bu ma\'lumot allaqachon mavjud';
      if (err.keyPattern) {
        if (err.keyPattern.email) msg = 'Bu email allaqachon ro\'yxatdan o\'tgan';
        else if (err.keyPattern.phone) msg = 'Bu telefon nomer allaqachon ro\'yxatdan o\'tgan';
      }
      return res.status(409).json({ error: msg });
    }
    next(err);
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
// Body: { identifier, password }
// YOKI eski: { email, password }
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { identifier, email: rawEmail, phone: rawPhone, password } = req.body || {};

    if (!password) {
      return res.status(400).json({ error: 'Parol kerak' });
    }

    // Identifier'ni aniqlash
    let lookup = null;
    if (identifier) {
      const parsed = parseIdentifier(identifier);
      if (parsed.type === 'email' && parsed.value) lookup = { email: parsed.value };
      else if (parsed.type === 'phone' && parsed.value) lookup = { phone: parsed.value };
      else {
        return res.status(400).json({ error: 'Email yoki telefon nomer yaroqsiz' });
      }
    } else if (rawEmail) {
      if (!isEmail(rawEmail)) return res.status(400).json({ error: 'Email yaroqsiz' });
      lookup = { email: String(rawEmail).toLowerCase().trim() };
    } else if (rawPhone) {
      const norm = normalizePhone(rawPhone);
      if (!norm) return res.status(400).json({ error: 'Telefon nomer yaroqsiz' });
      lookup = { phone: norm };
    } else {
      return res.status(400).json({ error: 'Email yoki telefon nomer kerak' });
    }

    const user = await User.findOne(lookup);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const tokens = generateTokens(user._id);
    logger.info(`User logged in: ${user.email || user.phone}`);

    res.json({
      ...tokens,
      user: _serializeUser(user),
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

// ─── POST /api/auth/change-password ───────────────────────────────────────
router.post('/change-password', authMiddleware, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Yangi parol kamida 8 belgi' });
    }
    if (!oldPassword) return res.status(400).json({ error: 'Eski parol kerak' });

    const ok = await bcrypt.compare(oldPassword, req.user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Eski parol noto\'g\'ri' });

    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/auth/add-identifier ────────────────────────────────────────
// Mavjud akkountga email yoki telefon qo'shish (faqat birini yo'qsa)
// Body: { email } yoki { phone }
router.post('/add-identifier', authMiddleware, async (req, res, next) => {
  try {
    const { email: rawEmail, phone: rawPhone } = req.body || {};

    if (rawEmail) {
      if (req.user.email) {
        return res.status(400).json({ error: 'Sizda allaqachon email mavjud' });
      }
      if (!isEmail(rawEmail)) return res.status(400).json({ error: 'Email yaroqsiz' });
      const email = String(rawEmail).toLowerCase().trim();
      const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ error: 'Bu email band' });
      req.user.email = email;
      await req.user.save();
      return res.json({ success: true, user: _serializeUser(req.user) });
    }

    if (rawPhone) {
      if (req.user.phone) {
        return res.status(400).json({ error: 'Sizda allaqachon telefon nomer mavjud' });
      }
      const phone = normalizePhone(rawPhone);
      if (!phone) return res.status(400).json({ error: 'Telefon nomer yaroqsiz' });
      const existing = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (existing) return res.status(409).json({ error: 'Bu telefon nomer band' });
      req.user.phone = phone;
      await req.user.save();
      return res.json({ success: true, user: _serializeUser(req.user) });
    }

    return res.status(400).json({ error: 'email yoki phone kerak' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Bu email yoki telefon band' });
    }
    next(err);
  }
});

module.exports = router;
