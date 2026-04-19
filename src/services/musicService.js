// ─── Musiqa tizimi ────────────────────────────────────────────────────────────
// Pro/VIP uchun fon musiqasi — miya faolligi uchun binaural, focus, relax, lofi
// Bepul foydalanuvchilar: 3 ta bepul trek (har birini 1 marta har kuni)
// Pro/VIP: hamma trek, cheksiz

// Trek manbai: xavfsiz CDN (Creative Commons) yoki o'z host
// Hozir: placeholder URL lar (keyin realga almashtirish mumkin)

const TRACKS = [
  // FOCUS — diqqatni jamlash (8-14 Hz alpha to'lqin)
  {
    id: 'focus_1', category: 'focus', tier: 'free',
    title: 'Deep Focus Alpha',
    artist: 'FIKRA Labs',
    duration: 1200, // 20 daq
    bpm: 60, frequency: 10, // Hz alpha
    url: 'https://cdn.pixabay.com/audio/2023/08/31/audio_3c5dd37c78.mp3',
    coverEmoji: '🎯',
    description: 'Alpha to\'lqinlar bilan diqqatni jamlash uchun',
  },
  {
    id: 'focus_2', category: 'focus', tier: 'pro',
    title: 'Study Beats Gamma',
    artist: 'FIKRA Labs',
    duration: 1800,
    bpm: 70, frequency: 40,
    url: 'https://cdn.pixabay.com/audio/2023/06/03/audio_2d3321ed7f.mp3',
    coverEmoji: '🧠',
    description: 'Gamma to\'lqinlar bilan o\'rganishga yordam',
  },

  // RELAX — dam olish
  {
    id: 'relax_1', category: 'relax', tier: 'free',
    title: 'Ocean Calm',
    artist: 'Nature Sounds',
    duration: 1500,
    bpm: 50, frequency: 8,
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_1b33d91e0f.mp3',
    coverEmoji: '🌊',
    description: 'Okean tovushi — xotirjamlik',
  },
  {
    id: 'relax_2', category: 'relax', tier: 'pro',
    title: 'Forest Theta',
    artist: 'FIKRA Labs',
    duration: 1800,
    bpm: 45, frequency: 6,
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    coverEmoji: '🌲',
    description: 'Theta to\'lqinlar — chuqur dam olish',
  },

  // BINAURAL — ikki quloq har xil chastota (miya tezlashadi)
  {
    id: 'binaural_1', category: 'binaural', tier: 'free',
    title: 'Alpha 10Hz',
    artist: 'FIKRA Binaural',
    duration: 1800,
    bpm: 0, frequency: 10,
    url: 'https://cdn.pixabay.com/audio/2024/02/26/audio_81deaa9d77.mp3',
    coverEmoji: '🎧',
    description: 'Faqat naushnikda tinglang',
  },
  {
    id: 'binaural_2', category: 'binaural', tier: 'vip',
    title: 'Gamma 40Hz Pro',
    artist: 'FIKRA Binaural',
    duration: 2400,
    bpm: 0, frequency: 40,
    url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e1b1cbdea4.mp3',
    coverEmoji: '⚡',
    description: 'VIP — kuchli gamma to\'lqin, super diqqat',
  },

  // LOFI — fon uchun
  {
    id: 'lofi_1', category: 'lofi', tier: 'free',
    title: 'Chill Study',
    artist: 'Lofi Cafe',
    duration: 2400,
    bpm: 75, frequency: 0,
    url: 'https://cdn.pixabay.com/audio/2024/08/27/audio_b0bbb70ad8.mp3',
    coverEmoji: '☕',
    description: 'Qahvaxonada o\'qish kabi',
  },
  {
    id: 'lofi_2', category: 'lofi', tier: 'pro',
    title: 'Midnight Beats',
    artist: 'Lofi Cafe',
    duration: 2700,
    bpm: 80, frequency: 0,
    url: 'https://cdn.pixabay.com/audio/2024/05/11/audio_cec6146fec.mp3',
    coverEmoji: '🌙',
    description: 'Kechki o\'rganish uchun',
  },

  // PREMIUM VIP kolleksiya
  {
    id: 'premium_1', category: 'premium', tier: 'vip',
    title: 'Elite Focus',
    artist: 'FIKRA Premium',
    duration: 3600,
    bpm: 65, frequency: 14,
    url: 'https://cdn.pixabay.com/audio/2023/05/09/audio_99cf37f76d.mp3',
    coverEmoji: '💎',
    description: 'VIP — 1 soat cheksiz diqqat',
  },
  {
    id: 'premium_2', category: 'premium', tier: 'vip',
    title: 'Deep Meditation',
    artist: 'FIKRA Premium',
    duration: 3600,
    bpm: 40, frequency: 5,
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_9e3bf38c56.mp3',
    coverEmoji: '🧘',
    description: 'VIP — chuqur meditatsiya',
  },
];

function getAvailableTracks(user) {
  const plan = user?.plan || 'free';
  // free → faqat tier: 'free'
  // basic → free + basic
  // pro → free + basic + pro
  // vip, business → hammasi
  const accessLevel = {
    free: ['free'],
    basic: ['free', 'basic'],
    pro: ['free', 'basic', 'pro'],
    vip: ['free', 'basic', 'pro', 'vip'],
    business: ['free', 'basic', 'pro', 'vip'],
  };
  const allowed = accessLevel[plan] || ['free'];
  return TRACKS.map(t => ({
    ...t,
    isLocked: !allowed.includes(t.tier),
  }));
}

function getTracksByCategory() {
  const cats = {
    focus: { name: "Diqqat", emoji: '🎯', tracks: [] },
    relax: { name: "Dam olish", emoji: '🌊', tracks: [] },
    binaural: { name: "Binaural", emoji: '🎧', tracks: [] },
    lofi: { name: "Lofi", emoji: '☕', tracks: [] },
    premium: { name: "Premium VIP", emoji: '💎', tracks: [] },
  };
  TRACKS.forEach(t => {
    if (cats[t.category]) cats[t.category].tracks.push(t);
  });
  return cats;
}

module.exports = {
  TRACKS,
  getAvailableTracks,
  getTracksByCategory,
};
