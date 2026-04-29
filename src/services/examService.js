const ExamSession  = require('../models/ExamSession');
const UserAnswer   = require('../models/UserAnswer');
const TestQuestion = require('../models/TestQuestion');
const mongoose     = require('mongoose');

// ─── Direction → Specialized subjects mapping ─────────────────────────────
// Each direction maps to exactly two specialized subjects.
// The first entry becomes block 'mutaxassislik_1' (30 questions, 3.1 ball each),
// the second becomes block 'mutaxassislik_2' (30 questions, 2.1 ball each).
// NOTE: specialized subjects must not overlap with COMPULSORY_SUBJECTS
//       ('uztil', 'math', 'tarix') so that getBlockForSubject is unambiguous.
const DIRECTION_MAP = {
  tibbiyot:    ['bio',    'kimyo'],
  it:          ['inform', 'fizika'],
  iqtisodiyot: ['iqtisod', 'ingliz'],
  pedagogika:  ['ingliz', 'rus'],
  arxitektura: ['fizika', 'rus'],
  jurnalistika:['ingliz', 'rus'],
  rus_fili:    ['rus',    'ingliz'],
  kimyo:       ['kimyo',  'bio'],
  fizika:      ['fizika', 'kimyo'],
  ingliz_tili: ['ingliz', 'inform'],
};

// Supported direction names (for helpful error messages)
const SUPPORTED_DIRECTIONS = Object.keys(DIRECTION_MAP).join(', ');

// Compulsory subjects (always the same, 10 questions each = 30 total)
const COMPULSORY_SUBJECTS = ['uztil', 'math', 'tarix'];
const COMPULSORY_COUNT    = 10;
const SPECIALIZED_COUNT   = 30;

// Returns { mutaxassislik_1: subject1, mutaxassislik_2: subject2 } for a direction
function getSpecializedSubjects(direction) {
  const key    = direction.toLowerCase();
  const mapped = DIRECTION_MAP[key];
  if (!mapped) {
    throw new Error(
      `Noma'lum yo'nalish: "${direction}". Qo'llab-quvvatlanadigan yo'nalishlar: ${SUPPORTED_DIRECTIONS}`,
    );
  }
  return { mutaxassislik_1: mapped[0], mutaxassislik_2: mapped[1] };
}

// Determine which block a given subject belongs to, for a specific direction
function getBlockForSubject(subject, direction) {
  if (COMPULSORY_SUBJECTS.includes(subject)) return 'majburiy';
  const { mutaxassislik_1, mutaxassislik_2 } = getSpecializedSubjects(direction);
  if (subject === mutaxassislik_1) return 'mutaxassislik_1';
  if (subject === mutaxassislik_2) return 'mutaxassislik_2';
  throw new Error(`"${subject}" fani "${direction}" yo'nalishiga tegishli emas`);
}

// Fetch `count` random questions for a subject (without exposing the answer)
async function fetchRandomQuestions(subject, count) {
  return TestQuestion.aggregate([
    { $match: { subject } },
    { $sample: { size: count } },
  ]);
}

// Validate that a value is a valid MongoDB ObjectId
function assertObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Yaroqsiz ${label}: "${value}"`);
  }
}

// ─── 1. Start exam session ─────────────────────────────────────────────────
async function startExamSession(userId, direction) {
  assertObjectId(userId, 'userId');
  // Validate direction early
  getSpecializedSubjects(direction);

  const session = await ExamSession.create({
    userId,
    direction,
    status:    'in_progress',
    startTime: new Date(),
  });

  // Fetch compulsory questions (10 per subject × 3 = 30)
  const compulsoryQuestions = (
    await Promise.all(COMPULSORY_SUBJECTS.map(s => fetchRandomQuestions(s, COMPULSORY_COUNT)))
  ).flat();

  // Fetch specialized questions (30 per subject × 2 = 60)
  const { mutaxassislik_1: s1, mutaxassislik_2: s2 } = getSpecializedSubjects(direction);
  const specializedQuestions = (
    await Promise.all([
      fetchRandomQuestions(s1, SPECIALIZED_COUNT),
      fetchRandomQuestions(s2, SPECIALIZED_COUNT),
    ])
  ).flat();

  const allQuestions = [...compulsoryQuestions, ...specializedQuestions];

  // Strip the correct answer before returning to the client.
  // The 'block' field is derived from the subject+direction context (not from
  // the raw TestQuestion.block which only knows 'majburiy'/'mutaxassislik').
  const safeQuestions = allQuestions.map(q => ({
    _id:        q._id,
    subject:    q.subject,
    block:      getBlockForSubject(q.subject, direction),
    question:   q.question,
    options:    q.options,
    difficulty: q.difficulty,
    topic:      q.topic,
  }));

  return { session, questions: safeQuestions };
}

// ─── 2. Submit a single answer ─────────────────────────────────────────────
async function submitAnswer(sessionId, userId, questionId, selectedOption) {
  assertObjectId(sessionId, 'sessionId');
  assertObjectId(userId, 'userId');
  assertObjectId(questionId, 'questionId');
  const [session, testQuestion] = await Promise.all([
    ExamSession.findById(sessionId),
    TestQuestion.findById(questionId),
  ]);

  if (!session) throw new Error('Imtihon sessiyasi topilmadi');
  if (session.status !== 'in_progress') throw new Error('Sessiya allaqachon yakunlangan');
  if (String(session.userId) !== String(userId)) throw new Error('Bu sessiya boshqa foydalanuvchiga tegishli');
  if (!testQuestion) throw new Error('Savol topilmadi');

  const block     = getBlockForSubject(testQuestion.subject, session.direction);
  const isCorrect = testQuestion.answer === selectedOption;

  // Upsert — if the user re-submits the same question, update it
  const answer = await UserAnswer.findOneAndUpdate(
    { sessionId, questionId },
    { userId, selectedOption, isCorrect, block },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return answer;
}

// ─── 3. Finish exam session ────────────────────────────────────────────────
async function finishExamSession(sessionId) {
  assertObjectId(sessionId, 'sessionId');
  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Imtihon sessiyasi topilmadi');
  if (session.status === 'completed') throw new Error('Sessiya allaqachon yakunlangan');

  const answers = await UserAnswer.find({ sessionId });

  const correctByBlock = { majburiy: 0, mutaxassislik_1: 0, mutaxassislik_2: 0 };
  for (const a of answers) {
    if (a.isCorrect) correctByBlock[a.block]++;
  }

  // DTM scoring coefficients
  const blockScores = {
    majburiy:        parseFloat((correctByBlock.majburiy        * 1.1).toFixed(2)),
    mutaxassislik_1: parseFloat((correctByBlock.mutaxassislik_1 * 3.1).toFixed(2)),
    mutaxassislik_2: parseFloat((correctByBlock.mutaxassislik_2 * 2.1).toFixed(2)),
  };
  const totalScore = parseFloat(
    (blockScores.majburiy + blockScores.mutaxassislik_1 + blockScores.mutaxassislik_2).toFixed(2),
  );

  session.status     = 'completed';
  session.endTime    = new Date();
  session.totalScore = totalScore;
  session.blockScores = blockScores;
  await session.save();

  return { session, blockScores, totalScore };
}

// ─── 4. Get exam results ───────────────────────────────────────────────────
async function getExamResults(sessionId) {
  assertObjectId(sessionId, 'sessionId');
  const session = await ExamSession.findById(sessionId);
  if (!session) throw new Error('Imtihon sessiyasi topilmadi');

  const answers = await UserAnswer.find({ sessionId })
    .populate('questionId');   // full TestQuestion data for review

  return { session, answers };
}

module.exports = {
  getSpecializedSubjects,
  startExamSession,
  submitAnswer,
  finishExamSession,
  getExamResults,
};
