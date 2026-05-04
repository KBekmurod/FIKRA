const { Telegraf } = require('telegraf');
const axios = require('axios');
const { logger } = require('./utils/logger');

let _bot = null;
function getBot() { return _bot; }

// Standard user-friendly error message (Uzbek)
const ERR_MSG = 'Kechirasiz, tizimda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.';

// ─── PWA install instructions (Uzbek) ────────────────────────────────────────
const PWA_INSTALL_TEXT =
  `📲 *FIKRA ilovasini ekranga o'rnatish*\n\n` +
  `*Android (Chrome):*\n` +
  `1. Ilovani Chrome brauzerida oching\n` +
  `2. Manzil satri yonidagi ⋮ menyuni bosing\n` +
  `3. "Bosh ekranga qo'shish" ni tanlang\n\n` +
  `*iOS (Safari):*\n` +
  `1. Ilovani Safari brauzerida oching\n` +
  `2. Pastdagi "Ulashish" (📤) tugmasini bosing\n` +
  `3. "Bosh ekranga qo'shish" ni tanlang\n\n` +
  `*Desktop (Chrome/Edge):*\n` +
  `1. Manzil satrining o'ng tomonidagi o'rnatish ikonkasini (⊕) bosing\n` +
  `2. "O'rnatish" ni tasdiqlang\n\n` +
  `✅ O'rnatilgandan so'ng FIKRA ilovani brauzerga kirishsiz to'g'ridan-to'g'ri ishlatishingiz mumkin!`;

module.exports = function setupBot(app) {
  if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'placeholder') {
    logger.warn('BOT_TOKEN sozlanmagan — bot ishlamaydi');
    return;
  }

  const bot = new Telegraf(process.env.BOT_TOKEN);
  _bot = bot;
  const webAppUrl = process.env.TELEGRAM_WEBAPP_URL || process.env.FRONTEND_URL;

  // ─── /start ───────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    try {
      if (!webAppUrl) {
        return ctx.reply(
          'Web ilova manzili sozlanmagan. Administrator bilan bog\'laning.',
        );
      }
      const name = ctx.from.first_name || 'Abituriyent';
      await ctx.reply(
        `Salom, ${name}! 🎓\n\n` +
        `*FIKRA* — DTM testlariga tayyorlanish platformasi.\n\n` +
        `Kirish uchun pastdagi tugmani bosing 👇`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🚀 Kirish', web_app: { url: webAppUrl } }],
              [{ text: '📲 PWA o\'rnatish', callback_data: 'pwa_install' }],
            ],
          },
        },
      );
    } catch (err) {
      logger.error('/start handler:', err.message);
      ctx.reply(ERR_MSG).catch(() => {});
    }
  });

  // ─── pwa_install callback ────────────────────────────────────────────────
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if (!data) return ctx.answerCbQuery().catch(() => {});

    try {
      if (data === 'pwa_install') {
        await ctx.answerCbQuery();
        await ctx.reply(PWA_INSTALL_TEXT, { parse_mode: 'Markdown' });
        return;
      }
      await ctx.answerCbQuery();
    } catch (err) {
      logger.error('callback_query handler:', err.message);
      try { await ctx.answerCbQuery('❌ Xatolik'); } catch {}
      ctx.reply(ERR_MSG).catch(() => {});
    }
  });

  // ─── Stars to'lovi: pre_checkout ──────────────────────────────────────────
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      const payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
      if (!payload.telegramId || !payload.id) {
        return ctx.answerPreCheckoutQuery(false, 'Yaroqsiz to\'lov');
      }
      await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      logger.error('pre_checkout:', err.message);
      try { await ctx.answerPreCheckoutQuery(false, 'Xato'); } catch {}
    }
  });

  // ─── Stars to'lovi: successful_payment ────────────────────────────────────
  bot.on('message', async (ctx) => {
    const msg = ctx.message;
    if (!msg?.successful_payment) return;

    try {
      const pay        = msg.successful_payment;
      const payload    = JSON.parse(pay.invoice_payload);
      const telegramId = ctx.from.id;
      const id         = payload.id;
      if (!id) return;

      await axios.post(`${process.env.FRONTEND_URL}/api/sub/activate`, {
        telegramId,
        type: 'plan',
        id,
        starsAmount: pay.total_amount,
        chargeId: pay.telegram_payment_charge_id,
        secret: process.env.STARS_WEBHOOK_SECRET,
      }, { timeout: 10000 });

      const planNames = {
        basic_1m: 'Basic · 1 oy', basic_3m: 'Basic · 3 oy',
        pro_1m:   'Pro · 1 oy',   pro_3m:   'Pro · 3 oy',
        vip_1m:   'VIP · 1 oy',   vip_3m:   'VIP · 3 oy',
      };

      await ctx.reply(
        `✅ *To'lov muvaffaqiyatli!*\n\n*${planNames[id] || id}* faollashtirildi.\n\nIlovani qayta oching! 🎓`,
        { parse_mode: 'Markdown' },
      );
    } catch (err) {
      logger.error('successful_payment:', err.message);
      try { await ctx.reply(ERR_MSG); } catch {}
    }
  });

  // ─── Webhook yoki polling ─────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    const webhookPath = '/bot-webhook-' + process.env.BOT_TOKEN.slice(-8);
    app.use(webhookPath, (req, res) => {
      bot.handleUpdate(req.body, res).catch(() => res.sendStatus(200));
    });
    bot.telegram.setWebhook(`${process.env.FRONTEND_URL}${webhookPath}`)
      .then(() => logger.info('Bot webhook set'))
      .catch(err => logger.error('Webhook err:', err.message));
  } else {
    bot.launch().then(() => logger.info('Bot polling started'));
    process.once('SIGINT',  () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
};

module.exports.getBot = getBot;
