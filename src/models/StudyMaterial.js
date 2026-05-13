const mongoose = require('mongoose');

// ─── StudyMaterial ───────────────────────────────────────────────────────────
// Foydalanuvchi har bir fan uchun yuklagan ma'lumot.
// 3 manbadan kelishi mumkin: matn (copy-paste), OCR (rasmdan), fayl (PDF/DOCX/PPTX)
// Saqlanadigan asosiy narsa — TOZA MATN (content). AI test generatsiyasi shu matndan ishlaydi.

const studyMaterialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Fan ID (examService.SUBJECT_META'dagi kalit: uztil, math, tarix, bio, kimyo...)
  subjectId: {
    type: String,
    required: true,
    index: true,
  },

  // Material manbai
  source: {
    type: String,
    enum: ['text', 'ocr', 'file'],
    required: true,
  },

  // Foydalanuvchi bergan nom (ko'rinishida ko'rsatish uchun)
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true,
  },

  // ASL kontent — tahrirlangan, tozalangan matn (AI ishlatadigan)
  content: {
    type: String,
    required: true,
  },

  // Belgilar soni (limitlar uchun)
  charCount: {
    type: Number,
    required: true,
    min: 0,
  },

  // Manba haqida qo'shimcha ma'lumot (debug/UI uchun)
  sourceMeta: {
    fileName:     { type: String, default: '' },     // ocr/file uchun original fayl nomi
    fileMime:     { type: String, default: '' },
    fileSizeKb:   { type: Number, default: 0 },
    pageCount:    { type: Number, default: 0 },      // file uchun
    ocrRawLength: { type: Number, default: 0 },      // OCR natijasining asl uzunligi (tahrirgacha)
  },

  // Bu materialdan AI necha marta test generatsiya qilingan
  testGenCount: {
    type: Number,
    default: 0,
  },

  // Soft-delete (kelajakda kerak bo'lishi mumkin)
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Tezkor topish uchun kompozit indekslar
studyMaterialSchema.index({ userId: 1, subjectId: 1, isActive: 1, createdAt: -1 });
studyMaterialSchema.index({ userId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
