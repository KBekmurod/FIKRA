const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');

// ─── JWT yaratish ─────────────────────────────────────────────────────────────
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  const refreshToken = jwt.sign(
    { userId },
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
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token muddati tugagan', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Yaroqsiz token' });
  }
}

// ─── Obuna darajasi tekshirish ──────────────────────────────────────────────
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

// ─── AI kunlik limit tekshirish ──────────────────────────────────────────────
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
async function incrementAiUsage(userId, kind) {
  const todayKey = User.todayKey();
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
            {
              date: todayKey,
              hints: 0, chats: 0, docs: 0, images: 0, calories: 0,
              ocrUploads: 0, fileUploads: 0, testsGen: 0,
              [kind]: 1,
            },
          ],
        },
        lifetimeAiUsage: {
          $mergeObjects: [
            '$lifetimeAiUsage',
            { [kind]: { $add: [{ $ifNull: [`$lifetimeAiUsage.${kind}`, 0] }, 1] } },
          ],
        }
      },
    }],
    { new: true }
  );
  return result;
}

// ─── Plan helper ─────────────────────────────────────────────────────────────
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
  generateTokens,
  authMiddleware,
  requirePlan,
  requireAiAccess,
  incrementAiUsage,
  planThatUnlocks,
};
