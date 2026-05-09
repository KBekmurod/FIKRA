const mongoose = require('mongoose');

// ─── UserAnswer ──────────────────────────────────────────────────────────────
// MUHIM: SNAPSHOT pattern.
// Admin TestQuestion'ni o'chirgan/yangilagan bo'lsa ham,
// foydalanuvchi tarixida savol matni, javoblari, tushuntirishi saqlanib qoladi.
// Bu Tarix va AI Kabinetni ma'lumotlar bazasidagi o'chirishlardan himoya qiladi.

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
  // Asl savol ID — null bo'lishi mumkin (admin o'chirgan bo'lsa)
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestQuestion',
    default: null,
  },

  // ─── SNAPSHOT MAYDONLAR ───────────────────────────────────────────────────
  // Sessiya yakunlanganda bu yerga ko'chirilib saqlanadi.
  // Endi admin o'chirsa ham, foydalanuvchi savolni va javobini ko'ra oladi.
  questionText:    { type: String, default: '' },         // Savol matni
  questionOptions: { type: [String], default: [] },       // Variantlar [A, B, C, D]
  correctAnswer:   { type: Number, default: -1, min: -1, max: 3 }, // To'g'ri javob indeksi
  explanation:     { type: String, default: '' },         // Tushuntirish
  topic:           { type: String, default: '' },         // Mavzu
  difficulty:      { type: String, default: 'medium' },   // Qiyinlik darajasi

  // ─── FOYDALANUVCHI JAVOBI ─────────────────────────────────────────────────
  subjectId: { type: String, default: '', index: true },
  selectedOption: {
    type: Number,
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

userAnswerSchema.index({ sessionId: 1, questionId: 1 });
userAnswerSchema.index({ userId: 1, isCorrect: 1, createdAt: -1 });

module.exports = mongoose.model('UserAnswer', userAnswerSchema);
