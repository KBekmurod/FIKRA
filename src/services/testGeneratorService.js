// ─── Test Generator Service ──────────────────────────────────────────────────
// Foydalanuvchining o'z materiallaridan DeepSeek AI yordamida test savollar yaratish.
//
// Asosiy qoidalar:
//   • Material matni AI'ga beriladi, AI 4 variantli test savollar qaytaradi
//   • Natija JSON formatida keladi — parse qilinadi va PersonalTest'ga saqlanadi
//   • Savol soni materialning uzunligiga qarab taklif qilinadi

const PersonalTest   = require('../models/PersonalTest');
const StudyMaterial  = require('../models/StudyMaterial');
const User           = require('../models/User');
const { SUBJECT_META } = require('./examService');
const { logger }     = require('../utils/logger');

// ─── DeepSeek lazy init ───────────────────────────────────────────────────────
let _ds = null;
function _deepseek() {
  if (!_ds) {
    const k = process.env.DEEPSEEK_API_KEY;
    if (!k || k === 'placeholder') throw new Error('DEEPSEEK_API_KEY sozlanmagan');
    const OpenAI = require('openai');
    _ds = new OpenAI({ apiKey: k, baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1' });
  }
  return _ds;
}

// Timeout helper for AI calls
async function _safeDeepseekCall(prompt, maxTokens, temperature) {
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("AI server javob berishda kechikdi (Timeout). Jarayon bekor qilindi.")), 170000)
  );
  return Promise.race([
    _deepseek().chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
    timeoutPromise
  ]);
}

// ─── Nechta savol yaratish mumkinligini taxminlash ───────────────────────────
// Har taxminan 500 belgi uchun 1 ta savol
// Min: 3, Max: 20
function estimateQuestionCount(charCount) {
  const count = Math.floor(charCount / 500);
  return Math.min(20, Math.max(3, count));
}

// ─── AI Prompt: materialdan test yaratish ────────────────────────────────────
function _buildPrompt(subjectName, materialContent, count, wasAiAdjusted = false, subjectId = null) {
  const safeMaterial = materialContent.slice(0, 14000);
  const adjustNote = wasAiAdjusted
    ? `\nMUHIM: Material biroz cheklangan, lekin sizdan ${count} ta sifatli test yaratishingiz so'raladi. Materialdagi g'oyalarni kengaytirib, shu fan/mavzu doirasida mantiqiy savollar tuzing — lekin barcha javoblar fan haqiqatlariga mos bo'lsin.`
    : '';

  // ─── Fan bo'yicha maxsus ko'rsatmalar (foydalanuvchiga ko'rinmaydi) ─────
  const { getSubjectPrompt } = require('./subjectPrompts');
  const subjectSpecific = subjectId ? getSubjectPrompt(subjectId) : '';
  const subjectNote = subjectSpecific
    ? `\n\n═══ ${subjectName.toUpperCase()} FAN MAXSUS KO'RSATMALARI ═══\n${subjectSpecific}\n═══════════════════════════════════════════\n`
    : '';

  return `Sen DTM imtihoniga tayyorlovchi AI o'qituvchisan.

Quyidagi o'quv materialidan AYNAN ${count} ta test savol yarat.

Fan: ${subjectName}
${subjectNote}
Material:
"""
${safeMaterial}
"""${adjustNote}

QOIDALAR VA PREMIUM ESTETIKA:
1. AYNAN ${count} ta savol tuzing — kam ham emas, ko'p ham emas.
2. SAVOL SIFATI (Premium daraja): Savollar shunchaki faktni so'ramasin (qachon, kim, qayerda). Savollar abituriyentning mantiqiy fikrlashini, qoidalarni amaliyotga qo'llay olishini, tahlil qila olishini sinaydigan, o'ylantiradigan va ilmiy uslubda bo'lishi shart.
3. ESTETIK IFODALASH: Savollarni HECH QACHON "Matnda...", "Ushbu matnga ko'ra...", "Yuqoridagi" kabi so'zlar bilan boshlamang. Savol mustaqil, ravon va ilmiy xulosalangan bo'lishi kerak. Gaplar sintaktik jihatdan mukammal va jozibador qurilsin.
4. MANTIQIY CHALG'ITUVCHILAR (Distractors): Noto'g'ri variantlar (A, B, C, D) shunchaki tasodifiy so'zlar emas, balki eng ko'p chalg'itadigan, ilmiy jihatdan mantiqiy ko'rinadigan "tuzoq" variantlar bo'lishi shart. Qolgan 3 ta noto'g'ri variant to'g'ri variant bilan bir xil uzunlik va uslubda yozilsin.
5. DTM STANDARTI: Bitta savolda ikkita to'g'ri javob bo'lmasligi, javoblar aniq va bir ma'noli bo'lishi qat'iy talab qilinadi.
6. TAKRORLANMASLIK: Agar oldin shu mavzuda test tuzgan bo'lsangiz, uni umuman takrorlamang. Har safar o'zgacha yondashuv va yangi rakursdan savol oling.
7. TUSHUNTIRISH (Explanation): To'g'ri javob nega to'g'riligi va eng asosiysi noto'g'ri javoblar nega xato ekanligi haqida 2-3 jumlali o'ta sifatli ilmiy tushuntirish yozing.
8. Yuqoridagi fan maxsus ko'rsatmalariga QAT'IY RIOYA QILING.

FAQAT quyidagi JSON formatda javob ber:
{
  "questions": [
    {
      "question": "Savol matni",
      "options": ["A", "B", "C", "D"],
      "answer": 0,
      "explanation": "To'g'ri javob nima uchun to'g'ri (1-2 jumla)",
      "topic": "Mavzu nomi"
    }
  ]
}

"answer" — to'g'ri variantning 0-indexed raqami (0=A, 1=B, 2=C, 3=D).`;
}

function _buildFlashcardPrompt(subjectName, materialContent, count, subjectId = null) {
  const safeMaterial = materialContent.slice(0, 20000); // 20k characters for flashcards
  return `Sen ta'limiy AI yordamchisan.
Quyidagi o'quv materialidan AYNAN ${count} ta qisqa, tushunarli Flashcard (savol-javob yoki fakt-izoh) yarat.

Fan: ${subjectName}
Material:
"""
${safeMaterial}
"""

QOIDALAR:
1. AYNAN ${count} ta flashcard yarat.
2. "front" da qisqa savol, atama yoki faktning boshlanishi yoziladi (Masalan: "Amir Temur qachon tug'ilgan?" yoki "Nyutonning 1-qonuni").
3. "back" da aniq va qisqa javob, tushuntirish yoziladi (Masalan: "1336-yil 9-aprel" yoki "Jismga tashqi kuch ta'sir etmaguncha u o'zining tinch yoki tekis harakat holatini saqlaydi").
4. "topic" da mavzu nomi ko'rsatiladi.

FAQAT quyidagi JSON formatda javob ber:
{
  "flashcards": [
    {
      "front": "qisqa savol yoki atama",
      "back": "qisqa javob yoki izoh",
      "topic": "Mavzu"
    }
  ]
}`;
}

// ─── AI javobini parse qilish ─────────────────────────────────────────────────
function _parseAiResponse(text) {
  let clean = text.trim();
  
  // 1. Agar AI markdown (```json ... ```) ichiga solgan bo'lsa
  const mdMatch = clean.match(/```(?:json)?([\s\S]*?)```/i);
  if (mdMatch) {
    clean = mdMatch[1].trim();
  } else {
    // 2. Agar shunchaki matn bilan qo'shib yozgan bo'lsa, faqat JSON qismini kesib olamiz
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(clean);
    
    // Agar AI { "flashcards": [...] } shaklida qaytargan bo'lsa (lekin biz test savollar kutmoqdamiz)
    const questionsArray = parsed.questions || parsed; // ba'zan to'g'ridan to'g'ri massiv qaytaradi
    if (!Array.isArray(questionsArray)) {
      throw new Error('questions massivi topilmadi');
    }

    const validated = questionsArray
      .filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'number')
      .map((q, idx) => ({
        idx,
        question:    String(q.question).trim(),
        options:     q.options.map(o => String(o).trim()),
        answer:      Math.min(3, Math.max(0, Math.round(q.answer))),
        explanation: String(q.explanation || '').trim(),
        topic:       String(q.topic || '').trim(),
      }));

    if (validated.length === 0) {
      throw new Error('Yaroqli savollar topilmadi');
    }
    return validated;
  } catch (err) {
    logger.error('AI response parse error:', err.message, '\nRaw:', text.slice(0, 300));
    throw new Error('AI javobini o\'qishda xatolik. Qaytadan urinib ko\'ring.');
  }
}

// ─── Standart test sonlari ────────────────────────────────────────────────
// Qat'iy qoidalar:
//   • Majburiy fan: 10 ta savol
//   • Mutaxassislik fan: 30 ta savol
function getStandardCount(subjectId) {
  const meta = SUBJECT_META[subjectId];
  if (!meta) return 10;
  return meta.block === 'majburiy' ? 10 : 30;
}

// ─── Yetarlilik tekshirish (UI uchun) ─────────────────────────────────────
async function checkMaterialSufficiency(userId, folderId) {
  const MaterialFolder = require('../models/MaterialFolder');
  const folder = await MaterialFolder.findOne({ _id: folderId, userId, isActive: true }).lean();
  if (!folder) throw new Error("Papka topilmadi");

  const StudyMaterial = require('../models/StudyMaterial');
  const materials = await StudyMaterial.find({ folderId, userId, isActive: true }).lean();
  
  const totalChars = materials.reduce((sum, m) => sum + m.charCount, 0);
  const standardCount = folder.context 
    ? (folder.context === 'majburiy' ? 10 : 30) 
    : getStandardCount(folder.subjectId);
    
  const requiredChars = standardCount * 500;     // sifatli savol uchun
  const minimumChars  = 2000;                     // AI yetkazib berishi uchun min

  return {
    folderId,
    subjectId: folder.subjectId,
    title: folder.title,
    charCount: totalChars,
    standardCount,
    requiredChars,
    minimumChars,
    isSufficient: totalChars >= requiredChars,
    canAiFill: totalChars >= minimumChars && totalChars < requiredChars,
    isTooSmall: totalChars < minimumChars,
    hasGeneratedTest: folder.testStatus === 'has_test',
  };
}

// ─── Asosiy: papka uchun standart test yaratish ───────────────────────────
// QAT'IY QOIDA:
//   • 1 Papka = N Material = N Test
//   • Standart son: majburiy=10, mutaxassislik=30
//   • Yetarli emas bo'lsa: opt='ai_fill' yoki 'add_material'
async function generateForFolder(userId, { folderId, opt = 'standard' }) {
  const MaterialFolder = require('../models/MaterialFolder');
  const StudyMaterial  = require('../models/StudyMaterial');

  const folder = await MaterialFolder.findOne({ _id: folderId, userId, isActive: true });
  if (!folder) throw new Error('Papka topilmadi');

  // Papkadagi barcha materiallarni yig'amiz
  const materials = await StudyMaterial.find({ folderId, userId, isActive: true }).sort({ createdAt: 1 });
  if (materials.length === 0) throw new Error('Papkada hech qanday material yo\'q');

  // Limit
  const user = await User.findById(userId);
  if (!user) throw new Error('Foydalanuvchi topilmadi');
  const genLimit = User.PLAN_LIMITS[user.effectivePlan()].testsGen;
  if (genLimit <= 0) throw new Error('Test generatsiyasi joriy obunada mavjud emas');
  if (genLimit !== Infinity) {
    const used = user.getAiUsage('testsGen');
    if (used >= genLimit) {
      throw new Error(`Kunlik test generatsiyasi limiti tugadi (${used}/${genLimit})`);
    }
  }

  const standardCount = folder.context
    ? (folder.context === 'majburiy' ? 10 : 30)
    : getStandardCount(folder.subjectId);
  const requiredChars = standardCount * 500;
  const minimumChars  = 2000;

  const totalCharCount = materials.reduce((sum, m) => sum + m.charCount, 0);

  // Yetarlilik tekshirish
  if (totalCharCount < requiredChars) {
    if (totalCharCount < minimumChars) {
      throw new Error('Material hajmi juda kichik (minimum 2,000 belgi kerak). Iltimos papkaga yana material qo\'shing.');
    }
    if (opt !== 'ai_fill') {
      throw new Error(`Material hajmi to'liq yetarli emas (${totalCharCount}/${requiredChars} belgi). ai_fill yoki add_material tanlang.`);
    }
  }

  const wasAiAdjusted = totalCharCount < requiredChars && opt === 'ai_fill';

  // Generatsiya boshlandi belgisini qo'yamiz
  folder.testStatus = 'generating';
  folder.generationLog.requestedAt = new Date();
  folder.generationLog.aiAdjustedContent = wasAiAdjusted;
  await folder.save();

  const subjectName = SUBJECT_META[folder.subjectId]?.name || folder.subjectId;

  // Materiallarni birlashtirish va Chunking (Silent Truncation yechimi)
  let combinedContent = materials.map(m => m.content).join('\n\n---\n\n');
  const MAX_CHUNK_LENGTH = 35000;
  const MAX_QUESTIONS_PER_BATCH = 10;

  const chunksByText = Math.ceil(combinedContent.length / MAX_CHUNK_LENGTH) || 1;
  const chunksByQuestions = Math.ceil(standardCount / MAX_QUESTIONS_PER_BATCH) || 1;
  const actualBatches = Math.min(Math.max(chunksByText, chunksByQuestions), 10);
  
  const chunkSize = Math.ceil(combinedContent.length / actualBatches);

  // AI generatsiya (Multi-step map-reduce)
  let questions = [];
  try {
    let generatedTopics = [];

    for (let i = 0; i < actualBatches; i++) {
      const questionsToGenerate = (i === actualBatches - 1) 
        ? standardCount - questions.length 
        : Math.floor(standardCount / actualBatches);
        
      if (questionsToGenerate <= 0) continue;

      const chunkContent = combinedContent.slice(i * chunkSize, (i + 1) * chunkSize);

      // Add context about already generated questions to avoid duplication
      let previousContext = '';
      if (generatedTopics.length > 0) {
        previousContext = `\n\nDIQQAT: Sen oldingi so'rovlarda quyidagi mavzularda savollar tuzding:\n- ${generatedTopics.slice(-15).join('\n- ')}\nIltimos, endi faqat YANGI mavzular, tushunchalar yoki materialning boshqa qismlaridan savol tuz. Eski savollarni umuman takrorlama.`;
      }

      const prompt = _buildPrompt(subjectName, chunkContent, questionsToGenerate, wasAiAdjusted, folder.subjectId) + previousContext;
      
      const res = await _safeDeepseekCall(prompt, 6000, 0.5);
      
      const batchQuestions = _parseAiResponse(res.choices[0].message.content);
      questions = questions.concat(batchQuestions);
      
      generatedTopics = generatedTopics.concat(batchQuestions.map(q => q.topic).filter(Boolean));
    }
    
    // Exact count and re-index
    questions = questions.slice(0, standardCount).map((q, idx) => ({ ...q, idx }));

  } catch (err) {
    folder.testStatus = 'generation_failed';
    folder.generationLog.errorMessage = err.message;
    await folder.save();
    logger.error('Folder test generation error:', err.message);
    throw new Error('AI test yaratishda xatolik. Qaytadan urinib ko\'ring.');
  }

  // PersonalTest yaratish
  const test = await PersonalTest.create({
    userId,
    subjectId: folder.subjectId,
    subjectName,
    materialIds: materials.map(m => m._id),
    folderId: folder._id,
    folderTitle: folder.title,
    questions,
    totalQuestions: questions.length,
    testType: 'material',
    status: 'in_progress',
    startTime: new Date(),
  });

  folder.testId = test._id;
  folder.testStatus = 'has_test';
  folder.generationLog.completedAt = new Date();
  await folder.save();

  for (const m of materials) {
    m.hasGeneratedTest = true;
    m.testGenCount += 1;
    await m.save();
  }

  // Usage counter
  await User.findOneAndUpdate({ _id: userId }, [{
    $set: {
      aiUsage: {
        $cond: [
          { $eq: ['$aiUsage.date', User.todayKey()] },
          { $mergeObjects: ['$aiUsage', { testsGen: { $add: [{ $ifNull: ['$aiUsage.testsGen', 0] }, 1] } }] },
          { date: User.todayKey(), hints: 0, chats: 0, docs: 0, images: 0, calories: 0, ocrUploads: 0, fileUploads: 0, testsGen: 1 },
        ],
      },
    },
  }]);

  return {
    test,
    questions,
    folder: await MaterialFolder.findById(folder._id).lean(),
    wasAiAdjusted,
  };
}

// ─── Flashcards generatsiyasi ────────────────────────────────────────────────
async function generateFlashcardsForFolder(userId, folderId) {
  const MaterialFolder = require('../models/MaterialFolder');
  const StudyMaterial = require('../models/StudyMaterial');
  const FlashcardDeck = require('../models/FlashcardDeck');
  const User = require('../models/User');

  const folder = await MaterialFolder.findOne({ _id: folderId, userId, isActive: true });
  if (!folder) throw new Error('Papka topilmadi');

  // Check if deck already exists
  let deck = await FlashcardDeck.findOne({ folderId });
  if (deck && deck.status === 'ready') return deck;

  const materials = await StudyMaterial.find({ folderId, userId, isActive: true }).sort({ createdAt: 1 });
  if (materials.length === 0) throw new Error("Papkada hech qanday material yo'q");

  if (!deck) {
    deck = await FlashcardDeck.create({ userId, folderId, status: 'generating' });
  } else {
    deck.status = 'generating';
    await deck.save();
  }

  const subjectName = SUBJECT_META[folder.subjectId]?.name || folder.subjectId;
  let combinedContent = materials.map(m => m.content).join('\n\n---\n\n');
  if (combinedContent.length > 20000) {
    combinedContent = combinedContent.slice(-20000);
  }

  const count = 20; // Generate 20 flashcards per deck

  try {
    const prompt = _buildFlashcardPrompt(subjectName, combinedContent, count, folder.subjectId);
    const res = await _safeDeepseekCall(prompt, 3000, 0.5);

    let clean = res.choices[0].message.content.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const parsed = JSON.parse(clean);
    
    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      throw new Error('flashcards array topilmadi');
    }

    deck.cards = parsed.flashcards.map(f => ({
      front: String(f.front || '').trim(),
      back: String(f.back || '').trim(),
      topic: String(f.topic || '').trim(),
    }));
    deck.status = 'ready';
    await deck.save();

  } catch (err) {
    deck.status = 'failed';
    await deck.save();
    throw new Error('Flashcard generatsiyasida xatolik: ' + err.message);
  }

  return deck;
}

// ─── Eski: bir nechta materialdan test yaratish (kelajak uchun saqlanadi) ──
async function generateFromMaterials(userId, { subjectId, materialIds, count }) {
  if (!subjectId || !SUBJECT_META[subjectId]) {
    throw new Error(`Noma'lum fan: ${subjectId}`);
  }

  const user = await User.findById(userId);
  if (!user) throw new Error('Foydalanuvchi topilmadi');

  const genLimit = User.PLAN_LIMITS[user.effectivePlan()].testsGen;
  if (genLimit <= 0) throw new Error('Test generatsiyasi joriy obunada mavjud emas');
  if (genLimit !== Infinity) {
    const used = user.getAiUsage('testsGen');
    if (used >= genLimit) {
      throw new Error(`Kunlik test generatsiyasi limiti tugadi (${used}/${genLimit})`);
    }
  }

  const materials = await StudyMaterial.find({
    _id: { $in: materialIds },
    userId,
    isActive: true,
  }).lean();

  if (materials.length === 0) {
    throw new Error('Material topilmadi');
  }

  const combinedContent = materials.map(m => m.content).join('\n\n---\n\n');
  const safeCount = getStandardCount(subjectId);
  const subjectName = SUBJECT_META[subjectId]?.name || subjectId;

  const prompt = _buildPrompt(subjectName, combinedContent, safeCount, false, subjectId);

  let aiResponse;
  try {
    const res = await _safeDeepseekCall(prompt, 6000, 0.4);
    aiResponse = res.choices[0].message.content;
  } catch (err) {
    logger.error('DeepSeek API error (testGen):', err.message);
    throw new Error('AI xizmati bilan bog\'lanishda xatolik. Biroz kutib qaytadan urinib ko\'ring.');
  }

  const questions = _parseAiResponse(aiResponse);

  const test = await PersonalTest.create({
    userId,
    subjectId,
    subjectName,
    materialIds: materials.map(m => m._id),
    questions,
    totalQuestions: questions.length,
    testType: 'material',
    status: 'in_progress',
    startTime: new Date(),
  });

  await User.findOneAndUpdate({ _id: userId }, [{
    $set: {
      aiUsage: {
        $cond: [
          { $eq: ['$aiUsage.date', User.todayKey()] },
          { $mergeObjects: ['$aiUsage', { testsGen: { $add: [{ $ifNull: ['$aiUsage.testsGen', 0] }, 1] } }] },
          { date: User.todayKey(), hints: 0, chats: 0, docs: 0, images: 0, calories: 0, ocrUploads: 0, fileUploads: 0, testsGen: 1 },
        ],
      },
    },
  }]);

  await StudyMaterial.updateMany(
    { _id: { $in: materials.map(m => m._id) } },
    { $inc: { testGenCount: 1 } }
  );

  return { test, questions };
}

// ─── Mini-test: xato savollardan ─────────────────────────────────────────────
// Xato qilingan savollar asosida AI yangi shunga o'xshash savollar yaratadi
async function generateMiniTest(userId, { subjectId, wrongAnswers, count = 10 }) {
  const user = await User.findById(userId);
  if (!user) throw new Error('Foydalanuvchi topilmadi');

  const genLimit = User.PLAN_LIMITS[user.effectivePlan()].testsGen;
  if (genLimit <= 0) throw new Error('Test generatsiyasi joriy obunada mavjud emas');
  if (genLimit !== Infinity) {
    const used = user.getAiUsage('testsGen');
    if (used >= genLimit) throw new Error(`Kunlik limit tugadi`);
  }

  const subjectName = SUBJECT_META[subjectId]?.name || subjectId;
  const safeCount = Math.min(15, Math.max(3, count));

  // Xato savollar kontekstini tayyorlash
  const wrongContext = wrongAnswers.slice(0, 10).map((a, i) =>
    `${i + 1}. Savol: "${a.question}"\n   To'g'ri javob: ${a.options[a.correctAnswer] || ''}\n   Mavzu: ${a.topic || ''}`
  ).join('\n\n');

  const prompt = `Sen DTM imtihoniga tayyorlovchi eng kuchli AI o'qituvchisan.

Foydalanuvchi quyidagi ${subjectName} fanidan savollarni NOTO'G'RI javob bergan:

${wrongContext}

VAZIFA:
Bu xatolar bo'yicha jami ${safeCount} ta YANGI, MUTLAQO BOSHQA test savollarini tuzing. 
Maqsad: foydalanuvchi shu qoidalarni/mavzularni to'liq tushunib olganini sinash.

QAT'IY QOIDALAR (BUZILMASIN):
1. Yuborilgan noto'g'ri savollarni ASLO ko'chirmang!
2. Faqat variantlar ketma-ketligini almashtirib yoki 1-2 ta so'zni o'zgartirib qaytarib BEMANG! Bu qat'iyan man etiladi.
3. Shu mavzudagi/qoidadagi umuman BOSHQA misollar, BOSHQA raqamlar, BOSHQA matnlar va BOSHQA shartlar o'ylab toping.
4. ESTETIKA: Savollar mustaqil va to'g'ridan-to'g'ri bo'lsin. Hech qachon "Matnda", "Berilgan savolda" kabi iboralarni ishlatmang. Gaplar sintaktik mukammal, o'ylantiradigan va mantiqiy bo'lsin.
5. MANTIQIY CHALG'ITUVCHILAR (Distractors): Noto'g'ri variantlar eng ko'p chalg'itadigan, o'quvchini ikkilantiradigan mantiqiy "tuzoq" variantlar bo'lsin va to'g'ri javob bilan bir xil uslubda yozilsin.

FAQAT quyidagi JSON formatda javob ber:
{
  "questions": [
    {
      "question": "Yepyangi savol matni...",
      "options": ["A varianti", "B varianti", "C varianti", "D varianti"],
      "answer": 0,
      "explanation": "Nima uchun aynan bu javob to'g'riligi va qaysi qoidaga asoslangani haqida tushuntirish (1-2 jumla)",
      "topic": "Mavzu nomi"
    }
  ]
}`;

  let aiResponse;
  try {
    const res = await _safeDeepseekCall(prompt, 3000, 0.5);
    aiResponse = res.choices[0].message.content;
  } catch (err) {
    throw new Error('AI xizmati bilan bog\'lanishda xatolik.');
  }

  const questions = _parseAiResponse(aiResponse);

  const test = await PersonalTest.create({
    userId,
    subjectId,
    subjectName,
    materialIds: [],
    questions,
    totalQuestions: questions.length,
    testType: 'mini',
    status: 'in_progress',
    startTime: new Date(),
  });

  // Usage
  await User.findOneAndUpdate({ _id: userId }, [{
    $set: {
      aiUsage: {
        $cond: [
          { $eq: ['$aiUsage.date', User.todayKey()] },
          { $mergeObjects: ['$aiUsage', { testsGen: { $add: [{ $ifNull: ['$aiUsage.testsGen', 0] }, 1] } }] },
          { date: User.todayKey(), hints: 0, chats: 0, docs: 0, images: 0, calories: 0, ocrUploads: 0, fileUploads: 0, testsGen: 1 },
        ],
      },
    },
  }]);

  return { test, questions };
}

// ─── Javob saqlash ───────────────────────────────────────────────────────────
async function submitAnswer(testId, userId, questionIdx, selectedOption) {
  const test = await PersonalTest.findById(testId);
  if (!test) throw new Error('Test topilmadi');
  if (String(test.userId) !== String(userId)) throw new Error('Ruxsat yo\'q');
  if (test.status !== 'in_progress') throw new Error('Test allaqachon yakunlangan');

  const q = test.questions[questionIdx];
  if (!q) throw new Error('Savol topilmadi');

  // Allaqachon javob berilganmi?
  const existing = test.answers.find(a => a.questionIdx === questionIdx);
  if (existing) {
    return { isCorrect: existing.isCorrect, correctIndex: q.answer, explanation: q.explanation };
  }

  const isCorrect = selectedOption === q.answer;
  test.answers.push({ questionIdx, selectedOption, isCorrect, answeredAt: new Date() });
  await test.save();

  return { isCorrect, correctIndex: q.answer, explanation: q.explanation };
}

// ─── Testni yakunlash ─────────────────────────────────────────────────────────
// finalAnswers ixtiyoriy — frontend yuborgan oxirgi javoblar (offline holatda)
// Backend mavjud answers va finalAnswers'ni birlashtirib qayta hisoblaydi
async function finishTest(testId, userId, finalAnswers = null) {
  const test = await PersonalTest.findById(testId);
  if (!test) throw new Error('Test topilmadi');
  if (String(test.userId) !== String(userId)) throw new Error('Ruxsat yo\'q');
  if (test.status !== 'in_progress') throw new Error('Test allaqachon yakunlangan');

  // QUSUR TUZATILDI: agar frontend final answers yuborsa, ularni birlashtir
  // Bu offline holatda saqlanmagan javoblarni tiklaydi
  if (Array.isArray(finalAnswers) && finalAnswers.length > 0) {
    const existingMap = new Map(test.answers.map(a => [a.questionIdx, a]));

    for (const fa of finalAnswers) {
      const qIdx = fa.questionIdx ?? fa.qIdx;
      const sel = fa.selectedOption ?? fa.selected;
      if (qIdx === undefined || sel === undefined) continue;

      const q = test.questions[qIdx];
      if (!q) continue;

      const isCorrect = sel === q.answer;

      if (existingMap.has(qIdx)) {
        // Mavjud — yangilamaymiz (server-side answer ustun)
        continue;
      }
      // Yangi — qo'shamiz
      test.answers.push({
        questionIdx: qIdx,
        selectedOption: sel,
        isCorrect,
        answeredAt: new Date(),
      });
    }
  }

  // Qayta hisoblash (sanity check)
  let totalCorrect = 0;
  for (const ans of test.answers) {
    const q = test.questions[ans.questionIdx];
    if (q && ans.selectedOption === q.answer) {
      totalCorrect++;
      // isCorrect yangilash (agar noto'g'ri saqlangan bo'lsa)
      if (!ans.isCorrect) ans.isCorrect = true;
    } else if (q && ans.isCorrect) {
      ans.isCorrect = false; // tuzatish
    }
  }

  const totalQ = test.questions.length;
  const scorePercent = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  test.status = 'completed';
  test.endTime = new Date();
  test.totalCorrect = totalCorrect;
  test.totalQuestions = totalQ;
  test.scorePercent = scorePercent;
  await test.save();

  return { test, totalCorrect, totalQuestions: totalQ, scorePercent };
}

// ─── Test tarixini olish ──────────────────────────────────────────────────────
async function getTestHistory(userId, { subjectId, testType, page = 1 } = {}) {
  const filter = { userId, status: 'completed' };
  if (subjectId) filter.subjectId = subjectId;
  if (testType) filter.testType = testType;

  const limit = 20;
  const skip  = (page - 1) * limit;

  const [tests, total] = await Promise.all([
    PersonalTest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-questions -answers')
      .populate('folderId', 'title context miniTestId materialId')
      .lean(),
    PersonalTest.countDocuments(filter),
  ]);

  // folderInfo formatlash (frontend uchun)
  const MaterialFolder = require('../models/MaterialFolder');
  const StudyMaterial = require('../models/StudyMaterial');

  // Material titles uchun batch fetch
  const materialIdsSet = new Set();
  tests.forEach(t => {
    if (t.folderId && t.folderId.materialId) materialIdsSet.add(String(t.folderId.materialId));
  });
  const materials = materialIdsSet.size > 0
    ? await StudyMaterial.find({ _id: { $in: Array.from(materialIdsSet) } }).select('_id title').lean()
    : [];
  const matMap = {};
  materials.forEach(m => { matMap[String(m._id)] = m.title; });

  const formatted = tests.map(t => {
    const out = { ...t };
    if (t.folderId && typeof t.folderId === 'object') {
      out.folderInfo = {
        title:   t.folderId.title,
        context: t.folderId.context,
        materialTitle: t.folderId.materialId ? matMap[String(t.folderId.materialId)] : undefined,
        miniTestId: t.folderId.miniTestId,
      };
      out.folderId = t.folderId._id;
    } else if (t.folderTitle) {
      // Agar papka butunlay o'chirilgan yoki topilmagan bo'lsa, 'muhrlangan' nomidan foydalanamiz
      out.folderInfo = {
        title: `${t.folderTitle} (O'chirilgan)`,
        context: 'majburiy', // default
        isDeleted: true
      };
    }
    return out;
  });

  return { tests: formatted, total, page, pages: Math.ceil(total / limit) };
}

// ─── Bitta testni to'liq olish (review uchun) ────────────────────────────────
async function getTestReview(testId, userId) {
  const test = await PersonalTest.findById(testId).lean();
  if (!test) throw new Error('Test topilmadi');
  if (String(test.userId) !== String(userId)) throw new Error('Ruxsat yo\'q');
  return test;
}

// ─── Nechta savol yaratish mumkinligini taxminlash (UI uchun) ─────────────────
async function estimateForSubject(userId, subjectId) {
  const materials = await StudyMaterial.find({
    userId,
    subjectId,
    isActive: true,
  }).select('charCount title').lean();

  if (materials.length === 0) {
    return { canGenerate: false, reason: 'material_not_found', materials: [] };
  }

  const totalChars = materials.reduce((s, m) => s + m.charCount, 0);
  const estimatedCount = estimateQuestionCount(totalChars);

  return {
    canGenerate: true,
    estimatedCount,
    totalChars,
    materials: materials.map(m => ({ _id: m._id, title: m.title, charCount: m.charCount })),
  };
}

module.exports = {
  estimateQuestionCount,
  getStandardCount,
  checkMaterialSufficiency,
  generateForFolder,           // YANGI: papka uchun qat'iy standart
  generateFlashcardsForFolder, // YANGI: Swipe Flashcards uchun
  generateFromMaterials,       // Eski (kelajak uchun)
  generateMiniTest,
  submitAnswer,
  finishTest,
  getTestHistory,
  getTestReview,
  estimateForSubject,
  // Internal API — aiTestService va boshqa servislar uchun
  _internal: {
    deepseek: _deepseek,
    parseAiResponse: _parseAiResponse,
    buildPrompt: _buildPrompt,
  },
};
