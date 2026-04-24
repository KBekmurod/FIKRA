// ─── Musiqa tizimi ────────────────────────────────────────────────────────────
// YECHIM: Tashqi CDN dan fayl yuklamaymiz — Web Audio API binaural generate qiladi
// Har trek: binaural parametrlar (base + beat frequency)

const TRACKS = [
  { id: 'focus_alpha', category: 'focus', tier: 'free', title: 'Alpha Focus',
    artist: 'FIKRA Binaural', duration: 1800, type: 'binaural',
    params: { base: 200, beat: 10 }, coverEmoji: '🎯',
    description: '10Hz Alpha — diqqatni jamlash' },
  { id: 'focus_beta', category: 'focus', tier: 'pro', title: 'Beta Study',
    artist: 'FIKRA Binaural', duration: 2400, type: 'binaural',
    params: { base: 250, beat: 18 }, coverEmoji: '🧠',
    description: '18Hz Beta — faol tafakkur' },

  { id: 'relax_theta', category: 'relax', tier: 'free', title: 'Theta Calm',
    artist: 'FIKRA Binaural', duration: 2400, type: 'binaural',
    params: { base: 180, beat: 6 }, coverEmoji: '🌊',
    description: '6Hz Theta — chuqur dam olish' },
  { id: 'relax_delta', category: 'relax', tier: 'pro', title: 'Delta Sleep',
    artist: 'FIKRA Binaural', duration: 3600, type: 'binaural',
    params: { base: 160, beat: 2.5 }, coverEmoji: '🌲',
    description: '2.5Hz Delta — uyqu paytida' },

  { id: 'binaural_10hz', category: 'binaural', tier: 'free', title: 'Alpha 10Hz',
    artist: 'FIKRA Binaural', duration: 1800, type: 'binaural',
    params: { base: 200, beat: 10 }, coverEmoji: '🎧',
    description: 'Klassik 10Hz — naushnikda tinglang' },
  { id: 'binaural_gamma', category: 'binaural', tier: 'vip', title: 'Gamma 40Hz',
    artist: 'FIKRA Binaural', duration: 2400, type: 'binaural',
    params: { base: 300, beat: 40 }, coverEmoji: '⚡',
    description: 'VIP — 40Hz Gamma, super diqqat' },

  { id: 'lofi_chill', category: 'lofi', tier: 'free', title: 'Chill Alpha',
    artist: 'FIKRA', duration: 2400, type: 'binaural',
    params: { base: 220, beat: 8 }, coverEmoji: '☕',
    description: 'Mashq uchun Alpha 8Hz' },
  { id: 'lofi_midnight', category: 'lofi', tier: 'pro', title: 'Midnight Theta',
    artist: 'FIKRA', duration: 2700, type: 'binaural',
    params: { base: 175, beat: 5 }, coverEmoji: '🌙',
    description: 'Kechki tavakkur Theta 5Hz' },

  { id: 'premium_elite', category: 'premium', tier: 'vip', title: 'Elite Focus',
    artist: 'FIKRA Premium', duration: 3600, type: 'binaural',
    params: { base: 280, beat: 14 }, coverEmoji: '💎',
    description: 'VIP — 14Hz Beta aralash Alpha' },
  { id: 'premium_meditation', category: 'premium', tier: 'vip', title: 'Deep Meditation',
    artist: 'FIKRA Premium', duration: 3600, type: 'binaural',
    params: { base: 150, beat: 4 }, coverEmoji: '🧘',
    description: 'VIP — 4Hz Theta, chuqur meditatsiya' },
];

function getAvailableTracks(user) {
  const plan = user?.plan || 'free';
  const accessLevel = {
    free: ['free'],
    basic: ['free', 'basic'],
    pro: ['free', 'basic', 'pro'],
    vip: ['free', 'basic', 'pro', 'vip'],
    business: ['free', 'basic', 'pro', 'vip'],
  };
  const allowed = accessLevel[plan] || ['free'];
  return TRACKS.map(t => ({ ...t, isLocked: !allowed.includes(t.tier) }));
}

function getTracksByCategory() {
  const cats = {
    focus: { name: "Diqqat", emoji: '🎯', tracks: [] },
    relax: { name: "Dam olish", emoji: '🌊', tracks: [] },
    binaural: { name: "Binaural", emoji: '🎧', tracks: [] },
    lofi: { name: "Lofi", emoji: '☕', tracks: [] },
    premium: { name: "Premium VIP", emoji: '💎', tracks: [] },
  };
  TRACKS.forEach(t => { if (cats[t.category]) cats[t.category].tracks.push(t); });
  return cats;
}

module.exports = { TRACKS, getAvailableTracks, getTracksByCategory };
