const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  direction: {
    type: String,
    required: true, // e.g., 'Tibbiyot', 'Arxitektura', 'Pedagogika'
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress',
    index: true,
  },
  startTime: { type: Date, default: Date.now },
  endTime:   { type: Date, default: null },
  totalScore: { type: Number, default: 0 },
  blockScores: {
    majburiy:        { type: Number, default: 0 },
    mutaxassislik_1: { type: Number, default: 0 },
    mutaxassislik_2: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ExamSession', examSessionSchema);
