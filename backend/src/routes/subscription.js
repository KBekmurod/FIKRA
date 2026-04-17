const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const { logger } = require('../utils/logger');

const PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    priceUsd: 5,
    priceStars: 385, // ~$5 / $0.013 per star
    durationDays: 30,
    features: ['500t/oy', 'Kam reklama', 'Barcha AI xizmatlar'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceUsd: 12,
    priceStars: 923, // ~$12 / $0.013
    durationDays: 30,
    features: ['Cheksiz chat', '50 rasm/oy', '5 video/oy', 'Musiqa + slider', 'Reklama yo\'q'],
  },
};

// GET /api/sub/plans
router.get('/plans', (req, res) => {
  res.json(Object.values(PLANS));
});

// GET /api/sub/status
router.get('/status', authMiddleware, (req, res) => {
  const user = req.user;
  const now = new Date();
  const isActive = user.planExpiresAt && user.planExpiresAt > now;
  res.json({
    plan: user.plan,
    isActive: isActive || user.plan === 'free',
    expiresAt: user.planExpiresAt,
    daysLeft: isActive
      ? Math.ceil((user.planExpiresAt - now) / (1000 * 60 * 60 * 24))
      : 0,
  });
});

// POST /api/sub/webhook  — Telegram Stars to'lov webhook
router.post('/webhook', async (req, res) => {
  try {
    const crypto = require('crypto');
    const secret = process.env.STARS_WEBHOOK_SECRET;

    // Webhook imzosini tekshirish
    if (secret) {
      const sig = req.headers['x-telegram-signature'] || '';
      const body = JSON.stringify(req.body);
      const expected = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      if (sig !== expected) {
        logger.warn('Stars webhook: invalid signature');
        return res.sendStatus(403);
      }
    }

    const { telegramId, planId, starsAmount, transactionId } = req.body;
    const plan = PLANS[planId];

    if (!plan) {
      logger.warn(`Stars webhook: unknown plan ${planId}`);
      return res.sendStatus(400);
    }

    // Stars miqdorini tekshirish
    if (starsAmount < plan.priceStars * 0.95) {
      logger.warn(`Stars webhook: insufficient stars ${starsAmount} for plan ${planId}`);
      return res.sendStatus(400);
    }

    // Foydalanuvchini yangilash
    const now = new Date();
    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) return res.sendStatus(404);

    // Agar obuna mavjud bo'lsa uzaytirish, yo'q bo'lsa yangi boshlash
    const startDate = user.planExpiresAt && user.planExpiresAt > now
      ? user.planExpiresAt
      : now;
    const newExpiry = new Date(startDate.getTime() + plan.durationDays * 24 * 3600 * 1000);

    await User.findByIdAndUpdate(user._id, {
      plan: planId,
      planExpiresAt: newExpiry,
    });

    logger.info(`Subscription activated: user=${telegramId} plan=${planId} txId=${transactionId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('Stars webhook error:', err);
    res.sendStatus(500);
  }
});

// POST /api/sub/cancel  — obunani bekor qilish (keyingi davr uchun)
router.post('/cancel', authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;
    if (user.plan === 'free') {
      return res.status(400).json({ error: 'Aktiv obuna yo\'q' });
    }
    // Plan muddati tugaguncha ishlaydi, lekin yangilanmaydi
    res.json({ success: true, message: 'Obuna muddati tugagach avtomatik bekor bo\'ladi.' });
  } catch (err) { next(err); }
});

module.exports = router;
