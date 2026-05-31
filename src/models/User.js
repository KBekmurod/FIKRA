const mongoose = require('mongoose');

// ─── AI ishlatish kunlik tracker ─────────────────────────────────────────────
const aiUsageSchema = new mongoose.Schema({
  date:      { type: String,  default: '' },     // 'YYYY-MM-DD' (Tashkent vaqti)
  hints:     { type: Number,  default: 0 },
  chats:     { type: Number,  default: 0 },
  docs:      { type: Number,  default: 0 },
  images:    { type: Number,  default: 0 },
  calories:  { type: Number,  default: 0 },
  ocrUploads:  { type: Number, default: 0 },
  fileUploads: { type: Number, default: 0 },
  testsGen:    { type: Number, default: 0 },
}, { _id: false });

// ─── AI ishlatish umrbod tracker (Moliyaviy tahlil uchun) ─────────────────
const lifetimeAiUsageSchema = new mongoose.Schema({
  hints:       { type: Number, default: 0 },
  chats:       { type: Number, default: 0 },
  docs:        { type: Number, default: 0 },
  images:      { type: Number, default: 0 },
  ocrUploads:  { type: Number, default: 0 },
  fileUploads: { type: Number, default: 0 },
  testsGen:    { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  // ─── Identifikatsiya (Faqat Google email) ──────────────────────────────
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true,
  },

  // ─── Profil ma'lumotlari ──────────────────────────────────────────────────
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  photoUrl:  { type: String, default: '' },
  displayName: { type: String, default: '' },

  // ─── Obuna ───────────────────────────────────────────────────────────────
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'vip'],
    default: 'free',
    index: true,
  },
  planId:             { type: String, default: null },
  planExpiresAt:      { type: Date,   default: null, index: true },
  planLastPurchaseAt: { type: Date,   default: null },
  planChargeIds:      { type: [String], default: [] },

  // ─── AI kunlik va umrbod ishlatish ───────────────────────────────────────
  aiUsage: { type: aiUsageSchema, default: () => ({}) },
  lifetimeAiUsage: { type: lifetimeAiUsageSchema, default: () => ({}) },

  // ─── Gamifikatsiya (Streak) ─────────────────────────────────────────────
  currentStreak:  { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null }, // 'YYYY-MM-DD'

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ─── Plan limitlari (kunlik) ─────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:  {
    hints: 20,       chats: 30,        docs: 3,        images: 5,
    textMaterials: 5,
    ocrUploads:    5,
    fileUploads:   3,
    testsGen:      5,
  },
  basic: {
    hints: 10,       chats: 20,        docs: 5,        images: 5,
    textMaterials: 5,
    ocrUploads:    5,
    fileUploads:   3,
    testsGen:      5,
  },
  pro:   {
    hints: 15,       chats: 30,        docs: 10,       images: 10,
    textMaterials: 10,
    ocrUploads:    10,
    fileUploads:   5,
    testsGen:      10,
  },
  vip:   {
    hints: 25,       chats: 60,        docs: 20,       images: 20,
    textMaterials: 20,
    ocrUploads:    15,
    fileUploads:   10,
    testsGen:      20,
  },
};

userSchema.statics.PLAN_LIMITS = PLAN_LIMITS;

// ─── Material kontekst-cheklovlari ──────────────────────────────────────────
const MATERIAL_RULES = {
  maxTextChars:    30000,
  minTextChars:    50,
  maxImageBytes:   3 * 1024 * 1024,
  maxFileBytes:    7 * 1024 * 1024,
  maxFilePages:    20,
  allowedImageMimes: ['image/jpeg', 'image/jpg', 'image/png'],
  allowedFileMimes:  [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

userSchema.statics.MATERIAL_RULES = MATERIAL_RULES;

// ─── Tashkent (UTC+5) bo'yicha kunlik kalit ──────────────────────────────────
function _todayKeyTashkent(date) {
  const d = date || new Date();
  const tashkent = new Date(d.getTime() + 5 * 3600 * 1000);
  return tashkent.toISOString().slice(0, 10);
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
