// ─── Folder Service ──────────────────────────────────────────────────────
// Material papkalari boshqaruvi va material yetarliligi tekshirish.
//
// QAT'IY QOIDALAR:
//   • Bir material = bir papka = bir asosiy test
//   • Majburiy kontekst papkasi: 10 ta test savol (DTM standart, oddiy)
//   • Mutaxassislik kontekst papkasi: 30 ta test savol (DTM standart, chuqur)
//   • Har test uchun ~500 belgi material kerak
//
// MUHIM: Quyidagi fanlar IKKI kontekstda ham bo'lishi mumkin:
//   • math   — Matematika (majburiy + mutaxassislik)
//   • uztil  — Ona tili (majburiy)
//   • adab   — Ona tili va adabiyoti (mutaxassislik)
//   • tarix  — O'zbekiston tarixi (majburiy)
//   • tarix  — Tarix (jahon + O'zb.) (mutaxassislik)
// Foydalanuvchi papka yaratganda 'context' tanlaydi.

const MaterialFolder = require('../models/MaterialFolder');
const StudyMaterial  = require('../models/StudyMaterial');
const PersonalTest   = require('../models/PersonalTest');
const { SUBJECT_META } = require('./examService');
const { logger }     = require('../utils/logger');

// ─── Ikkala kontekstda bo'lishi mumkin bo'lgan fanlar ─────────────────────
// Bularda foydalanuvchi papka yaratganda kontekst tanlashi kerak.
const DUAL_CONTEXT_SUBJECTS = new Set(['math', 'tarix']);
// uztil va adab — alohida ID'lar, ammo ham mantiqan o'xshash
// uztil (majburiy) va adab (mutaxassislik — ona tili va adabiyoti)

// Faqat majburiyda bo'ladigan fanlar
const ONLY_COMPULSORY = new Set(['uztil']);

// Mutaxassislikda bo'ladigan fanlar (math/tarix dan tashqari):
//   fizika, kimyo, bio, geo, adab, huquq,
//   ingliz, nemis, fransuz, arab, fors, turk,
//   rus, inform, iqtisod
//
// math va tarix — ikkala kontekstda

// ─── Standart test sonlari ────────────────────────────────────────────────
// context bo'yicha aniqlanadi (subject ID emas)
function getStandardCountByContext(context) {
  return context === 'majburiy' ? 10 : 30;
}

function getStandardTestCount(subjectId, context) {
  // Eski API (faqat subjectId) — agar context ko'rsatilmasa, fan turidan aniqlash
  if (context) {
    return getStandardCountByContext(context);
  }
  const meta = SUBJECT_META[subjectId];
  if (!meta) throw new Error(`Noma'lum fan: ${subjectId}`);
  return meta.block === 'majburiy' ? 10 : 30;
}

function getBlockType(subjectId, context) {
  if (context) return context;
  const meta = SUBJECT_META[subjectId];
  if (!meta) throw new Error(`Noma'lum fan: ${subjectId}`);
  return meta.block === 'majburiy' ? 'majburiy' : 'mutaxassislik';
}

// ─── Fan qaysi kontekstda bo'lishi mumkin ──────────────────────────────────
function getAllowedContexts(subjectId) {
  if (DUAL_CONTEXT_SUBJECTS.has(subjectId)) {
    return ['majburiy', 'mutaxassislik'];
  }
  if (ONLY_COMPULSORY.has(subjectId)) {
    return ['majburiy'];
  }
  return ['mutaxassislik'];
}

// ─── Yetarlilik tekshirish ────────────────────────────────────────────────
const CHARS_PER_QUESTION = 500;
const MIN_CHARS_FOR_AI_FILL = 2000;

function checkSufficiency(subjectId, charCount, context) {
  const standardCount = getStandardTestCount(subjectId, context);
  const requiredChars = standardCount * CHARS_PER_QUESTION;
  const minimumChars  = MIN_CHARS_FOR_AI_FILL;

  return {
    subjectId,
    context: context || getBlockType(subjectId),
    standardCount,
    charCount,
    requiredChars,
    minimumChars,
    isSufficient: charCount >= requiredChars,
    canAiFill: charCount >= minimumChars && charCount < requiredChars,
    isTooSmall: charCount < minimumChars,
  };
}

// ─── Papka yaratish ───────────────────────────────────────────────────────
async function createFolder(userId, { subjectId, title, context }) {
  // Kontekstni validatsiya
  const allowed = getAllowedContexts(subjectId);
  if (!context) {
    // Bitta variant bo'lsa avtomatik tanlash
    if (allowed.length === 1) context = allowed[0];
    else throw new Error(`Bu fan uchun kontekst tanlanishi shart: ${allowed.join(' yoki ')}`);
  }
  if (!allowed.includes(context)) {
    throw new Error(`'${subjectId}' fani '${context}' kontekstda yaroqsiz. Ruxsat: ${allowed.join(', ')}`);
  }

  // (Yangi tizimda bitta papka material bilan bog'lanmaydi, balki materiallar papkaga bog'lanadi)

  const standardCount = getStandardCountByContext(context);

  const folder = await MaterialFolder.create({
    userId,
    subjectId,
    context,
    title: title || 'Yangi papka',
    testStandardCount: standardCount,
  });

  logger.info(`Folder created: ${folder._id} (${subjectId}/${context}, ${standardCount} savol)`);
  return folder;
}

// ─── Fan papkalarini ro'yxat qilish ────────────────────────────────────────
async function getFoldersBySubject(userId, subjectId, context = null) {
  const filter = { userId, subjectId, isActive: true };
  if (context) filter.context = context;

  const folders = await MaterialFolder.find(filter)
    .sort({ createdAt: -1 })
    .populate('testId', 'totalQuestions status startTime endTime')
    .lean();

  const folderIds = folders.map(f => f._id);
  const materials = await StudyMaterial.find({ folderId: { $in: folderIds }, isActive: true })
    .select('folderId title charCount source createdAt sourceMeta')
    .lean();

  // Attach materials array to each folder
  folders.forEach(f => {
    f.materials = materials.filter(m => String(m.folderId) === String(f._id));
  });

  return folders;
}

// ─── Fanlar bo'yicha papkalar statistikasi (Ombor sahifasi uchun) ───────
// subjectId + context bo'yicha guruhlash — math majburiy va math mutaxassislik
// alohida ko'rinadi
async function getSubjectsSummary(userId) {
  const folders = await MaterialFolder.find({ userId, isActive: true })
    .select('subjectId context stats testStatus')
    .lean();

  const summary = {};
  for (const f of folders) {
    // Key: subjectId yoki subjectId__context (dual-context fanlar uchun)
    const key = DUAL_CONTEXT_SUBJECTS.has(f.subjectId)
      ? `${f.subjectId}__${f.context}`
      : f.subjectId;

    if (!summary[key]) {
      summary[key] = {
        subjectId: f.subjectId,
        context:   f.context,
        folderCount:    0,
        testsCompleted: 0,
        totalScore:     0,
        avgScore:       0,
      };
    }
    summary[key].folderCount += 1;
    if (f.stats?.attemptsCount > 0) {
      summary[key].testsCompleted += f.stats.attemptsCount;
      summary[key].totalScore     += f.stats.avgScore;
    }
  }

  for (const key of Object.keys(summary)) {
    const s = summary[key];
    s.avgScore = s.folderCount > 0 ? Math.round(s.totalScore / s.folderCount) : 0;
  }

  return summary;
}

async function getFolderDetails(userId, folderId) {
  const folder = await MaterialFolder.findOne({ _id: folderId, userId, isActive: true })
    .populate('testId')
    .lean();

  if (!folder) throw new Error("Papka topilmadi");

  const materials = await StudyMaterial.find({ folderId: folder._id, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  folder.materials = materials;

  // Bu papka testidan barcha urinishlarni olish
  let attempts = [];
  if (folder.testId) {
    // PersonalTest bir nechta marta ishlanishi mumkinligini hisobga olish kerak
    // Lekin bizning hozirgi schema da bitta PersonalTest — bitta urinish
    // Shuning uchun urinishlar — folder.testId va boshqa folderdan link qilingan testlar
    const allTests = await PersonalTest.find({
      userId,
      folderId,
      status: 'completed',
    }).sort({ endTime: -1 }).select('-questions -answers').lean();
    attempts = allTests;
  }

  return {
    folder,
    attempts,
  };
}

// ─── Papkani o'chirish (material va test bilan birga) ──────────────────────
async function deleteFolder(userId, folderId) {
  const folder = await MaterialFolder.findOne({ _id: folderId, userId });
  if (!folder) throw new Error("Papka topilmadi");

  // Materiallarni o'chiramiz (soft delete)
  await StudyMaterial.updateMany({ folderId: folder._id }, { isActive: false });
  // Asosiy testni o'chirmaymiz - tarixda kerak bo'lishi mumkin, faqat folder ni o'chiramiz
  folder.isActive = false;
  await folder.save();

  return { success: true };
}

// ─── Papka statistikasini yangilash (test ishlanganidan keyin) ─────────────
async function recordTestAttempt(folderId, correctCount, totalCount) {
  const folder = await MaterialFolder.findById(folderId);
  if (!folder) return;
  folder.recordAttempt(correctCount, totalCount);
  await folder.save();
  return folder;
}

// ─── Bir material uchun yangi urinish — yangi PersonalTest yarata olamiz ──
// Lekin asosiy test (qayta yaratilmaydi) — savollar shu test'dan olinadi
// va aralashtiriladi.
async function createRetryAttempt(userId, folderId) {
  const folder = await MaterialFolder.findOne({ _id: folderId, userId, isActive: true });
  if (!folder) throw new Error("Papka topilmadi");
  if (!folder.testId) throw new Error("Bu papkada test hali yaratilmagan");

  const originalTest = await PersonalTest.findById(folder.testId);
  if (!originalTest) throw new Error("Asosiy test topilmadi");

  // Asosiy testning savollarini olib, aralashtiramiz
  const shuffledQuestions = originalTest.questions
    .map((q, idx) => ({ ...q.toObject ? q.toObject() : q, idx }))
    .sort(() => Math.random() - 0.5)
    .map((q, newIdx) => ({ ...q, idx: newIdx }));

  // Yangi sessiya yaratamiz (urinish sifatida)
  const newAttempt = await PersonalTest.create({
    userId,
    subjectId: originalTest.subjectId,
    subjectName: originalTest.subjectName,
    materialIds: originalTest.materialIds,
    folderId: folder._id,
    questions: shuffledQuestions,
    totalQuestions: shuffledQuestions.length,
    testType: 'material',
    status: 'in_progress',
    startTime: new Date(),
  });

  return newAttempt;
}

module.exports = {
  getStandardTestCount,
  getStandardCountByContext,
  getBlockType,
  getAllowedContexts,
  checkSufficiency,
  createFolder,
  getFoldersBySubject,
  getSubjectsSummary,
  getFolderDetails,
  deleteFolder,
  recordTestAttempt,
  createRetryAttempt,
  DUAL_CONTEXT_SUBJECTS,
  ONLY_COMPULSORY,
  CHARS_PER_QUESTION,
  MIN_CHARS_FOR_AI_FILL,
};
