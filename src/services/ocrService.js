// ─── OCR Service ─────────────────────────────────────────────────────────────
// Rasmdan matn ajratib olish (Gemini 2.5 Flash Vision orqali).
//
// Required env: GEMINI_API_KEY
//
// Asosiy qoida: AI'ga RASM yuboriladi, AI matnni ajratib qaytaradi.
// Foydalanuvchi natijani tahrirlash oynasida o'zgartirgandan keyin saqlanadi.

const axios = require('axios');
const { logger } = require('../utils/logger');

const GEMINI_MODEL = 'gemini-2.5-flash';

function _key() {
  const k = process.env.GEMINI_API_KEY;
  if (!k || k === 'placeholder') {
    throw new Error('GEMINI_API_KEY sozlanmagan');
  }
  return k;
}

// ─── OCR: bitta rasmdan matn ajratib olish ───────────────────────────────────
async function extractTextFromImage(imageBuffer, mimeType = 'image/jpeg') {
  if (!Buffer.isBuffer(imageBuffer)) {
    throw new Error('Rasm buffer kerak');
  }

  const base64 = imageBuffer.toString('base64');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${_key()}`;

  // Prompt — AI ga aniq vazifa beradi va FAQAT matnni qaytarish kerakligini aytadi
  const prompt =
    "Bu rasmda yozilgan barcha matnni TO'LIQ va ANIQ ko'chir. " +
    "Hech qanday izoh, sharh, sarlavha qo'shma. " +
    "Faqat rasmdagi matnning o'zini qaytar — original tilida (o'zbek, rus, ingliz, lotin, kirill — qaysi bo'lsa). " +
    "Matematik formulalar bo'lsa, ularni oddiy matn ko'rinishida ko'chir. " +
    "Agar rasmda matn yo'q bo'lsa, faqat shu so'zni qaytar: NO_TEXT_FOUND";

  let response;
  try {
    response = await axios.post(url, {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
      },
    }, { timeout: 45000 });
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message;
    logger.error('OCR API error:', detail);
    throw new Error('Rasm tahlilida xatolik: ' + (detail.slice(0, 150) || 'noma\'lum'));
  }

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text || text.trim() === 'NO_TEXT_FOUND') {
    throw new Error("Rasmda matn topilmadi yoki rasm sifati past");
  }

  return text.trim();
}

module.exports = {
  extractTextFromImage,
};
