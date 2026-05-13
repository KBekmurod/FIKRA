const mongoose = require('mongoose');

// ─── AI ishlatish kunlik tracker ─────────────────────────────────────────────
// Har xil AI turi bo'yicha kunlik sanash
const aiUsageSchema = new mongoose.Schema({
  date:      { type: String,  default: '' },     // 'YYYY-MM-DD' (Tashkent vaqti)
  // AI funksiyalari
  hints:     { type: Number,  default: 0 },      // DTM test AI tushuntirish
  chats:     { type: Number,  default: 0 },      // AI Chat xabar
  docs:      { type: Number,  default: 0 },      // AI Hujjat
  images:    { type: Number,  default: 0 },      // AI Rasm
  calories:  { type: Number,  default: 0 },      // Kaloriya tahlili
  // v2: Material yuklash kunlik trackerlari
  ocrUploads:  { type: Number, default: 0 },     // Rasmdan matn (OCR) kunlik
  fileUploads: { type: Number, default: 0 },     // PDF/DOCX/PPTX kunlik
  // v2: AI test generatsiyasi
  testsGen:    { type: Number, default: 0 },     // AI orqali test yaratish kunlik
}, { _id: false });

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  username:  { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  photoUrl:  { type: String, default: '' },

  // ─── Obuna (Telegram Stars / P2P) ────────────────────────────────────────
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'vip'],
    default: 'free',
    index: true,
  },
  planId:             { type: String, default: null },        // 'basic_1m', 'pro_3m'...
  planExpiresAt:      { type: Date,   default: null, index: true },
  planLastPurchaseAt: { type: Date,   default: null },
  planChargeIds:      { type: [String], default: [] },        // idempotency uchun

  // ─── AI kunlik ishlatish ─────────────────────────────────────────────────
  aiUsage: { type: aiUsageSchema, default: () => ({}) },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ─── Plan limitlari (kunlik) ─────────────────────────────────────────────────
//
// AI funksiyalari:
//   free:  hints 5/kun, chats 10/kun, docs 2/kun, images 0
//   basic: hints ∞,     chats 50/kun, docs 10/kun, images 5
//   pro:   hints ∞,     chats ∞,      docs 30/kun, images 20
//   vip:   hammasi ∞
//
// v2 — Material yuklash limitlari:
//   • textMaterials: bitta fan uchun matn materiallari soni (jami)
//   • ocrUploads:    bir kunda rasmdan matn (OCR) yuklashlar
//   • fileUploads:   bir kunda PDF/DOCX/PPTX fayl yuklashlar
//   • testsGen:      bir kunda AI orqali test yaratish soni
//
const PLAN_LIMITS = {
  free:  {
    hints: 5,        chats: 10,        docs: 2,        images: 0,
    textMaterials: 1,        // bitta fan uchun jami 1 ta matn material
    ocrUploads:    1,        // jami 1 ta rasm OCR (kunlik emas, jami)
    fileUploads:   0,        // fayl yuklash yo'q
    testsGen:      2,        // kuniga 2 ta AI test yaratish
  },
  basic: {
    hints: Infinity, chats: 50,        docs: 10,       images: 5,
    textMaterials: 20,       // bitta fan uchun 20 tagacha matn
    ocrUploads:    15,       // kuniga 15 ta OCR
    fileUploads:   12,       // kuniga 12 ta fayl
    testsGen:      10,
  },
  pro:   {
    hints: Infinity, chats: Infinity,  docs: 30,       images: 20,
    textMaterials: 20,
    ocrUploads:    15,
    fileUploads:   12,
    testsGen:      30,
  },
  vip:   {
    hints: Infinity, chats: Infinity,  docs: Infinity, images: Infinity,
    textMaterials: 20,
    ocrUploads:    15,
    fileUploads:   12,
    testsGen:      Infinity,
  },
};

userSchema.statics.PLAN_LIMITS = PLAN_LIMITS;

// ─── Material kontekst-cheklovlari (qattiq) ──────────────────────────────────
// Bu plan'ga bog'liq emas — tizim darajasidagi cheklovlar
const MATERIAL_RULES = {
  maxTextChars:    30000,        // bitta matn material uchun maksimum belgi
  minTextChars:    50,           // shunchaki bo'sh saqlamasin uchun
  maxImageBytes:   3 * 1024 * 1024,    // 3 MB
  maxFileBytes:    7 * 1024 * 1024,    // 7 MB
  maxFilePages:    20,
  allowedImageMimes: ['image/jpeg', 'image/jpg', 'image/png'],
  allowedFileMimes:  [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  ],
};

userSchema.statics.MATERIAL_RULES = MATERIAL_RULES;

// ─── Tashkent (UTC+5) bo'yicha kunlik kalit ──────────────────────────────────
function _todayKeyTashkent(date) {
  const d = date || new Date();
  const tashkent = new Date(d.getTime() + 5 * 3600 * 1000);
  return tashkent.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
userSchema.statics.todayKey = _todayKeyTashkent;

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('isSubscribed').get(function () {
  return this.plan !== 'free' && this.planExpiresAt && this.planExpiresAt > new Date();
});

userSchema.virtual('planLevel').get(function () {
  if (!this.isSubscribed) return 0;
  return ({ free: 0, basic: 1, pro: 2, vip: 3 })[this.plan] || 0;
});

// ─── Plan helpers ─────────────────────────────────────────────────────────────
userSchema.methods.effectivePlan = function () {
  if (this.plan === 'free') return 'free';
  if (!this.planExpiresAt || this.planExpiresAt <= new Date()) return 'free';
  return this.plan;
};

userSchema.methods.getAiLimit = function (kind) {
  const tier = this.effectivePlan();
  return PLAN_LIMITS[tier]?.[kind] ?? 0;
};

userSchema.methods.getAiUsage = function (kind) {
  const todayKey = _todayKeyTashkent();
  if (this.aiUsage?.date !== todayKey) return 0;
  return this.aiUsage?.[kind] || 0;
};

userSchema.methods.canUseAi = function (kind) {
  const limit = this.getAiLimit(kind);
  if (limit === Infinity) return true;
  if (limit <= 0) return false;
  return this.getAiUsage(kind) < limit;
};

module.exports = mongoose.model('User', userSchema);
