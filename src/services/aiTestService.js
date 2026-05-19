// ─── AI Blok & Free Test Generation Service ──────────────────────────────
// Foydalanuvchi o'z materiallaridan DTM yo'nalish (blok) yoki erkin tanlov
// test yaratishi uchun yangi servis.
//
// FIKRA testlari = admin database savollari
// AI blok/free testlar = foydalanuvchi o'z papkalari materiallaridan AI yaratadi

const PersonalTest = require('../models/PersonalTest');
const StudyMaterial = require('../models/StudyMaterial');
const MaterialFolder = require('../models/MaterialFolder');
const User = require('../models/User');
const examService = require('./examService');
const testGen = require('./testGeneratorService');
const { logger } = require('../utils/logger');

// ─── AI Blok test yaratish ────────────────────────────────────────────────
// Foydalanuvchi DTM yo'nalishini va har fan uchun papkalarni tanlaydi.
// AI standart sonlarda savol yaratadi: uztil(10) + math(10) + tarix(10) +
// spec1(30) + spec2(30) = 90 savol
//
// Body: {
//   direction: 'engineering',
//   subjects: {
//     uztil: { folderIds: ['...', '...'] },
//     math:  { folderIds: ['...'] },
//     tarix: { folderIds: ['...'] },
//     fizika:{ folderIds: ['...'] },  // spec1
//     // spec2 — direction'dan kelib chiqadi
//   }
// }
async function generateBlokTest(userId, { direction, subjects }) {
  const dirInfo = examService.DIRECTION_MAP[direction];
  if (!dirInfo) throw new Error(`Noma'lum yo'nalish: ${direction}`);

  const [spec1, spec2] = dirInfo.spec;

  // Limitni tekshirish
  const user = await User.findById(userId);
  const genLimit = User.PLAN_LIMITS[user.effectivePlan()].testsGen;
  if (genLimit <= 0) throw new Error("Test generatsiya joriy obunada mavjud emas");
  if (genLimit !== Infinity) {
    const used = user.getAiUsage('testsGen') || 0;
    if (used >= genLimit) throw new Error(`Kunlik limit tugadi (${used}/${genLimit})`);
  }

  // Har fan uchun savollar yaratish
  const compSubjects = ['uztil', 'math', 'tarix'];
  const allSubjects = [...compSubjects, spec1, spec2];
  const allQuestions = [];
  let globalIdx = 0;

  for (const subjectId of allSubjects) {
    const subjConfig = subjects?.[subjectId];
    if (!subjConfig?.folderIds || subjConfig.folderIds.length === 0) {
      throw new Error(`"${subjectId}" fani uchun papka tanlanmagan`);
    }

    // Papkalardan materiallarni yig'ish
    const folders = await MaterialFolder.find({
      _id: { $in: subjConfig.folderIds },
      userId,
      isActive: true,
    }).populate('materialId');

    if (folders.length === 0) {
      throw new Error(`"${subjectId}" fani uchun papkalar topilmadi`);
    }

    const combinedContent = folders
      .filter(f => f.materialId?.content)
      .map(f => f.materialId.content)
      .join('\n\n---\n\n');

    if (combinedContent.length < 1500) {
      throw new Error(`"${subjectId}" fani uchun material yetarli emas (${combinedContent.length} belgi)`);
    }

    // Savol soni: majburiy 10, mutaxassislik 30
    const isCompulsory = compSubjects.includes(subjectId);
    const count = isCompulsory ? 10 : 30;
    const subjectName = examService.SUBJECT_META[subjectId]?.name || subjectId;

    // AI prompt yaratish
    const subjQuestions = await _generateForSubject({
      subjectId, subjectName, content: combinedContent, count,
    });

    // Global index'ga ko'paytirish
    subjQuestions.forEach(q => {
      q.idx = globalIdx++;
      q.subjectId = subjectId;
      q.subjectName = subjectName;
    });

    allQuestions.push(...subjQuestions);
  }

  // PersonalTest yaratish
  const test = await PersonalTest.create({
    userId,
    subjectId: 'blok', // maxsus marker
    subjectName: `${dirInfo.name} (DTM blok)`,
    questions: allQuestions,
    totalQuestions: allQuestions.length,
    testType: 'ai_blok',
    direction,
    status: 'in_progress',
    startTime: new Date(),
    metadata: { direction, subjects },
  });

  // Usage counter
  await _incrementTestGen(userId);

  return {
    test,
    questions: allQuestions,
    direction,
    dirName: dirInfo.name,
  };
}

// ─── AI Erkin tanlov test ─────────────────────────────────────────────────
// Foydalanuvchi 2-5 ta fanni tanlaydi va har biri uchun papkalar + savol soni
//
// Body: {
//   subjects: [
//     { id: 'math', folderIds: ['...'], count: 15 },
//     { id: 'fizika', folderIds: ['...'], count: 20 },
//   ]
// }
async function generateFreeTest(userId, { subjects }) {
  if (!Array.isArray(subjects) || subjects.length < 2) {
    throw new Error("Kamida 2 ta fan tanlanishi kerak");
  }
  if (subjects.length > 5) {
    throw new Error("Maksimum 5 ta fan tanlash mumkin");
  }

  const user = await User.findById(userId);
  const genLimit = User.PLAN_LIMITS[user.effectivePlan()].testsGen;
  if (genLimit <= 0) throw new Error("Test generatsiya joriy obunada mavjud emas");
  if (genLimit !== Infinity) {
    const used = user.getAiUsage('testsGen') || 0;
    if (used >= genLimit) throw new Error(`Kunlik limit tugadi (${used}/${genLimit})`);
  }

  const allQuestions = [];
  let globalIdx = 0;
  const subjectsList = [];

  for (const subj of subjects) {
    const { id: subjectId, folderIds, count } = subj;
    if (!folderIds || folderIds.length === 0) {
      throw new Error(`"${subjectId}" uchun papka tanlanmagan`);
    }
    const safeCount = Math.min(30, Math.max(5, count || 10));

    const folders = await MaterialFolder.find({
      _id: { $in: folderIds },
      userId,
      isActive: true,
    }).populate('materialId');

    if (folders.length === 0) continue;

    const combinedContent = folders
      .filter(f => f.materialId?.content)
      .map(f => f.materialId.content)
      .join('\n\n---\n\n');

    if (combinedContent.length < 1500) {
      throw new Error(`"${subjectId}" uchun material yetarli emas`);
    }

    const subjectName = examService.SUBJECT_META[subjectId]?.name || subjectId;

    const subjQuestions = await _generateForSubject({
      subjectId, subjectName, content: combinedContent, count: safeCount,
    });

    subjQuestions.forEach(q => {
      q.idx = globalIdx++;
      q.subjectId = subjectId;
      q.subjectName = subjectName;
    });

    allQuestions.push(...subjQuestions);
    subjectsList.push({ id: subjectId, name: subjectName, count: safeCount });
  }

  if (allQuestions.length === 0) {
    throw new Error("Hech qanday savol yaratilmadi");
  }

  const test = await PersonalTest.create({
    userId,
    subjectId: 'free',
    subjectName: `Erkin tanlov · ${subjectsList.map(s => s.name).join(' + ')}`,
    questions: allQuestions,
    totalQuestions: allQuestions.length,
    testType: 'ai_free',
    status: 'in_progress',
    startTime: new Date(),
    metadata: { subjects: subjectsList },
  });

  await _incrementTestGen(userId);

  return { test, questions: allQuestions, subjects: subjectsList };
}

// ─── Internal helpers ─────────────────────────────────────────────────────
async function _generateForSubject({ subjectId, subjectName, content, count }) {
  const { getSubjectPrompt } = require('./subjectPrompts');
  const subjectSpecific = getSubjectPrompt(subjectId);
  const subjectNote = subjectSpecific
    ? `\n\n═══ ${subjectName.toUpperCase()} MAXSUS KO'RSATMALAR ═══\n${subjectSpecific}\n═══════════════════════════════════════════\n`
    : '';

  const safeMaterial = content.slice(0, 14000);

  const prompt = `Sen DTM imtihoniga tayyorlovchi AI o'qituvchisan.

Quyidagi o'quv materialidan AYNAN ${count} ta test savol yarat.

Fan: ${subjectName}
${subjectNote}
Material:
"""
${safeMaterial}
"""

QOIDALAR:
1. AYNAN ${count} ta savol — kam ham emas, ko'p ham emas
2. Har bir savol material mavzusiga to'g'ridan-to'g'ri yoki bilvosita bog'liq bo'lsin
3. 4 ta variant (A, B, C, D) — bittasi to'g'ri, uchtasi mantiqli noto'g'ri
4. DTM uslubida — aniq, qisqa, bir ma'noli savollar
5. O'zbek tilida yoz (chet tili fanlari bundan mustasno)
6. Mavzuni "topic" sifatida ko'rsat

FAQAT quyidagi JSON formatda javob ber:
{
  "questions": [
    { "question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "...", "topic": "..." }
  ]
}`;

  // testGeneratorService'dagi _deepseek va _parseAiResponse'larni qayta ishlatamiz
  const { _internal } = testGen;
  if (!_internal) throw new Error("testGen internal API mavjud emas");

  const res = await _internal.deepseek().chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 6000,
    temperature: 0.4,
  });

  return _internal.parseAiResponse(res.choices[0].message.content);
}

async function _incrementTestGen(userId) {
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
}

module.exports = {
  generateBlokTest,
  generateFreeTest,
};
