const express  = require('express');
const router   = express.Router();
const User     = require('../models/User');
const PendingOrder = require('../models/PendingOrder');
const TestQuestion = require('../models/TestQuestion');
const { logger, memoryLogs } = require('../utils/logger');
const { PLANS, _activatePlan } = require('./subscription');
const StudyMaterial = require('../models/StudyMaterial');
const PromoCode = require('../models/PromoCode');
const Announcement = require('../models/Announcement');
const ExamSession = require('../models/ExamSession');
const PersonalTest = require('../models/PersonalTest');
const { entityEvents } = require('../utils/sse');

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
      aiRequestsStats,
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
      User.aggregate([
        {
          $group: {
            _id: null,
            totalChats: { $sum: '$lifetimeAiUsage.chats' },
            totalDocs: { $sum: '$lifetimeAiUsage.docs' },
            totalHints: { $sum: '$lifetimeAiUsage.hints' },
            totalImages: { $sum: '$lifetimeAiUsage.images' },
            totalTests: { $sum: '$lifetimeAiUsage.testsGen' }
          }
        }
      ])
    ]);

    const totalAiActions = aiRequestsStats[0] ? 
      (aiRequestsStats[0].totalChats + aiRequestsStats[0].totalDocs + aiRequestsStats[0].totalHints + aiRequestsStats[0].totalImages + aiRequestsStats[0].totalTests) : 0;

    res.json({
      users: { total: totalUsers, today: newToday, week: newWeek, month: newMonth },
      subscriptions: {
        basic: activeBasic, pro: activePro, vip: activeVip,
        total: activeBasic + activePro + activeVip,
      },
      orders: { pending: pendingOrders, confirmed: confirmedOrders },
      activity: { aiRequests: totalAiActions },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/analytics ────────────────────────────────────────────────
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    // 1. ExamSession statistikasi (Umumiy bazaviy testlar)
    const examStats = await ExamSession.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: "$subjectBreakdown" },
      {
        $group: {
          _id: "$subjectBreakdown.subjectId",
          name: { $first: "$subjectBreakdown.subjectName" },
          count: { $sum: 1 },
          avgScore: { $avg: "$subjectBreakdown.score" },
          maxPossibleScore: { $first: "$subjectBreakdown.maxScore" } // approx
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 2. PersonalTest statistikasi (AI generatsiya testlar)
    const personalTestStats = await PersonalTest.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: "$subjectId",
          name: { $first: "$subjectName" },
          count: { $sum: 1 },
          avgPercent: { $avg: "$scorePercent" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 3. User retention (Eng ko'p test ishlaganlar)
    const topUsers = await ExamSession.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: "$userId", testCount: { $sum: 1 } } },
      { $sort: { testCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          firstName: "$user.firstName",
          phone: "$user.phone",
          email: "$user.email",
          testCount: 1
        }
      }
    ]);

    res.json({ success: true, examStats, personalTestStats, topUsers });
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
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }
    if (plan) filter.plan = plan;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .select('email phone firstName displayName plan planExpiresAt isActive createdAt'),
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
    res.json({ success: true, isActive: user.isActive, userId: user._id });
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
    logger.info(`Admin activated plan: user=${user._id} (${user.email || user.phone}) → ${planId}`);
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

    const user = await User.findById(order.userId);
    if (!user) return res.status(404).json({ error: 'User topilmadi' });

    await _activatePlan(user, plan, null);
    order.status = 'confirmed';
    order.confirmedAt = new Date();
    order.note = note || '';
    await order.save();

    logger.info(`Admin confirmed P2P: ${order.orderId} → user=${order.userId}`);
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
        .select('email phone firstName displayName plan planId planExpiresAt planLastPurchaseAt createdAt'),
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

// ─── GET /api/admin/questions/stats — Fan bo'yicha statistika ───────────────
router.get('/questions/stats', adminAuth, async (req, res) => {
  try {
    const stats = await TestQuestion.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          withExplanation: { $sum: { $cond: [{ $and: [{ $ifNull: ['$explanation', false] }, { $ne: ['$explanation', ''] }] }, 1, 0] } },
        }
      },
      { $sort: { _id: 1 } },
    ]);
    const total = stats.reduce((s, x) => s + x.count, 0);
    res.json({ stats, total });
  } catch (err) { res.status(500).json({ error: err.message }); }
});


// ─── GET /api/admin/questions/export — CSV eksport ──────────────────────────
router.get('/questions/export', adminAuth, async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = subject ? { subject } : {};
    const questions = await TestQuestion.find(filter).lean();
    const header = 'question;optionA;optionB;optionC;optionD;answer;subject;block;explanation';
    const rows = questions.map(q => [
      q.question.replace(/;/g, ',').replace(/\n/g, ' '),
      ...(q.options || ['','','','']).map(o => String(o).replace(/;/g, ',')),
      q.answer,
      q.subject,
      q.block || 'majburiy',
      (q.explanation || '').replace(/;/g, ',').replace(/\n/g, ' '),
    ].join(';'));
    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fikra_questions_${subject||'all'}_${Date.now()}.csv"`);
    res.send('\ufeff' + csv); // BOM for Excel UTF-8
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



// ─── DELETE /api/admin/questions/all — Barchasini o'chirish ─────────────────
router.delete('/questions/all', adminAuth, async (req, res) => {
  try {
    const { subject, confirm } = req.body;
    if (confirm !== 'DELETE_ALL') {
      return res.status(400).json({ error: 'confirm: "DELETE_ALL" yuborish kerak' });
    }
    const filter = subject ? { subject } : {};
    const result = await TestQuestion.deleteMany(filter);
    logger.info(`Admin: ${result.deletedCount} ta savol o'chirildi (subject=${subject||'all'})`);
    res.json({ success: true, deleted: result.deletedCount });
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
      confirmedOrders, activeUsers, aiRequestsStats
    ] = await Promise.all([
      PendingOrder.find({ status: 'confirmed' }),
      User.find({ plan: { $ne: 'free' }, planExpiresAt: { $gt: new Date() } }).select('plan planId'),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalChats: { $sum: '$lifetimeAiUsage.chats' },
            totalDocs: { $sum: '$lifetimeAiUsage.docs' },
            totalHints: { $sum: '$lifetimeAiUsage.hints' },
            totalImages: { $sum: '$lifetimeAiUsage.images' },
            totalTests: { $sum: '$lifetimeAiUsage.testsGen' }
          }
        }
      ])
    ]);

    // P2P daromad (UZS) — barcha tasdiqlangan buyurtmalar
    const p2pRevenue = confirmedOrders.reduce((sum, o) => sum + (o.priceUZS || 0), 0);

    // Jami AI so'rovlar (Haqiqiy xarajat lifetimeAiUsage asosida)
    const stats = aiRequestsStats[0] || { totalChats: 0, totalDocs: 0, totalHints: 0, totalImages: 0, totalTests: 0 };
    const totalReqs = stats.totalChats + stats.totalDocs + stats.totalHints + stats.totalImages + stats.totalTests;
    
    // Taxminiy hisob: 
    // - Docs/TestsGen ko'proq token yeydi (x5)
    // - Qolganlari standart 1x.
    const weightedTokens = (stats.totalDocs * 5) + (stats.totalTests * 5) + stats.totalChats + stats.totalHints + (stats.totalImages * 2);
    
    // Faraz qilamiz: Har 1000 weighted so'rov $0.15 atrofida tushadi
    const averageCostPer1k = 0.15;
    const totalApiCostUSD = (weightedTokens / 1000) * averageCostPer1k;
    const totalApiCostUZS = totalApiCostUSD * 12700;

    // Plan taqsimoti
    const planDist = { basic: 0, pro: 0, vip: 0 };
    activeUsers.forEach(u => { if (planDist[u.plan] !== undefined) planDist[u.plan]++; });

    res.json({
      revenue: {
        p2p: p2pRevenue,
        total: p2pRevenue,
      },
      costs: {
        apiUSD: +totalApiCostUSD.toFixed(2),
        apiUZS: Math.round(totalApiCostUZS),
      },
      profit: {
        uzs: p2pRevenue - Math.round(totalApiCostUZS),
      },
      orders: { total: confirmedOrders.length },
      aiRequests: totalReqs,
      activeSubs: activeUsers.length,
      planDistribution: planDist,
      note: 'API xarajat taxminiy. Aniq hisob uchun DeepSeek/Gemini dashboard\'ini tekshiring.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
