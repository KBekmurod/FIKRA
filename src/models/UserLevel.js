const mongoose = require('mongoose');

// ─── UserLevel ───────────────────────────────────────────────────────────────
// Beta / Delta / Alfa daraja tizimi (PDF mind-map bo'yicha)
//
// Daraja strukturasi:
//   Beta  → versiya 1, 2, 3      (oson daraja)
//   Delta → versiya 4, 5, 6, 7   (o'rta daraja)
//   Alfa  → versiya 8, 9, 10     (yuqori daraja)
//
// O'lchov manbalari:
//   Beta:  Fikra standart testlar + Shaxsiy individual testlar natijalari
//   Delta: Standart + Individual (chuqurroq tahlil bilan)
//   Alfa:  Xato savollardan yaratilgan mini-testlar natijalari
//
// Har oy avtomatik nolga tushadi (lazy reset — so'rov vaqtida tekshiriladi).
// Oylik tarix saqlanib boradi.

// Oylik tarix yozuvi
const monthHistorySchema = new mongoose.Schema({
  monthKey:    { type: String, required: true },  // 'YYYY-MM' (masalan, '2026-05')
  maxVersion:  { type: Number, default: 1 },      // Shu oydagi eng yuqori daraja (1-10)
  grade:       { type: String, default: 'beta' }, // 'beta' | 'delta' | 'alfa'

  // Shu oy statistikasi
  standardTests: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
  personalTests: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
  miniTests:     { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },

  endedAt: { type: Date, default: null }, // Oy tugaganda to'ldiriladi
}, { _id: false });

const userLevelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,   // Har user uchun bitta hujjat
    index: true,
  },

  // ─── Joriy oy ma'lumotlari ────────────────────────────────────────────────
  currentMonth: { type: String, default: '' },   // 'YYYY-MM' (Tashkent vaqti)

  // Joriy daraja: 1-10 (1=beta1, 4=delta1, 8=alfa1)
  currentVersion: { type: Number, default: 1, min: 1, max: 10 },

  // Joriy daraja nomi ('beta' | 'delta' | 'alfa')
  currentGrade: {
    type: String,
    enum: ['beta', 'delta', 'alfa'],
    default: 'beta',
  },

  // ─── Joriy oy test natijalari (progressni hisoblash uchun) ────────────────
  // Standart Fikra testlari (beta + delta uchun)
  standardTests: {
    correct: { type: Number, default: 0 },
    total:   { type: Number, default: 0 },
  },

  // Shaxsiy individual testlar (beta + delta uchun)
  personalTests: {
    correct: { type: Number, default: 0 },
    total:   { type: Number, default: 0 },
  },

  // Mini-testlar (xato savollardan) — alfa uchun
  miniTests: {
    correct: { type: Number, default: 0 },
    total:   { type: Number, default: 0 },
  },

  // ─── Oylik tarix ──────────────────────────────────────────────────────────
  // So'nggi 12 oy tarix
  history: { type: [monthHistorySchema], default: [] },

}, { timestamps: true });

module.exports = mongoose.model('UserLevel', userLevelSchema);
