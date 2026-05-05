const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const testQuestionSchema = new mongoose.Schema({
  subject: String,
  block: String,
  question: String,
  options: [String],
  answer: Number,
  difficulty: String,
  explanation: String,
}, { timestamps: true });

const TestQuestion = mongoose.models.TestQuestion || mongoose.model('TestQuestion', testQuestionSchema);

const MAJBURIY_QUESTIONS = [
  // ONA TILI
  { subject: 'uztil', block: 'majburiy', question: "Qaysi so'z xato yozilgan?", options: ["Sanoat", "Manfaat", "Nihoyyat", "Tavallud"], answer: 2, difficulty: 'easy', explanation: "To'g'ri yozilishi — 'Nihoyat'." },
  { subject: 'uztil', block: 'majburiy', question: "Berilgan gapdagi nuqtalar o'rniga qaysi so'z mos keladi?\n'Kitob – aqlning ...'", options: ["boyligi", "chirog'i", "shifosi", "dushmani"], answer: 1, difficulty: 'easy', explanation: "Maqol: Kitob — aqlning chirog'i." },
  { subject: 'uztil', block: 'majburiy', question: "'Oqko'ngil' so'zining ma'nosi qaysi qatorda to'g'ri izohlangan?", options: ["Pudratni yaxshi ko'ruvchi", "Insonlarga doim yaxshilik tilovchi", "Qo'rqoq, yashirinib yuruvchi", "Mansa parast kishi"], answer: 1, difficulty: 'easy', explanation: "Oqko'ngil deb insonlarga beg'araz yaxshilik istovchi, g'arazi yo'q odamga aytiladi." },

  // MATEMATIKA
  { subject: 'math', block: 'majburiy', question: "Noma'lum sonni toping: 35 + X = 82", options: ["47", "57", "117", "45"], answer: 0, difficulty: 'easy', explanation: "X = 82 - 35 = 47" },
  { subject: 'math', block: 'majburiy', question: "Hovuzning 25% qismi suv bilan to'lgan. Hovuzning qismi kasr ko'rinishida qanday ifodalanadi?", options: ["1/2", "1/4", "1/5", "3/4"], answer: 1, difficulty: 'easy', explanation: "25% = 25/100, bu qisqarganda 1/4 ga teng." },
  { subject: 'math', block: 'majburiy', question: "Do'konda 1 kg olma 12000 so'm turadi. 2.5 kg olma qancha bo'ladi?", options: ["30000 so'm", "24000 so'm", "28000 so'm", "32000 so'm"], answer: 0, difficulty: 'easy', explanation: "2.5 * 12000 = 30000 so'm." },

  // TARIX
  { subject: 'tarix', block: 'majburiy', question: "O'zbekiston Respublikasi Davlat bayrog'i qachon qabul qilingan?", options: ["1991-yil 18-noyabr", "1992-yil 2-iyul", "1991-yil 31-avgust", "1992-yil 8-dekabr"], answer: 0, difficulty: 'easy', explanation: "Davlat bayrog'i to'g'risidagi qonun 1991-yil 18-noyabrda tasdiqlangan." },
  { subject: 'tarix', block: 'majburiy', question: "Amir Temur davlatining poytaxti qaysi shahar bo'lgan?", options: ["Buxoro", "Xiva", "Samarqand", "Shahrisabz"], answer: 2, difficulty: 'easy', explanation: "Amir Temur saltanati markazini Samarqand qilib belgilagan." },
  { subject: 'tarix', block: 'majburiy', question: "Xorazm akademiyasi – “Ma'mun akademiyasi” qayerda faoliyat olib borgan?", options: ["G'azna", "Qo'qon", "Buxoro", "Gurganj"], answer: 3, difficulty: 'easy', explanation: "Xorazmshohlar poytaxti Gurganjda faoliyat yuritgan." }
];

async function insertMajburiy() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ DBga ulandi.');
    const result = await TestQuestion.insertMany(MAJBURIY_QUESTIONS);
    console.log(`🚀 ${result.length} ta yengillashtirilgan Majburiy test namunalari muvaffaqiyatli qo'shildi.`);
    process.exit(0);
  } catch (error) {
    console.error('Xatolik:', error);
    process.exit(1);
  }
}

insertMajburiy();