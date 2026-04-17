const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { adsLimiter } = require('../middleware/rateLimit');
const {
  getBalance, earnTokens, claimDailyBonus, processAdsReward
} = require('../services/tokenService');
const AdsEvent = require('../models/AdsEvent');
const User = require('../models/User');

// GET /api/tokens/balance
router.get('/balance', authMiddleware, async (req, res, next) => {
  try {
    const balance = await getBalance(req.user._id);
    res.json(balance);
  } catch (err) { next(err); }
});

// POST /api/tokens/daily-bonus
router.post('/daily-bonus', authMiddleware, async (req, res, next) => {
  try {
    const user = req.user;
    const today = new Date().toDateString();
    const lastDate = user.lastLoginDate ? user.lastLoginDate.toDateString() : null;

    if (lastDate === today) {
      return res.status(400).json({ error: 'Kunlik bonus allaqachon olindi', code: 'ALREADY_CLAIMED' });
    }

    const newBalance = await claimDailyBonus(user._id, user.telegramId, user.streakDays);
    const bonus = user.streakDays >= 7 ? 6 : 3;

    res.json({ success: true, bonus, newBalance, streakDays: user.streakDays });
  } catch (err) { next(err); }
});

// POST /api/tokens/ads-reward  — reklama ko'rib token olish
router.post('/ads-reward', authMiddleware, adsLimiter, async (req, res, next) => {
  try {
    const { format, context, adsgram_token } = req.body;
    const user = req.user;

    // Adsgram server-side verification (agar token berilsa)
    let verified = false;
    if (adsgram_token && process.env.ADSGRAM_SECRET) {
      const crypto = require('crypto');
      const expected = crypto
        .createHmac('sha256', process.env.ADSGRAM_SECRET)
        .update(String(user.telegramId))
        .digest('hex');
      verified = adsgram_token === expected;
    }

    // Rewarded → 5t, Interstitial → 0t (faqat log)
    const tokensToGive = format === 'rewarded' ? 5 : 0;

    await AdsEvent.create({
      userId: user._id,
      telegramId: user.telegramId,
      network: 'adsgram',
      format: format || 'rewarded',
      tokensGiven: tokensToGive,
      estimatedRevUsd: 0.006,
      verified,
      context: context || '',
    });

    let newBalance = user.tokens;
    if (tokensToGive > 0) {
      newBalance = await processAdsReward(user._id, user.telegramId, tokensToGive, context);
    }

    res.json({ success: true, tokensGiven: tokensToGive, newBalance });
  } catch (err) { next(err); }
});

// POST /api/tokens/referral
router.post('/referral', authMiddleware, async (req, res, next) => {
  try {
    const { refCode } = req.body;
    const user = req.user;

    if (user.referredBy) {
      return res.status(400).json({ error: 'Siz allaqachon taklif orqali keldingiz' });
    }

    const refId = parseInt(refCode?.replace('ref_', ''), 10);
    if (isNaN(refId) || refId === user.telegramId) {
      return res.status(400).json({ error: 'Yaroqsiz referral kod' });
    }

    const { processReferral } = require('../services/tokenService');
    await processReferral(user._id, user.telegramId, refId);
    await User.findByIdAndUpdate(user._id, { referredBy: refId });

    res.json({ success: true, message: '+25 token referral bonusi olindi!' });
  } catch (err) { next(err); }
});

// GET /api/tokens/history
router.get('/history', authMiddleware, async (req, res, next) => {
  try {
    const TokenTransaction = require('../models/TokenTransaction');
    const history = await TokenTransaction
      .find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('amount type source balanceAfter createdAt meta');
    res.json(history);
  } catch (err) { next(err); }
});

module.exports = router;
