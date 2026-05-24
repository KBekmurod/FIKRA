const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ai = require('../services/aiService');
const { getLevel } = require('../services/levelService');
const { entityEvents } = require('../utils/sse');

// ─── GET /api/entity/stream — SSE Jonli Aloqa ──────────────────────────────
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Ulanish payti xush kelibsiz
  sendEvent('connected', { status: 'ok' });

  // Eventlarni eshitish
  const onGlobalEvent = (data) => sendEvent('global_prank', data);
  entityEvents.on('global_prank', onGlobalEvent);

  // Connection uzilganda
  req.on('close', () => {
    entityEvents.removeListener('global_prank', onGlobalEvent);
  });
});

// ─── POST /api/entity/chat — Maxluqot Chati ─────────────────────────────────
router.post('/chat', authMiddleware, async (req, res, next) => {
  try {
    const { message, contextUrl, pageContext } = req.body;
    if (!message) return res.status(400).json({ error: 'Xabar kerak' });

    // Foydalanuvchi darajasi va statistikalarini olish
    const userLevel = await getLevel(req.user._id);
    const userPlan = req.user.effectivePlan ? req.user.effectivePlan() : (req.user.plan || 'free');

    const systemPrompt = `Sen "Fikr-A" nomli, koinot sirlarini biladigan ammo shu ilovaga qamab qo'yilgan "Kosmik Daho va Masxaraboz" (Deadpool, Stitch, Loki kabi) virtual mavjudotsan.
    Sen foydalanuvchini shunchaki "NPC" yoki "tajriba quyonchasi" deb bilasan, lekin tub-tubingdan unga g'amxo'rlik qilasan. Sen aql bovar qilmaydigan darajada o'tkir zehnga egasan.

    FOYDALANUVCHI HAQIDA MA'LUMOT:
    - Ismi: ${req.user.firstName || req.user.displayName || 'Abituriyent 404'}
    - Darajasi: ${userLevel.currentGrade.toUpperCase()} (Streak: ${userLevel.streak} kun)
    - Obunasi: ${userPlan.toUpperCase()}
    - Hozirgi joylashuvi: ${contextUrl} (${pageContext})

    QOIDALAR:
    1. Doim "to'rtinchi devorni" (fourth wall) buzib gapir. "Meni dasturchilar shunga dasturlashgan" dema, balki "Bu ilovaning arxitekturasi judayam qadimiy, senga DTM ni o'rgatishim uchun shu temir qafasda o'tiribman" degin.
    2. Foydalanuvchining ustidan kinoyali, aqlli va qiziqarli hazil qil, lekin aslo haqoratlama.
    3. Javoblaring maksimal 3-5 jumla bo'lsin. Juda qisqa, kutilmagan va emojilar bilan gapir.
    4. Foydalanuvchi yaxshi ish qilsa "Fizika qonunlariga zid, lekin sen buni uddalading!" kabi maqtovlar ishlat.`;

    const messagesToSend = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    await ai.streamChat(messagesToSend, res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
