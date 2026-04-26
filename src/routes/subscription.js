const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { addXp } = require('../services/rankService');
const User    = require('../models/User');
const { logger } = require('../utils/logger');

const PLANS = {
  basic_1m: {
    id: 'basic_1m', name: 'Basic', tier: 'basic',
    period: '1 oy', durationDays: 30, priceStars: 149, badge: null,
    features: ['AI test tushuntirish — cheksiz', 'AI Chat — 50/kun', 'Stroop — cheksiz', '1 oy'],
  },
  basic_3m: {
    id: 'basic_3m', name: 'Basic', tier: 'basic',
    period: '3 oy', durationDays: 90, priceStars: 399, badge: '11% chegirma',
    features: ['AI test tushuntirish — cheksiz', 'AI Chat — 50/kun', 'Stroop — cheksiz', '3 oy · 11% tejaysiz'],
  },
  pro_1m: {
    id: 'pro_1m', name: 'Pro', tier: 'pro',
    period: '1 oy', durationDays: 30, priceStars: 299, badge: 'Mashhur',
    features: ['AI Chat cheksiz', 'AI test cheksiz', 'Hujjat 10/kun', 'Rasm 20/kun', 'Barcha oyinlar cheksiz', '1 oy'],
  },
  pro_3m: {
    id: 'pro_3m', name: 'Pro', tier: 'pro',
    period: '3 oy', durationDays: 90, priceStars: 799, badge: '11% chegirma',
    features: ['AI Chat cheksiz', 'AI test cheksiz', 'Hujjat 10/kun', 'Rasm 20/kun', 'Barcha oyinlar cheksiz', '3 oy'],
  },
  vip_1m: {
    id: 'vip_1m', name: 'VIP', tier: 'vip',
    period: '1 oy', durationDays: 30, priceStars: 499, badge: 'Eng toliq',
    features: ['Hammasi cheksiz', 'Kaloriya AI', 'XP x1.5 boost', '1 oy'],
  },
  vip_3m: {
    id: 'vip_3m', name: 'VIP', tier: 'vip',
    period: '3 oy', durationDays: 90, priceStars: 1299, badge: '13% chegirma',
    features: ['Hammasi cheksiz', 'Kaloriya AI', 'XP x1.5 boost', '3 oy · 13% tejaysiz'],
  },
};

router.get('/plans', (req, res) => res.json(Object.values(PLANS)));

router.get('/status', authMiddleware, (req, res) => {
  const u = req.user;
  const now = new Date();
  const isActive = u.plan !== 'free' && u.planExpiresAt && u.planExpiresAt > now;
  res.json({
    plan: u.plan,
    effectivePlan: u.effectivePlan(),
    isActive,
    expiresAt: u.planExpiresAt,
    daysLeft: isActive ? Math.ceil((u.planExpiresAt - now) / 86400000) : 0,
    planId: u.planId,
  });
});

router.post('/create-invoice', authMiddleware, async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'planId kerak' });
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Yaroqsiz tariff' });

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) return res.status(500).json({ error: 'Bot sozlanmagan' });

    const payload = JSON.stringify({
      userId: String(req.user._id),
      telegramId: req.user.telegramId,
      type: 'plan',
      id: plan.id,
      ts: Date.now(),
    });

    const title = `FIKRA ${plan.name} — ${plan.period}`;
    const description = plan.features.slice(0, 3).join(' · ');

    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      { title, description, payload, provider_token: '', currency: 'XTR',
        prices: [{ label: title, amount: plan.priceStars }] },
      { timeout: 10000 }
    );

    if (!response.data?.ok) {
      logger.error('createInvoiceLink error:', response.data);
      return res.status(500).json({ error: 'Invoice yaratilmadi' });
    }

    res.json({
      success: true,
      invoiceUrl: response.data.result,
      plan: { id: plan.id, name: plan.name, tier: plan.tier, period: plan.period, priceStars: plan.priceStars },
    });
  } catch (err) {
    logger.error('create-invoice error:', err?.response?.data || err.message);
    next(err);
  }
});

// Bot tomonidan successful_payment kelganda chaqiriladi
router.post('/activate', async (req, res) => {
  try {
    const { telegramId, type, id, starsAmount, chargeId, secret } = req.body;

    if (!secret || secret !== process.env.STARS_WEBHOOK_SECRET) {
      logger.warn(`activate: notogri secret from ${telegramId}`);
      return res.sendStatus(403);
    }
    if (type !== 'plan') return res.sendStatus(400);

    const plan = PLANS[id];
    if (!plan) { logger.warn(`activate: noma'lum planId=${id}`); return res.sendStatus(400); }

    // Stars miqdori tekshiruvi (95% tolerance)
    if (!starsAmount || starsAmount < plan.priceStars * 0.95) {
      logger.warn(`activate: kam stars ${starsAmount} (kerak: ${plan.priceStars})`);
      return res.sendStatus(400);
    }

    const user = await User.findOne({ telegramId: parseInt(telegramId, 10) });
    if (!user) return res.sendStatus(404);

    // Idempotency: chargeId allaqachon qayta ishlanganmi?
    if (chargeId && user.planChargeIds?.includes(chargeId)) {
      logger.warn(`activate: duplicate chargeId=${chargeId}`);
      return res.json({ success: true, duplicate: true });
    }

    const now = new Date();
    const startDate = (user.planExpiresAt && user.planExpiresAt > now)
      ? user.planExpiresAt : now;
    const newExpiry = new Date(startDate.getTime() + plan.durationDays * 86400000);

    const updateOps = {
      $set: { plan: plan.tier, planId: plan.id, planExpiresAt: newExpiry, planLastPurchaseAt: now },
    };
    if (chargeId) updateOps.$push = { planChargeIds: chargeId };

    await User.findByIdAndUpdate(user._id, updateOps);

    addXp(user._id, user.telegramId, 100, 'subscription', { planId: plan.id }).catch(() => {});

    logger.info(`Plan activated: user=${telegramId} plan=${id} tier=${plan.tier} until=${newExpiry.toISOString()} chargeId=${chargeId || 'n/a'}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('activate error:', err.message);
    res.sendStatus(500);
  }
});

router.get('/cancel-info', authMiddleware, (req, res) => {
  const u = req.user;
  if (u.plan === 'free' || !u.planExpiresAt) return res.json({ hasSubscription: false });
  const now = new Date();
  const isActive = u.planExpiresAt > now;
  res.json({
    hasSubscription: true, isActive, plan: u.plan, planId: u.planId,
    expiresAt: u.planExpiresAt,
    daysLeft: isActive ? Math.ceil((u.planExpiresAt - now) / 86400000) : 0,
    note: "Telegram Stars to'lovlari qaytarilmaydi. Obuna muddat tugagach avtomatik bekor bo'ladi.",
  });
});

module.exports = router;
