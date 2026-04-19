// ─── Turnir servisi ──────────────────────────────────────────────────────────
// 1. Haftalik XP turniri (har dushanba 00:00 - yakshanba 23:59)
// 2. Stroop sprint (5 daqiqa ichida eng yuqori ball)
// 3. DTM marafon (7 kun ichida eng ko'p to'g'ri javob)

const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { earnTokens } = require('./tokenService');

// ─── Haftalik turnir yaratish (cron orqali) ──────────────────────────────────
async function createWeeklyTournament() {
  const now = new Date();
  const day = now.getDay(); // 0=yak, 1=dush
  const daysSinceMonday = (day + 6) % 7;
  const startAt = new Date(now);
  startAt.setDate(now.getDate() - daysSinceMonday);
  startAt.setHours(0, 0, 0, 0);
  const endAt = new Date(startAt);
  endAt.setDate(startAt.getDate() + 7);
  endAt.setMilliseconds(-1); // 7 kun -1ms = yakshanba 23:59:59.999

  const existing = await Tournament.findOne({
    type: 'weekly_xp',
    startAt: { $lte: now },
    endAt:   { $gte: now },
  });
  if (existing) return existing;

  const weekNumber = Math.ceil((now.getDate()) / 7);
  const t = await Tournament.create({
    type: 'weekly_xp',
    title: `Haftalik XP turniri #${weekNumber}`,
    description: '7 kun ichida eng ko\'p XP to\'plang',
    startAt, endAt,
    isActive: true,
    prizes: [
      { position: 1, tokens: 500, vipDays: 7,  xp: 500 },
      { position: 2, tokens: 250, vipDays: 3,  xp: 250 },
      { position: 3, tokens: 100, vipDays: 0,  xp: 150 },
      { position: 4, tokens: 50,  vipDays: 0,  xp: 50 },
      { position: 5, tokens: 50,  vipDays: 0,  xp: 50 },
    ],
    participants: [],
  });
  logger.info(`Yangi haftalik turnir yaratildi: ${t.title} (${startAt.toISOString()})`);
  return t;
}

// ─── Faol turnirlarni olish ──────────────────────────────────────────────────
async function getActiveTournaments() {
  const now = new Date();
  return Tournament.find({
    isActive: true,
    startAt: { $lte: now },
    endAt:   { $gte: now },
  }).sort({ endAt: 1 }).lean();
}

// ─── Turnirga ishtirok etish (XP yig'ish) ────────────────────────────────────
async function addXpToWeeklyTournament(userId, telegramId, firstName, xpAmount) {
  const now = new Date();
  const tournament = await Tournament.findOne({
    type: 'weekly_xp',
    startAt: { $lte: now },
    endAt:   { $gte: now },
    isActive: true,
  });
  if (!tournament) return null;

  // Mavjud ishtirokchimi?
  const existingIdx = tournament.participants.findIndex(
    p => p.telegramId === telegramId
  );

  if (existingIdx >= 0) {
    tournament.participants[existingIdx].score += xpAmount;
    tournament.participants[existingIdx].lastUpdate = now;
    tournament.participants[existingIdx].firstName = firstName || tournament.participants[existingIdx].firstName;
  } else {
    tournament.participants.push({
      userId, telegramId, firstName: firstName || 'Anonim',
      score: xpAmount, lastUpdate: now,
    });
  }

  await tournament.save();
  return tournament;
}

// ─── Turnir reytingi ─────────────────────────────────────────────────────────
async function getTournamentRanking(tournamentId, limit = 100) {
  const t = await Tournament.findById(tournamentId).lean();
  if (!t) return null;

  const sorted = [...t.participants]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p, i) => ({
      rank: i + 1,
      userId: p.userId,
      telegramId: p.telegramId,
      username: p.firstName || 'Anonim',
      score: p.score,
      prize: t.prizes.find(pr => pr.position === i + 1) || null,
    }));

  return {
    tournament: {
      id: t._id,
      title: t.title,
      description: t.description,
      type: t.type,
      startAt: t.startAt,
      endAt: t.endAt,
      totalParticipants: t.participants.length,
      prizes: t.prizes,
    },
    ranking: sorted,
  };
}

// ─── Faol haftalik turnir reytingi (frontend uchun) ──────────────────────────
async function getActiveWeeklyRanking(limit = 10) {
  const now = new Date();
  const t = await Tournament.findOne({
    type: 'weekly_xp',
    startAt: { $lte: now },
    endAt:   { $gte: now },
    isActive: true,
  }).lean();
  if (!t) return null;
  return getTournamentRanking(t._id, limit);
}

// ─── Prize berish (turnir tugashi bilan) ─────────────────────────────────────
async function finalizePrizes(tournamentId) {
  const t = await Tournament.findById(tournamentId);
  if (!t) return false;
  if (t.prizesPaid) return false;
  if (t.endAt > new Date()) return false; // hali tugamagan

  const sorted = [...t.participants].sort((a, b) => b.score - a.score);

  for (let i = 0; i < Math.min(sorted.length, t.prizes.length); i++) {
    const p = sorted[i];
    const prize = t.prizes.find(pr => pr.position === i + 1);
    if (!prize) continue;

    try {
      // Token berish
      if (prize.tokens > 0) {
        await earnTokens(
          p.userId, p.telegramId, prize.tokens,
          `tournament_${t.type}`, 'bonus',
          { tournamentId: t._id, position: i + 1 }
        );
      }

      // VIP kunlar — agar 7 kun bo'lsa, obuna beriladi
      if (prize.vipDays > 0) {
        const now = new Date();
        const user = await User.findById(p.userId);
        if (user) {
          const currentExp = user.planExpiresAt && user.planExpiresAt > now
            ? user.planExpiresAt : now;
          const newExp = new Date(currentExp.getTime() + prize.vipDays * 86400000);
          const tier = user.plan === 'free' ? 'vip' : user.plan;
          await User.findByIdAndUpdate(p.userId, {
            plan: tier,
            planTier: tier,
            planExpiresAt: newExp,
          });
        }
      }

      logger.info(`Prize paid: ${p.telegramId} position ${i+1} (${prize.tokens}t + ${prize.vipDays}d)`);
    } catch (e) {
      logger.error(`Prize xatosi ${p.telegramId}:`, e.message);
    }
  }

  t.prizesPaid = true;
  t.isActive = false;
  await t.save();
  return true;
}

// ─── Qolgan vaqt (frontend uchun) ────────────────────────────────────────────
function getTimeLeft(endAt) {
  const now = new Date();
  const diff = endAt - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, ended: true };

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  return { days, hours, minutes, ended: false, totalMs: diff };
}

module.exports = {
  createWeeklyTournament,
  getActiveTournaments,
  getActiveWeeklyRanking,
  addXpToWeeklyTournament,
  getTournamentRanking,
  finalizePrizes,
  getTimeLeft,
};
