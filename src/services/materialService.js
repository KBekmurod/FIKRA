// ─── Material Service ───────────────────────────────────────────────────────
// Foydalanuvchi materiallari uchun barcha biznes logika:
//   • Limit tekshirish (plan'ga qarab matn / OCR / fayl)
//   • Yaratish / o'qish / tahrirlash / o'chirish
//   • AI usage trackerlarini yangilash (OCR/fayl yuklashda)
//
// Bu servis route handler'lardan chaqiriladi. HTTP narsalarini bilmaydi —
// faqat domen logikasi va xato tashlash.

const mongoose      = require('mongoose');
const StudyMaterial = require('../models/StudyMaterial');
const User          = require('../models/User');
const { SUBJECT_META } = require('./examService');
const { logger }    = require('../utils/logger');

class MaterialError extends Error {
  constructor(message, code = 'MATERIAL_ERROR', statusCode = 400, extra = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Object.assign(this, extra);
  }
}

// ─── Fanni tekshirish ─────────────────────────────────────────────────────────
function _assertValidSubject(subjectId) {
  if (!subjectId || !SUBJECT_META[subjectId]) {
    throw new MaterialError(
      `Noma'lum fan: ${subjectId || '(bo\'sh)'}`,
      'INVALID_SUBJECT'
    );
  }
}

// ─── Foydalanuvchini yangilash (test gen counter shu yerda emas; AI usage emas) ──
async function _ensureUser(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new MaterialError("Yaroqsiz foydalanuvchi", 'INVALID_USER', 400);
  }
  const user = await User.findById(userId);
  if (!user) throw new MaterialError("Foydalanuvchi topilmadi", 'USER_NOT_FOUND', 404);
  return user;
}

// ─── Matn material limit (jami fanlar bo'yicha YO'Q — har fan alohida) ───────
async function _assertTextLimit(user, subjectId) {
  const limit = User.PLAN_LIMITS[user.effectivePlan()].textMaterials;
  if (limit === Infinity) return;

  const count = await StudyMaterial.countDocuments({
    userId:    user._id,
    subjectId,
    source:    'text',
    isActive:  true,
  });

  if (count >= limit) {
    throw new MaterialError(
      `Bu fan uchun matn materiallari limiti tugagan (${count}/${limit}). Obunani yangilang yoki eskisini o'chiring.`,
      'TEXT_LIMIT_REACHED',
      403,
      { current: count, limit }
    );
  }
}

// ─── OCR / fayl uchun kunlik limit (aiUsage trackerlari orqali) ──────────────
function _assertDailyLimit(user, kind) {
  // kind = 'ocrUploads' | 'fileUploads'
  const limit = User.PLAN_LIMITS[user.effectivePlan()][kind];
  if (limit === Infinity) return;
  if (limit <= 0) {
    throw new MaterialError(
      `Bu funksiya joriy obunada mavjud emas. Obuna kerak.`,
      'SUBSCRIPTION_REQUIRED',
      403,
      { kind }
    );
  }

  const used = user.getAiUsage(kind);
  if (used >= limit) {
    throw new MaterialError(
      `Kunlik limit tugadi (${used}/${limit}). Ertaga qayta urinib ko'ring yoki obunani yangilang.`,
      'DAILY_LIMIT_REACHED',
      429,
      { used, limit, kind }
    );
  }
}

// ─── OCR/fayl yuklashda kunlik trackerlarni oshirish (atomic) ────────────────
async function _incrementDailyUsage(userId, kind) {
  const todayKey = User.todayKey();
  await User.findOneAndUpdate(
    { _id: userId },
    [{
      $set: {
        aiUsage: {
          $cond: [
            { $eq: ['$aiUsage.date', todayKey] },
            {
              $mergeObjects: [
                '$aiUsage',
                { [kind]: { $add: [{ $ifNull: [`$aiUsage.${kind}`, 0] }, 1] } },
              ],
            },
            // Yangi kun — reset
            {
              date: todayKey,
              hints: 0, chats: 0, docs: 0, images: 0, calories: 0,
              ocrUploads: 0, fileUploads: 0, testsGen: 0,
              [kind]: 1,
            },
          ],
        },
      },
    }],
  );
}

// ─── Matn validatsiya (uzunlik) ──────────────────────────────────────────────
function _validateContent(content) {
  if (typeof content !== 'string') {
    throw new MaterialError("Matn kerak", 'INVALID_CONTENT');
  }
  const trimmed = content.trim();
  const rules = User.MATERIAL_RULES;

  if (trimmed.length < rules.minTextChars) {
    throw new MaterialError(
      `Matn juda qisqa (kamida ${rules.minTextChars} belgi)`,
      'CONTENT_TOO_SHORT',
      400,
      { current: trimmed.length, min: rules.minTextChars }
    );
  }
  if (trimmed.length > rules.maxTextChars) {
    throw new MaterialError(
      `Matn juda uzun (maksimum ${rules.maxTextChars} belgi)`,
      'CONTENT_TOO_LONG',
      400,
      { current: trimmed.length, max: rules.maxTextChars }
    );
  }
  return trimmed;
}

function _validateTitle(title, fallback = 'Material') {
  if (!title || typeof title !== 'string') return fallback;
  const t = title.trim().slice(0, 200);
  return t || fallback;
}

// ─── Public API ──────────────────────────────────────────────────────────────

// 1) Matn material yaratish (copy-paste)
async function createTextMaterial(userId, { subjectId, title, content }) {
  _assertValidSubject(subjectId);
  const user = await _ensureUser(userId);

  await _assertTextLimit(user, subjectId);
  const safeContent = _validateContent(content);
  const safeTitle = _validateTitle(title, `${SUBJECT_META[subjectId].name} — matn`);

  const material = await StudyMaterial.create({
    userId: user._id,
    subjectId,
    source: 'text',
    title:  safeTitle,
    content: safeContent,
    charCount: safeContent.length,
  });

  return material;
}

// 2) OCR material yaratish (rasmdan olingan matn TAHRIRLANGAN holatda keladi)
//    Bu funksiya OCR ishlatib bo'lgandan keyin chaqiriladi —
//    foydalanuvchi natijani tahrir oynasida ko'rib bo'lgan.
async function createOcrMaterial(userId, { subjectId, title, content, sourceMeta = {} }) {
  _assertValidSubject(subjectId);
  const user = await _ensureUser(userId);

  _assertDailyLimit(user, 'ocrUploads');
  // Eslatma: OCR uchun ham textMaterials limiti emas, alohida hisoblanadi.
  // Foydalanuvchi qancha OCR qilsa, hammasi alohida material bo'ladi.
  // Lekin kuniga 'ocrUploads' limiti bor.

  const safeContent = _validateContent(content);
  const safeTitle = _validateTitle(title, `${SUBJECT_META[subjectId].name} — rasm`);

  const material = await StudyMaterial.create({
    userId: user._id,
    subjectId,
    source: 'ocr',
    title:  safeTitle,
    content: safeContent,
    charCount: safeContent.length,
    sourceMeta: {
      fileName:     sourceMeta.fileName || '',
      fileMime:     sourceMeta.fileMime || '',
      fileSizeKb:   sourceMeta.fileSizeKb || 0,
      ocrRawLength: sourceMeta.ocrRawLength || safeContent.length,
    },
  });

  await _incrementDailyUsage(user._id, 'ocrUploads');
  return material;
}

// 3) Fayl material yaratish (PDF/DOCX/PPTX dan olingan matn TAHRIRLANGAN holatda)
async function createFileMaterial(userId, { subjectId, title, content, sourceMeta = {} }) {
  _assertValidSubject(subjectId);
  const user = await _ensureUser(userId);

  _assertDailyLimit(user, 'fileUploads');

  const safeContent = _validateContent(content);
  const safeTitle = _validateTitle(title, `${SUBJECT_META[subjectId].name} — fayl`);

  // Sahifa soni cheklov
  if (sourceMeta.pageCount && sourceMeta.pageCount > User.MATERIAL_RULES.maxFilePages) {
    throw new MaterialError(
      `Fayl juda uzun: ${sourceMeta.pageCount} sahifa (maks ${User.MATERIAL_RULES.maxFilePages})`,
      'FILE_TOO_MANY_PAGES',
      400,
      { pages: sourceMeta.pageCount, max: User.MATERIAL_RULES.maxFilePages }
    );
  }

  const material = await StudyMaterial.create({
    userId: user._id,
    subjectId,
    source: 'file',
    title:  safeTitle,
    content: safeContent,
    charCount: safeContent.length,
    sourceMeta: {
      fileName:   sourceMeta.fileName || '',
      fileMime:   sourceMeta.fileMime || '',
      fileSizeKb: sourceMeta.fileSizeKb || 0,
      pageCount:  sourceMeta.pageCount || 0,
    },
  });

  await _incrementDailyUsage(user._id, 'fileUploads');
  return material;
}

// 4) Bitta materialni olish (egasi tomonidan)
async function getMaterial(userId, materialId) {
  if (!mongoose.Types.ObjectId.isValid(materialId)) {
    throw new MaterialError("Yaroqsiz material ID", 'INVALID_ID', 400);
  }
  const m = await StudyMaterial.findById(materialId);
  if (!m || !m.isActive) {
    throw new MaterialError("Material topilmadi", 'NOT_FOUND', 404);
  }
  if (String(m.userId) !== String(userId)) {
    throw new MaterialError("Ruxsat yo'q", 'FORBIDDEN', 403);
  }
  return m;
}

// 5) Fan bo'yicha barcha materiallarni olish
async function listMaterialsBySubject(userId, subjectId) {
  _assertValidSubject(subjectId);
  return StudyMaterial.find({
    userId,
    subjectId,
    isActive: true,
  }).sort({ createdAt: -1 }).lean();
}

// 6) Barcha materiallar (statistika uchun)
async function listAllMaterials(userId) {
  return StudyMaterial.find({
    userId,
    isActive: true,
  }).sort({ createdAt: -1 }).lean();
}

// 7) Material tahrirlash (sarlavha + kontent)
async function updateMaterial(userId, materialId, { title, content }) {
  const material = await getMaterial(userId, materialId);

  if (content !== undefined) {
    const safeContent = _validateContent(content);
    material.content = safeContent;
    material.charCount = safeContent.length;
  }
  if (title !== undefined) {
    material.title = _validateTitle(title, material.title);
  }

  await material.save();
  return material;
}

// 8) Material o'chirish (hard delete)
async function deleteMaterial(userId, materialId) {
  const material = await getMaterial(userId, materialId);
  await material.deleteOne();
  return { deleted: true, materialId };
}

// 9) Fanlar bo'yicha agregatsiya (Fanlar sahifasi uchun)
//    Har fan uchun: material soni, jami belgi
async function getSubjectsSummary(userId) {
  const aggregation = await StudyMaterial.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$subjectId',
        count:        { $sum: 1 },
        totalChars:   { $sum: '$charCount' },
        bySource: {
          $push: '$source',
        },
      },
    },
  ]);

  const map = {};
  aggregation.forEach(row => {
    const counts = { text: 0, ocr: 0, file: 0 };
    row.bySource.forEach(s => counts[s] = (counts[s] || 0) + 1);
    map[row._id] = {
      count:      row.count,
      totalChars: row.totalChars,
      bySource:   counts,
    };
  });
  return map;
}

// ─── Limit holatini olish (UI uchun) ─────────────────────────────────────────
function getLimitsSnapshot(user) {
  const tier = user.effectivePlan();
  const limits = User.PLAN_LIMITS[tier];
  const todayKey = User.todayKey();
  const aiU = user.aiUsage?.date === todayKey ? user.aiUsage : {};
  const safe = (v) => (v === Infinity ? null : v);

  return {
    plan: tier,
    textMaterials: {
      limit: safe(limits.textMaterials),
      // Eslatma: textMaterials har fan uchun alohida hisoblanadi — UI fan ichida ko'rsatadi
    },
    ocrUploads: {
      limit: safe(limits.ocrUploads),
      used:  aiU.ocrUploads || 0,
    },
    fileUploads: {
      limit: safe(limits.fileUploads),
      used:  aiU.fileUploads || 0,
    },
    testsGen: {
      limit: safe(limits.testsGen),
      used:  aiU.testsGen || 0,
    },
    rules: User.MATERIAL_RULES,
  };
}

module.exports = {
  MaterialError,
  createTextMaterial,
  createOcrMaterial,
  createFileMaterial,
  getMaterial,
  listMaterialsBySubject,
  listAllMaterials,
  updateMaterial,
  deleteMaterial,
  getSubjectsSummary,
  getLimitsSnapshot,
  // testGen counter uchun (sprint 2 da)
  _incrementDailyUsage,
};
