// node src/utils/seedQuestions.js  — ishga tushirish uchun

require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('../models/TestQuestion');
const { logger } = require('./logger');

const questions = [
  // ─── ONA TILI ───────────────────────────────────────────────────────────────
  { subject: 'uztil', block: 'majburiy', difficulty: 'easy',
    question: "Quyidagi so'zlardan qaysi biri to'g'ri yozilgan?",
    options: ['Kitob', 'Kitab', 'Kitov', 'Kitup'], answer: 0,
    explanation: "O'zbek tilida \"kitob\" so'zi to'g'ri yoziladi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "\"Ota-onam keldi\" gapida kesim qaysi?",
    options: ['Ota-onam', 'Keldi', 'Ota', 'Onam'], answer: 1,
    explanation: "Kesim — gapning asosiy bo'lagi, harakat bildiradi. \"Keldi\" fe'li kesim." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Qaysi qatorda barcha so'zlar unli tovush bilan boshlanadi?",
    options: ['Olma, bola, uy', 'Olma, uy, inson', 'Bola, inson, arzon', 'Daftar, uy, olma'], answer: 1,
    explanation: "Olma (o), uy (u), inson (i) — hammasi unli bilan boshlanadi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "\"Muallim dars berdi\" gapida ega qaysi?",
    options: ['Dars', 'Berdi', 'Muallim', 'Dars berdi'], answer: 2,
    explanation: "Ega — harakat egasi. \"Muallim\" kim dars berdi? savoliga javob." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Quyidagi so'zlardan qaysi biri sinonim emas?",
    options: ['Bahor-ko\'klam', 'Kuz-xazon', 'Qish-sovuq', 'Yoz-saraton'], answer: 2,
    explanation: "Qish va sovuq sinonim emas — qish fasl, sovuq sifat/holat." },

  // ─── MATEMATIKA ─────────────────────────────────────────────────────────────
  { subject: 'math', block: 'majburiy', difficulty: 'easy',
    question: "x² - 5x + 6 = 0 tenglamaning ildizlari yig'indisi?",
    options: ['3', '5', '6', '-5'], answer: 1,
    explanation: "Viet teoremasi: x₁+x₂ = -b/a = 5/1 = 5." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "log₂(32) = ?",
    options: ['4', '5', '6', '3'], answer: 1,
    explanation: "2⁵ = 32, shuning uchun log₂(32) = 5." },
  { subject: 'math', block: 'majburiy', difficulty: 'easy',
    question: "sin(30°) = ?",
    options: ['1', '√3/2', '1/2', '√2/2'], answer: 2,
    explanation: "sin(30°) = 1/2 — asosiy trigonometrik qiymat." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "3x + 7 = 22 tenglamaning yechimi?",
    options: ['3', '4', '5', '6'], answer: 2,
    explanation: "3x = 22 - 7 = 15, x = 15/3 = 5." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "∫(2x)dx = ?",
    options: ['x', 'x² + C', '2x² + C', '2 + C'], answer: 1,
    explanation: "∫2x dx = 2·(x²/2) + C = x² + C." },

  // ─── O'ZBEKISTON TARIXI ──────────────────────────────────────────────────────
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy',
    question: "O'zbekiston mustaqillikni qaysi yili e'lon qildi?",
    options: ['1989', '1990', '1991', '1992'], answer: 2,
    explanation: "O'zbekiston Respublikasi mustaqilligini 1991 yil 31 avgustda e'lon qildi." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Amir Temur qaysi shaharda tug'ilgan?",
    options: ['Samarqand', 'Buxoro', 'Kesh (Shahrisabz)', 'Xiva'], answer: 2,
    explanation: "Amir Temur 1336 yilda Kesh (hozirgi Shahrisabz) shahrida tug'ilgan." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy',
    question: "O'zbekistonning birinchi Prezidenti kim?",
    options: ['Sh. Mirziyoyev', 'I. Karimov', 'A. Mutalov', 'R. Nishonov'], answer: 1,
    explanation: "Islam Karimov O'zbekistonning birinchi Prezidenti (1991-2016)." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Ulug'bek rasadxonasi qaysi shaharda joylashgan?",
    options: ['Buxoro', 'Xiva', 'Samarqand', 'Toshkent'], answer: 2,
    explanation: "Ulug'bek rasadxonasi Samarqand shahrida, 1428-1429 yillarda qurilgan." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "\"Temuriylar uyg'onishi\" qaysi asrga to'g'ri keladi?",
    options: ['XII asr', 'XIII asr', 'XIV-XV asrlar', 'XVI asr'], answer: 2,
    explanation: "Temuriylar madaniy yuksalishi asosan XIV-XV asrlarda bo'ldi." },

  // ─── BIOLOGIYA (mutaxassislik) ───────────────────────────────────────────────
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "Hujayra membranasining asosiy tarkibiy qismi?",
    options: ['Oqsil va lipid', 'Kraxmal va glyukoza', 'DNK va RNK', 'Ferment va vitamin'], answer: 0,
    explanation: "Hujayra membranasi fosfolipid ikki qavat va oqsillardan tashkil topgan." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard',
    question: "Fotosintez jarayonida qaysi organoid ishtirok etadi?",
    options: ['Mitoxondriya', 'Ribosoma', 'Xloroplast', 'Lizosoma'], answer: 2,
    explanation: "Xloroplastlar xlorofil tutib, quyosh energiyasini kimyoviy energiyaga aylantiradi." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "DNK replikatsiyasida qaysi ferment asosiy rol o'ynaydi?",
    options: ['DNK-polimeraz', 'RNK-polimeraz', 'Ligaza', 'Resteraza'], answer: 0,
    explanation: "DNK-polimeraz fermenti DNK zanjirini nusxa ko'chiradi." },

  // ─── KIMYO (mutaxassislik) ───────────────────────────────────────────────────
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "NaOH + HCl reaksiyasi natijalari?",
    options: ['NaCl + H₂', 'NaCl + H₂O', 'Na₂O + HCl', 'NaH + ClO'], answer: 1,
    explanation: "Bu neytrallanish reaksiyasi: NaOH + HCl → NaCl + H₂O." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard',
    question: "Metanning molekulyar formulasi?",
    options: ['C₂H₆', 'CH₄', 'C₃H₈', 'C₂H₄'], answer: 1,
    explanation: "Metan — eng sodda uglevodorod, CH₄ formulaga ega." },

  // ─── FIZIKA (mutaxassislik) ──────────────────────────────────────────────────
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Nyutonning 2-qonuni formulasi?",
    options: ['F = mv', 'F = ma', 'F = m/a', 'F = v/t'], answer: 1,
    explanation: "F = ma: kuch massa va tezlanish ko'paytmasiga teng." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'easy',
    question: "Yorug'likning vakuumdagi tezligi taxminan?",
    options: ['3×10⁶ m/s', '3×10⁸ m/s', '3×10¹⁰ m/s', '3×10⁴ m/s'], answer: 1,
    explanation: "c ≈ 3×10⁸ m/s — yorug'likning vakuumdagi tezligi." },

  // ─── INGLIZ TILI (mutaxassislik) ─────────────────────────────────────────────
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy',
    question: "\"She ___ a teacher\" gapida to'g'ri fe'l?",
    options: ['am', 'is', 'are', 'be'], answer: 1,
    explanation: "She (u) uchun \"is\" ishlatiladi — Present Simple." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "\"I have been studying\" qaysi zamonga tegishli?",
    options: ['Simple Past', 'Present Perfect', 'Present Perfect Continuous', 'Past Continuous'], answer: 2,
    explanation: "have been + V-ing = Present Perfect Continuous — o'tganidan hozirgacha davom etayotgan harakat." },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await TestQuestion.deleteMany({});
    await TestQuestion.insertMany(questions);
    logger.info(`${questions.length} ta savol bazaga yuklandi`);
    process.exit(0);
  } catch (err) {
    logger.error('Seed xatosi:', err);
    process.exit(1);
  }
}

seed();
