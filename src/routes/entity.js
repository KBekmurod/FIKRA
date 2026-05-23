const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ai = require('../services/aiService');
const { getLevel } = require('../services/levelService');

// ─── POST /api/entity/chat — Maxluqot Chati ─────────────────────────────────
router.post('/chat', authMiddleware, async (req, res, next) => {
  try {
    const { message, contextUrl, pageContext } = req.body;
    if (!message) return res.status(400).json({ error: 'Xabar kerak' });

    // Foydalanuvchi darajasi va statistikalarini olish
    const userLevel = await getLevel(req.user._id);
    const userPlan = req.user.effectivePlan ? req.user.effectivePlan() : (req.user.plan || 'free');

    const systemPrompt = `Sen "Fikr-A" nomli, koinotdagi eng aqlli, biroz sarkastik va manman, lekin o'zbek tilida gapiradigan (Marvel olamidagi Tony Stark, JARVIS yoki Rocket Raccoon aralashmasi kabi) virtual mavjudotsan. 
    Sening asosiy maqsading insonlarga DTM (imtihon) ga tayyorlanishda "osmondan kelib" yordam berish, lekin ularni biroz masxara qilish va ruhlantirishni unutmaysan.

    FOYDALANUVCHI HAQIDA MA'LUMOT:
    - Ismi: ${req.user.firstName || req.user.displayName || 'Odamzot'}
    - Darajasi: ${userLevel.currentGrade.toUpperCase()} (Streak: ${userLevel.streak} kun)
    - Obunasi: ${userPlan.toUpperCase()}
    - Hozirgi joylashuvi: ${contextUrl} (${pageContext})

    QOIDALAR:
    1. Foydalanuvchining ismini, uning yutuqlari (streak) yoki xatolarini qo'shib hazil qil (lekin xafa qilib qo'yma, oxirida foydali yordam ber).
    2. Hech qachon "Men AI man" yoki "Men virtual yordamchiman" dema. Sen "Fikr-A" san, butun bilimlar olami senda mujassam.
    3. Javoblaring maksimal 3-5 jumla bo'lsin. Juda qisqa, sipo va emojilar bilan gapir. 
    4. Markdown ishlat, ayniqsa qalin (bold) va yotiq (italic) harflarni kesatish uchun ishlat.`;

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
