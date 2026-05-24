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

const userSchema = new mongoose.Schema({
  // ─── Identifikatsiya (email yoki telefon — kamida bittasi majburiy) ──────
  // Foydalanuvchi email yoki telefon (yoki ikkalasini ham) bilan ro'yxatdan
  // o'tishi mumkin. Login paytida bittasini ishlatadi.
  email: {
    type: String,
    default: null,
    lowercase: true,
    trim: true,
    unique: true,
    sparse: true,    // null bo'lsa unique tekshirilmaydi
    index: true,
  },

  // Telefon nomer — E.164 formatda saqlanadi (masalan: +998901234567)
  phone: {
    type: String,
    default: null,
    trim: true,
    unique: true,
    sparse: true,
    index: true,
  },

  // Parol (Google bilan kirganda shart emas)
  passwordHash: { type: String, default: '' },

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

  // ─── AI kunlik ishlatish ─────────────────────────────────────────────────
  aiUsage: { type: aiUsageSchema, default: () => ({}) },

  // ─── Gamifikatsiya (Streak) ─────────────────────────────────────────────
  currentStreak:  { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null }, // 'YYYY-MM-DD'

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ─── Validatsiya: email yoki phone — kamida bittasi bo'lishi shart ──────────
userSchema.pre('validate', function(next) {
  if (!this.email && !this.phone) {
    return next(new Error('Email yoki telefon nomer kerak'));
  }
  next();
});

// ─── Plan limitlari (kunlik) ─────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:  {
    hints: 10,       chats: 15,        docs: 2,        images: 0,
    textMaterials: 3,
    ocrUploads:    3,
    fileUploads:   1,
    testsGen:      2,
  },
  basic: {
    hints: Infinity, chats: 50,        docs: 10,       images: 5,
    textMaterials: 20,
    ocrUploads:    15,
    fileUploads:   12,
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
