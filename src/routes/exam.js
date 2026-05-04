/**
 * FIKRA — Exam API routes (Phase 2)
 *
 * Endpoints:
 *   POST   /api/exam/start/dtm       — DTM rejimida test boshlash (yo'nalish bo'yicha)
 *   POST   /api/exam/start/subject   — Erkin fan tanlash rejimida test boshlash
 *   POST   /api/exam/:sessionId/answer  — Javob yuborish
 *   POST   /api/exam/:sessionId/finish  — Testni yakunlash
 *   GET    /api/exam/:sessionId/results — Natijalarni olish
 *   GET    /api/exam/history           — Foydalanuvchi testlar tarixi
 *   GET    /api/exam/config            — DTM 2026 konfiguratsiyasini olish (public)
 */

const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  startExamSession,
  startSubjectSession,
  submitAnswer,
  finishExamSession,
  getExamResults,
  getUserHistory,
  DTM,
} = require('../services/examService');

// ─── GET /api/exam/config ─────────────────────────────────────────────────────
// Public endpoint — returns DTM 2026 structure so clients can render UI without
// hardcoding counts/weights.
router.get('/config', (req, res) => {
  res.json({
    totalQuestions:  DTM.totalQuestions,
    durationMinutes: DTM.durationMinutes,
    durationSeconds: DTM.durationSeconds,
    maxScore:        DTM.maxScore,
    mandatory: {
      block:         DTM.mandatory.block,
      weight:        DTM.mandatory.weight,
      questionCount: DTM.mandatory.questionCount,
      subjects:      DTM.mandatory.subjects,
    },
    specialty: DTM.specialty,
    directions: DTM.directions,
    allSubjects: DTM.allSubjects,
  });
});

// ─── POST /api/exam/start/dtm ─────────────────────────────────────────────────
// Starts a DTM-mode session for the authenticated user.
// Body: { directionId: string }
router.post('/start/dtm', authMiddleware, async (req, res, next) => {
  try {
    const { directionId } = req.body;
    if (!directionId) {
      return res.status(400).json({ error: 'directionId majburiy' });
    }
    const userId = String(req.user._id);
    const result = await startExamSession(userId, directionId);
    res.status(201).json(result);
  } catch (err) {
    if (err.message.startsWith("Noma'lum yo'nalish")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ─── POST /api/exam/start/subject ─────────────────────────────────────────────
// Starts a subject-select session for the authenticated user.
// Body: {
//   subjects: [{ subjectId: string }, ...],          // required, min 1
//   questionCounts?: { [subjectId]: number },         // optional overrides
//   durationSeconds?: number,                         // optional override
// }
router.post('/start/subject', authMiddleware, async (req, res, next) => {
  try {
    const { subjects, questionCounts, durationSeconds } = req.body;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'subjects massivi majburiy (kamida 1 element)' });
    }

    const userId = String(req.user._id);
    const result = await startSubjectSession(
      userId,
      subjects,
      questionCounts || {},
      durationSeconds || null,
    );
    res.status(201).json(result);
  } catch (err) {
    if (err.message.startsWith("Noma'lum fan") || err.message.startsWith('Kamida')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
});

// ─── POST /api/exam/:sessionId/answer ─────────────────────────────────────────
// Submits one answer for a question in the given session.
// Body: { questionId: string, selectedOption: number (0-3) }
router.post('/:sessionId/answer', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId }    = req.params;
    const { questionId, selectedOption } = req.body;

    if (questionId === undefined || selectedOption === undefined) {
      return res.status(400).json({ error: 'questionId va selectedOption majburiy' });
    }
    const optIdx = Number(selectedOption);
    if (!Number.isInteger(optIdx) || optIdx < 0 || optIdx > 3) {
      return res.status(400).json({ error: 'selectedOption 0-3 orasida bo\'lishi kerak' });
    }

    const userId = String(req.user._id);
    const result = await submitAnswer(sessionId, userId, questionId, optIdx);
    res.json(result);
  } catch (err) {
    if (err.message.includes('topilmadi') || err.message.includes('boshqa foydalanuvchiga')) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('yakunlangan')) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

// ─── POST /api/exam/:sessionId/finish ─────────────────────────────────────────
// Finishes the session and computes the final score.
router.post('/:sessionId/finish', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = String(req.user._id);

    // Verify ownership before finishing
    const ExamSession = require('../models/ExamSession');
    const session = await ExamSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Sessiya topilmadi' });
    if (String(session.userId) !== userId) {
      return res.status(403).json({ error: 'Bu sessiya sizga tegishli emas' });
    }

    const result = await finishExamSession(sessionId);
    res.json(result);
  } catch (err) {
    if (err.message.includes('allaqachon yakunlangan')) {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
});

// ─── GET /api/exam/:sessionId/results ─────────────────────────────────────────
// Returns the session + all answers (with populated question data for review).
router.get('/:sessionId/results', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = String(req.user._id);

    const { session, answers } = await getExamResults(sessionId);

    // Only the session owner can view results
    if (String(session.userId) !== userId) {
      return res.status(403).json({ error: 'Bu sessiya sizga tegishli emas' });
    }

    res.json({ session, answers });
  } catch (err) {
    if (err.message.includes('topilmadi')) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
});

// ─── GET /api/exam/history ────────────────────────────────────────────────────
// Returns paginated exam history for the authenticated user.
// Query params: mode (dtm|subject), page, limit
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const userId = String(req.user._id);
    const { mode, page = '1', limit = '20' } = req.query;

    const result = await getUserHistory(userId, {
      mode:  mode || undefined,
      page:  parseInt(page, 10)  || 1,
      limit: parseInt(limit, 10) || 20,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
