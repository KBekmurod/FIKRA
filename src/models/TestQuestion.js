const mongoose = require('mongoose');

const testQuestionSchema = new mongoose.Schema({
  subject: {
    type: String,
    enum: ['onatili', 'math', 'tarix', 'majburiy_onatili', 'majburiy_math', 'majburiy_tarix', 'bio', 'kimyo', 'fizika', 'ingliz', 'rus', 'inform', 'iqtisod', 'geo', 'huquq', 'nemis', 'fransuz', 'fors', 'turk', 'adab'],
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
  images: { type: [String], default: [] }, // Savol rasmlari
}, {
  timestamps: true,
});

testQuestionSchema.index({ subject: 1, difficulty: 1 });

module.exports = mongoose.model('TestQuestion', testQuestionSchema);
