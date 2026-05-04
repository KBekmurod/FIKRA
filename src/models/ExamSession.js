const mongoose = require('mongoose');

// New-style per-subject metadata stored in sessions
const subjectScoreSchema = new mongoose.Schema({
  subjectId: { type: String, required: true },
  name:      { type: String, default: '' },
  correct:   { type: Number, default: 0 },
  wrong:     { type: Number, default: 0 },
  score:     { type: Number, default: 0 },
}, { _id: false });

const sessionSubjectSchema = new mongoose.Schema({
  subjectId:     { type: String, required: true },
  name:          { type: String, default: '' },
  block:         { type: String, default: 'majburiy' },
  questionCount: { type: Number, default: 10 },
  weight:        { type: Number, default: 1.1 },
}, { _id: false });

// Backwards-compatible subject breakdown (older code)
const subjectStatSchema = new mongoose.Schema({
  subjectId:     { type: String, required: true },
  subjectName:   { type: String, default: '' },
  block:         { type: String, default: 'subject' },
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

  // 'dtm' or 'subject'
  mode: {
    type: String,
    enum: ['dtm', 'subject'],
    required: true,
    index: true,
  },

  // Optional direction (for dtm mode)
  direction: { type: String, default: null },

  // New-style subjects metadata (preferred)
  subjects: { type: [sessionSubjectSchema], default: [] },

  // Backwards-compatible selectedSubjects array
  selectedSubjects: { type: [String], default: [] },

  // Question order
  questionIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

  // Duration in seconds
  durationSeconds: { type: Number, default: 10800 },

  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
    index: true,
  },

  startTime: { type: Date, default: Date.now },
  endTime:   { type: Date, default: null },

  totalScore:    { type: Number, default: 0 },
  maxTotalScore: { type: Number, default: 0 },

  // New per-subject scores
  subjectScores: { type: [subjectScoreSchema], default: [] },

  // Legacy subject breakdown (kept for compatibility)
  subjectBreakdown: { type: [subjectStatSchema], default: [] },

  // Legacy block-level scores (optional)
  blockScores: {
    type: Object,
    default: { majburiy: 0, mutaxassislik_1: 0, mutaxassislik_2: 0 },
  },
}, { timestamps: true });

examSessionSchema.index({ userId: 1, mode: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ExamSession', examSessionSchema);
