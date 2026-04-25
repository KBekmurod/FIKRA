// node src/utils/seedQuestions.js  — DB ni to'ldirish uchun
// 155 ta DTM savol: batafsil tushuntirishlar bilan (haqiqiy DTM darajasida)

require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('../models/TestQuestion');
const { logger } = require('./logger');

const questions = [
  // ═══ MAJBURIY: O'ZBEK TILI (25 savol) ═══
  { subject: 'uztil', block: 'majburiy', difficulty: 'easy',
    question: "Quyidagi so'zlardan qaysi biri to'g'ri yozilgan?",
    options: ['Kitob', 'Kitab', 'Kitov', 'Kitup'], answer: 0,
    explanation: "O'zbek tilida \"kitob\" so'zi to'g'ri yoziladi. Bu arab tilidan o'zlashgan so'z bo'lib, birinchi bo'g'inidagi \"i\" tovushi bilan yoziladi. \"Kitab\", \"kitov\", \"kitup\" variantlari noto'g'ri va o'zbek imlo qoidalariga mos kelmaydi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "\"Ota-onam keldi\" gapida kesim qaysi so'z?",
    options: ['Ota-onam', 'Keldi', 'Ota', 'Onam'], answer: 1,
    explanation: "Kesim — gapning bosh bo'lagi bo'lib, ega bajargan harakat yoki holatni bildiradi. \"Keldi\" fe'li \"nima qildi?\" savoliga javob beradi va harakatni ifodalaydi, shuning uchun u kesim hisoblanadi. \"Ota-onam\" esa ega (kim keldi?)." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Qaysi qatorda barcha so'zlar unli tovush bilan boshlanadi?",
    options: ['Olma, bola, uy', 'Olma, uy, inson', 'Bola, inson, arzon', 'Daftar, uy, olma'], answer: 1,
    explanation: "O'zbek tilida unli tovushlar: a, o, i, u, e, o'. \"Olma\" (o), \"uy\" (u), \"inson\" (i) — barchasi unli bilan boshlanadi. Boshqa javoblardagi \"bola\" (b — undosh), \"daftar\" (d — undosh) undosh tovush bilan boshlanadi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "\"Muallim dars berdi\" gapida ega qaysi?",
    options: ['Dars', 'Berdi', 'Muallim', 'Dars berdi'], answer: 2,
    explanation: "Ega — harakat yoki holatning bajaruvchisi bo'lib, bosh kelishikda turadi va \"kim?\", \"nima?\" savollariga javob beradi. \"Kim dars berdi?\" savoliga \"muallim\" javob bo'ladi, demak u ega. \"Dars\" — to'ldiruvchi (nimani berdi?), \"berdi\" — kesim." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Quyidagi so'zlardan qaysi biri sinonim emas?",
    options: ["Bahor-ko'klam", "Kuz-xazon", "Qish-sovuq", "Yoz-saraton"], answer: 2,
    explanation: "Sinonimlar — ma'nosi yaqin yoki bir xil bo'lgan so'zlar. \"Bahor-ko'klam\", \"kuz-xazon\" (xazon kuzda bo'ladi), \"yoz-saraton\" (saraton — yozning eng issiq payti) sinonimlardir. Ammo \"qish\" fasl nomi, \"sovuq\" esa sifat (ob-havo holati) — ular bir xil so'z turkumiga mansub emas." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Qaysi gap darak gap?",
    options: ['Bugun havo issiqmi?', "Bolalar o'qiyapti.", 'Ajoyib!', 'Kel, yurar-chi'], answer: 1,
    explanation: "Darak gap — biror narsa haqida xabar, ma'lumot beruvchi gap. Oxirida nuqta qo'yiladi. \"Bolalar o'qiyapti\" — holatni xabar qilmoqda. Boshqalar: \"issiqmi?\" — so'roq gap, \"ajoyib!\" — undov gap, \"kel\" — buyruq gap." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "\"Kitob\" so'zining ko'plik shakli qaysi?",
    options: ['Kitobi', 'Kitoblar', 'Kitobim', 'Kitobda'], answer: 1,
    explanation: "O'zbek tilida ko'plik ma'nosi -lar qo'shimchasi yordamida yasaladi. \"Kitob + lar = kitoblar\". Boshqa qo'shimchalar: -i (3-shaxs egalik), -im (1-shaxs egalik), -da (o'rin-payt kelishigi)." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'easy',
    question: "Qaysi so'zda unli tovush eng ko'p?",
    options: ['Maktab', 'Universitet', 'Daftar', 'Stol'], answer: 1,
    explanation: "Unli tovushlar: a, o, i, u, e, o'. \"Universitet\" — u-i-e-i-e (5 ta unli). \"Maktab\" — a-a (2 ta), \"daftar\" — a-a (2 ta), \"stol\" — o (1 ta). Bu savol bo'g'in tahlili va tovush tanlashga o'rgatadi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Quyidagilardan qaysi biri sifat?",
    options: ["Yugurmoq", "Ko'k", 'Stol', "Tez-tez"], answer: 1,
    explanation: "Sifat — narsaning belgisini (rangi, shakli, xususiyati) bildiruvchi so'z turkumi. \"Ko'k\" — rang bildiradi, demak sifat. \"Yugurmoq\" — fe'l (harakat), \"stol\" — ot (narsa nomi), \"tez-tez\" — ravish (harakat belgisi)." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "\"Men kitob o'qiyapman\" gapida to'ldiruvchi qaysi?",
    options: ['Men', "O'qiyapman", 'Kitob', "Gapda to'ldiruvchi yo'q"], answer: 2,
    explanation: "To'ldiruvchi — harakat yo'naltirilgan predmetni bildiradi, tushum kelishigida turadi (-ni qo'shimchasi olishi mumkin) va \"nimani?\", \"kimni?\" savollariga javob beradi. \"Nimani o'qiyapman? — Kitob(ni)\" — bu to'ldiruvchi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "Ravishdosh qaysi qo'shimchalar yordamida yasaladi?",
    options: ['-lar, -ni', '-gan, -ib, -gach', '-ning, -ga', '-dan, -da'], answer: 1,
    explanation: "Ravishdosh — fe'lning maxsus shakli bo'lib, boshqa harakatga bog'liq harakatni ifodalaydi. Yasovchi qo'shimchalar: -gan, -ib, -gach, -guncha, -a, -y. Masalan: kelgach, o'qib, yozib bo'lgach. Boshqa qo'shimchalar: -lar (ko'plik), -ning (qaratqich), -dan (chiqish kelishigi)." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "\"Bahor keldi\" gapida fe'l qaysi zamonda?",
    options: ['Hozirgi zamon', "O'tgan zamon", 'Kelasi zamon', 'Buyruq mayli'], answer: 1,
    explanation: "Fe'lning zamon shakllari: hozirgi (-yapti, -moqda), o'tgan (-di, -gan), kelasi (-jak, -ajak). \"Keldi\" — -di qo'shimchasi bilan o'tgan zamonda. Bu aniq o'tgan zamon shakli bo'lib, harakat so'zlovchi ko'rgan vaqtda sodir bo'lganini bildiradi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Qaysi so'zda tub so'zga qo'shimcha qo'shilgan?",
    options: ['Uy', "Kelish", 'Yashil', 'Tosh'], answer: 1,
    explanation: "Tub so'z — o'zagidan iborat, qo'shimchasiz so'z. \"Kelish\" — \"kel\" o'zagi + \"-ish\" qo'shimchasi (harakat nomini yasovchi). \"Uy\", \"yashil\", \"tosh\" — tub so'zlar, ularda hech qanday qo'shimcha yo'q." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "Qaysi juftlikda antonimlar berilgan?",
    options: ['Kitob-daftar', 'Baland-past', 'Olma-anor', 'Yaxshi-chiroyli'], answer: 1,
    explanation: "Antonim — qarama-qarshi ma'noli so'zlar. \"Baland\" va \"past\" bir-biriga zid tushunchalar — balandlikning ikki cheti. \"Kitob-daftar\", \"olma-anor\" — bir toifadagi lekin zid emas, \"yaxshi-chiroyli\" — ikkalasi ham ijobiy sifatlar, zid emas." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'easy',
    question: "Qaysi tinish belgisi undov belgi deyiladi?",
    options: ['.', ',', '!', '?'], answer: 2,
    explanation: "Tinish belgilari: nuqta (.), vergul (,), undov (!), so'roq (?). Undov belgisi — kuchli hissiyot, zavq, hayrat, chaqiriq yoki buyruq bildiruvchi gaplar oxirida qo'yiladi. Masalan: \"Ajoyib!\", \"Qanday go'zal!\", \"Ehtiyot bo'l!\"." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "\"Toshkent\" so'zida nechta bo'g'in bor?",
    options: ['1', '2', '3', '4'], answer: 1,
    explanation: "Bo'g'in — bir nafas chiqishida aytiladigan tovushlar guruhi. Har bo'g'inda bitta unli tovush bo'ladi. \"Tosh-kent\" — 2 bo'g'in: \"tosh\" (1 unli: o) va \"kent\" (1 unli: e). So'zda nechta unli bo'lsa, shuncha bo'g'in bo'ladi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Quyidagilardan qaysi biri son?",
    options: ['Yashil', "Besh", 'Quloq', 'Oshmoq'], answer: 1,
    explanation: "Son — narsalarning miqdorini (sanoq sonlar: bir, ikki, uch...) yoki tartibini (tartib sonlar: birinchi, ikkinchi...) bildiruvchi so'z turkumi. \"Besh\" — sanoq son. \"Yashil\" — sifat, \"quloq\" — ot, \"oshmoq\" — fe'l." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "\"Maktabga borayapman\" gapida harakat qay tarzda ifodalangan?",
    options: ["Harakat allaqachon bajarilgan", 'Harakat hozir davom etmoqda', 'Harakat kelajakda bo\'ladi', 'Buyruq shaklida'], answer: 1,
    explanation: "\"-yap\" qo'shimchasi bilan yasalgan hozirgi zamon davom fe'li — harakat aynan shu paytda bajarilayotganini bildiradi. \"Borayapman\" — men hozir bormoqdaman. Bu asosan so'zlashuvda juda ko'p ishlatiladigan zamon shakli." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Olmosh qaysi so'z?",
    options: ['Daftar', 'Men', 'Kitob', 'Boradi'], answer: 1,
    explanation: "Olmosh — ot, sifat yoki son o'rnida ishlatilib, ularga ishora qiluvchi so'z turkumi. \"Men\" — kishilik olmoshi (1-shaxs birlik). Boshqa olmosh turlari: sen, u, biz, siz, bu, shu, o'sha, kim, nima. \"Daftar\", \"kitob\" — otlar, \"boradi\" — fe'l." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'easy',
    question: "Qaysi harf jarangsiz undoshni ifodalaydi?",
    options: ['B', 'D', 'Z', 'S'], answer: 3,
    explanation: "Undosh tovushlar jaranglilik bo'yicha ikki guruhga bo'linadi. Jarangli: b, d, g, j, z, v. Jarangsiz: p, t, k, ch, s, f, sh, x, h, q. \"S\" — jarangsiz undosh. Jaranglilar hissiyot bilan, jarangsizlar esa quruqlik bilan talaffuz qilinadi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "\"Uylar — insonlarning yashash joyi\" gapida tire nima uchun qo'yilgan?",
    options: ["Gap ikki ega bor", "Ega va kesim ot bilan ifodalangan", 'Undov gap', 'So\'roq gap'], answer: 1,
    explanation: "Ega va kesim ikkalasi ham ot, olmosh yoki son bilan ifodalanganda, ular orasiga tire qo'yiladi. \"Uylar\" (ot — ega) \"insonlarning yashash joyi\" (ot birikmasi — kesim). Bu tire fe'l \"bo'ladi\", \"hisoblanadi\" o'rniga keladi." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "Qaysi gap qo'shma gap?",
    options: ["Men keldim.", "Bahor keldi, daraxtlar gulladi.", "Bola kitob o'qiydi.", "Qor yog'ayapti."], answer: 1,
    explanation: "Qo'shma gap — ikki yoki undan ortiq oddiy gaplarning o'zaro bog'lanishi orqali hosil bo'lgan murakkab gap. \"Bahor keldi\" + \"daraxtlar gulladi\" — ikkita mustaqil gap, vergul bilan bog'langan. Boshqalar sodda gaplar — faqat bitta ega va kesim." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Ot qaysi so'z turkumiga mansub?",
    options: ['Narsa, predmet nomini bildiruvchi', 'Harakat bildiruvchi', 'Belgi bildiruvchi', 'Miqdor bildiruvchi'], answer: 0,
    explanation: "So'z turkumlari ma'no va funktsiyasiga ko'ra bo'linadi. Ot — narsa, hodisa, shaxs, joy nomlarini bildiradi: \"kitob\", \"Toshkent\", \"do'st\". Fe'l — harakat (yugurmoq), sifat — belgi (katta), son — miqdor (besh), ravish — harakat belgisi (tez)." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'hard',
    question: "\"Men yaxshi ko'raman\" gapida \"yaxshi\" so'zi qaysi gap bo'lagi?",
    options: ['Ega', 'Kesim', 'Aniqlovchi', 'Hol'], answer: 3,
    explanation: "Hol — harakatning belgisi (qanday, qachon, qayerda bajarilgani)ni bildiruvchi ikkinchi darajali bo'lak. \"Qanday ko'raman? — Yaxshi\" — bu holat-tarz holi. Aniqlovchi otga taalluqli, hol esa fe'lga. Masalan: \"yaxshi kitob\" — aniqlovchi, \"yaxshi o'qidi\" — hol." },

  { subject: 'uztil', block: 'majburiy', difficulty: 'medium',
    question: "Qaysi so'zda qo'shma unli (diftong) bor?",
    options: ['Bola', 'Maktab', 'Oy', "Qo'shiq"], answer: 3,
    explanation: "O'zbek tilida \"o'\" — qo'shma unli (diftong) hisoblanadi, chunki u \"o\" va \"w\" tovushlarining birikmasidan hosil bo'ladi. \"Qo'shiq\" so'zida \"o'\" diftongi bor. Bu o'zbek tiliga xos xususiyat, lotin alifbosida maxsus belgi bilan yoziladi." },

  // ═══ MATEMATIKA (25 savol) ═══
  { subject: 'math', block: 'majburiy', difficulty: 'easy',
    question: "Hisoblang: 2 + 2 × 2 = ?",
    options: ['6', '8', '4', '10'], answer: 0,
    explanation: "Matematik amallar tartibi (PEMDAS/BODMAS): qavsdan so'ng ko'paytma va bo'lish, keyin qo'shish va ayirish. Bu yerda: avval 2×2=4, keyin 2+4=6. Agar chapdan o'ngga hisoblansa (2+2)×2=8 bo'lardi — bu noto'g'ri." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "Agar x + 5 = 12 bo'lsa, x ning qiymati qancha?",
    options: ['5', '7', '17', '6'], answer: 1,
    explanation: "Chiziqli tenglamani yechish uchun x ni bir tomonga, raqamlarni ikkinchi tomonga o'tkazamiz. x + 5 = 12 → x = 12 - 5 = 7. Tekshiramiz: 7 + 5 = 12 ✓. Noma'lumni topish uchun uning oldidagi amalga qarshi amalni bajaramiz." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "200 ning 25% qanchaga teng?",
    options: ['25', '40', '50', '75'], answer: 2,
    explanation: "Foiz (%) — 100 dan bir ulush. 25% = 25/100 = 1/4. 200 ning 25% = 200 × 0.25 = 50. Yoki osonroq: 200 ni 4 ga bo'lish (chunki 25% = 1/4). 200/4 = 50. Foiz hisoblashda: son × foiz / 100." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "Uchburchakning ichki burchaklari yig'indisi necha gradus?",
    options: ['90°', '180°', '270°', '360°'], answer: 1,
    explanation: "Geometriyaning asosiy teoremasi: tekislikdagi uchburchakning ichki burchaklari yig'indisi har doim 180° ga teng. Bu Evklid geometriyasining fundamental teoremasi. To'g'ri burchakli uchburchakda bir burchak 90°, qolgan ikkitasi 90° yig'indi (masalan 45°+45°)." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "√144 ning qiymati qancha?",
    options: ['10', '11', '12', '14'], answer: 2,
    explanation: "Kvadrat ildiz — kvadrati berilgan songa teng bo'lgan son. √144 = ? demak ?² = 144. 12 × 12 = 144, shuning uchun √144 = 12. Tekshirish: 10²=100, 11²=121, 12²=144 ✓, 14²=196." },

  { subject: 'math', block: 'majburiy', difficulty: 'easy',
    question: "Yarim soatda necha daqiqa bor?",
    options: ['20', '25', '30', '45'], answer: 2,
    explanation: "Vaqt birliklarini bilish muhim: 1 soat = 60 daqiqa. Yarim soat = 60 / 2 = 30 daqiqa. Shuningdek: 1 daqiqa = 60 soniya, 1 kun = 24 soat, 1 yil = 365 (yoki 366 — kabisa yili) kun." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "5! (faktoriyal) ning qiymati qancha?",
    options: ['25', '60', '120', '720'], answer: 2,
    explanation: "Faktoriyal — natural sonlarning ketma-ket ko'paytmasi. n! = 1 × 2 × 3 × ... × n. 5! = 1 × 2 × 3 × 4 × 5 = 120. Faktoriyal kombinatorikada qo'llaniladi. Masalan: 5 ta kitobni necha xil tartibda joylashtirish mumkin? — 5! = 120 usulda." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "Agar a = 3, b = 4 bo'lsa, a² + b² qanchaga teng?",
    options: ['12', '24', '25', '49'], answer: 2,
    explanation: "Kvadratga ko'tarish — sonni o'ziga ko'paytirish. a² = 3² = 9, b² = 4² = 16. Yig'indi: 9 + 16 = 25. Bu Pifagor teoremasiga oid: agar 3 va 4 — uchburchak katetlari bo'lsa, gipotenuza c² = 9+16 = 25, demak c = 5. Mashhur (3,4,5) uchburchak." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "Kvadratning perimetri 20 sm bo'lsa, bir tomoni necha sm?",
    options: ['4 sm', '5 sm', '6 sm', '8 sm'], answer: 1,
    explanation: "Kvadrat — 4 ta teng tomonli to'rtburchak. Perimetr — barcha tomonlar yig'indisi = 4 × a, bu yerda a — tomon uzunligi. 4a = 20 → a = 20/4 = 5 sm. Tekshirish: 5+5+5+5 = 20 ✓. Kvadrat yuzi esa a² = 5² = 25 sm²." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "Radiusi 5 bo'lgan aylananing yuzi qanchaga teng?",
    options: ['10π', '15π', '25π', '50π'], answer: 2,
    explanation: "Aylana yuzi formulasi: S = π × r², bu yerda r — radius, π ≈ 3.14159. r = 5 bo'lsa, S = π × 5² = π × 25 = 25π. Taxminiy qiymat: 25 × 3.14 ≈ 78.5 kv.birlik. Aylana uzunligi esa C = 2πr = 10π." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "2x - 3 = 7 tenglamani yeching. x = ?",
    options: ['2', '3', '5', '10'], answer: 2,
    explanation: "Chiziqli tenglamani yechish: 1) Ikkala tomonga 3 qo'shamiz: 2x - 3 + 3 = 7 + 3 → 2x = 10. 2) Ikkala tomonni 2 ga bo'lamiz: 2x/2 = 10/2 → x = 5. Tekshirish: 2(5) - 3 = 10 - 3 = 7 ✓." },

  { subject: 'math', block: 'majburiy', difficulty: 'easy',
    question: "100 ning 10% qancha?",
    options: ['1', '10', '100', '1000'], answer: 1,
    explanation: "10% = 10/100 = 0.1 = 1/10. 100 ning 10% = 100 × 0.1 = 10. Foiz hisoblashning tez usuli: 10% ni topish uchun sonni 10 ga bo'lish kifoya. 100/10 = 10." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "Arifmetik progressiya: 2, 5, 8, 11, ... . Uning 10-hadini toping.",
    options: ['29', '32', '30', '35'], answer: 0,
    explanation: "Arifmetik progressiya — har keyingi had avvalgisidan bir xil son (d — ayirmaga) oshib boradi. Bu yerda d = 5-2 = 3. n-had formulasi: aₙ = a₁ + (n-1)·d. 10-had: a₁₀ = 2 + (10-1)·3 = 2 + 27 = 29." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "Kub hajmi V = a³. Agar a = 3 bo'lsa, V qanchaga teng?",
    options: ['9', '18', '27', '81'], answer: 2,
    explanation: "Kub — barcha tomonlari teng to'g'ri burchakli parallelepiped. Hajm V = a × a × a = a³. a = 3: V = 3 × 3 × 3 = 27. Darajaga ko'tarish: a³ = a·a·a. Shuningdek, kubning yuzi — 6 × a² = 6 × 9 = 54." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "log₁₀(1000) qanchaga teng?",
    options: ['1', '2', '3', '10'], answer: 2,
    explanation: "Logarifm — darajaga teskari amal. log_a(b) = c ma'nosi: a^c = b. log₁₀(1000) = ? demak 10^? = 1000. 10^3 = 1000, shuning uchun log₁₀(1000) = 3. Asosiy logarifmlar: log₁₀(10) = 1, log₁₀(100) = 2, log₁₀(1000) = 3." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "150 ning 1/3 qismi qanchaga teng?",
    options: ['30', '50', '75', '100'], answer: 1,
    explanation: "Kasrlar — butunni teng bo'laklarga bo'lish. 1/3 — uchga bo'lingan butundan bir bo'lak. 150 × (1/3) = 150 / 3 = 50. Tekshirish: 50 × 3 = 150 ✓. Kasr bilan ishlash: son × maxraj/numerator." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "Pifagor teoremasi: a² + b² = c². a = 3, b = 4 bo'lsa, gipotenuza c qanchaga teng?",
    options: ['5', '6', '7', '12'], answer: 0,
    explanation: "Pifagor teoremasi to'g'ri burchakli uchburchakda amal qiladi: katetlar kvadratlari yig'indisi gipotenuza kvadratiga teng. c² = 3² + 4² = 9 + 16 = 25. c = √25 = 5. (3,4,5) — butun sonli Pifagor uchligi, qadimdan ma'lum." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "sin(90°) qanchaga teng?",
    options: ['0', '0.5', '1', "Ma'lum emas"], answer: 2,
    explanation: "Trigonometriyada asosiy qiymatlar: sin(0°)=0, sin(30°)=0.5, sin(45°)=√2/2, sin(60°)=√3/2, sin(90°)=1. sin funksiyasi [-1, 1] oralig'ida qiymat oladi va 90° da maksimum. cos(90°) esa 0 ga teng." },

  { subject: 'math', block: 'majburiy', difficulty: 'easy',
    question: "1 kilogramm necha grammga teng?",
    options: ['10', '100', '1000', '10000'], answer: 2,
    explanation: "Og'irlik birliklari SI tizimida: 1 tonna = 1000 kg, 1 kg = 1000 g, 1 g = 1000 mg. Barcha o'zgarishlar 1000 ga bo'lish/ko'paytirish bilan. Bu o'nli tizim bo'lib, o'tkazish oson: 1 kg = 10³ g = 1000 g." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "x² - 5x + 6 = 0 kvadrat tenglamaning ildizlarini toping.",
    options: ['x=1, x=2', 'x=2, x=3', 'x=3, x=4', 'x=1, x=6'], answer: 1,
    explanation: "Vieta teoremasi: ax² + bx + c = 0 tenglamada x₁ + x₂ = -b/a va x₁ × x₂ = c/a. Bizda: x₁ + x₂ = 5 va x₁ × x₂ = 6. 2 va 3 mos keladi: 2+3=5, 2×3=6. Tekshirish: 2²-5(2)+6 = 4-10+6 = 0 ✓, 3²-5(3)+6 = 9-15+6 = 0 ✓." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "360° burchakning yarmi necha gradus?",
    options: ['90°', '120°', '180°', '270°'], answer: 2,
    explanation: "360° — to'liq aylana, to'g'ri aylanish. 360°/2 = 180° — bu yarim aylana, yarim burilish. 180° burchak — \"yoyilgan burchak\" deb ham ataladi. 90° — to'g'ri burchak (aylananing 1/4), 360°/4 = 90°." },

  { subject: 'math', block: 'majburiy', difficulty: 'easy',
    question: "6 × 7 ko'paytmasi qanchaga teng?",
    options: ['13', '42', '48', '56'], answer: 1,
    explanation: "Ko'paytirish jadvali: 6 × 7 = 42. Buni 6+6+6+6+6+6+6 = 42 ko'rinishida tekshirish mumkin (6 yettitasi). Yoki 7×6 = 7+7+7+7+7+7 = 42. Ko'paytirish kommutativ: a×b = b×a." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "Agar 3x = 15 bo'lsa, x ning qiymati qancha?",
    options: ['3', '5', '10', '45'], answer: 1,
    explanation: "Oddiy chiziqli tenglama. x ni topish uchun ikkala tomonni 3 ga bo'lamiz: 3x/3 = 15/3 → x = 5. Tekshirish: 3 × 5 = 15 ✓. Asos: tenglamaning ikkala tomonini bir xil songa ko'paytirsak yoki bo'lsak, tenglik saqlanadi." },

  { subject: 'math', block: 'majburiy', difficulty: 'hard',
    question: "Parallelogrammning yuzi S = a × h formula bilan topiladi. a = 8, h = 5 bo'lsa, S ga qanchaga teng?",
    options: ['13', '26', '40', '80'], answer: 2,
    explanation: "Parallelogramm — qarama-qarshi tomonlari parallel to'rtburchak. Yuzi: asos × balandlik = a × h. S = 8 × 5 = 40 kv.birlik. Balandlik h — asosdan qarama-qarshi tomongacha tik masofa. To'g'ri to'rtburchak va kvadrat — parallelogrammning xususiy turlari." },

  { subject: 'math', block: 'majburiy', difficulty: 'medium',
    question: "2⁵ qanchaga teng?",
    options: ['10', '16', '25', '32'], answer: 3,
    explanation: "Daraja: aⁿ = a·a·a·...·a (n marta). 2⁵ = 2·2·2·2·2. Bosqichma-bosqich: 2²=4, 2³=8, 2⁴=16, 2⁵=32. 2 ning darajalari: 2, 4, 8, 16, 32, 64, 128, 256... — kompyuter ilmida muhim (bit, bayt tizimi)." },

  // ═══ TARIX (25 savol) ═══
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy',
    question: "O'zbekiston Respublikasi qachon mustaqilligini e'lon qildi?",
    options: ['1989-yil', '1990-yil', '1991-yil', '1992-yil'], answer: 2,
    explanation: "1991-yil 31-avgust — O'zbekiston Respublikasi Oliy Kengashi tomonidan mustaqillik to'g'risidagi Deklaratsiya qabul qilingan tarixiy kun. Sovet Ittifoqining parchalanishi fonida bu qaror qabul qilindi. 1-sentabr Mustaqillik kuni sifatida nishonlanadi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Amir Temur o'z imperiyasining poytaxti qilib qaysi shaharni tanlagan?",
    options: ['Buxoro', 'Samarqand', 'Toshkent', 'Xiva'], answer: 1,
    explanation: "Amir Temur (Tamerlan) 1370-yilda hokimiyatni qo'lga kiritgach, Samarqandni o'zining buyuk imperiyasiga poytaxt qilib tanladi. U shaharni butun Yevrosiyodan kelgan ustalar, olimlar va san'atkorlar bilan to'ldirgan. Registon maydoni, Bibi-Xonim masjidi shu davrga taalluqli." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Alisher Navoiy qaysi yilda va qayerda tug'ilgan?",
    options: ['1441-yil, Hirot', '1501-yil, Samarqand', '1480-yil, Buxoro', '1400-yil, Toshkent'], answer: 0,
    explanation: "Alisher Navoiy — o'zbek adabiyotining asoschisi, buyuk shoir va davlat arbobi. 1441-yil 9-fevralda Xuroson viloyatining poytaxti Hirot shahrida tug'ilgan. Sulton Husayn Boyqaroning do'sti va maslahatchisi edi. \"Xamsa\", \"Lison ut-tayr\" va ko'plab asarlar muallifi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "Ibn Sino qaysi qishloqda tug'ilgan?",
    options: ['Buxoro markazida', 'Samarqand yaqinida', 'Afshona qishlog\'ida', 'Urganchda'], answer: 2,
    explanation: "Abu Ali ibn Sino (lotincha Avicenna) — buyuk olim, faylasuf, tabib. 980-yili Buxoro yaqinidagi Afshona qishlog'ida tug'ilgan. \"Tib qonunlari\" (al-Qonun fit-tibb) asari Yevropa universitetlarida 600 yil davomida darslik bo'lgan. 1037-yilda Hamadanda vafot etgan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Sovet Ittifoqi (SSSR) rasmiy ravishda qachon tugatildi?",
    options: ['1989-yil', '1990-yil', '1991-yil', '1993-yil'], answer: 2,
    explanation: "1991-yil 8-dekabrda Belarus, Rossiya va Ukraina prezidentlari Belovej bitimini imzolashdi. 25-dekabr M.Gorbachev iste'foga chiqdi. 26-dekabrda SSSR rasman tugatildi. O'rniga MDH (Mustaqil Davlatlar Hamdo'stligi) tuzildi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Birinchi jahon urushi qachon boshlangan?",
    options: ['1914-yil', '1918-yil', '1939-yil', '1945-yil'], answer: 0,
    explanation: "Birinchi jahon urushi 1914-yil 28-iyulda boshlangan (Avstriya-Vengriya Serbiyaga urush e'lon qilgan). 1914-1918 yillarda davom etgan. Bahona — Saraevoda Franz Ferdinand o'ldirilishi. Natijalari: 4 imperiya qulashi, Millatlar Ligasi tuzilishi, 2-jahon urushiga yo'l ochilishi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "Al-Xorazmiy qaysi fan sohasining asoschisi hisoblanadi?",
    options: ['Tibbiyot', 'Algebra', 'Astronomiya', "Falsafa"], answer: 1,
    explanation: "Muhammad al-Xorazmiy (780-850) — Xorazmda tug'ilgan buyuk matematik. Bag'dod \"Bayt ul-Hikma\" akademiyasida ishlagan. \"Kitob al-jabr va-l-muqabala\" asari algebra fanining asosini qo'ygan. \"Algoritm\" va \"algebra\" so'zlari uning ismi va asarlaridan olingan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'easy',
    question: "O'zbekiston Respublikasining poytaxti qaysi shahar?",
    options: ['Samarqand', 'Buxoro', 'Toshkent', 'Namangan'], answer: 2,
    explanation: "Toshkent — O'zbekiston poytaxti, Markaziy Osiyoning eng yirik shaharlaridan biri. 1930-yildan beri poytaxt (avval Samarqand edi). Aholisi 3 milliondan ortiq. Tarixi 2000 yildan oshgan. Metro, 11 tumanli, yirik iqtisodiy va ilmiy markaz." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Mo'g'ullar Markaziy Osiyoni qachon bosib olgan?",
    options: ['1219-1221 yillar', '1300-yil', '1370-yil', '1526-yil'], answer: 0,
    explanation: "Chingizxon boshchiligidagi mo'g'ul qo'shinlari 1219-yilda Xorazmshohlar davlatiga bostirib kirdi. Muhammad Xorazmshoh qochib, o'ldi. Shaharlar — Samarqand, Buxoro, Urganch, Marv — vayron qilindi. 1221-yilda butun mintaqa bosib olindi. Bu mo'g'ul bosqini tarixida eng katta halokat keltirgan bosqinchilik." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "Zahiriddin Muhammad Bobur qaysi saltanatga asos solgan?",
    options: ["Usmonli imperiyasi", "Safaviylar davlati", "Boburiylar (Mug'allar)", "Shayboniylar"], answer: 2,
    explanation: "Bobur (1483-1530) — Amir Temurning 5-avlodi. Farg'onada tug'ilgan, Andijonda boshqargan. Shayboniyxondan yengilgach, Hindistonga yurgan. 1526-yil Panipat jangida Ibrohim Lo'diyni mag'lub etib, Hindistonda Boburiylar saltanatini tuzdi. U 1857-yilgacha davom etdi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Ikkinchi jahon urushi qachon tugagan?",
    options: ['1943-yil', '1945-yil', '1947-yil', '1950-yil'], answer: 1,
    explanation: "Ikkinchi jahon urushi 1939-1945 yillarda bo'lgan. 1939-yil 1-sentabrda boshlanib, 1945-yil 2-sentabrda (Yaponiya taslim bo'lishi bilan) tugagan. Yevropada — 9-mayda Germaniya taslim bo'ldi (G'alaba kuni). 70+ million odam halok bo'ldi. BMT tuzildi, dunyo ikki blokga bo'lindi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Ulug'bek madrasasi qaysi shaharda joylashgan?",
    options: ['Buxoroda', 'Xivada', 'Samarqandda', 'Toshkentda'], answer: 2,
    explanation: "Mirzo Ulug'bek — Amir Temurning nabirasi, buyuk astronom va hukmdor. 1417-1420 yillarda Samarqandda o'z nomidagi madrasa qurdirgan. Bu Registon majmuasining birinchi qismi. Madrasa matematika, astronomiya, falsafa markazi bo'lgan. Ulug'bek yulduzlar katalogi ham shu yerda yaratilgan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "Abu Rayhon Beruniy qaysi asrda yashagan?",
    options: ['8-9 asrlar', '10-11 asrlar', '12-13 asrlar', '14-15 asrlar'], answer: 1,
    explanation: "Abu Rayhon Beruniy (973-1048) — Xorazmda tug'ilgan buyuk entsiklopedist olim. 10-11 asrlar (O'rta asr ilmining \"Oltin davri\") vakili. Matematika, astronomiya, geografiya, tarix, mineralogiya sohalarida 150+ asar yozgan. Hind madaniyati haqidagi \"Hindiston\" asari mashhur." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'easy',
    question: "Buyuk Ipak yo'li asosan qaysi hududlarni bog'lagan?",
    options: ['Yevropa va Afrika', 'Osiyo va Yevropa', 'Afrika va Amerika', 'Amerika va Osiyo'], answer: 1,
    explanation: "Buyuk Ipak yo'li — miloddan avvalgi 2-asrdan 15-asrgacha ishlagan savdo yo'llari tarmog'i. Xitoydan boshlanib, Markaziy Osiyo (Samarqand, Buxoro), Eron, Turkiya orqali O'rtayer dengizigacha yetib borgan. Nafaqat ipak, balki boshqa tovarlar, dinlar, madaniyat va kashfiyotlar ham uzatilgan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Amir Temur qachon vafot etgan?",
    options: ['1380-yil', '1405-yil', '1425-yil', '1450-yil'], answer: 1,
    explanation: "Amir Temur 1405-yil 18-fevralda Xitoyga (Min sulolasiga qarshi) qishki yurish paytida Otrorda (hozirgi Qozog'iston) vafot etdi. 69 yoshda edi. Tanasini Samarqandga olib kelishdi va Go'ri Amir maqbarasiga dafn etdilar. Uning vafotidan so'ng imperiya parchalana boshladi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "Rossiya imperiyasi Markaziy Osiyoni bosib olishni qachon faol boshlagan?",
    options: ['1830-yil', '1865-yil', '1900-yil', '1917-yil'], answer: 1,
    explanation: "1865-yil — Toshkent Rossiya imperiyasi tomonidan bosib olingan yil (general Chernyayev rahbarligida). 1868-yilda Buxoro, 1873-yilda Xiva xonliklari vassal qilindi. 1876-yilda Qo'qon xonligi tugatildi. 1867-yil Turkiston general-gubernatorligi tuzildi. Bu davr taxminan 1917-yilgacha davom etdi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Qadimgi Misrning eng mashhur me'morchilik yodgorliklari qanday?",
    options: ["Xitoy devori", "Piramidalar", "Kolizey", "Parfenon"], answer: 1,
    explanation: "Misr piramidalari — qadimgi fir'avnlar qabrlari. Eng mashhur: Giza piramidalari (mil. avv. 2500). Buyuk Xeops piramidasi — 147 m balandlikda, taxminan 2.3 million tosh bloklardan. Qadimgi dunyoning 7 mo'jizasidan biri. Hozirgacha to'liq o'z sirini saqlab kelgan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Amir Temur qaysi yilda tug'ilgan?",
    options: ['1336-yil', '1340-yil', '1350-yil', '1400-yil'], answer: 0,
    explanation: "Amir Temur 1336-yil 9-aprelda (yoki turli manbalarga ko'ra 8-aprelda) Shahrisabz yaqinidagi Xoja Ilg'or qishlog'ida barlos urug'ida tug'ilgan. Otasi amir Taragay edi. 1370-yilda Movarounnahr hokimi bo'ldi. \"Temur\" temir ma'nosini, \"Tamerlan\" esa \"Temur-i lang\" (oqsoq Temur)." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "Mesopotamiya (Ikki daryo oralig'i) qaysi daryolar orasida joylashgan?",
    options: ['Nil va Amazonka', 'Amudaryo va Sirdaryo', "Dajla va Furot", 'Volga va Ural'], answer: 2,
    explanation: "Mesopotamiya (yunoncha \"ikki daryo orasi\") — Dajla (Tigr) va Furot (Yevfrat) daryolari oralig'idagi hudud (hozirgi Iroq). Bu yer insoniyat sivilizatsiyasining beshigi deb hisoblanadi: Shumer, Bobil, Ossuriya davlatlari shu yerda paydo bo'lgan. Yozuvning birinchi shakli (mixxat) shu yerda yaratilgan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'easy',
    question: "O'zbekiston birinchi prezidenti Islom Karimov qachon vafot etgan?",
    options: ['2014-yil', '2015-yil', '2016-yil', '2017-yil'], answer: 2,
    explanation: "Islom Abdug'aniyevich Karimov (1938-2016) — O'zbekiston Respublikasining birinchi Prezidenti (1991-2016). 2016-yil 2-sentabrda 78 yoshida vafot etdi. 25 yil davomida davlatni boshqargan. U Samarqandda dafn etilgan. Undan keyin Shavkat Mirziyoyev prezident bo'lgan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Amerika qit'asi qachon kashf etilgan?",
    options: ['1450-yil', '1492-yil', '1500-yil', '1550-yil'], answer: 1,
    explanation: "1492-yil 12-oktabrda Xristofor Kolumb Ispaniya qiroli tomonidan moliyalashtirilgan ekspeditsiya bilan Bagama orollariga yetib keldi. U bu yerni Hindiston deb o'yladi (\"Amerika\"ni Amerigo Vespuchchi kashf etgan deb ham aytiladi). Bu kashfiyot jahon tarixidagi eng katta burilishlardan biri." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "Ibn Sino o'z asarlarini asosan qaysi tillarda yozgan?",
    options: ['Arab va fors', 'Yunon va lotin', 'Turk', 'Xitoy'], answer: 0,
    explanation: "Ibn Sino asosan arab tilida ilmiy asarlar yozgan (arab — o'sha davr ilm tili edi). Ayrim falsafiy va adabiy asarlari fors tilida ham yozilgan. \"Tib qonunlari\" (arab), \"Donishnoma\" (fors) mashhur asarlari. Uning asarlari keyin lotin, ivrit, keyinroq yevropa tillariga tarjima qilingan." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'hard',
    question: "Qo'qon xonligi qachon va kim tomonidan tugatilgan?",
    options: ['1865, xalq', '1876, Rossiya imperiyasi', '1881, Buxoro', '1900, Britaniya'], answer: 1,
    explanation: "Qo'qon xonligi 1876-yil 19-fevralda Rossiya imperiyasi tomonidan tugatilgan. Xudoyorxondan so'ng xonlikda siyosiy nobarqarorlik bo'ldi. General Skobelev Farg'ona viloyatini tuzdi. Xonlik Turkiston general-gubernatorligiga qo'shib yuborildi. Bu O'rta Osiyodagi Rossiya mustamlakachiligining yakuni edi." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'easy',
    question: "O'zbekiston qancha viloyatdan iborat?",
    options: ['10 ta', '12 ta', '14 ta', '16 ta'], answer: 1,
    explanation: "O'zbekiston ma'muriy-hududiy birliklari: 12 viloyat (Andijon, Buxoro, Farg'ona, Jizzax, Xorazm, Namangan, Navoiy, Qashqadaryo, Samarqand, Sirdaryo, Surxondaryo, Toshkent), 1 avtonom respublika (Qoraqalpog'iston), hamda Toshkent shahri (alohida birlik)." },

  { subject: 'tarix', block: 'majburiy', difficulty: 'medium',
    question: "O'zbekiston davlat tili qaysi til?",
    options: ['Ruscha', "O'zbekcha", 'Tojikcha', 'Qozoqcha'], answer: 1,
    explanation: "O'zbek tili — O'zbekiston Respublikasining yagona davlat tili. 1989-yil 21-oktabrda \"Davlat tili haqida\" qonun qabul qilindi. 1995-yildagi yangi qonun lotin alifbosiga o'tishni tasdiqladi. Konstitutsiyaning 4-moddasiga ko'ra davlat tili — o'zbek tili." },

  // ═══ FIZIKA (15) ═══
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Nyutonning ikkinchi qonuni qanday ifodalanadi?",
    options: ['F = ma', 'F = mv', 'F = mg', 'F = m/a'], answer: 0,
    explanation: "Nyutonning ikkinchi qonuni: jismning tezlanishi unga ta'sir etuvchi kuchga to'g'ri proporsional va jism massasiga teskari proporsional. F = m·a, bunda F — kuch (Nyutonda), m — massa (kg), a — tezlanish (m/s²). Bu dinamikaning asosiy tenglamasi." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard',
    question: "Yorug'likning vakuumdagi tezligi qancha?",
    options: ['3 × 10⁵ km/s', '3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s'], answer: 1,
    explanation: "Yorug'lik tezligi (c) — vakuumda c = 299,792,458 m/s ≈ 3 × 10⁸ m/s. Bu fizikaning fundamental doimiysi. Einsteyn nazariyasiga ko'ra, hech qanday massali jism yorug'lik tezligidan tezroq harakatlana olmaydi. 1 soniyada yorug'lik Yer atrofini 7.5 marta aylanib chiqadi." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Elektr toki kuchining o'lchov birligi qanday?",
    options: ['Volt', 'Amper', 'Vatt', 'Om'], answer: 1,
    explanation: "Elektr kattaliklarining birliklari: tok kuchi — Amper (A), kuchlanish — Volt (V), qarshilik — Om (Ω), quvvat — Vatt (W). 1 Amper — 1 soniyada 1 kulon zaryad o'tishini bildiradi. Amper fransuz fizigi Andre Mari Amper sharafiga nomlanagan." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Normal atmosfera bosimida (1 atm) suv necha gradusda qaynaydi?",
    options: ['50°C', '90°C', '100°C', '110°C'], answer: 2,
    explanation: "Dengiz sathida (atmosfera bosimi 1 atm = 101.325 kPa) sof suv 100°C da qaynaydi. Balandlikda bosim kamayishi bilan qaynash harorati pasayadi: Everest cho'qqisida (8848 m) suv 71°C da qaynaydi. Qozon bosimida esa 120°C gacha ham ko'tarilishi mumkin." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard',
    question: "Om qonuniga ko'ra, tok kuchi I qanday topiladi?",
    options: ['I = U × R', 'I = U / R', 'I = R / U', 'I = U + R'], answer: 1,
    explanation: "Om qonuni: zanjir uchastkasidagi tok kuchi kuchlanishga to'g'ri, qarshilikka teskari proporsional. I = U/R. 1827-yilda Georg Om tomonidan kashf etilgan. Birliklar: I [A], U [V], R [Ω]. Bu qonun barcha elektrotexnika hisoblarining asosi hisoblanadi." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Yer sirtidagi erkin tushish tezlanishi taxminan qanchaga teng?",
    options: ['9.8 m/s²', '10 m/s²', '6.67 m/s²', '5 m/s²'], answer: 0,
    explanation: "Yer sirtidagi g'g' (erkin tushish tezlanishi) ≈ 9.8 m/s² (aniqrog'i 9.80665 m/s²). Oddiy hisoblarda 10 m/s² olish mumkin. Qiymat qutblarga yaqin joyda ko'proq, ekvatorda kamroq. Oyda g ≈ 1.6 m/s². Bu gravitatsion maydon kuchlanishining o'lchovi." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard',
    question: "Energiyaning xalqaro (SI) o'lchov birligi qanday?",
    options: ['Vatt', 'Joul', 'Nyuton', 'Kulon'], answer: 1,
    explanation: "Energiya birligi — Joul (J). 1 J = 1 N · 1 m, ya'ni 1 N kuch 1 m yo'lda bajargan ish. Joul Britaniya fizigi Jeyms Jouldan kelgan. Boshqa birliklar: Vatt — quvvat (1 W = 1 J/s), Nyuton — kuch, Kulon — elektr zaryadi. 1 kaloriya ≈ 4.184 J." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Elektr quvvatining formulasi qanday?",
    options: ['P = U × I', 'P = U / I', 'P = I / U', 'P = U + I'], answer: 0,
    explanation: "Elektr quvvati P = U · I (kuchlanish × tok). Birligi — Vatt (W). Om qonuni bilan birlashtirilsa: P = I²·R = U²/R. Masalan: 220 V va 0.5 A bo'lsa P = 110 W. Kundalik hayotda: lampochka 60 W, muzlatgich 150 W, elektr pech 2000 W." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard',
    question: "Einsteyn nazariyasining mashhur formulasi qanday?",
    options: ['E = mc', 'E = mc²', 'E = m/c', 'E = c²/m'], answer: 1,
    explanation: "E = mc² — Einsteynning maxsus nisbiylik nazariyasi (1905) tenglamasi. Energiya (E) va massa (m) ekvivalentligini bildiradi: massa — konsentrlangan energiya shakli. c² — ulkan son (9×10¹⁶), shuning uchun kichik massa ham katta energiyaga aylanadi (atom energiyasi asosi)." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Kinetik energiya qanday formula bilan hisoblanadi?",
    options: ['Ek = mv²/2', 'Ek = mgh', 'Ek = F·d', 'Ek = mv'], answer: 0,
    explanation: "Kinetik energiya — jismning harakati tufayli ega bo'lgan energiyasi. Ek = mv²/2, m — massa, v — tezlik. Ko'rinib turibdiki, tezlik ikki marta oshsa, energiya to'rt marta oshadi. Potentsial energiya esa Ep = mgh (g — erkin tushish tezlanishi, h — balandlik)." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard',
    question: "1 kilovatt-soat (kVt·soat) necha joulga teng?",
    options: ['1000 J', '3.6 × 10⁶ J', '60 × 60 J', '10⁹ J'], answer: 1,
    explanation: "1 kVt·soat = 1000 W × 3600 s = 3,600,000 J = 3.6 MJ. Elektr energiyani hisoblash birligi (elektr hisoblagichlarda). Kundalik misol: 100 W lampochka 10 soat yonsa = 1 kVt·soat. Narxi tariflarga bog'liq, masalan 295 so'm/kVt·soat." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Tovush qaysi muhitda tezroq tarqaladi?",
    options: ['Havoda', 'Suvda', 'Bir xil', "Muhitga bog'liq emas"], answer: 1,
    explanation: "Tovush tezligi muhit zichligiga bog'liq. Havoda 20°C da — 343 m/s, suvda — 1480 m/s (4 marta tezroq), metallda (po'latda) — 5000 m/s (15 marta tezroq). Vakuumda tovush umuman tarqalmaydi (molekulalar yo'q). Shuning uchun dengiz hayvonlari suv orqali uzoqdan muloqot qila oladi." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard',
    question: "Elektromagnit to'lqinlarni nazariy jihatdan kim kashf etgan?",
    options: ['Isaak Nyuton', 'Jeyms Maksvell', 'Albert Einsteyn', 'Nikola Tesla'], answer: 1,
    explanation: "Jeyms Klark Maksvell (1831-1879) — shotland fizigi, 1864-1865 yillarda elektromagnit maydon nazariyasini yaratdi. Maksvell tenglamalari elektromagnit to'lqinlarni bashorat qilgan. Keyinchalik Genrix Gers tajriba yo'li bilan tasdiqladi. Bu kashfiyot radio, televizor, mobil aloqaga yo'l ochdi." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium',
    question: "Rezistordagi qarshilikni oshirsak tok kuchiga nima bo'ladi?",
    options: ['Oshadi', 'Kamayadi', "O'zgarmaydi", 'Nolga tushadi'], answer: 1,
    explanation: "Om qonuniga ko'ra I = U/R. Agar kuchlanish (U) o'zgarmas bo'lsa va qarshilik (R) oshsa, tok kuchi (I) kamayadi (teskari proporsional bog'liqlik). Masalan U=12V bo'lsa: R=2Ω → I=6A, R=4Ω → I=3A, R=6Ω → I=2A. Bu prinsip ko'pgina elektrotexnik qurilmalarda qo'llaniladi." },

  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard',
    question: "Atom yadrosini qanday kuch ushlab turadi?",
    options: ['Elektromagnit kuch', 'Gravitatsiya', 'Kuchsiz o\'zaro ta\'sir', "Kuchli o'zaro ta'sir"], answer: 3,
    explanation: "Fizikada 4 ta fundamental kuch bor: 1) Kuchli o'zaro ta'sir — yadroni birga ushlab turadi (eng kuchli). 2) Elektromagnit — elektr zaryadlar orasida. 3) Kuchsiz — radioaktiv parchalanishni boshqaradi. 4) Gravitatsiya — eng zaif. Kuchli kuch proton va neytronlarni birlashtiradi." },

  // ═══ KIMYO (15) ═══
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'easy',
    question: "Suvning kimyoviy formulasi qanday?",
    options: ['H₂O', 'CO₂', 'HCl', 'NaCl'], answer: 0,
    explanation: "Suv — H₂O formulasi bilan ifodalanadi, ya'ni 2 ta vodorod (H) va 1 ta kislorod (O) atomidan iborat molekula. Kovalent bog'lar bilan birikkan. Suv — hayotning asosi, insonning tanasi 60-70% suvdan iborat. 0°C da muzga aylanadi, 100°C da bug'ga." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "Elementlar davriy jadvalini kim yaratgan?",
    options: ['Dmitriy Mendeleyev', 'Antuan Lavuazye', 'Nils Bor', 'Ernest Ruterford'], answer: 0,
    explanation: "Dmitriy Ivanovich Mendeleyev (1834-1907) — rus kimyogari. 1869-yilda elementlarning davriy jadvalini yaratgan. U elementlarni atom massasi va xossalari bo'yicha tartibga solgan. Ba'zi bo'sh xonalarni qoldirib, kelajakdagi kashfiyotlarni bashorat qilgan (masalan, galliy va germaniy). 101-element uning sharafiga mendeleviy deb atalgan." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "Oltinning kimyoviy simvoli qanday?",
    options: ['G', 'Au', 'Ag', 'Al'], answer: 1,
    explanation: "Oltin — Au (lotincha \"Aurum\" — \"yorqin tong\" dan). Atom raqami 79, qimmatbaho metall. Ag — kumush (Argentum), Al — alyuminiy, G — umuman element simvoli emas. Oltin — inert metall, kislorodda oksidlanmaydi, kislotalarga chidamli. Qadimdan pul birligi va bezak sifatida ishlatilgan." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard',
    question: "Kislorodning atom raqami nechta?",
    options: ['6', '7', '8', '16'], answer: 2,
    explanation: "Kislorod (O) — davriy jadvaldagi 8-element. Atom raqami (protonlar soni) = 8. Atom massasi ≈ 16. Atmosferaning 21% ini tashkil qiladi. Nafas olishda muhim, yonish (oksidlanish) reaksiyalarida ishtirok etadi. O₂ (molekulyar kislorod) va O₃ (ozon) shakllarda uchraydi." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "NaCl birikmasi qanday moddaning kimyoviy formulasi?",
    options: ['Shakar', 'Osh tuzi', 'Sirka', 'Soda'], answer: 1,
    explanation: "NaCl — natriy xlorid, osh tuzi. Natriy (Na) va xlor (Cl) atomlaridan iborat ionli birikma. Oq kristall modda, suvda yaxshi eriydi. Inson organizmi uchun zarur (Na⁺ va Cl⁻ ionlari). Dengiz suvida ko'p miqdorda (3.5%). Shakar — C₁₂H₂₂O₁₁, sirka — CH₃COOH, soda — NaHCO₃." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard',
    question: "pH = 7 qanday muhitni bildiradi?",
    options: ['Kislotali', 'Neytral', "Ishqoriy", 'Aniqlanmagan'], answer: 1,
    explanation: "pH — vodorod ionlarining kontsentratsiyasini o'lchaydi (0 dan 14 gacha). pH < 7 — kislotali muhit (H⁺ ko'p), pH = 7 — neytral (toza suv), pH > 7 — ishqoriy (OH⁻ ko'p). Misol: limon suvi ~2 (kislota), qon ~7.4, sovun ~10. Har birligi 10 marta farq qiladi (logarifmik shkala)." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'easy',
    question: "Karbonat angidrid (uglerod dioksidi) ning formulasi qanday?",
    options: ['CO', 'CO₂', 'C₂O', 'CO₃'], answer: 1,
    explanation: "Karbonat angidrid — CO₂. Bu molekulada 1 uglerod va 2 kislorod atomi bor. Rangsiz, hidsiz gaz. Nafas chiqarishda hosil bo'ladi, o'simliklar fotosintezida yutadi. Atmosferada 0.04% bor. Issiqxona effektining asosiy sababchilaridan biri. CO — uglerod (II) oksidi, juda zaharli gaz." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "Kumushning kimyoviy simvoli qanday?",
    options: ['K', 'Au', 'Ag', 'Si'], answer: 2,
    explanation: "Kumush — Ag (lotincha \"Argentum\"). 47-element. Qimmatbaho oq-kumushrang metall, eng yuqori elektr va issiqlik o'tkazuvchanligiga ega. Antibakterial xususiyatlari bor. K — kaliy (Kalium), Au — oltin, Si — kremniy. Kumush zargarlik, elektronika, tibbiyotda qo'llaniladi." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard',
    question: "Avogadro soni qanchaga teng?",
    options: ['6.022 × 10²³', '3.14', '9.8', '1.67 × 10⁻²⁴'], answer: 0,
    explanation: "Avogadro soni Nₐ ≈ 6.022 × 10²³. 1 mol ixtiyoriy moddada shuncha zarracha (atom, molekula, ion) bor. Italyan olimi Amedeo Avogadro nomiga qo'yilgan. Masalan: 1 mol suvda 6.022 × 10²³ H₂O molekulasi. 1 mol uglerodda (12g) shuncha atom bor. Kimyo hisoblarining asosiy doimiysi." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "Atmosferada eng ko'p uchraydigan gaz qaysi?",
    options: ['Kislorod', 'Azot', 'Argon', 'CO₂'], answer: 1,
    explanation: "Yer atmosferasining tarkibi: azot (N₂) — 78%, kislorod (O₂) — 21%, argon — 0.93%, CO₂ — 0.04%, qolgani — boshqa gazlar (suv bug'i, neon, geliy). Azot inertligi sababli hayot uchun muhim. Kislorod — nafas olish, yonish uchun. Argon — lampalar va payvand ishlarida ishlatiladi." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "Vodorodning atom raqami nechta?",
    options: ['0', '1', '2', '7'], answer: 1,
    explanation: "Vodorod (H) — davriy jadvaldagi 1-element, eng yengil (atom massasi ~1). Yadroda faqat 1 ta proton, 1 ta elektron. Koinotdagi eng ko'p tarqalgan element (75% ommada). Quyosh va yulduzlarning asosiy yoqilg'isi (termoyadroviy reaksiya). Suvning tarkibiga kiradi. Energetikaning kelajagi sifatida qaraladi." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard',
    question: "Glyukozaning kimyoviy formulasi qanday?",
    options: ['C₆H₁₂O₆', 'CH₄', 'C₂H₅OH', 'H₂SO₄'], answer: 0,
    explanation: "Glyukoza — C₆H₁₂O₆, oddiy shakar (monosaxarid). Organizm uchun asosiy energiya manbai. Fotosintez natijasida o'simliklarda hosil bo'ladi (6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂). Qonimizda doimiy bo'ladi (me'yor 3.5-5.5 mmol/L). CH₄ — metan, C₂H₅OH — etil spirti, H₂SO₄ — sulfat kislotasi." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium',
    question: "Metan gazining formulasi qanday?",
    options: ['CH₃', 'CH₄', 'C₂H₆', 'CH₂'], answer: 1,
    explanation: "Metan — CH₄, eng oddiy uglevodorod (alkan). 1 uglerod va 4 vodorod atomidan iborat. Rangsiz, hidsiz gaz. Tabiiy gazning asosiy tarkibiy qismi (~90%). Issiqxona effekti yaratuvchi kuchli gaz (CO₂ dan 25 marta kuchliroq). Hayvonlar oshqozonida va botqoqliklarda hosil bo'ladi." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard',
    question: "Ozon qatlami qaysi atom birikmasidan iborat?",
    options: ['Azot (N)', 'Vodorod (H)', 'Kislorod (O)', 'Uglerod (C)'], answer: 2,
    explanation: "Ozon — O₃, 3 ta kislorod atomidan iborat kislorod allotropik shakli. Ozon qatlami (stratosferada, 20-30 km balandlikda) Quyoshning ultrabinafsha (UV) nurlarini yutadi va Yerdagi hayotni himoya qiladi. XX asrda freonlar tufayli ozon qatlami ingichkalashishi muammo bo'lib qolgan." },

  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'easy',
    question: "Oddiy haroratda qaysi metall suyuq holatda bo'ladi?",
    options: ['Temir', 'Simob', 'Oltin', 'Mis'], answer: 1,
    explanation: "Simob (Hg, Hydrargyrum — \"suyuq kumush\") — xona haroratida suyuq holatdagi yagona metall. Erish harorati -39°C, qaynash — 357°C. Zaharli. Eskicha termometrlar va barometrlarda ishlatilgan. Boshqa metallar qattiq holatda: temir 1538°C da, oltin 1064°C da, mis 1085°C da eriydi." },

  // ═══ BIOLOGIYA (15) ═══
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy',
    question: "Kattalarda normal tishlar soni nechta?",
    options: ['24', '28', '32', '36'], answer: 2,
    explanation: "Kattalarda 32 ta doimiy tish bor (4 kesuvchi + 2 oziq + 4 oldingi kichik + 6 katta oziq tish har jag'da, jami 16×2=32). Bundan 4 tasi aql tishlari. Bolalarda sut tishlari 20 ta. Tishlar ovqatni maydalash, gapirishda yordam berish uchun xizmat qiladi." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "Fotosintez jarayoni uchun nima kerak?",
    options: ["Yorug'lik, suv, CO₂", "Yorug'lik, O₂", "Azot va suv", "Gumus va issiqlik"], answer: 0,
    explanation: "Fotosintez — o'simliklar va ba'zi bakteriyalar amalga oshiradigan jarayon. Xloroplastlarda sodir bo'ladi: 6CO₂ + 6H₂O + yorug'lik energiyasi → C₆H₁₂O₆ (glyukoza) + 6O₂. Shart: quyosh nuri (yorug'lik), suv (ildizdan), karbonat angidrid (havodan), xlorofill (yashil pigment)." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "DNK qanday biomolekula?",
    options: ['Oqsil', 'Uglevod', 'Nuklein kislota', "Yog'"], answer: 2,
    explanation: "DNK (dezoksiribonuklein kislotasi) — irsiyat ma'lumotini saqlovchi nuklein kislota. Ikki spiralli shaklda (Uotson-Krik modeli, 1953). Tarkibi: 4 xil nukleotid (A, T, G, C). Odam DNK sida ~3 milliard juft nukleotid bor. Hujayra yadrosida joylashgan. DNK → RNK → oqsil (markaziy dogma)." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard',
    question: "Inson yuragi nechta bo'shliqdan iborat?",
    options: ['2', '3', '4', '5'], answer: 2,
    explanation: "Inson yuragi 4 bo'shliqli: 2 ta bo'lmacha (chap va o'ng atrium) va 2 ta qorincha (chap va o'ng ventrikul). O'ng tomoni venoz (kislorodsiz) qonni olib o'pkaga yuboradi, chap tomoni esa arterial (kislorodli) qonni butun tanaga tarqatadi. Yurak bir minutda ~70 marta uriladi (o'rtacha)." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "Hujayraning energiya \"zavodi\" deb ataluvchi organoid qaysi?",
    options: ['Yadro', 'Mitoxondriya', 'Ribosoma', 'Golji apparati'], answer: 1,
    explanation: "Mitoxondriya — hujayraning energetik markazi, ATP (adenozintrifosfat — universal energiya manbai) ishlab chiqaradi. O'zining DNK si bor, ikki membrana bilan o'ralgan. Hujayra nafas olishida (glyukoza → CO₂ + H₂O + ATP) asosiy rol o'ynaydi. Ommaviy tarzda faqat onadan o'tadi (evolyutsion marker)." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy',
    question: "Inson organizmida qaysi organ qonni haydab turadi?",
    options: ['Bosh miya', 'Yurak', 'Jigar', "O'pka"], answer: 1,
    explanation: "Yurak — qon aylanish tizimining markaziy nasos organi. Kuniga ~100,000 marta uriladi va 7000+ litr qonni haydaydi. Ikki dumaloq (kichik va katta) qon aylanish aylanasi bor. Kichik aylanada (o'pka) qon O₂ oladi, katta aylanada esa organlarga tarqaladi." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard',
    question: "Sog'lom kattalarning normal tana harorati qancha?",
    options: ['35°C', '36.6°C', '38°C', '40°C'], answer: 1,
    explanation: "Normal tana harorati — 36.6°C (±0.5°C). Qo'ltiqostidan o'lchanganda. Kun davomida biroz o'zgarib turadi: tongda pastroq (~36.4°C), kechasi yuqoriroq (~37°C). 37.5-38°C subfebril, 38°C dan yuqori febril isitma. Gipotalamus tomonidan boshqariladi. Tana gomeostazining asosiy ko'rsatkichlaridan biri." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "Quyosh nuri ta'sirida teridа qaysi vitamin hosil bo'ladi?",
    options: ['Vitamin A', 'Vitamin B', 'Vitamin C', 'Vitamin D'], answer: 3,
    explanation: "Vitamin D terida ultrabinafsha (UVB) nurlari ta'sirida 7-degidroxolesteroldan sintezlanadi. Kalsiy so'rilishiga yordam beradi, suyaklarni mustahkamlaydi. Yetishmasligi raxit (bolalarda), osteoporoz (kattalarda) sabab bo'ladi. Quyoshli kunda 15-20 daqiqa tashqarida bo'lish yetarli. Baliq, tuxum sarig'ida ham bor." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard',
    question: "Evolyutsiya nazariyasi asoschisi kim?",
    options: ['Albert Einshteyn', 'Charlz Darvin', 'Isaak Nyuton', 'Grigoriy Mendel'], answer: 1,
    explanation: "Charlz Darvin (1809-1882) — ingliz tabiatshunos. 1859-yilda \"Turlarning kelib chiqishi\" asarini nashr etgan. Tabiiy tanlash (natural selection) asosida evolyutsiya nazariyasini yaratgan. Galapagos orollaridagi qushlarni kuzatish orqali asoslantirgan. Zamonaviy biologiyaning asosini qo'ygan. Mendel — genetika asoschisi." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "Odam hujayrasida necha juft xromosoma bor?",
    options: ['23 ta', '46 ta', '48 ta', '100 ta'], answer: 1,
    explanation: "Odam somatik (tana) hujayrasida 46 ta xromosoma (23 juft) bor. 22 juft — autosoma (somatik), 1 juft — jinsiy xromosomalar (XX — ayol, XY — erkak). Jinsiy hujayralarda (tuxum, sperma) — 23 ta (gaploid to'plam). Mitoz va meyoz jarayonlarida hujayra bo'linadi. Xromosomalarda genlar joylashgan." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy',
    question: "Inson nafas olish organi qaysi?",
    options: ['Yurak', "O'pka", "Oshqozon", 'Jigar'], answer: 1,
    explanation: "O'pka — nafas olish tizimining asosiy organi. Havodan O₂ ni qonga o'tkazadi, qondagi CO₂ ni chiqaradi. Ikki o'pka: o'ng (3 bo'lak) va chap (2 bo'lak). Ichida alveolalar — mayda havo qopchalari, umumiy yuzasi tennis kortidek (~70 m²). Kuniga ~11,000 litr havo o'tadi." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "Hujayraning boshqaruv markazi qanday organoid?",
    options: ['Yadro', 'Mitoxondriya', 'Sitoplazma', 'Membrana'], answer: 0,
    explanation: "Yadro — eukariot hujayralarda DNK ni saqlovchi va hujayra faoliyatini boshqaruvchi organoid. Ikki membranali qobiq bilan o'ralgan (yadro qobig'i). Tarkibida xromatin (DNK + oqsillar) va yadrochasi bor. Genlar RNK ga ko'chiriladi, keyin sitoplazmaga chiqarilib, oqsillar sintezlanadi. Prokariotlarda (bakteriyalar) yadro yo'q." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard',
    question: "Qaysi qon guruhi universal donor hisoblanadi?",
    options: ['A+', 'B+', 'AB+', 'O (I) salbiy rezus'], answer: 3,
    explanation: "O (I) salbiy rezusli qon — universal donor. A, B yoki AB antijenlarsiz, rezus faktorsiz. Har qanday qon guruhiga quyish mumkin (asosan favqulodda holatlarda). AB+ esa universal retsipient — har qanday qondan qabul qila oladi. O ommaboplik: aholining ~7-8% (mintaqaga qarab). Qon quyishda mos keladigan tekshirish majburiy." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium',
    question: "Viruslarning asosiy xususiyati nima?",
    options: ['Mustaqil yashaydi', 'Hujayradan tashqarida ham tirik', "Faqat hujayra ichida ko'payadi", 'O\'simlik tipidagi organizm'], answer: 2,
    explanation: "Viruslar — hujayrali emas, \"hayot chegarasidagi\" obyekt. O'z-o'zidan ko'paya olmaydi, moddalar almashinuvi yo'q. Faqat tirik hujayra ichida (host cell) replikatsiya qiladi. Tarkibi: oqsil qobiq + ichida DNK yoki RNK. Hujayradan tashqarida \"faol emas\" holatda bo'ladi. Gripp, COVID-19, AIDS — virus kasalliklari." },

  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy',
    question: "Inson terisi qaysi organlar tizimiga kiradi?",
    options: ['Qon aylanish', 'Qoplovchi', 'Nafas olish', 'Ovqatlanish'], answer: 1,
    explanation: "Teri — qoplovchi (integumentar) tizimga kiradi. Eng katta inson organi (2 m², 3-4 kg). 3 qavatli: epidermis (ustki), derma (o'rta), gipoderma (yog' qavati). Funksiyalari: himoya (mikroblardan), termoregulyatsiya (tana haroratini boshqarish), sezish (nerv retseptorlari), D vitaminini sintez qilish." },

  // ═══ INGLIZ TILI (15) ═══
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy',
    question: "To'g'ri artiklni tanlang: ___ apple a day keeps the doctor away.",
    options: ['A', 'An', 'The', 'Hech qaysi'], answer: 1,
    explanation: "Noaniq artikllar: \"a\" — undosh tovushdan oldin, \"an\" — unli tovushdan oldin ishlatiladi. \"Apple\" \"a\" unli tovushi bilan boshlanadi, shuning uchun \"an\" kerak. \"The\" — aniq artikl, ma'lum bir narsa haqida. Qoida tovushga asoslanadi (imloga emas): an hour (lekin a house)." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "'Go' fe'lining Past Simple shakli qanday?",
    options: ['Goed', 'Gone', 'Went', 'Going'], answer: 2,
    explanation: "Go — tartibsiz (irregular) fe'l. Uning 3 shakli: go (hozirgi) — went (past simple) — gone (past participle). Masalan: \"I go to school\" (hozir), \"I went yesterday\" (kecha bordim), \"I have gone\" (borib kelganman). \"Goed\" shakli yo'q — xato. \"Going\" — Present Continuous uchun." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "To'g'ri fe'l shaklini tanlang: She ___ to school every day.",
    options: ['go', 'goes', 'going', 'gone'], answer: 1,
    explanation: "Present Simple da 3-shaxs birlikda (he/she/it) fe'lga -s yoki -es qo'shiladi. \"She\" — 3-shaxs birlik, shuning uchun \"goes\". Masalan: I go, you go, he/she/it goes, we go, they go. \"Every day\" — muntazam harakat, shuning uchun Present Simple kerak (Continuous emas)." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard',
    question: "Bo'sh joyga to'g'ri so'zni qo'ying: If I ___ rich, I would travel.",
    options: ['am', 'was', 'were', 'be'], answer: 2,
    explanation: "Bu Second Conditional (if II) — hozirgi yoki kelajakdagi imkonsiz shartlar uchun. Struktura: If + Past Simple, would + infinitive. \"To be\" fe'li barcha shaxslar uchun \"were\" bo'ladi (subjunctive mood). Masalan: If I were you, if he were here. So'zlashuvda \"was\" ham ishlatiladi, lekin formal grammatikada \"were\"." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "'Child' so'zining ko'plik shakli qanday?",
    options: ['Childs', 'Childes', 'Children', 'Childrens'], answer: 2,
    explanation: "Child — tartibsiz ko'plikka ega ot (irregular plural). Child → children. Boshqa shunday so'zlar: man → men, woman → women, foot → feet, tooth → teeth, mouse → mice, person → people. Odatdagi ko'plik -s yoki -es bilan (cat→cats, box→boxes), lekin bular alohida yodda tutiladi." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy',
    question: "Osmon rangi odatda qanday?",
    options: ['Green (yashil)', 'Blue (ko\'k)', 'Red (qizil)', 'Yellow (sariq)'], answer: 1,
    explanation: "Sky is blue — oddiy ingliz jumlasi. Rang-so'zlar: red (qizil), blue (ko'k), green (yashil), yellow (sariq), white (oq), black (qora), orange (to'q sariq), purple (binafsha), pink (pushti), brown (jigarrang), grey (kulrang)." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard',
    question: "To'g'ri so'zni tanlang: She has ___ finished her homework.",
    options: ['yet', 'already', 'still', 'ever'], answer: 1,
    explanation: "Present Perfect (has/have + V3) bilan vaqt ravishlari: \"already\" — tasdiq gaplarda (allaqachon), \"yet\" — so'roq/inkor gaplarda (hali), \"ever\" — so'roq (hech qachon), \"just\" — yaqinda. \"She has already finished\" — u allaqachon tugatgan. \"Has she finished yet?\" — u allaqachon tugatganmi?" },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "'Hot' so'zining antonimi qaysi?",
    options: ['Warm (iliq)', 'Cool (salqin)', 'Cold (sovuq)', 'Ice (muz)'], answer: 2,
    explanation: "Antonyms — zid ma'noli so'zlar. Hot (issiq) ↔ cold (sovuq). Harorat darajalari: freezing → cold → cool → warm → hot → boiling. \"Warm\" — iliq (hot emas), \"cool\" — salqin (cold emas), \"ice\" — muz (ot, sifat emas)." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "Qaysi so'z modal fe'l?",
    options: ['Run (yugur)', 'Can (mumkin)', 'Happy (baxtli)', 'Book (kitob)'], answer: 1,
    explanation: "Modal fe'llar — asosiy fe'llarga yordamchi bo'lib, imkoniyat, ruxsat, zaruriyat bildiradi. 9 ta modal: can, could, may, might, shall, should, will, would, must. Ulardan keyin to'siz infinitive: I can swim (to swim emas). Run — oddiy fe'l, happy — sifat, book — ot." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard',
    question: "Bo'sh joyga to'g'ri so'zni qo'ying: I ___ been to Paris twice.",
    options: ['has', 'have', 'had', 'having'], answer: 1,
    explanation: "Present Perfect — \"have/has\" + past participle. \"I\" bilan doim \"have\" ishlatiladi (3-shaxs birlikda \"has\"). Struktura: I have been, you have been, he/she has been. \"Have been to\" — tashrif buyurganlik, tajriba. \"Twice\" (ikki marta) — Present Perfect bilan hayot tajribasi ma'nosi." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy',
    question: "'Book' so'zining o'zbekcha tarjimasi qanday?",
    options: ['Daftar', 'Kitob', 'Qalam', 'Stol'], answer: 1,
    explanation: "Book = kitob. Maktab lug'ati: book (kitob), notebook/exercise book (daftar), pen (qalam — yozuvchi), pencil (qalam — oddiy), table (stol), chair (stul), desk (partali stol), teacher (o'qituvchi), student (o'quvchi)." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "To'g'ri predlog tanlang: She is interested ___ music.",
    options: ['on', 'at', 'in', 'for'], answer: 2,
    explanation: "\"Interested in\" — fe'l-predlog birikmasi (fixed preposition). Yodda tutish zarur. Shunga o'xshash: good at (...da yaxshi), afraid of (...dan qo'rqmoq), proud of (...dan faxrlanmoq), worried about (...dan xavotirlanmoq), different from (...dan farqli). Bu to'plamlar tilni o'rganishda muhim." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard',
    question: "'Will have finished' qaysi zamonga tegishli?",
    options: ['Future Simple', 'Future Perfect', 'Present Perfect', 'Past Perfect'], answer: 1,
    explanation: "Future Perfect (kelajakda tugagan harakat) — \"will have\" + past participle. Kelajakdagi ma'lum vaqtdan oldin bajariladigan harakatni bildiradi. Masalan: \"By 2030, I will have graduated\" (2030-yilga kelib men bitirgan bo'laman). Past Perfect esa \"had\" + V3 (o'tmishdan avvalroq)." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium',
    question: "'I love you' jumlasini o'zbekchaga tarjima qiling.",
    options: ["Meni yaxshi ko'raman", "Seni sog'indim", "Seni yaxshi ko'raman", 'Meni sevasan'], answer: 2,
    explanation: "\"I love you\" — so'zma-so'z: I (men) + love (sevaman/yaxshi ko'raman) + you (seni/sizni). Jumladagi so'zlar tartibi: Subject (Ega) + Verb (Fe'l) + Object (To'ldiruvchi). O'zbekchada to'ldiruvchi oldin keladi: \"Seni yaxshi ko'raman\". Diqqat: tarjima so'zma-so'z emas, ma'nolarga ko'ra." },

  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy',
    question: "'Salom' so'zining inglizcha muqobili qanday?",
    options: ['Bye (xayr)', 'Hello (salom)', 'Thanks (rahmat)', 'Yes (ha)'], answer: 1,
    explanation: "Salomlashish so'zlari: Hello (rasmiy), Hi (norasmiy), Hey (do'stona). Xayrlashish: Bye, Goodbye, See you. Minnatdorchilik: Thanks, Thank you. Tasdiq: Yes, Yeah. Rad: No, Nope. \"Hello\" universal — har qanday holatda ishlatilsa bo'ladi." },

  // ═══ INFORMATIKA (10) ═══
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'easy',
    question: "1 bayt nechta bitdan tashkil topgan?",
    options: ['1 bit', '4 bit', '8 bit', '16 bit'], answer: 2,
    explanation: "Bit — axborot miqdorining eng kichik birligi (0 yoki 1). Bayt — 8 bitdan iborat, bitta belgini (harf, raqam) saqlaydi. Kattaroq birliklar: 1 KB = 1024 bayt, 1 MB = 1024 KB, 1 GB = 1024 MB, 1 TB = 1024 GB. 2⁸ = 256 xil qiymat saqlay oladi." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium',
    question: "HTML nima?",
    options: ['Dasturlash tili', 'Belgilash tili', "Ma'lumotlar bazasi", 'Brauzer'], answer: 1,
    explanation: "HTML (HyperText Markup Language) — gipermatnni belgilash tili. Veb-sahifalar tuzilmasini aniqlaydi. Teglar bilan ishlaydi: <h1>, <p>, <a>, <img>, <div>. Tim Berners-Li tomonidan 1991-yilda yaratilgan. Dasturlash tili emas, chunki algoritm va mantiq tuza olmaydi. CSS bilan dizayn, JavaScript bilan funksionallik qo'shiladi." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium',
    question: "1 kilobayt (KB) necha baytga teng?",
    options: ['100', '512', '1024', '2048'], answer: 2,
    explanation: "Kompyuter xotira birliklarida 2 asos ishlatiladi: 1 KB = 2¹⁰ = 1024 bayt. Standart SI tizimidagi \"kilo\" 1000 ga teng, ammo informatikada 1024. Keyingi birliklar: 1 MB = 1024 KB, 1 GB = 1024 MB. Hozir IEC standartida KiB (kibibayt) = 1024, KB = 1000 deb aniqlangan, lekin odatda hamma KB=1024 deydi." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'hard',
    question: "TCP/IP nima?",
    options: ['Dastur', 'Tarmoq protokoli', 'Operatsion tizim', "Ma'lumotlar bazasi"], answer: 1,
    explanation: "TCP/IP (Transmission Control Protocol / Internet Protocol) — Internet va kompyuter tarmoqlarida ma'lumotlar almashinuvini ta'minlovchi protokollar to'plami. TCP — ma'lumotlarni paketlarga bo'lib uzatish va ishonchli yetkazib berish. IP — har paketga manzil berish va marshrutlash. Barcha Internet xizmatlari (HTTP, FTP, Email) shu ustida ishlaydi." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'easy',
    question: "Kompyuterning \"miyasi\" deb nima ataladi?",
    options: ['Klaviatura', 'Monitor', 'Protsessor (CPU)', 'Kabel'], answer: 2,
    explanation: "CPU (Central Processing Unit, markaziy protsessor) — kompyuterning asosiy hisoblash qurilmasi. Barcha operatsiyalarni bajaradi va boshqaradi. Xarakteristikalari: chastota (GHz), yadrolar soni (core), kesh xotirasi. Zamonaviy protsessorlar: Intel (Core i3/i5/i7/i9), AMD (Ryzen), Apple (M1/M2/M3). Tranzistorlar soni milliardlar bilan o'lchanadi." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium',
    question: "Ikki sanoq tizimida 5 raqami qanday yoziladi?",
    options: ['100', '101', '110', '111'], answer: 1,
    explanation: "Ikkilik sanoq tizimi (binary): 0 va 1 dan foydalanadi. Har xona 2 ning darajasini bildiradi (o'ngdan chapga: 2⁰, 2¹, 2², ...). 5 = 4 + 1 = 2² + 2⁰ = 101₂. Yana misollar: 1=1, 2=10, 3=11, 4=100, 5=101, 10=1010. Kompyuter ichida barcha ma'lumotlar 0 va 1 shaklida saqlanadi." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium',
    question: "CSS nima uchun ishlatiladi?",
    options: ["Ma'lumot saqlash", "Veb-sahifa ko'rinishini belgilash", 'Server boshqarish', 'Xavfsizlik'], answer: 1,
    explanation: "CSS (Cascading Style Sheets) — veb-sahifalar uchun dizayn tili. HTML elementlari ko'rinishini, joylashuvini, ranglarini, o'lchamlarini belgilaydi. Masalan: rang (color), shrift (font), joylashuv (position), animatsiyalar. Zamonaviy veb-sayt 3 ustunda: HTML (tuzilma) + CSS (dizayn) + JavaScript (funksionallik)." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'hard',
    question: "Algoritm qanday xususiyatga ega bo'lishi kerak?",
    options: ['Tasodifiy', 'Aniq va cheklangan ketma-ketlik', 'Cheksiz', "Ma'nosiz"], answer: 1,
    explanation: "Algoritm — muayyan masalani yechish uchun kerakli amallarning aniq, cheklangan ketma-ketligi. Xususiyatlari: 1) Aniqlik — har qadam bir ma'noli. 2) Cheklanganlik — chekli qadamlarda tugaydi. 3) Natijaviylik — yechim beradi. 4) Ommaviylik — o'xshash masalalarga qo'llanadi. \"Algoritm\" so'zi al-Xorazmiy ismidan." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium',
    question: "Qaysi dasturlash tili brauzerda (client-side) ishlaydi?",
    options: ['Python', 'JavaScript', 'C++', 'SQL'], answer: 1,
    explanation: "JavaScript — brauzerning ichki scripting tili, veb-sahifalarga interaktivlik qo'shadi (dynamic content, validation, AJAX). Client-side (foydalanuvchi tomonida) ishlaydi. Node.js bilan serverda ham ishlaydi. Python, C++ — umumiy maqsadli (server, desktop), SQL — ma'lumotlar bazasi uchun. Zamonaviy veb: HTML + CSS + JS." },

  { subject: 'inform', block: 'mutaxassislik', difficulty: 'easy',
    question: "USB nimaga xizmat qiladi?",
    options: ['Elektr ta\'minoti', "Ma'lumot uzatish va quvvat", 'Tovush chiqarish', 'Havo sovutish'], answer: 1,
    explanation: "USB (Universal Serial Bus) — kompyuter va tashqi qurilmalar orasida ma'lumot va quvvat uzatish interfeysi. Turlari: USB 2.0 (480 Mbps), USB 3.0 (5 Gbps), USB-C (yangi universal ulagich). Flesh xotiralar, printerlar, sichqonchalar, telefon zaryadlash — USB orqali. 1996-yilda yaratilgan, hozir hamma joyda." },

  // ═══ IQTISOD (10) ═══
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium',
    question: "YIM (YaIM) nimaning qisqartmasi?",
    options: ["Yalpi Ichki Mahsulot", "Yillik inflyatsiya", "Yosh ishchilar", 'Yirik import'], answer: 0,
    explanation: "YIM (YaIM) — Yalpi Ichki Mahsulot (inglizcha GDP — Gross Domestic Product). Mamlakat hududida bir yilda ishlab chiqarilgan barcha tovar va xizmatlar bozor qiymati. Iqtisodiyot holatining asosiy ko'rsatkichi. Hisoblash usullari: ishlab chiqarish, daromad, xarajat. O'zbekiston YIM 2024 ~100 mlrd AQSh dollari atrofida." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'easy',
    question: "Pul nima?",
    options: ["Tovarlar va xizmatlar to'lov vositasi", "Oziq-ovqat", 'Transport', 'Dori'], answer: 0,
    explanation: "Pul — iqtisodiy munosabatlarda universal to'lov va ayirboshlash vositasi. Funktsiyalari: 1) qiymat o'lchovi, 2) ayirboshlash vositasi, 3) jamg'arish vositasi, 4) to'lov vositasi, 5) jahon puli. Shakllari: metall tangalar, qog'oz, elektron (plastik karta, Payme, Click). Pulsiz savdo — barter." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium',
    question: "Inflyatsiya deganda nimani tushunasiz?",
    options: ['Narxlarning umumiy tushishi', 'Narxlarning umumiy oshishi', 'Ishsizlik', 'Boylik'], answer: 1,
    explanation: "Inflyatsiya — tovar va xizmatlar narxlarining umumiy va uzluksiz oshishi (pulning xarid qobiliyati kamayadi). Deflyatsiya — aksincha. Sabablari: pul massasi oshishi, talab-taklif nomutanosibligi, xarajat oshishi. Me'yoriy inflyatsiya ~2-4%. O'zbekistonda 2024 yilda ~10-11%. Bundan yuqorisi iqtisodga zarar." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'hard',
    question: "Monopoliya nima?",
    options: ["Ko'p sotuvchi raqobati", "Yagona sotuvchi vaziyati", 'Ochiq raqobat', 'Oson kirish bozori'], answer: 1,
    explanation: "Monopoliya — bozorda bitta sotuvchi (yoki ishlab chiqaruvchi) bo'lgan holat. Narxni istaganicha belgilay oladi. Turlari: tabiiy (elektr, suv), davlat, patent, tarmoq. Kamchiliklari: yuqori narx, past sifat, innovatsiya yo'qligi. Ko'p davlatlarda antimonopol qonunlar amal qiladi. Oligopoliya — bir nechta yirik sotuvchi." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium',
    question: "Bank foizi nima?",
    options: ["Qarzga olingan pul uchun to'lov", "Davlat solig'i", 'Foyda', 'Tovar narxi'], answer: 0,
    explanation: "Foiz — bank qarz pullar uchun oladigan qo'shimcha to'lov, kreditning narxi. Yillik foiz stavkasi bilan o'lchanadi. Turlari: oddiy (faqat asosiy qarzga), kompaund (qarz + foizga ham). Kredit foizi (bankga to'lash) > depozit foizi (bankdan olish). Markaziy bank qayta moliyalash stavkasi asosiy ko'rsatkich." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'hard',
    question: "O'zbekistonning milliy valyutasi qanday?",
    options: ['AQSh dollari', 'Rossiya rubli', "O'zbek so'mi", 'Yevro'], answer: 2,
    explanation: "O'zbek so'mi (UZS) — O'zbekiston Respublikasining milliy valyutasi. 1994-yil 1-iyulda joriy etilgan (SSSR rubli va kupondan so'ng). Bir so'm = 100 tiyin (lekin tiyinlar muomaladan chiqqan). Markaziy bank emissiya qiladi. 1000, 5000, 10000, 50000, 100000, 200000 so'mlik banknotalar. Kurs erkin: ~12,000 so'm = 1 USD." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium',
    question: "Talab va taklif qaysi iqtisodiy tizim asosidir?",
    options: ['Reja iqtisodiyoti', 'Bozor iqtisodiyoti', 'Jamoaviy iqtisod', 'An\'anaviy iqtisod'], answer: 1,
    explanation: "Bozor iqtisodiyoti — talab va taklif qonuniga asoslangan tizim. Narx talab (xaridorlar) va taklif (sotuvchilar) o'rtasida shakllanadi. Muvozanat narxi — talab = taklif bo'lgan narx. Adam Smit \"ko'rinmas qo'l\" g'oyasini ilgari surgan. Qarshi tizimlar: reja (SSSR), an'anaviy, aralash iqtisodiyot." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'easy',
    question: "Sof foyda qanday hisoblanadi?",
    options: ['Daromad + Soliq', 'Daromad - Xarajat', 'Daromad × Kredit', 'Daromad / Foiz'], answer: 1,
    explanation: "Foyda — tadbirkorlik natijasida qolgan pul. Sof foyda = Umumiy daromad - Barcha xarajatlar (sof daromad). Xarajat turlari: xom ashyo, ish haqi, soliqlar, kommunal, amortizatsiya. Tadbirkorlik maqsadi — foyda maksimallashtirish. Zarar — aksincha holat (xarajat > daromad)." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium',
    question: "Eksport nima?",
    options: ["Chetdan keltirilgan tovar", "Davlatdan chetga chiqarilgan tovar", "Ichki soliq", 'Reklama'], answer: 1,
    explanation: "Eksport — mamlakat ichida ishlab chiqarilgan va chet elga sotiladigan tovar yoki xizmat. Import — aksincha (chetdan keltirish). Savdo balansi = eksport - import. O'zbekiston eksporti: gaz, paxta, tilla, mevalar, tekstil. Asosiy partnyorlar: Rossiya, Xitoy, Qozog'iston, Turkiya. Eksport valyuta keltiradi, iqtisodni rivojlantiradi." },

  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'hard',
    question: "Markaziy bankning asosiy funksiyasi qanday?",
    options: ['Oddiy savdo', 'Milliy valyuta emissiyasi va pul siyosati', 'Transport', "Ta'lim"], answer: 1,
    explanation: "Markaziy bank — davlatning asosiy moliya instituti. Funksiyalari: 1) Milliy valyuta emissiyasi (chiqarish). 2) Pul-kredit siyosati. 3) Inflyatsiyani nazorat qilish. 4) Boshqa banklarni nazorat. 5) Valyuta zahiralari boshqaruvi. 6) Davlat bankiri. O'zbekiston Markaziy banki 1991-yildan. AQSh — Federal rezerv, YeI — ECB." },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB ga ulandi');

    await TestQuestion.deleteMany({});
    console.log("Eski savollar o'chirildi");

    await TestQuestion.insertMany(questions);
    console.log(`${questions.length} ta savol yuklandi`);

    const bySubj = {};
    questions.forEach(q => { bySubj[q.subject] = (bySubj[q.subject] || 0) + 1; });
    console.log('Fanlar bo\'yicha:', bySubj);

    // Tushuntirish uzunligi tahlili
    const avgLen = Math.round(
      questions.reduce((s, q) => s + q.explanation.length, 0) / questions.length
    );
    console.log(`Tushuntirishlar o'rtacha uzunligi: ${avgLen} belgi`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed xatosi:', err);
    process.exit(1);
  }
}

if (require.main === module) seed();

module.exports = { questions, seed };
