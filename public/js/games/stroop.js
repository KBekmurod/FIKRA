// ─── Stroop Brain Game ────────────────────────────────────────────────────────

const STROOP = (() => {
  const COLORS = [
    { name: 'Qizil',  hex: '#ff5f7e' },
    { name: "Ko'k",   hex: '#7b68ee' },
    { name: 'Yashil', hex: '#00d4aa' },
    { name: 'Sariq',  hex: '#ffcc44' },
  ];
  const WORDS = ['QIZIL', "KO'K", 'YASHIL', 'SARIQ'];

  // State
  let mode = 0;
  let score = 0;
  let lives = 3;
  let timeLeft = 15;    // 12 → 15 sekund (yumshoqroq)
  let INITIAL_TIME = 15;
  let timer = null;
  let colorIdx = 0;
  let wordIdx = 0;
  let tfCorrect = false;
  let correctCount = 0;
  let wrongCount = 0;
  let startTime = 0;
  let bestScore = 0;
  let gameActive = false;

  // DOM refs
  let els = {};

  function init(elements) {
    els = elements;
    // Saqlangan best score ni yuklash
    try {
      bestScore = parseInt(localStorage.getItem('fikra_stroop_best') || '0', 10);
    } catch {}
  }

  function start(selectedMode) {
    mode = selectedMode;
    score = 0; lives = 3;
    INITIAL_TIME = 15;
    timeLeft = INITIAL_TIME;
    correctCount = 0; wrongCount = 0;
    startTime = Date.now();
    gameActive = true;

    _updateScore(); _updateTimer(); _updateHearts();
    els.prog && (els.prog.style.width = '100%');

    if (mode === 0) _nextColorWord();
    else _nextTF();

    clearInterval(timer);
    timer = setInterval(_tick, 1000);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    gameActive = false;
  }

  function _tick() {
    timeLeft--;
    _updateTimer();
    if (els.prog) els.prog.style.width = Math.max(0, (timeLeft / INITIAL_TIME) * 100) + '%';

    // Haptic warning 3 sekund qolganda
    if (timeLeft === 3 && window.FIKRA && tg && tg.HapticFeedback) {
      try { tg.HapticFeedback.notificationOccurred('warning'); } catch {}
    }

    if (timeLeft <= 0) { stop(); _end('timeout'); }
  }

  function _nextColorWord() {
    wordIdx = Math.floor(Math.random() * 4);
    do { colorIdx = Math.floor(Math.random() * 4); } while (colorIdx === wordIdx);

    if (els.word) {
      els.word.textContent = WORDS[wordIdx];
      els.word.style.color = COLORS[colorIdx].hex;
    }

    const shuffled = [0, 1, 2, 3].sort(() => Math.random() - .5);
    if (els.answerBtns) {
      els.answerBtns.forEach((btn, i) => {
        btn.textContent = COLORS[shuffled[i]].name;
        btn.className = 'stroop-ans';
        btn.dataset.colorIdx = shuffled[i];
        btn.style.pointerEvents = 'auto';
      });
    }
  }

  function answerColor(btnEl) {
    if (!gameActive) return;
    const chosen = parseInt(btnEl.dataset.colorIdx);
    // Tugmalarni vaqtincha qulflash (double-tap oldini olish)
    if (els.answerBtns) els.answerBtns.forEach(b => b.style.pointerEvents = 'none');

    if (chosen === colorIdx) {
      btnEl.classList.add('correct');
      score += 10; correctCount++;
      timeLeft = INITIAL_TIME;
      _updateScore();
      // Haptic success
      if (tg && tg.HapticFeedback) { try { tg.HapticFeedback.impactOccurred('light'); } catch {} }
      setTimeout(_nextColorWord, 400);
    } else {
      btnEl.classList.add('wrong');
      lives--; wrongCount++;
      _updateHearts();
      // Haptic error
      if (tg && tg.HapticFeedback) { try { tg.HapticFeedback.notificationOccurred('error'); } catch {} }
      // To'g'ri javobni ham yoqib ko'rsatish
      if (els.answerBtns) {
        els.answerBtns.forEach(b => {
          if (parseInt(b.dataset.colorIdx) === colorIdx) b.classList.add('correct');
        });
      }
      if (lives <= 0) { stop(); setTimeout(() => _end('no_lives'), 800); return; }
      setTimeout(_nextColorWord, 800);
    }
  }

  function _nextTF() {
    wordIdx = Math.floor(Math.random() * 4);
    colorIdx = Math.floor(Math.random() * 4);
    tfCorrect = wordIdx === colorIdx;

    if (els.tfCircle) {
      els.tfCircle.style.background = COLORS[colorIdx].hex + '33';
      els.tfCircle.style.borderColor = COLORS[colorIdx].hex + '66';
    }
    if (els.tfWord) {
      els.tfWord.textContent = WORDS[wordIdx];
      els.tfWord.style.color = COLORS[colorIdx].hex;
    }
  }

  function answerTF(isTrue) {
    if (!gameActive) return;
    const correct = isTrue === tfCorrect;
    if (correct) {
      if (els.tfCircle) els.tfCircle.style.borderColor = '#00d4aa';
      score += 10; correctCount++;
      timeLeft = INITIAL_TIME;
      _updateScore();
      if (tg && tg.HapticFeedback) { try { tg.HapticFeedback.impactOccurred('light'); } catch {} }
      setTimeout(_nextTF, 350);
    } else {
      if (els.tfCircle) els.tfCircle.style.borderColor = '#ff5f7e';
      lives--; wrongCount++;
      _updateHearts();
      if (tg && tg.HapticFeedback) { try { tg.HapticFeedback.notificationOccurred('error'); } catch {} }
      if (lives <= 0) { stop(); setTimeout(() => _end('no_lives'), 600); return; }
      setTimeout(_nextTF, 600);
    }
  }

  function _updateScore() {
    if (els.scoreEl) els.scoreEl.textContent = score + ' ball';
  }
  function _updateTimer() {
    if (els.timerEl) {
      els.timerEl.textContent = timeLeft;
      els.timerEl.className = 'stimer' + (timeLeft <= 4 ? ' warn' : '');
    }
  }
  function _updateHearts() {
    if (!els.hearts) return;
    els.hearts.forEach((h, i) => {
      h.classList.toggle('lost', i >= lives);
    });
  }

  async function _end(reason) {
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    const tokensEarned = Math.min(Math.floor(score / 10), 20);
    const gameType = mode === 0 ? 'stroop-color' : 'stroop-tf';

    // Best score yangilansa
    const isNewBest = score > bestScore;
    if (isNewBest) {
      bestScore = score;
      try { localStorage.setItem('fikra_stroop_best', String(bestScore)); } catch {}
    }

    let result = null;
    try {
      result = await API.stroopResult(gameType, score, correctCount, wrongCount, durationSec);
    } catch {}

    if (tokensEarned > 0) {
      window.FIKRA && window.FIKRA.updateTokenDisplay();
    }

    // Natija ekranini ko'rsatish (to'liq UI — reklama majburiy emas)
    if (window.FIKRA && window.FIKRA.showStroopResult) {
      window.FIKRA.showStroopResult({
        score, bestScore, isNewBest,
        correctCount, wrongCount, durationSec,
        tokensEarned, reason, mode,
        xp: result?.xp,
      });
    }
  }

  function getBestScore() { return bestScore; }

  return {
    init, start, stop,
    answerColor, answerTF,
    getBestScore,
  };
})();

window.STROOP = STROOP;
