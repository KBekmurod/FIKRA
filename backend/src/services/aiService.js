const OpenAI = require('openai');
const axios = require('axios');
const { logger } = require('../utils/logger');

// DeepSeek — lazy initialization (server key bo'lmasa ham ishga tushadi)
let _deepseek = null;
function getDeepseek() {
  if (!_deepseek) {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key || key === 'placeholder') {
      throw new Error('DEEPSEEK_API_KEY sozlanmagan. Railway Variables ga qo\'shing.');
    }
    _deepseek = new OpenAI({
      apiKey: key,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    });
  }
  return _deepseek;
}

// ─── AI Chat (SSE stream) ─────────────────────────────────────────────────────
async function streamChat(messages, res) {
  const stream = await getDeepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages,
    stream: true,
    max_tokens: 1000,
    temperature: 0.7,
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

// ─── Hujjat yaratish ──────────────────────────────────────────────────────────
async function generateDocument(prompt, format, history = []) {
  const systemPrompt = `Sen FIKRA ilovasining hujjat yaratish AI yordamchisisisan. 
Foydalanuvchi ${format} formatida hujjat yaratishni so'raydi.
Hujjat tarkibini markdown formatida yaz. Tuzilmali va professional bo'lsin.
Uzbek tilida javob ber.`;

  const response = await getDeepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: prompt },
    ],
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

// ─── Rasm yaratish (Gemini Imagen) ───────────────────────────────────────────
async function generateImage(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await axios.post(url, {
    contents: [{
      parts: [{ text: `Create an image: ${prompt}. Style: clean, modern, beautiful.` }]
    }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  }, { timeout: 30000 });

  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart) throw new Error('Rasm yaratishda xatolik');

  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType,
  };
}

// ─── Kaloriya tahlili ─────────────────────────────────────────────────────────
async function analyzeCalorie(imageBase64, mimeType = 'image/jpeg') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await axios.post(url, {
    contents: [{
      parts: [
        {
          inlineData: { mimeType, data: imageBase64 }
        },
        {
          text: `Bu ovqat rasmini tahlil qil. Faqat JSON formatida qaytara ber, boshqa narsa yo'q:
{
  "foodName": "taom nomi o'zbek tilida",
  "calories": 000,
  "protein": 00,
  "fat": 00,
  "carbs": 00,
  "portionGrams": 000,
  "healthScore": 7,
  "tips": "qisqa maslahat o'zbek tilida"
}`
        }
      ]
    }],
  }, { timeout: 30000 });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Tahlil natijasi olishda xatolik');
  return JSON.parse(jsonMatch[0]);
}

// ─── DTM Test AI hint ─────────────────────────────────────────────────────────
async function getTestHint(question, options, subject) {
  const response = await getDeepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [{
      role: 'user',
      content: `DTM ${subject} savoli: "${question}"\n\nVariantlar: ${options.map((o, i) => `${['A','B','C','D'][i]}) ${o}`).join(', ')}\n\nTo'g'ri javobni ko'rsatmasdan, bu savolni hal qilish uchun qisqa maslahat ber (2-3 jumla, o'zbek tilida).`,
    }],
    max_tokens: 200,
  });
  return response.choices[0].message.content;
}

// ─── Video yaratish (Kling via fal.ai) ───────────────────────────────────────
async function generateVideo(prompt) {
  const headers = { 'Authorization': `Key ${process.env.FAL_API_KEY}` };

  // So'rov yuborish
  const submit = await axios.post(
    'https://queue.fal.run/fal-ai/kling-video/v2.1/standard/text-to-video',
    {
      prompt,
      duration: '5',
      aspect_ratio: '9:16', // Mobil uchun vertikal
    },
    { headers }
  );

  const requestId = submit.data.request_id;

  // Natijani kutish (polling)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await axios.get(
      `https://queue.fal.run/fal-ai/kling-video/requests/${requestId}/status`,
      { headers }
    );
    if (status.data.status === 'COMPLETED') {
      const result = await axios.get(
        `https://queue.fal.run/fal-ai/kling-video/requests/${requestId}`,
        { headers }
      );
      return result.data?.video?.url || null;
    }
    if (status.data.status === 'FAILED') throw new Error('Video yaratishda xatolik');
  }
  throw new Error('Video yaratish vaqti tugadi');
}

module.exports = {
  streamChat,
  generateDocument,
  generateImage,
  analyzeCalorie,
  getTestHint,
  generateVideo,
};
