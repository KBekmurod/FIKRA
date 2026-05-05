const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const PendingOrder = require('../models/PendingOrder');
const TestQuestion = require('../models/TestQuestion');
const { logger } = require('../utils/logger');
const { PLANS, _activatePlan } = require('./subscription');

// ─── Admin auth middleware ───────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const secret = req.headers['x-admin-secret'] || req.query.secret;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Admin huquqi yo\'q' });
  }
  next();
}

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.setHours(0,0,0,0));
    const week  = new Date(Date.now() - 7  * 86400000);
    const month = new Date(Date.now() - 30 * 86400000);

    const [
      totalUsers, newToday, newWeek, newMonth,
      activeBasic, activePro, activeVip,
      pendingOrders, confirmedOrders,
      totalGames, aiRequests,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: week } }),
      User.countDocuments({ createdAt: { $gte: month } }),
      User.countDocuments({ plan: 'basic', planExpiresAt: { $gt: new Date() } }),
      User.countDocuments({ plan: 'pro',   planExpiresAt: { $gt: new Date() } }),
      User.countDocuments({ plan: 'vip',   planExpiresAt: { $gt: new Date() } }),
      PendingOrder.countDocuments({ status: 'pending' }),
      PendingOrder.countDocuments({ status: 'confirmed' }),
      // O'yinlar yo'q, lekin test sessiyalari User'da hisoblanadi
      User.aggregate([{ $group: { _id: null, total: { $sum: '$totalGamesPlayed' } } }]),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$totalAiRequests' } } }]),
    ]);

    res.json({
      users: { total: totalUsers, today: newToday, week: newWeek, month: newMonth },
      subscriptions: {
        basic: activeBasic, pro: activePro, vip: activeVip,
        total: activeBasic + activePro + activeVip,
      },
      orders: { pending: pendingOrders, confirmed: confirmedOrders },
      activity: { totalGames: totalGames[0]?.total || 0, aiRequests: aiRequests[0]?.total || 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/users ────────────────────────────────────────────────────
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { q, plan, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (q) {
      const num = parseInt(q);
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
        ...(isNaN(num) ? [] : [{ telegramId: num }]),
      ];
    }
    if (plan) filter.plan = plan;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .select('telegramId username firstName plan planExpiresAt xp streakDays totalGamesPlayed totalAiRequests isActive createdAt'),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/admin/users/:id/ban ──────────────────────────────────────────
router.post('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Topilmadi' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive, telegramId: user.telegramId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/admin/users/:id/activate-plan ────────────────────────────────
router.post('/users/:id/activate-plan', adminAuth, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Yaroqsiz plan' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User topilmadi' });
    await _activatePlan(user, plan, null);
    logger.info(`Admin activated plan: ${user.telegramId} → ${planId}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/admin/orders ───────────────────────────────────────────────────
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.paymentType = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      PendingOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      PendingOrder.countDocuments(filter),
    ]);

    // Plan ma'lumotlarini qo'shamiz
    const enriched = orders.map(o => ({
      ...o.toObject(),
      planDetails: PLANS[o.planId] || null,
      daysLeft: o.expiresAt ? Math.max(0, Math.ceil((o.expiresAt - new Date()) / 86400000)) : 0,
    }));

    res.json({ orders: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/admin/orders/:orderId/confirm ─────────────────────────────────
router.post('/orders/:orderId/confirm', adminAuth, async (req, res) => {
  try {
    const { note } = req.body;
    const order = await PendingOrder.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
    if (order.status !== 'pending') return res.status(400).json({ error: `Holat: ${order.status}` });

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
    const axios = require('axios');
    const botToken = process.env.BOT_TOKEN;
    if (botToken) {
      axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: order.telegramId,
        text: `✅ <b>${plan.name} ${plan.period}</b> obunangiz faollashtirildi!\n\nBuyurtma: <code>${order.orderId}</code>\n\nRahmat! FIKRA'da muvaffaqiyatlar! 🎓`,
        parse_mode: 'HTML',
      }).catch(() => {});
    }

    logger.info(`Admin confirmed P2P: ${order.orderId} → ${order.telegramId}`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/admin/orders/:orderId/reject ──────────────────────────────────
router.post('/orders/:orderId/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await PendingOrder.findOne({ orderId: req.params.orderId });
    if (!order || order.status !== 'pending') {
      return res.status(400).json({ error: 'Buyurtma topilmadi yoki allaqachon qayta ishlangan' });
    }
    order.status = 'rejected';
    order.rejectedReason = reason || '';
    await order.save();

    const axios = require('axios');
    const botToken = process.env.BOT_TOKEN;
    if (botToken) {
      axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: order.telegramId,
        text: `❌ Buyurtma <code>${order.orderId}</code> rad etildi.\n${reason ? 'Sabab: ' + reason : ''}`,
        parse_mode: 'HTML',
      }).catch(() => {});
    }

    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/admin/subscriptions ───────────────────────────────────────────
router.get('/subscriptions', adminAuth, async (req, res) => {
  try {
    const { plan, status, page = 1, limit = 20 } = req.query;
    const now = new Date();
    const filter = { plan: { $ne: 'free' } };
    if (plan) filter.plan = plan;
    if (status === 'active')  filter.planExpiresAt = { $gt: now };
    if (status === 'expired') filter.planExpiresAt = { $lte: now };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ planExpiresAt: -1 }).skip(skip).limit(parseInt(limit))
        .select('telegramId username firstName plan planId planExpiresAt planLastPurchaseAt createdAt'),
      User.countDocuments(filter),
    ]);

    const enriched = users.map(u => ({
      ...u.toObject(),
      isActive: u.planExpiresAt && u.planExpiresAt > now,
      daysLeft: u.planExpiresAt ? Math.max(0, Math.ceil((u.planExpiresAt - now) / 86400000)) : 0,
    }));

    res.json({ users: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/admin/questions ────────────────────────────────────────────────
router.get('/questions', adminAuth, async (req, res) => {
  try {
    const { subject, block, page = 1, limit = 20, q } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (block) filter.block = block;
    if (q) filter.question = { $regex: q, $options: 'i' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [questions, total] = await Promise.all([
      TestQuestion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      TestQuestion.countDocuments(filter),
    ]);

    res.json({ questions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/admin/questions ───────────────────────────────────────────────
router.post('/questions', adminAuth, async (req, res) => {
  try {
    const { question, options, answer, explanation, subject, block } = req.body;
    if (!question || !options || options.length < 2 || answer === undefined || !subject) {
      return res.status(400).json({ error: 'Majburiy maydonlar: question, options (≥2), answer, subject' });
    }
    const q = await TestQuestion.create({ question, options, answer, explanation, subject, block: block || 'majburiy' });
    res.json({ success: true, question: q });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/admin/questions/:id ────────────────────────────────────────────
router.put('/questions/:id', adminAuth, async (req, res) => {
  try {
    const q = await TestQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!q) return res.status(404).json({ error: 'Topilmadi' });
    res.json({ success: true, question: q });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/admin/questions/:id ─────────────────────────────────────────
router.delete('/questions/:id', adminAuth, async (req, res) => {
  try {
    await TestQuestion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/admin/questions/csv-import ────────────────────────────────────
router.post('/questions/csv-import', adminAuth, async (req, res) => {
  try {
    const { questions } = req.body; // [{question,options:[],answer,subject,block,explanation}]
    if (!Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ error: 'questions massivi kerak' });
    }
    const result = await TestQuestion.insertMany(questions, { ordered: false });
    res.json({ success: true, inserted: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message, inserted: err.result?.nInserted || 0 });
  }
});

// ─── GET /api/admin/revenue ──────────────────────────────────────────────────
// Daromad kalkulyatori
router.get('/revenue', adminAuth, async (req, res) => {
  try {
    const { deepseekCostPer1k = 0.27, geminiCostPer1k = 0.1 } = req.query;

    const [
      confirmedOrders, activeUsers,
    ] = await Promise.all([
      PendingOrder.find({ status: 'confirmed' }),
      User.find({ plan: { $ne: 'free' }, planExpiresAt: { $gt: new Date() } }).select('plan planId'),
    ]);

    // P2P daromad (UZS)
    const p2pRevenue = confirmedOrders.reduce((sum, o) => sum + (o.priceUZS || 0), 0);

    // Stars daromad (Stars'ni UZS ga: ~70 so'm per star taxminan)
    // Stars → USD: 1 Stars ≈ $0.013 (Telegram narxi)
    // USD → UZS: 1 USD ≈ 12700 UZS (taxminan)
    const STAR_TO_UZS = 165; // 1 Stars ≈ 165 UZS
    const starsOrdersRevenue = confirmedOrders
      .filter(o => o.paymentType === 'stars')
      .reduce((sum, o) => sum + (o.priceStars || 0) * STAR_TO_UZS, 0);

    // Jami AI so'rovlar (taxminiy xarajat)
    const totalAiReqs = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAiRequests' } } }
    ]);
    const totalReqs = totalAiReqs[0]?.total || 0;
    // Taxminan har 1000 so'rovda: 60% DeepSeek, 40% Gemini
    const dsTokensCost = (totalReqs * 0.6 / 1000) * parseFloat(deepseekCostPer1k);
    const gmTokensCost = (totalReqs * 0.4 / 1000) * parseFloat(geminiCostPer1k);
    const totalApiCostUSD = dsTokensCost + gmTokensCost;
    const totalApiCostUZS = totalApiCostUSD * 12700;

    // Plan taqsimoti
    const planDist = { basic: 0, pro: 0, vip: 0 };
    activeUsers.forEach(u => { if (planDist[u.plan] !== undefined) planDist[u.plan]++; });

    res.json({
      revenue: {
        p2p: p2pRevenue,
        stars: Math.round(starsOrdersRevenue),
        total: p2pRevenue + Math.round(starsOrdersRevenue),
      },
      costs: {
        apiUSD: +totalApiCostUSD.toFixed(2),
        apiUZS: Math.round(totalApiCostUZS),
      },
      profit: {
        uzs: (p2pRevenue + Math.round(starsOrdersRevenue)) - Math.round(totalApiCostUZS),
      },
      orders: { total: confirmedOrders.length },
      aiRequests: totalReqs,
      activeSubs: activeUsers.length,
      planDistribution: planDist,
      note: 'API xarajat taxminiy. Aniq hisob uchun DeepSeek/Gemini dashboard\'ini tekshiring.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/admin/certificates ────────────────────────────────────────────
// Tasdiqlanishi kerak bo'lgan sertifikatlar
router.get('/certificates', adminAuth, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find()
      .select('_id telegramId username firstName certificates')
      .lean();

    // Sertifikatlarni foydalanuvchi bilan birga ol
    let allCerts = [];
    for (const user of users) {
      for (const cert of user.certificates || []) {
        allCerts.push({
          certId: cert._id,
          userId: user._id,
          telegramId: user.telegramId,
          userName: user.username || user.firstName,
          type: cert.type,
          subjectId: cert.subjectId,
          level: cert.level,
          certificateNumber: cert.certificateNumber,
          issuedDate: cert.issuedDate,
          verificationStatus: cert.verificationStatus,
          createdAt: cert.createdAt,
        });
      }
    }

    // Statusga qarab filtr qil
    if (status) {
      allCerts = allCerts.filter(c => c.verificationStatus === status);
    }

    // Tartibi bo'yicha sort qil (eng yangilari avval)
    allCerts = allCerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = allCerts.length;
    const certs = allCerts.slice(skip, skip + parseInt(limit));

    res.json({
      certificates: certs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/admin/certificates/:userId/:certId/verify ───────────────────
// Sertifikatni tasdiqlash
router.post('/certificates/:userId/:certId/verify', adminAuth, async (req, res) => {
  try {
    const { userId, certId } = req.params;
    const adminName = req.query.admin || 'unknown';

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User topilmadi' });

    const cert = user.certificates.find(c => c._id.toString() === certId);
    if (!cert) return res.status(404).json({ error: 'Sertifikat topilmadi' });

    cert.verificationStatus = 'verified';
    cert.verifiedBy = adminName;
    cert.verifiedAt = new Date();

    await user.save();

    res.json({ success: true, message: 'Sertifikat tasdiqlandi', certificate: cert });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/admin/certificates/:userId/:certId/reject ───────────────────
// Sertifikatni rad etish
router.post('/certificates/:userId/:certId/reject', adminAuth, async (req, res) => {
  try {
    const { userId, certId } = req.params;
    const { reason } = req.body;
    const adminName = req.query.admin || 'unknown';

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User topilmadi' });

    const cert = user.certificates.find(c => c._id.toString() === certId);
    if (!cert) return res.status(404).json({ error: 'Sertifikat topilmadi' });

    cert.verificationStatus = 'rejected';
    cert.verifiedBy = adminName;
    cert.verifiedAt = new Date();
    cert.rejectionReason = reason || '';

    await user.save();

    res.json({ success: true, message: 'Sertifikat rad etildi', certificate: cert });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/admin/certificates/:userId/:certId ──────────────────────────
// Sertifikatni o'chirish
router.delete('/certificates/:userId/:certId', adminAuth, async (req, res) => {
  try {
    const { userId, certId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User topilmadi' });

    const certIndex = user.certificates.findIndex(c => c._id.toString() === certId);
    if (certIndex < 0) return res.status(404).json({ error: 'Sertifikat topilmadi' });

    user.certificates.splice(certIndex, 1);
    await user.save();

    res.json({ success: true, message: 'Sertifikat o\'chirildi' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
