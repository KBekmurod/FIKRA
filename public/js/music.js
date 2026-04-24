// ─── FIKRA Music Player ───────────────────────────────────────────────────────
// Binaural generator orqali ijro (fayl yuklash kerak emas)

const MUSIC = (() => {
  let currentTrack = null;
  let playlist = [];
  let onStateChange = null;
  let isPlaying = false;
  let startTime = 0;
  let pausedAt = 0;
  let volume = 0.5;
  let endTimer = null;

  async function play(track) {
    if (!window.BINAURAL) {
      throw new Error('Audio engine yuklanmadi');
    }
    if (track.isLocked) {
      throw new Error(`Bu trek ${track.tier.toUpperCase()} obuna bilan mavjud`);
    }

    // Oldingi trekni to'xtatish
    if (isPlaying) stop();

    currentTrack = track;
    const params = track.params || { base: 200, beat: 10 };
    BINAURAL.start(params.base, params.beat);
    BINAURAL.setVolume(volume);

    isPlaying = true;
    startTime = Date.now();
    pausedAt = 0;

    // Trek tugagach avtomatik keyingi
    if (endTimer) clearTimeout(endTimer);
    endTimer = setTimeout(() => {
      _playNext();
    }, (track.duration || 1800) * 1000);

    // State callback
    if (onStateChange) onStateChange('play');

    // Backend ga log
    if (window.API && window.API.musicPlay) {
      window.API.musicPlay(track.id).catch(() => {});
    }

    return true;
  }

  function pause() {
    if (!isPlaying || !window.BINAURAL) return;
    BINAURAL.stop();
    pausedAt = Date.now() - startTime; // elapsed ms
    isPlaying = false;
    if (endTimer) { clearTimeout(endTimer); endTimer = null; }
    if (onStateChange) onStateChange('pause');
  }

  function resume() {
    if (isPlaying || !currentTrack) return;
    const params = currentTrack.params || { base: 200, beat: 10 };
    BINAURAL.start(params.base, params.beat);
    BINAURAL.setVolume(volume);
    isPlaying = true;
    startTime = Date.now() - pausedAt; // davom ettirish

    const remainingSec = (currentTrack.duration || 1800) - Math.floor(pausedAt / 1000);
    if (remainingSec > 0) {
      endTimer = setTimeout(() => _playNext(), remainingSec * 1000);
    }
    if (onStateChange) onStateChange('play');
  }

  function toggle() {
    if (isPlaying) { pause(); return false; }
    if (currentTrack) { resume(); return true; }
    return false;
  }

  function stop() {
    if (window.BINAURAL) BINAURAL.stop();
    isPlaying = false;
    if (endTimer) { clearTimeout(endTimer); endTimer = null; }
    if (onStateChange) onStateChange('pause');
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (window.BINAURAL && isPlaying) BINAURAL.setVolume(volume);
  }
  function getVolume() { return volume; }

  function getCurrentTrack() { return currentTrack; }
  function isPlayingFn() { return isPlaying; }
  function getCurrentTime() {
    if (!isPlaying && !currentTrack) return 0;
    if (!isPlaying) return Math.floor(pausedAt / 1000);
    return Math.floor((Date.now() - startTime) / 1000);
  }
  function getDuration() { return currentTrack ? currentTrack.duration : 0; }

  function setPlaylist(tracks) { playlist = tracks || []; }

  function _playNext() {
    stop();
    if (!playlist.length || !currentTrack) return;
    const idx = playlist.findIndex(t => t.id === currentTrack.id);
    let nextIdx = (idx + 1) % playlist.length;
    // Locked treklarni o'tkazib yuborish
    let tries = 0;
    while (playlist[nextIdx] && playlist[nextIdx].isLocked && tries < playlist.length) {
      nextIdx = (nextIdx + 1) % playlist.length;
      tries++;
    }
    if (playlist[nextIdx] && !playlist[nextIdx].isLocked) {
      play(playlist[nextIdx]).catch(() => {});
    }
  }

  function setStateHandler(cb) { onStateChange = cb; }

  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return {
    play, pause, resume, toggle, stop,
    setVolume, getVolume,
    isPlaying: isPlayingFn, getCurrentTrack,
    getCurrentTime, getDuration,
    setPlaylist, setStateHandler, formatTime,
  };
})();

window.MUSIC = MUSIC;
