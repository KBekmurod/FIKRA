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
// AI standart sonlarda savol yaratadi: onatili(10) + math(10) + tarix(10) +
// spec1(30) + spec2(30) = 90 savol
//
// Body: {
//   direction: 'engineering',
//   subjects: {
//     majburiy_onatili: { folderIds: ['...', '...'] },
//     majburiy_math:  { folderIds: ['...'] },
//     majburiy_tarix: { folderIds: ['...'] },
//     fizika:{ folderIds: ['...'] },  // spec1
//     // spec2 — direction'dan kelib chiqadi
//   }
// }
async function generateBlokTestAsync(userId, { direction, subjects }) {
  const dirInfo = examService.DIRECTION_MAP[direction];
  if (!dirInfo) throw new Error(`Noma'lum yo'nalish: ${direction}`);

  const user = await User.findById(userId);
  const genLimit = User.PLAN_LIMITS[user.effectivePlan()].testsGen;
  if (genLimit <= 0) throw new Error("Test generatsiya joriy obunada mavjud emas");
  if (genLimit !== Infinity) {
    const used = user.getAiUsage('testsGen') || 0;
    if (used >= genLimit) throw new Error(`Kunlik limit tugadi (${used}/${genLimit})`);
  }

  const activeTest = await PersonalTest.findOne({ userId, status: 'generating' });
  if (activeTest) {
    throw new Error("Sizda allaqachon bitta test yaratilmoqda. Iltimos jarayon tugashini kuting.");
  }

  const test = await PersonalTest.create({
    userId,
    subjectId: 'blok', 
    subjectName: `${dirInfo.name} (DTM blok)`,
    testType: 'ai_blok',
    direction,
    status: 'generating',
    startTime: new Date(),
    metadata: { direction, subjects },
  });

  _runBackgroundBlokTest(test._id, userId, { direction, subjects, dirInfo }).catch(err => {
    logger.error(`Background generation failed for test ${test._id}:`, err);
  });

  return { testId: test._id, dirName: dirInfo.name };
}

async function _runBackgroundBlokTest(testId, userId, { direction, subjects, dirInfo }) {
  try {
    const [spec1, spec2] = dirInfo.spec;
    const compSubjects = ['majburiy_onatili', 'majburiy_math', 'majburiy_tarix'];
    const allSubjects = [...compSubjects, spec1, spec2];
    const allQuestions = [];
    let globalIdx = 0;

    for (const subjectId of allSubjects) {
      const subjConfig = subjects?.[subjectId];
      if (!subjConfig?.folderIds || subjConfig.folderIds.length === 0) {
        throw new Error(`"${subjectId}" fani uchun papka tanlanmagan`);
      }

      const folders = await MaterialFolder.find({
        _id: { $in: subjConfig.folderIds },
        userId,
        isActive: true,
      }).populate('materialId');

      if (folders.length === 0) throw new Error(`"${subjectId}" fani uchun papkalar topilmadi`);

      const combinedContent = folders
        .filter(f => f.materialId?.content)
        .map(f => f.materialId.content)
        .join('\n\n---\n\n');

      if (combinedContent.length < 1500) {
        throw new Error(`"${subjectId}" fani uchun material yetarli emas (${combinedContent.length} belgi)`);
      }

      const isCompulsory = compSubjects.includes(subjectId);
      const count = isCompulsory ? 10 : 30;
      const subjectName = examService.SUBJECT_META[subjectId]?.name || subjectId;

      const subjQuestions = await _generateForSubject({
        subjectId, subjectName, content: combinedContent, count,
      });

      subjQuestions.forEach(q => {
        q.idx = globalIdx++;
        q.subjectId = subjectId;
        q.subjectName = subjectName;
      });

      allQuestions.push(...subjQuestions);
    }

    await PersonalTest.findByIdAndUpdate(testId, {
      questions: allQuestions,
      totalQuestions: allQuestions.length,
      status: 'in_progress'
    });

    await _incrementTestGen(userId);
  } catch (err) {
    await PersonalTest.findByIdAndUpdate(testId, {
      status: 'failed',
      metadata: { error: err.message }
    });
  }
}

// ─── AI Erkin tanlov test ─────────────────────────────────────────────────
async function generateFreeTestAsync(userId, { subjects }) {
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

  const activeTest = await PersonalTest.findOne({ userId, status: 'generating' });
  if (activeTest) {
    throw new Error("Sizda allaqachon bitta test yaratilmoqda. Iltimos jarayon tugashini kuting.");
  }

  const subjectsList = subjects.map(s => {
    const safeCount = Math.min(30, Math.max(5, s.count || 10));
    const subjectName = examService.SUBJECT_META[s.id]?.name || s.id;
    return { id: s.id, name: subjectName, count: safeCount, folderIds: s.folderIds };
  });

  const test = await PersonalTest.create({
    userId,
    subjectId: 'free',
    subjectName: `Erkin tanlov · ${subjectsList.map(s => s.name).join(' + ')}`,
    testType: 'ai_free',
    status: 'generating',
    startTime: new Date(),
    metadata: { subjects: subjectsList },
  });

  _runBackgroundFreeTest(test._id, userId, { subjectsList }).catch(err => {
    logger.error(`Background generation failed for test ${test._id}:`, err);
  });

  return { testId: test._id };
}

async function _runBackgroundFreeTest(testId, userId, { subjectsList }) {
  try {
    const allQuestions = [];
    let globalIdx = 0;

    for (const subj of subjectsList) {
      if (!subj.folderIds || subj.folderIds.length === 0) {
        throw new Error(`"${subj.id}" uchun papka tanlanmagan`);
      }

      const folders = await MaterialFolder.find({
        _id: { $in: subj.folderIds },
        userId,
        isActive: true,
      }).populate('materialId');

      if (folders.length === 0) continue;

      const combinedContent = folders
        .filter(f => f.materialId?.content)
        .map(f => f.materialId.content)
        .join('\n\n---\n\n');

      if (combinedContent.length < 1500) {
        throw new Error(`"${subj.id}" uchun material yetarli emas`);
      }

      const subjQuestions = await _generateForSubject({
        subjectId: subj.id, subjectName: subj.name, content: combinedContent, count: subj.count,
      });

      subjQuestions.forEach(q => {
        q.idx = globalIdx++;
        q.subjectId = subj.id;
        q.subjectName = subj.name;
      });

      allQuestions.push(...subjQuestions);
    }

    if (allQuestions.length === 0) throw new Error("Hech qanday savol yaratilmadi");

    await PersonalTest.findByIdAndUpdate(testId, {
      questions: allQuestions,
      totalQuestions: allQuestions.length,
      status: 'in_progress'
    });

    await _incrementTestGen(userId);
  } catch (err) {
    await PersonalTest.findByIdAndUpdate(testId, {
      status: 'failed',
      metadata: { error: err.message }
    });
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────
async function _generateForSubject({ subjectId, subjectName, content, count }) {
  const { getSubjectPrompt } = require('./subjectPrompts');
  const subjectSpecific = getSubjectPrompt(subjectId);
  const subjectNote = subjectSpecific
    ? `\n\n═══ ${subjectName.toUpperCase()} MAXSUS KO'RSATMALAR ═══\n${subjectSpecific}\n═══════════════════════════════════════════\n`
    : '';

  // 1. Chunking logic (Silent Truncation yechimi)
  // Har bir qism (chunk) maksimum ~35000 belgi
  const MAX_CHUNK_LENGTH = 35000; 
  // Har bir qismdan kamida nechtadir savol (agar count katta bo'lsa)
  const MAX_QUESTIONS_PER_BATCH = 15;

  const chunksByText = Math.ceil(content.length / MAX_CHUNK_LENGTH) || 1;
  const chunksByQuestions = Math.ceil(count / MAX_QUESTIONS_PER_BATCH) || 1;
  const actualBatches = Math.min(Math.max(chunksByText, chunksByQuestions), 8); // ko'pi bilan 8 bo'lak
  
  const chunkSize = Math.ceil(content.length / actualBatches);

  const { _internal } = testGen;
  if (!_internal) throw new Error("testGen internal API mavjud emas");

  let allQuestions = [];

  for (let i = 0; i < actualBatches; i++) {
    const questionsToGenerate = (i === actualBatches - 1) 
      ? count - allQuestions.length 
      : Math.floor(count / actualBatches);
      
    if (questionsToGenerate <= 0) continue;

    const chunkContent = content.slice(i * chunkSize, (i + 1) * chunkSize);

    const prompt = `Sen DTM imtihoniga tayyorlovchi AI o'qituvchisan.

Quyidagi o'quv materialining bir qismidan AYNAN ${questionsToGenerate} ta test savol yarat.

Fan: ${subjectName}
${subjectNote}
Material qismi (${i+1}/${actualBatches}):
"""
${chunkContent}
"""

QOIDALAR:
1. AYNAN ${questionsToGenerate} ta savol — kam ham emas, ko'p ham emas
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

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI server javob berishda kechikdi (Timeout). Jarayon bekor qilindi.")), 170000)
    );

    try {
      const res = await Promise.race([
        _internal.deepseek().chat.completions.create({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 6000,
          temperature: 0.4,
          response_format: { type: "json_object" }
        }),
        timeoutPromise
      ]);

      const parsed = _internal.parseResponse(res.choices[0].message.content);
      if (parsed && Array.isArray(parsed)) {
        allQuestions.push(...parsed);
      } else if (parsed && parsed.questions && Array.isArray(parsed.questions)) {
        allQuestions.push(...parsed.questions);
      }
    } catch (err) {
      console.error(`Batch ${i+1}/${actualBatches} xatosi:`, err.message);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error(`${subjectName} fani bo'yicha savol yaratib bo'lmadi.`);
  }

  return allQuestions.slice(0, count);
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
  generateBlokTest: generateBlokTestAsync,
  generateFreeTest: generateFreeTestAsync,
};
