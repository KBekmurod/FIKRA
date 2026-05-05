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

module.exports = router;
