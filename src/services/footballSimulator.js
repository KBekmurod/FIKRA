// ─── Football Match Simulator (tokensiz) ────────────────────────────────────
// Bot bilan o'yin — XP yutish maqsadida, token stavkasisiz

const GameInventory = require('../models/GameInventory');
const { addXp } = require('./rankService');
const { logger } = require('../utils/logger');
const cat = require('./gameCatalog');

function _playerPower(player) {
  const s = player.playerStats || {};
  const pos = player.playerPosition;
  if (pos === 'GK')  return s.defense * 0.7 + s.skill * 0.3;
  if (pos === 'DEF') return s.defense * 0.5 + s.speed * 0.25 + s.skill * 0.25;
  if (pos === 'MID') return s.skill * 0.4 + s.speed * 0.3 + s.shot * 0.15 + s.defense * 0.15;
  if (pos === 'FWD') return s.shot * 0.5 + s.speed * 0.3 + s.skill * 0.2;
  return 50;
}

function _teamRating(players) {
  if (!players?.length) return 50;
  return players.reduce((sum, p) => sum + _playerPower(p), 0) / players.length;
}

function _positionRating(players, pos) {
  const filtered = players.filter(p => p.playerPosition === pos);
  return filtered.length ? _teamRating(filtered) : 40;
}

// Bot bilan o'yin — XP evaziga
async function playMatchVsBot(user) {
  const userPlayers = await GameInventory.find({ userId: user._id, gameType: 'football' }).lean();
  if (!userPlayers.length) throw new Error('Avval klub tanlang va jamoa tuzing');

  const userRating   = _teamRating(userPlayers);
  const userAttack   = _positionRating(userPlayers, 'FWD');
  const userMidfield = _positionRating(userPlayers, 'MID');
  const userDefense  = (_positionRating(userPlayers, 'DEF') + _positionRating(userPlayers, 'GK')) / 2;

  // Bot — foydalanuvchiga yaqin kuch
  const botRating   = userRating + (Math.random() - 0.5) * 15;
  const botAttack   = botRating  + (Math.random() - 0.5) * 10;
  const botDefense  = botRating  + (Math.random() - 0.5) * 10;
  const botMidfield = botRating;

  let userGoals = 0, botGoals = 0;
  const events = [];

  for (let minute = 5; minute <= 90; minute += 5) {
    const threshold = userMidfield / (userMidfield + botMidfield) * 100;
    if (Math.random() * 100 < threshold) {
      if (Math.random() * 100 < (userAttack / botDefense) * 8) {
        userGoals++;
        const scorer = userPlayers.filter(p => p.playerPosition === 'FWD')
          .sort((a, b) => (b.playerStats?.shot || 0) - (a.playerStats?.shot || 0))[0];
        events.push({ minute, team: 'user', type: 'goal', player: scorer?.name || 'Forvard' });
      }
    } else {
      if (Math.random() * 100 < (botAttack / userDefense) * 8) {
        botGoals++;
        events.push({ minute, team: 'bot', type: 'goal', player: 'Bot Forvard' });
      }
    }
    if (Math.random() < 0.04) {
      const team = Math.random() < 0.5 ? 'user' : 'bot';
      const teamPlayers = team === 'user' ? userPlayers : [];
      events.push({
        minute, team, type: 'yellow_card',
        player: teamPlayers[Math.floor(Math.random() * Math.max(teamPlayers.length, 1))]?.name || "O'yinchi",
      });
    }
  }

  let result, xpEarned;
  if      (userGoals > botGoals) { result = 'win';  xpEarned = 30; }
  else if (userGoals === botGoals) { result = 'draw'; xpEarned = 10; }
  else                             { result = 'loss'; xpEarned = 5; }

  addXp(user._id, user.telegramId, xpEarned, 'football_match', { result }).catch(() => {});

  logger.info(`Football vs bot: user=${user.telegramId} result=${result} score=${userGoals}-${botGoals}`);

  return {
    result, userGoals, botGoals, events, xpEarned,
    userRating: Math.round(userRating),
    botRating:  Math.round(botRating),
  };
}

module.exports = { playMatchVsBot, _teamRating, _playerPower };
