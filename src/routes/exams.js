// FIKRA — Exam API routes
// /api/exams/*
const express = require('express');
const router  = express.Router();
const { authMiddleware }   = require('../middleware/auth');
const { addXp }            = require('../services/rankService');
const User                 = require('../models/User');
const {
  DIRECTION_MAP,
  SUBJECT_META,
  COMPULSORY_SUBJECTS,
  startDtmSession,
  startSubjectSession,
  submitAnswer,
  finishExamSession,
  getSessionReview,
  getHistory,
  deleteSession,
  repeatSession,
  getCabinetData,
  startCabinetMiniTest,
} = require('../services/examService');
const ai = require('../services/aiService');
const UserAnswer = require('../models/UserAnswer');
const { logger } = require('../utils/logger');

// ─── GET /api/exams/config ─────────────────────────────────────────────────
// Frontend uchun direction va subject ro'yxati
router.get('/config', (req, res) => {
  const directions = Object.entries(DIRECTION_MAP).map(([id, d]) => ({
    id,
    name: d.name,
    spec1: d.spec[0],
    spec2: d.spec[1],
    spec1Name: SUBJECT_META[d.spec[0]]?.name,
    spec2Name: SUBJECT_META[d.spec[1]]?.name,
  }));

  const subjects = Object.entries(SUBJECT_META).map(([id, s]) => ({
    id,
    name: s.name,
    block: s.block === 'majburiy' ? 'majburiy' : 'mutaxassislik',
    defaultCount: s.defaultCount,
    weight: s.weight,
  }));

  res.json({ directions, subjects });
});

// ─── POST /api/exams/start-dtm ────────────────────────────────────────────
router.post('/start-dtm', authMiddleware, async (req, res, next) => {
  try {
    const { direction } = req.body;
    if (!direction) return res.status(400).json({ error: 'direction kerak' });

    const result = await startDtmSession(req.user._id, direction);
    res.json({
      sessionId:    result.session._id,
      mode:         'dtm',
      direction:    result.session.direction,
      directionName:result.directionName,
      durationSeconds: result.session.durationSeconds,
      subjectBreakdown: result.session.subjectBreakdown,
      maxTotalScore:result.session.maxTotalScore,
      questions:    result.questions,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/exams/start-subject ────────────────────────────────────────
router.post('/start-subject', authMiddleware, async (req, res, next) => {
  try {
    const { subjects, advanced } = req.body;
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'subjects massivi kerak' });
    }

    const result = await startSubjectSession(req.user._id, subjects, advanced || {});
    res.json({
      sessionId:    result.session._id,
      mode:         'subject',
      durationSeconds: result.session.durationSeconds,
      subjectBreakdown: result.session.subjectBreakdown,
      maxTotalScore:result.session.maxTotalScore,
      questions:    result.questions,
    });
  } catch (err) { next(err); }
});

// ─── POST /api/exams/sessions/:id/answer ──────────────────────────────────
router.post('/sessions/:id/answer', authMiddleware, async (req, res, next) => {
  try {
    const { questionId, selectedOption } = req.body;
    if (questionId === undefined || selectedOption === undefined) {
      return res.status(400).json({ error: 'questionId va selectedOption kerak' });
    }
    const result = await submitAnswer(req.params.id, req.user._id, questionId, selectedOption);
    res.json({ saved: true, isCorrect: result.isCorrect, correctIndex: result.correctIndex, explanation: result.explanation });
  } catch (err) { next(err); }
});

// ─── POST /api/exams/sessions/:id/finish ──────────────────────────────────
router.post('/sessions/:id/finish', authMiddleware, async (req, res, next) => {
  try {
    const result = await finishExamSession(req.params.id, req.user._id);
    const s = result.session;

    // XP: (totalScore / maxTotalScore * 100) dan proporsional
    const pct = s.maxTotalScore > 0 ? s.totalScore / s.maxTotalScore : 0;
    const xpEarned = Math.round(20 + pct * 80); // 20–100 XP

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalGamesPlayed: 1 } });
    const xpResult = await addXp(req.user._id, req.user.telegramId, xpEarned, 'exam', {
      mode: s.mode, totalScore: s.totalScore,
    }).catch(() => null);

    res.json({
      sessionId:    s._id,
      mode:         s.mode,
      totalScore:   s.totalScore,
      maxTotalScore:s.maxTotalScore,
      percent:      s.maxTotalScore > 0 ? Math.round(s.totalScore / s.maxTotalScore * 100) : 0,
      subjectBreakdown: result.breakdown,
      durationSeconds: s.durationSeconds,
      startTime:    s.startTime,
      endTime:      s.endTime,
      xp: xpResult ? { added: xpResult.xpAdded, total: xpResult.xpAfter, levelUp: xpResult.levelUp } : null,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/exams/sessions/:id/review ────────────────────────────────────
// SNAPSHOT'dan o'qiydi — admin TestQuestion'ni o'chirsa ham, foydalanuvchi tarixi mavjud
router.get('/sessions/:id/review', authMiddleware, async (req, res, next) => {
  try {
    const { session, answers } = await getSessionReview(req.params.id, req.user._id);
    res.json({
      session: {
        _id: session._id, mode: session.mode, direction: session.direction,
        totalScore: session.totalScore, maxTotalScore: session.maxTotalScore,
        subjectBreakdown: session.subjectBreakdown,
        startTime: session.startTime, endTime: session.endTime,
      },
      answers: answers.map(a => ({
        // _id berib yuboramiz — frontend cabinet uchun
        _id: a._id,
        questionId: a.questionId,
        // Snapshot maydonlardan o'qish (eski sessiyalarda bo'lmasligi mumkin)
        question:   a.questionText || '',
        options:    a.questionOptions || [],
        correctIndex: a.correctAnswer >= 0 ? a.correctAnswer : null,
        explanation:  a.explanation || '',
        subject:    a.subjectId,
        topic:      a.topic || '',
        selectedOption: a.selectedOption,
        isCorrect:  a.isCorrect,
        subjectId:  a.subjectId,
      })),
    });
  } catch (err) { next(err); }
});

// ─── GET /api/exams/history ────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const { mode, page = 1 } = req.query;
    const result = await getHistory(req.user._id, mode, parseInt(page) || 1);
    res.json(result);
  } catch (err) { next(err); }
});


// ─── DELETE /api/exams/sessions/:id — Sessiyani o'chirish ──────────────────
router.delete('/sessions/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await deleteSession(req.params.id, req.user._id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ─── POST /api/exams/sessions/:id/repeat — Testni qayta ishlash ───────────
router.post('/sessions/:id/repeat', authMiddleware, async (req, res, next) => {
  try {
    const result = await repeatSession(req.params.id, req.user._id);
    res.json({
      sessionId:    result.session._id,
      mode:         result.session.mode,
      direction:    result.session.direction,
      directionName:result.directionName,
      durationSeconds: result.session.durationSeconds,
      subjectBreakdown: result.session.subjectBreakdown,
      maxTotalScore: result.session.maxTotalScore,
      questions:    result.questions,
      isRepeat:     true,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/exams/cabinet — AI Kabinet ma'lumotlari ─────────────────────
router.get('/cabinet', authMiddleware, async (req, res, next) => {
  try {
    const { subject, limit } = req.query;
    const data = await getCabinetData(req.user._id, {
      subjectId: subject || null,
      limit: limit ? parseInt(limit) : 100,
    });
    res.json(data);
  } catch (err) { next(err); }
});

// ─── GET /api/exams/cabinet/wrong/:answerId/explain — Bitta xato tahlili ──
router.get('/cabinet/wrong/:answerId/explain', authMiddleware, async (req, res, next) => {
  try {
    const ans = await UserAnswer.findById(req.params.answerId);
    if (!ans) return res.status(404).json({ error: 'Javob topilmadi' });
    if (String(ans.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }
    if (ans.isCorrect) return res.status(400).json({ error: 'Bu javob to\'g\'ri edi' });

    // AI orqali tahlil — snapshot ma'lumotlardan foydalanamiz
    const subjectName = SUBJECT_META[ans.subjectId]?.name || ans.subjectId;
    const explanation = await ai.explainWrongAnswer(
      ans.questionText,
      ans.questionOptions,
      ans.correctAnswer,
      ans.selectedOption,
      subjectName,
      ans.topic
    );

    res.json({
      success: true,
      explanation,
      question: ans.questionText,
      options: ans.questionOptions,
      correctAnswer: ans.correctAnswer,
      userSelection: ans.selectedOption,
      subject: ans.subjectId,
      subjectName,
      topic: ans.topic,
      // Asl tushuntirish (admin yozgan, agar bo\'lsa)
      originalExplanation: ans.explanation,
    });
  } catch (err) {
    logger.error('cabinet explain error:', err.message);
    next(err);
  }
});

// ─── POST /api/exams/cabinet/mini-test — Xato savollardan mini test ───────
router.post('/cabinet/mini-test', authMiddleware, async (req, res, next) => {
  try {
    const { subject, limit } = req.body;
    const result = await startCabinetMiniTest(req.user._id, {
      subjectId: subject || null,
      limit: limit ? Math.min(parseInt(limit), 30) : 10,
    });
    res.json({
      sessionId: result.session._id,
      mode: 'subject',
      isCabinet: true,
      durationSeconds: result.session.durationSeconds,
      subjectBreakdown: result.session.subjectBreakdown,
      maxTotalScore: result.session.maxTotalScore,
      questions: result.questions,
    });
  } catch (err) {
    logger.error('cabinet mini-test error:', err.message);
    next(err);
  }
});

// ─── POST /api/exams/cabinet/analysis — Umumiy AI tahlil ─────────────────
router.post('/cabinet/analysis', authMiddleware, async (req, res, next) => {
  try {
    const data = await getCabinetData(req.user._id);
    if (data.empty) {
      return res.json({ success: false, message: data.message });
    }
    const analysis = await ai.analyzeUserPerformance(data.stats);
    res.json({
      success: true,
      analysis,
      stats: data.stats,
    });
  } catch (err) {
    logger.error('cabinet analysis error:', err.message);
    next(err);
  }
});

module.exports = router;
