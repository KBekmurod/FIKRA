const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  telegramId: { type: Number, required: true, index: true },

  gameType: {
    type: String,
    enum: ['stroop-color', 'stroop-tf', 'test-maj', 'test-mut'],
    required: true,
  },

  // Stroop uchun
  score: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  durationSec: { type: Number, default: 0 },

  // DTM Test uchun
  subject: { type: String, default: '' }, // uztil, math, tarix, bio, ...
  direction: { type: String, default: '' }, // iqtisodiyot, tibbiyot, huquq, it
  ballAmount: { type: Number, default: 0 },
  maxBall: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },

  tokensEarned: { type: Number, default: 0 },

  // Turnir
  isTournament: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// Leaderboard uchun index
gameSessionSchema.index({ gameType: 1, score: -1 });
gameSessionSchema.index({ gameType: 1, ballAmount: -1 });
gameSessionSchema.index({ telegramId: 1, gameType: 1 });

module.exports = mongoose.model('GameSession', gameSessionSchema);
