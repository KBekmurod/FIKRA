const { Telegraf } = require('telegraf');
const { logger }   = require('./utils/logger');

module.exports = function setupBot(app) {
  if (!process.env.BOT_TOKEN || process.env.BOT_TOKEN === 'placeholder') {
    logger.warn('BOT_TOKEN sozlanmagan — bot ishlamaydi');
    return;
  }

  const bot = new Telegraf(process.env.BOT_TOKEN);
  const webAppUrl = process.env.FRONTEND_URL || 'https://t.me';

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

  bot.command('tokens', async (ctx) => {
    try {
      const User = require('./models/User');
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (!user) return ctx.reply('Avval ilovani oching!');
      ctx.reply(`💰 Tokenlaringiz: *${user.tokens}t*`, { parse_mode: 'Markdown' });
    } catch { ctx.reply('Xatolik.'); }
  });

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
