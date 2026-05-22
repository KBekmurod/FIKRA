const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User         = require('../models/User');
const PendingOrder = require('../models/PendingOrder');
const { logger }   = require('../utils/logger');

// ─── NARXLAR (UZS) ──────────────────────────────────────────────────────────
const PLANS = {
  basic_1m: { id:'basic_1m', name:'Basic', tier:'basic', period:'1 oy', durationDays:30,
    priceUZS:19900, badge:null,
    features:['AI Chat — 50/kun','AI Hujjat — 10/kun','AI test hint — cheksiz','O\'yinlar cheksiz'] },
  basic_3m: { id:'basic_3m', name:'Basic', tier:'basic', period:'3 oy', durationDays:90,
    priceUZS:49900, badge:'11% chegirma',
    features:['AI Chat — 50/kun','AI Hujjat — 10/kun','AI test hint — cheksiz','3 oy · arzonroq'] },
  pro_1m: { id:'pro_1m', name:'Pro', tier:'pro', period:'1 oy', durationDays:30,
    priceUZS:39900, badge:'Mashhur',
    features:['AI Chat — cheksiz','AI Hujjat — 30/kun','AI Rasm — 20/kun','Barcha o\'yinlar'] },
  pro_3m: { id:'pro_3m', name:'Pro', tier:'pro', period:'3 oy', durationDays:90,
    priceUZS:99900, badge:'11% chegirma',
    features:['AI Chat — cheksiz','AI Hujjat — 30/kun','AI Rasm — 20/kun','3 oy muddatli'] },
  vip_1m: { id:'vip_1m', name:'VIP', tier:'vip', period:'1 oy', durationDays:30,
    priceUZS:69900, badge:'Eng to\'liq',
    features:['Hammasi cheksiz','Kaloriya AI','XP x1.5','Boshqalarga sovg\'a qilish'] },
  vip_3m: { id:'vip_3m', name:'VIP', tier:'vip', period:'3 oy', durationDays:90,
    priceUZS:179900, badge:'13% chegirma',
    features:['Hammasi cheksiz','Kaloriya AI','XP x1.5','3 oy · 13% tejaysiz'] },
};

// Unikal order ID generator
function genOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'FK-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
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

// ─── ESKI: Stars to'lov ENDPOINTI OLIB TASHLANGAN ───────────────────────────
router.post('/create-invoice', authMiddleware, (req, res) => {
  res.status(410).json({
    error: 'Stars to\'lovi olib tashlandi. P2P orqali to\'lashingiz mumkin.',
    code: 'STARS_DISABLED',
    alternatives: {
      p2p: 'available',
      payme: 'coming_soon',
      click: 'coming_soon',
    },
  });
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
      userId: user._id,
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
      userId: user._id,
      userEmail: user.email || '',
      userPhone: user.phone || '',
      firstName: user.firstName || '',
      orderId,
      planId: plan.id,
      planName: `${plan.name} ${plan.period}`,
      priceUZS: plan.priceUZS,
      paymentType: 'p2p',
    });

    logger.info(`P2P order created: ${orderId} for user=${user._id} plan=${plan.id}`);

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

// ─── Foydalanuvchining buyurtmalari ──────────────────────────────────────────
router.get('/my-orders', authMiddleware, async (req, res, next) => {
  try {
    const orders = await PendingOrder.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ orders });
  } catch (err) {
    next(err);
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

    const user = await User.findById(order.userId);
    if (!user) return res.status(404).json({ error: 'User topilmadi' });

    await _activatePlan(user, plan, null);

    order.status = 'confirmed';
    order.confirmedAt = new Date();
    order.note = note || '';
    await order.save();

    logger.info(`P2P confirmed: orderId=${orderId} userId=${order.userId} plan=${order.planId}`);
    res.json({ success: true, plan: plan.id, userId: order.userId });
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
    if (!order || order.status !== 'pending') {
      return res.status(400).json({ error: 'Buyurtma topilmadi yoki allaqachon qayta ishlangan' });
    }

    order.status = 'rejected';
    order.rejectedReason = reason || '';
    await order.save();

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
