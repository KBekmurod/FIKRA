const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User    = require('../models/User');
const { logger } = require('../utils/logger');
const { earnTokens } = require('../services/tokenService');
const { addXp } = require('../services/rankService');

// ─── OBUNA REJALARI ───────────────────────────────────────────────────────────
// 1 USD ≈ 77 Stars, 1 USD ≈ 12,800 so'm
const PLANS = {
  basic_1m: {
    id: 'basic_1m', name: 'Basic', tier: 'basic',
    durationDays: 30, priceUzs: 19000, priceStars: 150,
    monthlyTokens: 500, adsDiscount: 0.5, // 50% kam
    features: ['500 token/oy', 'Reklamalar 50% kam', 'Barcha AI xizmatlar', '1 oy'],
  },
  pro_1m: {
    id: 'pro_1m', name: 'Pro', tier: 'pro',
    durationDays: 30, priceUzs: 49000, priceStars: 385,
    monthlyTokens: 2000, adsDiscount: 1.0, // reklamasiz
    features: ['Cheksiz AI chat', '30 rasm/oy', '3 video/oy', 'Reklamasiz', '1 oy'],
  },
  basic_3m: {
    id: 'basic_3m', name: 'Basic', tier: 'basic',
    durationDays: 90, priceUzs: 49000, priceStars: 385,
    monthlyTokens: 500, adsDiscount: 0.5,
    badge: '20% chegirma',
    features: ['500 token/oy', 'Reklamalar 50% kam', 'Barcha AI xizmatlar', '3 oy · 20% chegirma'],
  },
  pro_3m: {
    id: 'pro_3m', name: 'Pro', tier: 'pro',
    durationDays: 90, priceUzs: 129000, priceStars: 1010,
    monthlyTokens: 2000, adsDiscount: 1.0,
    badge: '12% chegirma',
    features: ['Cheksiz AI chat', '30 rasm/oy', '3 video/oy', 'Reklamasiz', '3 oy · 12% chegirma'],
  },
  vip_3m: {
    id: 'vip_3m', name: 'VIP', tier: 'vip',
    durationDays: 90, priceUzs: 299000, priceStars: 2350,
    monthlyTokens: 5000, adsDiscount: 1.0,
    badge: 'Eng mashhur',
    features: ['Cheksiz AI + cheksiz video', 'Musiqa Premium', 'XP × 2 boost', '5000t/oy', '3 oy'],
  },
  business_3m: {
    id: 'business_3m', name: 'Business', tier: 'business',
    durationDays: 90, priceUzs: 811000, priceStars: 6370,
    monthlyTokens: 15000, adsDiscount: 1.0,
    features: ['Hamma VIP imkoniyatlari', 'Brend promocode', 'Alohida yordam', '15000t/oy', '3 oy'],
  },
};

// ─── TOKEN PAKETLAR ───────────────────────────────────────────────────────────
const TOKEN_PACKS = {
  pack_50:   { id: 'pack_50',   tokens: 50,   priceUzs: 1900,  priceStars: 15,  bonus: 0 },
  pack_200:  { id: 'pack_200',  tokens: 200,  priceUzs: 5900,  priceStars: 46,  bonus: 0 },
  pack_500:  { id: 'pack_500',  tokens: 500,  priceUzs: 12900, priceStars: 100, bonus: 0, badge: 'Mashhur' },
  pack_1500: { id: 'pack_1500', tokens: 1500, priceUzs: 29000, priceStars: 227, bonus: 400, badge: '+27% bonus' },
};

// ─── Endpointlar ──────────────────────────────────────────────────────────────

// GET /api/sub/plans
router.get('/plans', (req, res) => res.json(Object.values(PLANS)));

// GET /api/sub/packs
router.get('/packs', (req, res) => res.json(Object.values(TOKEN_PACKS)));

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
    tier: u.planTier || 'free',
  });
});

// POST /api/sub/create-invoice — plan yoki token pack uchun invoice
router.post('/create-invoice', authMiddleware, async (req, res, next) => {
  try {
    const { planId, packId } = req.body;

    let item, type;
    if (planId) {
      item = PLANS[planId];
      type = 'plan';
    } else if (packId) {
      item = TOKEN_PACKS[packId];
      type = 'pack';
    } else {
      return res.status(400).json({ error: 'planId yoki packId kerak' });
    }

    if (!item) return res.status(400).json({ error: 'Yaroqsiz tariff/paket' });

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) return res.status(500).json({ error: 'Bot sozlanmagan' });

    const payload = JSON.stringify({
      userId: String(req.user._id),
      telegramId: req.user.telegramId,
      type,
      id: item.id,
      ts: Date.now(),
    });

    let title, description;
    if (type === 'plan') {
      title = `FIKRA ${item.name} — ${item.durationDays} kun`;
      description = item.features.slice(0, 2).join(' · ');
    } else {
      title = `${item.tokens + (item.bonus || 0)} token`;
      description = 'Token paketi' + (item.bonus > 0 ? ` (+${item.bonus} bonus)` : '');
    }

    const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;
    const response = await axios.post(url, {
      title, description,
      payload,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: title, amount: item.priceStars }],
    }, { timeout: 10000 });

    if (!response.data?.ok) {
      logger.error('createInvoiceLink error:', response.data);
      return res.status(500).json({ error: 'Invoice yaratilmadi' });
    }

    res.json({
      success: true,
      invoiceUrl: response.data.result,
      item: {
        id: item.id,
        name: item.name || ('' + (item.tokens + (item.bonus || 0)) + ' token'),
        priceStars: item.priceStars,
        priceUzs: item.priceUzs,
      },
    });
  } catch (err) {
    logger.error('create-invoice error:', err?.response?.data || err.message);
    next(err);
  }
});

// POST /api/sub/activate — bot successful_payment dan chaqiradi
// Ikki xil turdagi to'lov: plan yoki pack
router.post('/activate', async (req, res) => {
  try {
    const { telegramId, type, id, starsAmount, chargeId, secret } = req.body;

    if (secret !== process.env.STARS_WEBHOOK_SECRET) {
      logger.warn('activate: invalid secret');
      return res.sendStatus(403);
    }

    let item;
    if (type === 'plan') item = PLANS[id];
    else if (type === 'pack') item = TOKEN_PACKS[id];
    else return res.sendStatus(400);

    if (!item) return res.sendStatus(400);

    // Stars miqdori min 95% mos kelishi
    if (starsAmount < item.priceStars * 0.95) {
      logger.warn(`insufficient stars ${starsAmount} for ${id}`);
      return res.sendStatus(400);
    }

    const user = await User.findOne({ telegramId: parseInt(telegramId) });
    if (!user) return res.sendStatus(404);

    if (type === 'plan') {
      // Obuna faollashtirish / uzaytirish
      const now = new Date();
      const startDate = user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
      const newExpiry = new Date(startDate.getTime() + item.durationDays * 86400000);

      await User.findByIdAndUpdate(user._id, {
        plan: item.tier, // 'basic'|'pro'|'vip'|'business'
        planTier: item.tier,
        planId: item.id,
        planExpiresAt: newExpiry,
        $inc: { tokens: item.monthlyTokens || 0 },
      });

      // XP bonus
      addXp(user._id, user.telegramId, 100, 'subscription', { planId: item.id }).catch(() => {});

      logger.info(`Plan activated: user=${telegramId} plan=${id} until=${newExpiry.toISOString()}`);
    } else {
      // Token paket — tokenlarni qo'shish
      const totalTokens = item.tokens + (item.bonus || 0);
      await earnTokens(
        user._id, user.telegramId, totalTokens,
        'token_purchase', 'bonus', { packId: id, chargeId }
      );

      logger.info(`Tokens purchased: user=${telegramId} pack=${id} tokens=${totalTokens}`);
    }

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
    res.json({
      success: true,
      message: 'Obuna muddati tugagach bekor bo\'ladi.',
      expiresAt: req.user.planExpiresAt,
    });
  } catch (err) { next(err); }
});

module.exports = router;
