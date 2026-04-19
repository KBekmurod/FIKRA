const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  // Turnir turi
  type: {
    type: String,
    enum: ['weekly_xp', 'stroop_sprint', 'dtm_marathon'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },

  // Sanalar
  startAt: { type: Date, required: true, index: true },
  endAt:   { type: Date, required: true, index: true },
  isActive: { type: Boolean, default: true, index: true },

  // Prize tizimi
  prizes: [{
    position: Number,     // 1, 2, 3, ...
    tokens: Number,
    vipDays: Number,      // VIP 1 hafta = 7 kun
    xp: Number,
    other: String,        // "iPhone 17 Pro" kabi
  }],

  // Ishtirokchilar (denormalized — tez reyting uchun)
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    telegramId: Number,
    firstName: String,
    score: Number,        // turnir score (XP, stroop ball, to'g'ri javoblar)
    lastUpdate: Date,
  }],

  // Qachon g'oliblar aniqlanadi
  prizesPaid: { type: Boolean, default: false },
}, { timestamps: true });

tournamentSchema.index({ isActive: 1, endAt: 1 });

module.exports = mongoose.model('Tournament', tournamentSchema);
