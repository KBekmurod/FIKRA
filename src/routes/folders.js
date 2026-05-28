// ─── Folders API routes ─────────────────────────────────────────────────
// /api/folders/*
//
// Material-Test papkalari boshqaruvi.
//
// QAT'IY QOIDALAR:
//   • Bir material = bir papka = bir asosiy test
//   • Majburiy fan papkasi: 10 ta savol
//   • Mutaxassislik fan papkasi: 30 ta savol
//   • Foydalanuvchi material yetarsiz bo'lsa, 3 ta tanlov:
//     - add_material (yana qo'shadi)
//     - ai_fill (AI o'zi yetkazadi, sifat ogohlantirish bilan)
//     - cancel (bekor qiladi)

const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { logger }         = require('../utils/logger');
const folderService     = require('../services/folderService');
const testGen           = require('../services/testGeneratorService');

function _handleError(err, res, next) {
  const msg = err.message || '';
  if (msg.includes('topilmadi'))          return res.status(404).json({ error: msg });
  if (msg.includes('Ruxsat'))             return res.status(403).json({ error: msg });
  if (msg.includes('allaqachon'))         return res.status(409).json({ error: msg });
  if (msg.includes('yetarli') || msg.includes('Material juda')) {
    return res.status(400).json({ error: msg, code: 'MATERIAL_INSUFFICIENT' });
  }
  if (msg.includes('limit')) return res.status(429).json({ error: msg });
  next(err);
}

// ─── GET /api/folders/by-subject/:subjectId ─────────────────────────────
// Fan ichidagi papkalar ro'yxati
// Query: ?context=majburiy|mutaxassislik (optional)
router.get('/by-subject/:subjectId', authMiddleware, async (req, res, next) => {
  try {
    const { context } = req.query;
    const folders = await folderService.getFoldersBySubject(
      req.user._id, req.params.subjectId, context || null
    );
    const allowed = folderService.getAllowedContexts(req.params.subjectId);
    res.json({ folders, allowedContexts: allowed });
  } catch (err) { _handleError(err, res, next); }
});

// ─── GET /api/folders/subjects-summary ──────────────────────────────────
// Ombor sahifasi uchun barcha fanlar bo'yicha papkalar statistikasi
router.get('/subjects-summary', authMiddleware, async (req, res, next) => {
  try {
    const summary = await folderService.getSubjectsSummary(req.user._id);
    res.json({ summary });
  } catch (err) { _handleError(err, res, next); }
});

// ─── GET /api/folders/:id/flashcards ────────────────────────────────────
router.get('/:id/flashcards', authMiddleware, async (req, res, next) => {
  try {
    const FlashcardDeck = require('../models/FlashcardDeck');
    const deck = await FlashcardDeck.findOne({ folderId: req.params.id, userId: req.user._id });
    if (!deck) {
      return res.json({ status: 'not_found' });
    }
    res.json(deck);
  } catch (err) { _handleError(err, res, next); }
});

// ─── POST /api/folders/:id/flashcards ───────────────────────────────────
router.post('/:id/flashcards', authMiddleware, async (req, res, next) => {
  try {
    const deck = await testGen.generateFlashcardsForFolder(req.user._id, req.params.id);
    res.json(deck);
  } catch (err) { _handleError(err, res, next); }
});

// ─── GET /api/folders/:id ───────────────────────────────────────────────
// Bitta papka detali (material + test + urinishlar tarixi)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const data = await folderService.getFolderDetails(req.user._id, req.params.id);
    res.json(data);
  } catch (err) { _handleError(err, res, next); }
});

// ─── POST /api/folders ──────────────────────────────────────────────────
// Yangi papka yaratish
// Body: { subjectId, title, context: 'majburiy' | 'mutaxassislik' }
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { subjectId, title, context } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId kerak' });
    }
    const folder = await folderService.createFolder(req.user._id, {
      subjectId, title, context,
    });
    res.json({ success: true, folder });
  } catch (err) { _handleError(err, res, next); }
});

// ─── POST /api/folders/:id/check-sufficiency ──────────────────────────────
// Material yetarliligini tekshirish (test yaratishdan oldin)
router.post('/:id/check-sufficiency', authMiddleware, async (req, res, next) => {
  try {
    const check = await testGen.checkMaterialSufficiency(req.user._id, req.params.id);
    res.json(check);
  } catch (err) { _handleError(err, res, next); }
});

// ─── POST /api/folders/:id/generate ────────────────────────────────────
// Papka uchun test yaratish (qat'iy standart son bilan)
// Body: { opt: 'standard' | 'ai_fill' }
router.post('/:id/generate', authMiddleware, async (req, res, next) => {
  const interval = setInterval(() => { res.write(': keep-alive\n\n'); }, 5000);
  try {
    const { opt = 'standard' } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await testGen.generateForFolder(req.user._id, {
      folderId: req.params.id,
      opt,
    });

    clearInterval(interval);
    res.write(`data: ${JSON.stringify({
      success:        true,
      testId:         result.test._id,
      subjectId:      result.test.subjectId,
      subjectName:    result.test.subjectName,
      folderId:       result.folder._id,
      totalQuestions: result.questions.length,
      durationSeconds: result.questions.length * 120,
      questions: result.questions.map(q => ({
        idx:      q.idx,
        question: q.question,
        options:  q.options,
        topic:    q.topic,
      })),
      wasAiAdjusted: result.wasAiAdjusted,
    })}\n\n`);
    res.end();
  } catch (err) {
    clearInterval(interval);
    logger.error('Folder generate error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Xatolik yuz berdi' })}\n\n`);
    res.end();
  }
});

// ─── POST /api/folders/:id/retry ───────────────────────────────────────
// Mavjud testni qaytadan ishlash (savollar aralashtirilgan holda)
// Yangi PersonalTest yaratiladi (urinish sifatida) — folderga bog'lanadi
router.post('/:id/retry', authMiddleware, async (req, res, next) => {
  try {
    const newAttempt = await folderService.createRetryAttempt(req.user._id, req.params.id);
    res.json({
      success:        true,
      testId:         newAttempt._id,
      subjectId:      newAttempt.subjectId,
      subjectName:    newAttempt.subjectName,
      folderId:       newAttempt.folderId,
      totalQuestions: newAttempt.totalQuestions,
      durationSeconds: newAttempt.totalQuestions * 120,
      questions: newAttempt.questions.map(q => ({
        idx:      q.idx,
        question: q.question,
        options:  q.options,
        topic:    q.topic,
      })),
    });
  } catch (err) { _handleError(err, res, next); }
});

// ─── DELETE /api/folders/:id ───────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await folderService.deleteFolder(req.user._id, req.params.id);
    res.json(result);
  } catch (err) { _handleError(err, res, next); }
});

module.exports = router;
