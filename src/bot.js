const { Telegraf } = require('telegraf');
const axios = require('axios');
const { logger } = require('./utils/logger');

let _bot = null;
function getBot() { return _bot; }

module.exports = function setupBot(app) {
  if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'placeholder') {
    logger.warn('BOT_TOKEN sozlanmagan — bot ishlamaydi');
    return;
  }

  const bot = new Telegraf(process.env.BOT_TOKEN);
  _bot = bot;
  const webAppUrl = process.env.FRONTEND_URL || 'https://t.me';

  // ─── /start ────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    const name = ctx.from.first_name || 'Abituriyent';
    await ctx.reply(
      `Salom, ${name}! 🎓\n\n` +
      `FIKRA — DTM testlariga tayyorlanish platformasi.\n\n` +
      `✅ DTM test savollar — cheksiz\n` +
      `💡 AI tushuntirish — har savol yonida (kuniga 5 ta bepul)\n` +
      `⭐ Obuna bilan — AI cheksiz + barcha imkoniyatlar\n\n` +
      `Boshlash uchun ilovani oching 👇`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📚 FIKRA — DTM tayyorlik', web_app: { url: webAppUrl } }
          ]]
        }
      }
    );
  });

  // ─── /profile ──────────────────────────────────────────────────────────
  bot.command('profile', async (ctx) => {
    try {
      const User = require('./models/User');
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (!user) return ctx.reply('Avval ilovani oching!');

      const planEmoji = { free: '🆓', basic: '⭐', pro: '✨', vip: '💎' };
      const effective = user.effectivePlan();
      const isActive = effective !== 'free';
      const daysLeft = (isActive && user.planExpiresAt)
        ? Math.ceil((user.planExpiresAt - new Date()) / 86400000)
        : 0;

      ctx.reply(
        `👤 *${user.firstName || 'Profil'}*\n\n` +
        `${planEmoji[effective] || '🆓'} Tarif: *${effective}*${isActive ? ` (${daysLeft} kun qoldi)` : ''}\n` +
        `🔥 Streak: ${user.streakDays} kun\n` +
        `🎮 O'yinlar: ${user.totalGamesPlayed}\n` +
        `🤖 AI so'rovlar: ${user.totalAiRequests}`,
        { parse_mode: 'Markdown' }
      );
    } catch { ctx.reply('Xatolik.'); }
  });

  // ─── /subscribe ────────────────────────────────────────────────────────
  bot.command('subscribe', async (ctx) => {
    await ctx.reply(
      `⭐ *FIKRA obuna rejalari*\n\n` +
      `*Basic* — 149⭐/oy\n` +
      `• AI test tushuntirish — cheksiz\n` +
      `• AI Chat — 50 xabar/kun\n\n` +
      `*Pro* — 299⭐/oy ⭐ Mashhur\n` +
      `• AI Chat cheksiz\n` +
      `• AI Hujjat (10/kun) + Rasm (20/kun)\n\n` +
      `*VIP* — 499⭐/oy\n` +
      `• Hammasi cheksiz + Kaloriya AI\n\n` +
      `To'liq narxlar va harid: ilovani oching 👇`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '💳 Obuna olish', web_app: { url: webAppUrl } }
          ]]
        }
      }
    );
  });

  // ─── /admin ────────────────────────────────────────────────────────────────
  bot.command('admin', async (ctx) => {
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
    if (!adminIds.includes(ctx.from.id)) return;
    const frontendUrl = process.env.FRONTEND_URL || '';
    ctx.reply(`🔐 Admin panel:\n${frontendUrl}/admin\n\nAdmin secret'ni kiritib kirish mumkin.`,
      { reply_markup: { inline_keyboard: [[{ text: '🔐 Admin Panel', url: frontendUrl + '/admin' }]] } });
  });

  // ─── /help ─────────────────────────────────────────────────────────────
  bot.command('help', async (ctx) => {
    ctx.reply(
      `📚 *FIKRA — DTM tayyorlik platformasi*\n\n` +
      `Buyruqlar:\n` +
      `/start — Bosh sahifa\n` +
      `/profile — Profilingiz\n` +
      `/subscribe — Obuna rejalari\n` +
      `/help — Yordam\n\n` +
      `Muammo yuzaga kelsa: ilovani qayta oching.`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── Stars to'lovi: pre_checkout_query ─────────────────────────────────
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      let payload;
      try {
        payload = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
      } catch {
        return ctx.answerPreCheckoutQuery(false, 'Noto\'g\'ri payload');
      }
      if (!payload.telegramId || !payload.type || !payload.id) {
        return ctx.answerPreCheckoutQuery(false, 'Yaroqsiz to\'lov ma\'lumoti');
      }
      await ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      logger.error('pre_checkout error:', err.message);
      try { await ctx.answerPreCheckoutQuery(false, 'Xatolik yuz berdi'); } catch {}
    }
  });

  // ─── Stars to'lovi: successful_payment ─────────────────────────────────
  bot.on('message', async (ctx, next) => {
    const msg = ctx.message;
    if (!msg?.successful_payment) return next();

    try {
      const pay = msg.successful_payment;
      let payload;
      try {
        payload = JSON.parse(pay.invoice_payload);
      } catch {
        logger.error('successful_payment: payload parse error');
        return;
      }

      const telegramId = ctx.from.id;
      const type = payload.type || 'plan';
      const id   = payload.id;

      if (!id) {
        logger.error('successful_payment: id yo\'q', payload);
        return;
      }

      const activateUrl = `${process.env.FRONTEND_URL}/api/sub/activate`;
      await axios.post(activateUrl, {
        telegramId,
        type,
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
        `✅ *To'lov muvaffaqiyatli!*\n\n` +
        `*${planNames[id] || id}* obunasi faollashtirildi.\n\n` +
        `Endi barcha AI imkoniyatlaridan foydalanishingiz mumkin! 🎓`,
        { parse_mode: 'Markdown' }
      );

      logger.info(`Payment success: user=${telegramId} type=${type} id=${id} stars=${pay.total_amount}`);
    } catch (err) {
      logger.error('successful_payment error:', err?.response?.data || err.message);
      try {
        await ctx.reply('❌ Faollashtirish xatoligi. Biroz kutib ilovani qayta oching.');
      } catch {}
    }
  });

  // ─── Webhook yoki polling ──────────────────────────────────────────────
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

module.exports.getBot = getBot;
