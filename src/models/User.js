const mongoose = require('mongoose');

// ─── AI ishlatish kunlik tracker ─────────────────────────────────────────────
// Har xil AI turi bo'yicha kunlik sanash
const aiUsageSchema = new mongoose.Schema({
  date: { type: String, default: '' },     // 'YYYY-MM-DD' (Tashkent vaqti)
  hints: { type: Number, default: 0 },     // DTM test AI tushuntirish
  chats: { type: Number, default: 0 },     // AI Chat xabar
  docs:  { type: Number, default: 0 },     // AI Hujjat
  images:{ type: Number, default: 0 },     // AI Rasm
  calories:{ type: Number, default: 0 },   // Kaloriya tahlili
}, { _id: false });

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  username: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  photoUrl: { type: String, default: '' },

  // ─── Obuna (Telegram Stars) ──────────────────────────────────────────────
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'vip'],
    default: 'free',
    index: true,
  },
  planId: { type: String, default: null },              // 'basic_1m', 'pro_3m'...
  planExpiresAt: { type: Date, default: null, index: true },
  planLastPurchaseAt: { type: Date, default: null },
  planChargeIds: { type: [String], default: [] },        // idempotency uchun

  // ─── AI kunlik ishlatish ─────────────────────────────────────────────────
  aiUsage: { type: aiUsageSchema, default: () => ({}) },

  // ─── Gamification (tokensiz) ─────────────────────────────────────────────
  streakDays: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },
  totalGamesPlayed: { type: Number, default: 0 },
  totalAiRequests: { type: Number, default: 0 },

  // XP/Lavozim — qoladi (status drive uchun)
  xp: { type: Number, default: 0, min: 0, index: true },
  rank: { type: String, default: 'seedling' },
  rankLevel: { type: Number, default: 1 },

  // ─── Referral (token bonusisiz, faqat statistika) ────────────────────────
  referredBy: { type: Number, default: null },
  referralCount: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ─── Plan limitlari (kunlik) ─────────────────────────────────────────────────
//   free:  test cheksiz, hints=5, qolgani=0, o'yin=3 partiya
//   basic: hints cheksiz, chat=50, qolgani=0, o'yin cheksiz
//   pro:   chat cheksiz, doc=10, image=20, o'yin cheksiz
//   vip:   hammasi cheksiz
// Plan limitlari (kunlik)
//   free:  test cheksiz + hint 5/kun + chat 10/kun + doc 2/kun
//   basic: hint cheksiz + chat 50/kun + doc 10/kun + image 5/kun
//   pro:   hint cheksiz + chat cheksiz + doc 30/kun + image 20/kun
//   vip:   hammasi cheksiz
const PLAN_LIMITS = {
  free:  { hints: 5,        chats: 10,        docs: 2,        images: 0 },
  basic: { hints: Infinity, chats: 50,        docs: 10,       images: 5 },
  pro:   { hints: Infinity, chats: Infinity,  docs: 30,       images: 20 },
  vip:   { hints: Infinity, chats: Infinity,  docs: Infinity, images: Infinity },
};

userSchema.statics.PLAN_LIMITS = PLAN_LIMITS;

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

// ─── Streak yangilash (Tashkent zonasi) ──────────────────────────────────────
userSchema.methods.updateStreak = function () {
  const now = new Date();
  const todayKey = _todayKeyTashkent(now);
  const lastKey = this.lastLoginDate ? _todayKeyTashkent(this.lastLoginDate) : null;

  if (!lastKey) {
    this.streakDays = 1;
  } else if (lastKey === todayKey) {
    // Bugun allaqachon kirgan — streak o'zgarmaydi
  } else {
    const lastTs = new Date(lastKey + 'T00:00:00.000Z').getTime();
    const todayTs = new Date(todayKey + 'T00:00:00.000Z').getTime();
    const diffDays = Math.round((todayTs - lastTs) / 86400000);
    if (diffDays === 1) this.streakDays += 1;
    else if (diffDays > 1) this.streakDays = 1;
  }
  this.lastLoginDate = now;
};

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
