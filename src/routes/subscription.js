const express = require('express');
const axios   = require('axios');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User         = require('../models/User');
const PendingOrder = require('../models/PendingOrder');
const { logger }   = require('../utils/logger');

// ─── NARXLAR (UZS va Stars) ──────────────────────────────────────────────────
const PLANS = {
  basic_1m: { id:'basic_1m', name:'Basic', tier:'basic', period:'1 oy', durationDays:30,
    priceStars:149, priceUZS:19900, badge:null,
    features:['AI Chat — 50/kun','AI Hujjat — 10/kun','AI test hint — cheksiz','O\'yinlar cheksiz'] },
  basic_3m: { id:'basic_3m', name:'Basic', tier:'basic', period:'3 oy', durationDays:90,
    priceStars:399, priceUZS:49900, badge:'11% chegirma',
    features:['AI Chat — 50/kun','AI Hujjat — 10/kun','AI test hint — cheksiz','3 oy · arzonroq'] },
  pro_1m: { id:'pro_1m', name:'Pro', tier:'pro', period:'1 oy', durationDays:30,
    priceStars:299, priceUZS:39900, badge:'Mashhur',
    features:['AI Chat — cheksiz','AI Hujjat — 30/kun','AI Rasm — 20/kun','Barcha o\'yinlar'] },
  pro_3m: { id:'pro_3m', name:'Pro', tier:'pro', period:'3 oy', durationDays:90,
    priceStars:799, priceUZS:99900, badge:'11% chegirma',
    features:['AI Chat — cheksiz','AI Hujjat — 30/kun','AI Rasm — 20/kun','3 oy muddatli'] },
  vip_1m: { id:'vip_1m', name:'VIP', tier:'vip', period:'1 oy', durationDays:30,
    priceStars:499, priceUZS:69900, badge:'Eng to\'liq',
    features:['Hammasi cheksiz','Kaloriya AI','XP x1.5','Boshqalarga sovg\'a qilish'] },
  vip_3m: { id:'vip_3m', name:'VIP', tier:'vip', period:'3 oy', durationDays:90,
    priceStars:1299, priceUZS:179900, badge:'13% chegirma',
    features:['Hammasi cheksiz','Kaloriya AI','XP x1.5','3 oy · 13% tejaysiz'] },
};

// Unikal order ID generator
function genOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'FK-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// Admin Telegram ID (muhim)
function getAdminIds() {
  const raw = process.env.ADMIN_TELEGRAM_IDS || '';
  return raw.split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
}

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

// ─── STARS invoice yaratish ──────────────────────────────────────────────────
router.post('/create-invoice', authMiddleware, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Yaroqsiz tariff' });

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) return res.status(500).json({ error: 'Bot sozlanmagan' });

    const payload = JSON.stringify({
      userId: String(req.user._id),
      telegramId: req.user.telegramId,
      type: 'plan', id: plan.id, ts: Date.now(),
    });

    const response = await axios.post(
      `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
      { title: `FIKRA ${plan.name} — ${plan.period}`,
        description: plan.features.slice(0,3).join(' · '),
        payload, provider_token: '', currency: 'XTR',
        prices: [{ label: `FIKRA ${plan.name}`, amount: plan.priceStars }] },
      { timeout: 10000 }
    );

    if (!response.data?.ok) return res.status(500).json({ error: 'Invoice yaratilmadi' });
    res.json({ success: true, invoiceUrl: response.data.result,
      plan: { id: plan.id, name: plan.name, tier: plan.tier, period: plan.period, priceStars: plan.priceStars } });
  } catch (err) {
    logger.error('create-invoice:', err?.response?.data || err.message);
    next(err);
  }
});

// ─── P2P buyurtma yaratish ───────────────────────────────────────────────────
router.post('/create-p2p-order', authMiddleware, async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Yaroqsiz tariff' });

    const user = req.user;

    // Eski pending buyurtma bormi?
    const existing = await PendingOrder.findOne({
      telegramId: user.telegramId,
      status: 'pending',
      paymentType: 'p2p',
    });
    if (existing) {
      return res.json({
        success: true,
        order: {
          orderId: existing.orderId,
          planId: existing.planId,
          planName: existing.planName,
          priceUZS: existing.priceUZS,
          status: existing.status,
        },
        isExisting: true,
      });
    }

    // Yangi buyurtma
    let orderId;
    let attempts = 0;
    do {
      orderId = genOrderId();
      attempts++;
    } while (attempts < 10 && await PendingOrder.exists({ orderId }));

    const order = await PendingOrder.create({
      telegramId: user.telegramId,
      userId: user._id,
      username: user.username || '',
      firstName: user.firstName || '',
      orderId,
      planId: plan.id,
      planName: `${plan.name} ${plan.period}`,
      priceUZS: plan.priceUZS,
      priceStars: plan.priceStars,
      paymentType: 'p2p',
    });

    // Admin'ga xabar yuborish
    const adminIds = getAdminIds();
    const botToken = process.env.BOT_TOKEN;
    if (botToken && adminIds.length) {
      const msg = `🆕 Yangi P2P buyurtma!\n\n` +
        `👤 ${user.firstName} (@${user.username || 'n/a'}) [${user.telegramId}]\n` +
        `📦 ${plan.name} ${plan.period}\n` +
        `💰 ${plan.priceUZS.toLocaleString()} UZS\n` +
        `🔑 Buyurtma ID: <code>${orderId}</code>\n\n` +
        `Admin panelda tasdiqlang: /admin`;
      for (const adminId of adminIds) {
        axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`,
          { chat_id: adminId, text: msg, parse_mode: 'HTML' }
        ).catch(() => {});
      }
    }

    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        planId: order.planId,
        planName: order.planName,
        priceUZS: order.priceUZS,
        status: 'pending',
      },
    });
  } catch (err) {
    logger.error('create-p2p-order:', err.message);
    next(err);
  }
});

// ─── Stars webhook ───────────────────────────────────────────────────────────
router.post('/activate', async (req, res) => {
  try {
    const { telegramId, type, id, starsAmount, chargeId, secret } = req.body;
    if (!secret || secret !== process.env.STARS_WEBHOOK_SECRET) return res.sendStatus(403);
    if (type !== 'plan') return res.sendStatus(400);

    const plan = PLANS[id];
    if (!plan || !starsAmount || starsAmount < plan.priceStars * 0.95) return res.sendStatus(400);

    const user = await User.findOne({ telegramId: parseInt(telegramId, 10) });
    if (!user) return res.sendStatus(404);

    if (chargeId && user.planChargeIds?.includes(chargeId)) {
      return res.json({ success: true, duplicate: true });
    }

    await _activatePlan(user, plan, chargeId);
    logger.info(`Stars plan activated: ${telegramId} → ${id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('activate error:', err.message);
    res.sendStatus(500);
  }
});

// ─── P2P tasdiqlash (admin) ──────────────────────────────────────────────────
router.post('/admin/confirm-p2p', async (req, res) => {
  try {
    const { orderId, adminSecret, note } = req.body;
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) return res.sendStatus(403);

    const order = await PendingOrder.findOne({ orderId });
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    if (order.status !== 'pending') return res.status(400).json({ error: `Status: ${order.status}` });

    const plan = PLANS[order.planId];
    if (!plan) return res.status(400).json({ error: 'Plan topilmadi' });

    const user = await User.findOne({ telegramId: order.telegramId });
    if (!user) return res.status(404).json({ error: 'User topilmadi' });

    await _activatePlan(user, plan, null);

    order.status = 'confirmed';
    order.confirmedAt = new Date();
    order.note = note || '';
    await order.save();

    // Foydalanuvchiga xabar
    const botToken = process.env.BOT_TOKEN;
    if (botToken) {
      axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: order.telegramId,
        text: `✅ *${plan.name} ${plan.period}* obunangiz faollashtirildi!\n\nID: <code>${orderId}</code>\n\nRahmat! FIKRA'da muvaffaqiyatlar! 🎓`,
        parse_mode: 'HTML',
      }).catch(() => {});
    }

    logger.info(`P2P confirmed: orderId=${orderId} telegramId=${order.telegramId} plan=${order.planId}`);
    res.json({ success: true, plan: plan.id, telegramId: order.telegramId });
  } catch (err) {
    logger.error('confirm-p2p:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── P2P rad etish (admin) ───────────────────────────────────────────────────
router.post('/admin/reject-p2p', async (req, res) => {
  try {
    const { orderId, adminSecret, reason } = req.body;
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) return res.sendStatus(403);

    const order = await PendingOrder.findOne({ orderId });
    if (!order || order.status !== 'pending') return res.status(400).json({ error: 'Buyurtma topilmadi yoki allaqachon qayta ishlangan' });

    order.status = 'rejected';
    order.rejectedReason = reason || '';
    await order.save();

    const botToken = process.env.BOT_TOKEN;
    if (botToken) {
      axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: order.telegramId,
        text: `❌ Buyurtma (${orderId}) rad etildi.\n${reason ? 'Sabab: ' + reason : ''}\n\nSavollar uchun admin bilan bog'laning.`,
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Ichki plan aktivlashtirish ──────────────────────────────────────────────
async function _activatePlan(user, plan, chargeId) {
  const now = new Date();
  const startDate = (user.planExpiresAt && user.planExpiresAt > now) ? user.planExpiresAt : now;
  const newExpiry = new Date(startDate.getTime() + plan.durationDays * 86400000);

  const updateOps = {
    $set: { plan: plan.tier, planId: plan.id, planExpiresAt: newExpiry, planLastPurchaseAt: now },
  };
  if (chargeId) updateOps.$push = { planChargeIds: chargeId };

  await User.findByIdAndUpdate(user._id, updateOps);
}

module.exports = router;
module.exports.PLANS = PLANS;
module.exports._activatePlan = _activatePlan;
