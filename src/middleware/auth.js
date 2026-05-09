const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// ─── Telegram initData tekshirish ─────────────────────────────────────────────
// HMAC-SHA256 + 5 soatlik vaqt oynasi (Telegram tavsiyasi: ~24h, biz xavfsizlik
// uchun ancha qisqa olamiz, login sessiyasi JWT'da davom etadi)
const INIT_DATA_MAX_AGE_SEC = 5 * 3600;

function verifyTelegramInitData(initDataString) {
  try {
    if (!process.env.BOT_TOKEN) {
      logger.error('BOT_TOKEN sozlanmagan');
      return null;
    }
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    const checkString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    // Timing-safe taqqoslash
    const a = Buffer.from(computedHash, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const authDate = parseInt(params.get('auth_date'), 10);
    const now = Math.floor(Date.now() / 1000);
    if (!authDate || now - authDate > INIT_DATA_MAX_AGE_SEC) {
      logger.warn(`initData eskirgan: ${now - authDate}s`);
      return null;
    }

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

// ─── Obuna darajasi tekshirish (tokensiz tizim) ──────────────────────────────
// minPlan: 'free' | 'basic' | 'pro' | 'vip'
function requirePlan(minPlan) {
  const planLevel = { free: 0, basic: 1, pro: 2, vip: 3 };
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Auth kerak' });
    const effective = req.user.effectivePlan();
    const userLevel = planLevel[effective] || 0;
    const requiredLevel = planLevel[minPlan] || 0;
    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Bu xizmat uchun obuna kerak',
        code: 'SUBSCRIPTION_REQUIRED',
        required: minPlan,
        current: effective,
      });
    }
    next();
  };
}

// ─── AI kunlik limit tekshirish (atomic increment) ───────────────────────────
// kind: 'hints' | 'chats' | 'docs' | 'images' | 'calories' | 'games'
// Muvaffaqiyatli o'tsa, req.aiKind ga yoziladi (keyinroq incrementAiUsage chaqirish uchun)
function requireAiAccess(kind) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Auth kerak' });

      const limit = req.user.getAiLimit(kind);
      if (limit <= 0) {
        return res.status(403).json({
          error: `Bu xizmat ${planThatUnlocks(kind)} obunasi bilan ochiladi`,
          code: 'SUBSCRIPTION_REQUIRED',
          required: planThatUnlocks(kind),
          current: req.user.effectivePlan(),
        });
      }
      if (limit !== Infinity) {
        const used = req.user.getAiUsage(kind);
        if (used >= limit) {
          return res.status(429).json({
            error: `Kunlik limit tugadi (${used}/${limit})`,
            code: 'DAILY_LIMIT_REACHED',
            kind,
            limit,
            used,
            resetAt: 'tomorrow',
          });
        }
      }

      req.aiKind = kind;
      next();
    } catch (err) {
      next(err);
    }
  };
}

// ─── AI usage atomic increment ──────────────────────────────────────────────
// Endpointning oxirida (muvaffaqiyatli javobdan oldin) chaqiriladi
async function incrementAiUsage(userId, kind) {
  const todayKey = User.todayKey();
  // Sana o'zgargan bo'lsa — barcha hisoblagichlar reset
  const result = await User.findOneAndUpdate(
    { _id: userId },
    [{
      $set: {
        aiUsage: {
          $cond: [
            { $eq: ['$aiUsage.date', todayKey] },
            {
              $mergeObjects: [
                '$aiUsage',
                { [kind]: { $add: [{ $ifNull: [`$aiUsage.${kind}`, 0] }, 1] } },
              ],
            },
            // Yangi kun — reset
            {
              date: todayKey,
              hints: 0, chats: 0, docs: 0, images: 0, calories: 0, games: 0,
              [kind]: 1,
            },
          ],
        },
        totalAiRequests: { $add: [{ $ifNull: ['$totalAiRequests', 0] }, 1] },
      },
    }],
    { new: true }
  );
  return result;
}

// ─── Plan helper ─────────────────────────────────────────────────────────────
// Qaysi plan bu kindni ochadi?
function planThatUnlocks(kind) {
  const map = {
    hints:  'free',
    chats:  'free',
    docs:   'free',
    images: 'basic',
  };
  return map[kind] || 'pro';
}

module.exports = {
  verifyTelegramInitData,
  generateTokens,
  authMiddleware,
  requirePlan,
  requireAiAccess,
  incrementAiUsage,
  planThatUnlocks,
};
