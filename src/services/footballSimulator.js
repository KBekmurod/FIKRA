// ─── Football Match Simulator ─────────────────────────────────────────────────
// Klublar o'rtasidagi haqiqiy o'yin simulyatsiyasi
// Algoritm: 90 daqiqa, har 5 daq da hujum/himoya o'zaro ta'siri
// Ehtimollik o'yinchi statistikalariga bog'liq

const GameInventory = require('../models/GameInventory');
const User = require('../models/User');
const { earnTokens, spendTokens } = require('./tokenService');
const { addXp } = require('./rankService');
const { logger } = require('../utils/logger');
const cat = require('./gameCatalog');

// O'yinchining "kuchi" ni hisoblash (pozitsiyaga qarab muhim statlar)
function _playerPower(player) {
  const s = player.playerStats || {};
  const pos = player.playerPosition;
  if (pos === 'GK') return s.defense * 0.7 + s.skill * 0.3;
  if (pos === 'DEF') return s.defense * 0.5 + s.speed * 0.25 + s.skill * 0.25;
  if (pos === 'MID') return s.skill * 0.4 + s.speed * 0.3 + s.shot * 0.15 + s.defense * 0.15;
  if (pos === 'FWD') return s.shot * 0.5 + s.speed * 0.3 + s.skill * 0.2;
  return 50;
}

// Jamoaning "team rating" — barcha o'yinchilarning o'rtacha kuchi
function _teamRating(players) {
  if (!players || players.length === 0) return 50;
  const total = players.reduce((sum, p) => sum + _playerPower(p), 0);
  return total / players.length;
}

// Pozitsiya bo'yicha jamoaning kuchi
function _positionRating(players, pos) {
  const filtered = players.filter(p => p.playerPosition === pos);
  if (filtered.length === 0) return 40;
  return _teamRating(filtered);
}

// O'yin simulyatsiyasi
async function simulateMatch(homeUserId, awayUserId, opts = {}) {
  // Ikki jamoaning futbolchilarini olish
  const homePlayers = await GameInventory.find({
    userId: homeUserId, gameType: 'football'
  }).lean();
  const awayPlayers = await GameInventory.find({
    userId: awayUserId, gameType: 'football'
  }).lean();

  if (homePlayers.length === 0 || awayPlayers.length === 0) {
    throw new Error('Bir yoki ikki jamoada o\'yinchilar yetarli emas');
  }

  const homeRating = _teamRating(homePlayers);
  const awayRating = _teamRating(awayPlayers);
  const homeAttack = _positionRating(homePlayers, 'FWD');
  const homeMidfield = _positionRating(homePlayers, 'MID');
  const homeDefense = (_positionRating(homePlayers, 'DEF') + _positionRating(homePlayers, 'GK')) / 2;
  const awayAttack = _positionRating(awayPlayers, 'FWD');
  const awayMidfield = _positionRating(awayPlayers, 'MID');
  const awayDefense = (_positionRating(awayPlayers, 'DEF') + _positionRating(awayPlayers, 'GK')) / 2;

  let homeGoals = 0;
  let awayGoals = 0;
  const events = [];

  // Uy egasi afzalligi (+5%)
  const homeBonus = 1.05;

  // 90 daqiqa, har 5 daqiqada 1 hodisa (jami 18 hodisa)
  for (let minute = 5; minute <= 90; minute += 5) {
    // Maydon nazorati — kim ko'p ushlab turadi?
    const possessionRoll = Math.random() * 100;
    const homeThreshold = (homeMidfield * homeBonus) / (homeMidfield * homeBonus + awayMidfield) * 100;

    if (possessionRoll < homeThreshold) {
      // Uyda hujum — gol urish ehtimoli
      const goalChance = (homeAttack * homeBonus / awayDefense) * 8; // ~8-15% normal
      if (Math.random() * 100 < goalChance) {
        homeGoals++;
        // Eng kuchli FWD ni topish
        const scorer = homePlayers
          .filter(p => p.playerPosition === 'FWD')
          .sort((a, b) => (b.playerStats?.shot || 0) - (a.playerStats?.shot || 0))[0];
        events.push({
          minute, team: 'home',
          type: 'goal',
          player: scorer?.name || 'Forvard',
        });
      }
    } else {
      // Mehmonda hujum
      const goalChance = (awayAttack / (homeDefense * homeBonus)) * 8;
      if (Math.random() * 100 < goalChance) {
        awayGoals++;
        const scorer = awayPlayers
          .filter(p => p.playerPosition === 'FWD')
          .sort((a, b) => (b.playerStats?.shot || 0) - (a.playerStats?.shot || 0))[0];
        events.push({
          minute, team: 'away',
          type: 'goal',
          player: scorer?.name || 'Forvard',
        });
      }
    }

    // Sariq/qizil kartochka (kichik ehtimol)
    if (Math.random() < 0.04) {
      const team = Math.random() < 0.5 ? 'home' : 'away';
      events.push({
        minute, team,
        type: 'yellow_card',
        player: (team === 'home' ? homePlayers : awayPlayers)[Math.floor(Math.random() * (team === 'home' ? homePlayers.length : awayPlayers.length))]?.name || 'O\'yinchi',
      });
    }
  }

  // Natija
  let result;
  if (homeGoals > awayGoals) result = 'home_win';
  else if (awayGoals > homeGoals) result = 'away_win';
  else result = 'draw';

  return {
    homeGoals, awayGoals,
    homeRating: Math.round(homeRating),
    awayRating: Math.round(awayRating),
    events,
    result,
  };
}

// Tokenli o'yin (foydalanuvchi 100 token tikadi, g'olib 180 oladi — 20% bizga)
async function playMatchVsBot(user, betAmount) {
  const minBet = 50;
  const maxBet = 5000;
  if (betAmount < minBet) throw new Error(`Minimal bet ${minBet}t`);
  if (betAmount > maxBet) throw new Error(`Maksimal bet ${maxBet}t`);
  if (user.tokens < betAmount) {
    const e = new Error('Token yetarli emas'); e.code = 'INSUFFICIENT_TOKENS'; throw e;
  }

  // Foydalanuvchining jamoasi
  const userPlayers = await GameInventory.find({
    userId: user._id, gameType: 'football'
  }).lean();
  if (userPlayers.length === 0) {
    throw new Error('Avval klub tanlang va jamoa tuzing');
  }

  const userRating = _teamRating(userPlayers);

  // Bot — foydalanuvchining o'rtacha darajasiga o'xshash, biroz random
  const botRating = userRating + (Math.random() - 0.5) * 15; // ±7.5
  const botAttack = botRating + (Math.random() - 0.5) * 10;
  const botDefense = botRating + (Math.random() - 0.5) * 10;
  const botMidfield = botRating;

  // Token yechib olish (atomic)
  await spendTokens(user._id, user.telegramId, betAmount, 'football_match', { vs: 'bot' });

  const userAttack = _positionRating(userPlayers, 'FWD');
  const userMidfield = _positionRating(userPlayers, 'MID');
  const userDefense = (_positionRating(userPlayers, 'DEF') + _positionRating(userPlayers, 'GK')) / 2;

  let userGoals = 0, botGoals = 0;
  const events = [];

  for (let minute = 5; minute <= 90; minute += 5) {
    const possessionRoll = Math.random() * 100;
    const userThresh = userMidfield / (userMidfield + botMidfield) * 100;

    if (possessionRoll < userThresh) {
      const chance = (userAttack / botDefense) * 8;
      if (Math.random() * 100 < chance) {
        userGoals++;
        const scorer = userPlayers
          .filter(p => p.playerPosition === 'FWD')
          .sort((a, b) => (b.playerStats?.shot || 0) - (a.playerStats?.shot || 0))[0];
        events.push({ minute, team: 'user', type: 'goal', player: scorer?.name || 'Forvard' });
      }
    } else {
      const chance = (botAttack / userDefense) * 8;
      if (Math.random() * 100 < chance) {
        botGoals++;
        events.push({ minute, team: 'bot', type: 'goal', player: 'Bot Forvard' });
      }
    }
  }

  let result, reward = 0, xpEarned = 0;
  if (userGoals > botGoals) {
    result = 'win';
    // 80% qaytaradi (20% biznes foydasi). Misol: 100 → 180 (foyda 80)
    reward = Math.round(betAmount * 1.8);
    xpEarned = 30;
    await earnTokens(user._id, user.telegramId, reward, 'football_win', 'reward', { betAmount, userGoals, botGoals });
  } else if (userGoals === botGoals) {
    result = 'draw';
    // Kim tikkanini qaytarib beramiz (50%)
    reward = Math.round(betAmount * 0.5);
    xpEarned = 10;
    await earnTokens(user._id, user.telegramId, reward, 'football_draw', 'reward', { betAmount });
  } else {
    result = 'loss';
    reward = 0;
    xpEarned = 5;
  }

  if (xpEarned > 0) {
    addXp(user._id, user.telegramId, xpEarned, 'football_match', { result }).catch(() => {});
  }

  logger.info(`Football match: user=${user.telegramId} bet=${betAmount} result=${result} reward=${reward} score=${userGoals}-${botGoals}`);

  return {
    result,
    userGoals, botGoals,
    betAmount, reward,
    xpEarned,
    events,
    userRating: Math.round(userRating),
    botRating: Math.round(botRating),
  };
}

module.exports = {
  simulateMatch,
  playMatchVsBot,
  _teamRating,
  _playerPower,
};
