// ─── FIKRA Music Player ───────────────────────────────────────────────────────
// Audio player with play/pause/volume/skip controls

const MUSIC = (() => {
  let audio = null;
  let currentTrack = null;
  let playlist = [];
  let onStateChange = null;

  function init() {
    if (audio) return;
    audio = new Audio();
    audio.volume = 0.5;
    audio.preload = 'none'; // Data-saver

    audio.addEventListener('ended', () => _playNext());
    audio.addEventListener('play', () => onStateChange && onStateChange('play'));
    audio.addEventListener('pause', () => onStateChange && onStateChange('pause'));
    audio.addEventListener('error', (e) => {
      console.warn('Audio error:', e);
      onStateChange && onStateChange('error');
    });
  }

  async function play(track) {
    init();
    if (track.isLocked) {
      throw new Error(`Bu trek ${track.tier.toUpperCase()} obuna bilan mavjud`);
    }
    currentTrack = track;
    audio.src = track.url;
    try {
      await audio.play();
      // Backend ga log
      if (window.API && window.API.musicPlay) {
        window.API.musicPlay(track.id).catch(() => {});
      }
      return true;
    } catch (e) {
      console.warn('Play error:', e);
      throw e;
    }
  }

  function pause() {
    if (audio && !audio.paused) audio.pause();
  }

  function resume() {
    if (audio && audio.paused && currentTrack) {
      audio.play().catch(() => {});
    }
  }

  function toggle() {
    if (!audio) return false;
    if (audio.paused) {
      audio.play().catch(() => {});
      return true;
    } else {
      audio.pause();
      return false;
    }
  }

  function setVolume(v) {
    if (audio) audio.volume = Math.max(0, Math.min(1, v));
  }

  function getVolume() { return audio ? audio.volume : 0.5; }
  function isPlaying() { return audio && !audio.paused; }
  function getCurrentTrack() { return currentTrack; }
  function getCurrentTime() { return audio ? audio.currentTime : 0; }
  function getDuration() { return audio ? audio.duration : 0; }

  function setPlaylist(tracks) { playlist = tracks || []; }
  function _playNext() {
    if (!playlist.length || !currentTrack) return;
    const idx = playlist.findIndex(t => t.id === currentTrack.id);
    const next = playlist[(idx + 1) % playlist.length];
    if (next && !next.isLocked) play(next).catch(() => {});
  }

  function stop() {
    if (audio) {
      audio.pause();
      audio.src = '';
      currentTrack = null;
    }
  }

  function setStateHandler(cb) { onStateChange = cb; }

  // Format seconds to mm:ss
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return {
    init, play, pause, resume, toggle, stop,
    setVolume, getVolume,
    isPlaying, getCurrentTrack,
    getCurrentTime, getDuration,
    setPlaylist,
    setStateHandler,
    formatTime,
  };
})();

window.MUSIC = MUSIC;
