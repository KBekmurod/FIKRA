// ─── FIKRA Rank Service ───────────────────────────────────────────────────────
// 8 darajali lavozim tizimi. XP ga qarab avtomatik oshadi.

const User = require('../models/User');
const TokenTransaction = require('../models/TokenTransaction');
const { logger } = require('../utils/logger');

// ─── Lavozimlar ro'yxati ─────────────────────────────────────────────────────
const RANKS = [
  { id: 'seedling',   level: 1, name: "Urug'",         emoji: '🌱', minXp: 0,      color: '#8FA29B', glow: 'rgba(143,162,155,.3)' },
  { id: 'awakened',   level: 2, name: 'Uyg\'ongan miya', emoji: '🧠', minXp: 500,    color: '#00D4AA', glow: 'rgba(0,212,170,.35)' },
  { id: 'electric',   level: 3, name: 'Elektr',        emoji: '⚡', minXp: 2000,   color: '#FFCC44', glow: 'rgba(255,204,68,.35)' },
  { id: 'sorcerer',   level: 4, name: 'Sehrgar',       emoji: '🔮', minXp: 5000,   color: '#7B68EE', glow: 'rgba(123,104,238,.4)' },
  { id: 'creative',   level: 5, name: 'Creative',      emoji: '🎨', minXp: 10000,  color: '#FF6FA3', glow: 'rgba(255,111,163,.4)' },
  { id: 'dragon',     level: 6, name: 'Dragon',        emoji: '🐉', minXp: 25000,  color: '#FF5F5F', glow: 'rgba(255,95,95,.4)' },
  { id: 'galaxy',     level: 7, name: 'Galaktika',     emoji: '🌌', minXp: 60000,  color: '#5B8FFF', glow: 'rgba(91,143,255,.45)' },
  { id: 'emperor',    level: 8, name: 'Imperator',     emoji: '♛', minXp: 150000, color: '#FFD86B', glow: 'rgba(255,216,107,.5)' },
];

// ─── XP dan rank topish ───────────────────────────────────────────────────────
function getRankByXp(xp) {
  xp = xp || 0;
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXp) current = r;
    else break;
  }
  return current;
}

// ─── Keyingi rank ─────────────────────────────────────────────────────────────
function getNextRank(currentRank) {
  const idx = RANKS.findIndex(r => r.id === currentRank.id);
  if (idx < 0 || idx >= RANKS.length - 1) return null; // Yuqori daraja
  return RANKS[idx + 1];
}

// ─── Progress hisoblash ──────────────────────────────────────────────────────
function getProgress(xp) {
  const current = getRankByXp(xp);
  const next = getNextRank(current);
  if (!next) {
    return {
      current, next: null,
      currentXp: xp,
      levelStart: current.minXp,
      levelEnd: current.minXp,
      xpInLevel: xp - current.minXp,
      xpToNext: 0,
      percent: 100,
      isMax: true,
    };
  }
  const xpInLevel = xp - current.minXp;
  const levelSpan = next.minXp - current.minXp;
  const xpToNext = next.minXp - xp;
  const percent = Math.min(100, Math.round((xpInLevel / levelSpan) * 100));
  return {
    current, next,
    currentXp: xp,
    levelStart: current.minXp,
    levelEnd: next.minXp,
    xpInLevel,
    xpToNext,
    percent,
    isMax: false,
  };
}

// ─── XP qo'shish (atomic) ─────────────────────────────────────────────────────
// Agar rank oshsa — qaytariladigan natijada levelUp: true bo'ladi
async function addXp(userId, telegramId, amount, source, meta = {}) {
  if (!amount || amount <= 0) return null;

  // Foydalanuvchini olish
  const userBefore = await User.findById(userId).select('xp rank rankLevel streakDays plan');
  if (!userBefore) return null;

  // Multiplier (streak, obuna)
  let multiplier = 1;
  if (userBefore.streakDays >= 30) multiplier = 3;
  else if (userBefore.streakDays >= 7) multiplier = 2;
  if (userBefore.plan === 'pro') multiplier *= 1.5;
  else if (userBefore.plan === 'basic') multiplier *= 1.25;

  const finalXp = Math.round(amount * multiplier);
  const xpBefore = userBefore.xp || 0;
  const xpAfter = xpBefore + finalXp;

  // Rank oshganmi?
  const rankBefore = getRankByXp(xpBefore);
  const rankAfter = getRankByXp(xpAfter);
  const levelUp = rankAfter.level > rankBefore.level;

  // Atomic update
  await User.findByIdAndUpdate(userId, {
    $inc: { xp: finalXp },
    rank: rankAfter.id,
    rankLevel: rankAfter.level,
  });

  // Haftalik turnirga ham qo'shish (xatolik ishlashga xalaqit bermasin)
  try {
    const { addXpToWeeklyTournament } = require('./tournamentService');
    const userInfo = await User.findById(userId).select('firstName').lean();
    addXpToWeeklyTournament(
      userId, telegramId,
      userInfo?.firstName || 'Anonim',
      finalXp
    ).catch(() => {});
  } catch (e) {
    // Tournament model hali yo'q bo'lsa — o'tkazib yuboramiz
  }

  // Tarixga yozish
  try {
    await TokenTransaction.create({
      userId,
      telegramId,
      amount: 0, // Token emas, faqat XP
      type: 'xp',
      source: 'xp_' + source,
      balanceBefore: xpBefore,
      balanceAfter: xpAfter,
      meta: { ...meta, xp: finalXp, baseXp: amount, multiplier, levelUp },
    });
  } catch (e) {
    logger.warn('XP tarix yozilmadi:', e.message);
  }

  logger.info(`XP added: user=${telegramId} +${finalXp}xp (base ${amount} x${multiplier}) source=${source}${levelUp ? ' LEVEL UP to ' + rankAfter.id : ''}`);

  return {
    xpBefore, xpAfter, xpAdded: finalXp, baseXp: amount, multiplier,
    rankBefore, rankAfter, levelUp,
  };
}

// ─── Leaderboard uchun top XP ────────────────────────────────────────────────
async function getTopByXp(limit = 50) {
  const users = await User.find({ isActive: true })
    .select('telegramId firstName xp rank rankLevel')
    .sort({ xp: -1 })
    .limit(limit)
    .lean();
  return users.map((u, i) => ({
    rank: i + 1,
    telegramId: u.telegramId,
    username: u.firstName || 'Anonim',
    xp: u.xp || 0,
    rankId: u.rank,
    rankLevel: u.rankLevel,
    ...getRankByXp(u.xp || 0), // emoji, color, name
    score: u.xp || 0, // reyting uchun
  }));
}

module.exports = {
  RANKS,
  getRankByXp,
  getNextRank,
  getProgress,
  addXp,
  getTopByXp,
};
