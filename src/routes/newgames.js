const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ng = require('../services/newGamesService');
const cat = require('../services/gameCatalog');
const { logger } = require('../utils/logger');

// GET /api/newgames/catalog
router.get('/catalog', (req, res) => {
  res.json({
    cars: Object.values(cat.CAR_MODELS),
    carColors: cat.CAR_COLORS,
    outfitStyles: Object.values(cat.OUTFIT_STYLES),
    outfitColors: cat.OUTFIT_COLORS,
    outfitPatterns: cat.OUTFIT_PATTERNS,
    clubs: Object.values(cat.FOOTBALL_CLUBS),
    starterPlayers: cat.STARTER_PLAYERS,
  });
});

// GET /api/newgames/inventory/:gameType
router.get('/inventory/:gameType', authMiddleware, async (req, res, next) => {
  try {
    const { gameType } = req.params;
    if (!['auto', 'fashion', 'football'].includes(gameType)) {
      return res.status(400).json({ error: "Yaroqsiz o'yin turi" });
    }
    if (gameType !== 'football') {
      await ng.ensureStarterItem(req.user, gameType);
    }
    const items = await ng.getUserInventory(req.user._id, gameType);
    res.json({ items });
  } catch (err) { next(err); }
});

// POST /api/newgames/football/start
router.post('/football/start', authMiddleware, async (req, res, next) => {
  try {
    const { clubId } = req.body;
    if (!clubId) return res.status(400).json({ error: 'Klub tanlang' });
    const players = await ng.ensureStarterItem(req.user, 'football', { clubId });
    if (!players) return res.status(400).json({ error: 'Siz allaqachon jamoa yaratgansiz' });
    res.json({ success: true, players });
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

// POST /api/newgames/fashion/design
router.post('/fashion/design', authMiddleware, async (req, res, next) => {
  try {
    const { outfitId, updates } = req.body;
    const result = await ng.updateOutfit(req.user, outfitId, updates || {});
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// POST /api/newgames/football/upgrade
router.post('/football/upgrade', authMiddleware, async (req, res, next) => {
  try {
    const { playerId, stat } = req.body;
    const result = await ng.upgradePlayerStat(req.user, playerId, stat);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// POST /api/newgames/football/match
router.post('/football/match', authMiddleware, async (req, res, next) => {
  try {
    const sim = require('../services/footballSimulator');
    const result = await sim.playMatchVsBot(req.user);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// GET /api/newgames/market
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
    const { itemId } = req.body;
    const item = await ng.listForSale(req.user, itemId);
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

// POST /api/newgames/market/trade
router.post('/market/trade', authMiddleware, async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const result = await ng.tradeFromMarket(req.user, itemId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

module.exports = router;
