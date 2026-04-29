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

  // /start
  bot.start(async (ctx) => {
    const name = ctx.from.first_name || 'Abituriyent';
    await ctx.reply(
      `Salom, ${name}! 🎓\n\n` +
      `*FIKRA* — DTM testlariga tayyorlanish platformasi.\n\n` +
      `📚 DTM test savollar — cheksiz\n` +
      `💡 AI tushuntirish — har savol yonida\n` +
      `🤖 AI Chat va Hujjat yaratish\n\n` +
      `Boshlash uchun ilovani oching 👇`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🚀 FIKRA — DTM tayyorlik', web_app: { url: webAppUrl } }
          ]]
        }
      }
    );
  });

  // /profile
  bot.command('profile', async (ctx) => {
    try {
      const User = require('./models/User');
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (!user) return ctx.reply('Avval ilovani oching!');

      const planEmoji = { free: '🆓', basic: '⭐', pro: '✨', vip: '💎' };
      const effective = user.effectivePlan();
      const isActive = effective !== 'free';
      const daysLeft = (isActive && user.planExpiresAt)
        ? Math.ceil((user.planExpiresAt - new Date()) / 86400000) : 0;

      ctx.reply(
        `👤 *${user.firstName || 'Profil'}*\n\n` +
        `${planEmoji[effective] || '🆓'} Tarif: *${effective}*${isActive ? ` (${daysLeft} kun)` : ''}\n` +
        `🔥 Streak: ${user.streakDays} kun\n` +
        `⚡ XP: ${user.xp || 0}\n` +
        `🤖 AI so'rovlar: ${user.totalAiRequests || 0}`,
        { parse_mode: 'Markdown' }
      );
    } catch { ctx.reply('Xatolik.'); }
  });

  // /admin (faqat admin uchun)
  bot.command('admin', async (ctx) => {
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
    if (!adminIds.includes(ctx.from.id)) return;
    ctx.reply(
      `🔐 *Admin Panel*\n${webAppUrl}/admin\n\nKalitni kiritib kirish mumkin.`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🔐 Admin Panel', url: webAppUrl + '/admin' }]] }
      }
    );
  });

  // /help
  bot.command('help', (ctx) => {
    ctx.reply(
      `📚 *FIKRA buyruqlari*\n\n` +
      `/start — Bosh sahifa\n/profile — Profilim\n/help — Yordam`,
      { parse_mode: 'Markdown' }
    );
  });

  // ─── Stars to'lovi: pre_checkout ──────────────────────────────────────
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

  // ─── Stars to'lovi: successful_payment ────────────────────────────────
  bot.on('message', async (ctx, next) => {
    const msg = ctx.message;
    if (!msg?.successful_payment) return next();

    try {
      const pay = msg.successful_payment;
      const payload = JSON.parse(pay.invoice_payload);
      const telegramId = ctx.from.id;
      const id = payload.id;
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
        pro_1m: 'Pro · 1 oy', pro_3m: 'Pro · 3 oy',
        vip_1m: 'VIP · 1 oy', vip_3m: 'VIP · 3 oy',
      };

      await ctx.reply(
        `✅ *To'lov muvaffaqiyatli!*\n\n*${planNames[id] || id}* faollashtirildi.\n\nIlovani qayta oching! 🎓`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      logger.error('successful_payment:', err.message);
      try { await ctx.reply('❌ Xato. Qayta urinib ko\'ring.'); } catch {}
    }
  });

  // Webhook yoki polling
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
