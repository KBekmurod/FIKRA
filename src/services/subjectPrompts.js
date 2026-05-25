// ─── Fan bo'yicha maxsus AI prompt ko'rsatmalari ─────────────────────────
// Har fan o'ziga xos uslubda test savol yaratish uchun.
// Bu foydalanuvchiga ko'rinmaydi — backend AI prompt'iga qo'shiladi.

const SUBJECT_PROMPTS = {
  // ─── MAJBURIY FANLAR ───────────────────────────────────────────────────
  majburiy_onatili: `Ona tili (o'zbek tili) uchun maxsus:
  • Grammatika qoidalari (so'z turkumlari, gap tuzilishi, ohangdoshlik)
  • Imlo va punktuatsiya (qo'shimchalar, bog'lovchilar)
  • Lug'at — sinonim, antonim, omonim
  • Frazeologizmlar va maqollar mavzularidan ham
  • Savollar O'zbekiston Respublikasi DTM standart formatida
  • Variantlarda mantiqiy chalkash javoblar (jiddiy o'xshashlik)`,

  onatili: `Ona tili (o'zbek tili) uchun maxsus:
  • Grammatika qoidalari (so'z turkumlari, gap tuzilishi, ohangdoshlik)
  • Imlo va punktuatsiya (qo'shimchalar, bog'lovchilar)
  • Lug'at — sinonim, antonim, omonim
  • Frazeologizmlar va maqollar mavzularidan ham
  • Savollar O'zbekiston Respublikasi DTM standart formatida
  • Variantlarda mantiqiy chalkash javoblar (jiddiy o'xshashlik)`,

  majburiy_math: `Matematika uchun maxsus:
  • Algebraik tenglamalar, tengsizliklar, funksiyalar
  • Geometriya (planimetriya, stereometriya)
  • Trigonometriya, logaritmalar, ko'rsatkichli ifodalar
  • Statistika va ehtimollar
  • FORMULALARNI LaTeX format'da yoz: $x^2 + 2x + 1$, $\\frac{a}{b}$, $\\sqrt{x}$
  • Hisoblash savollari aniq raqamli javobga ega bo'lsin
  • Variantlardagi noto'g'ri javoblar — odatda foydalanuvchi qiladigan xatolar`,

  math: `Matematika uchun maxsus:
  • Algebraik tenglamalar, tengsizliklar, funksiyalar
  • Geometriya (planimetriya, stereometriya)
  • Trigonometriya, logaritmalar, ko'rsatkichli ifodalar
  • Statistika va ehtimollar
  • FORMULALARNI LaTeX format'da yoz: $x^2 + 2x + 1$, $\\frac{a}{b}$, $\\sqrt{x}$
  • Hisoblash savollari aniq raqamli javobga ega bo'lsin
  • Variantlardagi noto'g'ri javoblar — odatda foydalanuvchi qiladigan xatolar`,

  majburiy_tarix: `Tarix uchun maxsus:
  • Aniq sanalar (yil, qism), tarixiy hodisalar
  • Tarixiy shaxslar va ularning rollari
  • Mavzular: davlat birlashmalari, urushlar, madaniyat, iqtisod
  • Sabab-natija va xulosa savollari
  • Material kontekstiga to'liq mos kelsin (jahon yoki O'zb. tarix)
  • Variantlar bir-biriga juda yaqin (faqat sana yoki shaxs farqi)`,

  tarix: `Tarix uchun maxsus:
  • Aniq sanalar (yil, qism), tarixiy hodisalar
  • Tarixiy shaxslar va ularning rollari
  • Mavzular: davlat birlashmalari, urushlar, madaniyat, iqtisod
  • Sabab-natija va xulosa savollari
  • Material kontekstiga to'liq mos kelsin (jahon yoki O'zb. tarix)
  • Variantlar bir-biriga juda yaqin (faqat sana yoki shaxs farqi)`,

  // ─── ANIQ VA TABIIY FANLAR ─────────────────────────────────────────────
  fizika: `Fizika uchun maxsus:
  • Mexanika, elektr, optika, atom fizikasi
  • SI birliklari aniq ko'rsatilsin (m, s, kg, N, J, V, A)
  • Formulalarni LaTeX'da: $F = ma$, $E = mc^2$, $v = \\frac{s}{t}$
  • Real hayotiy misollar va hisoblash savollari
  • Grafiklar haqidagi savollarda tushuntirish aniq bo'lsin
  • Vektor va skalyar miqdorlarni farqlash savollari`,

  kimyo: `Kimyo uchun maxsus:
  • Davriy sistema (D.I. Mendeleyev), elementlar xossalari
  • Kimyoviy reaksiyalar va ularning turlari (oksidlanish-qaytarilish)
  • Anorganik va organik birikmalar
  • Kimyoviy formulalar: H₂O, CO₂, NaCl, C₆H₁₂O₆ (subscript shaklida)
  • Reaksiya tenglamalarini balanslash savollari
  • Konsentratsiya, molyarlik kabi hisoblashlar`,

  bio: `Biologiya uchun maxsus:
  • Tirik organizmlar tuzilishi (hujayra, to'qima, organ)
  • Genetika va irsiyat (DNK, gen, allel, mendel qonunlari)
  • Ekologiya, evolyutsiya, mikrobiologiya
  • Botanika va zoologiya (klassifikatsiya, sistematika)
  • Inson anatomiyasi va fiziologiyasi
  • Lotincha terminlardan ham foydalan (qisqartirilgan)`,

  geo: `Geografiya uchun maxsus:
  • Fizik geografiya (relyef, iqlim, suv resurslari, tabiat zonalari)
  • Iqtisodiy geografiya (aholi, sanoat, qishloq xo'jaligi)
  • Kartografiya, koordinatalar (kenglik, uzunlik)
  • O'zbekiston va jahon davlatlari
  • Materiklar, okeanlar, daryolar
  • Soat mintaqalari va vaqt farqlari`,

  // ─── GUMANITAR FANLAR ───────────────────────────────────────────────────
  adab: `Ona tili va adabiyoti uchun maxsus:
  • O'zbek mumtoz va zamonaviy adabiyoti
  • Mualliflar, asarlar, qahramonlar, syujetlar
  • Adabiy tahlil (g'oya, badiiy uslub, til xususiyatlari)
  • She'riy va nasriy janrlar (g'azal, doston, qissa, hikoya)
  • Tarixiy adabiyot va folklor namunalari
  • Adabiyotshunoslik atamalari (metafora, alliteratsiya, simvol)`,

  huquq: `Davlat va huquq asoslari uchun maxsus:
  • O'zbekiston Respublikasi Konstitutsiyasi
  • Davlat organlari va hokimiyat tarmoqlari
  • Fuqarolik, jinoyat, mehnat huquqi asoslari
  • Inson huquqlari va erkinliklari
  • Huquqshunoslikning asosiy atamalari
  • Qonunchilik tizimi va sud tartibi`,

  // ─── CHET TILLARI ───────────────────────────────────────────────────────
  ingliz: `Ingliz tili uchun maxsus:
  • Grammar (tenses, conditionals, modals, passive voice)
  • Vocabulary (synonyms, antonyms, phrasal verbs, idioms)
  • Reading comprehension va matn tahlili
  • Savol va variantlar ingliz tilida bo'lsin, lekin tahlil o'zbekcha
  • DTM darajasi: B1-B2 darajadagi savollar
  • Iboralar va so'z birikmalari (collocations)`,

  nemis: `Nemis tili uchun maxsus:
  • Deutsche Grammatik (Artikel, Kasus, Verbkonjugation)
  • Vocabulary va idiomatic expressions
  • Lese- und Hörverstehen mavzularidan
  • A2-B1 daraja
  • Savol va variantlar nemis tilida bo'lsin
  • Tushuntirish o'zbekcha bo'ladi`,

  fransuz: `Fransuz tili uchun maxsus:
  • Grammaire française (temps verbaux, accord, articles)
  • Vocabulary va expressions idiomatiques
  • A2-B1 daraja
  • Savol va variantlar fransuz tilida
  • Tushuntirish o'zbekcha`,

  arab: `Arab tili uchun maxsus:
  • Arab tili grammatikasi (sarf va nahv)
  • Klassik va zamonaviy arab tili
  • Fonetika va morfologiya
  • Qur'oniy va adabiy lug'at
  • Savol va variantlar arab yozuvi va transliteratsiya bilan
  • Tushuntirish o'zbekcha`,

  fors: `Fors tili uchun maxsus:
  • Fors tili grammatikasi va lug'ati
  • Klassik fors-tojik adabiyoti
  • Hozirgi fors tili (Eron, Tojikiston)
  • Savol va variantlar fors yozuvida va transliteratsiya bilan
  • Tushuntirish o'zbekcha`,

  turk: `Turk tili uchun maxsus:
  • Türkçe dilbilgisi (zaman, çekim, sözcük türleri)
  • Vocabulary va deyimler
  • A2-B1 daraja
  • Savol va variantlar turk tilida (lotin yozuvi)
  • Tushuntirish o'zbekcha`,

  // ─── BOSHQA FANLAR ──────────────────────────────────────────────────────
  rus: `Rus tili uchun maxsus:
  • Грамматика (склонение, спряжение, виды глагола)
  • Lug'at va frazeologiya
  • Savol va variantlar rus tilida (kirill)
  • Tushuntirish o'zbekcha bo'ladi
  • A2-B1 daraja`,

  inform: `Informatika uchun maxsus:
  • Algoritm va dasturlash asoslari (Python, C++, JavaScript)
  • Ma'lumotlar tuzilmalari va algoritmlar
  • Tarmoq va Internet, kompyuter arxitekturasi
  • Sonlar sistemalari (binar, oktal, geksadetsimal)
  • Mantiqiy operatsiyalar (AND, OR, NOT)
  • Kod parchalari bo'lganda code-block format`,

  iqtisod: `Iqtisodiyot uchun maxsus:
  • Mikro va makroiqtisodiyot asoslari
  • Talab va taklif, narx mexanizmi
  • Bank tizimi, valyuta, investitsiya
  • O'zbekiston iqtisodiy rivojlanish strategiyasi
  • Hisoblashga oid savollar (foiz, daromad, foyda)
  • Atamalar: GDP, inflyatsiya, retsessiya`,
};

// ─── Helper: prompt qaytaradi (yoki bo'sh string) ─────────────────────────
function getSubjectPrompt(subjectId) {
  return SUBJECT_PROMPTS[subjectId] || '';
}

module.exports = {
  SUBJECT_PROMPTS,
  getSubjectPrompt,
};
