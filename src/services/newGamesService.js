// ─── Yangi o'yinlar xizmati ─────────────────────────────────────────────────
// Avto, kiyim, futbolchi — umumiy logika (harid, savdo, upgrade)

const GameInventory = require('../models/GameInventory');
const User = require('../models/User');
const { spendTokens, earnTokens } = require('./tokenService');
const { addXp } = require('./rankService');
const { logger } = require('../utils/logger');
const cat = require('./gameCatalog');

// ─── Ro'yxat olish ──────────────────────────────────────────────────────────
async function getUserInventory(userId, gameType) {
  const items = await GameInventory.find({ userId, gameType }).lean();
  // Qiymat hisoblash
  return items.map(it => {
    if (gameType === 'auto') it.value = cat.calculateCarValue(it);
    else if (gameType === 'fashion') it.value = cat.calculateOutfitValue(it);
    else if (gameType === 'football') it.value = cat.calculatePlayerValue(it);
    return it;
  });
}

// ─── Starter (yangi o'yinchi bepul olyapti) ────────────────────────────────
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
      name: 'Mening birinchi liboslim',
      outfitStyle: 'classic',
      outfitParts: { top: { color: 'white' }, bottom: { color: 'black' }, shoes: { color: 'black' } },
      acquiredFrom: 'starter',
    };
  } else if (gameType === 'football') {
    const clubId = opts.clubId || 'bunyodkor';
    const club = cat.FOOTBALL_CLUBS[clubId];
    if (!club) throw new Error('Yaroqsiz klub');
    // 4 ta boshlang'ich futbolchi (GK + DEF + MID + FWD)
    const players = [];
    for (const [pos, tpl] of Object.entries(cat.STARTER_PLAYERS)) {
      players.push({
        userId: user._id, telegramId: user.telegramId,
        gameType: 'football', itemType: 'player',
        name: `${pos} ${club.name}`,
        rarity: 'common',
        playerPosition: pos,
        playerStats: { ...tpl.baseStats },
        clubId,
        acquiredFrom: 'starter',
      });
    }
    await GameInventory.insertMany(players);
    logger.info(`Starter football team: user=${user.telegramId} club=${clubId}`);
    return players;
  }

  if (item) {
    const saved = await GameInventory.create(item);
    logger.info(`Starter item: user=${user.telegramId} game=${gameType}`);
    return saved;
  }
}

// ─── Yangi mashina sotib olish ─────────────────────────────────────────────
async function buyCar(user, carModelId) {
  const model = cat.CAR_MODELS[carModelId];
  if (!model) throw new Error('Yaroqsiz mashina');
  if (model.basePrice <= 0) throw new Error('Bu mashina savdoga chiqmagan');

  if (user.tokens < model.basePrice) {
    const e = new Error(`Token yetarli emas (${model.basePrice}t kerak)`);
    e.code = 'INSUFFICIENT_TOKENS';
    throw e;
  }

  // Token sarflash (atomic)
  await spendTokens(user._id, user.telegramId, model.basePrice, 'buy_car', { carModel: carModelId });

  // Inventarga qo'shish
  const car = await GameInventory.create({
    userId: user._id, telegramId: user.telegramId,
    gameType: 'auto', itemType: 'car',
    name: model.name,
    carModel: carModelId, carColor: 'white',
    tuning: { engine: 0, suspension: 0, tires: 0, paint: 0, spoiler: 0, rims: 0 },
    rarity: model.tier,
    acquiredFrom: 'purchase',
  });

  // XP
  addXp(user._id, user.telegramId, 20, 'buy_car', { carModel: carModelId }).catch(() => {});

  return car;
}

// ─── Tuning upgrade ────────────────────────────────────────────────────────
async function upgradeTuning(user, carId, part) {
  const car = await GameInventory.findOne({ _id: carId, userId: user._id, gameType: 'auto' });
  if (!car) throw new Error('Mashina topilmadi');

  if (!cat.TUNING_COSTS[part]) throw new Error('Yaroqsiz tuning qismi');

  const currentLevel = (car.tuning && car.tuning[part]) || 0;
  if (currentLevel >= 5) throw new Error('Maksimal daraja');

  const nextLevel = currentLevel + 1;
  const cost = cat.TUNING_COSTS[part][nextLevel];

  if (user.tokens < cost) {
    const e = new Error(`Token yetarli emas (${cost}t kerak)`);
    e.code = 'INSUFFICIENT_TOKENS';
    throw e;
  }

  await spendTokens(user._id, user.telegramId, cost, 'tuning', { carId, part, level: nextLevel });

  car.tuning[part] = nextLevel;
  car.markModified('tuning');
  await car.save();

  addXp(user._id, user.telegramId, 5, 'tuning', { part, level: nextLevel }).catch(() => {});

  return {
    car: car.toObject(),
    newValue: cat.calculateCarValue(car),
  };
}

// ─── Mashina rangini o'zgartirish ──────────────────────────────────────────
async function changeCarColor(user, carId, color) {
  if (!cat.CAR_COLORS.includes(color)) throw new Error('Yaroqsiz rang');

  const car = await GameInventory.findOne({ _id: carId, userId: user._id, gameType: 'auto' });
  if (!car) throw new Error('Mashina topilmadi');

  const cost = 50; // rang o'zgartirish
  if (user.tokens < cost) {
    const e = new Error('Token yetarli emas');
    e.code = 'INSUFFICIENT_TOKENS';
    throw e;
  }

  await spendTokens(user._id, user.telegramId, cost, 'car_paint', { color });
  car.carColor = color;
  await car.save();
  return car.toObject();
}

// ─── FASHION: kiyim dizayn o'zgartirish ────────────────────────────────────
async function updateOutfit(user, outfitId, updates) {
  const outfit = await GameInventory.findOne({ _id: outfitId, userId: user._id, gameType: 'fashion' });
  if (!outfit) throw new Error('Libos topilmadi');

  let totalCost = 0;
  const p = outfit.outfitParts || {};

  if (updates.top) {
    if (updates.top.color) totalCost += cat.FASHION_DESIGN_COSTS.recolor;
    if (updates.top.pattern && updates.top.pattern !== 'plain') totalCost += cat.FASHION_DESIGN_COSTS.pattern;
  }
  if (updates.bottom) {
    if (updates.bottom.color) totalCost += cat.FASHION_DESIGN_COSTS.recolor;
    if (updates.bottom.pattern && updates.bottom.pattern !== 'plain') totalCost += cat.FASHION_DESIGN_COSTS.pattern;
  }
  if (updates.shoes) {
    if (updates.shoes.color) totalCost += cat.FASHION_DESIGN_COSTS.recolor;
  }
  if (updates.accessory) totalCost += cat.FASHION_DESIGN_COSTS.accessory;

  if (totalCost === 0) throw new Error('O\'zgarish yo\'q');

  if (user.tokens < totalCost) {
    const e = new Error(`Token yetarli emas (${totalCost}t kerak)`);
    e.code = 'INSUFFICIENT_TOKENS';
    throw e;
  }

  await spendTokens(user._id, user.telegramId, totalCost, 'fashion_design', { outfitId });

  // Parts ni merge qilish
  if (updates.top) outfit.outfitParts.top = { ...(p.top || {}), ...updates.top };
  if (updates.bottom) outfit.outfitParts.bottom = { ...(p.bottom || {}), ...updates.bottom };
  if (updates.shoes) outfit.outfitParts.shoes = { ...(p.shoes || {}), ...updates.shoes };
  if (updates.accessory) outfit.outfitParts.accessory = updates.accessory;
  outfit.markModified('outfitParts');
  await outfit.save();

  addXp(user._id, user.telegramId, 5, 'fashion_design').catch(() => {});

  return {
    outfit: outfit.toObject(),
    newValue: cat.calculateOutfitValue(outfit),
    cost: totalCost,
  };
}

// ─── FASHION: yangi uslub sotib olish ──────────────────────────────────────
async function buyOutfitStyle(user, styleId) {
  const style = cat.OUTFIT_STYLES[styleId];
  if (!style) throw new Error('Yaroqsiz uslub');
  if (style.basePrice <= 0) throw new Error('Bu uslub sotuvga chiqmagan');

  if (user.tokens < style.basePrice) {
    const e = new Error('Token yetarli emas');
    e.code = 'INSUFFICIENT_TOKENS';
    throw e;
  }

  await spendTokens(user._id, user.telegramId, style.basePrice, 'buy_outfit', { styleId });

  const outfit = await GameInventory.create({
    userId: user._id, telegramId: user.telegramId,
    gameType: 'fashion', itemType: 'outfit',
    name: style.name,
    outfitStyle: styleId,
    outfitParts: { top: { color: 'white' }, bottom: { color: 'black' }, shoes: { color: 'black' } },
    acquiredFrom: 'purchase',
  });

  addXp(user._id, user.telegramId, 15, 'buy_outfit').catch(() => {});
  return outfit;
}

// ─── FOOTBALL: stat oshirish ────────────────────────────────────────────────
async function upgradePlayerStat(user, playerId, stat) {
  const player = await GameInventory.findOne({ _id: playerId, userId: user._id, gameType: 'football' });
  if (!player) throw new Error('Futbolchi topilmadi');

  const validStats = ['speed', 'skill', 'shot', 'defense'];
  if (!validStats.includes(stat)) throw new Error('Yaroqsiz stat');

  const currentVal = player.playerStats[stat] || 0;
  if (currentVal >= 99) throw new Error('Maksimal daraja');

  const cost = cat.STAT_UPGRADE_COST;
  if (user.tokens < cost) {
    const e = new Error('Token yetarli emas');
    e.code = 'INSUFFICIENT_TOKENS';
    throw e;
  }

  await spendTokens(user._id, user.telegramId, cost, 'player_upgrade', { playerId, stat });

  player.playerStats[stat] = Math.min(99, currentVal + 1);
  player.markModified('playerStats');
  await player.save();

  addXp(user._id, user.telegramId, 3, 'player_upgrade').catch(() => {});

  return {
    player: player.toObject(),
    newValue: cat.calculatePlayerValue(player),
  };
}

// ─── BOZORGA QO'YISH ────────────────────────────────────────────────────────
async function listForSale(user, itemId, priceTokens) {
  if (priceTokens < 10) throw new Error('Minimal narx 10 token');
  if (priceTokens > 1000000) throw new Error('Maksimal narx 1,000,000 token');

  const item = await GameInventory.findOne({ _id: itemId, userId: user._id });
  if (!item) throw new Error('Obyekt topilmadi');
  if (item.acquiredFrom === 'starter') throw new Error('Boshlang\'ich obyektlarni sotib bo\'lmaydi');

  item.isForSale = true;
  item.priceTokens = priceTokens;
  await item.save();

  return item.toObject();
}

async function cancelListing(user, itemId) {
  const item = await GameInventory.findOne({ _id: itemId, userId: user._id });
  if (!item) throw new Error('Obyekt topilmadi');
  item.isForSale = false;
  item.priceTokens = 0;
  await item.save();
  return item.toObject();
}

// ─── Bozordan sotib olish (boshqa o'yinchidan) ─────────────────────────────
async function buyFromMarket(user, itemId) {
  const item = await GameInventory.findOne({ _id: itemId, isForSale: true });
  if (!item) throw new Error('Obyekt sotuvda yo\'q');
  if (String(item.userId) === String(user._id)) throw new Error('O\'z obyektingizni sotib olib bo\'lmaydi');

  const price = item.priceTokens;
  if (user.tokens < price) {
    const e = new Error(`Token yetarli emas (${price}t kerak)`);
    e.code = 'INSUFFICIENT_TOKENS';
    throw e;
  }

  // Soliq — sotuvchi olmagan qism
  const tax = Math.ceil(price * cat.MARKET_TAX_PERCENT / 100);
  const sellerGets = price - tax;

  // Atomic: sotib oluvchidan tushiradi, sotuvchiga beradi (soliqdan tashqari)
  await spendTokens(user._id, user.telegramId, price, 'market_buy', { itemId, tax });
  await earnTokens(item.userId, item.telegramId, sellerGets, 'market_sell', 'bonus',
    { itemId, buyerTgId: user.telegramId, tax });

  // Obyekt egasini o'zgartirish
  item.userId = user._id;
  item.telegramId = user.telegramId;
  item.isForSale = false;
  item.priceTokens = 0;
  item.acquiredFrom = 'trade';
  await item.save();

  addXp(user._id, user.telegramId, 10, 'market_buy').catch(() => {});

  logger.info(`Market trade: ${item.gameType} id=${itemId} buyer=${user.telegramId} seller=${item.telegramId} price=${price} tax=${tax}`);

  return {
    item: item.toObject(),
    paid: price,
    tax,
  };
}

// ─── Bozorni ko'rish ─────────────────────────────────────────────────────────
async function getMarket(gameType, options = {}) {
  const query = { isForSale: true };
  if (gameType) query.gameType = gameType;

  const limit = Math.min(options.limit || 30, 50);
  const sortBy = options.sortBy || 'priceTokens'; // priceTokens, createdAt
  const sortOrder = options.sortOrder === 'desc' ? -1 : 1;

  const items = await GameInventory.find(query)
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .lean();

  // Qiymat qo'shish
  return items.map(it => {
    if (it.gameType === 'auto') it.value = cat.calculateCarValue(it);
    else if (it.gameType === 'fashion') it.value = cat.calculateOutfitValue(it);
    else if (it.gameType === 'football') it.value = cat.calculatePlayerValue(it);
    return it;
  });
}

module.exports = {
  getUserInventory,
  ensureStarterItem,
  buyCar, upgradeTuning, changeCarColor,
  updateOutfit, buyOutfitStyle,
  upgradePlayerStat,
  listForSale, cancelListing, buyFromMarket,
  getMarket,
};
