// ─── Level API routes ───────────────────────────────────────────────────────
// /api/level/*
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const levelService = require('../services/levelService');

// GET /api/level/current — joriy oy daraja ma'lumotlari
router.get('/current', authMiddleware, async (req, res, next) => {
  try {
    const level = await levelService.getLevel(req.user._id);
    res.json(level);
  } catch (err) { next(err); }
});

// GET /api/level/history — oylik tarix
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const data = await levelService.getLevelHistory(req.user._id);
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
