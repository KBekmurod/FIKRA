const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const { authMiddleware, requireAiAccess, incrementAiUsage } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const ai = require('../services/aiService');
const { logger } = require('../utils/logger');

// In-memory file storage (vaqtinchalik fayllar)
// Production'da Redis yoki disk, lekin Railway uchun memory yetarli
const fileStore = new Map();
const FILE_TTL = 30 * 60 * 1000; // 30 daqiqa

function _saveFile(buffer, mimeType, fileName) {
  const id = crypto.randomBytes(16).toString('hex');
  const meta = { buffer, mimeType, fileName, createdAt: Date.now() };
  fileStore.set(id, meta);
  // TTL bo'yicha o'chirish
  setTimeout(() => fileStore.delete(id), FILE_TTL);
  return id;
}

// ─── POST /api/ai/chat — SSE stream ──────────────────────────────────────────
router.post('/chat',
  authMiddleware,
  aiLimiter,
  requireAiAccess('chats'),
  async (req, res, next) => {
    try {
      const { message, history = [] } = req.body;
      if (!message) return res.status(400).json({ error: 'Xabar kerak' });
      await incrementAiUsage(req.user._id, 'chats');

      const messages = [
        { role: 'system', content: "Sen FIKRA AI yordamchisisan. O'zbek tilida qisqa va aniq javob ber. Abituriyentlarga DTM testlariga tayyorgarlik ko'rishda yordam beradigan, do'stona, tushunarli AI'sen." },
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

// ─── POST /api/ai/hint — DTM test savoli uchun ───────────────────────────────
router.post('/hint',
  authMiddleware,
  requireAiAccess('hints'),
  async (req, res, next) => {
    try {
      const { question, options, subject, mode } = req.body;
      if (!question) return res.status(400).json({ error: 'Savol kerak' });
      await incrementAiUsage(req.user._id, 'hints');

      const hint = mode === 'explain'
        ? await ai.explainTestQuestion(question, options || [], subject || '')
        : await ai.getTestHint(question, options || [], subject || '');

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

// ─── POST /api/ai/document — Hujjat yaratish ─────────────────────────────────
// MUHIM: blob URL Telegram WebApp'da ishlamaydi.
// Yechim: fayl serverda saqlanadi, frontend direkt /api/ai/file/:id ga so'rov yuboradi
router.post('/document',
  authMiddleware,
  aiLimiter,
  requireAiAccess('docs'),
  async (req, res, next) => {
    try {
      const { prompt, format = 'DOCX', history = [] } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });
      await incrementAiUsage(req.user._id, 'docs');

      const content = await ai.generateDocument(prompt, format, history);
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : (prompt.slice(0, 60) || 'Hujjat');

      const documentService = require('../services/documentService');
      const file = await documentService.generateFile(format, title, content);

      const safeTitle = title
        .replace(/[^\w\s\u0400-\u04FF\u0100-\u017F-]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 50) || 'fikra_document';
      const fileName = `${safeTitle}_${Date.now()}.${file.ext}`;

      // Faylni serverda saqlash, ID qaytarish
      const fileId = _saveFile(file.buffer, file.mime, fileName);

      res.json({
        success: true,
        format: format.toUpperCase(),
        fileName,
        fileId,
        downloadUrl: `/api/ai/file/${fileId}`,
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

// ─── GET /api/ai/file/:fileId — Fayl yuklab olish ────────────────────────────
// Authsiz — chunki fileId crypto random, faqat egasi biladi
router.get('/file/:fileId', (req, res) => {
  const { fileId } = req.params;
  const file = fileStore.get(fileId);
  if (!file) {
    return res.status(404).json({ error: 'Fayl topilmadi yoki muddati o\'tdi' });
  }
  res.set({
    'Content-Type': file.mimeType,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    'Content-Length': file.buffer.length,
    'Cache-Control': 'private, max-age=1800',
  });
  res.send(file.buffer);
});

// ─── POST /api/ai/image ──────────────────────────────────────────────────────
router.post('/image',
  authMiddleware,
  aiLimiter,
  requireAiAccess('images'),
  async (req, res, next) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });
      await incrementAiUsage(req.user._id, 'images');

      const result = await ai.generateImage(prompt);
      // Image ham serverda saqlash (yuklab olinishi uchun)
      const imageBuffer = Buffer.from(result.base64, 'base64');
      const fileName = `fikra_image_${Date.now()}.png`;
      const fileId = _saveFile(imageBuffer, result.mimeType, fileName);

      res.json({
        success: true,
        base64: result.base64,
        mimeType: result.mimeType,
        fileId,
        downloadUrl: `/api/ai/file/${fileId}`,
        fileName,
      });
    } catch (err) {
      logger.error('AI image error:', err.message);
      next(err);
    }
  }
);

module.exports = router;
