const axios = require('axios');
const { logger } = require('../utils/logger');
const ChatHistory = require('../models/ChatHistory');

// ─── Lazy DeepSeek client ──────────────────────────────────────────────────
// Required env variable: DEEPSEEK_API_KEY — DeepSeek API kaliti
// Optional env variable: DEEPSEEK_BASE_URL — DeepSeek API manzili (default: https://api.deepseek.com/v1)
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

// ─── AI Chat (SSE stream) ──────────────────────────────────────────────────
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

// ─── Hujjat yaratish ───────────────────────────────────────────────────────
async function generateDocument(prompt, format, history = []) {
  const res = await deepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: `Sen hujjat yaratish AI yordamchisisan. ${format} formatida, markdown da, o'zbek tilida yoz.` },
      ...history.slice(-10),
      { role: 'user', content: prompt },
    ],
    max_tokens: 2000,
  });
  return res.choices[0].message.content;
}

// ─── DTM test: maslahat (to'g'ri javob ochilmaydi) ─────────────────────────
async function getTestHint(question, options, subject) {
  const optsText = options.map((o, i) => `${['A','B','C','D'][i]}) ${o}`).join('\n');
  const res = await deepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [{
      role: 'user',
      content: `DTM ${subject} fanidan savol:\n\n${question}\n\nVariantlar:\n${optsText}\n\nTo'g'ri javobni aytmasdan, abituriyent o'zi topishi uchun 2-3 jumlada yo'l ko'rsat (o'zbek tilida). Mavzuni esga sol, lekin javobni ochib yuborma.`,
    }],
    max_tokens: 250,
    temperature: 0.5,
  });
  return res.choices[0].message.content;
}

// ─── DTM test: to'liq tushuntirish (savol yechilgandan keyin) ─────────────
// Bu loyihaning markaziy AI funksiyasi — abituriyent xato qilsa,
// joyida AI orqali mavzuni tushunib olishi mumkin
async function explainTestQuestion(question, options, subject) {
  const optsText = options.map((o, i) => `${['A','B','C','D'][i]}) ${o}`).join('\n');
  const res = await deepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [{
      role: 'system',
      content: `Sen FIKRA — abituriyentlarga DTM testlariga tayyorlovchi AI o'qituvchisan.
Vazifang: savolning mohiyatini, qoidalarni va to'g'ri yechim yo'lini O'ZBEK tilida, sodda va aniq tushuntirib berish.
Tushuntirish 4-7 jumla, ortiqcha gap yo'q. Markdown ishlatma. Asosiy qoida nomini bold qilma — oddiy matn.`
    }, {
      role: 'user',
      content: `${subject ? subject.toUpperCase() + ' fanidan' : ''} savol:\n\n"${question}"\n\nVariantlar:\n${optsText}\n\nTo'g'ri javobni va NIMA UCHUN aynan shu javob to'g'riligini batafsil tushuntir. Boshqa variantlarning xatosini ham qisqa ko'rsat.`,
    }],
    max_tokens: 500,
    temperature: 0.4,
  });
  return res.choices[0].message.content;
}

// ─── AI Chat xotira bilan (stateful) ──────────────────────────────────────
const MAX_CONTEXT_MESSAGES = 20;

async function chatWithMemory(userId, message) {
  // findOneAndUpdate upsert: foydalanuvchi tarixini topamiz yoki yangisini yaratamiz
  const history = await ChatHistory.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, messages: [] } },
    { upsert: true, new: true }
  );

  // Kontekst uchun oxirgi MAX_CONTEXT_MESSAGES ta xabarni olamiz
  const recentMessages = history.messages.slice(-MAX_CONTEXT_MESSAGES).map(m => ({
    role: m.role,
    content: m.content,
  }));

  const messagesToSend = [
    {
      role: 'system',
      content: "Sen FIKRA — DTM testlariga tayyorlovchi AI yordamchisan. O'zbek tilida samimiy, aniq va foydali javob ber.",
    },
    ...recentMessages,
    { role: 'user', content: message },
  ];

  const response = await deepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: messagesToSend,
    max_tokens: 1000,
    temperature: 0.7,
  });

  const assistantReply = response.choices[0].message.content;

  // Foydalanuvchi xabari va AI javobini tarixga saqlaymiz
  history.messages.push({ role: 'user', content: message });
  history.messages.push({ role: 'assistant', content: assistantReply });
  // Save history without blocking the reply on failure
  history.save().catch(err => logger.error('Failed to save chat history:', err.message));

  return assistantReply;
}

// ─── Rasm yaratish (Gemini 2.0 Flash Exp) ──────────────────────────────────
// Required env variable: GEMINI_API_KEY — Google Gemini API kaliti
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

// ─── Kaloriya tahlili (Gemini 2.5 Flash vision) ────────────────────────────
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

module.exports = {
  streamChat,
  generateDocument,
  chatWithMemory,
  getTestHint,
  explainTestQuestion,
  generateImage,
  analyzeCalorie,
};
