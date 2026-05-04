const mongoose = require('mongoose');

const userAnswerSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamSession',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestQuestion',
    required: true,
  },
  subjectId: { type: String, default: '' },
  selectedOption: {
    type: Number, // 0-3 (0=A, 1=B, 2=C, 3=D)
    required: true,
    min: 0,
    max: 3,
  },
  isCorrect: { type: Boolean, required: true },
  block: {
    type: String,
    enum: ['majburiy', 'mutaxassislik_1', 'mutaxassislik_2', 'subject'],
    default: 'subject',
  },
}, { timestamps: true });

userAnswerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('UserAnswer', userAnswerSchema);
