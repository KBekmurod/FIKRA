// ─── Subscription Cron ────────────────────────────────────────────────────────
// Obuna muddati tugagan foydalanuvchilarni 'free' ga o'tkazadi
// Har kun 00:01 da ishlaydi

const cron = require('node-cron');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { createWeeklyTournament, finalizePrizes } = require('./tournamentService');
const Tournament = require('../models/Tournament');

function startSubscriptionCron() {
  if (!process.env.ENABLE_CRON && process.env.NODE_ENV !== 'production') {
    logger.info('Cron disabled in this mode');
    return;
  }

  // Har dushanba 00:00 — yangi haftalik turnir yaratish
  cron.schedule('0 0 * * 1', async () => {
    try {
      await createWeeklyTournament();
      logger.info('Cron: Yangi haftalik turnir yaratildi');
    } catch (e) {
      logger.error('Weekly tournament cron error:', e);
    }
  });

  // Har dushanba 00:05 — oldingi haftalik turnirga prize berish
  cron.schedule('5 0 * * 1', async () => {
    try {
      const now = new Date();
      // Tugagan va prize berilmagan turnirlar
      const finished = await Tournament.find({
        endAt: { $lt: now },
        prizesPaid: false,
        isActive: true,
      }).select('_id');

      for (const t of finished) {
        await finalizePrizes(t._id);
      }
      if (finished.length > 0) {
        logger.info(`Cron: ${finished.length} turnir yakunlandi, prize berildi`);
      }
    } catch (e) {
      logger.error('Tournament prize cron error:', e);
    }
  });

  // Har kun yarim kechada
  cron.schedule('1 0 * * *', async () => {
    try {
      const now = new Date();

      // 1. Muddati tugagan obunalarni free ga o'tkazish
      const expiredResult = await User.updateMany(
        {
          plan: { $ne: 'free' },
          planExpiresAt: { $lt: now },
        },
        {
          $set: { plan: 'free', planTier: 'free', planId: null },
        }
      );

      if (expiredResult.modifiedCount > 0) {
        logger.info(`Cron: ${expiredResult.modifiedCount} foydalanuvchi obunasi tugadi`);
      }

      // 2. Win-back: 3 kun oldin muddati tugaganlarga bot xabar yuborish
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
      const fourDaysAgo = new Date(now.getTime() - 4 * 86400000);
      const winBackUsers = await User.find({
        plan: 'free',
        planExpiresAt: { $gte: fourDaysAgo, $lt: threeDaysAgo },
      }).select('telegramId firstName').limit(100);

      if (winBackUsers.length > 0) {
        try {
          const { getBot } = require('../bot');
          const bot = getBot && getBot();
          if (bot) {
            for (const u of winBackUsers) {
              try {
                await bot.telegram.sendMessage(
                  u.telegramId,
                  `${u.firstName || 'Salom'}, sizni sog'indik! 🧠\n\n` +
                  `Obunangiz 3 kun oldin tugadi. Hozir **25% chegirma** bilan qaytishingiz mumkin.\n\n` +
                  `Promocode: COMEBACK25`,
                  { parse_mode: 'Markdown' }
                );
                // Telegram rate limit (30 msg/sec)
                await new Promise(r => setTimeout(r, 50));
              } catch (e) {
                // User bloklagan yoki akkount o'chirilgan — o'tkazib yuborish
              }
            }
            logger.info(`Win-back: ${winBackUsers.length} ta xabar yuborildi`);
          }
        } catch (e) {
          logger.warn('Win-back error:', e.message);
        }
      }

    } catch (err) {
      logger.error('Subscription cron error:', err);
    }
  });

  logger.info('Subscription cron scheduled (daily 00:01)');
}

module.exports = { startSubscriptionCron };
