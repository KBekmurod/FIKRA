const { Telegraf } = require('telegraf');
const axios = require('axios');
const { logger } = require('./utils/logger');

// Bot instance — tashqi kodlardan kirish uchun
let _bot = null;
function getBot() { return _bot; }

module.exports = function setupBot(app) {
  if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'placeholder') {
    logger.warn('BOT_TOKEN sozlanmagan — bot ishlamaydi');
    return;
  }

  const bot = new Telegraf(process.env.BOT_TOKEN);
  _bot = bot; // Global ga saqlash
  const webAppUrl = process.env.FRONTEND_URL || 'https://t.me';

  // ─── /start ────────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    await ctx.reply(
      `Salom, ${ctx.from.first_name}! 🧠\nFIKRA — miya faolligi platformasi.`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 FIKRAni ochish', web_app: { url: webAppUrl } }
          ]]
        }
      }
    );
  });

  // ─── /tokens ───────────────────────────────────────────────────────────────
  bot.command('tokens', async (ctx) => {
    try {
      const User = require('./models/User');
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (!user) return ctx.reply('Avval ilovani oching!');
      ctx.reply(`💰 Tokenlaringiz: *${user.tokens}t*`, { parse_mode: 'Markdown' });
    } catch { ctx.reply('Xatolik.'); }
  });

  // ─── /profile ──────────────────────────────────────────────────────────────
  bot.command('profile', async (ctx) => {
    try {
      const User = require('./models/User');
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (!user) return ctx.reply('Avval ilovani oching!');
      const planEmoji = { free: '🆓', basic: '⭐', pro: '✨' };
      ctx.reply(
        `👤 *${user.firstName || 'Profil'}*\n\n` +
        `${planEmoji[user.plan]} Tarif: ${user.plan}\n` +
        `💰 Token: ${user.tokens}\n` +
        `🔥 Streak: ${user.streakDays} kun\n` +
        `🎮 O'yinlar: ${user.totalGamesPlayed}`,
        { parse_mode: 'Markdown' }
      );
    } catch { ctx.reply('Xatolik.'); }
  });

  // ─── Stars to'lovi: pre_checkout_query ─────────────────────────────────────
  // Telegram to'lov tugatishdan oldin botga so'raydi — darhol "ok" qaytaramiz
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      // Asosiy tekshiruv — payload yaroqli JSON mi?
      const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
      if (!payload.planId || !payload.telegramId) {
        return ctx.answerPreCheckoutQuery(false, 'Yaroqsiz payload');
      }
      await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      logger.error('pre_checkout error:', err);
      await ctx.answerPreCheckoutQuery(false, 'Xatolik yuz berdi');
    }
  });

  // ─── Stars to'lovi: successful_payment ─────────────────────────────────────
  bot.on('message', async (ctx, next) => {
    const msg = ctx.message;
    if (!msg.successful_payment) return next();

    try {
      const pay = msg.successful_payment;
      const payload = JSON.parse(pay.invoice_payload);
      const telegramId = ctx.from.id;

      // Backend ga activate so'rovi
      const activateUrl = `${process.env.FRONTEND_URL}/api/sub/activate`;
      await axios.post(activateUrl, {
        telegramId,
        planId: payload.planId,
        starsAmount: pay.total_amount,
        chargeId: pay.telegram_payment_charge_id,
        secret: process.env.STARS_WEBHOOK_SECRET,
      }, { timeout: 10000 });

      const planNames = { basic: 'Basic ⭐', pro: 'Pro ✨' };
      await ctx.reply(
        `✅ *To'lov muvaffaqiyatli!*\n\n` +
        `${planNames[payload.planId] || payload.planId} obunasi 30 kunga faollashtirildi.\n\n` +
        `Rahmat! 🎉`,
        { parse_mode: 'Markdown' }
      );
      logger.info(`Payment success: user=${telegramId} plan=${payload.planId} stars=${pay.total_amount}`);
    } catch (err) {
      logger.error('successful_payment error:', err?.response?.data || err.message);
      await ctx.reply('❌ Obunani faollashtirish xatoligi. Iltimos, qo\'llab-quvvatlash xizmatiga murojaat qiling.');
    }
  });

  // ─── Webhook yoki polling ──────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    const webhookPath = '/bot-webhook-' + process.env.BOT_TOKEN.slice(-8);
    app.use(webhookPath, (req, res) => {
      bot.handleUpdate(req.body, res).catch(() => res.sendStatus(200));
    });
    bot.telegram.setWebhook(`${process.env.FRONTEND_URL}${webhookPath}`)
      .then(() => logger.info('Bot webhook set'))
      .catch(err => logger.error('Webhook error:', err.message));
  } else {
    bot.launch().then(() => logger.info('Bot polling started'));
    process.once('SIGINT',  () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
};

// Boshqa modullardan bot instance ga kirish
module.exports.getBot = getBot;
