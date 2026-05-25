const mongoose = require('mongoose');

// ─── MaterialFolder ─────────────────────────────────────────────────────────
// Qat'iy qoida: 1 Papka = N Material = N AI Test
//
// Bu papka tizimi ma'lum bir mavzuni anglatadi (Masalan, "Kvadrat tenglamalar").
// Har papka:
//   - Bir nechta materiallarni o'z ichiga oladi (1-N)
//   - Bitta AI testga bog'lanadi (1 marta yaratilgan)
//   - Bir nechta urinishlar statistikasi saqlaydi

const folderSchema = new mongoose.Schema({
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

  // YANGI: kontekst — bir xil fan (masalan, math) majburiy yoki mutaxassislik
  // uchun bo'lishi mumkin. Bu farqlaydi.
  //   • 'majburiy'      → DTM majburiy bloki (10 savol, 1.1 ball, oddiy)
  //   • 'mutaxassislik' → chuqurroq (30 savol, 2.1/3.1 ball, murakkab)
  //
  // Faqat 3 ta fan ikkala kontekstda bo'lishi mumkin:
  //   math, onatili/adab, tarix
  context: {
    type: String,
    enum: ['majburiy', 'mutaxassislik'],
    required: true,
    index: true,
  },

  // Papka nomi (material sarlavhasi bilan bir xil bo'ladi default)
  title: { type: String, required: true, trim: true, maxlength: 200 },

  // Asosiy test (AI yaratgan oxirgi test)
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalTest',
    default: null,
  },

  // Test holatI
  testStatus: {
    type: String,
    enum: ['no_test', 'generating', 'has_test', 'generation_failed'],
    default: 'no_test',
  },

  // Qat'iy savol soni (majburiy=10, mutaxassislik=30)
  testStandardCount: { type: Number, required: true },

  // ─── Statistika (har test urinishidan keyin yangilanadi) ────────────────
  stats: {
    attemptsCount:   { type: Number, default: 0 },   // Nechta marta test ishlangan
    bestScore:       { type: Number, default: 0 },   // Eng yaxshi natija (%)
    bestCorrect:     { type: Number, default: 0 },   // Eng ko'p to'g'ri javob soni
    avgScore:        { type: Number, default: 0 },   // O'rtacha natija (%)
    totalScoreSum:   { type: Number, default: 0 },   // O'rtacha hisoblash uchun
    lastAttemptDate: { type: Date,   default: null },
    lastAttemptScore:{ type: Number, default: 0 },
    masteryLevel:    {                                // Bilim darajasi
      type: String,
      enum: ['weak', 'medium', 'strong', 'unknown'],
      default: 'unknown',
    },
  },

  // Mini-test mavjudligi (asosiy test natijalaridan)
  miniTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalTest',
    default: null,
  },
  miniTestGenerated: { type: Boolean, default: false },

  // AI generatsiya hisobotlari (debugging uchun)
  generationLog: {
    requestedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    errorMessage: { type: String, default: null },
    aiAdjustedContent: { type: Boolean, default: false }, // AI o'zi yetkazib bergan
  },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

folderSchema.index({ userId: 1, subjectId: 1, isActive: 1, createdAt: -1 });

// Statistikani yangilash uchun helper
folderSchema.methods.recordAttempt = function(correctCount, totalCount) {
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  this.stats.attemptsCount += 1;
  this.stats.totalScoreSum += score;
  this.stats.avgScore = Math.round(this.stats.totalScoreSum / this.stats.attemptsCount);
  this.stats.lastAttemptDate = new Date();
  this.stats.lastAttemptScore = score;

  if (correctCount > this.stats.bestCorrect) {
    this.stats.bestCorrect = correctCount;
    this.stats.bestScore = score;
  }

  // Mastery level: o'rtacha asosida
  if (this.stats.avgScore >= 80) this.stats.masteryLevel = 'strong';
  else if (this.stats.avgScore >= 50) this.stats.masteryLevel = 'medium';
  else this.stats.masteryLevel = 'weak';
};

module.exports = mongoose.model('MaterialFolder', folderSchema);
