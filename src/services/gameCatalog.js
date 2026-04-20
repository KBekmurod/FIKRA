// ─── Yangi o'yinlar katalogi ─────────────────────────────────────────────────
// Avto, kiyim, futbolchi uchun markaziy konstantalar

// ═══════════════════════════════════════════════════════════════════════════
// AVTO TUNING — 8 mashina modeli
// ═══════════════════════════════════════════════════════════════════════════
const CAR_MODELS = {
  lada: {
    id: 'lada', name: 'Lada 2107', emoji: '🚗',
    basePrice: 0,       // bepul (starter)
    baseValue: 500,
    tier: 'common',
    description: 'Boshlang\'ich mashina',
  },
  cobalt: {
    id: 'cobalt', name: 'Chevrolet Cobalt', emoji: '🚙',
    basePrice: 2000,
    baseValue: 2500,
    tier: 'common',
    description: 'Yoshlar orasida mashhur',
  },
  nexia: {
    id: 'nexia', name: 'Daewoo Nexia', emoji: '🚗',
    basePrice: 3500,
    baseValue: 4000,
    tier: 'common',
    description: 'Ishonchli oilaviy mashina',
  },
  captiva: {
    id: 'captiva', name: 'Chevrolet Captiva', emoji: '🚙',
    basePrice: 7000,
    baseValue: 8500,
    tier: 'rare',
    description: 'Katta oilaviy SUV',
  },
  camry: {
    id: 'camry', name: 'Toyota Camry', emoji: '🚙',
    basePrice: 12000,
    baseValue: 15000,
    tier: 'rare',
    description: 'Premium sedan',
  },
  bmw: {
    id: 'bmw', name: 'BMW M5', emoji: '🏎️',
    basePrice: 25000,
    baseValue: 30000,
    tier: 'epic',
    description: 'Sport sedan',
  },
  mercedes: {
    id: 'mercedes', name: 'Mercedes S-Class', emoji: '🏎️',
    basePrice: 35000,
    baseValue: 42000,
    tier: 'epic',
    description: 'Lyuks darajada',
  },
  tesla: {
    id: 'tesla', name: 'Tesla Model S Plaid', emoji: '⚡',
    basePrice: 50000,
    baseValue: 60000,
    tier: 'legendary',
    description: 'Elektr super-kar',
  },
};

// Tuning narxlari (har qism, har daraja uchun)
// Daraja 1-5, har bosqichda narx oshib boradi
const TUNING_COSTS = {
  engine:     [0, 200, 500, 1000, 2000, 4000],   // 0-daraja bepul, 5-daraja 4000t
  suspension: [0, 150, 400, 800, 1500, 3000],
  tires:      [0, 100, 250, 500, 1000, 2000],
  paint:      [0, 80,  200, 400, 800, 1500],
  spoiler:    [0, 120, 300, 600, 1200, 2500],
  rims:       [0, 150, 350, 700, 1400, 2800],
};

// Har qism qiymatni qancha oshiradi (% da)
const TUNING_VALUE_BOOST = {
  engine:     [0, 10, 25, 45, 70, 100],
  suspension: [0, 8, 18, 32, 52, 80],
  tires:      [0, 5, 12, 22, 35, 55],
  paint:      [0, 3, 8, 15, 25, 40],
  spoiler:    [0, 4, 10, 18, 30, 45],
  rims:       [0, 6, 15, 28, 45, 70],
};

const CAR_COLORS = ['white', 'black', 'red', 'blue', 'silver', 'orange', 'yellow'];

function calculateCarValue(car) {
  if (!car) return 0;
  const model = CAR_MODELS[car.carModel];
  if (!model) return 0;
  const base = model.baseValue;
  let totalBoost = 0;
  if (car.tuning) {
    for (const part of Object.keys(TUNING_VALUE_BOOST)) {
      const level = car.tuning[part] || 0;
      totalBoost += TUNING_VALUE_BOOST[part][level] || 0;
    }
  }
  return Math.round(base * (1 + totalBoost / 100));
}

// ═══════════════════════════════════════════════════════════════════════════
// FASHION DESIGN — 5 uslub
// ═══════════════════════════════════════════════════════════════════════════
const OUTFIT_STYLES = {
  classic: {
    id: 'classic', name: 'Klassik', emoji: '👗',
    basePrice: 0, baseValue: 300,
    description: 'Zamonaviy klassika',
  },
  sport: {
    id: 'sport', name: 'Sport', emoji: '👟',
    basePrice: 1000, baseValue: 1500,
    description: 'Faol hayot tarzi',
  },
  bohem: {
    id: 'bohem', name: 'Bohem', emoji: '🎨',
    basePrice: 2500, baseValue: 3200,
    description: 'Erkin va ijodiy',
  },
  casual: {
    id: 'casual', name: 'Casual', emoji: '👚',
    basePrice: 1500, baseValue: 2000,
    description: 'Kundalik kiyim',
  },
  formal: {
    id: 'formal', name: 'Formal', emoji: '💼',
    basePrice: 5000, baseValue: 7000,
    description: 'Rasmiy uchrashuvlar uchun',
  },
};

const OUTFIT_COLORS = ['black', 'white', 'red', 'blue', 'pink', 'green', 'purple', 'gold', 'beige'];
const OUTFIT_PATTERNS = ['plain', 'stripes', 'floral', 'geometric', 'animal'];

const FASHION_DESIGN_COSTS = {
  recolor:    100,  // rang o'zgartirish
  pattern:    200,  // naqsh
  accessory:  300,  // aksessuar qo'shish
  premium:    500,  // premium effekt
};

function calculateOutfitValue(outfit) {
  if (!outfit) return 0;
  const style = OUTFIT_STYLES[outfit.outfitStyle];
  if (!style) return 0;
  let base = style.baseValue;
  // Har qism dizayn = qiymat oshadi
  const parts = outfit.outfitParts || {};
  let extraValue = 0;
  ['top', 'bottom', 'shoes'].forEach(p => {
    if (parts[p]?.color) extraValue += 50;
    if (parts[p]?.pattern && parts[p].pattern !== 'plain') extraValue += 150;
  });
  if (parts.accessory) extraValue += 200;
  return base + extraValue;
}

// ═══════════════════════════════════════════════════════════════════════════
// FOOTBALL MASTER LIGA — 8 klub, ~40 futbolchi
// ═══════════════════════════════════════════════════════════════════════════
const FOOTBALL_CLUBS = {
  bunyodkor:  { id: 'bunyodkor',  name: 'Bunyodkor',     emoji: '⚽', country: 'UZB', tier: 'common' },
  pakhtakor:  { id: 'pakhtakor',  name: 'Paxtakor',      emoji: '⚽', country: 'UZB', tier: 'common' },
  nasaf:      { id: 'nasaf',      name: 'Nasaf',         emoji: '⚽', country: 'UZB', tier: 'common' },
  lokomotiv:  { id: 'lokomotiv',  name: 'Lokomotiv',     emoji: '⚽', country: 'UZB', tier: 'rare' },
  real:       { id: 'real',       name: 'Real Madrid',   emoji: '🏆', country: 'ESP', tier: 'epic' },
  barca:      { id: 'barca',      name: 'Barcelona',     emoji: '🏆', country: 'ESP', tier: 'epic' },
  mancity:    { id: 'mancity',    name: 'Manchester City', emoji: '🏆', country: 'ENG', tier: 'legendary' },
  psg:        { id: 'psg',        name: 'PSG',           emoji: '🏆', country: 'FRA', tier: 'legendary' },
};

// Starter futbolchilar (yangi foydalanuvchi tanlagan klubda)
const STARTER_PLAYERS = {
  GK:  { position: 'GK',  baseStats: { speed: 45, skill: 60, shot: 20, defense: 70 } },
  DEF: { position: 'DEF', baseStats: { speed: 55, skill: 50, shot: 40, defense: 75 } },
  MID: { position: 'MID', baseStats: { speed: 65, skill: 70, shot: 60, defense: 55 } },
  FWD: { position: 'FWD', baseStats: { speed: 75, skill: 65, shot: 80, defense: 35 } },
};

// Har futbolchi narxi (rarity ga qarab)
const PLAYER_COSTS = {
  common:    1000,
  rare:      3500,
  epic:      10000,
  legendary: 30000,
};

// Upgrade narxi (har stat +1 uchun)
const STAT_UPGRADE_COST = 200;

function calculatePlayerValue(player) {
  if (!player) return 0;
  const stats = player.playerStats || {};
  const total = (stats.speed || 0) + (stats.skill || 0) + (stats.shot || 0) + (stats.defense || 0);
  const base = PLAYER_COSTS[player.rarity] || 500;
  // Jami stats / 400 * 1.5 multiplier
  return Math.round(base + total * 5);
}

// ═══════════════════════════════════════════════════════════════════════════
// SAVDO-SOTIQ SOLIG'I
// ═══════════════════════════════════════════════════════════════════════════
const MARKET_TAX_PERCENT = 3; // Har savdo-sotiqda 3% olinadi

module.exports = {
  CAR_MODELS, CAR_COLORS, TUNING_COSTS, TUNING_VALUE_BOOST,
  OUTFIT_STYLES, OUTFIT_COLORS, OUTFIT_PATTERNS, FASHION_DESIGN_COSTS,
  FOOTBALL_CLUBS, STARTER_PLAYERS, PLAYER_COSTS, STAT_UPGRADE_COST,
  MARKET_TAX_PERCENT,
  calculateCarValue,
  calculateOutfitValue,
  calculatePlayerValue,
};
