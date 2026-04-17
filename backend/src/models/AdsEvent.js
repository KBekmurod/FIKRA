const mongoose = require('mongoose');

const adsEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  telegramId: { type: Number, index: true },
  network: {
    type: String,
    enum: ['adsgram', 'monetag'],
    required: true,
  },
  format: {
    type: String,
    enum: ['rewarded', 'interstitial'],
    required: true,
  },
  tokensGiven: { type: Number, default: 0 },
  estimatedRevUsd: { type: Number, default: 0.004 },
  verified: { type: Boolean, default: false }, // server-side verify
  context: { type: String, default: '' }, // 'game_end', 'retry', 'test_result', ...
}, {
  timestamps: true,
});

module.exports = mongoose.model('AdsEvent', adsEventSchema);
