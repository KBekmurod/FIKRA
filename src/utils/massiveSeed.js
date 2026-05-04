const mongoose = require('mongoose');
const TestQuestion = require('../models/TestQuestion');
require('dotenv').config();

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fikra';
  await mongoose.connect(uri);
  console.log('✅ MongoDB ga ulandi');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// 1. Matematika generatori
function generateMath(count, block) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const type = randomInt(1, 4);
    if (type === 1) { // Chiziqli tenglama
      const a = randomInt(2, 9);
      const x = randomInt(-10, 10);
      const b = randomInt(-20, 20);
      const c = a * x + b;
      let q = `Tenglamani yeching: ${a}x ${b >= 0 ? '+' : ''}${b} = ${c}`;
      let ans = x;
      let opts = shuffle([ans, ans + 1, ans - 1, ans + 2]);
      questions.push({
        subject: 'math', block, question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: block === 'majburiy' ? 'easy' : 'medium',
        explanation: `To'g'ri javob ${ans}. Yechim: ${a}x = ${c} - (${b}) => ${a}x = ${c-b} => x = ${x}`
      });
    } else if (type === 2) { // Kvadrat tenglama
      const x1 = randomInt(-5, 5);
      const x2 = randomInt(1, 10);
      const p = -(x1 + x2);
      const qVal = x1 * x2;
      let q = `x^2 ${p >= 0 ? '+' : ''}${p}x ${qVal >= 0 ? '+' : ''}${qVal} = 0 tenglamaning ildizlari yig'indisini toping.`;
      let ans = x1 + x2;
      let opts = shuffle([ans, ans + 2, -ans, ans - 1]);
      questions.push({
        subject: 'math', block, question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: block === 'majburiy' ? 'medium' : 'hard',
        explanation: `Viyet teoremasiga ko'ra, ildizlar yig'indisi x1+x2 = ${-p} ga teng.`
      });
    } else if (type === 3) { // Foiz
      const base = randomInt(1, 50) * 10;
      const pct = randomInt(1, 9) * 10;
      const q = `${base} sonining ${pct}% ini toping.`;
      const ans = Math.round(base * pct / 100);
      let opts = shuffle([ans, ans + 10, ans - 5, ans + 5]);
      questions.push({
        subject: 'math', block, question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: 'easy',
        explanation: `${base} * ${pct} / 100 = ${ans}.`
      });
    } else { // Arifmetika progressiya
      const a1 = randomInt(1, 10);
      const d = randomInt(2, 5);
      const n = randomInt(5, 15);
      const an = a1 + (n - 1) * d;
      const q = `Arifmetik progressiyada a1 = ${a1}, d = ${d} bo'lsa, ${n}-hadni toping.`;
      const ans = an;
      let opts = shuffle([ans, ans + d, Math.abs(ans - d), ans + 2*d]);
      questions.push({
        subject: 'math', block, question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: 'medium',
        explanation: `an = a1 + (n-1)*d formuladan: ${a1} + (${n}-1)*${d} = ${an}`
      });
    }
  }
  return questions;
}

// 2. Fizika generatori
function generatePhysics(count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const type = randomInt(1, 3);
    if (type === 1) { // Kinematika tezlik
      const v = randomInt(5, 30); // m/s
      const t = randomInt(2, 10); // s
      const s = v * t;
      const q = `Jism ${v} m/s o'zgarmas tezlik bilan tekis harakatlanmoqda. U ${t} sekundda qancha masofani (m) bosib o'tadi?`;
      let ans = s;
      let opts = shuffle([ans, ans + v, ans - t, ans * 2]);
      questions.push({
        subject: 'fizika', block: 'mutaxassislik', question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: 'easy', explanation: `S = V * t formuladan: S = ${v} * ${t} = ${ans} m.`
      });
    } else if (type === 2) { // Nyuton qonuni
      const m = randomInt(2, 20); // kg
      const a = randomInt(1, 5); // m/s^2
      const f = m * a;
      const q = `Massasi ${m} kg bo'lgan jismga ${a} m/s^2 tezlanish berish uchun unga qanday kuch (N) ta'sir qilishi kerak?`;
      let ans = f;
      let opts = shuffle([ans, ans + m, Math.abs(ans - a), ans * 2]);
      questions.push({
        subject: 'fizika', block: 'mutaxassislik', question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: 'easy', explanation: `Nyutonning 2-qonuni: F = m * a = ${m} * ${a} = ${f} N.`
      });
    } else { // Om qonuni
      const i = randomInt(1, 5); // A
      const r = randomInt(10, 50); // Om
      const u = i * r;
      const q = `Qarshiligi ${r} Om bo'lgan o'tkazgichdan ${i} A tok o'tayotgan bo'lsa, uning uchlaridagi kuchlanishni (V) toping.`;
      let ans = u;
      let opts = shuffle([ans, ans + r, Math.abs(ans - i), ans + 10]);
      questions.push({
        subject: 'fizika', block: 'mutaxassislik', question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: 'medium', explanation: `Om qonuni U = I * R = ${i} * ${r} = ${u} V.`
      });
    }
  }
  return questions;
}

// 3. Kimyo generatori
function generateChemistry(count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const type = randomInt(1, 2);
    if (type === 1) { // Modda miqdori (mol)
      const m = randomInt(1, 5) * 18; // suv uchun
      const q = `${m} gramm suv (H2O) necha mol bo'ladi? (M(H2O) = 18 g/mol)`;
      const ans = m / 18;
      let opts = shuffle([ans, ans * 2, ans + 1, ans / 2]);
      questions.push({
        subject: 'kimyo', block: 'mutaxassislik', question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: 'easy', explanation: `n = m / M = ${m} / 18 = ${ans} mol.`
      });
    } else { // Massa ulushi
      const mSolute = randomInt(10, 50);
      const mSolvent = randomInt(50, 150);
      const total = mSolute + mSolvent;
      const pct = Math.round((mSolute / total) * 100);
      const q = `${mSolute} g tuz ${mSolvent} g suvda eritildi. Hosil bo'lgan eritmadagi tuzning massa ulushini (%) toping.`;
      let ans = pct;
      let opts = shuffle([ans, ans + 5, Math.abs(ans - 5), ans + 10]);
      questions.push({
        subject: 'kimyo', block: 'mutaxassislik', question: q,
        options: opts.map(String), answer: opts.indexOf(ans),
        difficulty: 'medium', explanation: `w = m(ert) / m(eritma) * 100% = ${mSolute} / ${total} * 100% = ${ans}%`
      });
    }
  }
  return questions;
}

// Qattiq kodlangan savollar
const STATIC_QUESTIONS = [
  // ONA TILI
  { subject: 'uztil', block: 'majburiy', question: '"Sayhonlik" so\'zining ma\'nosi nima?', options: ['Tekis maydon', 'Bog\'-rog\'', 'Daryo bo\'yi', 'Tog\' yonbag\'ri'], answer: 0, explanation: 'Sayhonlik — kichik tekislik, daladir.' },
  { subject: 'uztil', block: 'majburiy', question: 'Quyidagi qaysi gapda ravish ishlatilgan?\n"O\'quvchilar ___ darsda qatnashdilar."', options: ['faol', 'yaxshi', 'tezda', 'aqlli'], answer: 2, explanation: '"Tezda" — harakatning belgisini bildiradi.' },
  // yuzlab tilda qattiq yozish mumkin, biz turli savollar qilamiz
  { subject: 'uztil', block: 'majburiy', question: '"Bilim olish — nur olish" — bu qanday gap?', options: ['Sodda gap', 'Murakkab gap', 'Ergash gap', 'Bog\'lovchili'], answer: 0, explanation: 'Sodda gap.' },
  { subject: 'uztil', block: 'majburiy', question: 'Qaysi qatorda undov gap to\'g\'ri ko\'rsatilgan?', options: ['Bugun havo issiq.', 'Voy, qanday chiroyli!', 'Sen kelding-mi?', 'Kitob o\'qiyman.'], answer: 1, explanation: 'Undov gap his-tuyg\'uni ifodalaydi.' },
  
  // TARIX
  { subject: 'tarix', block: 'majburiy', question: 'Amir Temur qachon tug\'ilgan?', options: ['1336 yil 9-aprel', '1370 yil', '1441 yil', '1501 yil'], answer: 0, explanation: 'Amir Temur 1336-yil 9-aprelda Keshda (Shahrisabzda) tug\'ilgan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Al-Xorazmiyning mashhur asari qaysi?', options: ['Al-Kitob al-Muxtasar fi hisob al-jabr val-muqobala', 'Qobusnoma', 'Boburnoma', 'Xamsa'], answer: 0, explanation: 'Ushbu asar "Algebra" faniga asos solingan.' },
  { subject: 'tarix', block: 'majburiy', question: 'O\'zbekiston qachon mustaqillikka erishdi?', options: ['1991 yil 31 avgust', '1991 yil 1 sentyabr', '1992 yil 1 sentyabr', '1990 yil 1 avgust'], answer: 0, explanation: '1991-yil 31-avgustda e\'lon qilinib, 1-sentyabr bayram kuni.' },
  { subject: 'tarix', block: 'majburiy', question: 'Chingizxon Movarounnahrga qachon bostirib kirdi?', options: ['1219-yilda', '1220-yilda', '1215-yilda', '1225-yilda'], answer: 0, explanation: '1219 yilda O\'tror qamal qilinishi bilan boshlangan.' },

  // BIOLOGIYA
  { subject: 'bio', block: 'mutaxassislik', question: 'Odam organizmida nechta xromosoma bor?', options: ['46 ta', '23 ta', '48 ta', '44 ta'], answer: 0, explanation: 'Odam somatik hujayrasida jami 46 ta (23 juft) xromosoma mavjud.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'O\'simlik hujayrasiga rang beruvchi plastidalar nima deb ataladi?', options: ['Xloroplastlar', 'Xromoplastlar', 'Leykoplastlar', 'Ribosomalar'], answer: 1, explanation: 'Xromoplast - rang beruvchi plastida (qizil, sariq).' },
  
  // INGLIZ TILI
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Choose the correct form: "She ___ to school every day."', options: ['go', 'goes', 'going', 'is go'], answer: 1, explanation: 'Third person singular present simple takes "goes".' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'What is the past tense of "buy"?', options: ['buyed', 'bring', 'bought', 'buying'], answer: 2, explanation: 'The past form of irregular verb "buy" is "bought".' }
];

async function run() {
  await connectDB();
  console.log('🧹 Eski savollar tozalanmoqda...');
  await TestQuestion.deleteMany({});
  
  let allQuestions = [];
  
  // 1. Matematika majburiy (500 ta)
  allQuestions = allQuestions.concat(generateMath(500, 'majburiy'));
  // 2. Matematika mutaxassislik (500 ta)
  allQuestions = allQuestions.concat(generateMath(500, 'mutaxassislik'));
  // 3. Fizika mutaxassislik (500 ta)
  allQuestions = allQuestions.concat(generatePhysics(500));
  // 4. Kimyo mutaxassislik (500 ta)
  allQuestions = allQuestions.concat(generateChemistry(500));
  
  // 5. Statik savollarni gumanitar fanlarga tarqatish (Har birini nusxalab 10-20 marta qo'shamiz fake variation uchun)
  // Ammo takrorlanmasligi uchun biz so'zlarni biroz o'zgartira olamiz, lekin hozir shunchaki STATICni yuboramiz.
  allQuestions = allQuestions.concat(STATIC_QUESTIONS);

  console.log(`🚀 Jami ${allQuestions.length} ta savol tayyorlandi. DB ga yozilmoqda...`);
  
  const chunkSize = 1000;
  for (let i = 0; i < allQuestions.length; i += chunkSize) {
    const chunk = allQuestions.slice(i, i + chunkSize);
    await TestQuestion.insertMany(chunk);
    console.log(`   ${i + chunk.length} ta savol yozildi...`);
  }
  
  console.log('✅ Barcha savollar muvaffaqiyatli yuklandi!');
  process.exit(0);
}

run().catch(console.error);

