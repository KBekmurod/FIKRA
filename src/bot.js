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
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
      // Yangi format: {type, id, telegramId} yoki eski format: {planId, telegramId}
      const hasType = payload.type && payload.id;
      const hasLegacy = payload.planId;
      if (!payload.telegramId || (!hasType && !hasLegacy)) {
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

      // Yangi format (type + id) yoki eski format (planId)
      const type = payload.type || 'plan';
      const id = payload.id || payload.planId;

      const activateUrl = `${process.env.FRONTEND_URL}/api/sub/activate`;
      await axios.post(activateUrl, {
        telegramId,
        type,
        id,
        starsAmount: pay.total_amount,
        chargeId: pay.telegram_payment_charge_id,
        secret: process.env.STARS_WEBHOOK_SECRET,
      }, { timeout: 10000 });

      // Foydalanuvchiga muvaffaqiyat xabari
      if (type === 'pack') {
        await ctx.reply(
          `✅ *Token haridi muvaffaqiyatli!*\n\n` +
          `Tokenlaringiz balansingizga qo'shildi.\n\n` +
          `Rahmat! 🎉`,
          { parse_mode: 'Markdown' }
        );
      } else {
        const planNames = {
          basic_1m: 'Basic · 1 oy',
          pro_1m: 'Pro · 1 oy',
          basic_3m: 'Basic · 3 oy',
          pro_3m: 'Pro · 3 oy',
          vip_3m: 'VIP · 3 oy ✨',
          business_3m: 'Business · 3 oy 🏢',
        };
        await ctx.reply(
          `✅ *To'lov muvaffaqiyatli!*\n\n` +
          `*${planNames[id] || id}* obunasi faollashtirildi.\n\n` +
          `Rahmat! 🎉`,
          { parse_mode: 'Markdown' }
        );
      }
      logger.info(`Payment success: user=${telegramId} type=${type} id=${id} stars=${pay.total_amount}`);
    } catch (err) {
      logger.error('successful_payment error:', err?.response?.data || err.message);
      await ctx.reply('❌ Faollashtirish xatoligi. Qo\'llab-quvvatlash bilan bog\'laning.');
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
