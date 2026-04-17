const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware, requireTokens } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const { spendTokens } = require('../services/tokenService');
const aiService = require('../services/aiService');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Token narxlar
const TOKEN_COSTS = {
  chat: 5,
  image: 30,
  calorie: 15,
  video: 250,
  document: 10,
  hint: 10,
};

// ─── AI CHAT (SSE stream) ─────────────────────────────────────────────────────
// POST /api/ai/chat
router.post('/chat', authMiddleware, aiLimiter, requireTokens(TOKEN_COSTS.chat), async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Xabar kerak' });

    await spendTokens(req.user._id, req.user.telegramId, TOKEN_COSTS.chat, 'ai_chat', { message: message.slice(0, 50) });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalAiRequests: 1 } });

    const messages = [
      { role: 'system', content: 'Sen FIKRA ilovasining AI yordamchisisisan. O\'zbek tilida qisqa va aniq javob ber.' },
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    await aiService.streamChat(messages, res);
  } catch (err) {
    if (!res.headersSent) next(err);
  }
});

// ─── HUJJAT YARATISH ──────────────────────────────────────────────────────────
// POST /api/ai/document
router.post('/document', authMiddleware, aiLimiter, requireTokens(TOKEN_COSTS.document), async (req, res, next) => {
  try {
    const { prompt, format = 'DOCX', history = [] } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });

    await spendTokens(req.user._id, req.user.telegramId, TOKEN_COSTS.document, 'ai_document', { format });

    const content = await aiService.generateDocument(prompt, format, history);
    res.json({ success: true, content, format });
  } catch (err) { next(err); }
});

// ─── RASM YARATISH ────────────────────────────────────────────────────────────
// POST /api/ai/image
router.post('/image', authMiddleware, aiLimiter, requireTokens(TOKEN_COSTS.image), async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });

    await spendTokens(req.user._id, req.user.telegramId, TOKEN_COSTS.image, 'ai_image', { prompt: prompt.slice(0, 50) });

    const result = await aiService.generateImage(prompt);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ─── KALORIYA SCANNER ─────────────────────────────────────────────────────────
// POST /api/ai/calorie
router.post('/calorie', authMiddleware, aiLimiter, requireTokens(TOKEN_COSTS.calorie), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Rasm kerak' });

    await spendTokens(req.user._id, req.user.telegramId, TOKEN_COSTS.calorie, 'ai_calorie');

    const base64 = req.file.buffer.toString('base64');
    const result = await aiService.analyzeCalorie(base64, req.file.mimetype);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ─── DTM TEST HINT ────────────────────────────────────────────────────────────
// POST /api/ai/hint
router.post('/hint', authMiddleware, requireTokens(TOKEN_COSTS.hint), async (req, res, next) => {
  try {
    const { question, options, subject } = req.body;
    if (!question || !options) return res.status(400).json({ error: 'Ma\'lumot kerak' });

    await spendTokens(req.user._id, req.user.telegramId, TOKEN_COSTS.hint, 'ai_chat', { type: 'hint' });

    const hint = await aiService.getTestHint(question, options, subject);
    res.json({ success: true, hint });
  } catch (err) { next(err); }
});

// ─── VIDEO YARATISH ───────────────────────────────────────────────────────────
// POST /api/ai/video
router.post('/video', authMiddleware, requireTokens(TOKEN_COSTS.video), async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });

    await spendTokens(req.user._id, req.user.telegramId, TOKEN_COSTS.video, 'ai_video', { prompt: prompt.slice(0, 50) });

    // Video uzoq vaqt oladi — background job sifatida
    res.json({ success: true, message: 'Video tayyorlanmoqda... Tayyor bo\'lgach xabar beramiz.' });

    // Background da yaratish
    aiService.generateVideo(prompt)
      .then(videoUrl => {
        // TODO: Push notification yoki polling orqali foydalanuvchiga yuborish
        require('../utils/logger').logger.info(`Video ready for user ${req.user.telegramId}: ${videoUrl}`);
      })
      .catch(err => require('../utils/logger').logger.error('Video generation error:', err));
  } catch (err) { next(err); }
});

// ─── CHAT TARIXI ──────────────────────────────────────────────────────────────
// GET /api/ai/history
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    // Hozircha frontend localStorage'da saqlaydi
    // Keyinchalik DB ga o'tkazish mumkin
    res.json({ history: [] });
  } catch (err) { next(err); }
});

module.exports = router;
