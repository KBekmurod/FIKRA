const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const music = require('../services/musicService');
const tournament = require('../services/tournamentService');
const { logger } = require('../utils/logger');

// ─── MUSIQA ──────────────────────────────────────────────────────────────────

// GET /api/content/music — barcha mavjud trek
router.get('/music', authMiddleware, (req, res) => {
  const tracks = music.getAvailableTracks(req.user);
  res.json({ tracks });
});

// GET /api/content/music/categories — kategoriyalar
router.get('/music/categories', authMiddleware, (req, res) => {
  const cats = music.getTracksByCategory();
  const plan = req.user?.plan || 'free';
  // Tier cheklov qo'shish
  Object.values(cats).forEach(cat => {
    cat.tracks = cat.tracks.map(t => ({
      ...t,
      isLocked: !music.getAvailableTracks(req.user).find(x => x.id === t.id && !x.isLocked),
    }));
  });
  res.json({ categories: cats, userPlan: plan });
});

// POST /api/content/music/play — tinglash log (analitika uchun)
router.post('/music/play', authMiddleware, async (req, res) => {
  const { trackId } = req.body;
  logger.info(`Music play: user=${req.user.telegramId} track=${trackId}`);
  res.json({ success: true });
});

// ─── TURNIR ──────────────────────────────────────────────────────────────────

// GET /api/content/tournaments — faol turnirlar
router.get('/tournaments', authMiddleware, async (req, res, next) => {
  try {
    const active = await tournament.getActiveTournaments();
    // Vaqtni qo'shish
    const withTime = active.map(t => ({
      ...t,
      timeLeft: tournament.getTimeLeft(t.endAt),
      participantCount: (t.participants || []).length,
    }));
    res.json({ tournaments: withTime });
  } catch (e) { next(e); }
});

// GET /api/content/tournaments/weekly — haftalik turnir reytingi
router.get('/tournaments/weekly', authMiddleware, async (req, res, next) => {
  try {
    let ranking = await tournament.getActiveWeeklyRanking(50);
    if (!ranking) {
      // Yo'q bo'lsa — yarat
      await tournament.createWeeklyTournament();
      ranking = await tournament.getActiveWeeklyRanking(50);
    }

    // Foydalanuvchining pozitsiyasini topish
    let myPosition = null;
    if (ranking && ranking.ranking) {
      const my = ranking.ranking.find(r => r.telegramId === req.user.telegramId);
      if (my) myPosition = my.rank;
    }

    res.json({
      ...ranking,
      timeLeft: ranking ? tournament.getTimeLeft(ranking.tournament.endAt) : null,
      myPosition,
    });
  } catch (e) { next(e); }
});

// POST /api/content/tournaments/create-weekly — admin (keyinchalik cron)
router.post('/tournaments/create-weekly', authMiddleware, async (req, res, next) => {
  try {
    const t = await tournament.createWeeklyTournament();
    res.json({ success: true, tournament: t });
  } catch (e) { next(e); }
});

module.exports = router;
