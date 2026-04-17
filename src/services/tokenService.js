const User = require('../models/User');
const TokenTransaction = require('../models/TokenTransaction');
const { logger } = require('../utils/logger');

// ─── Token yechish (atomic) ───────────────────────────────────────────────────
async function spendTokens(userId, telegramId, amount, source, meta = {}) {
  // findOneAndUpdate bilan atomic operatsiya — race condition yo'q
  const user = await User.findOneAndUpdate(
    { _id: userId, tokens: { $gte: amount } },
    { $inc: { tokens: -amount } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const current = await User.findById(userId);
    throw Object.assign(new Error('Token yetarli emas'), {
      statusCode: 402,
      code: 'INSUFFICIENT_TOKENS',
      required: amount,
      current: current ? current.tokens : 0,
    });
  }

  await TokenTransaction.create({
    userId,
    telegramId,
    amount: -amount,
    type: 'spend',
    source,
    balanceBefore: user.tokens + amount,
    balanceAfter: user.tokens,
    meta,
  });

  logger.info(`Tokens spent: user=${telegramId} amount=${amount} source=${source}`);
  return user.tokens;
}

// ─── Token qo'shish ───────────────────────────────────────────────────────────
async function earnTokens(userId, telegramId, amount, source, type = 'earn', meta = {}) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokens: amount } },
    { new: true }
  );

  if (!user) throw new Error('Foydalanuvchi topilmadi');

  await TokenTransaction.create({
    userId,
    telegramId,
    amount,
    type,
    source,
    balanceBefore: user.tokens - amount,
    balanceAfter: user.tokens,
    meta,
  });

  logger.info(`Tokens earned: user=${telegramId} amount=${amount} source=${source}`);
  return user.tokens;
}

// ─── Kunlik bonus ─────────────────────────────────────────────────────────────
async function claimDailyBonus(userId, telegramId, streakDays) {
  // Streak 7 dan oshsa 2x
  const baseBonus = 3;
  const multiplier = streakDays >= 7 ? 2 : 1;
  const bonus = baseBonus * multiplier;
  return await earnTokens(userId, telegramId, bonus, 'daily_bonus', 'daily', { streakDays });
}

// ─── Ads reward ───────────────────────────────────────────────────────────────
async function processAdsReward(userId, telegramId, tokensToGive, context) {
  return await earnTokens(userId, telegramId, tokensToGive, 'ads_rewarded', 'earn', { context });
}

// ─── Referral bonus ───────────────────────────────────────────────────────────
async function processReferral(newUserId, newUserTelegramId, refByTelegramId) {
  const refUser = await User.findOne({ telegramId: refByTelegramId });
  if (!refUser) return;

  // Taklif qilganga +50t
  await earnTokens(refUser._id, refByTelegramId, 50, 'referral_bonus', 'referral',
    { newUser: newUserTelegramId });

  // Yangi foydalanuvchiga +25t
  await earnTokens(newUserId, newUserTelegramId, 25, 'referral_bonus', 'referral',
    { refBy: refByTelegramId });

  await User.findByIdAndUpdate(refUser._id, { $inc: { referralCount: 1 } });
}

// ─── Balans olish ─────────────────────────────────────────────────────────────
async function getBalance(userId) {
  const user = await User.findById(userId).select('tokens plan planExpiresAt');
  if (!user) throw new Error('Foydalanuvchi topilmadi');
  return {
    tokens: user.tokens,
    plan: user.plan,
    isPro: user.plan === 'pro' && user.planExpiresAt > new Date(),
    isBasic: ['basic', 'pro'].includes(user.plan) && user.planExpiresAt > new Date(),
  };
}

module.exports = {
  spendTokens,
  earnTokens,
  claimDailyBonus,
  processAdsReward,
  processReferral,
  getBalance,
};
