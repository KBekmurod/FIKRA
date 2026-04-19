// ─── DTM Abituriyent Test ─────────────────────────────────────────────────────

const TEST = (() => {
  const DIRECTIONS = {
    iqtisodiyot: { name: 'Iqtisodiyot',  fans: ['math','ingliz'],   balls: [3.1, 2.1] },
    tibbiyot:    { name: 'Tibbiyot',     fans: ['bio','kimyo'],     balls: [3.1, 2.1] },
    huquq:       { name: 'Huquq',        fans: ['tarix','ingliz'],  balls: [3.1, 2.1] },
    it:          { name: 'IT / Texnika', fans: ['math','fizika'],   balls: [3.1, 2.1] },
  };

  const SUBJECT_NAMES = {
    uztil: 'Ona tili', math: 'Matematika', tarix: "O'zb. tarixi",
    bio: 'Biologiya', kimyo: 'Kimyo', fizika: 'Fizika',
    ingliz: 'Ingliz tili', rus: 'Rus tili',
  };

  // State
  let mode = 'maj';       // 'maj' | 'mut'
  let direction = null;
  let currentSubject = 'uztil';
  let questions = [];
  let qIdx = 0;
  let selectedAnswer = -1;
  let fanIdx = 0;          // mutaxassislik: 0=fan1, 1=fan2

  // Statistika
  let stats = {};          // { subject: { correct, wrong, ball } }

  function resetStats() {
    stats = {
      uztil: { correct: 0, wrong: 0, ball: 0.0 },
      math:  { correct: 0, wrong: 0, ball: 0.0 },
      tarix: { correct: 0, wrong: 0, ball: 0.0 },
    };
    Object.keys(DIRECTIONS).forEach(d => {
      DIRECTIONS[d].fans.forEach(f => {
        if (!stats[f]) stats[f] = { correct: 0, wrong: 0, ball: 0.0 };
      });
    });
  }

  // ─── Majburiy fanlar ──────────────────────────────────────────────────────
  async function startMaj(subject) {
    mode = 'maj';
    currentSubject = subject;
    qIdx = 0; selectedAnswer = -1;
    if (!stats[subject]) resetStats();

    try {
      questions = await API.testQuestions(subject, 'majburiy', 10);
    } catch {
      questions = _getFallbackQuestions(subject);
    }
    return questions;
  }

  async function checkMajAnswer(qId, idx) {
    selectedAnswer = idx;
    try {
      const res = await API.checkAnswer(qId, idx);
      const ball = 1.1;
      if (res.isCorrect) {
        stats[currentSubject].correct++;
        stats[currentSubject].ball += ball;
      } else {
        stats[currentSubject].wrong++;
      }
      return res;
    } catch {
      return { isCorrect: false, correctIndex: 0 };
    }
  }

  async function nextMajQuestion() {
    qIdx++;
    if (qIdx >= questions.length) {
      return { done: true };
    }
    selectedAnswer = -1;
    return { done: false, question: questions[qIdx], idx: qIdx };
  }

  // ─── Mutaxassislik ────────────────────────────────────────────────────────
  async function startMut(dir, selectedFanIdx) {
    mode = 'mut';
    direction = dir;
    fanIdx = selectedFanIdx;
    qIdx = 0; selectedAnswer = -1;

    const subject = DIRECTIONS[dir].fans[fanIdx];
    currentSubject = subject;
    if (!stats[subject]) stats[subject] = { correct: 0, wrong: 0, ball: 0.0 };

    try {
      questions = await API.testQuestions(subject, 'mutaxassislik', 30);
    } catch {
      questions = _getFallbackQuestions(subject);
    }
    return questions;
  }

  async function checkMutAnswer(qId, idx) {
    selectedAnswer = idx;
    const ball = DIRECTIONS[direction].balls[fanIdx];
    try {
      const res = await API.checkAnswer(qId, idx);
      if (res.isCorrect) {
        stats[currentSubject].correct++;
        stats[currentSubject].ball += ball;
      } else {
        stats[currentSubject].wrong++;
      }
      return res;
    } catch {
      return { isCorrect: false, correctIndex: 0 };
    }
  }

  // ─── DTM umumiy natija ────────────────────────────────────────────────────
  async function finishAndSave(type) {
    let totalBall = 0;
    let maxBall = 0;
    const breakdown = [];
    let xpResult = null;

    if (type === 'maj') {
      const majSubjects = ['uztil', 'math', 'tarix'];
      majSubjects.forEach(s => {
        const st = stats[s] || { correct: 0, wrong: 0, ball: 0 };
        const total = st.correct + st.wrong;
        if (total > 0) {
          totalBall += st.ball;
          maxBall += total * 1.1;
          breakdown.push({ name: SUBJECT_NAMES[s], correct: st.correct, total, ball: st.ball });
        }
      });
      try {
        const r = await API.testResult({ gameType: 'test-maj', ballAmount: totalBall, maxBall,
          correctCount: breakdown.reduce((a,b) => a+b.correct, 0),
          totalQuestions: breakdown.reduce((a,b) => a+b.total, 0) });
        xpResult = r?.xp || null;
      } catch {}
    } else if (type === 'mut' && direction) {
      const dir = DIRECTIONS[direction];
      dir.fans.forEach((f, i) => {
        const st = stats[f] || { correct: 0, wrong: 0, ball: 0 };
        const total = st.correct + st.wrong;
        if (total > 0) {
          totalBall += st.ball;
          maxBall += total * dir.balls[i];
          breakdown.push({ name: SUBJECT_NAMES[f], correct: st.correct, total, ball: st.ball });
        }
      });
      try {
        const r = await API.testResult({ gameType: 'test-mut', direction,
          ballAmount: totalBall, maxBall,
          correctCount: breakdown.reduce((a,b) => a+b.correct, 0),
          totalQuestions: breakdown.reduce((a,b) => a+b.total, 0) });
        xpResult = r?.xp || null;
      } catch {}
    }

    return {
      totalBall: +totalBall.toFixed(1),
      maxBall: +maxBall.toFixed(1),
      breakdown,
      xp: xpResult,
    };
  }

  // ─── Fallback savollar (internet yo'q bo'lganda) ──────────────────────────
  function _getFallbackQuestions(subject) {
    const fallback = {
      math: [
        { _id: 'f1', question: "2² + 3² = ?", options: ['10','13','12','11'], answer: 1 },
        { _id: 'f2', question: "5! = ?", options: ['100','110','120','125'], answer: 2 },
        { _id: 'f3', question: "√81 = ?", options: ['7','8','9','10'], answer: 2 },
        { _id: 'f4', question: "log₁₀(1000) = ?", options: ['2','3','4','5'], answer: 1 },
        { _id: 'f5', question: "sin(0°) = ?", options: ['1','0','-1','√2/2'], answer: 1 },
      ],
      uztil: [
        { _id: 'u1', question: "Kesim gapning qaysi bo'lagi?", options: ['Ega','Kesim','Aniqlovchi','To\'ldiruvchi'], answer: 1 },
        { _id: 'u2', question: "'Bahor' so'zi qaysi turkumga kiradi?", options: ['Fe\'l','Ot','Sifat','Ravish'], answer: 1 },
      ],
      tarix: [
        { _id: 't1', question: "O'zbekiston mustaqillik sanasi?", options: ['1 sen','31 avg','9 may','8 dek'], answer: 1 },
        { _id: 't2', question: "Toshkent poytaxt bo'lgan yil?", options: ['1930','1924','1938','1950'], answer: 0 },
      ],
    };
    return (fallback[subject] || fallback.math).map(q => ({ ...q, block: 'majburiy', subject }));
  }

  function getDirections() { return DIRECTIONS; }
  function getSubjectName(s) { return SUBJECT_NAMES[s] || s; }
  function getCurrentQ() { return questions[qIdx]; }

  return {
    resetStats, startMaj, checkMajAnswer, nextMajQuestion,
    startMut, checkMutAnswer, finishAndSave,
    getDirections, getSubjectName, getCurrentQ,
    getStats: () => stats,
    getQIdx: () => qIdx,
    getTotal: () => questions.length,
  };
})();

window.TEST = TEST;
