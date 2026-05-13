// ─── Materials API routes ───────────────────────────────────────────────────
// /api/materials/*
//
// Tushuntirish:
//   • Matn yuklash: oddiy JSON POST
//   • Rasm OCR: 2 bosqichli — 1) /ocr/extract (matn ajratish), 2) /ocr/save (tahrirlangan matnni saqlash)
//   • Fayl upload: 2 bosqichli — 1) /file/parse (matn ajratish), 2) /file/save (tahrirlangan matnni saqlash)
//
// 2-bosqichli yondashuvning sababi: foydalanuvchi OCR/fayl natijasini tahrir oynasida
// ko'rib bo'lib, keyin saqlaydi. Vaqtinchalik natija memory'da turadi (30 daq TTL).

const express = require('express');
const multer  = require('multer');
const crypto  = require('crypto');
const router  = express.Router();

const { authMiddleware } = require('../middleware/auth');
const { logger }         = require('../utils/logger');
const User               = require('../models/User');

const materialService  = require('../services/materialService');
const ocrService       = require('../services/ocrService');
const fileParseService = require('../services/fileParseService');
const { SUBJECT_META } = require('../services/examService');

// ─── Multer: rasm va fayl uchun memory storage ───────────────────────────────
const RULES = User.MATERIAL_RULES;

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RULES.maxImageBytes },
  fileFilter: (req, file, cb) => {
    if (RULES.allowedImageMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat .jpg, .jpeg yoki .png'));
  },
});

const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RULES.maxFileBytes },
  fileFilter: (req, file, cb) => {
    if (RULES.allowedFileMimes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat .pdf, .docx yoki .pptx'));
  },
});

// ─── Vaqtinchalik OCR/fayl natijalari (memory, 30 daq TTL) ───────────────────
const draftStore = new Map();
const DRAFT_TTL  = 30 * 60 * 1000;

function _saveDraft(userId, payload) {
  const id = crypto.randomBytes(12).toString('hex');
  draftStore.set(id, {
    userId: String(userId),
    payload,
    createdAt: Date.now(),
  });
  setTimeout(() => draftStore.delete(id), DRAFT_TTL);
  return id;
}

function _getDraft(userId, draftId) {
  const d = draftStore.get(draftId);
  if (!d) return null;
  if (d.userId !== String(userId)) return null;
  return d.payload;
}

function _deleteDraft(draftId) {
  draftStore.delete(draftId);
}

// ─── Helper: xatoni JSON javobga aylantirish ─────────────────────────────────
function _handleError(err, res, next) {
  if (err && err.code && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      code:  err.code,
      ...Object.keys(err).reduce((acc, k) => {
        if (!['message', 'code', 'statusCode', 'stack', 'name'].includes(k)) acc[k] = err[k];
        return acc;
      }, {}),
    });
  }
  next(err);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1) LIMITLAR + FANLAR XULOSASI
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/materials/limits — joriy obuna limitlari + bugungi ishlatilgan
router.get('/limits', authMiddleware, (req, res) => {
  const snapshot = materialService.getLimitsSnapshot(req.user);
  res.json(snapshot);
});

// GET /api/materials/subjects-summary — fan bo'yicha material soni (Fanlar sahifasi uchun)
router.get('/subjects-summary', authMiddleware, async (req, res, next) => {
  try {
    const summary = await materialService.getSubjectsSummary(req.user._id);
    res.json({ summary });
  } catch (err) { _handleError(err, res, next); }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2) MATN MATERIAL (copy-paste)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/materials/text — yangi matn material
router.post('/text', authMiddleware, async (req, res, next) => {
  try {
    const { subjectId, title, content } = req.body;
    const material = await materialService.createTextMaterial(req.user._id, {
      subjectId,
      title,
      content,
    });
    res.json({ success: true, material });
  } catch (err) { _handleError(err, res, next); }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3) OCR (rasmdan matn)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/materials/ocr/extract — rasmdan matn ajratish (saqlamaydi, faqat draft)
router.post(
  '/ocr/extract',
  authMiddleware,
  imageUpload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Rasm yuklanmadi', code: 'NO_FILE' });
      }

      // Limit oldindan tekshirish (saqlashga emas, hech bo'lmasa OCR qilishga ruxsat)
      // Aslida OCR qilishga ham limitni qo'llaymiz — chunki AI resurs sarflanadi
      const limitCheck = User.PLAN_LIMITS[req.user.effectivePlan()].ocrUploads;
      if (limitCheck <= 0) {
        return res.status(403).json({
          error: 'OCR funksiyasi joriy obunada mavjud emas',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
      if (limitCheck !== Infinity) {
        const used = req.user.getAiUsage('ocrUploads');
        if (used >= limitCheck) {
          return res.status(429).json({
            error: `Kunlik OCR limiti tugadi (${used}/${limitCheck})`,
            code: 'DAILY_LIMIT_REACHED',
            used, limit: limitCheck,
          });
        }
      }

      const extractedText = await ocrService.extractTextFromImage(
        req.file.buffer,
        req.file.mimetype
      );

      // Vaqtinchalik draft (foydalanuvchi tahrirlash uchun)
      const draftId = _saveDraft(req.user._id, {
        kind: 'ocr',
        text: extractedText,
        sourceMeta: {
          fileName:     req.file.originalname,
          fileMime:     req.file.mimetype,
          fileSizeKb:   Math.round(req.file.size / 1024),
          ocrRawLength: extractedText.length,
        },
      });

      res.json({
        success: true,
        draftId,
        text: extractedText,
        charCount: extractedText.length,
        sourceMeta: {
          fileName:   req.file.originalname,
          fileSizeKb: Math.round(req.file.size / 1024),
        },
        notice: "Test yaratishdan oldin matnni tekshirib chiqing — OCR 100% aniq bo'lmasligi mumkin",
      });
    } catch (err) {
      logger.error('OCR extract error:', err.message);
      if (err.message?.includes('Faqat .jpg')) {
        return res.status(400).json({ error: err.message, code: 'INVALID_FILE_TYPE' });
      }
      res.status(500).json({ error: err.message || 'OCR xatoligi', code: 'OCR_FAILED' });
    }
  }
);

// POST /api/materials/ocr/save — OCR draftni saqlash (tahrirlangan matn bilan)
router.post('/ocr/save', authMiddleware, async (req, res, next) => {
  try {
    const { draftId, subjectId, title, content } = req.body;
    if (!draftId) return res.status(400).json({ error: 'draftId kerak' });

    const draft = _getDraft(req.user._id, draftId);
    if (!draft || draft.kind !== 'ocr') {
      return res.status(404).json({ error: 'Draft topilmadi yoki muddati o\'tdi' });
    }

    const material = await materialService.createOcrMaterial(req.user._id, {
      subjectId,
      title,
      content,
      sourceMeta: {
        ...draft.sourceMeta,
        ocrRawLength: draft.sourceMeta.ocrRawLength,
      },
    });

    _deleteDraft(draftId);
    res.json({ success: true, material });
  } catch (err) { _handleError(err, res, next); }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4) FAYL (PDF / DOCX / PPTX)
// ═══════════════════════════════════════════════════════════════════════════

// POST /api/materials/file/parse — fayldan matn ajratish (draft)
router.post(
  '/file/parse',
  authMiddleware,
  fileUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Fayl yuklanmadi', code: 'NO_FILE' });
      }

      // Limit oldindan
      const limitCheck = User.PLAN_LIMITS[req.user.effectivePlan()].fileUploads;
      if (limitCheck <= 0) {
        return res.status(403).json({
          error: 'Fayl yuklash funksiyasi obunada mavjud',
          code: 'SUBSCRIPTION_REQUIRED',
        });
      }
      if (limitCheck !== Infinity) {
        const used = req.user.getAiUsage('fileUploads');
        if (used >= limitCheck) {
          return res.status(429).json({
            error: `Kunlik fayl limiti tugadi (${used}/${limitCheck})`,
            code: 'DAILY_LIMIT_REACHED',
            used, limit: limitCheck,
          });
        }
      }

      const { text, pageCount } = await fileParseService.parseFile(
        req.file.buffer,
        req.file.mimetype
      );

      // Sahifa soni cheklov
      if (pageCount > RULES.maxFilePages) {
        return res.status(400).json({
          error: `Fayl juda uzun: ${pageCount} sahifa (maks ${RULES.maxFilePages})`,
          code: 'FILE_TOO_MANY_PAGES',
          pageCount,
          max: RULES.maxFilePages,
        });
      }

      if (!text || text.length < User.MATERIAL_RULES.minTextChars) {
        return res.status(400).json({
          error: 'Fayldan ma\'noli matn ajratib bo\'lmadi. Boshqa fayl yuklang.',
          code: 'NO_TEXT_EXTRACTED',
        });
      }

      // Maksimum belgi cheklov — agar fayl katta bo'lsa, qisqartirib draftga saqlaymiz
      // Foydalanuvchi tahrir oynasida tanlay oladi
      const trimmedText = text.length > RULES.maxTextChars
        ? text.slice(0, RULES.maxTextChars)
        : text;

      const draftId = _saveDraft(req.user._id, {
        kind: 'file',
        text: trimmedText,
        sourceMeta: {
          fileName:   req.file.originalname,
          fileMime:   req.file.mimetype,
          fileSizeKb: Math.round(req.file.size / 1024),
          pageCount,
        },
      });

      res.json({
        success: true,
        draftId,
        text: trimmedText,
        charCount: trimmedText.length,
        wasTrimmed: text.length > RULES.maxTextChars,
        originalChars: text.length,
        pageCount,
        sourceMeta: {
          fileName:   req.file.originalname,
          fileSizeKb: Math.round(req.file.size / 1024),
          pageCount,
        },
        notice: "Matnni tekshirib chiqing, kerak bo'lsa tahrirlang, keyin saqlang",
      });
    } catch (err) {
      logger.error('File parse error:', err.message);
      if (err.message?.includes('Faqat .pdf')) {
        return res.status(400).json({ error: err.message, code: 'INVALID_FILE_TYPE' });
      }
      res.status(500).json({ error: err.message || 'Fayl tahlilida xatolik', code: 'FILE_PARSE_FAILED' });
    }
  }
);

// POST /api/materials/file/save — fayl draftni saqlash
router.post('/file/save', authMiddleware, async (req, res, next) => {
  try {
    const { draftId, subjectId, title, content } = req.body;
    if (!draftId) return res.status(400).json({ error: 'draftId kerak' });

    const draft = _getDraft(req.user._id, draftId);
    if (!draft || draft.kind !== 'file') {
      return res.status(404).json({ error: 'Draft topilmadi yoki muddati o\'tdi' });
    }

    const material = await materialService.createFileMaterial(req.user._id, {
      subjectId,
      title,
      content,
      sourceMeta: draft.sourceMeta,
    });

    _deleteDraft(draftId);
    res.json({ success: true, material });
  } catch (err) { _handleError(err, res, next); }
});

// ═══════════════════════════════════════════════════════════════════════════
// 5) MATERIALLARNI KO'RISH / TAHRIRLASH / O'CHIRISH
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/materials?subject=math — fan bo'yicha ro'yxat
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { subject } = req.query;
    if (subject) {
      const list = await materialService.listMaterialsBySubject(req.user._id, subject);
      return res.json({ materials: list });
    }
    const list = await materialService.listAllMaterials(req.user._id);
    res.json({ materials: list });
  } catch (err) { _handleError(err, res, next); }
});

// GET /api/materials/:id — bitta material to'liq
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const m = await materialService.getMaterial(req.user._id, req.params.id);
    res.json({ material: m });
  } catch (err) { _handleError(err, res, next); }
});

// PUT /api/materials/:id — sarlavha yoki kontentni tahrirlash
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const m = await materialService.updateMaterial(req.user._id, req.params.id, { title, content });
    res.json({ success: true, material: m });
  } catch (err) { _handleError(err, res, next); }
});

// DELETE /api/materials/:id
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const result = await materialService.deleteMaterial(req.user._id, req.params.id);
    res.json({ success: true, ...result });
  } catch (err) { _handleError(err, res, next); }
});

module.exports = router;
