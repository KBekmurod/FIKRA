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
  let mode = 0;        // 0 = rang turi, 1 = to'g'ri/noto'g'ri
  let score = 0;
  let lives = 3;
  let timeLeft = 12;
  let timer = null;
  let colorIdx = 0;    // so'z rangi indeksi
  let wordIdx = 0;     // so'z matni indeksi
  let tfCorrect = false;
  let correctCount = 0;
  let wrongCount = 0;
  let startTime = 0;

  // DOM refs (app.js tomonidan beriladi)
  let els = {};

  function init(elements) {
    els = elements;
  }

  function start(selectedMode) {
    mode = selectedMode;
    score = 0; lives = 3; timeLeft = 12;
    correctCount = 0; wrongCount = 0;
    startTime = Date.now();

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
  }

  function _tick() {
    timeLeft--;
    _updateTimer();
    if (els.prog) els.prog.style.width = Math.max(0, (timeLeft / 12) * 100) + '%';
    if (timeLeft <= 0) { stop(); _end(); }
  }

  // ─── Mode 0: Rang ─────────────────────────────────────────────────────────
  function _nextColorWord() {
    wordIdx = Math.floor(Math.random() * 4);
    do { colorIdx = Math.floor(Math.random() * 4); } while (colorIdx === wordIdx);

    if (els.word) {
      els.word.textContent = WORDS[wordIdx];
      els.word.style.color = COLORS[colorIdx].hex;
    }

    // Tugmalarni aralash joylashtirish
    const shuffled = [0, 1, 2, 3].sort(() => Math.random() - .5);
    if (els.answerBtns) {
      els.answerBtns.forEach((btn, i) => {
        btn.textContent = COLORS[shuffled[i]].name;
        btn.className = 'stroop-ans';
        btn.dataset.colorIdx = shuffled[i];
      });
    }
  }

  function answerColor(btnEl) {
    const chosen = parseInt(btnEl.dataset.colorIdx);
    if (chosen === colorIdx) {
      btnEl.classList.add('correct');
      score += 10; correctCount++;
      timeLeft = 12; // Resetlash
      _updateScore();
      setTimeout(_nextColorWord, 350);
    } else {
      btnEl.classList.add('wrong');
      lives--; wrongCount++;
      _updateHearts();
      setTimeout(_nextColorWord, 350);
      if (lives <= 0) { stop(); setTimeout(_end, 400); }
    }
  }

  // ─── Mode 1: To'g'ri/Noto'g'ri ───────────────────────────────────────────
  function _nextTF() {
    wordIdx = Math.floor(Math.random() * 4);
    colorIdx = Math.floor(Math.random() * 4);
    tfCorrect = wordIdx === colorIdx; // So'z va rang bir xil?

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
    const correct = isTrue === tfCorrect;
    if (correct) {
      if (els.tfCircle) els.tfCircle.style.borderColor = '#00d4aa';
      score += 10; correctCount++;
      timeLeft = 12;
      _updateScore();
      setTimeout(_nextTF, 350);
    } else {
      if (els.tfCircle) els.tfCircle.style.borderColor = '#ff5f7e';
      lives--; wrongCount++;
      _updateHearts();
      setTimeout(_nextTF, 350);
      if (lives <= 0) { stop(); setTimeout(_end, 400); }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
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

  async function _end() {
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    const tokensEarned = Math.min(Math.floor(score / 10), 20);
    const gameType = mode === 0 ? 'stroop-color' : 'stroop-tf';

    // Serverga yuborish — javobda XP bor
    let result = null;
    try {
      result = await API.stroopResult(gameType, score, correctCount, wrongCount, durationSec);
    } catch {}

    // Token toast
    if (tokensEarned > 0) {
      window.FIKRA && window.FIKRA.showToast(`+${tokensEarned} token yig'ildi!`);
      window.FIKRA && window.FIKRA.updateTokenDisplay();
    }

    // XP va level up ko'rsatish
    if (result && result.xp && window.FIKRA && window.FIKRA.showXpGain) {
      setTimeout(() => {
        window.FIKRA.showXpGain(result.xp.added, result.xp.newRank);
      }, 300);
    }

    // Retry uchun reklama
    setTimeout(() => {
      window.ADS && window.ADS.showRewardedAd('stroop_retry');
    }, 900);
  }

  return { init, start, stop, answerColor, answerTF };
})();

window.STROOP = STROOP;
