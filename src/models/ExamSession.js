const mongoose = require('mongoose');

// Per-subject breakdown stored in session
const subjectStatSchema = new mongoose.Schema({
  subjectId:     { type: String, required: true },
  subjectName:   { type: String, default: '' },
  block:         { type: String, enum: ['majburiy', 'mutaxassislik_1', 'mutaxassislik_2', 'subject'], default: 'subject' },
  weight:        { type: Number, default: 1.1 },
  questionCount: { type: Number, default: 10 },
  correct:       { type: Number, default: 0 },
  wrong:         { type: Number, default: 0 },
  score:         { type: Number, default: 0 },
  maxScore:      { type: Number, default: 0 },
}, { _id: false });

const examSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  mode: {
    type: String,
    enum: ['dtm', 'subject'],
    required: true,
    index: true,
  },

  // DTM rejimida
  direction: { type: String, default: null },

  // Subject rejimida tanlangan fanlar
  selectedSubjects: { type: [String], default: [] },

  // Savol IDlari (tartib saqlanadi)
  questionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

  durationSeconds: { type: Number, default: 10800 },

  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
    index: true,
  },

  startTime:  { type: Date, default: Date.now },
  endTime:    { type: Date, default: null },

  totalScore:    { type: Number, default: 0 },
  maxTotalScore: { type: Number, default: 0 },

  subjectBreakdown: { type: [subjectStatSchema], default: [] },

  // ─── AI Kabinet — bitta test uchun 1 marotaba qoidasi ────────────────────
  // Foydalanuvchi xato javoblarda AI tushuntirish ishlatgan fanlar ro'yxati.
  // Har fan uchun 1 marta — keyin "qayta tushuntirish" tugmasi yopiladi.
  explainedSubjects: { type: [String], default: [] },

  // Mini-test allaqachon yaratilganmi (bu sessiya uchun 1 marta)
  miniTestGenerated: { type: Boolean, default: false },

}, { timestamps: true });

examSessionSchema.index({ userId: 1, mode: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
