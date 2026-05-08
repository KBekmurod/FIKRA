// FIKRA — Exam API routes
// /api/exams/*
const express = require('express');
const router  = express.Router();
const fs = require('fs');
const { authMiddleware }   = require('../middleware/auth');
const { addXp }            = require('../services/rankService');
const User                 = require('../models/User');
const { generateMandateArtifacts, getMandateFilePath } = require('../services/certificateService');
const {
  DIRECTION_MAP,
  SUBJECT_META,
  COMPULSORY_SUBJECTS,
  startDtmSession,
  startSubjectSession,
  // startWeaknessDrill will be added dynamically
  submitAnswer,
  finishExamSession,
  getSessionReview,
  getHistory,
} = require('../services/examService');
const {
  getWeakSubjects,
  generateAIRecommendations,
} = require('../services/analyticsService');

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
    const optionIndex = parseInt(selectedOption);
    if (isNaN(optionIndex) || optionIndex < 0 || optionIndex > 3) {
      return res.status(400).json({ error: 'selectedOption 0-3 oraligida bo\'lishi kerak' });
    }
    const result = await submitAnswer(req.params.id, req.user._id, questionId, optionIndex);
    res.json({ saved: true, isCorrect: result.isCorrect, correctIndex: result.correctIndex, explanation: result.explanation });
  } catch (err) { next(err); }
});

// ─── POST /api/exams/sessions/:id/batch-answer ────────────────────────────
// Test oxirida barcha javoblarni bir vaqtda saqlash (navigatsiya erkinligi uchun)
// body: { answers: [{ questionId, selectedOption }] }
router.post('/sessions/:id/batch-answer', authMiddleware, async (req, res, next) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'answers massivi kerak' });
    }

    const results = [];
    for (const ans of answers) {
      const { questionId, selectedOption } = ans;
      if (!questionId || selectedOption === undefined) continue;
      const optionIndex = parseInt(selectedOption);
      if (isNaN(optionIndex) || optionIndex < 0 || optionIndex > 3) continue;
      try {
        const result = await submitAnswer(req.params.id, req.user._id, questionId, optionIndex);
        results.push({ questionId, isCorrect: result.isCorrect, correctIndex: result.correctIndex, explanation: result.explanation });
      } catch { /* bitta savol xato bo'lsa davom etaveradi */ }
    }

    res.json({ saved: results.length, results });
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

    const freshUser = await User.findById(req.user._id).select('username firstName lastName phone').lean();
    let certificate = null;
    try {
      const generated = await generateMandateArtifacts({
        user: freshUser || req.user,
        session: s,
        result: {
          totalScore: s.totalScore,
          maxTotalScore: s.maxTotalScore,
          endTime: s.endTime,
        },
      });
      certificate = generated ? {
        certificateNumber: generated.certificateNumber,
        title: generated.title,
        pngUrl: generated.pngUrl,
        pdfUrl: generated.pdfUrl,
      } : null;
    } catch (certErr) {
      console.error('[certificate] generation failed:', certErr.message);
    }

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
      certificate,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/exams/sessions/:id/certificate/:format ────────────────────────
router.get('/sessions/:id/certificate/:format', authMiddleware, async (req, res, next) => {
  try {
    const { id, format } = req.params;
    if (!['pdf', 'png'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format' });
    }

    const session = await require('../models/ExamSession').findById(id);
    if (!session) return res.status(404).json({ error: 'Sessiya topilmadi' });
    if (String(session.userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Ruxsat yoq' });
    }

    const filePath = await getMandateFilePath({ userId: req.user._id, sessionId: id, format });
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Sertifikat topilmadi' });
    }

    const downloadName = `${String(session._id).slice(-8)}-${format}.${format}`;
    res.setHeader('Content-Type', format === 'png' ? 'image/png' : 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    return res.sendFile(filePath);
  } catch (err) { next(err); }
});

// ─── GET /api/exams/sessions/:id/review ────────────────────────────────────
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
        questionId: a.questionId?._id,
        question:   a.questionId?.question,
        options:    a.questionId?.options,
        correctIndex: a.questionId?.answer,
        explanation:  a.questionId?.explanation,
        subject:    a.questionId?.subject,
        topic:      a.questionId?.topic,
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

// ─── GET /api/exams/analysis/weak-subjects ─────────────────────────────────
router.get('/analysis/weak-subjects', authMiddleware, async (req, res, next) => {
  try {
    const weakSubjects = await getWeakSubjects(req.user._id);
    res.json({ weakSubjects });
  } catch (err) { next(err); }
});

// ─── GET /api/exams/analysis/recommendations ───────────────────────────────
router.get('/analysis/recommendations', authMiddleware, async (req, res, next) => {
  try {
    const payload = await generateAIRecommendations(req.user._id);
    res.json(payload);
  } catch (err) { next(err); }
});

// ─── POST /api/exams/start-weakness-drill ─────────────────────────────────
router.post('/start-weakness-drill', authMiddleware, async (req, res, next) => {
  try {
    const { totalQuestions, durationSeconds } = req.body || {};
    const { startWeaknessDrill } = require('../services/examService');
    const result = await startWeaknessDrill(req.user._id, { totalQuestions, durationSeconds });
    res.json({
      sessionId: result.session._id,
      mode: 'drill',
      durationSeconds: result.session.durationSeconds,
      subjectBreakdown: result.session.subjectBreakdown,
      maxTotalScore: result.session.maxTotalScore,
      questions: result.questions,
    });
  } catch (err) { next(err); }
});

module.exports = router;
