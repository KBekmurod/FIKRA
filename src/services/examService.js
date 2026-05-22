const ExamSession  = require('../models/ExamSession');
const UserAnswer   = require('../models/UserAnswer');
const TestQuestion = require('../models/TestQuestion');
const mongoose     = require('mongoose');

// ─── DTM 2026 Konfiguratsiya ─────────────────────────────────────────────────
const COMPULSORY_SUBJECTS = [
  { id: 'uztil',  name: "Ona tili",          weight: 1.1, count: 10, block: 'majburiy' },
  { id: 'math',   name: "Matematika",         weight: 1.1, count: 10, block: 'majburiy' },
  { id: 'tarix',  name: "O'zbekiston tarixi", weight: 1.1, count: 10, block: 'majburiy' },
];

const SUBJECT_META = {
  // Majburiy fanlar
  uztil:   { name: "Ona tili",          weight: 1.1, block: 'majburiy',        defaultCount: 10 },
  math:    { name: "Matematika",         weight: 1.1, block: 'majburiy',        defaultCount: 10 },
  tarix:   { name: "O'zbekiston tarixi", weight: 1.1, block: 'majburiy',        defaultCount: 10 },

  // Aniq va tabiiy fanlar
  fizika:  { name: "Fizika",             weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },
  kimyo:   { name: "Kimyo",              weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  bio:     { name: "Biologiya",          weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },
  geo:     { name: "Geografiya",         weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },

  // Gumanitar fanlar
  adab:    { name: "Ona tili va adabiyoti", weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  huquq:   { name: "Davlat va huquq",    weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },

  // Chet tillari
  ingliz:  { name: "Ingliz tili",        weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  nemis:   { name: "Nemis tili",         weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  fransuz: { name: "Fransuz tili",       weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  arab:    { name: "Arab tili",          weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  fors:    { name: "Fors tili",          weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  turk:    { name: "Turk tili",          weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },

  // Boshqalar (DTM da bor)
  rus:     { name: "Rus tili",           weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  inform:  { name: "Informatika",        weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },
  iqtisod: { name: "Iqtisodiyot",        weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
};

// ─── DTM yo'nalishlari (frontend BlokTestSetupPage bilan moslashtirilgan) ──
// Har yo'nalishda 2 ta mutaxassislik fani bo'ladi:
//   spec[0] — 3.1 ball (asosiy, ko'proq vazn)
//   spec[1] — 2.1 ball yoki 3.1 ball (qo'shimcha)
// 6 ta yangi mutaxassislik fani (huquq, nemis, fransuz, arab, fors, turk)
// uchun ham yo'nalishlar qo'shildi
const DIRECTION_MAP = {
  // Frontend ID'lar
  engineering:    { name: "Muhandislik · Texnologiya",  spec: ['math',    'fizika' ] },
  medicine:       { name: "Tibbiyot · Q-xo'jaligi",     spec: ['bio',     'kimyo'  ] },
  international:  { name: "Xalqaro · Turizm",           spec: ['tarix',   'ingliz' ] },
  philology:      { name: "Filologiya",                 spec: ['adab',    'ingliz' ] },
  economy:        { name: "Iqtisod · IT",               spec: ['math',    'ingliz' ] },
  geodesy:        { name: "Geodeziya · Kadastr",        spec: ['tarix',   'geo'    ] },

  // Qo'shimcha yo'nalishlar (6 yangi fan uchun)
  law:            { name: "Huquq · Davlat boshqaruvi",  spec: ['huquq',   'tarix'  ] },
  german_studies: { name: "Nemis tili va madaniyati",   spec: ['nemis',   'adab'   ] },
  french_studies: { name: "Fransuz tili va madaniyati", spec: ['fransuz', 'adab'   ] },
  arabic_studies: { name: "Arab tili va sharqshunoslik",spec: ['arab',    'tarix'  ] },
  persian_studies:{ name: "Fors tili va adabiyoti",     spec: ['fors',    'adab'   ] },
  turkish_studies:{ name: "Turk tili va madaniyati",    spec: ['turk',    'tarix'  ] },

  // Eski nomlar — backward compatibility uchun
  tibbiyot:       { name: "Tibbiyot",                   spec: ['bio',     'kimyo'  ] },
  it:             { name: "IT / Dasturlash",            spec: ['inform',  'fizika' ] },
  iqtisodiyot:    { name: "Iqtisodiyot",                spec: ['iqtisod', 'ingliz' ] },
  pedagogika:     { name: "Pedagogika",                 spec: ['ingliz',  'rus'    ] },
  arxitektura:    { name: "Arxitektura",                spec: ['fizika',  'rus'    ] },
  jurnalistika:   { name: "Jurnalistika",               spec: ['ingliz',  'rus'    ] },
  rus_filologiya: { name: "Rus filologiyasi",           spec: ['rus',     'ingliz' ] },
  kimyo_fan:      { name: "Kimyo fani",                 spec: ['kimyo',   'bio'    ] },
  fizika_fan:     { name: "Fizika fani",                spec: ['fizika',  'kimyo'  ] },
  ingliz_filol:   { name: "Ingliz filologiyasi",        spec: ['ingliz',  'inform' ] },
  biologiya_fan:  { name: "Biologiya fani",             spec: ['bio',     'kimyo'  ] },
};

function assertObjectId(val, label) {
  if (!mongoose.Types.ObjectId.isValid(val)) {
    throw new Error(`Yaroqsiz ${label}`);
  }
}

async function fetchRandom(subjectId, count) {
  const q = await TestQuestion.aggregate([
    { $match: { subject: subjectId } },
    { $sample: { size: count } },
  ]);
  return q;
}

// ─── 1. DTM sessiyasi boshlash ─────────────────────────────────────────────
async function startDtmSession(userId, direction) {
  assertObjectId(userId, 'userId');

  let dirInfo = DIRECTION_MAP[direction.toLowerCase()];

  // ─── custom_spec1_spec2 — frontend FreeTestSetupPage'dan keladi ──────
  // Foydalanuvchi 2 ta spec fanini tanlasa, frontend `custom_${id1}_${id2}` yuboradi.
  // Backend dinamik yo'nalish yaratadi.
  if (!dirInfo && direction.toLowerCase().startsWith('custom_')) {
    const parts = direction.toLowerCase().slice(7).split('_');
    if (parts.length === 2) {
      const [s1, s2] = parts;
      if (SUBJECT_META[s1] && SUBJECT_META[s2]) {
        dirInfo = {
          name: `Erkin tanlov · ${SUBJECT_META[s1].name} + ${SUBJECT_META[s2].name}`,
          spec: [s1, s2],
        };
      }
    }
  }

  if (!dirInfo) {
    const supported = Object.keys(DIRECTION_MAP).join(', ');
    throw new Error(`Noma'lum yo'nalish: "${direction}". Qo'llab-quvvatlanadigan: ${supported}`);
  }

  const [spec1Id, spec2Id] = dirInfo.spec;
  const spec1Meta = SUBJECT_META[spec1Id];
  const spec2Meta = SUBJECT_META[spec2Id];

  const compQuestions = (
    await Promise.all(COMPULSORY_SUBJECTS.map(s => fetchRandom(s.id, s.count)))
  ).flat();

  const spec1Questions = await fetchRandom(spec1Id, 30);
  const spec2Questions = await fetchRandom(spec2Id, 30);

  const allQ = [...compQuestions, ...spec1Questions, ...spec2Questions];

  if (allQ.length === 0) {
    throw new Error("Bazada savollar yo'q. Admin paneldan seed yoki import qiling.");
  }

  const questionIds = allQ.map(q => q._id);

  const subjectBreakdown = [
    ...COMPULSORY_SUBJECTS.map(s => ({
      subjectId: s.id, subjectName: s.name,
      block: 'majburiy', weight: s.weight,
      questionCount: s.count, correct: 0, wrong: 0,
      score: 0, maxScore: parseFloat((s.count * s.weight).toFixed(2)),
    })),
    {
      subjectId: spec1Id, subjectName: spec1Meta.name,
      block: 'mutaxassislik_1', weight: 3.1,
      questionCount: 30, correct: 0, wrong: 0,
      score: 0, maxScore: parseFloat((30 * 3.1).toFixed(2)),
    },
    {
      subjectId: spec2Id, subjectName: spec2Meta.name,
      block: 'mutaxassislik_2', weight: 2.1,
      questionCount: 30, correct: 0, wrong: 0,
      score: 0, maxScore: parseFloat((30 * 2.1).toFixed(2)),
    },
  ];

  const maxTotalScore = subjectBreakdown.reduce((s, x) => s + x.maxScore, 0);

  const session = await ExamSession.create({
    userId,
    mode: 'dtm',
    direction: direction.toLowerCase(),
    selectedSubjects: [spec1Id, spec2Id, 'uztil', 'math', 'tarix'],
    questionIds,
    durationSeconds: 10800,
    status: 'in_progress',
    startTime: new Date(),
    subjectBreakdown,
    maxTotalScore: parseFloat(maxTotalScore.toFixed(2)),
  });

  const safeQuestions = allQ.map(q => ({
    _id:        q._id,
    subject:    q.subject,
    block:      getBlock(q.subject, direction.toLowerCase()),
    question:   q.question,
    options:    q.options,
    difficulty: q.difficulty,
    topic:      q.topic,
  }));

  return { session, questions: safeQuestions, directionName: dirInfo.name };
}

function getBlock(subjectId, direction) {
  if (['uztil', 'math', 'tarix'].includes(subjectId)) return 'majburiy';
  const dir = DIRECTION_MAP[direction];
  if (!dir) return 'mutaxassislik_1';
  if (dir.spec[0] === subjectId) return 'mutaxassislik_1';
  if (dir.spec[1] === subjectId) return 'mutaxassislik_2';
  return 'mutaxassislik_1';
}

// ─── 2. Alohida fanlar sessiyasi boshlash ──────────────────────────────────
async function startSubjectSession(userId, subjects, advanced = {}) {
  assertObjectId(userId, 'userId');
  if (!subjects || subjects.length === 0) throw new Error('Kamida 1 ta fan tanlang');

  const subjectBreakdown = [];
  const allQ = [];

  for (const subId of subjects) {
    const meta = SUBJECT_META[subId];
    if (!meta) throw new Error(`Noma'lum fan: "${subId}"`);

    const count = (advanced.questionCounts && advanced.questionCounts[subId])
      ? Math.min(Math.max(parseInt(advanced.questionCounts[subId]) || meta.defaultCount, 1), 50)
      : meta.defaultCount;

    const questions = await fetchRandom(subId, count);
    allQ.push(...questions);

    const maxScore = parseFloat((count * meta.weight).toFixed(2));
    subjectBreakdown.push({
      subjectId: subId, subjectName: meta.name,
      block: 'subject', weight: meta.weight,
      questionCount: count, correct: 0, wrong: 0,
      score: 0, maxScore,
    });
  }

  if (allQ.length === 0) {
    throw new Error("Tanlangan fanlar bo'yicha bazada savollar yo'q.");
  }

  const questionIds = allQ.map(q => q._id);
  const maxTotalScore = parseFloat(
    subjectBreakdown.reduce((s, x) => s + x.maxScore, 0).toFixed(2)
  );

  const totalQ = allQ.length;
  const durationSeconds = advanced.durationSeconds
    ? parseInt(advanced.durationSeconds)
    : totalQ * 120;

  const session = await ExamSession.create({
    userId,
    mode: 'subject',
    direction: null,
    selectedSubjects: subjects,
    questionIds,
    durationSeconds,
    status: 'in_progress',
    startTime: new Date(),
    subjectBreakdown,
    maxTotalScore,
  });

  const safeQuestions = allQ.map(q => {
    const meta = SUBJECT_META[q.subject] || {};
    return {
      _id: q._id, subject: q.subject, subjectName: meta.name || q.subject,
      block: 'subject', question: q.question, options: q.options,
      difficulty: q.difficulty, topic: q.topic,
    };
  });

  return { session, questions: safeQuestions };
}

// ─── 3. Javob yuborish — SNAPSHOT bilan ────────────────────────────────────
async function submitAnswer(sessionId, userId, questionId, selectedOption) {
  assertObjectId(sessionId, 'sessionId');
  assertObjectId(userId, 'userId');
  assertObjectId(questionId, 'questionId');

  const [session, testQ] = await Promise.all([
    ExamSession.findById(sessionId),
    TestQuestion.findById(questionId),
  ]);

  if (!session) throw new Error('Sessiya topilmadi');
  if (session.status !== 'in_progress') throw new Error('Sessiya allaqachon yakunlangan');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yoq');
  
  // Vaqt tekshiruvi (60 soniya imtiyoz bilan)
  const sessionEndTime = new Date(session.startTime.getTime() + session.durationSeconds * 1000 + 60000);
  if (new Date() > sessionEndTime) {
    throw new Error('Vaqt tugagan, javob qabul qilinmaydi');
  }

  if (!testQ) throw new Error('Savol topilmadi');

  const isCorrect = testQ.answer === selectedOption;

  // SNAPSHOT: savol ma'lumotlarini UserAnswer ichida saqlash
  // Endi admin TestQuestion ni o'chirsa ham, foydalanuvchi tarixi saqlanadi
  await UserAnswer.findOneAndUpdate(
    { sessionId, questionId },
    {
      userId,
      questionId,
      // SNAPSHOT — savol ma'lumotlarining nusxasi
      questionText:    testQ.question,
      questionOptions: testQ.options,
      correctAnswer:   testQ.answer,
      explanation:     testQ.explanation || '',
      topic:           testQ.topic || '',
      difficulty:      testQ.difficulty || 'medium',
      // Foydalanuvchi javobi
      subjectId: testQ.subject,
      selectedOption,
      isCorrect,
      block: session.mode === 'dtm'
        ? getBlock(testQ.subject, session.direction)
        : 'subject',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { isCorrect, correctIndex: testQ.answer, explanation: testQ.explanation || '' };
}

// ─── 4. Sessiyani yakunlash ────────────────────────────────────────────────
async function finishExamSession(sessionId, userId) {
  assertObjectId(sessionId, 'sessionId');

  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Sessiya topilmadi');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yoq');
  if (session.status === 'completed') throw new Error('Allaqachon yakunlangan');

  const answers = await UserAnswer.find({ sessionId });

  const correctBySubject = {};
  for (const a of answers) {
    if (!correctBySubject[a.subjectId]) correctBySubject[a.subjectId] = { correct: 0, wrong: 0 };
    if (a.isCorrect) correctBySubject[a.subjectId].correct++;
    else correctBySubject[a.subjectId].wrong++;
  }

  let totalScore = 0;
  const breakdown = session.subjectBreakdown.map(sb => {
    const stats = correctBySubject[sb.subjectId] || { correct: 0, wrong: 0 };
    const score = parseFloat((stats.correct * sb.weight).toFixed(2));
    totalScore += score;
    return {
      ...sb.toObject(),
      correct: stats.correct, wrong: stats.wrong,
      score, maxScore: sb.maxScore,
    };
  });

  session.status = 'completed';
  session.endTime = new Date();
  session.totalScore = parseFloat(totalScore.toFixed(2));
  session.subjectBreakdown = breakdown;
  await session.save();

  return { session, breakdown, totalScore: session.totalScore };
}

// ─── 5. Sessiya ko'rish — SNAPSHOT'dan o'qiydi ─────────────────────────────
async function getSessionReview(sessionId, userId) {
  assertObjectId(sessionId, 'sessionId');

  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Sessiya topilmadi');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yoq');

  // SNAPSHOT'dan o'qish — populate kerak emas, savollar UserAnswer ichida saqlangan
  const answers = await UserAnswer.find({ sessionId }).sort({ createdAt: 1 });

  return { session, answers };
}

// ─── 6. Tarix ─────────────────────────────────────────────────────────────
async function getHistory(userId, mode, page = 1, limit = 20) {
  assertObjectId(userId, 'userId');
  const filter = { userId, status: 'completed' };
  if (mode && mode !== 'all') filter.mode = mode;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    ExamSession.find(filter)
      .select('mode direction selectedSubjects subjectBreakdown totalScore maxTotalScore durationSeconds startTime endTime createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ExamSession.countDocuments(filter),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
}

// ─── 7. Sessiyani o'chirish (foydalanuvchi tomonidan) ──────────────────────
async function deleteSession(sessionId, userId) {
  assertObjectId(sessionId, 'sessionId');
  assertObjectId(userId, 'userId');

  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Sessiya topilmadi');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yo\'q');

  // Sessiyaga tegishli javoblarni ham o'chirish
  await Promise.all([
    UserAnswer.deleteMany({ sessionId }),
    ExamSession.deleteOne({ _id: sessionId }),
  ]);

  return { deleted: true, sessionId };
}

// ─── 8. Testni qayta ishlash — eski sessiya asosida ───────────────────────
async function repeatSession(sessionId, userId) {
  assertObjectId(sessionId, 'sessionId');
  assertObjectId(userId, 'userId');

  const oldSession = await ExamSession.findById(sessionId);
  if (!oldSession) throw new Error('Sessiya topilmadi');
  if (String(oldSession.userId) !== String(userId)) throw new Error('Ruxsat yo\'q');

  // Bir xil format/yo'nalish bilan yangi sessiya yaratish
  if (oldSession.mode === 'dtm') {
    return await startDtmSession(userId, oldSession.direction);
  } else {
    // Subject mode — savol soni ham eski sessiyadagidek
    const counts = {};
    oldSession.subjectBreakdown.forEach(sb => {
      counts[sb.subjectId] = sb.questionCount;
    });
    return await startSubjectSession(userId, oldSession.selectedSubjects, { questionCounts: counts });
  }
}

// ─── 9. AI Kabinet — DTM xato qilingan savollar tahlili ──────────────────
// Faqat DTM rejimidagi sessiyalardan xato javoblarni yig'ib chiqaradi
async function getCabinetData(userId, options = {}) {
  assertObjectId(userId, 'userId');
  const { subjectId = null, limit = 100 } = options;

  // Faqat DTM completed sessiyalar
  const dtmSessions = await ExamSession.find({
    userId,
    mode: 'dtm',
    status: 'completed',
  }).select('_id direction subjectBreakdown totalScore maxTotalScore createdAt').sort({ createdAt: -1 });

  if (!dtmSessions.length) {
    return {
      empty: true,
      message: "Hali DTM testlari ishlanmagan. Tarix qismidan birinchi DTM testini o'tkazing.",
      sessions: [], wrongAnswers: [], stats: {},
    };
  }

  const sessionIds = dtmSessions.map(s => s._id);

  // Xato javoblarni topish (snapshot bilan)
  const wrongFilter = {
    userId,
    sessionId: { $in: sessionIds },
    isCorrect: false,
  };
  if (subjectId) wrongFilter.subjectId = subjectId;

  const wrongAnswers = await UserAnswer.find(wrongFilter)
    .sort({ createdAt: -1 })
    .limit(limit);

  // Statistika: fan bo'yicha xato soni
  const subjectStats = {};
  const blockStats = { majburiy: { correct: 0, wrong: 0, total: 0 },
                       mutaxassislik_1: { correct: 0, wrong: 0, total: 0 },
                       mutaxassislik_2: { correct: 0, wrong: 0, total: 0 } };

  // Barcha javoblar (correct + wrong) — to'liq statistika uchun
  const allAnswers = await UserAnswer.find({
    userId, sessionId: { $in: sessionIds },
  }).select('subjectId isCorrect block');

  for (const a of allAnswers) {
    if (!subjectStats[a.subjectId]) {
      subjectStats[a.subjectId] = {
        subjectId: a.subjectId,
        subjectName: SUBJECT_META[a.subjectId]?.name || a.subjectId,
        correct: 0, wrong: 0, total: 0, accuracy: 0,
      };
    }
    subjectStats[a.subjectId].total++;
    if (a.isCorrect) subjectStats[a.subjectId].correct++;
    else subjectStats[a.subjectId].wrong++;

    if (blockStats[a.block]) {
      blockStats[a.block].total++;
      if (a.isCorrect) blockStats[a.block].correct++;
      else blockStats[a.block].wrong++;
    }
  }

  // Aniqlik foizi (accuracy)
  Object.values(subjectStats).forEach(s => {
    s.accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
  });
  Object.values(blockStats).forEach(b => {
    b.accuracy = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
  });

  // Eng zaif fan (eng past accuracy)
  const weakestSubject = Object.values(subjectStats)
    .filter(s => s.total >= 3)
    .sort((a,b) => a.accuracy - b.accuracy)[0] || null;

  return {
    empty: false,
    sessions: dtmSessions,
    sessionCount: dtmSessions.length,
    wrongAnswers,
    wrongCount: wrongAnswers.length,
    totalAnswered: allAnswers.length,
    stats: {
      bySubject: Object.values(subjectStats).sort((a,b) => a.accuracy - b.accuracy),
      byBlock: blockStats,
      weakestSubject,
      overallAccuracy: allAnswers.length > 0
        ? Math.round((allAnswers.filter(a => a.isCorrect).length / allAnswers.length) * 100)
        : 0,
    },
  };
}

// ─── 10. Kabinet uchun mini-test (faqat xato qilingan savollar) ──────────
// options:
//   - fromSessionId: agar berilsa, FAQAT shu sessiyadagi xato savollardan
//                    foydalanadi. Majburiy fan uchun 5 ta, mutaxassislik uchun
//                    15 ta savol AI tomonidan saralanadi.
//   - subjectId: faqat shu fan bo'yicha xatolar (umumiy mini-test uchun)
//   - limit: jami savol soni (umumiy mini-test uchun)
async function startCabinetMiniTest(userId, options = {}) {
  assertObjectId(userId, 'userId');
  const { subjectId = null, limit = 10, fromSessionId = null } = options;

  // Sessiyadan kelgan xato savollar
  let sourceFilter;
  if (fromSessionId) {
    sourceFilter = { userId, sessionId: fromSessionId, isCorrect: false };
  } else {
    // Eski rejim: barcha DTM sessiyalardan
    const dtmSessions = await ExamSession.find({
      userId, mode: 'dtm', status: 'completed',
    }).select('_id');

    if (!dtmSessions.length) {
      throw new Error('Hali DTM testlari yo\'q');
    }
    sourceFilter = {
      userId, sessionId: { $in: dtmSessions.map(s => s._id) }, isCorrect: false,
    };
    if (subjectId) sourceFilter.subjectId = subjectId;
  }

  // Barcha xato javoblarni olamiz
  const allWrongAnswers = await UserAnswer.find(sourceFilter).lean();

  if (!allWrongAnswers.length) {
    throw new Error('Xato qilingan savollar yo\'q. Yaxshi natija!');
  }

  // ─── fromSessionId rejimi: fan bo'yicha turli miqdor ────────────────────
  // Majburiy fan: 5 ta, mutaxassislik: 15 ta
  let wrongAnswers;
  if (fromSessionId) {
    // Fanlar bo'yicha guruhlash
    const bySubject = {};
    for (const a of allWrongAnswers) {
      if (!bySubject[a.subjectId]) bySubject[a.subjectId] = [];
      bySubject[a.subjectId].push(a);
    }

    wrongAnswers = [];
    for (const [subjId, answers] of Object.entries(bySubject)) {
      const meta = SUBJECT_META[subjId];
      if (!meta) continue;

      // Majburiy = 5, mutaxassislik = 15
      const targetCount = meta.block === 'majburiy' ? 5 : 15;

      // Shuffle va kerakli miqdorni olish
      const shuffled = answers.sort(() => Math.random() - 0.5);
      const taken = shuffled.slice(0, Math.min(targetCount, shuffled.length));
      wrongAnswers.push(...taken);
    }
  } else {
    // Eski rejim: random shuffle + limit
    wrongAnswers = allWrongAnswers
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
  }

  if (!wrongAnswers.length) {
    throw new Error('Xato qilingan savollar yo\'q. Yaxshi natija!');
  }

  // Yangi mini-test sessiyasi (mode: 'subject' kabi)
  // Lekin alohida belgilab qo'yamiz: bu cabinet rejimi
  const subjectBreakdown = {};
  wrongAnswers.forEach(a => {
    if (!subjectBreakdown[a.subjectId]) {
      const meta = SUBJECT_META[a.subjectId] || {};
      subjectBreakdown[a.subjectId] = {
        subjectId: a.subjectId,
        subjectName: meta.name || a.subjectId,
        block: 'subject',
        weight: meta.weight || 1.0,
        questionCount: 0,
        correct: 0, wrong: 0, score: 0,
        maxScore: 0,
      };
    }
    subjectBreakdown[a.subjectId].questionCount++;
    subjectBreakdown[a.subjectId].maxScore = parseFloat(
      (subjectBreakdown[a.subjectId].questionCount * subjectBreakdown[a.subjectId].weight).toFixed(2)
    );
  });

  const breakdownArr = Object.values(subjectBreakdown);
  const maxTotalScore = breakdownArr.reduce((s, x) => s + x.maxScore, 0);

  // Snapshot questionId lar — mavjud bo'lsa ishlatamiz
  // Lekin TestQuestion o'chirilgan bo'lishi mumkin, shuning uchun virtual savollar yaratamiz
  // savol matni va variantlari snapshot'da bor — shularni clientga yuboramiz

  const session = await ExamSession.create({
    userId,
    mode: 'subject', // Cabinet ham subject mode dan foydalanadi
    direction: null,
    selectedSubjects: [...new Set(wrongAnswers.map(a => a.subjectId))],
    questionIds: wrongAnswers.map(a => a.questionId).filter(Boolean),
    durationSeconds: wrongAnswers.length * 120,
    status: 'in_progress',
    startTime: new Date(),
    subjectBreakdown: breakdownArr,
    maxTotalScore: parseFloat(maxTotalScore.toFixed(2)),
  });

  // Snapshot'dan savollarni clientga yuborish (haqiqiy TestQuestion bo'lmasa ham ishlaydi)
  const safeQuestions = wrongAnswers.map(a => ({
    _id:        a.questionId || new mongoose.Types.ObjectId(), // virtual id
    subject:    a.subjectId,
    subjectName: SUBJECT_META[a.subjectId]?.name || a.subjectId,
    block:      'subject',
    question:   a.questionText,
    options:    a.questionOptions,
    difficulty: a.difficulty || 'medium',
    topic:      a.topic || '',
    // CABINET MAYDONI — bu savol ilgari xato qilingan
    _wasWrong:  true,
    _previousSelection: a.selectedOption,
  }));

  return { session, questions: safeQuestions, isCabinet: true };
}

module.exports = {
  DIRECTION_MAP,
  SUBJECT_META,
  COMPULSORY_SUBJECTS,
  startDtmSession,
  startSubjectSession,
  submitAnswer,
  finishExamSession,
  getSessionReview,
  getHistory,
  deleteSession,
  repeatSession,
  getCabinetData,
  startCabinetMiniTest,
};
