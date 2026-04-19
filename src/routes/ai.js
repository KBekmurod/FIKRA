const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const { authMiddleware, requireTokens } = require('../middleware/auth');
const { aiLimiter }   = require('../middleware/rateLimit');
const { spendTokens } = require('../services/tokenService');
const { addXp } = require('../services/rankService');
const ai = require('../services/aiService');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const COST = { chat: 5, image: 30, calorie: 15, video: 250, document: 10, hint: 10 };
const XP = { chat: 2, image: 8, calorie: 3, video: 25, document: 5, hint: 1 };

// POST /api/ai/chat  — SSE stream
router.post('/chat', authMiddleware, aiLimiter, requireTokens(COST.chat), async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Xabar kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.chat, 'ai_chat', { msg: message.slice(0,50) });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalAiRequests: 1 } });

    // XP — async, SSE ga xalaqit bermasin
    addXp(req.user._id, req.user.telegramId, XP.chat, 'ai_chat').catch(() => {});

    const messages = [
      { role: 'system', content: "Sen FIKRA AI yordamchisisisan. O'zbek tilida qisqa va aniq javob ber." },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];
    await ai.streamChat(messages, res);
  } catch (err) { if (!res.headersSent) next(err); }
});

// POST /api/ai/document  — real DOCX/PDF/PPTX fayl qaytaradi
router.post('/document', authMiddleware, aiLimiter, requireTokens(COST.document), async (req, res, next) => {
  try {
    const { prompt, format = 'DOCX', history = [] } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });

    await spendTokens(req.user._id, req.user.telegramId, COST.document, 'ai_document', { format });

    // XP
    addXp(req.user._id, req.user.telegramId, XP.document, 'ai_document', { format }).catch(() => {});

    // AI matn yaratadi
    const content = await ai.generateDocument(prompt, format, history);

    // Birinchi heading dan sarlavha olish (yoki default)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : (prompt.slice(0, 60) || 'Hujjat');

    // Real fayl yaratish
    const documentService = require('../services/documentService');
    const file = await documentService.generateFile(format, title, content);

    // Fayl nomini tayyorlash (xavfsiz — faqat harflar, raqamlar, tire)
    const safeTitle = title
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 50) || 'fikra_document';
    const fileName = `${safeTitle}_${Date.now()}.${file.ext}`;

    // Base64 qilib frontend ga qaytarish (brauzerdan to'g'ridan yuklanishi uchun)
    res.json({
      success: true,
      format: format.toUpperCase(),
      fileName,
      mimeType: file.mime,
      base64: file.buffer.toString('base64'),
      sizeKb: Math.round(file.buffer.length / 1024),
      title,
      preview: content.slice(0, 300), // Chatda ko'rsatish uchun
    });
  } catch (err) { next(err); }
});

// POST /api/ai/image
router.post('/image', authMiddleware, aiLimiter, requireTokens(COST.image), async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.image, 'ai_image');
    addXp(req.user._id, req.user.telegramId, XP.image, 'ai_image').catch(() => {});
    const result = await ai.generateImage(prompt);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// POST /api/ai/calorie  — multipart
router.post('/calorie', authMiddleware, aiLimiter, requireTokens(COST.calorie), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Rasm kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.calorie, 'ai_calorie');
    addXp(req.user._id, req.user.telegramId, XP.calorie, 'ai_calorie').catch(() => {});
    const result = await ai.analyzeCalorie(req.file.buffer.toString('base64'), req.file.mimetype);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// POST /api/ai/hint
router.post('/hint', authMiddleware, requireTokens(COST.hint), async (req, res, next) => {
  try {
    const { question, options, subject } = req.body;
    if (!question) return res.status(400).json({ error: 'Ma\'lumot kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.hint, 'ai_chat', { type: 'hint' });
    addXp(req.user._id, req.user.telegramId, XP.hint, 'ai_hint').catch(() => {});
    const hint = await ai.getTestHint(question, options || [], subject || '');
    res.json({ success: true, hint });
  } catch (err) { next(err); }
});

// POST /api/ai/video
router.post('/video', authMiddleware, requireTokens(COST.video), async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.video, 'ai_video');
    addXp(req.user._id, req.user.telegramId, XP.video, 'ai_video').catch(() => {});
    res.json({ success: true, message: 'Video tayyorlanmoqda... 2-5 daqiqa davomida Telegram ga yuboriladi.' });

    const telegramId = req.user.telegramId;
    const userFirstName = req.user.firstName || 'Foydalanuvchi';

    // Fon jarayon — video tayyor bo'lganda bot orqali yuboradi
    ai.generateVideo(prompt)
      .then(async (url) => {
        const { logger } = require('../utils/logger');
        logger.info(`Video ready: user=${telegramId} url=${url}`);

        // Bot orqali foydalanuvchiga yuborish
        try {
          const { getBot } = require('../bot');
          const bot = getBot && getBot();
          if (bot && url) {
            await bot.telegram.sendVideo(telegramId, url, {
              caption: `🎬 ${userFirstName}, videongiz tayyor!\n\n"${prompt.slice(0, 180)}"`,
              supports_streaming: true,
            });
            logger.info(`Video sent to user ${telegramId}`);
          } else if (!bot) {
            logger.warn('Bot instance topilmadi, video yuborilmadi');
          }
        } catch (botErr) {
          logger.error('Video bot send error:', botErr?.message || botErr);
          // Fallback — oddiy xabar
          try {
            const { getBot } = require('../bot');
            const bot = getBot && getBot();
            if (bot) {
              await bot.telegram.sendMessage(telegramId,
                `🎬 Videongiz tayyor!\n${url}`
              );
            }
          } catch {}
        }
      })
      .catch(async (err) => {
        const { logger } = require('../utils/logger');
        logger.error('Video generation err:', err?.message || err);
        // Foydalanuvchiga xatolik haqida xabar
        try {
          const { getBot } = require('../bot');
          const bot = getBot && getBot();
          if (bot) {
            await bot.telegram.sendMessage(telegramId,
              `❌ Kechirasiz, video yaratishda xatolik yuz berdi.\nTokenlaringiz qaytariladi.`
            );
          }
        } catch {}
        // Tokenni qaytarish
        try {
          const { earnTokens } = require('../services/tokenService');
          await earnTokens(req.user._id, telegramId, COST.video, 'video_refund', 'earn');
        } catch {}
      });
  } catch (err) { if (!res.headersSent) next(err); }
});

module.exports = router;
