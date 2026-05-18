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

// ─── Nechta savol yaratish mumkinligini taxminlash ───────────────────────────
// Har taxminan 500 belgi uchun 1 ta savol
// Min: 3, Max: 20
function estimateQuestionCount(charCount) {
  const count = Math.floor(charCount / 500);
  return Math.min(20, Math.max(3, count));
}

// ─── AI Prompt: materialdan test yaratish ────────────────────────────────────
function _buildPrompt(subjectName, materialContent, count, wasAiAdjusted = false) {
  const safeMaterial = materialContent.slice(0, 14000);
  const adjustNote = wasAiAdjusted
    ? `\nMUHIM: Material biroz cheklangan, lekin sizdan ${count} ta sifatli test yaratishingiz so'raladi. Materialdagi g'oyalarni kengaytirib, shu fan/mavzu doirasida mantiqiy savollar tuzing — lekin barcha javoblar fan haqiqatlariga mos bo'lsin.`
    : '';

  return `Sen DTM imtihoniga tayyorlovchi AI o'qituvchisan.

Quyidagi o'quv materialidan AYNAN ${count} ta test savol yarat.

Fan: ${subjectName}

Material:
"""
${safeMaterial}
"""${adjustNote}

QOIDALAR:
1. AYNAN ${count} ta savol — kam ham emas, ko'p ham emas
2. Har bir savol material mavzusiga to'g'ridan-to'g'ri yoki bilvosita bog'liq bo'lsin
3. 4 ta variant (A, B, C, D) — bittasi to'g'ri, uchtasi mantiqli noto'g'ri
4. DTM uslubida — aniq, qisqa, bir ma'noli savollar
5. O'zbek tilida yoz
6. Mavzuni "topic" sifatida ko'rsat

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

// ─── AI javobini parse qilish ─────────────────────────────────────────────────
function _parseAiResponse(text) {
  // Markdown code block'larni olib tashlaymiz
  let clean = text.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(clean);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('questions massivi topilmadi');
    }

    const validated = parsed.questions
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
async function checkMaterialSufficiency(userId, materialId) {
  const StudyMaterial  = require('../models/StudyMaterial');
  const material = await StudyMaterial.findOne({ _id: materialId, userId, isActive: true }).lean();
  if (!material) throw new Error("Material topilmadi");

  const standardCount = getStandardCount(material.subjectId);
  const requiredChars = standardCount * 500;     // sifatli savol uchun
  const minimumChars  = 2000;                     // AI yetkazib berishi uchun min

  return {
    materialId,
    subjectId: material.subjectId,
    title: material.title,
    charCount: material.charCount,
    standardCount,
    requiredChars,
    minimumChars,
    isSufficient: material.charCount >= requiredChars,
    canAiFill: material.charCount >= minimumChars && material.charCount < requiredChars,
    isTooSmall: material.charCount < minimumChars,
    hasGeneratedTest: !!material.hasGeneratedTest,
    folderId: material.folderId,
  };
}

// ─── Asosiy: papka uchun standart test yaratish ───────────────────────────
// QAT'IY QOIDA:
//   • Bir material = bir test (1-1)
//   • Standart son: majburiy=10, mutaxassislik=30
//   • Yetarli emas bo'lsa: opt='ai_fill' yoki 'add_material'
async function generateForFolder(userId, { folderId, opt = 'standard' }) {
  const MaterialFolder = require('../models/MaterialFolder');
  const StudyMaterial  = require('../models/StudyMaterial');

  const folder = await MaterialFolder.findOne({ _id: folderId, userId, isActive: true });
  if (!folder) throw new Error('Papka topilmadi');

  if (folder.testStatus === 'has_test' && folder.testId) {
    throw new Error('Bu papkada test allaqachon yaratilgan');
  }

  // Material
  const material = await StudyMaterial.findById(folder.materialId);
  if (!material) throw new Error('Material topilmadi');
  if (material.hasGeneratedTest) {
    throw new Error('Bu materialdan test allaqachon yaratilgan');
  }

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
    : getStandardCount(material.subjectId);
  const requiredChars = standardCount * 500;
  const minimumChars  = 2000;

  // Yetarlilik tekshirish
  if (material.charCount < requiredChars) {
    if (material.charCount < minimumChars) {
      throw new Error('Material juda kichik (minimum 2,000 belgi kerak). Qo\'shimcha qo\'shing.');
    }
    if (opt !== 'ai_fill') {
      // Foydalanuvchi explicit ravishda ai_fill ni tanlashi kerak
      throw new Error(`Material yetarli emas (${material.charCount}/${requiredChars} belgi). ai_fill yoki add_material tanlang.`);
    }
  }

  const wasAiAdjusted = material.charCount < requiredChars && opt === 'ai_fill';

  // Generatsiya boshlandi belgisini qo'yamiz
  folder.testStatus = 'generating';
  folder.generationLog.requestedAt = new Date();
  folder.generationLog.aiAdjustedContent = wasAiAdjusted;
  await folder.save();

  const subjectName = SUBJECT_META[material.subjectId]?.name || material.subjectId;

  // AI generatsiya
  let questions;
  try {
    const prompt = _buildPrompt(subjectName, material.content, standardCount, wasAiAdjusted);
    const res = await _deepseek().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 6000,
      temperature: 0.4,
    });
    questions = _parseAiResponse(res.choices[0].message.content);
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
    subjectId: material.subjectId,
    subjectName,
    materialIds: [material._id],
    materialId: material._id,
    folderId: folder._id,
    questions,
    totalQuestions: questions.length,
    testType: 'material',
    status: 'in_progress',
    startTime: new Date(),
  });

  // Folderni va materialni yangilaymiz
  folder.testId = test._id;
  folder.testStatus = 'has_test';
  folder.generationLog.completedAt = new Date();
  await folder.save();

  material.hasGeneratedTest = true;
  material.testGenCount += 1;
  await material.save();

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

  const prompt = _buildPrompt(subjectName, combinedContent, safeCount);

  let aiResponse;
  try {
    const res = await _deepseek().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 6000,
      temperature: 0.4,
    });
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

  const prompt = `Sen DTM imtihoniga tayyorlovchi AI o'qituvchisan.

Foydalanuvchi quyidagi ${subjectName} fanidan savollarni NOTO'G'RI javob bergan:

${wrongContext}

Bu mavzular bo'yicha ${safeCount} ta YANGI, SHUNGA O'XSHASH lekin boshqa test savol yarat.
Maqsad: foydalanuvchi shu mavzularni mustahkamlashi.

FAQAT quyidagi JSON formatda javob ber:
{
  "questions": [
    {
      "question": "Savol matni...",
      "options": ["A varianti", "B varianti", "C varianti", "D varianti"],
      "answer": 0,
      "explanation": "Tushuntirish (1-2 jumla)",
      "topic": "Mavzu nomi"
    }
  ]
}`;

  let aiResponse;
  try {
    const res = await _deepseek().chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.5,
    });
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
async function finishTest(testId, userId) {
  const test = await PersonalTest.findById(testId);
  if (!test) throw new Error('Test topilmadi');
  if (String(test.userId) !== String(userId)) throw new Error('Ruxsat yo\'q');
  if (test.status !== 'in_progress') throw new Error('Test allaqachon yakunlangan');

  const totalCorrect = test.answers.filter(a => a.isCorrect).length;
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
  generateFromMaterials,       // Eski (kelajak uchun)
  generateMiniTest,
  submitAnswer,
  finishTest,
  getTestHistory,
  getTestReview,
  estimateForSubject,
};
