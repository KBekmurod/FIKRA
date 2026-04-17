const axios  = require('axios');
const { logger } = require('../utils/logger');

// ─── Lazy clients — server key bo'lmasa ham crash bo'lmaydi ──────────────────
let _deepseek = null;
function deepseek() {
  if (!_deepseek) {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key || key === 'placeholder') throw new Error('DEEPSEEK_API_KEY sozlanmagan');
    const OpenAI = require('openai');
    _deepseek = new OpenAI({
      apiKey: key,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    });
  }
  return _deepseek;
}

// ─── AI Chat stream ───────────────────────────────────────────────────────────
async function streamChat(messages, res) {
  const stream = await deepseek().chat.completions.create({
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
    if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

// ─── Hujjat yaratish ──────────────────────────────────────────────────────────
async function generateDocument(prompt, format, history = []) {
  const res = await deepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: `Sen hujjat yaratish AI yordamchisisisan. ${format} formatida, markdown da, o'zbek tilida yoz.` },
      ...history.slice(-10),
      { role: 'user', content: prompt },
    ],
    max_tokens: 2000,
  });
  return res.choices[0].message.content;
}

// ─── Test AI hint ─────────────────────────────────────────────────────────────
async function getTestHint(question, options, subject) {
  const res = await deepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [{
      role: 'user',
      content: `DTM ${subject} savoli: "${question}"\nVariantlar: ${options.map((o,i)=>`${['A','B','C','D'][i]}) ${o}`).join(', ')}\n\nTo'g'ri javobni ko'rsatmasdan, 2-3 jumlada maslahat ber (o'zbek tilida).`,
    }],
    max_tokens: 200,
  });
  return res.choices[0].message.content;
}

// ─── Rasm yaratish ────────────────────────────────────────────────────────────
async function generateImage(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'placeholder') throw new Error('GEMINI_API_KEY sozlanmagan');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: `Create an image: ${prompt}. Style: clean, modern.` }] }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  }, { timeout: 30000 });
  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  const img = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));
  if (!img) throw new Error('Rasm yaratishda xatolik');
  return { base64: img.inlineData.data, mimeType: img.inlineData.mimeType };
}

// ─── Kaloriya tahlili ─────────────────────────────────────────────────────────
async function analyzeCalorie(imageBase64, mimeType = 'image/jpeg') {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'placeholder') throw new Error('GEMINI_API_KEY sozlanmagan');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const response = await axios.post(url, {
    contents: [{
      parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: `Bu ovqat rasmini tahlil qil. Faqat JSON: {"foodName":"...","calories":0,"protein":0,"fat":0,"carbs":0,"tips":"..."}` }
      ]
    }],
  }, { timeout: 30000 });
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Tahlil natijasi olishda xatolik');
  return JSON.parse(match[0]);
}

// ─── Video ────────────────────────────────────────────────────────────────────
async function generateVideo(prompt) {
  const key = process.env.FAL_API_KEY;
  if (!key || key === 'placeholder') throw new Error('FAL_API_KEY sozlanmagan');
  const headers = { 'Authorization': `Key ${key}` };
  const submit = await axios.post(
    'https://queue.fal.run/fal-ai/kling-video/v2.1/standard/text-to-video',
    { prompt, duration: '5', aspect_ratio: '9:16' },
    { headers }
  );
  const reqId = submit.data.request_id;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const s = await axios.get(`https://queue.fal.run/fal-ai/kling-video/requests/${reqId}/status`, { headers });
    if (s.data.status === 'COMPLETED') {
      const r = await axios.get(`https://queue.fal.run/fal-ai/kling-video/requests/${reqId}`, { headers });
      return r.data?.video?.url || null;
    }
    if (s.data.status === 'FAILED') throw new Error('Video yaratishda xatolik');
  }
  throw new Error('Video yaratish vaqti tugadi');
}

module.exports = { streamChat, generateDocument, getTestHint, generateImage, analyzeCalorie, generateVideo };
