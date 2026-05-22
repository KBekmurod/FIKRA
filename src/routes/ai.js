const express = require('express');
const crypto  = require('crypto');
const router  = express.Router();
const { authMiddleware, requireAiAccess, incrementAiUsage } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const ai = require('../services/aiService');
const { logger } = require('../utils/logger');
const ChatHistory = require('../models/ChatHistory');

const TempData = require('../models/TempData');

// Vaqtinchalik fayllar (MongoDB orqali)
async function _saveFile(buffer, mimeType, fileName) {
  const id = crypto.randomBytes(16).toString('hex');
  await TempData.create({
    key: id,
    kind: 'file',
    bufferData: buffer,
    mimeType: mimeType,
    fileName: fileName
  });
  return id;
}

// ─── GET /api/ai/chat/sessions ───────────────────────────────────────────────
router.get('/chat/sessions', authMiddleware, async (req, res, next) => {
  try {
    const sessions = await ChatHistory.find({ userId: req.user._id })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ sessions });
  } catch (err) { next(err); }
});

// ─── GET /api/ai/chat/sessions/:id ───────────────────────────────────────────
router.get('/chat/sessions/:id', authMiddleware, async (req, res, next) => {
  try {
    const session = await ChatHistory.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ error: 'Sessiya topilmadi' });
    res.json({ session });
  } catch (err) { next(err); }
});

// ─── DELETE /api/ai/chat/sessions/:id ────────────────────────────────────────
router.delete('/chat/sessions/:id', authMiddleware, async (req, res, next) => {
  try {
    await ChatHistory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── POST /api/ai/chat — SSE stream ──────────────────────────────────────────
router.post('/chat',
  authMiddleware,
  aiLimiter,
  requireAiAccess('chats'),
  async (req, res, next) => {
    try {
      const { message, sessionId } = req.body;
      if (!message) return res.status(400).json({ error: 'Xabar kerak' });
      await incrementAiUsage(req.user._id, 'chats');

      let session;
      if (sessionId) {
        session = await ChatHistory.findOne({ _id: sessionId, userId: req.user._id });
      }
      if (!session) {
        const title = message.length > 40 ? message.slice(0, 40) + '...' : message;
        session = new ChatHistory({ userId: req.user._id, title, messages: [] });
      }

      const systemPrompt = "Sen o'ta professional, bilimdon va yordamchi AIsan. Javoblaringni aniq, qisqa va strukturali shaklda (Markdown, Jadvallar, Listlar) yoz. Dasturlash kodlari bo'lsa `code` formatida ber. O'zbek tilida javob ber.";
      
      let dbMessages = session.messages.slice(-15).map(m => ({ role: m.role, content: m.content }));
      
      // Token (belgilar) chegarasi - OpenAI 400 xatosining oldini olish uchun
      let charCount = dbMessages.reduce((sum, m) => sum + (m.content ? m.content.length : 0), 0) + message.length;
      while (charCount > 15000 && dbMessages.length > 0) {
        const removed = dbMessages.shift();
        charCount -= (removed.content ? removed.content.length : 0);
      }

      const messagesToSend = [
        { role: 'system', content: systemPrompt },
        ...dbMessages,
        { role: 'user', content: message },
      ];

      res.setHeader('X-Session-Id', session._id.toString());
      res.setHeader('Access-Control-Expose-Headers', 'X-Session-Id');

      await ai.streamChat(messagesToSend, res, async (fullContent) => {
        try {
          session.messages.push({ role: 'user', content: message });
          session.messages.push({ role: 'assistant', content: fullContent });
          await session.save();
        } catch(e) {
          logger.error('Failed to save chat history:', e.message);
        }
      });
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

// ─── POST /api/ai/document/stream — Hujjat yaratish (Chunking) ──────────────────
router.post('/document/stream',
  authMiddleware,
  aiLimiter,
  async (req, res, next) => {
    try {
      const { prompt, format = 'DOCX', maxPages = 1, removeWatermark = false } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });
      
      const targetChunks = Math.max(1, Math.min(Math.ceil(maxPages / 2), 8)); 
      
      const isFree = !req.user.plan || req.user.plan === 'free';
      const shouldRemoveWatermark = removeWatermark && !isFree;
      
      // Limit tekshirish
      if (req.user.plan !== 'vip') {
        const docsUsed = req.user.getAiUsage('docs');
        const docsLimit = req.user.getAiLimit('docs');
        if (docsLimit !== Infinity && (docsUsed + targetChunks) > docsLimit) {
          return res.status(403).json({ error: 'Limit yetarli emas. Bitta hujjat qismi uchun 1 ta limit ketadi.', code: 'DAILY_LIMIT_REACHED' });
        }
      }

      // Limitdan ayirish (har bir chunk uchun)
      for(let i = 0; i < targetChunks; i++) {
        await incrementAiUsage(req.user._id, 'docs');
      }

      await ai.generateLongDocumentStream(prompt, format, maxPages, { removeWatermark: shouldRemoveWatermark }, res, async (fullContent) => {
        try {
          const titleMatch = fullContent.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1].trim() : (prompt.slice(0, 60) || 'Hujjat');
    
          const documentService = require('../services/documentService');
          const file = await documentService.generateFile(format, title, fullContent, { removeWatermark: shouldRemoveWatermark });
    
          const safeTitle = title
            .replace(/[^\w\s\u0400-\u04FF\u0100-\u017F-]/g, '')
            .replace(/\s+/g, '_')
            .slice(0, 50) || 'fikra_document';
          const fileName = `${safeTitle}_${Date.now()}.${file.ext}`;
    
          const fileId = await _saveFile(file.buffer, file.mime, fileName);
    
          res.write(`data: ${JSON.stringify({
            status: 'tayyor',
            success: true,
            format: format.toUpperCase(),
            fileName,
            fileId,
            downloadUrl: `/api/ai/file/${fileId}`,
            sizeKb: Math.round(file.buffer.length / 1024),
            title,
            preview: fullContent.slice(0, 300),
          })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (e) {
          logger.error('Fayl yaratishda xato:', e.message);
          res.write(`data: ${JSON.stringify({ error: 'Fayl yaratishda xatolik' })}\n\n`);
          res.end();
        }
      });
    } catch (err) {
      logger.error('AI document stream error:', err.message);
      if (!res.headersSent) next(err);
      else { try { res.end(); } catch {} }
    }
  }
);

// ─── GET /api/ai/file/:fileId — Fayl yuklab olish ────────────────────────────
// Authsiz — chunki fileId crypto random, faqat egasi biladi
router.get('/file/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await TempData.findOne({ key: fileId, kind: 'file' });
    if (!file) {
      return res.status(404).json({ error: 'Fayl topilmadi yoki muddati o\'tdi' });
    }
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
      'Content-Length': file.bufferData.length,
      'Cache-Control': 'private, max-age=1800',
    });
    res.send(file.bufferData);
  } catch (err) { next(err); }
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
      const fileId = await _saveFile(imageBuffer, result.mimeType, fileName);

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
