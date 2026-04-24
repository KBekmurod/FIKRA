// ─── FIKRA Binaural Generator ─────────────────────────────────────────────────
// Web Audio API orqali ikki xil chastotadagi tovush generate qilish
// Fayl kerak emas — brauzer o'zi yaratadi
// Alpha, Theta, Beta, Gamma to'lqinlarni simulate qiladi

const BINAURAL = (() => {
  let audioContext = null;
  let leftOsc = null;
  let rightOsc = null;
  let merger = null;
  let gainNode = null;
  let isPlaying = false;
  let currentFreq = { base: 200, beat: 10 };

  function init() {
    if (audioContext) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API mavjud emas');
    }
    audioContext = new AudioCtx();
  }

  // baseFreq = asosiy chastota (200-500 Hz)
  // beatFreq = ikki quloq orasidagi farq (1-40 Hz):
  //   0.5-4 Hz = Delta (chuqur uyqu)
  //   4-8 Hz = Theta (meditatsiya, ijod)
  //   8-14 Hz = Alpha (xotirjamlik, o'rganish)
  //   14-30 Hz = Beta (faol tafakkur)
  //   30-40 Hz = Gamma (yuqori diqqat)
  function start(baseFreq, beatFreq) {
    init();
    stop();

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    currentFreq = { base: baseFreq || 200, beat: beatFreq || 10 };

    // Chap quloqqa — base frequency
    leftOsc = audioContext.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.value = currentFreq.base;

    // O'ng quloqqa — base + beat frequency
    rightOsc = audioContext.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.value = currentFreq.base + currentFreq.beat;

    // Stereo merger — chap va o'ngni alohida
    merger = audioContext.createChannelMerger(2);

    // Gain (volume) controller
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.05; // past ovoz — quloqqa zarar bermasligi uchun

    // Connect
    leftOsc.connect(merger, 0, 0);   // chap kanal
    rightOsc.connect(merger, 0, 1);  // o'ng kanal
    merger.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Smooth start (fade in)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 1.5);

    leftOsc.start();
    rightOsc.start();
    isPlaying = true;
  }

  function stop() {
    if (!isPlaying) return;
    try {
      if (gainNode) {
        // Smooth stop (fade out)
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      }
      setTimeout(() => {
        try { leftOsc && leftOsc.stop(); } catch {}
        try { rightOsc && rightOsc.stop(); } catch {}
        try { leftOsc && leftOsc.disconnect(); } catch {}
        try { rightOsc && rightOsc.disconnect(); } catch {}
        try { merger && merger.disconnect(); } catch {}
        try { gainNode && gainNode.disconnect(); } catch {}
        leftOsc = rightOsc = merger = gainNode = null;
        isPlaying = false;
      }, 600);
    } catch (e) { console.warn('[Binaural] Stop error:', e); }
  }

  function setVolume(v) {
    if (gainNode) {
      gainNode.gain.setValueAtTime(
        Math.max(0, Math.min(0.15, v * 0.15)),
        audioContext ? audioContext.currentTime : 0
      );
    }
  }

  function getVolume() {
    if (!gainNode) return 0;
    return gainNode.gain.value / 0.15;
  }

  function isRunning() { return isPlaying; }
  function getCurrentFreq() { return { ...currentFreq }; }

  return {
    start, stop,
    setVolume, getVolume,
    isRunning, getCurrentFreq,
  };
})();

window.BINAURAL = BINAURAL;
