const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User         = require('../models/User');
const PendingOrder = require('../models/PendingOrder');
const PromoCode    = require('../models/PromoCode');
const { logger }   = require('../utils/logger');

// ─── NARXLAR (UZS) ──────────────────────────────────────────────────────────
const PLANS = {
  // Basic
  basic_1m: { id:'basic_1m', name:'Basic', tier:'basic', period:'1 oy', durationDays:30,
    priceUZS:19900, badge:null,
    features:['30 ta AI tushuntirish','50 ta AI xabar/kun','5 ta Hujjat & 10 ta test','Reklamasiz ishlash'] },
  basic_3m: { id:'basic_3m', name:'Basic', tier:'basic', period:'3 oy', durationDays:90,
    priceUZS:49900, badge:'16% chegirma',
    features:['30 ta AI tushuntirish','50 ta AI xabar/kun','5 ta Hujjat & 10 ta test','3 oy muddatli'] },
  basic_12m: { id:'basic_12m', name:'Basic', tier:'basic', period:'1 yil', durationDays:365,
    priceUZS:179000, badge:'25% chegirma',
    features:['30 ta AI tushuntirish','50 ta AI xabar/kun','5 ta Hujjat & 10 ta test','Eng arzon yillik plan'] },
    
  // Pro
  pro_1m: { id:'pro_1m', name:'Pro', tier:'pro', period:'1 oy', durationDays:30,
    priceUZS:39900, badge:'Mashhur',
    features:['Cheksiz AI tushuntirish','Cheksiz AI xabar','20 ta Hujjat & cheksiz test','Pro belgi va yuqori tezlik'] },
  pro_3m: { id:'pro_3m', name:'Pro', tier:'pro', period:'3 oy', durationDays:90,
    priceUZS:99900, badge:'16% chegirma',
    features:['Cheksiz AI tushuntirish','Cheksiz AI xabar','20 ta Hujjat & cheksiz test','3 oy muddatli'] },
  pro_12m: { id:'pro_12m', name:'Pro', tier:'pro', period:'1 yil', durationDays:365,
    priceUZS:349000, badge:'27% chegirma',
    features:['Cheksiz AI tushuntirish','Cheksiz AI xabar','20 ta Hujjat & cheksiz test','Uzoq va qulay'] },
    
  // VIP
  vip_1m: { id:'vip_1m', name:'VIP', tier:'vip', period:'1 oy', durationDays:30,
    priceUZS:69900, badge:'Eng to\'liq',
    features:['Barcha imkoniyatlar cheksiz','VIP tezlik va ustuvorlik','Yangi funksiyalar 1-bo\'lib sizga','Shaxsiy AI yordamchi'] },
  vip_3m: { id:'vip_3m', name:'VIP', tier:'vip', period:'3 oy', durationDays:90,
    priceUZS:179900, badge:'14% chegirma',
    features:['Barcha imkoniyatlar cheksiz','VIP tezlik va ustuvorlik','Yangi funksiyalar 1-bo\'lib sizga','3 oy muddatli'] },
  vip_12m: { id:'vip_12m', name:'VIP', tier:'vip', period:'1 yil', durationDays:365,
    priceUZS:599000, badge:'28% chegirma',
    features:['Barcha imkoniyatlar cheksiz','VIP tezlik va ustuvorlik','Yangi funksiyalar 1-bo\'lib sizga','Yillik to\'liq paket'] },
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

// ─── Promocode tekshirish ────────────────────────────────────────────────────
router.post('/validate-promo', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Kod kiritilmadi' });
    
    const pc = await PromoCode.findOne({ code: code.toUpperCase() });
    if (!pc) return res.status(404).json({ error: 'Promokod topilmadi' });
    if (!pc.isActive) return res.status(400).json({ error: 'Promokod faol emas' });
    if (pc.expiresAt && pc.expiresAt < new Date()) return res.status(400).json({ error: 'Promokod muddati o\'tgan' });
    if (pc.maxUses > 0 && pc.usedCount >= pc.maxUses) return res.status(400).json({ error: 'Promokod limitiga yetgan' });
    
    res.json({ success: true, discountPercent: pc.discountPercent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── P2P buyurtma yaratish ───────────────────────────────────────────────────
router.post('/create-p2p-order', authMiddleware, async (req, res, next) => {
  try {
    const { planId, promoCode } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Yaroqsiz tariff' });

    const user = req.user;
    let finalPrice = plan.priceUZS;

    // Promokodni tekshirish va chegirma qo'llash
    if (promoCode) {
      const pc = await PromoCode.findOne({ code: promoCode.toUpperCase() });
      if (pc && pc.isActive && (!pc.expiresAt || pc.expiresAt > new Date()) && (pc.maxUses === 0 || pc.usedCount < pc.maxUses)) {
        finalPrice = Math.max(0, Math.round(plan.priceUZS * (1 - pc.discountPercent / 100)));
        // Incremet usedCount when confirming order, not here. But we can mark it.
      }
    }

    // Agar boshqa planlar uchun oldingi pending buyurtmalar bo'lsa, bekor qilamiz
    await PendingOrder.updateMany(
      { userId: user._id, status: 'pending', paymentType: 'p2p', planId: { $ne: plan.id } },
      { $set: { status: 'cancelled' } }
    );

    // Aynan shu plan uchun eski pending buyurtma bormi?
    const existing = await PendingOrder.findOne({
      userId: user._id,
      planId: plan.id,
      status: 'pending',
      paymentType: 'p2p',
      priceUZS: finalPrice, // faqat narxi bir xil bo'lsa
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
      planName: `${plan.name} ${plan.period}${promoCode ? ` (Promo: ${promoCode.toUpperCase()})` : ''}`,
      priceUZS: finalPrice,
      paymentType: 'p2p',
    });

    // Increment promocode use count (temporary logic: increment on create, but strictly should be on payment)
    if (promoCode && finalPrice < plan.priceUZS) {
      await PromoCode.updateOne({ code: promoCode.toUpperCase() }, { $inc: { usedCount: 1 } });
    }

    logger.info(`P2P order created: ${orderId} for user=${user._id} plan=${plan.id} price=${finalPrice}`);

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
