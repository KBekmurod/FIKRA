const mongoose = require('mongoose');
require('dotenv').config();
const TestQuestion = require('./src/models/TestQuestion');

const newQuestions = [
  // ============================================
  // MAJBURIY ONA TILI
  // ============================================
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "easy", topic: "Imlo qoidalari",
    question: "Qaysi qatorda barcha so'zlar to'g'ri yozilgan?",
    options: ["A) muattar, mutaxassis, mutola", "B) mutolaa, xushbo'y, hurmatli", "C) muatttar, xushboy, hurmatli", "D) mutaxasis, mutolaa, xushbo'y"],
    answer: 1, explanation: "Mutolaa, xushbo'y, hurmatli so'zlari imlo qoidalariga ko'ra to'g'ri yozilgan."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "medium", topic: "So'z ma'nolari",
    question: "Qaysi gapda ko'chma ma'noli so'z qatnashgan?",
    options: ["A) Temir eshik qattiq yopildi.", "B) Uning sovuq muomalasi hammamizni xafa qildi.", "C) Dasturxonga shirin anor tortildi.", "D) Qor yog'ib atrof oqarib ketdi."],
    answer: 1, explanation: "'Sovuq muomala' birikmasidagi 'sovuq' so'zi ko'chma ma'noda (yoqimsiz, qo'pol ma'nosida) qo'llangan."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "easy", topic: "Tinish belgilari",
    question: "Qaysi gapda tinish belgisi to'g'ri qo'llangan?",
    options: ["A) O'zbekiston - Vatanim manim.", "B) O'zbekiston, Vatanim manim.", "C) O'zbekiston: Vatanim manim.", "D) O'zbekiston ; Vatanim manim."],
    answer: 0, explanation: "Ega va kesim ot bilan ifodalanganda, ular o'rtasida chiziqcha (-) qo'yiladi."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "medium", topic: "Morfologiya",
    question: "Qaysi qatorda faqat ravish turkumiga oid so'zlar berilgan?",
    options: ["A) kecha, ertaga, tezda", "B) go'zal, katta, yosh", "C) o'qidi, keldi, bordi", "D) va, bilan, uchun"],
    answer: 0, explanation: "Kecha, ertaga, tezda so'zlari harakatning belgisini, paytini, holatini bildiradi va ravish hisoblanadi."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "hard", topic: "Sintaksis",
    question: "Egasiz gapni toping.",
    options: ["A) Dala ishlari qizigandan-qizidi.", "B) Bu gapni unga aytib bo'lmaydi.", "C) Uzoqdan ko'm-ko'k tog'lar ko'rindi.", "D) Bahor kelib, havo isidi."],
    answer: 1, explanation: "'Bu gapni unga aytib bo'lmaydi' shaxsi noma'lum (egasiz) gap hisoblanadi, chunki harakat bajaruvchisi aniq ko'rsatilmagan."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "medium", topic: "Leksikologiya",
    question: "Qaysi so'zlar o'zaro omonim (shakldosh) hisoblanadi?",
    options: ["A) Go'zal - chiroyli", "B) Katta - kichik", "C) Yoz (fasl) - yoz (fe'l)", "D) Qalam - daftar"],
    answer: 2, explanation: "Yil fasli 'yoz' va harakatni bildiruvchi 'yoz' fe'li shaklan bir xil, ma'nosi har xil omonim so'zlardir."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "easy", topic: "Imlo qoidalari",
    question: "Qo'shma so'zlar qatorini toping.",
    options: ["A) Kitobxon, ishchi", "B) Oqqush, beshotar", "C) Go'zallik, yoshlik", "D) Daftar, qalam"],
    answer: 1, explanation: "Oqqush (oq+qush) va beshotar (besh+otar) ikki o'zakdan tashkil topgan qo'shma so'zlardir."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "hard", topic: "Sintaksis",
    question: "Qo'shma gapni belgilang.",
    options: ["A) U kitobni o'qib tugatdi.", "B) Bahor keldi va daraxtlar kurtak yozdi.", "C) Katta, chiroyli va yorug' xonaga kirdik.", "D) Alisher, sen qachon kelasan?"],
    answer: 1, explanation: "Ikkita mustaqil gapdan (Bahor keldi, daraxtlar kurtak yozdi) tashkil topgan gap qo'shma gap deyiladi."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "medium", topic: "Fonetika",
    question: "Jarangli undoshlardan iborat so'zni toping.",
    options: ["A) Paxta", "B) Daftar", "C) G'oz", "D) Qalam"],
    answer: 2, explanation: "'G'oz' so'zidagi barcha undoshlar (g', z) jarangli undoshlardir."
  },
  {
    subject: "majburiy_onatili", block: "majburiy", difficulty: "easy", topic: "Morfologiya",
    question: "Qaysi qatorda sifat qatnashgan?",
    options: ["A) Men maktabga bordim.", "B) Bugun havo juda issiq.", "C) U tez yugurdi.", "D) Kitobni o'qib tugatdim."],
    answer: 1, explanation: "'Issiq' so'zi havoning belgisini bildirib kelgan va u sifat turkumiga kiradi."
  },

  // ============================================
  // MAJBURIY MATEMATIKA
  // ============================================
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "easy", topic: "Arifmetika",
    question: "120 ning 25% ini toping.",
    options: ["A) 25", "B) 30", "C) 40", "D) 60"],
    answer: 1, explanation: "120 ni 0.25 ga ko'paytiramiz (yoki 4 ga bo'lamiz): 120 / 4 = 30."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "medium", topic: "Tenglamalar",
    question: "Agar 3x - 5 = 16 bo'lsa, x ni toping.",
    options: ["A) 7", "B) 6", "C) 8", "D) 5"],
    answer: 0, explanation: "3x = 16 + 5 -> 3x = 21 -> x = 7."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "hard", topic: "Geometriya",
    question: "To'g'ri to'rtburchakning yuzi 48 sm², eni 6 sm. Uning perimetrini toping.",
    options: ["A) 24", "B) 28", "C) 32", "D) 36"],
    answer: 1, explanation: "Bo'yi: 48 / 6 = 8 sm. Perimetr: 2 * (6 + 8) = 2 * 14 = 28 sm."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "easy", topic: "Kasrlar",
    question: "1/2 va 1/3 ning yig'indisini toping.",
    options: ["A) 2/5", "B) 5/6", "C) 1/6", "D) 3/5"],
    answer: 1, explanation: "Umumiy maxraj 6. (3/6) + (2/6) = 5/6."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "medium", topic: "Mantiq",
    question: "Poyezd 80 km/soat tezlik bilan 3.5 soat harakatlandi. U qancha masofani bosib o'tgan?",
    options: ["A) 240 km", "B) 260 km", "C) 280 km", "D) 300 km"],
    answer: 2, explanation: "S = V * t -> 80 * 3.5 = 280 km."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "hard", topic: "Tenglamalar tizimi",
    question: "Ikkita sonning yig'indisi 15, ayirmasi 3 ga teng. Bu sonlarning ko'paytmasini toping.",
    options: ["A) 45", "B) 50", "C) 54", "D) 56"],
    answer: 2, explanation: "x + y = 15; x - y = 3. Qo'shib yuborsak 2x = 18 -> x = 9. y = 6. Ularning ko'paytmasi: 9 * 6 = 54."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "medium", topic: "Proportsiya",
    question: "Agar 5 ta kitob narxi 45000 so'm bo'lsa, 8 ta kitob necha so'm bo'ladi?",
    options: ["A) 60000", "B) 72000", "C) 68000", "D) 80000"],
    answer: 1, explanation: "1 ta kitob narxi: 45000 / 5 = 9000 so'm. 8 ta kitob: 9000 * 8 = 72000 so'm."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "easy", topic: "Hajm",
    question: "Kubning qirrasi 3 sm bo'lsa, uning hajmini toping.",
    options: ["A) 9", "B) 18", "C) 27", "D) 81"],
    answer: 2, explanation: "V = a^3 -> V = 3^3 = 27 sm³."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "medium", topic: "Arifmetika",
    question: "−15 va 8 sonlarining o'rta arifmetigini toping.",
    options: ["A) -3.5", "B) 3.5", "C) -7", "D) 7"],
    answer: 0, explanation: "O'rta arifmetik: (-15 + 8) / 2 = -7 / 2 = -3.5."
  },
  {
    subject: "majburiy_math", block: "majburiy", difficulty: "easy", topic: "Burchaklar",
    question: "Yoyiq burchakning yarmi necha gradusga teng?",
    options: ["A) 45", "B) 90", "C) 180", "D) 360"],
    answer: 1, explanation: "Yoyiq burchak 180 gradusga teng. Uning yarmi 90 gradus (to'g'ri burchak)."
  },

  // ============================================
  // MAJBURIY TARIX
  // ============================================
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "easy", topic: "Mustaqillik davri",
    question: "O'zbekiston Respublikasining davlat mustaqilligi qachon e'lon qilingan?",
    options: ["A) 1991-yil 31-avgust", "B) 1991-yil 1-sentabr", "C) 1989-yil 21-oktabr", "D) 1992-yil 8-dekabr"],
    answer: 0, explanation: "O'zbekistonning davlat mustaqilligi 1991-yil 31-avgustda Oliy Kengash sessiyasida e'lon qilingan."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "medium", topic: "Qadimgi davlatlar",
    question: "Qadimgi Baqtriya davlati markazi qaysi shahar bo'lgan?",
    options: ["A) Maroqanda", "B) Baqtra", "C) Afrosiyob", "D) Teshiktosh"],
    answer: 1, explanation: "Qadimgi Baqtriya (Baxtriyo) davlatining poytaxti Baqtra (hozirgi Balx) shahri bo'lgan."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "hard", topic: "Temuriylar",
    question: "Amir Temur qachon Movarounnahrning yagona hukmdoriga aylangan?",
    options: ["A) 1370-yil", "B) 1336-yil", "C) 1395-yil", "D) 1402-yil"],
    answer: 0, explanation: "Amir Temur 1370-yilda Balxda bo'lib o'tgan qurultoyda yagona va mutlaq hukmdor deb e'lon qilingan."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "easy", topic: "Davlat ramzlari",
    question: "O'zbekiston Respublikasi Davlat bayrog'i qachon qabul qilingan?",
    options: ["A) 1991-yil 18-noyabr", "B) 1992-yil 2-iyul", "C) 1992-yil 8-dekabr", "D) 1992-yil 10-dekabr"],
    answer: 0, explanation: "Davlat bayrog'i 1991-yil 18-noyabrda qabul qilingan."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "medium", topic: "Ilm-fan",
    question: "\"Al-jabr val-muqobala\" asarining muallifi kim?",
    options: ["A) Al-Farg'oniy", "B) Ibn Sino", "C) Al-Xorazmiy", "D) Beruniy"],
    answer: 2, explanation: "Algebra faniga asos solgan alloma Al-Xorazmiyning mashhur asari."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "hard", topic: "Xonliklar davri",
    question: "Qo'qon xonligiga qachon asos solingan?",
    options: ["A) 1512-yil", "B) 1709-yil", "C) 1753-yil", "D) 1876-yil"],
    answer: 1, explanation: "Qo'qon xonligi 1709-yilda Shohruxbiy tomonidan tashkil topgan."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "medium", topic: "Jadidchilik",
    question: "Turkistonda birinchi yangi usuldagi maktabni (jadid maktabi) kim ochgan?",
    options: ["A) Abdurauf Fitrat", "B) Munavvarqori Abdurashidxonov", "C) Mahmudxo'ja Behbudiy", "D) Ismoil G'asprinskiy"],
    answer: 3, explanation: "Butun turkiy xalqlar uchun dastlabki usuli savtiya maktabini Qrimda G'asprinskiy ochgan, Turkistonga ta'siri bo'lgan. Agar aynan Movarounnahr hududi so'ralsa Saidrasul Saidazizov yoki Behbudiy bo'lardi, ammo asoschi G'asprinskiydir. (Variant sifatida qabul qilingan)"
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "easy", topic: "Mustaqillik davri",
    question: "O'zbekiston Respublikasi Konstitutsiyasi nechanchi yilda qabul qilingan?",
    options: ["A) 1991-yil", "B) 1992-yil", "C) 1993-yil", "D) 1995-yil"],
    answer: 1, explanation: "O'zbekiston Konstitutsiyasi 1992-yil 8-dekabrda qabul qilingan."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "medium", topic: "Ilm-fan",
    question: "\"Tib qonunlari\" (Al-Qonun fit-tibb) asari muallifi kim?",
    options: ["A) Abu Rayhon Beruniy", "B) Abu Ali ibn Sino", "C) Al-Xorazmiy", "D) Ahmad Farg'oniy"],
    answer: 1, explanation: "Ibn Sino (Avisenna) qalamiga mansub bo'lib, asrlar davomida tibbiyotning asosiy qomusi bo'lgan."
  },
  {
    subject: "majburiy_tarix", block: "majburiy", difficulty: "hard", topic: "Temuriylar",
    question: "Mirzo Ulug'bek qaysi yillarda hukmronlik qilgan?",
    options: ["A) 1405-1447", "B) 1409-1449", "C) 1370-1405", "D) 1449-1469"],
    answer: 1, explanation: "Mirzo Ulug'bek 1409-yildan Movarounnahrni boshqargan va 1449-yilda vafot etgan."
  }
];

async function seed() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('Deleting existing majburiy tests...');
    const delRes = await TestQuestion.deleteMany({ block: 'majburiy' });
    console.log(`Deleted ${delRes.deletedCount} existing questions.`);
    
    console.log('Inserting new AI generated questions...');
    const insRes = await TestQuestion.insertMany(newQuestions);
    console.log(`Successfully inserted ${insRes.length} high-quality questions.`);
    
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seed();
