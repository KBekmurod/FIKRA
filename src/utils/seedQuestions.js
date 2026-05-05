// FIKRA — DTM 2025 namunaviy savollari
// Manba: DTM rasmiy testlari va akademik manbalar (2023-2024 yillar)
// Admin keyinchalik o'z testlarini qo'sha oladi

const TestQuestion = require('../models/TestQuestion');
const { logger } = require('./logger');

const QUESTIONS = [
  // ═══════════════════════════════════════════════════════════════════
  // ONA TILI VA ADABIYOT
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'uztil', block: 'majburiy', question: '"Sayhonlik" so\'zining ma\'nosi nima?', options: ['Tekis maydon', 'Bog\'-rog\'', 'Daryo bo\'yi', 'Tog\' yonbag\'ri'], answer: 0, explanation: 'Sayhonlik — kichik tekislik, daladir.' },
  { subject: 'uztil', block: 'majburiy', question: 'Quyidagi qaysi gapda ravish ishlatilgan?\n"O\'quvchilar ___ darsda qatnashdilar."', options: ['faol', 'yaxshi', 'tezda', 'aqlli'], answer: 2, explanation: '"Tezda" — ravish, harakatning belgisini bildiradi.' },
  { subject: 'uztil', block: 'majburiy', question: '"Bilim olish — nur olish" — bu qanday gap?', options: ['Sodda gap', 'Murakkab gap', 'Ergash gapli qo\'shma gap', 'Bog\'lovchili qo\'shma gap'], answer: 0, explanation: 'Sodda gap, ot kesim ifodalangan.' },
  { subject: 'uztil', block: 'majburiy', question: '"Otam ishlamoqda" gapidagi kesimning shakli qaysi?', options: ['Sodda', 'Tarkibli', 'Qo\'shma', 'Murakkab'], answer: 1, explanation: '"Ishlamoqda" — tarkibli kesim (yordamchi fe\'l + ravishdosh).' },
  { subject: 'uztil', block: 'majburiy', question: 'Bog\'lovchining qaysi turi quyida berilgan: "ammo, lekin, biroq"?', options: ['Teng bog\'lovchi', 'Ergashtiruvchi bog\'lovchi', 'Zidlov bog\'lovchi', 'Sabab bog\'lovchi'], answer: 2, explanation: 'Bu zidlov bog\'lovchilar — ikki gapni qarshi qo\'yadi.' },
  { subject: 'uztil', block: 'majburiy', question: 'Qaysi qatorda undov gap to\'g\'ri ko\'rsatilgan?', options: ['Bugun havo issiq.', 'Voy, qanday chiroyli!', 'Sen kelding-mi?', 'Kitob o\'qiyman.'], answer: 1, explanation: 'Undov gap his-tuyg\'uni ifodalaydi va undov belgisi bilan tugaydi.' },
  { subject: 'uztil', block: 'majburiy', question: 'Quyidagi qaysi so\'z fe\'l yasovchi qo\'shimcha?', options: ['-chi', '-lash', '-li', '-siz'], answer: 1, explanation: '-lash qo\'shimchasi otdan fe\'l yasaydi: ish-lash, gap-lash.' },
  { subject: 'uztil', block: 'majburiy', question: '"O\'tgan o\'tinga kuyilmas" maqolining ma\'nosi?', options: ['Eski narsa kerak emas', 'O\'tib ketgan ish uchun afsuslanmaslik kerak', 'O\'tin mahalliga sazovor', 'Yangi narsa qadrli'], answer: 1, explanation: 'Bu maqol — o\'tib ketgan voqeaga afsuslanmasdan kelajakka qarash kerakligini bildiradi.' },
  { subject: 'uztil', block: 'majburiy', question: 'Alisher Navoiyning "Xamsa" asariga necha doston kiradi?', options: ['3', '4', '5', '6'], answer: 2, explanation: '"Xamsa" — beshlik degani, 5 ta dostondan iborat.' },
  { subject: 'uztil', block: 'majburiy', question: '"Boburnoma" qaysi yillarda yozilgan?', options: ['1483-1530', '1494-1530', '1500-1545', '1525-1550'], answer: 1, explanation: 'Bobur 1494 yildan boshlab voqealarni yozib bordi va u 1530 yilda vafot etdi.' },
  { subject: 'uztil', block: 'majburiy', question: 'Cho\'lpon qaysi yillarda yashagan?', options: ['1893-1938', '1897-1938', '1900-1937', '1885-1940'], answer: 1, explanation: 'Abdulhamid Cho\'lpon 1897-1938 yillarda yashagan, 1938 yil qatag\'on qurboni bo\'lgan.' },
  { subject: 'uztil', block: 'majburiy', question: '"Mehrobdan chayon" romani muallifi kim?', options: ['Abdulla Qodiriy', 'Abdulla Qahhor', 'Cho\'lpon', 'Hamid Olimjon'], answer: 0, explanation: 'Abdulla Qodiriy 1928 yilda bu romanni yozgan.' },
  { subject: 'uztil', block: 'majburiy', question: 'Alisher Navoiy qancha yil yashagan?', options: ['58 yil', '60 yil', '64 yil', '69 yil'], answer: 0, explanation: 'Navoiy 1441-1501 (60 yil), aniq hisobda 60 yil yashagan, lekin yoshi 58 ham deyiladi (yangi oy hisobida).' },
  { subject: 'uztil', block: 'majburiy', question: 'Quyidagi so\'zlardan qaysi biri o\'zlashgan emas?', options: ['Direktor', 'Daftar', 'Maktab', 'Kitob'], answer: 1, explanation: 'Daftar fors-tojikdan kelgan, lekin uzoq tarixga ega va o\'zbekcha kabi keng tarqalgan. Boshqalar arabchadan.' },
  { subject: 'uztil', block: 'majburiy', question: '"Iztirob" so\'zining sinonimi qaysi?', options: ['Quvonch', 'Kayfiyat', 'Azob', 'Tinchlik'], answer: 2, explanation: 'Iztirob — qattiq qiynalish, azoblanish.' },

  // ═══════════════════════════════════════════════════════════════════
  // MATEMATIKA
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'math', block: 'majburiy', question: '2x + 5 = 15 tenglamadagi x ning qiymati?', options: ['3', '5', '7', '10'], answer: 1, explanation: '2x = 10 → x = 5' },
  { subject: 'math', block: 'majburiy', question: 'log₂(8) ning qiymati nimaga teng?', options: ['2', '3', '4', '8'], answer: 1, explanation: '2³ = 8 bo\'lgani uchun log₂(8) = 3' },
  { subject: 'math', block: 'majburiy', question: '√144 + √81 = ?', options: ['19', '20', '21', '23'], answer: 2, explanation: '12 + 9 = 21' },
  { subject: 'math', block: 'majburiy', question: 'sin(30°) qiymati?', options: ['1/2', '√2/2', '√3/2', '1'], answer: 0, explanation: 'sin(30°) = 1/2' },
  { subject: 'math', block: 'majburiy', question: '5! (5 faktorial) ning qiymati?', options: ['25', '60', '120', '720'], answer: 2, explanation: '5! = 5×4×3×2×1 = 120' },
  { subject: 'math', block: 'majburiy', question: '(x+3)² formulasi qanday yoyiladi?', options: ['x² + 9', 'x² + 6x + 9', 'x² + 3x + 9', 'x² + 6'], answer: 1, explanation: '(a+b)² = a² + 2ab + b² → x² + 6x + 9' },
  { subject: 'math', block: 'majburiy', question: 'Doiraning yuzasi formulasi qaysi? (r — radius)', options: ['πr', '2πr', 'πr²', 'πd'], answer: 2, explanation: 'Doira yuzi = πr²' },
  { subject: 'math', block: 'majburiy', question: '|−7| + |3| = ?', options: ['−10', '−4', '4', '10'], answer: 3, explanation: '|−7| = 7, |3| = 3, 7+3 = 10' },
  { subject: 'math', block: 'majburiy', question: '3x − 2 < 7 tengsizlikning yechimi qaysi?', options: ['x < 3', 'x > 3', 'x < 5', 'x > 5'], answer: 0, explanation: '3x < 9 → x < 3' },
  { subject: 'math', block: 'majburiy', question: 'Arifmetik progressiyaning 1-hadi 3, ayirmasi 4. 5-hadi nimaga teng?', options: ['15', '17', '19', '23'], answer: 2, explanation: 'aₙ = a₁ + (n-1)d → a₅ = 3 + 4·4 = 19' },
  { subject: 'math', block: 'majburiy', question: 'Geometrik progressiya: 2, 6, 18, ... 5-hadi qancha?', options: ['54', '108', '162', '216'], answer: 2, explanation: 'b₅ = 2·3⁴ = 2·81 = 162' },
  { subject: 'math', block: 'majburiy', question: 'cos²(x) + sin²(x) = ?', options: ['0', '1', 'x', '2'], answer: 1, explanation: 'Bu trigonometriyaning asosiy ayniyati: har doim 1 ga teng.' },
  { subject: 'math', block: 'majburiy', question: 'lim(x→0) sin(x)/x = ?', options: ['0', '1', '∞', 'aniqlanmagan'], answer: 1, explanation: 'Bu birinchi ajoyib limit, qiymati 1.' },
  { subject: 'math', block: 'majburiy', question: 'f(x) = x² ning hosilasi?', options: ['x', '2x', 'x³/3', '2x²'], answer: 1, explanation: '(xⁿ)\' = n·xⁿ⁻¹ → 2x' },
  { subject: 'math', block: 'majburiy', question: '(2x − 1)(x + 3) = 0 tenglamaning ildizlari?', options: ['x=1, x=3', 'x=1/2, x=-3', 'x=-1/2, x=3', 'x=2, x=3'], answer: 1, explanation: '2x-1=0 → x=1/2; x+3=0 → x=-3' },
  { subject: 'math', block: 'majburiy', question: '2³ · 2⁴ = ?', options: ['2⁷', '2¹²', '4⁷', '2⁶'], answer: 0, explanation: 'Bir xil asosli darajalarni ko\'paytirganda darajalar qo\'shiladi: 2³⁺⁴ = 2⁷' },
  { subject: 'math', block: 'majburiy', question: 'Uchburchakning ichki burchaklari yig\'indisi necha gradus?', options: ['90°', '180°', '270°', '360°'], answer: 1, explanation: 'Har qanday uchburchak burchaklari yig\'indisi 180°.' },
  { subject: 'math', block: 'majburiy', question: 'O\'rtacha arifmetik: 4, 8, 12, 16, 20 = ?', options: ['10', '12', '14', '16'], answer: 1, explanation: '(4+8+12+16+20)/5 = 60/5 = 12' },

  // ═══════════════════════════════════════════════════════════════════
  // O'ZBEKISTON TARIXI
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'tarix', block: 'majburiy', question: 'O\'zbekiston Respublikasi qachon mustaqillikni e\'lon qildi?', options: ['1990-yil 20-iyun', '1991-yil 31-avgust', '1991-yil 1-sentabr', '1992-yil 8-dekabr'], answer: 1, explanation: '1991-yil 31-avgust kuni Oliy Kengash O\'zbekistonning mustaqilligini e\'lon qildi.' },
  { subject: 'tarix', block: 'majburiy', question: 'Konstitutsiya qaysi yili qabul qilingan?', options: ['1991', '1992', '1993', '1995'], answer: 1, explanation: '1992-yil 8-dekabr kuni O\'zbekiston Konstitutsiyasi qabul qilindi.' },
  { subject: 'tarix', block: 'majburiy', question: 'Amir Temurning poytaxti qaysi shahar edi?', options: ['Buxoro', 'Samarqand', 'Toshkent', 'Termiz'], answer: 1, explanation: 'Amir Temur Samarqandni o\'z saltanati poytaxtiga aylantirgan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Ulug\'bek qaysi yillarda hukmronlik qilgan?', options: ['1394-1449', '1409-1449', '1411-1449', '1420-1455'], answer: 1, explanation: 'Mirzo Ulug\'bek 1409-1449 yillarda hukmronlik qilgan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Buyuk ipak yo\'li qaysi davlatlarni bog\'lagan?', options: ['Hindiston-Yevropa', 'Xitoy-Yevropa', 'Eron-Arabiston', 'Misr-Hindiston'], answer: 1, explanation: 'Buyuk ipak yo\'li Xitoyni Yevropaga bog\'lagan asosiy savdo yo\'li edi.' },
  { subject: 'tarix', block: 'majburiy', question: 'Beruniy qaysi shaharda tug\'ilgan?', options: ['Buxoro', 'Samarqand', 'Kat (Xorazm)', 'Termiz'], answer: 2, explanation: 'Abu Rayhon Beruniy 973-yilda Xorazmning Kat shahrida tug\'ilgan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Al-Xorazmiy qaysi fan asoschisi hisoblanadi?', options: ['Geografiya', 'Algebra', 'Tibbiyot', 'Falsafa'], answer: 1, explanation: 'Al-Xorazmiy "Algebra" fanining asoschisi, "algoritm" so\'zi ham uning nomidan kelib chiqqan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Buxoro xonligi qachon tashkil topgan?', options: ['1500', '1501', '1505', '1599'], answer: 1, explanation: 'Shayboniylar sulolasi 1501 yilda Buxoro xonligini tashkil etgan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Qaysi yili Toshkent Rossiya tomonidan bosib olingan?', options: ['1860', '1865', '1868', '1873'], answer: 1, explanation: '1865-yil 17-iyunda General Chernyaev Toshkentni bosib oldi.' },
  { subject: 'tarix', block: 'majburiy', question: 'Jadidchilik harakati qachon boshlangan?', options: ['XVIII asr oxiri', 'XIX asr oxiri', 'XX asr boshi', 'XX asr o\'rtasi'], answer: 1, explanation: 'Jadidchilik XIX asr oxiri — XX asr boshlarida vujudga kelgan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Mahmudxo\'ja Behbudiy qaysi shaharda yashagan?', options: ['Toshkent', 'Buxoro', 'Samarqand', 'Qo\'qon'], answer: 2, explanation: 'Behbudiy Samarqandda yashab ijod qilgan, jadidchilik harakatining yetakchisi.' },
  { subject: 'tarix', block: 'majburiy', question: 'O\'zbekiston SSR qachon tashkil topgan?', options: ['1922', '1924', '1925', '1929'], answer: 1, explanation: '1924-yil 27-oktabr kuni milliy chegaralanish natijasida tashkil topgan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Birinchi Prezident Islom Karimov qachon saylangan?', options: ['1990', '1991', '1992', '1995'], answer: 0, explanation: 'I.Karimov 1990-yil 24-mart kuni O\'zSSR Prezidenti etib saylangan.' },
  { subject: 'tarix', block: 'majburiy', question: 'Mustaqillik shaharchasi qayerda joylashgan?', options: ['Toshkent', 'Samarqand', 'Buxoro', 'Andijon'], answer: 0, explanation: 'Toshkent shahrida joylashgan, mustaqillik ramzi.' },
  { subject: 'tarix', block: 'majburiy', question: 'Ibn Sino qaysi shaharda tug\'ilgan?', options: ['Buxoro yaqinida (Afshana)', 'Samarqand', 'Termiz', 'Marv'], answer: 0, explanation: 'Abu Ali Ibn Sino 980-yilda Buxoro yaqinidagi Afshana qishlog\'ida tug\'ilgan.' },

  // ═══════════════════════════════════════════════════════════════════
  // BIOLOGIYA
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'bio', block: 'mutaxassislik', question: 'Hujayraning energetik markazi qaysi organoid?', options: ['Yadro', 'Mitoxondriya', 'Ribosoma', 'Lizosoma'], answer: 1, explanation: 'Mitoxondriya ATF (energiya) hosil qiladi, "hujayra elektrostantsiyasi" deb ataladi.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Fotosintez qayerda sodir bo\'ladi?', options: ['Mitoxondriyada', 'Yadroda', 'Xloroplastda', 'Ribosomada'], answer: 2, explanation: 'Xloroplastlarda xlorofill yordamida fotosintez amalga oshadi.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Inson qonida nechta xromosoma bor?', options: ['23', '46', '47', '92'], answer: 1, explanation: 'Inson somatik hujayrasida 46 ta (23 juft) xromosoma bor.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'DNK molekulasi qaysi monomerlardan tashkil topgan?', options: ['Aminokislotalar', 'Nukleotidlar', 'Glukoza', 'Yog\' kislotalari'], answer: 1, explanation: 'DNK 4 xil nukleotid (A, T, G, C) dan tashkil topgan.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Insonda nechta tish bor (kattalarda)?', options: ['28', '30', '32', '34'], answer: 2, explanation: 'Kattalarda 32 ta tish (8 ta — har sektorda 4 ta sektor: kesuv, qoziq, kichik, katta tish).' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Yurakning necha kamerasi bor?', options: ['2', '3', '4', '5'], answer: 2, explanation: 'Inson yuragi 4 kamerali: 2 bo\'lma + 2 qorincha.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Eng katta hujayra organoidi qaysi?', options: ['Mitoxondriya', 'Yadro', 'Ribosoma', 'Vakuol'], answer: 1, explanation: 'Yadro odatda hujayradagi eng katta organoid, irsiy axborotni saqlaydi.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Ko\'k yashil suvo\'tlari qaysi domenga kiradi?', options: ['Eukariot', 'Prokariot', 'Arxey', 'Virus'], answer: 1, explanation: 'Sianobakteriyalar (ko\'k yashil suvo\'tlar) prokariotlar — yadrosi yo\'q.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Insulin gormoni qayerda ishlab chiqariladi?', options: ['Buyrak usti bezi', 'Me\'da osti bezi', 'Qalqonsimon bez', 'Gipofiz'], answer: 1, explanation: 'Insulin oshqozon osti bezining beta-hujayralarida ishlab chiqariladi.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Eritrotsitlarning asosiy funksiyasi nima?', options: ['Immunitet', 'Kislorod tashish', 'Qon ivishi', 'Gormon ishlab chiqarish'], answer: 1, explanation: 'Eritrotsitlar (qizil qon hujayralari) gemoglobin orqali kislorod tashiydi.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Charlz Darvin qaysi nazariyaning asoschisi?', options: ['Genetika', 'Evolutsiya', 'Hujayra', 'Mutatsiya'], answer: 1, explanation: 'Darvin tabiiy tanlanish orqali evolutsiya nazariyasini yaratgan.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Ribosomalarning vazifasi nima?', options: ['Energiya hosil qilish', 'Oqsil sintezi', 'Yog\' parchalash', 'DNK saqlash'], answer: 1, explanation: 'Ribosomalarda mRNK matritsasiga ko\'ra oqsil sintezi sodir bo\'ladi.' },
  { subject: 'bio', block: 'mutaxassislik', question: 'Inson tanasidagi eng uzun nerv qaysi?', options: ['Ko\'rish nervi', 'Quloq nervi', 'O\'troq (sciatic) nerv', 'Yuz nervi'], answer: 2, explanation: 'O\'troq nerv (n. ischiadicus) — bel-dumg\'azadan to\'piqqacha boruvchi eng uzun nerv.' },

  // ═══════════════════════════════════════════════════════════════════
  // KIMYO
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Suv (H₂O) molekulasidagi atomlar soni?', options: ['2', '3', '4', '5'], answer: 1, explanation: 'H₂O da 2 ta vodorod va 1 ta kislorod = jami 3 atom.' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Eng yengil gaz qaysi?', options: ['Geliy', 'Vodorod', 'Azot', 'Kislorod'], answer: 1, explanation: 'Vodorod (H₂) — eng yengil gaz, atom og\'irligi 1.' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Mendeleyev davriy jadvalida nechta davr bor?', options: ['5', '6', '7', '8'], answer: 2, explanation: 'Davriy jadvalda 7 ta davr (period) bor.' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Elektronning zaryadi qanday?', options: ['Musbat', 'Manfiy', 'Neytral', 'O\'zgaruvchi'], answer: 1, explanation: 'Elektron — manfiy zaryadli zarra (-1).' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'NaCl qanday bog\'ga ega?', options: ['Kovalent', 'Ionli', 'Metalli', 'Vodorod'], answer: 1, explanation: 'Na va Cl orasida ionli bog\' (metalldan elektron metallmas tomonga o\'tadi).' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Eng aktiv metall qaysi?', options: ['Natriy', 'Kaliy', 'Litiy', 'Seziy'], answer: 3, explanation: 'I guruh elementlarida aktivlik pastga qarab oshadi: Cs eng aktivi.' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'pH = 7 ning ma\'nosi?', options: ['Kislotali', 'Ishqoriy', 'Neytral', 'Aralash'], answer: 2, explanation: 'pH 7 — neytral muhit (sof suv).' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'CH₄ — bu qanday modda?', options: ['Etan', 'Metan', 'Propan', 'Etilen'], answer: 1, explanation: 'CH₄ — metan, eng oddiy uglevodorod.' },
  { subject: 'kimyo', block: 'mutaxassislik', question: '1 mol moddada nechta zarra bor (Avogadro soni)?', options: ['6.02·10²²', '6.02·10²³', '6.02·10²⁴', '3.14·10²³'], answer: 1, explanation: 'Avogadro soni: NA = 6.02·10²³ mol⁻¹' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Kislorodning atom raqami?', options: ['6', '7', '8', '9'], answer: 2, explanation: 'O — 8-element, atom raqami 8.' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Karbonat angidridning formulasi?', options: ['CO', 'CO₂', 'C₂O', 'CO₃'], answer: 1, explanation: 'Karbonat angidrid CO₂ — odam nafas chiqarganda chiqadi.' },
  { subject: 'kimyo', block: 'mutaxassislik', question: 'Glukoza formulasi?', options: ['C₆H₁₂O₆', 'C₂H₅OH', 'CH₃OH', 'C₆H₆'], answer: 0, explanation: 'Glukoza — eng oddiy monosaxarid: C₆H₁₂O₆' },

  // ═══════════════════════════════════════════════════════════════════
  // FIZIKA
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'fizika', block: 'mutaxassislik', question: 'Yorug\'lik tezligi vakuumda?', options: ['3·10⁵ km/s', '3·10⁸ m/s', '3·10⁶ m/s', '3·10¹⁰ m/s'], answer: 1, explanation: 'c = 3·10⁸ m/s = 300,000 km/s.' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Erkin tushish tezlanishi (Yer yuzasida)?', options: ['9.8 m/s²', '10 km/s', '6.67 N', '299,792 km/s'], answer: 0, explanation: 'g ≈ 9.8 m/s² (taxminan 10).' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Nyutonning II qonuni: F = ?', options: ['ma', 'm/a', 'm·v', 'mgh'], answer: 0, explanation: 'F = m·a (kuch = massa × tezlanish).' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Kinetik energiya formulasi?', options: ['mgh', 'mv²/2', 'F·s', 'q·U'], answer: 1, explanation: 'Eₖ = mv²/2' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Om qonuni: U = ?', options: ['I·R', 'I/R', 'I·R²', 'I+R'], answer: 0, explanation: 'U = I·R (kuchlanish = tok × qarshilik).' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Quvvat formulasi?', options: ['P = E/t', 'P = F·s', 'P = m·g', 'P = U·t'], answer: 0, explanation: 'P = E/t (energiya / vaqt) yoki P = U·I' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Suvning zichligi?', options: ['1000 g/cm³', '1 g/cm³', '1 kg/m³', '100 g/cm³'], answer: 1, explanation: 'ρ = 1 g/cm³ = 1000 kg/m³' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Atom yadrosi qaysi zarralardan iborat?', options: ['Proton va elektron', 'Proton va neytron', 'Neytron va elektron', 'Faqat protonlar'], answer: 1, explanation: 'Yadro — proton va neytrondan iborat (nukleonlar).' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Tovush tezligi havoda taxminan?', options: ['340 m/s', '3·10⁸ m/s', '1500 m/s', '100 m/s'], answer: 0, explanation: 'Havoda 340 m/s (suvda 1500 m/s).' },
  { subject: 'fizika', block: 'mutaxassislik', question: 'Magnit maydonning birligi?', options: ['Tesla', 'Joul', 'Vatt', 'Pascal'], answer: 0, explanation: 'Magnit induksiyasi B — Tesla (T) bilan o\'lchanadi.' },

  // ═══════════════════════════════════════════════════════════════════
  // INGLIZ TILI
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Choose the correct form: "She ___ a teacher."', options: ['am', 'is', 'are', 'be'], answer: 1, explanation: 'She — uchinchi shaxs birlikda "is" ishlatamiz.' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Past tense of "go" is:', options: ['goed', 'gone', 'went', 'going'], answer: 2, explanation: 'go (V1) → went (V2) → gone (V3)' },
  { subject: 'ingliz', block: 'mutaxassislik', question: '"I ___ to school every day."', options: ['go', 'goes', 'going', 'gone'], answer: 0, explanation: 'Present Simple birinchi shaxsda "go".' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Choose: "There ___ many books on the table."', options: ['is', 'are', 'am', 'be'], answer: 1, explanation: 'Many books — ko\'plik, "are" kerak.' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Antonym of "happy":', options: ['joyful', 'sad', 'glad', 'merry'], answer: 1, explanation: 'happy ↔ sad (qarshi ma\'nodagi so\'z).' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Present continuous: "She ___ a book now."', options: ['read', 'reads', 'is reading', 'reading'], answer: 2, explanation: 'Present Continuous: am/is/are + V-ing' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Comparative form of "good":', options: ['gooder', 'better', 'best', 'more good'], answer: 1, explanation: 'good — better — best (irregular).' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Choose the correct article: "I bought ___ apple."', options: ['a', 'an', 'the', 'no article'], answer: 1, explanation: '"apple" unli tovush bilan boshlanadi → "an" kerak.' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Plural of "child":', options: ['childs', 'childen', 'children', 'childes'], answer: 2, explanation: 'child — children (irregular plural).' },
  { subject: 'ingliz', block: 'mutaxassislik', question: 'Future Simple: "I ___ visit my grandma tomorrow."', options: ['will', 'shall', 'going to', 'all are correct'], answer: 3, explanation: 'Will, shall, going to — barchasi to\'g\'ri (formal/informal).' },

  // ═══════════════════════════════════════════════════════════════════
  // INFORMATIKA
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'inform', block: 'mutaxassislik', question: '1 KB necha bayt?', options: ['100', '1000', '1024', '8192'], answer: 2, explanation: '1 KB = 1024 bayt (2¹⁰).' },
  { subject: 'inform', block: 'mutaxassislik', question: 'CPU qanday qismdan iborat?', options: ['Faqat ALU', 'ALU + CU + ro\'yxatlar', 'Faqat xotira', 'Disk + RAM'], answer: 1, explanation: 'CPU — ALU (arifmetik), CU (boshqaruv), ro\'yxatlar (registr).' },
  { subject: 'inform', block: 'mutaxassislik', question: 'HTML qaysi til turi?', options: ['Dasturlash', 'Belgilash (markup)', 'Skript', 'Ma\'lumotlar bazasi'], answer: 1, explanation: 'HTML — markup language, sahifa tuzilmasini belgilaydi.' },
  { subject: 'inform', block: 'mutaxassislik', question: 'IP-manzil necha qismdan iborat (IPv4)?', options: ['2', '4', '6', '8'], answer: 1, explanation: 'IPv4 — 4 ta sondan iborat (192.168.1.1 ko\'rinishida).' },
  { subject: 'inform', block: 'mutaxassislik', question: 'Operatsion tizim misoli:', options: ['Word', 'Windows', 'Photoshop', 'Chrome'], answer: 1, explanation: 'Windows — OS. Boshqalari — application.' },
  { subject: 'inform', block: 'mutaxassislik', question: '255 sonining ikkilik tasviri?', options: ['10000000', '11111111', '11110000', '00111111'], answer: 1, explanation: '255 = 2⁸ - 1 = 11111111₂' },
  { subject: 'inform', block: 'mutaxassislik', question: 'SQL — bu qanday til?', options: ['Dasturlash', 'Ma\'lumotlar bazasi', 'Belgilash', 'Skript'], answer: 1, explanation: 'SQL — Structured Query Language, ma\'lumotlar bazasi tili.' },
  { subject: 'inform', block: 'mutaxassislik', question: 'Algoritm xossasi qaysi emas?', options: ['Aniqlik', 'Diskretlik', 'Tushunarsizlik', 'Natijaviylik'], answer: 2, explanation: 'Algoritm har doim tushunarli bo\'lishi shart.' },

  // ═══════════════════════════════════════════════════════════════════
  // IQTISODIYOT
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'YAIM (GDP) — bu nima?', options: ['Mamlakatdagi jami pul', 'Yalpi ichki mahsulot', 'Yaroqsiz import', 'Foydaning ichki mavqei'], answer: 1, explanation: 'YAIM — Yalpi Ichki Mahsulot (mamlakat ichida bir yilda yaratilgan tovar va xizmatlar qiymati).' },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Inflatsiya — bu...', options: ['Pulning qadrsizlanishi', 'Pul qiymatining oshishi', 'Daromad oshishi', 'Bekorchilik'], answer: 0, explanation: 'Inflatsiya — narxlarning oshishi va pulning sotib olish qobiliyati pasayishi.' },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Ekonomikadagi 4 ta ishlab chiqarish omili qaysi?', options: ['Ish, mehnat, fan, dam', 'Yer, mehnat, kapital, tadbirkorlik', 'Pul, oziq-ovqat, vaqt, ish', 'Yer, suv, havo, olov'], answer: 1, explanation: '4 ta klassik omil: yer, mehnat, kapital, tadbirkorlik.' },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Talab qonuni nima deydi?', options: ['Narx oshsa, talab oshadi', 'Narx oshsa, talab kamayadi', 'Talab har doim teng', 'Narxga bog\'liq emas'], answer: 1, explanation: 'Talab qonuni: narx oshsa, talab kamayadi (boshqa shartlar teng bo\'lganda).' },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'O\'zbekiston Markaziy banki qachon tashkil topgan?', options: ['1991', '1992', '1995', '1996'], answer: 0, explanation: 'O\'zbekiston Markaziy banki 1991-yilda tashkil topgan.' },

  // ═══════════════════════════════════════════════════════════════════
  // IQTISODIYOT (qoshimcha — jami 30 ta bolsin)
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Monopoliya deb nimaga aytiladi?', options: ["Ko'p sotuvchi bozori", 'Bitta sotuvchi bozori', 'Ikki xaridor bozori', 'Erkin bozor'], answer: 1, explanation: "Monopoliya — bozorda faqat bitta sotuvchi bo'lgan holat." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Soliq bu nima?', options: ["Ixtiyoriy to'lov", "Majburiy davlat to'lovi", 'Bank foizi', 'Subsidiya'], answer: 1, explanation: "Soliq — fuqarolar va tashkilotlardan davlat byudjetiga majburiy to'lov." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Bozor iqtisodiyotida narxlarni kim belgilaydi?", options: ['Davlat', 'Talab va taklif', 'Prezident', 'Bank'], answer: 1, explanation: "Bozor iqtisodiyotida narxlar talab va taklif kuchlarining o'zaro ta'siri orqali shakllanadi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Byudjet defitsiti nima?', options: ["Daromad xarajatdan ko'p", "Xarajat daromaddan ko'p", 'Muvozanatli byudjet', "Soliq yig'ish"], answer: 1, explanation: "Byudjet defitsiti — davlat xarajatlarining daromadlardan oshib ketishi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Eksport bu...', options: ['Xorijdan tovar olib kelish', "Chett elga tovar chiqarish", 'Ichki savdo', 'Import boji'], answer: 1, explanation: "Eksport — mamlakatdan chet elga tovar va xizmatlar chiqarish." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Foiz stavkasi oshsa, kredit olish...", options: ['Arzonlashadi', 'Qimmatlashadi', "O'zgarmaydi", "Bekor bo'ladi"], answer: 1, explanation: "Foiz stavkasi oshganda kredit qimmatlashadi va talab kamayadi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Raqobat bozorida firmalar qanday foyda oladi?", options: ['Monopol foyda', 'Normal foyda', 'Subsidiya', 'Soliq imtiyozi'], answer: 1, explanation: "Raqobat bozorida uzoq muddatda firmalar normal (minimal) foyda oladi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Mehnat unumdorligi nima?', options: ['Ishchilar soni', 'Birlik vaqtda ishlab chiqarish', 'Ish haqi', 'Ishsizlik'], answer: 1, explanation: "Mehnat unumdorligi — birlik vaqt ichida ishchi tomonidan yaratilgan mahsulot miqdori." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "O'zbekistonda qanday iqtisodiy tizim joriy etilgan?", options: ["Bozor iqtisodiyoti", "Rejalashtirilgan iqtisodiyot", "An'anaviy iqtisodiyot", "Aralash iqtisodiyot"], answer: 3, explanation: "O'zbekistonda bozor va davlat aralash iqtisodiy tizimi joriy etilgan." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Import kvotasi nima?', options: ["Eksport solig'i", 'Import miqdori cheklovi', 'Valyuta kursi', 'Boj stavkasi'], answer: 1, explanation: "Import kvotasi — chetdan olib kiriladigan tovar miqdoriga qo'yiladigan chegara." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Ishsizlik turlari ichida tsiklik ishsizlik nima?", options: ["Mavsumiy ishsizlik", "Iqtisodiy tushkunlikdan kelib chiqqan", "Kasb o'zgarishi", "Texnologik o'zgarish"], answer: 1, explanation: "Tsiklik ishsizlik iqtisodiy inqiroz yoki tushkunlik davrida yuzaga keladi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Valuta kursi nima?', options: ['Tovar narxi', "Bir valyutaning boshqasiga nisbati", 'Bank foizi', 'Eksport miqdori'], answer: 1, explanation: "Valuta kursi — bir mamlakatning pul birligi boshqa pul birligiga nisbati." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Subsidiya nima maqsadda beriladi?', options: ["Soliq yig'ish uchun", "Ishlab chiqarishni qo'llab-quvvatlash", 'Import cheklash', 'Monopoliyani himoya qilish'], answer: 1, explanation: "Subsidiya — davlatning tarmoq yoki korxonani qo'llab-quvvatlash maqsadida beriladigan moliyaviy yordam." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Iqtisodiyotda o'sish deganda nima tushuniladi?", options: ["Narxlar oshishi", "YaIM oshishi", "Ishchilar ko'payishi", "Import oshishi"], answer: 1, explanation: "Iqtisodiy o'sish — yalpi ichki mahsulot (YaIM) real hajmining oshishi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Kapital bu...', options: ["Faqat pul mablag'lari", "Ishlab chiqarish vositalarining barchasi", 'Yer resurslari', 'Mehnat resurslari'], answer: 1, explanation: "Kapital — ishlab chiqarishda ishlatiladigan texnika, qurilmalar, binolar va pul mablag'lari." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Erkin bozor deganda nimani tushunasiz?', options: ["Davlat nazoratidagi bozor", "Raqobat va talab-taklif boshqaradigan bozor", "Faqat davlat korxonalari", "Subsidiyalangan bozor"], answer: 1, explanation: "Erkin bozor — davlat aralashuvisiz talab va taklif kuchlarining erkin harakat qiladigan tizimi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "O'zbekistonda QQS stavkasi necha foiz?", options: ['10%', '12%', '15%', '20%'], answer: 2, explanation: "2024-yildan O'zbekistonda QQS stavkasi 15% qilib belgilangan." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Inflyatsiyaning asosiy sababi nima?", options: ["Tovarlar ko'pligi", "Muomaladagi pul ko'pligi", "Eksport pasayishi", "Soliq ko'payishi"], answer: 1, explanation: "Inflyatsiyaning asosiy sabablaridan biri — muomaladagi pul massasining tovar va xizmatlar miqdoridan oshib ketishi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Qaysi tashkilot Markaziy banklar bilan hamkorlik qiladi?", options: ['BMT', 'XVF (IMF)', 'NATO', 'OPEK'], answer: 1, explanation: "Xalqaro Valyuta Fondi (XVF/IMF) mamlakat markaziy banklari bilan hamkorlik qiladi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Xususiylashtirish bu...', options: ["Davlat mulkini oshirish", "Davlat mulkini xususiylarga o'tkazish", 'Milliylashtirish', "Soliq yig'ish"], answer: 1, explanation: "Xususiylashtirish — davlat korxona va mulklarini xususiy sektarga o'tkazish jarayoni." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Makroiqtisodiyot nimani o'rganadi?", options: ['Alohida firma', 'Butun iqtisodiyot', "Iste'molchi xulqi", 'Tovar narxi'], answer: 1, explanation: "Makroiqtisodiyot — milliy iqtisodiyotni yaxlit: YaIM, inflatsiya, ishsizlik darajasini o'rganadi." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Oligopoliya bozori qanday bozor?", options: ["Ko'p sotuvchi", "Bir necha yirik sotuvchi", "Bitta xaridor", "Bitta sotuvchi"], answer: 1, explanation: "Oligopoliya — bozorda bir necha yirik firmalar ustunlik qiladigan raqobat shakli." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Ochiq iqtisodiyot deganda nima tushuniladi?", options: ['Bepul tovarlar', "Xalqaro savdoga ochiq iqtisodiyot", 'Soliqsiz tizim', 'Davlat boshqaruvi'], answer: 1, explanation: "Ochiq iqtisodiyot — xalqaro savdo va kapital oqimlariga cheklovsiz faoliyat yuritadigan tizim." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: 'Investitsiya bu...', options: ["Iste'mol xarajatlari", "Kelajakdagi foyda uchun bugungi xarajat", "Soliq to'lash", 'Import haridlari'], answer: 1, explanation: "Investitsiya — kelajakda daromad yoki foyda olish maqsadida qilingan bugungi xarajat." },
  { subject: 'iqtisod', block: 'mutaxassislik', question: "Qaysi omil mehnat bozoriga ta'sir etmaydi?", options: ['Ish haqi darajasi', 'Kasb talabi', 'Ob-havo', 'Malaka darajasi'], answer: 2, explanation: "Ob-havo mehnat bozoriga bevosita ta'sir etmaydi; ish haqi, malaka va talablar ta'sir qiladi." },

  // ═══════════════════════════════════════════════════════════════════
  // RUS TILI (30 savol)
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoy padezh otvechaet na voprosy "kogo? chego?"?', options: ['Imenitelnyy', 'Roditelnyy', 'Datelnyy', 'Vinitelnyy'], answer: 1, explanation: 'Roditelnyy padezh otvechaet na voprosy "kogo? chego?".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Skolko padezhey v russkom yazyke?', options: ['4', '5', '6', '7'], answer: 2, explanation: 'V russkom yazyke 6 padezhey: imenitelnyy, roditelnyy, datelnyy, vinitelnyy, tvoritelnyy, predlozhnyy.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoe slovo yavlyaetsya sushchestvitelnym?', options: ['Begat', 'Krasivyy', 'Derevo', 'Bystro'], answer: 2, explanation: '"Derevo" — eto imya sushchestvitelnoe, ono otvechaet na vopros "chto?".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe sinonim?', options: ['Slovo s protivopolozhnym znacheniem', 'Slovo s odinakovym znacheniem', 'Ustarevshee slovo', 'Inostrannoe slovo'], answer: 1, explanation: 'Sinonimy — slova s odinakovym ili blizkim znacheniem.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'A.S. Pushkin napisal roman v stikhakh...', options: ['Voyna i mir', 'Evgeniy Onegin', 'Mertvye dushi', 'Prestuplenie i nakazanie'], answer: 1, explanation: '"Evgeniy Onegin" — roman v stikhakh, napisannyy A.S. Pushkinym (1823-1831).' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoe iz slov yavlyaetsya prilagatelnymom?', options: ['Bezhat', 'Siniy', 'Dom', 'Ochen'], answer: 1, explanation: '"Siniy" — imya prilagatelnoe, oboznachaet priznak predmeta.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto izuchaet fonetika?', options: ['Slova', 'Zvuki rechi', 'Predlozheniya', 'Morfemy'], answer: 1, explanation: 'Fonetika — razdel yazykoznaniya, izuchayushchiy zvuki rechi.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Naydite glagol sredi slov:', options: ['Krasota', 'Chitat', 'Veselyy', 'Tikho'], answer: 1, explanation: '"Chitat" — glagol, otvechaet na vopros "chto delat?".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoe predlozhenie yavlyaetsya voprositelnym?', options: ['Idet dozhd.', 'Kakaya pogoda segodnya?', 'Zaykroy dver!', 'Solntse svetit yarko.'], answer: 1, explanation: 'Vopros. predlozhenie soderzhit vopros i zakanchivaetsya znakom "?".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Antonim slova "bolshoy"?', options: ['Ogromnyy', 'Vysokiy', 'Malenkiy', 'Shirokiy'], answer: 2, explanation: '"Malenkiy" — antonim slova "bolshoy".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Skolko bukv v russkom alfavite?', options: ['30', '32', '33', '35'], answer: 2, explanation: 'V russkom alfavite 33 bukvy.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoe slovo yavlyaetsya narechiem?', options: ['Bystryy', 'Bezhat', 'Bystro', 'Skorost'], answer: 2, explanation: '"Bystro" — narechie, otvechaet na vopros "kak?".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe metafora?', options: ['Pryamoe sravnenie', 'Skrytoe sravnenie', 'Povtorenie slov', 'Protivopostavlenie'], answer: 1, explanation: 'Metafora — skrytoe sravnenie, perenos znacheniya po skhodstvu bez slov "kak" ili "slovno".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kto napisal "Voynu i mir"?', options: ['Dostoyevskiy', 'Tolstoy', 'Chekhov', 'Turgenev'], answer: 1, explanation: '"Voyna i mir" — roman-epopeya Lva Nikolaevicha Tolstogo (1869).' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoy znak prepinaniya stavitsya v kontse povestvovatel. predlozheniya?', options: ['?', '!', '.', ','], answer: 2, explanation: 'V kontse povestvovatel. predlozheniya stavitsya tochka.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe dialog?', options: ['Rech odnogo cheloveka', 'Razgovor dvukh ili bolee lyudey', 'Opisanie prirody', 'Vnutrenniy monolog'], answer: 1, explanation: 'Dialog — razgovor mezhdu dvumya i bolee lyudmi.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoy koren v slove "podsnezhhnik"?', options: ['-pod-', '-snezh-', '-podsnezh-', '-nik-'], answer: 1, explanation: 'Koren slova "podsnezhhnik" — -snezh- (sneg).' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe epitet?', options: ['Sravnenie', 'Khudozhestv. opredelenie', 'Povtorenie', 'Antonim'], answer: 1, explanation: 'Epitet — obraznoe khudozhestvennoe opredelenie, pridayushchee vyrazitelnost opisaniyu.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoe iz slov pishetsy s zaglavnoy bukvoy?', options: ['gorod', 'moskva', 'strana', 'reka'], answer: 1, explanation: '"Moskva" — imya sobstvennoe (nazvanie goroda), pishetsy s zaglavnoy bukvoy.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Skolko glasnykh bukv v russkom yazyke?', options: ['6', '8', '10', '12'], answer: 2, explanation: 'V russkom yazyke 10 glasnykh bukv: a, e, yo, i, o, u, y, e, yu, ya.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe prichastie?', options: ['Samost. chast rechi', 'Osobaya forma glagola so svoystvami prilagatelnogo', 'Narechie', 'Soyuz'], answer: 1, explanation: 'Prichastie — osobaya forma glagola, oboznachayushchaya priznak predmeta po deystviyu.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoy padezh otvechaet na vopros "komu? chemu?"?', options: ['Roditelnyy', 'Datelnyy', 'Vinitelnyy', 'Tvoritelnyy'], answer: 1, explanation: 'Datelnyy padezh otvechaet na voprosy "komu? chemu?".' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe antonim?', options: ['Slovo s pokhozhim znacheniem', 'Slovo s protivopolozhnym znacheniem', 'Ustarevshee slovo', 'Zaimstvovannoe slovo'], answer: 1, explanation: 'Antonimy — slova s protivopolozhnym znacheniem.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Kakoy zhanr literatury otnositsya k eposu?', options: ['Stikhotvorenie', 'Poema', 'Roman', 'Elegiya'], answer: 2, explanation: 'Roman — prozaicheskoe proizvedenie, prinadlezhashchee k epicheskomu rodu literatury.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Naskol ko slov yavlyaetsya glagoloform s prefiksom "pri-": ...', options: ['Pribezhat', 'Predmet', 'Prekrasnyy', 'Pristavka'], answer: 0, explanation: '"Pribezhat" soderzhit pristavku "pri-" (priblizhenie).' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe leksika?', options: ['Zvuki yazyka', 'Slovarnyy sostav yazyka', 'Stroenie predlozheniy', 'Morfemy'], answer: 1, explanation: 'Leksika — sovokupnost slov (slovarnyy sostav) yazyka.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Skolko spryazheniy u glagolov v russkom yazyke?', options: ['1', '2', '3', '4'], answer: 1, explanation: 'V russkom yazyke 2 spryazheniya glagolov.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto takoe odnorodnye chleny predlozheniya?', options: ['Podlezhashchee i skazuemoe', 'Slova, otvechayushchie na odin vopros i otnosyashchiesya k odnomu slovu', 'Obrashcheniya', 'Vvodnye slova'], answer: 1, explanation: 'Odnorodnye chleny — slova odnogo tipa, svyazannye odinakovym voprosom s odnim i tem zhe slovom.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Ukazhite mestoimenie:', options: ['Krasivyy', 'Begat', 'On', 'Sineva'], answer: 2, explanation: '"On" — lichnoe mestoimenie 3-go litsa edinstvennogo chisla.' },
  { subject: 'rus', block: 'mutaxassislik', question: 'Chto oboznachaet imya sushchestvitelnoe?', options: ['Deystvie', 'Priznak', 'Predmet', 'Kolichestvo'], answer: 2, explanation: 'Imya sushchestvitelnoe oboznachaet predmet i otvechaet na voprosy "kto? chto?".' },

  // ═══════════════════════════════════════════════════════════════════
  // GEOGRAFIYA (30 savol)
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'geo', block: 'mutaxassislik', question: "Dunyo okeanlarining eng kattasi qaysi?", options: ['Atlantika', 'Hind', 'Tinch', 'Shimoliy Muz'], answer: 2, explanation: "Tinch okeani — dunyo okeanlarining eng kattasi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Dunyodagi eng uzun daryo qaysi?", options: ['Amazon', 'Nil', 'Yangtze', 'Volga'], answer: 1, explanation: "Nil daryosi — uzunligi taxminan 6650 km bilan dunyodagi eng uzun daryo." },
  { subject: 'geo', block: 'mutaxassislik', question: "Dunyodagi eng baland tog' cho'qqisi?", options: ['K2', 'Everest', 'Mont Blank', 'Elbrus'], answer: 1, explanation: "Everest (Chomolungma) — 8848 m balandligi bilan dunyodagi eng baland cho'qqi." },
  { subject: 'geo', block: 'mutaxassislik', question: "O'zbekiston qaysi iqlim mintaqasida joylashgan?", options: ['Tropik', 'Subtropik', "Mo'tadil kontinental", 'Arktika'], answer: 2, explanation: "O'zbekiston mo'tadil kontinental iqlim mintaqasida joylashgan." },
  { subject: 'geo', block: 'mutaxassislik', question: "Dunyodagi eng katta cho'l qaysi?", options: ['Gobi', 'Sahara', 'Arabiston', 'Kalahari'], answer: 1, explanation: "Sahara cho'li — 9,2 mln km2 bilan eng katta cho'l." },
  { subject: 'geo', block: 'mutaxassislik', question: "O'zbekistonning eng baland nuqtasi qaysi?", options: ["Beshtor cho'qqisi", 'Xazratishoh', "Bobotog'", 'Chimyon'], answer: 0, explanation: "Beshtor cho'qqisi (4299 m) O'zbekistonning eng baland nuqtasidir." },
  { subject: 'geo', block: 'mutaxassislik', question: "Atmosferaning qaysi qatlami bizga eng yaqin?", options: ['Stratosfera', 'Troposfera', 'Mezosfera', 'Termosfera'], answer: 1, explanation: "Troposfera — atmosferaning Yer yuzasiga eng yaqin qatlami (0-12 km)." },
  { subject: 'geo', block: 'mutaxassislik', question: "O'zbekiston bilan chegaradosh bo'lmagan davlat qaysi?", options: ["Qozog'iston", 'Rossiya', "Afg'oniston", 'Tojikiston'], answer: 1, explanation: "Rossiya O'zbekiston bilan bevosita chegaradosh emas." },
  { subject: 'geo', block: 'mutaxassislik', question: "Orol dengizining kamayib ketishiga asosiy sabab?", options: ['Zilzila', "Suv havzalari buzilib ketishi", "Daryo suvlarini haddan ko'p sarflash", 'Iqlim isishi'], answer: 2, explanation: "Amudaryo va Sirdaryo suvlarini ko'p qismi sug'orish uchun sarflanishi sababli Orol quridi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Qaysi materikda aholi doimiy emas?", options: ['Afrika', 'Avstraliya', 'Antarktida', 'Janubiy Amerika'], answer: 2, explanation: "Antarktidada doimiy aholi yashamaydi, faqat ilmiy bazalar bor." },
  { subject: 'geo', block: 'mutaxassislik', question: "Yer qattiq qobig'i nima deb ataladi?", options: ['Mantiya', 'Litosfera', 'Biosfera', 'Gidrosfera'], answer: 1, explanation: "Litosfera — Yerning qattiq tashqi qobig'i, tektonik plitalardan iborat." },
  { subject: 'geo', block: 'mutaxassislik', question: "Dunyodagi eng katta ko'l qaysi?", options: ['Baykal', 'Kaspiy dengizi', 'Viktoriya', 'Superior'], answer: 1, explanation: "Kaspiy dengizi — maydoni 371,000 km2 bilan eng katta ko'l." },
  { subject: 'geo', block: 'mutaxassislik', question: "Ekvator qaysi koordinatada joylashgan?", options: ["90° shimoliy kenglik", "0° kenglik", "180° uzunlik", "45° janubiy kenglik"], answer: 1, explanation: "Ekvator 0° kenglikda joylashgan." },
  { subject: 'geo', block: 'mutaxassislik', question: "O'zbekistondagi eng katta daryo qaysi?", options: ['Zarafshon', 'Chirchiq', 'Amudaryo', 'Sirdaryo'], answer: 2, explanation: "Amudaryo — O'zbekiston hududidagi eng katta daryo." },
  { subject: 'geo', block: 'mutaxassislik', question: "Geografik kenglik nima?", options: ["Meridianlar orasidagi masofa", "Ekvatorgacha bo'lgan burchak masofasi", "Meridian bo'ylab masofa", "Dengiz sathidan balandlik"], answer: 1, explanation: "Geografik kenglik — nuqtaning ekvatorgacha bo'lgan burchak masofasi (0-90 daraja)." },
  { subject: 'geo', block: 'mutaxassislik', question: "Qaysi iqlim tipida yil bo'yi yomg'ir yog'adi?", options: ["Cho'l", 'Ekvatorial', 'Subtropik', 'Subarktik'], answer: 1, explanation: "Ekvatorial iqlimda yil bo'yi yuqori harorat va mol yog'in kuzatiladi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Yerning ichki tuzilishida markaziy qism nima deyiladi?", options: ['Mantiya', 'Yadro', 'Litosfera', 'Astenosfera'], answer: 1, explanation: "Yadro — Yerning eng ichki qismi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Vulqon otilishi qaysi hodisa?", options: ['Gidrologik', 'Geologik', 'Atmosfera', 'Biologik'], answer: 1, explanation: "Vulqon otilishi — Yer qobig'i ostidagi magmaning yuzaga chiqishi, geologik hodisa." },
  { subject: 'geo', block: 'mutaxassislik', question: "O'zbekistonning poytaxti qaysi shahar?", options: ['Samarqand', 'Buxoro', 'Toshkent', 'Namangan'], answer: 2, explanation: "Toshkent — O'zbekiston Respublikasining poytaxti." },
  { subject: 'geo', block: 'mutaxassislik', question: "Barometr nima o'lchaydi?", options: ['Harorat', 'Atmosfera bosimi', 'Shamol tezligi', 'Namlik'], answer: 1, explanation: "Barometr — atmosfera (havo) bosimini o'lchaydigan asbob." },
  { subject: 'geo', block: 'mutaxassislik', question: "Dengiz sathidan balandlik oshganda harorat qanday o'zgaradi?", options: ['Oshadi', "O'zgarmaydi", 'Pasayadi', 'Ikki barobar oshadi'], answer: 2, explanation: "Har 100 m balandlikka chiqganda harorat taxminan 0.6°C pasayadi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Sahara cho'li qaysi materikda joylashgan?", options: ['Osiyo', 'Amerika', 'Afrika', 'Avstraliya'], answer: 2, explanation: "Sahara cho'li Shimoliy Afrikada joylashgan." },
  { subject: 'geo', block: 'mutaxassislik', question: "Qaysi okean Rossiya va AQSh orasida joylashgan?", options: ['Atlantika', 'Hind', 'Tinch', 'Arktika'], answer: 2, explanation: "Tinch okeani Rossiyaning sharqida va AQSh (Alyaska)ning g'arbida joylashgan." },
  { subject: 'geo', block: 'mutaxassislik', question: "O'zbekistonda nechta asosiy ma'muriy birlik bor?", options: ['10', '12', '14', '16'], answer: 2, explanation: "O'zbekistonda 12 viloyat, Qoraqalpog'iston Respublikasi va Toshkent shahri — jami 14 ma'muriy birlik." },
  { subject: 'geo', block: 'mutaxassislik', question: "Zilzila kuchini qaysi shkala bilan o'lchanadi?", options: ['Boft shkalasi', 'Rihter shkalasi', 'Selsius shkalasi', 'Paskal shkalasi'], answer: 1, explanation: "Zilzila kuchi Rihter shkalasi bilan o'lchanadi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Fotosintez biosferada qaysi element aylanmasiga ta'sir ko'rsatadi?", options: ['Azot', 'Karbon', 'Fosfor', 'Oltingugurt'], answer: 1, explanation: "Fotosintez karbon dioksidini yutib, kislorod chiqaradi — karbon aylanmasining asosi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Dunyodagi eng chuqur ko'l qaysi?", options: ['Kaspiy', 'Viktoriya', 'Baykal', 'Tanganyika'], answer: 2, explanation: "Baykal ko'li — chuqurligi 1642 m bilan dunyodagi eng chuqur chuchuk suv ko'li." },
  { subject: 'geo', block: 'mutaxassislik', question: "Shamolning kelib chiqishiga asosiy sabab nima?", options: ["Yomg'ir", 'Bosim farqi', 'Harorat barabarligi', 'Okean oqimlari'], answer: 1, explanation: "Shamol — havo bosimidagi farq tufayli havoning harakati." },
  { subject: 'geo', block: 'mutaxassislik', question: "Qaysi zona Yer atmosferasini ultrabinafsha nurlardan himoya qiladi?", options: ['Troposfera', 'Stratosfera (ozon qatlami)', 'Mezosfera', 'Ionosfera'], answer: 1, explanation: "Stratosferadagi ozon qatlami Quyoshning ultrabinafsha nurlarini yutib, tirik organizmlarni himoya qiladi." },
  { subject: 'geo', block: 'mutaxassislik', question: "Qaysi meridian xalqaro sana o'tkazgich chizig'i hisoblanadi?", options: ["0° meridian", "90° meridian", "180° meridian", "45° meridian"], answer: 2, explanation: "180° meridian xalqaro sana o'tkazgich chizig'i deb ataladi." },

  // ═══════════════════════════════════════════════════════════════════
  // ADABIYOT (30 savol)
  // ═══════════════════════════════════════════════════════════════════
  { subject: 'adab', block: 'mutaxassislik', question: "Alisher Navoiy qaysi asarni yozgan?", options: ['Farhod va Shirin', 'Layli va Majnun', 'Ikkalasi ham', 'Hech birortasi emas'], answer: 2, explanation: "Alisher Navoiy Xamsa tarkibiga Farhod va Shirin va Layli va Majnun dostonlarini ham yozgan." },
  { subject: 'adab', block: 'mutaxassislik', question: '"O\'tkan kunlar" romanini kim yozgan?', options: ["Cho'lpon", 'Abdulla Qodiriy', 'Hamza', "G'afur G'ulom"], answer: 1, explanation: '"O\'tkan kunlar" (1925-1926) — Abdulla Qodiriyning mashhur tarixiy romani.' },
  { subject: 'adab', block: 'mutaxassislik', question: 'Ruboiy nima?', options: ['4 misrali she\'r shakli', 'Epik doston', 'Proza janri', 'Hajviy she\'r'], answer: 0, explanation: "Ruboiy — to'rt misradan iborat she'r shakli." },
  { subject: 'adab', block: 'mutaxassislik', question: 'Navoiy necha yil yashagan?', options: ['50', '55', '60', '62'], answer: 2, explanation: "Alisher Navoiy 1441-1501-yillarda yashagan, ya'ni 60 yil." },
  { subject: 'adab', block: 'mutaxassislik', question: '"Xamsa" necha dostondan iborat?', options: ['3', '4', '5', '7'], answer: 2, explanation: '"Xamsa" (Besh doston) — Navoiyning besh epik dostonini o\'z ichiga olgan.' },
  { subject: 'adab', block: 'mutaxassislik', question: "G'azalda qofiyalanish tartibi qanday?", options: ['aa, bb, cc', 'ab, ab, ab', 'aa, ba, ca, da', 'abc, abc'], answer: 2, explanation: "G'azalda birinchi misralar qofiyalanadi (aa), keyin har baytning ikkinchi misrasi ham shu qofiyaga (ba, ca, da...)." },
  { subject: 'adab', block: 'mutaxassislik', question: '"Devonu lug\'otit turk"ni kim yozgan?', options: ['Yusuf Xos Hojib', "Mahmud Koshg'ariy", 'Ahmad Yugnakiy', 'Al-Xorazmiy'], answer: 1, explanation: '"Devonu lug\'otit turk" — Mahmud Koshg\'ariy tomonidan 1072-1074-yillarda yozilgan qomusiy lug\'at.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Epik asarning asosiy belgisi qaysi?", options: ['Lirik kechinmalar', 'Muallif his-tuyg\'ulari', 'Voqeabandlik va hikoya qilish', 'Sahnalashtirilgan dialog'], answer: 2, explanation: "Epik asarning asosiy xususiyati — voqealarni hikoya tarzida bayon etish." },
  { subject: 'adab', block: 'mutaxassislik', question: "Cho'lponning to'liq ismi?", options: ['Hamza Hakimzoda', 'Abdulhamid Sulaymon o\'g\'li', "G'afur G'ulom", 'Abdulla Avloniy'], answer: 1, explanation: "Cho'lponning haqiqiy ismi Abdulhamid Sulaymon o'g'li (1897-1938)." },
  { subject: 'adab', block: 'mutaxassislik', question: "Badiiy adabiyotda kompozitsiya nima?", options: ["She'r o'lchovi", "Asarning tarkibiy qurilishi", "Muallif uslubi", "Til boyliklar"], answer: 1, explanation: "Kompozitsiya — badiiy asarning qismlari va voqealarining tartibli tuzilishi." },
  { subject: 'adab', block: 'mutaxassislik', question: '"Boburnoma"ni kim yozgan?', options: ['Navoiy', 'Zahiriddin Muhammad Bobur', "Ulug'bek", 'Husayn Boyqaro'], answer: 1, explanation: '"Boburnoma" — Zahiriddin Muhammad Boburning (1483-1530) avtobiografik asari.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Tragediya qaysi janrga kiradi?", options: ['Epik', 'Lirik', 'Dramatik', 'Publitsistik'], answer: 2, explanation: "Tragediya — dramatik janrning turi." },
  { subject: 'adab', block: 'mutaxassislik', question: "Abdulla Qodiriy qachon tug'ilgan?", options: ['1894', '1896', '1900', '1905'], answer: 0, explanation: "Abdulla Qodiriy 1894-yilda Toshkentda tug'ilgan." },
  { subject: 'adab', block: 'mutaxassislik', question: "Tazod (antiteza) nima?", options: ["O'xshashlik", "Qarama-qarshi tushunchalarni qo'yish", 'Takrorlash', "Mubolag'a"], answer: 1, explanation: "Tazod (antiteza) — qarama-qarshi tushuncha yoki hodisalarni yonma-yon keltirish usuli." },
  { subject: 'adab', block: 'mutaxassislik', question: '"Mehrobdan chayon" asarining muallifi kim?', options: ['Abdulla Qodiriy', "Cho'lpon", 'Abdulla Avloniy', 'Hamza'], answer: 0, explanation: '"Mehrobdan chayon" — Abdulla Qodiriyning 1929-yilda yozilgan romani.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Aruz vaznining asosiy belgisi?", options: ["Bo'g'in soni", "Urg'u o'rni", "Qisqa va cho'ziq bo'g'inlar", 'Qofiya'], answer: 2, explanation: "Aruz vazni qisqa va cho'ziq bo'g'inlarning navbatlashishiga asoslanadi." },
  { subject: 'adab', block: 'mutaxassislik', question: "G'afur G'ulom qaysi asari bilan mashhur?", options: ["O'tkan kunlar", 'Shum bola', 'Hayot va adabiyot', "Ko'hna dunyo"], answer: 1, explanation: '"Shum bola" — G\'afur G\'ulomning eng mashhur yumoristik qissasi.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Maqol va matal farqi nimada?", options: ["Farqi yo'q", "Maqol to'liq fikr, matal esa tugallanmagan qiyos", "Matal to'liq, maqol tugallanmagan", "Maqol she'r, matal nasr"], answer: 1, explanation: "Maqol — to'liq, mustaqil fikr; matal — solishtirish orqali ifodalangan tugallanmagan fikr." },
  { subject: 'adab', block: 'mutaxassislik', question: "Lirik she'rda markaziy unsur nima?", options: ['Voqea', 'Muallif his-kechinmalari', 'Dialog', 'Tavsif'], answer: 1, explanation: "Lirik she'rning markazida muallif (yoki lirik qahramon)ning his-tuyg'ulari turadi." },
  { subject: 'adab', block: 'mutaxassislik', question: '"Kutlug\' qon" romanini kim yozgan?', options: ['Oybek', 'Abdulla Qodiriy', 'Mirtemir', 'Maqsud Shayxzoda'], answer: 0, explanation: '"Kutlug\' qon" — Oybek (Musa Toshmatov)ning mashhur romani.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Dramatik asarda sahna ko'rsatmalari nima deyiladi?", options: ['Prolog', 'Remark', 'Epilog', 'Ekspozitsiya'], answer: 1, explanation: "Remark (sahna ko'rsatmasi) — dramatik asarda sahna holati haqidagi muallifning ko'rsatmalari." },
  { subject: 'adab', block: 'mutaxassislik', question: "Hamza Hakimzoda Niyoziy qanday faoliyat ko'rsatgan?", options: ['Faqat yozuvchi', "Shoir, dramaturq va ma'rifatchi", 'Siyosatchi', 'Olim'], answer: 1, explanation: "Hamza Hakimzoda Niyoziy (1889-1929) — shoir, dramaturq va ma'rifatparvar." },
  { subject: 'adab', block: 'mutaxassislik', question: "Sonet necha misradan iborat?", options: ['8', '10', '14', '16'], answer: 2, explanation: "Sonet — 14 misradan iborat she'r shakli (2 to'rtlik va 2 uchlik)." },
  { subject: 'adab', block: 'mutaxassislik', question: '"Alpomish" qaysi janrga mansub?', options: ['Roman', "Xalq qahramonlik eposi", "G'azal", 'Tragediya'], answer: 1, explanation: '"Alpomish" — o\'zbek xalqining ulkan qahramonlik dostoni.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Badiiy asarda syujet nima?", options: ['Muallif fikri', "Voqealar zanjiri va rivojlanishi", "She'r o'lchovi", "Qahramon tavsifi"], answer: 1, explanation: "Syujet — badiiy asardagi voqealarning ketma-ketligi va rivojlanish tartibi." },
  { subject: 'adab', block: 'mutaxassislik', question: "Navoiy asarlarida Lison ut-tayrning mavzusi nima?", options: ['Ishq va muhabbat', "Ruhiy kamolot va haqiqat izlash", 'Tarix', 'Tasavvuf fiqhi'], answer: 1, explanation: '"Lison ut-tayr" ("Qushlar tili") — ma\'naviy kamolot va haqiqatni izlash yo\'lidagi allegorik doston.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Yusuf Xos Hojib qanday asar yozgan?", options: ["Devonu lug'otit turk", "Qutadg'u bilig", 'Xamsa', 'Boburnoma'], answer: 1, explanation: '"Qutadg\'u bilig" — Yusuf Xos Hojibning XI asrda yozgan mashhur didaktik dostoni.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Adabiyotda motiv nima?", options: ['Asar nomi', "Asardagi takrorlanuvchi g'oya yoki obraz", 'Muallif biografiyasi', "She'r vazni"], answer: 1, explanation: "Motiv — adabiy asarda qayta-qayta uchraydigan mavzu, obraz yoki g'oyaviy unsur." },
  { subject: 'adab', block: 'mutaxassislik', question: '"Navoiy" romanini kim yozgan?', options: ['Abdulla Qodiriy', 'Oybek', "Cho'lpon", 'Hamid Olimjon'], answer: 1, explanation: '"Navoiy" romani — Oybek tomonidan 1944-yilda yozilgan tarixiy asar.' },
  { subject: 'adab', block: 'mutaxassislik', question: "Badiiy asarda portret nima?", options: ["Tabiat tasviri", "Qahramon tashqi ko'rinishi tasviri", "Voqea tasviri", "Dialog"], answer: 1, explanation: "Portret — badiiy asarda qahramonning tashqi ko'rinishini tasvirlash usuli." },
  { subject: 'adab', block: 'mutaxassislik', question: "Og'zaki xalq ijodiyotiga kirmaydigan janr qaysi?", options: ['Doston', 'Maqol', 'Roman', 'Ertak'], answer: 2, explanation: "Roman — yozma adabiyot janri, og'zaki xalq ijodiyotiga kirmaydi." }

];
const DTM = require('../config/dtm2026');

async function seedQuestions() {
  try {
<<<<<<< HEAD
    // Fan bo'yicha tekshiruv — agar biror fan savollari kam bo'lsa, faqat ularni qo'shadi
    const subjectCounts = await TestQuestion.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } }
    ]);
    const existingSubjects = new Set(subjectCounts.map(s => s._id));
    const totalCount = subjectCounts.reduce((s, x) => s + x.count, 0);

    if (totalCount === 0) {
      // Baza butunlay bo'sh — hammani bir vaqtda kiritamiz
      const result = await TestQuestion.insertMany(QUESTIONS, { ordered: false });
      logger.info(`✅ ${result.length} ta savol yuklandi`);
      return;
    }

    // Mavjud bo'lmagan fanlarga tegishli savollarni qo'shamiz
    const missingQ = QUESTIONS.filter(q => !existingSubjects.has(q.subject));
    if (missingQ.length > 0) {
      const result = await TestQuestion.insertMany(missingQ, { ordered: false });
      logger.info(`✅ ${result.length} ta yangi savol qo'shildi (${[...new Set(missingQ.map(q => q.subject))].join(', ')})`);
    } else {
      logger.info(`Savollar bazada bor: ${totalCount} ta. Hamma fanlar mavjud.`);
=======
    const totalCount = await TestQuestion.countDocuments();
    if (totalCount === 0) {
      const result = await TestQuestion.insertMany(QUESTIONS, { ordered: false });
      logger.info(`✅ ${result.length} ta DTM 2025 namunaviy savol yuklandi`);
      return;
    }

    logger.info(`Bazada allaqachon ${totalCount} ta savol mavjud. Tekshirilmoqda...`);

    // Add any completely missing sample questions from QUESTIONS (new subjects)
    const subjectCounts = await TestQuestion.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } }
    ]);
    const existingSubjects = new Set(subjectCounts.map(s => s._id));

    const missingQ = QUESTIONS.filter(q => !existingSubjects.has(q.subject));
    if (missingQ.length > 0) {
      await TestQuestion.insertMany(missingQ, { ordered: false });
      logger.info(`✅ ${missingQ.length} ta yangi namunaviy savol qo'shildi (${[...new Set(missingQ.map(q => q.subject))].join(', ')})`);
    }

    // Ensure per-subject minimum counts (mandatory:10, specialty:30)
    let addedDummyCount = 0;
    for (const subject of DTM.allSubjects) {
      const count = await TestQuestion.countDocuments({ subject: subject.id });
      const required = subject.type === 'mandatory' ? 10 : 30;

      if (count < required) {
        const missing = required - count;
        const dummyQuestions = [];
        for (let i = 0; i < missing; i++) {
          dummyQuestions.push({
            subject: subject.id,
            block: subject.type === 'mandatory' ? 'majburiy' : 'mutaxassislik',
            question: `[NAMUNA] ${subject.name} fani bo'yicha avtomatik qo'shilgan savol #${i + 1}`,
            options: ['A variant', 'B variant', 'C variant', 'D variant'],
            answer: 0,
            difficulty: 'easy'
          });
        }
        await TestQuestion.insertMany(dummyQuestions);
        addedDummyCount += missing;
        logger.info(`➕ ${subject.name} fanidan ${missing} ta namuna savol qo'shildi.`);
      }
    }

    if (addedDummyCount > 0) {
      logger.info(`🚀 Jami ${addedDummyCount} ta namuna savol bazaga kiritildi.`);
    } else {
      logger.info(`✅ Barcha fanlar bo'yicha yetarlicha savollar mavjud (Majburiy: 10+, Mutaxassislik: 30+).`);
    }

    // Har bir fan bo'yicha talab etilgan testlar borligini tekshirish
    let addedDummyCount = 0;
    for (const subject of DTM.allSubjects) {
      const count = await TestQuestion.countDocuments({ subject: subject.id });
      const required = subject.type === 'mandatory' ? 10 : 30;

      if (count < required) {
        const missing = required - count;
        const dummyQuestions = [];
        let currentCount = count + 1;
        for (let i = 0; i < missing; i++) {
          dummyQuestions.push({
            subject: subject.id,
            block: subject.type === 'mandatory' ? 'majburiy' : 'mutaxassislik',
            question: `[NAMUNA] ${subject.name} fani bo'yicha ${currentCount + i}-test savoli (tizim tomonidan avtomatik qo'shilgan)`,
            options: ['A variant', 'B variant', 'C variant', 'D variant'],
            answer: 0,
            difficulty: 'easy'
          });
        }
        await TestQuestion.insertMany(dummyQuestions);
        addedDummyCount += missing;
        logger.info(`➕ ${subject.name} fanidan ${missing} ta namuna savol qo'shildi.`);
      }
    }

    if (addedDummyCount > 0) {
      logger.info(`🚀 Jami ${addedDummyCount} ta namuna savol bazaga kiritildi, imtihon ishlash uchun yetarli.`);
    } else {
      logger.info(`✅ Barcha fanlar bo'yicha yetarlicha savollar mavjud (Majburiy: 10+, Mutaxassislik: 30+).`);
>>>>>>> 066d90f (add test)
    }
  } catch (err) {
    logger.error('Seed xato:', err.message);
  }
}

module.exports = { seedQuestions, QUESTIONS };

// Standalone ishga tushirish: node src/utils/seedQuestions.js
if (require.main === module) {
  require('dotenv').config();
  const { connectDB } = require('./db');
  connectDB().then(async () => {
    await seedQuestions();
    process.exit(0);
  });
}
