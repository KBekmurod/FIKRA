const mongoose = require('mongoose');

const testQuestionSchema = new mongoose.Schema({
  subject: {
    type: String,
    enum: ['uztil', 'math', 'tarix', 'bio', 'kimyo', 'fizika', 'ingliz', 'rus', 'inform', 'iqtisod'],
    required: true,
    index: true,
  },
  block: {
    type: String,
    enum: ['majburiy', 'mutaxassislik'],
    required: true,
  },
  question: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: v => v.length === 4,
  },
  answer: {
    type: Number, // 0-3 index
    required: true,
    min: 0,
    max: 3,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  explanation: { type: String, default: '' }, // AI hint uchun
  year: { type: Number, default: null }, // DTM yili (agar mavjud)
  topic: { type: String, default: '' }, // Mavzu (masalan, 'Tenglamalar', 'Qadimgi dunyo')
}, {
  timestamps: true,
});

testQuestionSchema.index({ subject: 1, difficulty: 1 });

module.exports = mongoose.model('TestQuestion', testQuestionSchema);
