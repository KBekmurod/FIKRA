// node src/utils/seedQuestions.js  — ishga tushirish uchun
// Jami 150+ savol: majburiy 75 + mutaxassislik 80

require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('../models/TestQuestion');
const { logger } = require('./logger');

const questions = [
  // MAJBURIY: O'ZBEK TILI (25)
  { subject: 'uztil', block: 'majburiy', difficulty: 'easy', question: "Quyidagi so'zlardan qaysi biri to'g'ri yozilgan?", options: ['Kitob', 'Kitab', 'Kitov', 'Kitup'], answer: 0, explanation: "\"Kitob\" so'zi o'zbek tilida to'g'ri yoziladi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "\"Ota-onam keldi\" gapida kesim qaysi?", options: ['Ota-onam', 'Keldi', 'Ota', 'Onam'], answer: 1, explanation: "Kesim — gapning asosiy bo'lagi. \"Keldi\" fe'li kesim." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Qaysi qatorda barcha so'zlar unli tovush bilan boshlanadi?", options: ['Olma, bola, uy', 'Olma, uy, inson', 'Bola, inson, arzon', 'Daftar, uy, olma'], answer: 1, explanation: "Olma (o), uy (u), inson (i) — hammasi unli." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard', question: "\"Muallim dars berdi\" gapida ega qaysi?", options: ['Dars', 'Berdi', 'Muallim', 'Dars berdi'], answer: 2, explanation: "Ega — harakat egasi. \"Muallim\" ega." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Quyidagi so'zlardan qaysi biri sinonim emas?", options: ["Bahor-ko'klam", "Kuz-xazon", "Qish-sovuq", "Yoz-saraton"], answer: 2, explanation: "Qish — fasl, sovuq — sifat." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Qaysi gap darak gap?", options: ['Bugun havo issiqmi?', "Bolalar o'qiyapti.", 'Ajoyib!', 'Kel, yurar-chi'], answer: 1, explanation: "Darak gap — xabar beradi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard', question: "\"Kitob\" so'zining ko'plik shakli qaysi?", options: ['Kitobi', 'Kitoblar', 'Kitobim', 'Kitobda'], answer: 1, explanation: "Ko'plik qo'shimchasi -lar. Kitoblar." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'easy', question: "Qaysi so'zda unli tovush ko'p?", options: ['Maktab', 'Universitet', 'Daftar', 'Stol'], answer: 1, explanation: "Universitet — 6 unli." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Sifat qaysi so'z?", options: ["Yugurmoq", "Ko'k", 'Stol', "Tez-tez"], answer: 1, explanation: "\"Ko'k\" sifat — rang belgisi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "\"Men kitob o'qiyapman\" gapida to'ldiruvchi qaysi?", options: ['Men', "O'qiyapman", 'Kitob', 'Yo\'q'], answer: 2, explanation: "Nimani o'qiyapman? Kitobni." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard', question: "Ravishdosh qaysi qo'shimcha bilan yasaladi?", options: ['-lar', '-gan, -ib', '-ning', '-dan'], answer: 1, explanation: "Ravishdosh: -gan, -ib, -gach, -guncha." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "\"Bahor keldi\" — fe'l qaysi zamonda?", options: ['Hozirgi', "O'tgan", 'Kelasi', 'Buyruq'], answer: 1, explanation: "-di qo'shimchasi o'tgan zamon." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Qaysi so'zda tub so'zga qo'shimcha qo'shilgan?", options: ['Uy', "Kelish", 'Yashil', 'Tosh'], answer: 1, explanation: "Kel + ish." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard', question: "Antonim qaysi?", options: ['Kitob-daftar', 'Baland-past', 'Olma-anor', 'Yaxshi-chiroyli'], answer: 1, explanation: "Antonim — zid ma'noli." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'easy', question: "Qaysi belgi undov?", options: ['.', ',', '!', '?'], answer: 2, explanation: "! — undov belgisi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "\"Toshkent\" so'zida nechta bo'g'in?", options: ['1', '2', '3', '4'], answer: 1, explanation: "Tosh-kent — 2 bo'g'in." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Son qaysi so'z?", options: ['Yashil', "Besh", 'Quloq', 'Oshmoq'], answer: 1, explanation: "Son — miqdor bildiradi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard', question: "\"Maktabga borayapman\" — harakat qanday?", options: ['Bajarilgan', 'Bajarilmoqda', 'Bajariladi', 'Buyruq'], answer: 1, explanation: "Hozirgi zamon davom shakli." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Olmosh qaysi so'z?", options: ['Daftar', 'Men', 'Kitob', 'Boradi'], answer: 1, explanation: "\"Men\" — kishilik olmoshi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'easy', question: "Qaysi harfda jarangli undosh yo'q?", options: ['B', 'D', 'Z', 'S'], answer: 3, explanation: "S — jarangsiz." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "\"Uylar — insonlarning yashash joyi\" — tire nima uchun?", options: ['Ikki ega', 'Ega va kesim ot', 'Undov', 'Savol'], answer: 1, explanation: "Ega-kesim ot bo'lganda tire qo'yiladi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard', question: "Qaysi gap qo'shma?", options: ["Men keldim.", "Bahor keldi, daraxtlar gulladi.", "Bola kitob o'qiydi.", "Qor yog'ayapti."], answer: 1, explanation: "Ikki kesimli, vergul bilan ajratilgan." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Ot qanday turkum?", options: ['Narsa nomi', 'Harakat', 'Belgi', 'Miqdor'], answer: 0, explanation: "Ot — predmet nomi." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'hard', question: "\"Men yaxshi ko'raman\" — \"yaxshi\" qaysi bo'lak?", options: ['Ega', 'Kesim', 'Aniqlovchi', 'Hol'], answer: 3, explanation: "Qanday ko'raman? Yaxshi — hol." },
  { subject: 'uztil', block: 'majburiy', difficulty: 'medium', question: "Qaysi so'zda qo'shma unli bor?", options: ['Bola', 'Maktab', 'Oy', "Qo'shiq"], answer: 3, explanation: "\"Qo'\" — qo'shma unli." },

  // MATEMATIKA (25)
  { subject: 'math', block: 'majburiy', difficulty: 'easy', question: "2 + 2 × 2 = ?", options: ['6', '8', '4', '10'], answer: 0, explanation: "Ko'paytma birinchi: 2×2=4. Keyin 2+4=6." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "x + 5 = 12 bo'lsa, x = ?", options: ['5', '7', '17', '6'], answer: 1, explanation: "x = 12 - 5 = 7." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "25% 200 ning qanchasi?", options: ['25', '40', '50', '75'], answer: 2, explanation: "200 × 0.25 = 50." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "Uchburchak burchaklari yig'indisi?", options: ['90°', '180°', '270°', '360°'], answer: 1, explanation: "Uchburchak ichki burchaklari = 180°." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "√144 = ?", options: ['10', '11', '12', '14'], answer: 2, explanation: "12 × 12 = 144." },
  { subject: 'math', block: 'majburiy', difficulty: 'easy', question: "Yarim soatda nechta daqiqa?", options: ['20', '25', '30', '45'], answer: 2, explanation: "60 / 2 = 30." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "5! = ?", options: ['25', '60', '120', '720'], answer: 2, explanation: "5! = 5×4×3×2×1 = 120." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "a=3, b=4 bo'lsa, a²+b² = ?", options: ['12', '24', '25', '49'], answer: 2, explanation: "9 + 16 = 25." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "Kvadrat perimetri 20. Tomoni?", options: ['4', '5', '6', '8'], answer: 1, explanation: "20 / 4 = 5." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "Aylana r=5. Yuzi?", options: ['10π', '15π', '25π', '50π'], answer: 2, explanation: "S = πr² = 25π." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "2x - 3 = 7. x = ?", options: ['2', '3', '5', '10'], answer: 2, explanation: "2x = 10, x = 5." },
  { subject: 'math', block: 'majburiy', difficulty: 'easy', question: "100 ning 10% i?", options: ['1', '10', '100', '1000'], answer: 1, explanation: "100/10 = 10." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "Progressiya: 2,5,8,11,... 10-had?", options: ['29', '32', '30', '35'], answer: 0, explanation: "a_10 = 2 + 9×3 = 29." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "a=3 bo'lsa V=a³ = ?", options: ['9', '18', '27', '81'], answer: 2, explanation: "3³ = 27." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "log₁₀(1000) = ?", options: ['1', '2', '3', '10'], answer: 2, explanation: "10³ = 1000." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "150 ning 1/3 qismi?", options: ['30', '50', '75', '100'], answer: 1, explanation: "150 / 3 = 50." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "Pifagor: a=3, b=4. c=?", options: ['5', '6', '7', '12'], answer: 0, explanation: "√(9+16) = √25 = 5." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "sin(90°) = ?", options: ['0', '0.5', '1', "∞"], answer: 2, explanation: "sin(90°) = 1." },
  { subject: 'math', block: 'majburiy', difficulty: 'easy', question: "1 kg = ? g", options: ['10', '100', '1000', '10000'], answer: 2, explanation: "1 kg = 1000 g." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "x² - 5x + 6 = 0", options: ['x=1,2', 'x=2,3', 'x=3,4', 'x=1,6'], answer: 1, explanation: "Vieta: x=2, x=3." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "360° yarmi?", options: ['90°', '120°', '180°', '270°'], answer: 2, explanation: "360/2 = 180." },
  { subject: 'math', block: 'majburiy', difficulty: 'easy', question: "6 × 7 = ?", options: ['13', '42', '48', '56'], answer: 1, explanation: "6×7 = 42." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "3x = 15. x = ?", options: ['3', '5', '10', '45'], answer: 1, explanation: "15/3 = 5." },
  { subject: 'math', block: 'majburiy', difficulty: 'hard', question: "Parallelogramm a=8, h=5. S=?", options: ['13', '26', '40', '80'], answer: 2, explanation: "S = a×h = 40." },
  { subject: 'math', block: 'majburiy', difficulty: 'medium', question: "2⁵ = ?", options: ['10', '16', '25', '32'], answer: 3, explanation: "2⁵ = 32." },

  // TARIX (25)
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy', question: "O'zbekiston mustaqilligi qachon?", options: ['1989', '1990', '1991', '1992'], answer: 2, explanation: "1991-yil 31-avgust." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Amir Temur poytaxti?", options: ['Buxoro', 'Samarqand', 'Toshkent', 'Xiva'], answer: 1, explanation: "Samarqand (1370-yildan)." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Alisher Navoiy qachon tug'ilgan?", options: ['1441', '1501', '1480', '1400'], answer: 0, explanation: "1441-yil 9-fevral, Hirot." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard', question: "Ibn Sino qaysi shaharda tug'ilgan?", options: ['Buxoro', 'Samarqand', 'Afshona', 'Urganch'], answer: 2, explanation: "Afshona qishlog'i, 980-yil." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "SSSR qachon tarqagan?", options: ['1989', '1990', '1991', '1993'], answer: 2, explanation: "1991-yil dekabr." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "I jahon urushi qachon boshlangan?", options: ['1914', '1918', '1939', '1945'], answer: 0, explanation: "1914-1918." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard', question: "Al-Xorazmiy — qaysi fan asoschisi?", options: ['Tibbiyot', 'Algebra', 'Astronomiya', "Falsafa"], answer: 1, explanation: "Algebra. \"Algoritm\" so'zi uning ismidan." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy', question: "O'zbekiston poytaxti?", options: ['Samarqand', 'Buxoro', 'Toshkent', 'Namangan'], answer: 2, explanation: "Toshkent — 1930-yildan." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Mo'g'ullar O'rta Osiyoni qachon bosgan?", options: ['1219-1221', '1300', '1370', '1526'], answer: 0, explanation: "Chingizxon 1219-1221." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard', question: "Bobur qaysi saltanatga asos solgan?", options: ["Usmonli", "Safaviylar", "Boburiylar", "Shayboniylar"], answer: 2, explanation: "1526-yilda Hindistonda." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "II jahon urushi qachon tugagan?", options: ['1943', '1945', '1947', '1950'], answer: 1, explanation: "1945-yil." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Ulug'bek madrasasi qaerda?", options: ['Buxoro', 'Xiva', 'Samarqand', 'Toshkent'], answer: 2, explanation: "Samarqand, 15-asr." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard', question: "Beruniy qachon yashagan?", options: ['8-9 asr', '10-11 asr', '12-13 asr', '14-15 asr'], answer: 1, explanation: "973-1048 yillar." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy', question: "Ipak yo'li qaysi qit'alarni bog'lagan?", options: ['Yevropa-Afrika', 'Osiyo-Yevropa', 'Afrika-Amerika', 'Amerika-Osiyo'], answer: 1, explanation: "Xitoy - O'rtayer dengizi." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Amir Temur qachon vafot etgan?", options: ['1380', '1405', '1425', '1450'], answer: 1, explanation: "1405-yil 18-fevral." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard', question: "Rossiya O'rta Osiyoga qachon bostirib kirgan?", options: ['1830', '1865', '1900', '1917'], answer: 1, explanation: "1865 — Toshkent." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Qadimgi Misrning mashhur qurilishi?", options: ["Xitoy devori", "Piramidalar", "Kolizey", "Parfenon"], answer: 1, explanation: "Piramidalar — fir'avnlar qabrlari." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Amir Temur qaysi yilda tug'ilgan?", options: ['1336', '1340', '1350', '1400'], answer: 0, explanation: "1336, Kesh yaqinida." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard', question: "Mesopotamiya qaysi daryolar orasi?", options: ['Nil-Amazonka', 'Amudaryo-Sirdaryo', 'Dajla-Furot', 'Volga-Ural'], answer: 2, explanation: "Dajla va Furot." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy', question: "I.Karimov qachon vafot etgan?", options: ['2014', '2015', '2016', '2017'], answer: 2, explanation: "2016-yil 2-sentabr." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Amerika kashfiyoti qachon?", options: ['1450', '1492', '1500', '1550'], answer: 1, explanation: "1492, Kolumb." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "Ibn Sino qaysi tilda yozgan?", options: ['Arabcha-forscha', 'Yunon-lotin', 'Turkcha', 'Xitoycha'], answer: 0, explanation: "Asosan arab, ayrim fors." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'hard', question: "Qo'qon xonligi qachon tugagan?", options: ['1865', '1876', '1881', '1900'], answer: 1, explanation: "1876, Rossiya imperiyasi tomonidan." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'easy', question: "O'zbekistonda nechta viloyat?", options: ['10', '12', '14', '16'], answer: 1, explanation: "12 viloyat + Qoraqalpog'iston + Toshkent shahar." },
  { subject: 'tarix', block: 'majburiy', difficulty: 'medium', question: "O'zbekiston davlat tili?", options: ['Ruscha', "O'zbekcha", 'Tojikcha', 'Qozoqcha'], answer: 1, explanation: "O'zbek tili — Konstitutsiyaga ko'ra." },

  // MUTAXASSISLIK: FIZIKA (15)
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Nyuton 2-qonuni?", options: ['F=ma', 'F=mv', 'F=mg', 'F=m/a'], answer: 0, explanation: "F = ma." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard', question: "Yorug'lik tezligi?", options: ['3×10⁵ km/s', '3×10⁸ m/s', '3×10⁶ m/s', '3×10¹⁰ m/s'], answer: 1, explanation: "c ≈ 3×10⁸ m/s." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Elektr toki birligi?", options: ['Volt', 'Amper', 'Vatt', 'Om'], answer: 1, explanation: "Amper (A)." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Suv qaynash harorati?", options: ['50°C', '90°C', '100°C', '110°C'], answer: 2, explanation: "100°C, 1 atm bosimda." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard', question: "Ohm: I = ?", options: ['U×R', 'U/R', 'R/U', 'U+R'], answer: 1, explanation: "I = U/R." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Yer gravitatsiyasi?", options: ['9.8 m/s²', '10 m/s²', '6.67 m/s²', '5 m/s²'], answer: 0, explanation: "g ≈ 9.8 m/s²." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard', question: "Energiya birligi?", options: ['Vatt', 'Joul', 'Nyuton', 'Kulon'], answer: 1, explanation: "Joul (J)." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Quvvat formulasi?", options: ['P=U×I', 'P=U/I', 'P=I/U', 'P=U+I'], answer: 0, explanation: "P = U × I." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard', question: "Einstein formulasi?", options: ['E=mc', 'E=mc²', 'E=m/c', 'E=c²/m'], answer: 1, explanation: "E = mc²." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Kinetik energiya?", options: ['mv²/2', 'mgh', 'F×d', 'mv'], answer: 0, explanation: "Ek = mv²/2." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard', question: "1 kVt·soat = ?", options: ['1000', '3.6×10⁶', '60×60', '10⁹'], answer: 1, explanation: "3.6 MJ." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Qaysi tovush tezroq?", options: ['Havoda', 'Suvda', 'Bir xil', "Bog'liq emas"], answer: 1, explanation: "Suvda 4x tezroq." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard', question: "Elektromagnit to'lqin — qaysi olim?", options: ['Nyuton', 'Maxwell', 'Einstein', 'Tesla'], answer: 1, explanation: "Maxwell 1864-yilda." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'medium', question: "Qarshilik oshsa tok?", options: ['Oshadi', 'Kamayadi', "O'zgarmaydi", "Nolga tushadi"], answer: 1, explanation: "I = U/R." },
  { subject: 'fizika', block: 'mutaxassislik', difficulty: 'hard', question: "Yadro nimasi?", options: ['Elektron', 'Proton', "Neytron", "Kuchli o'zaro ta'sir"], answer: 3, explanation: "Kuchli o'zaro ta'sir." },

  // KIMYO (15)
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'easy', question: "Suv formulasi?", options: ['H2O', 'CO2', 'HCl', 'NaCl'], answer: 0, explanation: "H₂O." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium', question: "Davriy jadval asoschisi?", options: ['Mendeleyev', 'Lavuazye', 'Bor', 'Ruterford'], answer: 0, explanation: "Mendeleyev, 1869." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium', question: "Oltin simvoli?", options: ['G', 'Au', 'Ag', 'Al'], answer: 1, explanation: "Au — Aurum." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard', question: "Kislorod atom raqami?", options: ['6', '7', '8', '16'], answer: 2, explanation: "O — 8." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium', question: "NaCl nima?", options: ['Shakar', 'Tuz', 'Sirka', 'Soda'], answer: 1, explanation: "Natriy xlorid, osh tuzi." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard', question: "pH 7 bu?", options: ['Kislotali', 'Neytral', "Ishqoriy", 'Aniqlanmagan'], answer: 1, explanation: "pH 7 — neytral." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'easy', question: "Karbonat angidrid?", options: ['CO', 'CO2', 'C2O', 'CO3'], answer: 1, explanation: "CO₂." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium', question: "Kumush simvoli?", options: ['K', 'Au', 'Ag', 'Si'], answer: 2, explanation: "Ag — Argentum." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard', question: "Avogadro soni?", options: ['6.022×10²³', '3.14', '9.8', '1.67×10⁻²⁴'], answer: 0, explanation: "1 molda zarracha soni." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium', question: "Atmosferada ko'p gaz?", options: ['Kislorod', 'Azot', 'Argon', 'CO2'], answer: 1, explanation: "N₂ — 78%." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium', question: "Vodorod atom raqami?", options: ['0', '1', '2', '7'], answer: 1, explanation: "H — 1." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard', question: "Glukoza formulasi?", options: ['C6H12O6', 'CH4', 'C2H5OH', 'H2SO4'], answer: 0, explanation: "C₆H₁₂O₆." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'medium', question: "Metan formulasi?", options: ['CH3', 'CH4', 'C2H6', 'CH2'], answer: 1, explanation: "CH₄." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'hard', question: "Ozon — qaysi atom?", options: ['N', 'H', 'O', 'C'], answer: 2, explanation: "O₃ — 3 kislorod." },
  { subject: 'kimyo', block: 'mutaxassislik', difficulty: 'easy', question: "Qaysi metall suyuq?", options: ['Temir', 'Simob', 'Oltin', 'Mis'], answer: 1, explanation: "Hg — simob." },

  // BIOLOGIYA (15)
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy', question: "Inson tishlari (kattalar)?", options: ['24', '28', '32', '36'], answer: 2, explanation: "32 ta (aql tishlari bilan)." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium', question: "Fotosintez uchun nima kerak?", options: ["Yorug'lik, suv, CO2", "Yorug'lik, O2", 'Azot, suv', 'Gumus'], answer: 0, explanation: "CO₂ + H₂O + yorug'lik." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium', question: "DNK nima?", options: ['Oqsil', 'Uglevod', 'Nuklein kislota', "Yog'"], answer: 2, explanation: "Dezoksiribonuklein kislotasi." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard', question: "Inson yuragi nechta kamerali?", options: ['2', '3', '4', '5'], answer: 2, explanation: "4: 2 bo'lmacha + 2 qorincha." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium', question: "Hujayra energetik markazi?", options: ['Yadro', 'Mitoxondriya', 'Ribosoma', 'Golji'], answer: 1, explanation: "Mitoxondriya — ATP ishlab chiqaradi." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy', question: "Qon haydaydigan organ?", options: ['Bosh', 'Yurak', 'Jigar', "O'pka"], answer: 1, explanation: "Yurak." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard', question: "Tana harorati normada?", options: ['35°C', '36.6°C', '38°C', '40°C'], answer: 1, explanation: "36.6°C." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium', question: "Quyoshdan qaysi vitamin?", options: ['A', 'B', 'C', 'D'], answer: 3, explanation: "Vitamin D." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard', question: "Darvin — qaysi nazariya?", options: ['Nisbiylik', 'Evolyutsiya', 'Gravitatsiya', 'Kvant'], answer: 1, explanation: "Evolyutsiya (1859)." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium', question: "Inson xromosomasi?", options: ['23', '46', '48', '100'], answer: 1, explanation: "46 (23 juft)." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy', question: "Nafas organi?", options: ['Yurak', "O'pka", "Oshqozon", 'Jigar'], answer: 1, explanation: "O'pka." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium', question: "Hujayra boshqaruv markazi?", options: ['Yadro', 'Mitoxondriya', 'Sitoplazma', 'Membrana'], answer: 0, explanation: "Yadro — DNK saqlanadi." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'hard', question: "Universal donor qaysi qon guruhi?", options: ['A+', 'B+', 'AB+', 'O-'], answer: 3, explanation: "O- (manfiy rezus)." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'medium', question: "Virus xususiyati?", options: ['Mustaqil yashaydi', 'Hujayradan tashqari tirik', "Faqat hujayrada ko'payadi", "O'simlik"], answer: 2, explanation: "Tirik hujayra kerak." },
  { subject: 'bio', block: 'mutaxassislik', difficulty: 'easy', question: "Inson terisi qaysi tizim?", options: ['Qon', 'Qoplovchi', 'Nafas', 'Ovqatlanish'], answer: 1, explanation: "Qoplovchi — eng katta organ." },

  // INGLIZ (15)
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy', question: "___ apple a day keeps doctor away.", options: ['A', 'An', 'The', 'No article'], answer: 1, explanation: "An — unli bilan boshlanadi." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium', question: "Past of 'go'?", options: ['Goed', 'Gone', 'Went', 'Going'], answer: 2, explanation: "Went — past simple." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium', question: "She ___ to school every day.", options: ['go', 'goes', 'going', 'gone'], answer: 1, explanation: "3rd person + s." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard', question: "If I ___ rich, I would travel.", options: ['am', 'was', 'were', 'be'], answer: 2, explanation: "Conditional II — were." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium', question: "Plural of 'child'?", options: ['Childs', 'Childes', 'Children', 'Childrens'], answer: 2, explanation: "Children — irregular." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy', question: "Sky color (usually)?", options: ['Green', 'Blue', 'Red', 'Yellow'], answer: 1, explanation: "Blue." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard', question: "She has ___ finished her homework.", options: ['yet', 'already', 'still', 'ever'], answer: 1, explanation: "Already — affirmative." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium', question: "Opposite of 'hot'?", options: ['Warm', 'Cool', 'Cold', 'Ice'], answer: 2, explanation: "Cold." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium', question: "Modal verb?", options: ['Run', 'Can', 'Happy', 'Book'], answer: 1, explanation: "Can, could, must, may..." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard', question: "I ___ been to Paris twice.", options: ['has', 'have', 'had', 'having'], answer: 1, explanation: "Have — present perfect." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy', question: "'Book' tarjima?", options: ['Daftar', 'Kitob', 'Qalam', 'Stol'], answer: 1, explanation: "Book = kitob." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium', question: "She is interested ___ music.", options: ['on', 'at', 'in', 'for'], answer: 2, explanation: "Interested in." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'hard', question: "'Will have finished' qaysi zamon?", options: ['Future Simple', 'Future Perfect', 'Present Perfect', 'Past Perfect'], answer: 1, explanation: "Future Perfect." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'medium', question: "'I love you' tarjima?", options: ["Meni yaxshi ko'raman", "Seni sog'indim", "Seni yaxshi ko'raman", 'Meni sevasan'], answer: 2, explanation: "I+love+you = seni yaxshi ko'raman." },
  { subject: 'ingliz', block: 'mutaxassislik', difficulty: 'easy', question: "'salom' in English?", options: ['Bye', 'Hello', 'Thanks', 'Yes'], answer: 1, explanation: "Hello." },

  // INFORMATIKA (10)
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'easy', question: "1 bayt = ? bit", options: ['1', '4', '8', '16'], answer: 2, explanation: "8 bit." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium', question: "HTML — bu ...", options: ['Dasturlash tili', 'Belgilash tili', "Ma'lumotlar bazasi", 'Brauzer'], answer: 1, explanation: "HyperText Markup Language." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium', question: "1 KB = ? bayt", options: ['100', '512', '1024', '2048'], answer: 2, explanation: "2¹⁰ = 1024." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'hard', question: "TCP/IP — bu ...", options: ['Dastur', 'Tarmoq protokoli', 'OT', 'DB'], answer: 1, explanation: "Internet protokoli." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'easy', question: "Kompyuter miyasi?", options: ['Klaviatura', 'Monitor', 'CPU', 'Kabel'], answer: 2, explanation: "CPU — protsessor." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium', question: "2 sistemada 5 = ?", options: ['100', '101', '110', '111'], answer: 1, explanation: "5 = 4+1 = 101." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium', question: "CSS — nima uchun?", options: ["Ma'lumot", "Ko'rinish", 'Server', 'Xavfsizlik'], answer: 1, explanation: "Veb sahifalar dizayni." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'hard', question: "Algoritm — qanday?", options: ['Tasodifiy', "Aniq ketma-ketlik", 'Cheksiz', "Ma'nosiz"], answer: 1, explanation: "Masala yechish tartibi." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'medium', question: "Brauzerda qaysi til?", options: ['Python', 'JavaScript', 'C++', 'SQL'], answer: 1, explanation: "JavaScript — client-side." },
  { subject: 'inform', block: 'mutaxassislik', difficulty: 'easy', question: "USB nima uchun?", options: ['Elektr', "Ma'lumot", 'Tovush', 'Havo'], answer: 1, explanation: "Universal Serial Bus." },

  // IQTISOD (10)
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium', question: "YIM nima?", options: ["Yalpi Ichki Mahsulot", 'Yillik inflation', 'Yosh ishchi', 'Yirik import'], answer: 0, explanation: "GDP — iqtisodiyot ko'rsatkichi." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'easy', question: "Pul — bu?", options: ["To'lov vositasi", "Oziq-ovqat", 'Transport', 'Dori'], answer: 0, explanation: "Ayirboshlash vositasi." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium', question: "Inflatsiya?", options: ['Narx tushish', 'Narx oshishi', 'Ishsizlik', 'Boylik'], answer: 1, explanation: "Umumiy narxlar oshishi." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'hard', question: "Monopoliya?", options: ["Ko'p sotuvchi", "Yagona sotuvchi", 'Raqobat', 'Oson bozor'], answer: 1, explanation: "Bozorda yagona sotuvchi." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium', question: "Bank foizi?", options: ["Qarzga olingan pul uchun to'lov", "Soliq", 'Foyda', 'Narx'], answer: 0, explanation: "Qarz ustiga to'lov." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'hard', question: "O'zbekiston valyutasi?", options: ['Dollar', 'Rubl', "So'm", 'Yevro'], answer: 2, explanation: "UZS, 1994-yildan." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium', question: "Talab va taklif — qaysi iqtisod?", options: ['Mustaqillik', 'Bozor', 'Davlat', 'Boyliklar'], answer: 1, explanation: "Bozor iqtisodiyoti." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'easy', question: "Foyda = Daromad - ?", options: ['Soliq', 'Xarajat', 'Kredit', 'Foiz'], answer: 1, explanation: "Foyda = Daromad - Xarajat." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'medium', question: "Eksport — bu?", options: ['Import', "Davlatdan chiqarilgan", 'Soliq', 'Reklama'], answer: 1, explanation: "Boshqa davlatlarga sotish." },
  { subject: 'iqtisod', block: 'mutaxassislik', difficulty: 'hard', question: "Markaziy bank?", options: ['Savdo', 'Pul emissiyasi', 'Transport', "Ta'lim"], answer: 1, explanation: "Pul muomalasini boshqaradi." },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB ulandi');

    await TestQuestion.deleteMany({});
    console.log("Eski savollar o'chirildi");

    await TestQuestion.insertMany(questions);
    console.log(`${questions.length} ta savol seed qilindi`);

    const bySubj = {};
    questions.forEach(q => { bySubj[q.subject] = (bySubj[q.subject] || 0) + 1; });
    console.log('Statistika:', bySubj);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed xatosi:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { questions, seed };
