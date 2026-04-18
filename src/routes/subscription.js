const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User    = require('../models/User');
const { logger } = require('../utils/logger');

const PLANS = {
  basic: {
    id: 'basic', name: 'Basic',
    priceUsd: 5, priceStars: 385, durationDays: 30,
    features: ['500t/oy', 'Kam reklama', 'Barcha AI xizmatlar'],
  },
  pro: {
    id: 'pro', name: 'Pro',
    priceUsd: 12, priceStars: 923, durationDays: 30,
    features: ['Cheksiz chat', '50 rasm/oy', '5 video/oy', 'Musiqa + slider', 'Reklamasiz'],
  },
};

// GET /api/sub/plans
router.get('/plans', (req, res) => res.json(Object.values(PLANS)));

// GET /api/sub/status
router.get('/status', authMiddleware, (req, res) => {
  const u = req.user;
  const now = new Date();
  const isActive = u.planExpiresAt && u.planExpiresAt > now;
  res.json({
    plan: u.plan,
    isActive: isActive || u.plan === 'free',
    expiresAt: u.planExpiresAt,
    daysLeft: isActive ? Math.ceil((u.planExpiresAt - now) / 86400000) : 0,
  });
});

// POST /api/sub/create-invoice — Stars to'lov uchun invoice link yaratish
router.post('/create-invoice', authMiddleware, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Yaroqsiz obuna rejasi' });

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) return res.status(500).json({ error: 'Bot sozlanmagan' });

    // Payload — to'lov tugagach successful_payment da qaytadi
    const payload = JSON.stringify({
      userId: String(req.user._id),
      telegramId: req.user.telegramId,
      planId,
      ts: Date.now(),
    });

    const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;
    const response = await axios.post(url, {
      title: `FIKRA ${plan.name}`,
      description: plan.features.join(' · '),
      payload,
      provider_token: '',            // Stars uchun bo'sh
      currency: 'XTR',               // Telegram Stars
      prices: [{ label: plan.name + ' 30 kun', amount: plan.priceStars }],
    }, { timeout: 10000 });

    if (!response.data?.ok) {
      logger.error('createInvoiceLink error:', response.data);
      return res.status(500).json({ error: 'Invoice yaratilmadi' });
    }

    res.json({
      success: true,
      invoiceUrl: response.data.result,
      plan: { id: plan.id, name: plan.name, priceStars: plan.priceStars, durationDays: plan.durationDays },
    });
  } catch (err) {
    logger.error('create-invoice error:', err?.response?.data || err.message);
    next(err);
  }
});

// POST /api/sub/activate — bot successful_payment dan chaqiradi
// Yoki webhook orqali ham kelishi mumkin
router.post('/activate', async (req, res) => {
  try {
    const { telegramId, planId, starsAmount, chargeId, secret } = req.body;

    // Faqat bot chaqirishi mumkin — maxfiy kalit bilan
    if (secret !== process.env.STARS_WEBHOOK_SECRET) {
      logger.warn('activate: invalid secret');
      return res.sendStatus(403);
    }

    const plan = PLANS[planId];
    if (!plan) return res.sendStatus(400);

    if (starsAmount < plan.priceStars * 0.95) {
      logger.warn(`insufficient stars ${starsAmount} for ${planId}`);
      return res.sendStatus(400);
    }

    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) return res.sendStatus(404);

    const now = new Date();
    const startDate = user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
    const newExpiry = new Date(startDate.getTime() + plan.durationDays * 86400000);

    await User.findByIdAndUpdate(user._id, {
      plan: planId,
      planExpiresAt: newExpiry,
    });

    logger.info(`Plan activated: user=${telegramId} plan=${planId} charge=${chargeId}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('activate error:', err);
    res.sendStatus(500);
  }
});

// POST /api/sub/cancel
router.post('/cancel', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.plan === 'free') return res.status(400).json({ error: 'Aktiv obuna yo\'q' });
    res.json({ success: true, message: 'Obuna muddati tugagach bekor bo\'ladi' });
  } catch (err) { next(err); }
});

module.exports = router;
