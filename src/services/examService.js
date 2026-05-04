const ExamSession  = require('../models/ExamSession');
const UserAnswer   = require('../models/UserAnswer');
const TestQuestion = require('../models/TestQuestion');
const mongoose     = require('mongoose');

// ─── DTM 2026 Konfiguratsiya ───────────────────────────────────────────────
// Agar kelajakda o'zgartirish kerak bo'lsa — faqat shu joyni o'zgartiring

const COMPULSORY_SUBJECTS = [
  { id: 'uztil',  name: "Ona tili",          weight: 1.1, count: 10, block: 'majburiy' },
  { id: 'math',   name: "Matematika",         weight: 1.1, count: 10, block: 'majburiy' },
  { id: 'tarix',  name: "O'zbekiston tarixi", weight: 1.1, count: 10, block: 'majburiy' },
];

const SUBJECT_META = {
  uztil:   { name: "Ona tili",         weight: 1.1, block: 'majburiy',        defaultCount: 10 },
  math:    { name: "Matematika",        weight: 1.1, block: 'majburiy',        defaultCount: 10 },
  tarix:   { name: "O'zbekiston tarixi",weight: 1.1, block: 'majburiy',        defaultCount: 10 },
  bio:     { name: "Biologiya",         weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },
  kimyo:   { name: "Kimyo",             weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  fizika:  { name: "Fizika",            weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },
  ingliz:  { name: "Ingliz tili",       weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  inform:  { name: "Informatika",       weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },
  iqtisod: { name: "Iqtisodiyot",       weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  rus:     { name: "Rus tili",          weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
  geo:     { name: "Geografiya",        weight: 3.1, block: 'mutaxassislik_1', defaultCount: 30 },
  adab:    { name: "Adabiyot",          weight: 2.1, block: 'mutaxassislik_2', defaultCount: 30 },
};

// Yo'nalish → [mutaxassislik_1, mutaxassislik_2]
// mutaxassislik_1 = 3.1 ball, mutaxassislik_2 = 2.1 ball
const DIRECTION_MAP = {
  tibbiyot:      { name: "Tibbiyot",         spec: ['bio',     'kimyo'  ] },
  it:            { name: "IT / Dasturlash",   spec: ['inform',  'fizika' ] },
  iqtisodiyot:   { name: "Iqtisodiyot",       spec: ['iqtisod', 'ingliz' ] },
  pedagogika:    { name: "Pedagogika",        spec: ['ingliz',  'rus'    ] },
  arxitektura:   { name: "Arxitektura",       spec: ['fizika',  'rus'    ] },
  jurnalistika:  { name: "Jurnalistika",      spec: ['ingliz',  'rus'    ] },
  rus_filologiya:{ name: "Rus filologiyasi",  spec: ['rus',     'ingliz' ] },
  kimyo_fan:     { name: "Kimyo fani",        spec: ['kimyo',   'bio'    ] },
  fizika_fan:    { name: "Fizika fani",       spec: ['fizika',  'kimyo'  ] },
  ingliz_filol:  { name: "Ingliz filologiyasi",spec: ['ingliz', 'inform' ] },
  biologiya_fan: { name: "Biologiya fani",    spec: ['bio',     'kimyo'  ] },
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

  const dirInfo = DIRECTION_MAP[direction.toLowerCase()];
  if (!dirInfo) {
    const supported = Object.keys(DIRECTION_MAP).join(', ');
    throw new Error(`Noma'lum yo'nalish: "${direction}". Qo'llab-quvvatlanadigan: ${supported}`);
  }

  const [spec1Id, spec2Id] = dirInfo.spec;
  const spec1Meta = SUBJECT_META[spec1Id];
  const spec2Meta = SUBJECT_META[spec2Id];

  // Savollarni olish
  const compQuestions = (
    await Promise.all(COMPULSORY_SUBJECTS.map(s => fetchRandom(s.id, s.count)))
  ).flat();

  const spec1Questions = await fetchRandom(spec1Id, 30);
  const spec2Questions = await fetchRandom(spec2Id, 30);

  const allQ = [...compQuestions, ...spec1Questions, ...spec2Questions];
  const questionIds = allQ.map(q => q._id);

  // Subject breakdown (sessiyada saqlanadi)
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
    durationSeconds: 10800, // 180 daqiqa
    status: 'in_progress',
    startTime: new Date(),
    subjectBreakdown,
    maxTotalScore: parseFloat(maxTotalScore.toFixed(2)),
  });

  // Clientga saf savollar (javobi yo'q)
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

  if (!subjects || subjects.length === 0) {
    throw new Error('Kamida 1 ta fan tanlang');
  }

  // Har fan uchun meta va savol soni
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

  const questionIds = allQ.map(q => q._id);
  const maxTotalScore = parseFloat(
    subjectBreakdown.reduce((s, x) => s + x.maxScore, 0).toFixed(2)
  );

  // Vaqt: advanced.durationSeconds yoki avtomatik (2 daqiqa/savol)
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
      _id:        q._id,
      subject:    q.subject,
      subjectName:meta.name || q.subject,
      block:      'subject',
      question:   q.question,
      options:    q.options,
      difficulty: q.difficulty,
      topic:      q.topic,
    };
  });

  return { session, questions: safeQuestions };
}

// ─── 3. Javob yuborish ─────────────────────────────────────────────────────
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
  if (!testQ) throw new Error('Savol topilmadi');

  const isCorrect = testQ.answer === selectedOption;

  // Upsert answer
  await UserAnswer.findOneAndUpdate(
    { sessionId, questionId },
    {
      userId,
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

  // Fan bo'yicha to'g'ri javoblar soni
  const correctBySubject = {};
  for (const a of answers) {
    if (!correctBySubject[a.subjectId]) correctBySubject[a.subjectId] = { correct: 0, wrong: 0 };
    if (a.isCorrect) correctBySubject[a.subjectId].correct++;
    else correctBySubject[a.subjectId].wrong++;
  }

  // Breakdown yangilash
  let totalScore = 0;
  const breakdown = session.subjectBreakdown.map(sb => {
    const stats = correctBySubject[sb.subjectId] || { correct: 0, wrong: 0 };
    const score = parseFloat((stats.correct * sb.weight).toFixed(2));
    totalScore += score;
    return {
      ...sb.toObject(),
      correct: stats.correct,
      wrong: stats.wrong,
      score,
      maxScore: sb.maxScore,
    };
  });

  session.status = 'completed';
  session.endTime = new Date();
  session.totalScore = parseFloat(totalScore.toFixed(2));
  session.subjectBreakdown = breakdown;
  await session.save();

  return { session, breakdown, totalScore: session.totalScore };
}

// ─── 5. Sessiya ko'rish (review) ───────────────────────────────────────────
async function getSessionReview(sessionId, userId) {
  assertObjectId(sessionId, 'sessionId');

  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Sessiya topilmadi');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yoq');

  const answers = await UserAnswer.find({ sessionId })
    .populate('questionId', 'question options answer explanation subject topic difficulty');

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

// ─── Eksport ───────────────────────────────────────────────────────────────
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
};
