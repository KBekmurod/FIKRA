const ExamSession  = require('../models/ExamSession');
const UserAnswer   = require('../models/UserAnswer');
const mongoose     = require('mongoose');

const SUBJECT_NAMES = {
  uztil: 'Ona tili',
  math: 'Matematika',
  tarix: "O'zbekiston tarixi",
  bio: 'Biologiya',
  kimyo: 'Kimyo',
  fizika: 'Fizika',
  ingliz: 'Ingliz tili',
  inform: 'Informatika',
  iqtisod: 'Iqtisodiyot',
  rus: 'Rus tili',
  geo: 'Geografiya',
  adab: 'Adabiyot',
};

// Validate that a value is a valid MongoDB ObjectId
function assertObjectId(value, label) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Yaroqsiz ${label}: "${value}"`);
  }
}

// ─── 1. Topic-level analytics ─────────────────────────────────────────────
/**
 * getUserTopicAnalytics(userId)
 *
 * Returns a structured breakdown of the user's performance grouped by subject
 * and, within each subject, by topic.  Each topic entry reports:
 *   - total      : number of questions answered for that topic
 *   - correct    : number of correct answers
 *   - accuracy   : percentage (0–100, rounded to 1 decimal)
 *   - isWeak     : true when accuracy < 50 %
 *
 * Returns an empty array when the user has no answer history.
 */
async function getUserTopicAnalytics(userId) {
  assertObjectId(userId, 'userId');
  const answers = await UserAnswer.find({ userId })
    .populate({ path: 'questionId', select: 'subject topic' })
    .lean();

  if (!answers.length) return [];

  // Build a nested map: { subject -> { topic -> { total, correct } } }
  const subjectMap = {};

  for (const answer of answers) {
    const question = answer.questionId;
    if (!question) continue; // skip if question was deleted

    const subject = question.subject || 'unknown';
    const topic   = question.topic   || 'unknown';

    if (!subjectMap[subject]) subjectMap[subject] = {};
    if (!subjectMap[subject][topic]) {
      subjectMap[subject][topic] = { total: 0, correct: 0 };
    }

    subjectMap[subject][topic].total += 1;
    if (answer.isCorrect) subjectMap[subject][topic].correct += 1;
  }

  // Convert the nested map to a serializable array
  const subjectAnalytics = Object.entries(subjectMap).map(([subject, topicMap]) => {
    const topics = Object.entries(topicMap).map(([topic, stats]) => {
      const accuracy = stats.total > 0
        ? parseFloat(((stats.correct / stats.total) * 100).toFixed(1))
        : 0;
      return {
        topic,
        total:    stats.total,
        correct:  stats.correct,
        accuracy,
        isWeak:   accuracy < 50,
      };
    });

    return { subject, topics };
  });

  return subjectAnalytics;
}

// ─── 2. Progress / growth trend ───────────────────────────────────────────
/**
 * getUserProgress(userId)
 *
 * Fetches all completed ExamSession documents for the user, sorted oldest→newest.
 * Returns:
 *   {
 *     history      : [{ date, score }, …],   // for plotting a chart
 *     overallAvg   : Number,                 // mean score across all sessions
 *     recentAvg    : Number,                 // mean of the latest 3 sessions
 *     previousAvg  : Number,                 // mean of all sessions before the latest 3
 *     growthTrend  : Number,                 // % change of recentAvg vs previousAvg
 *   }
 *
 * Returns a default object with zero/null values when the user has no history.
 */
async function getUserProgress(userId) {
  assertObjectId(userId, 'userId');
  const sessions = await ExamSession.find({ userId, status: 'completed' })
    .sort({ endTime: 1 }) // oldest first
    .lean();

  if (!sessions.length) {
    return {
      history:     [],
      overallAvg:  0,
      recentAvg:   0,
      previousAvg: 0,
      growthTrend: 0,
    };
  }

  // Map sessions to simple { date, score } objects for the chart
  const history = sessions.map(s => ({
    date:  s.endTime || s.updatedAt,
    score: s.totalScore,
  }));

  const scores     = sessions.map(s => s.totalScore);
  const total      = scores.reduce((sum, v) => sum + v, 0);
  const overallAvg = parseFloat((total / scores.length).toFixed(2));

  // Split into recent (last 3) and previous (everything before the last 3)
  const recentCount  = Math.min(3, scores.length);
  const recentScores = scores.slice(-recentCount);
  const prevScores   = scores.slice(0, scores.length - recentCount);

  const recentAvg = parseFloat(
    (recentScores.reduce((s, v) => s + v, 0) / recentScores.length).toFixed(2),
  );

  let previousAvg  = 0;
  let growthTrend  = 0;

  if (prevScores.length > 0) {
    previousAvg = parseFloat(
      (prevScores.reduce((s, v) => s + v, 0) / prevScores.length).toFixed(2),
    );
    // Percentage change relative to the previous average
    growthTrend = previousAvg !== 0
      ? parseFloat((((recentAvg - previousAvg) / previousAvg) * 100).toFixed(2))
      : 0;
  }

  return {
    history,
    overallAvg,
    recentAvg,
    previousAvg,
    growthTrend,
  };
}

// ─── 3. Weak subject analytics ─────────────────────────────────────────────
async function getWeakSubjects(userId) {
  assertObjectId(userId, 'userId');

  const answers = await UserAnswer.find({ userId })
    .populate({ path: 'questionId', select: 'subject' })
    .lean();

  if (!answers.length) return [];

  const subjectMap = {};
  for (const answer of answers) {
    const subject = answer.questionId?.subject || 'unknown';
    if (!subjectMap[subject]) subjectMap[subject] = { total: 0, correct: 0 };
    subjectMap[subject].total += 1;
    if (answer.isCorrect) subjectMap[subject].correct += 1;
  }

  const items = Object.entries(subjectMap).map(([subject, stats]) => {
    const accuracy = stats.total > 0
      ? parseFloat(((stats.correct / stats.total) * 100).toFixed(1))
      : 0;

    let level = 'strong';
    if (accuracy < 30) level = 'veryWeak';
    else if (accuracy < 50) level = 'weak';
    else if (accuracy < 75) level = 'medium';

    return {
      subject,
      subjectName: SUBJECT_NAMES[subject] || subject,
      accuracy,
      totalAnswered: stats.total,
      correctAnswers: stats.correct,
      level,
    };
  });

  return items.sort((a, b) => a.accuracy - b.accuracy);
}

// ─── 4. AI tavsiyalar ───────────────────────────────────────────────────────
async function generateAIRecommendations(userId) {
  assertObjectId(userId, 'userId');

  const weakSubjects = await getWeakSubjects(userId);
  const progress = await getUserProgress(userId);
  const topicAnalytics = await getUserTopicAnalytics(userId);

  const weakAreas = weakSubjects.slice(0, 3);
  const drillTargets = weakAreas.map(item => ({
    subject: item.subject,
    subjectName: item.subjectName,
    questionCount: item.level === 'veryWeak' ? 7 : 5,
    accuracy: item.accuracy,
    level: item.level,
  }));

  if (!weakAreas.length) {
    return {
      summary: 'Hozircha sezilarli zaiflik topilmadi. Shu uslubni saqlang.',
      weakAreas: [],
      drillTargets: [],
      recommendations: [
        'Aralash testlar bilan ritmni saqlang.',
        'Eng yuqori ball olish uchun vaqtni nazorat qiling.',
      ],
      progress,
      topicAnalytics,
    };
  }

  const recommendations = [];
  recommendations.push(`${weakAreas[0].subjectName} bo'yicha mini-test ishlang — ${weakAreas[0].accuracy}% to'g'ri javob.`);
  if (weakAreas[1]) {
    recommendations.push(`${weakAreas[1].subjectName} ham e'tibor talab qiladi — ${weakAreas[1].accuracy}% natija.`);
  }
  if (progress.growthTrend > 0) {
    recommendations.push(`So'nggi natijalar +${progress.growthTrend}% o'sishni ko'rsatmoqda. Shu ritmni davom ettiring.`);
  } else if (progress.growthTrend < 0) {
    recommendations.push(`So'nggi natijalarda ${Math.abs(progress.growthTrend)}% pasayish bor. Takror va drill kerak.`);
  } else {
    recommendations.push("Hozircha trend neytral. Bir necha drill sessiya foydali bo'ladi.");
  }

  return {
    summary: `Eng zaif yo'nalishlar: ${weakAreas.map(item => item.subjectName).join(', ')}.`,
    weakAreas,
    drillTargets,
    recommendations,
    progress,
    topicAnalytics,
  };
}

module.exports = {
  getUserTopicAnalytics,
  getUserProgress,
  getWeakSubjects,
  generateAIRecommendations,
};
