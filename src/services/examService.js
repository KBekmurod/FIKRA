const ExamSession  = require('../models/ExamSession');
const UserAnswer   = require('../models/UserAnswer');
const TestQuestion = require('../models/TestQuestion');
const mongoose     = require('mongoose');
const DTM          = require('../config/dtm2026');

// Helpers
function assertObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) throw new Error(`Invalid ${label}`);
}

async function fetchRandomQuestions(subjectId, count) {
  return TestQuestion.aggregate([
    { $match: { subject: subjectId } },
    { $sample: { size: count } },
  ]);
}

function sanitizeQuestion(q, block = null) {
  return {
    _id:        q._id,
    subject:    q.subject,
    block:      block,
    question:   q.question,
    options:    q.options,
    difficulty: q.difficulty,
    topic:      q.topic,
  };
}

// Start a DTM-mode session
async function startExamSession(userId, directionId) {
  assertObjectId(userId, 'userId');
  const subjects = DTM.buildDtmSubjects(directionId);

  const session = await ExamSession.create({
    userId,
    mode: 'dtm',
    direction: directionId.toLowerCase(),
    subjects,
    durationSeconds: DTM.durationSeconds,
    status: 'in_progress',
    startTime: new Date(),
  });

  const questionGroups = await Promise.all(
    subjects.map(s => fetchRandomQuestions(s.subjectId, s.questionCount)),
  );
  const allQuestions = questionGroups.flat();

  const safeQuestions = allQuestions.map(q => {
    const subjMeta = subjects.find(s => s.subjectId === q.subject);
    return sanitizeQuestion(q, subjMeta ? subjMeta.block : 'majburiy');
  });

  const dirInfo = DTM.getDirection(directionId);
  return { session, questions: safeQuestions, directionName: dirInfo.name };
}

// Start a subject-select session
async function startSubjectSession(userId, selectedSubjects, questionCountOverrides = {}, durationSecondsOverride = null) {
  assertObjectId(userId, 'userId');
  const subjects = DTM.buildSubjectSelectSubjects(selectedSubjects, questionCountOverrides);
  const durationSeconds = DTM.computeDuration(subjects, durationSecondsOverride);

  const session = await ExamSession.create({
    userId,
    mode: 'subject',
    direction: null,
    subjects,
    durationSeconds,
    status: 'in_progress',
    startTime: new Date(),
  });

  const questionGroups = await Promise.all(
    subjects.map(s => fetchRandomQuestions(s.subjectId, s.questionCount)),
  );
  const allQuestions = questionGroups.flat();

  const safeQuestions = allQuestions.map(q => {
    const subjMeta = subjects.find(s => s.subjectId === q.subject);
    return sanitizeQuestion(q, subjMeta ? subjMeta.block : null);
  });

  return { session, questions: safeQuestions };
}

// Submit an answer
async function submitAnswer(sessionId, userId, questionId, selectedOption) {
  assertObjectId(sessionId, 'sessionId');
  assertObjectId(userId, 'userId');
  assertObjectId(questionId, 'questionId');

  const [session, testQuestion] = await Promise.all([
    ExamSession.findById(sessionId),
    TestQuestion.findById(questionId),
  ]);

  if (!session) throw new Error('Sessiya topilmadi');
  if (session.status !== 'in_progress') throw new Error('Sessiya allaqachon yakunlangan');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yoq');
  if (!testQuestion) throw new Error('Savol topilmadi');

  const isCorrect = testQuestion.answer === selectedOption;

  const subjMeta = (session.subjects || []).find(s => s.subjectId === testQuestion.subject);
  const block = subjMeta ? subjMeta.block : (DTM.mandatorySubjectIds.has(testQuestion.subject) ? DTM.mandatory.block : null);

  const res = await UserAnswer.findOneAndUpdate(
    { sessionId, questionId },
    {
      userId,
      subjectId: testQuestion.subject,
      selectedOption,
      isCorrect,
      block,
      answeredAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { isCorrect, correctIndex: testQuestion.answer, explanation: testQuestion.explanation || '' };
}

module.exports = {
  startExamSession,
  startSubjectSession,
  submitAnswer,
};
// ─── Helpers ──────────────────────────────────────────────────────────────────

// Validate that a value is a valid MongoDB ObjectId
function assertObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Yaroqsiz ${label}: "${value}"`);
  }
}

// Fetch `count` random questions for a subject (answer field NOT returned to client)
async function fetchRandomQuestions(subjectId, count) {
  return TestQuestion.aggregate([
    { $match: { subject: subjectId } },
    { $sample: { size: count } },
  ]);
}

// Strip the correct answer and return safe fields for the client
function sanitizeQuestion(q, block) {
  return {
    _id:        q._id,
    subject:    q.subject,
    block:      block,
>>>>>>> ab9ecca (Changes before error encountered)
    question:   q.question,
    options:    q.options,
    difficulty: q.difficulty,
    topic:      q.topic,
  };
}

// ─── Legacy compatibility: direction → specialized subjects map ───────────────

/**
 * Returns { mutaxassislik_1: subjectId, mutaxassislik_2: subjectId } for a direction.
 * Kept for backward compatibility with existing callers.
 */
function getSpecializedSubjects(direction) {
  const dir = DTM.getDirection(direction);
  return { mutaxassislik_1: dir.subjects[0], mutaxassislik_2: dir.subjects[1] };
}

// ─── 1a. Start DTM exam session (by direction) ────────────────────────────────
/**
 * Creates a new DTM-mode exam session and fetches all questions.
 * @param {string} userId  - MongoDB ObjectId string
 * @param {string} directionId  - e.g. 'tibbiyot', 'it'
 * @returns {{ session, questions }}
 */
async function startExamSession(userId, directionId) {
  assertObjectId(userId, 'userId');

  // Validates direction and builds subjects metadata from config
  const subjects = DTM.buildDtmSubjects(directionId);

  const session = await ExamSession.create({
    userId,
    mode:            'dtm',
    direction:       directionId.toLowerCase(),
    subjects,
    durationSeconds: DTM.durationSeconds,
    status:          'in_progress',
    startTime:       new Date(),
  });

  // Fetch questions for each subject
  const questionGroups = await Promise.all(
    subjects.map(s => fetchRandomQuestions(s.subjectId, s.questionCount)),
  );
  const allQuestions = questionGroups.flat();

  const safeQuestions = allQuestions.map(q => {
    const subjMeta = subjects.find(s => s.subjectId === q.subject);
    return sanitizeQuestion(q, subjMeta ? subjMeta.block : 'majburiy');
  });

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

<<<<<<< HEAD
// ─── 3. Javob yuborish ─────────────────────────────────────────────────────
async function submitAnswer(sessionId, userId, questionId, selectedOption) {
  assertObjectId(sessionId, 'sessionId');
=======
// ─── 1b. Start subject-select exam session ────────────────────────────────────
/**
 * Creates a new subject-select session where the user chooses 1..N subjects.
 * @param {string} userId
 * @param {{ subjectId: string }[]} selectedSubjects
 * @param {{ [subjectId: string]: number }} [questionCountOverrides]
 * @param {number|null} [durationSecondsOverride]
 * @returns {{ session, questions }}
 */
async function startSubjectSession(userId, selectedSubjects, questionCountOverrides, durationSecondsOverride) {
>>>>>>> ab9ecca (Changes before error encountered)
  assertObjectId(userId, 'userId');

  const subjects = DTM.buildSubjectSelectSubjects(selectedSubjects, questionCountOverrides || {});
  const durationSeconds = DTM.computeDuration(subjects, durationSecondsOverride);

  const session = await ExamSession.create({
    userId,
    mode:            'subject',
    direction:       null,
    subjects,
    durationSeconds,
    status:          'in_progress',
    startTime:       new Date(),
  });

  // Fetch questions for each subject
  const questionGroups = await Promise.all(
    subjects.map(s => fetchRandomQuestions(s.subjectId, s.questionCount)),
  );
  const allQuestions = questionGroups.flat();

  const safeQuestions = allQuestions.map(q => {
    const subjMeta = subjects.find(s => s.subjectId === q.subject);
    return sanitizeQuestion(q, subjMeta ? subjMeta.block : null);
  });

  return { session, questions: safeQuestions };
}

// ─── 2. Submit a single answer ────────────────────────────────────────────────
/**
 * Records one answer for a question in the given session.
 * Returns the answer doc plus isCorrect flag and correctIndex.
 */
async function submitAnswer(sessionId, userId, questionId, selectedOption) {
  assertObjectId(sessionId,  'sessionId');
  assertObjectId(userId,     'userId');
  assertObjectId(questionId, 'questionId');

<<<<<<< HEAD
  const [session, testQ] = await Promise.all([
=======
  const [session, testQuestion] = await Promise.all([
>>>>>>> ab9ecca (Changes before error encountered)
    ExamSession.findById(sessionId),
    TestQuestion.findById(questionId),
  ]);

<<<<<<< HEAD
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
=======
  if (!session)       throw new Error('Imtihon sessiyasi topilmadi');
  if (session.status !== 'in_progress') throw new Error('Sessiya allaqachon yakunlangan');
  if (String(session.userId) !== String(userId)) throw new Error('Bu sessiya boshqa foydalanuvchiga tegishli');
  if (!testQuestion)  throw new Error('Savol topilmadi');

  const isCorrect = testQuestion.answer === selectedOption;

  // Determine block from session subjects metadata
  const subjMeta = session.subjects.find(s => s.subjectId === testQuestion.subject);
  const block    = subjMeta ? subjMeta.block : null;

  // Upsert — if the user re-submits the same question, update it
  const answer = await UserAnswer.findOneAndUpdate(
    { sessionId, questionId },
    {
      userId,
      subjectId:      testQuestion.subject,
      selectedOption,
      isCorrect,
      block,
      answeredAt:     new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    answer,
    isCorrect,
    correctIndex: testQuestion.answer,
    explanation:  testQuestion.explanation || '',
  };
}

// ─── 3. Finish exam session ───────────────────────────────────────────────────
/**
 * Computes scores, marks session as completed, and persists results.
 */
async function finishExamSession(sessionId) {
>>>>>>> ab9ecca (Changes before error encountered)
  assertObjectId(sessionId, 'sessionId');

  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Sessiya topilmadi');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yoq');
  if (session.status === 'completed') throw new Error('Allaqachon yakunlangan');

  const answers = await UserAnswer.find({ sessionId });

<<<<<<< HEAD
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
=======
  // Build per-subject tally
  const tallyMap = {}; // { subjectId: { correct, wrong } }
  for (const a of answers) {
    const sid = a.subjectId || 'unknown';
    if (!tallyMap[sid]) tallyMap[sid] = { correct: 0, wrong: 0 };
    if (a.isCorrect) tallyMap[sid].correct++;
    else             tallyMap[sid].wrong++;
  }

  // Compute scores using session subjects metadata (config-driven weights)
  const subjectScores = session.subjects.map(s => {
    const tally = tallyMap[s.subjectId] || { correct: 0, wrong: 0 };
    const score = parseFloat((tally.correct * s.weight).toFixed(2));
    return { subjectId: s.subjectId, name: s.name, correct: tally.correct, wrong: tally.wrong, score };
  });

  const totalScore = parseFloat(subjectScores.reduce((sum, s) => sum + s.score, 0).toFixed(2));

  // Keep legacy blockScores populated for backward compatibility
  const blockScores = { majburiy: 0, mutaxassislik_1: 0, mutaxassislik_2: 0 };
  for (const s of subjectScores) {
    const subjMeta = session.subjects.find(x => x.subjectId === s.subjectId);
    const blk = subjMeta ? subjMeta.block : null;
    if (blk === 'majburiy') {
      blockScores.majburiy = parseFloat((blockScores.majburiy + s.score).toFixed(2));
    } else if (blk === 'mutaxassislik_1') {
      blockScores.mutaxassislik_1 = parseFloat((blockScores.mutaxassislik_1 + s.score).toFixed(2));
    } else if (blk === 'mutaxassislik_2') {
      blockScores.mutaxassislik_2 = parseFloat((blockScores.mutaxassislik_2 + s.score).toFixed(2));
    }
  }

  session.status        = 'completed';
  session.endTime       = new Date();
  session.totalScore    = totalScore;
  session.subjectScores = subjectScores;
  session.blockScores   = blockScores;
  await session.save();

  return { session, subjectScores, totalScore, blockScores };
}

// ─── 4. Get exam results ──────────────────────────────────────────────────────
/**
 * Returns full session data + all answers (with populated question docs for review).
 */
async function getExamResults(sessionId) {
>>>>>>> ab9ecca (Changes before error encountered)
  assertObjectId(sessionId, 'sessionId');

  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Sessiya topilmadi');
  if (String(session.userId) !== String(userId)) throw new Error('Ruxsat yoq');

  const answers = await UserAnswer.find({ sessionId })
<<<<<<< HEAD
    .populate('questionId', 'question options answer explanation subject topic difficulty');
=======
    .populate('questionId'); // full TestQuestion data for review
>>>>>>> ab9ecca (Changes before error encountered)

  return { session, answers };
}

<<<<<<< HEAD
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
=======
// ─── 5. Get user session history ─────────────────────────────────────────────
/**
 * Returns paginated list of exam sessions for a user, optionally filtered by mode.
 * @param {string} userId
 * @param {{ mode?: 'dtm'|'subject', page?: number, limit?: number }} opts
 */
async function getUserHistory(userId, opts = {}) {
  assertObjectId(userId, 'userId');

  const { mode, page = 1, limit = 20 } = opts;
  const query = { userId };
  if (mode && (mode === 'dtm' || mode === 'subject')) query.mode = mode;

  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const lim  = Math.min(50, Math.max(1, limit));

  const [sessions, total] = await Promise.all([
    ExamSession.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(lim)
      .lean(),
    ExamSession.countDocuments(query),
  ]);

  return { sessions, total, page, limit: lim };
}

module.exports = {
  // DTM config re-exported for convenience
  DTM,
  // Legacy helper
  getSpecializedSubjects,
  // Session lifecycle
  startExamSession,
  startSubjectSession,
  submitAnswer,
  finishExamSession,
  getExamResults,
  getUserHistory,
>>>>>>> ab9ecca (Changes before error encountered)
};
