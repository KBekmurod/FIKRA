// ─── Yangi o'yinlar servisi (tokensiz) ───────────────────────────────────────
// Avto, Fashion, Football — inventar tizimi.
// Harid va bozor token o'rniga XP yig'ish mexanizmiga ko'chirildi.
// O'yinlar "Sovg'alar" bo'limida — obuna bilan cheksiz, free uchun kuniga 3 partiya.

const GameInventory = require('../models/GameInventory');
const User = require('../models/User');
const { addXp } = require('./rankService');
const { logger } = require('../utils/logger');
const cat = require('./gameCatalog');

// ─── Inventar olish ──────────────────────────────────────────────────────────
async function getUserInventory(userId, gameType) {
  const items = await GameInventory.find({ userId, gameType }).lean();
  return items.map(it => {
    if (gameType === 'auto')     it.value = cat.calculateCarValue(it);
    else if (gameType === 'fashion') it.value = cat.calculateOutfitValue(it);
    else if (gameType === 'football') it.value = cat.calculatePlayerValue(it);
    return it;
  });
}

// ─── Starter (yangi o'yinchi bepul olyapti) ──────────────────────────────────
async function ensureStarterItem(user, gameType, opts = {}) {
  const existing = await GameInventory.countDocuments({
    userId: user._id, gameType, acquiredFrom: 'starter',
  });
  if (existing > 0) return null;

  let item;
  if (gameType === 'auto') {
    item = {
      userId: user._id, telegramId: user.telegramId,
      gameType: 'auto', itemType: 'car',
      name: cat.CAR_MODELS.lada.name,
      carModel: 'lada', carColor: 'white',
      tuning: { engine: 0, suspension: 0, tires: 0, paint: 0, spoiler: 0, rims: 0 },
      acquiredFrom: 'starter',
    };
  } else if (gameType === 'fashion') {
    item = {
      userId: user._id, telegramId: user.telegramId,
      gameType: 'fashion', itemType: 'outfit',
      name: 'Birinchi libosim',
      outfitStyle: 'classic',
      outfitParts: { top: { color: 'white' }, bottom: { color: 'black' }, shoes: { color: 'black' } },
      acquiredFrom: 'starter',
    };
  } else if (gameType === 'football') {
    const clubId = opts.clubId || 'bunyodkor';
    const club = cat.FOOTBALL_CLUBS[clubId];
    if (!club) throw new Error('Yaroqsiz klub');
    const players = [];
    for (const [pos, tpl] of Object.entries(cat.STARTER_PLAYERS)) {
      players.push({
        userId: user._id, telegramId: user.telegramId,
        gameType: 'football', itemType: 'player',
        name: `${pos} · ${club.name}`,
        rarity: 'common',
        playerPosition: pos,
        playerStats: { ...tpl.baseStats },
        clubId,
        acquiredFrom: 'starter',
      });
    }
    await GameInventory.insertMany(players);
    logger.info(`Starter football: user=${user.telegramId} club=${clubId}`);
    return players;
  }

  if (item) {
    const saved = await GameInventory.create(item);
    logger.info(`Starter item: user=${user.telegramId} game=${gameType}`);
    return saved;
  }
}

// ─── AVTO: rang o'zgartirish ─────────────────────────────────────────────────
// Token o'rniga — bepul (foydalanuvchining o'z mashinasi)
async function changeCarColor(user, carId, color) {
  if (!cat.CAR_COLORS.includes(color)) throw new Error('Yaroqsiz rang');
  const car = await GameInventory.findOne({ _id: carId, userId: user._id, gameType: 'auto' });
  if (!car) throw new Error('Mashina topilmadi');
  car.carColor = color;
  await car.save();
  addXp(user._id, user.telegramId, 2, 'car_paint', { color }).catch(() => {});
  return car.toObject();
}

// ─── AVTO: tuning upgrade (XP evaziga, tokensiz) ─────────────────────────────
async function upgradeTuning(user, carId, part) {
  const car = await GameInventory.findOne({ _id: carId, userId: user._id, gameType: 'auto' });
  if (!car) throw new Error('Mashina topilmadi');
  if (!cat.TUNING_COSTS[part]) throw new Error('Yaroqsiz tuning qismi');

  const currentLevel = (car.tuning && car.tuning[part]) || 0;
  if (currentLevel >= 5) throw new Error('Maksimal daraja');

  car.tuning[part] = currentLevel + 1;
  car.markModified('tuning');
  await car.save();

  addXp(user._id, user.telegramId, 10, 'tuning', { part, level: currentLevel + 1 }).catch(() => {});

  return { car: car.toObject(), newValue: cat.calculateCarValue(car) };
}

// ─── FASHION: dizayn o'zgartirish (XP evaziga) ───────────────────────────────
async function updateOutfit(user, outfitId, updates) {
  const outfit = await GameInventory.findOne({ _id: outfitId, userId: user._id, gameType: 'fashion' });
  if (!outfit) throw new Error('Libos topilmadi');

  const p = outfit.outfitParts || {};
  if (updates.top)    outfit.outfitParts.top    = { ...(p.top    || {}), ...updates.top };
  if (updates.bottom) outfit.outfitParts.bottom = { ...(p.bottom || {}), ...updates.bottom };
  if (updates.shoes)  outfit.outfitParts.shoes  = { ...(p.shoes  || {}), ...updates.shoes };
  if (updates.accessory) outfit.outfitParts.accessory = updates.accessory;
  outfit.markModified('outfitParts');
  await outfit.save();

  addXp(user._id, user.telegramId, 5, 'fashion_design').catch(() => {});
  return { outfit: outfit.toObject(), newValue: cat.calculateOutfitValue(outfit) };
}

// ─── FOOTBALL: stat oshirish (XP evaziga) ─────────────────────────────────────
async function upgradePlayerStat(user, playerId, stat) {
  const player = await GameInventory.findOne({ _id: playerId, userId: user._id, gameType: 'football' });
  if (!player) throw new Error('Futbolchi topilmadi');

  const validStats = ['speed', 'skill', 'shot', 'defense'];
  if (!validStats.includes(stat)) throw new Error('Yaroqsiz stat');

  const currentVal = player.playerStats[stat] || 0;
  if (currentVal >= 99) throw new Error('Maksimal daraja');

  player.playerStats[stat] = Math.min(99, currentVal + 1);
  player.markModified('playerStats');
  await player.save();

  addXp(user._id, user.telegramId, 5, 'player_upgrade', { stat }).catch(() => {});
  return { player: player.toObject(), newValue: cat.calculatePlayerValue(player) };
}

// ─── BOZOR — soddalashtirilgan (tokensiz) ─────────────────────────────────────
// Bozor saqlanadi lekin tranzaksiyalar tokensiz
// Kelajakda Stars bilan yoki almashtirish tizimi sifatida ishlatilishi mumkin
async function getMarket(gameType, options = {}) {
  const query = { isForSale: true };
  if (gameType) query.gameType = gameType;
  const limit = Math.min(options.limit || 30, 50);
  const sortBy = options.sortBy || 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 1 : -1;

  const items = await GameInventory.find(query)
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .lean();

  return items.map(it => {
    if (it.gameType === 'auto')     it.value = cat.calculateCarValue(it);
    else if (it.gameType === 'fashion') it.value = cat.calculateOutfitValue(it);
    else if (it.gameType === 'football') it.value = cat.calculatePlayerValue(it);
    return it;
  });
}

async function listForSale(user, itemId) {
  const item = await GameInventory.findOne({ _id: itemId, userId: user._id });
  if (!item) throw new Error('Obyekt topilmadi');
  if (item.acquiredFrom === 'starter') throw new Error("Boshlang'ich obyektlarni sotib bo'lmaydi");
  item.isForSale = true;
  await item.save();
  return item.toObject();
}

async function cancelListing(user, itemId) {
  const item = await GameInventory.findOne({ _id: itemId, userId: user._id });
  if (!item) throw new Error('Obyekt topilmadi');
  item.isForSale = false;
  await item.save();
  return item.toObject();
}

// O'yinchilar o'rtasida almashtirish (tokenlar o'rniga XP sovg'a)
async function tradeFromMarket(user, itemId) {
  const item = await GameInventory.findOne({ _id: itemId, isForSale: true });
  if (!item) throw new Error("Obyekt sotuvda yo'q");
  if (String(item.userId) === String(user._id)) {
    throw new Error("O'z obyektingizni ololmaysiz");
  }

  item.userId = user._id;
  item.telegramId = user.telegramId;
  item.isForSale = false;
  item.acquiredFrom = 'trade';
  await item.save();

  addXp(user._id, user.telegramId, 15, 'market_trade', { itemId }).catch(() => {});

  logger.info(`Trade: ${item.gameType} id=${itemId} to=${user.telegramId}`);
  return { item: item.toObject() };
}

module.exports = {
  getUserInventory,
  ensureStarterItem,
  changeCarColor, upgradeTuning,
  updateOutfit,
  upgradePlayerStat,
  listForSale, cancelListing, tradeFromMarket,
  getMarket,
};
