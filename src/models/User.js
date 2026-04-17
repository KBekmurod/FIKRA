const mongoose = require('mongoose');

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

  // Token tizimi
  tokens: { type: Number, default: 50, min: 0 },

  // Obuna
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro'],
    default: 'free',
  },
  planExpiresAt: { type: Date, default: null },

  // Gamification
  streakDays: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: null },
  totalGamesPlayed: { type: Number, default: 0 },
  totalAiRequests: { type: Number, default: 0 },

  // Referral
  referredBy: { type: Number, default: null }, // telegramId
  referralCount: { type: Number, default: 0 },

  // Kunlik cheklov (bepul foydalanuvchilar)
  dailyTokensUsed: { type: Number, default: 0 },
  dailyTokensDate: { type: Date, default: null },

  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// ─── Virtual: obuna aktiv? ────────────────────────────────────────────────────
userSchema.virtual('isPro').get(function () {
  return this.plan === 'pro' && this.planExpiresAt && this.planExpiresAt > new Date();
});

userSchema.virtual('isBasic').get(function () {
  return (this.plan === 'basic' || this.plan === 'pro') &&
    this.planExpiresAt && this.planExpiresAt > new Date();
});

// ─── Streak yangilash ─────────────────────────────────────────────────────────
userSchema.methods.updateStreak = function () {
  const now = new Date();
  const lastLogin = this.lastLoginDate;
  if (!lastLogin) {
    this.streakDays = 1;
  } else {
    const diffMs = now - lastLogin;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      this.streakDays += 1;
    } else if (diffDays > 1) {
      this.streakDays = 1;
    }
    // diffDays === 0 => same day, streak o'zgarmaydi
  }
  this.lastLoginDate = now;
};

// ─── Kunlik limit tekshirish ──────────────────────────────────────────────────
userSchema.methods.canUseTokens = function (amount) {
  if (this.plan !== 'free') return true; // Obunalilarga cheklov yo'q
  const today = new Date().toDateString();
  const lastDate = this.dailyTokensDate ? this.dailyTokensDate.toDateString() : null;
  if (lastDate !== today) {
    // Yangi kun — reset
    this.dailyTokensUsed = 0;
    this.dailyTokensDate = new Date();
  }
  return (this.dailyTokensUsed + amount) <= 30; // Bepuflarga kuniga 30t
};

module.exports = mongoose.model('User', userSchema);
