const mongoose = require('mongoose');

const tokenTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  telegramId: { type: Number, required: true, index: true },
  amount: { type: Number, required: true }, // musbat = kirim, manfiy = chiqim
  type: {
    type: String,
    enum: ['earn', 'spend', 'bonus', 'referral', 'daily', 'streak', 'subscription', 'xp'],
    required: true,
  },
  source: {
    type: String,
    enum: ['ads_rewarded', 'ads_interstitial', 'game_stroop', 'game_test',
           'ai_chat', 'ai_image', 'ai_calorie', 'ai_video', 'ai_document',
           'daily_bonus', 'referral_bonus', 'admin', 'subscription'],
    required: true,
  },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // qo'shimcha ma'lumot
}, {
  timestamps: true,
});

// 30 kundan eski yozuvlarni indekslash uchun TTL (opsional)
// tokenTransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

module.exports = mongoose.model('TokenTransaction', tokenTransactionSchema);
