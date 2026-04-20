const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ng = require('../services/newGamesService');
const cat = require('../services/gameCatalog');
const { logger } = require('../utils/logger');

// ─── KATALOG ─────────────────────────────────────────────────────────────────

// GET /api/newgames/catalog — barcha modellar, uslublar, klublar
router.get('/catalog', (req, res) => {
  res.json({
    cars: Object.values(cat.CAR_MODELS),
    carColors: cat.CAR_COLORS,
    tuningCosts: cat.TUNING_COSTS,
    outfitStyles: Object.values(cat.OUTFIT_STYLES),
    outfitColors: cat.OUTFIT_COLORS,
    outfitPatterns: cat.OUTFIT_PATTERNS,
    fashionCosts: cat.FASHION_DESIGN_COSTS,
    clubs: Object.values(cat.FOOTBALL_CLUBS),
    starterPlayers: cat.STARTER_PLAYERS,
    playerCosts: cat.PLAYER_COSTS,
    statUpgradeCost: cat.STAT_UPGRADE_COST,
    marketTaxPercent: cat.MARKET_TAX_PERCENT,
  });
});

// ─── INVENTAR ───────────────────────────────────────────────────────────────

// GET /api/newgames/inventory/:gameType
router.get('/inventory/:gameType', authMiddleware, async (req, res, next) => {
  try {
    const { gameType } = req.params;
    if (!['auto', 'fashion', 'football'].includes(gameType)) {
      return res.status(400).json({ error: 'Yaroqsiz o\'yin turi' });
    }

    // Starter yo'q bo'lsa — yaratamiz (football uchun clubId kerak)
    if (gameType !== 'football') {
      await ng.ensureStarterItem(req.user, gameType);
    }

    const items = await ng.getUserInventory(req.user._id, gameType);
    res.json({ items });
  } catch (err) { next(err); }
});

// POST /api/newgames/football/start — klub tanlab boshlash
router.post('/football/start', authMiddleware, async (req, res, next) => {
  try {
    const { clubId } = req.body;
    if (!clubId) return res.status(400).json({ error: 'Klub tanlang' });
    const players = await ng.ensureStarterItem(req.user, 'football', { clubId });
    if (!players) {
      return res.status(400).json({ error: 'Siz allaqachon jamoa yaratgansiz' });
    }
    res.json({ success: true, players });
  } catch (err) { next(err); }
});

// ─── AVTO ────────────────────────────────────────────────────────────────────

// POST /api/newgames/auto/buy
router.post('/auto/buy', authMiddleware, async (req, res, next) => {
  try {
    const { carModel } = req.body;
    const car = await ng.buyCar(req.user, carModel);
    res.json({ success: true, car });
  } catch (err) { next(err); }
});

// POST /api/newgames/auto/tuning
router.post('/auto/tuning', authMiddleware, async (req, res, next) => {
  try {
    const { carId, part } = req.body;
    const result = await ng.upgradeTuning(req.user, carId, part);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// POST /api/newgames/auto/paint
router.post('/auto/paint', authMiddleware, async (req, res, next) => {
  try {
    const { carId, color } = req.body;
    const car = await ng.changeCarColor(req.user, carId, color);
    res.json({ success: true, car });
  } catch (err) { next(err); }
});

// ─── FASHION ────────────────────────────────────────────────────────────────

// POST /api/newgames/fashion/buy
router.post('/fashion/buy', authMiddleware, async (req, res, next) => {
  try {
    const { styleId } = req.body;
    const outfit = await ng.buyOutfitStyle(req.user, styleId);
    res.json({ success: true, outfit });
  } catch (err) { next(err); }
});

// POST /api/newgames/fashion/design
router.post('/fashion/design', authMiddleware, async (req, res, next) => {
  try {
    const { outfitId, updates } = req.body;
    const result = await ng.updateOutfit(req.user, outfitId, updates || {});
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ─── FOOTBALL ────────────────────────────────────────────────────────────────

// POST /api/newgames/football/upgrade
router.post('/football/upgrade', authMiddleware, async (req, res, next) => {
  try {
    const { playerId, stat } = req.body;
    const result = await ng.upgradePlayerStat(req.user, playerId, stat);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ─── BOZOR ───────────────────────────────────────────────────────────────────

// GET /api/newgames/market?gameType=auto
router.get('/market', authMiddleware, async (req, res, next) => {
  try {
    const { gameType, limit, sortBy, sortOrder } = req.query;
    const items = await ng.getMarket(gameType, { limit: +limit, sortBy, sortOrder });
    res.json({ items });
  } catch (err) { next(err); }
});

// POST /api/newgames/market/list
router.post('/market/list', authMiddleware, async (req, res, next) => {
  try {
    const { itemId, priceTokens } = req.body;
    const item = await ng.listForSale(req.user, itemId, parseInt(priceTokens));
    res.json({ success: true, item });
  } catch (err) { next(err); }
});

// POST /api/newgames/market/cancel
router.post('/market/cancel', authMiddleware, async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const item = await ng.cancelListing(req.user, itemId);
    res.json({ success: true, item });
  } catch (err) { next(err); }
});

// POST /api/newgames/market/buy
router.post('/market/buy', authMiddleware, async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const result = await ng.buyFromMarket(req.user, itemId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

module.exports = router;
