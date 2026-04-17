const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// ─── Telegram initData tekshirish ─────────────────────────────────────────────
function verifyTelegramInitData(initDataString) {
  try {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    // Kalitlarni saralash va string yasash
    const checkString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    // HMAC-SHA256 hisoblash
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    if (computedHash !== hash) return null;

    // Vaqt tekshirish (5 daqiqadan eski bo'lmasin)
    const authDate = parseInt(params.get('auth_date'), 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 300) return null; // 5 daqiqa

    // user ma'lumotlarini parse qilish
    const userStr = params.get('user');
    if (!userStr) return null;
    return JSON.parse(decodeURIComponent(userStr));
  } catch (err) {
    logger.error('initData verification error:', err.message);
    return null;
  }
}

// ─── JWT yaratish ─────────────────────────────────────────────────────────────
function generateTokens(userId, telegramId) {
  const accessToken = jwt.sign(
    { userId, telegramId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  const refreshToken = jwt.sign(
    { userId, telegramId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  return { accessToken, refreshToken };
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token topilmadi' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
    }

    req.user = user;
    req.telegramId = decoded.telegramId;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token muddati tugagan', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Yaroqsiz token' });
  }
}

// ─── Token balance tekshirish ─────────────────────────────────────────────────
function requireTokens(amount) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Auth kerak' });
    if (req.user.tokens < amount) {
      return res.status(402).json({
        error: 'Token yetarli emas',
        code: 'INSUFFICIENT_TOKENS',
        required: amount,
        current: req.user.tokens,
      });
    }
    next();
  };
}

// ─── Obuna tekshirish ─────────────────────────────────────────────────────────
function requirePlan(minPlan) {
  const planLevel = { free: 0, basic: 1, pro: 2 };
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Auth kerak' });
    const userLevel = planLevel[req.user.plan] || 0;
    const requiredLevel = planLevel[minPlan] || 0;
    const isActive = !req.user.planExpiresAt || req.user.planExpiresAt > new Date();
    if (userLevel < requiredLevel || !isActive) {
      return res.status(403).json({
        error: 'Bu xizmat uchun obuna kerak',
        code: 'SUBSCRIPTION_REQUIRED',
        required: minPlan,
      });
    }
    next();
  };
}

module.exports = {
  verifyTelegramInitData,
  generateTokens,
  authMiddleware,
  requireTokens,
  requirePlan,
};
