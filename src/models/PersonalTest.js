const mongoose = require('mongoose');

// ─── PersonalTest ────────────────────────────────────────────────────────────
// Foydalanuvchining o'z materiallaridan AI tomonidan yaratilgan testlar.
// Har bir sessiya "ishlash jarayoni" va "tarix" ikkalasini birlashtiradi.
//
// Farqi ExamSession'dan:
//   • Savollar DB'da emas — to'g'ridan-to'g'ri bu documentda saqlanadi
//   • Materiallar snapshot qilinadi (agar material o'chirilsa ham, test ishlaydi)
//   • Faqat 'subject' rejimi bor (DTM rejimi yo'q)

// Bitta savol structurasi
const ptQuestionSchema = new mongoose.Schema({
  // Savolning tartib raqami (0-indexed)
  idx: { type: Number, required: true },

  // Savol matni
  question: { type: String, required: true },

  // 4 ta variant (A, B, C, D)
  options: {
    type: [String],
    required: true,
    validate: v => v.length === 4,
  },

  // To'g'ri javob indeksi (0-3) — foydalanuvchi javob bergandan keyin ochiladi
  answer: { type: Number, required: true, min: 0, max: 3 },

  // AI tushuntirish (ixtiyoriy — generatsiyada qo'shilishi mumkin)
  explanation: { type: String, default: '' },

  // Mavzu (tushuntirish uchun)
  topic: { type: String, default: '' },

}, { _id: false });

// Foydalanuvchi javoblarini sessiya davomida saqlash
const ptAnswerSchema = new mongoose.Schema({
  questionIdx:    { type: Number, required: true },
  selectedOption: { type: Number, required: true, min: 0, max: 3 },
  isCorrect:      { type: Boolean, required: true },
  answeredAt:     { type: Date, default: Date.now },
}, { _id: false });

const personalTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  subjectId: {
    type: String,
    required: true,
    index: true,
  },

  subjectName: { type: String, default: '' },

  // Generatsiyada ishlatilgan materiallar (reference)
  materialIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'StudyMaterial',
    default: [],
  },

  // AI tomonidan yaratilgan savollar (snapshot — materiallar o'chirilsa ham qoladi)
  questions: { type: [ptQuestionSchema], default: [] },

  // Foydalanuvchi javoblari (sessiya davomida to'ldiriladi)
  answers: { type: [ptAnswerSchema], default: [] },

  // Sessiya holati
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
    index: true,
  },

  // Vaqt
  startTime:   { type: Date, default: Date.now },
  endTime:     { type: Date, default: null },

  // Natija (yakunlangandan keyin to'ldiriladi)
  totalCorrect: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  scorePercent:   { type: Number, default: 0 },

  // Test turi: 'material' = materialdan yaratilgan, 'mini' = xato savollardan
  testType: {
    type: String,
    enum: ['material', 'mini'],
    default: 'material',
  },

}, { timestamps: true });

personalTestSchema.index({ userId: 1, subjectId: 1, status: 1, createdAt: -1 });
personalTestSchema.index({ userId: 1, testType: 1, createdAt: -1 });

module.exports = mongoose.model('PersonalTest', personalTestSchema);
