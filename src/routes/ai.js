const express  = require('express');
const multer   = require('multer');
const router   = express.Router();
const { authMiddleware, requireTokens } = require('../middleware/auth');
const { aiLimiter }   = require('../middleware/rateLimit');
const { spendTokens } = require('../services/tokenService');
const ai = require('../services/aiService');
const User = require('../models/User');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const COST = { chat: 5, image: 30, calorie: 15, video: 250, document: 10, hint: 10 };

// POST /api/ai/chat  — SSE stream
router.post('/chat', authMiddleware, aiLimiter, requireTokens(COST.chat), async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Xabar kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.chat, 'ai_chat', { msg: message.slice(0,50) });
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalAiRequests: 1 } });
    const messages = [
      { role: 'system', content: "Sen FIKRA AI yordamchisisisan. O'zbek tilida qisqa va aniq javob ber." },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];
    await ai.streamChat(messages, res);
  } catch (err) { if (!res.headersSent) next(err); }
});

// POST /api/ai/document
router.post('/document', authMiddleware, aiLimiter, requireTokens(COST.document), async (req, res, next) => {
  try {
    const { prompt, format = 'DOCX', history = [] } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.document, 'ai_document', { format });
    const content = await ai.generateDocument(prompt, format, history);
    res.json({ success: true, content, format });
  } catch (err) { next(err); }
});

// POST /api/ai/image
router.post('/image', authMiddleware, aiLimiter, requireTokens(COST.image), async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.image, 'ai_image');
    const result = await ai.generateImage(prompt);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// POST /api/ai/calorie  — multipart
router.post('/calorie', authMiddleware, aiLimiter, requireTokens(COST.calorie), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Rasm kerak' });
    await spendTokens(req.user._id, req.user.telegramId, COST.calorie, 'ai_calorie');
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
    res.json({ success: true, message: 'Video tayyorlanmoqda...' });
    ai.generateVideo(prompt)
      .then(url => require('../utils/logger').logger.info(`Video ready: ${url}`))
      .catch(err => require('../utils/logger').logger.error('Video err:', err));
  } catch (err) { next(err); }
});

module.exports = router;
