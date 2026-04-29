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
  selectedOption: {
    type: Number, // 0-3 index (0=A, 1=B, 2=C, 3=D), matches TestQuestion.answer
    required: true,
    min: 0,
    max: 3,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  block: {
    type: String,
    enum: ['majburiy', 'mutaxassislik_1', 'mutaxassislik_2'],
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('UserAnswer', userAnswerSchema);
