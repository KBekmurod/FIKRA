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
];

async function seedQuestions() {
  try {
    const count = await TestQuestion.countDocuments();
    if (count > 0) {
      logger.info(`Savollar bazada bor: ${count} ta. Seed o'tkazib yuborildi.`);
      return;
    }

    const result = await TestQuestion.insertMany(QUESTIONS, { ordered: false });
    logger.info(`✅ ${result.length} ta DTM 2025 namunaviy savol yuklandi`);
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
