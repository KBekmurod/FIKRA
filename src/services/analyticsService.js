const ExamSession  = require('../models/ExamSession');
const UserAnswer   = require('../models/UserAnswer');

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

module.exports = {
  getUserTopicAnalytics,
  getUserProgress,
};
