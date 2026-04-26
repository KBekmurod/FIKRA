const express = require('express');
const multer  = require('multer');
const router  = express.Router();
const { authMiddleware, requireAiAccess, incrementAiUsage } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const { addXp } = require('../services/rankService');
const ai = require('../services/aiService');
const { logger } = require('../utils/logger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// XP berish (status drive uchun, tokensiz)
const XP = { chat: 2, image: 8, calorie: 3, document: 5, hint: 1 };

// ─── POST /api/ai/chat — SSE stream ──────────────────────────────────────────
// Free uchun yopiq. Basic+: kuniga 50, Pro+: cheksiz
router.post('/chat',
  authMiddleware,
  aiLimiter,
  requireAiAccess('chats'),
  async (req, res, next) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: 'Xabar kerak' });

      // Limit oldindan inkrement (stream xato bersa ham — limit yeyilgan
      // bu odatdiy AI providerlardagi yondashuv)
      await incrementAiUsage(req.user._id, 'chats');
      addXp(req.user._id, req.user.telegramId, XP.chat, 'ai_chat').catch(() => {});

      const messages = [
        { role: 'system', content: "Sen FIKRA AI yordamchisisan. O'zbek tilida qisqa va aniq javob ber." },
        ...history.slice(-10),
        { role: 'user', content: message },
      ];
      await ai.streamChat(messages, res);
    } catch (err) {
      logger.error('AI chat error:', err.message);
      if (!res.headersSent) next(err);
      else { try { res.end(); } catch {} }
    }
  }
);

// ─── POST /api/ai/hint — DTM test savoli uchun tushuntirish ──────────────────
// Free: kuniga 5, Basic+: cheksiz
// Bu loyihaning markaziy AI funksiyasi
router.post('/hint',
  authMiddleware,
  requireAiAccess('hints'),
  async (req, res, next) => {
    try {
      const { question, options, subject, mode } = req.body;
      if (!question) return res.status(400).json({ error: 'Savol kerak' });

      await incrementAiUsage(req.user._id, 'hints');
      addXp(req.user._id, req.user.telegramId, XP.hint, 'ai_hint').catch(() => {});

      // 'hint' rejimi — to'g'ri javobni aytmasdan yo'l ko'rsatadi
      // 'explain' rejimi — to'g'ri javob bilan to'liq tushuntirish
      const hint = mode === 'explain'
        ? await ai.explainTestQuestion(question, options || [], subject || '')
        : await ai.getTestHint(question, options || [], subject || '');

      // Foydalanuvchiga qolgan limit ham qaytariladi
      const usedAfter = req.user.getAiUsage('hints') + 1;
      const limit = req.user.getAiLimit('hints');
      res.json({
        success: true,
        hint,
        used: usedAfter,
        limit: limit === Infinity ? null : limit,
      });
    } catch (err) {
      logger.error('AI hint error:', err.message);
      next(err);
    }
  }
);

// ─── POST /api/ai/document — DOCX/PDF/PPTX ─────────────────────────────────
// Pro+: kuniga 10, VIP: cheksiz
router.post('/document',
  authMiddleware,
  aiLimiter,
  requireAiAccess('docs'),
  async (req, res, next) => {
    try {
      const { prompt, format = 'DOCX', history = [] } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });

      await incrementAiUsage(req.user._id, 'docs');
      addXp(req.user._id, req.user.telegramId, XP.document, 'ai_document', { format }).catch(() => {});

      const content = await ai.generateDocument(prompt, format, history);

      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : (prompt.slice(0, 60) || 'Hujjat');

      const documentService = require('../services/documentService');
      const file = await documentService.generateFile(format, title, content);

      const safeTitle = title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 50) || 'fikra_document';
      const fileName = `${safeTitle}_${Date.now()}.${file.ext}`;

      res.json({
        success: true,
        format: format.toUpperCase(),
        fileName,
        mimeType: file.mime,
        base64: file.buffer.toString('base64'),
        sizeKb: Math.round(file.buffer.length / 1024),
        title,
        preview: content.slice(0, 300),
      });
    } catch (err) {
      logger.error('AI document error:', err.message);
      next(err);
    }
  }
);

// ─── POST /api/ai/image ──────────────────────────────────────────────────────
// Pro+: kuniga 20, VIP: cheksiz
router.post('/image',
  authMiddleware,
  aiLimiter,
  requireAiAccess('images'),
  async (req, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });

      await incrementAiUsage(req.user._id, 'images');
      addXp(req.user._id, req.user.telegramId, XP.image, 'ai_image').catch(() => {});

      const result = await ai.generateImage(prompt);
      res.json({ success: true, ...result });
    } catch (err) {
      logger.error('AI image error:', err.message);
      next(err);
    }
  }
);

// ─── POST /api/ai/calorie ───────────────────────────────────────────────────
// VIP: cheksiz, qolganlarga yopiq
router.post('/calorie',
  authMiddleware,
  aiLimiter,
  requireAiAccess('calories'),
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Rasm kerak' });

      await incrementAiUsage(req.user._id, 'calories');
      addXp(req.user._id, req.user.telegramId, XP.calorie, 'ai_calorie').catch(() => {});

      const result = await ai.analyzeCalorie(req.file.buffer.toString('base64'), req.file.mimetype);
      res.json({ success: true, ...result });
    } catch (err) {
      logger.error('AI calorie error:', err.message);
      next(err);
    }
  }
);

module.exports = router;
