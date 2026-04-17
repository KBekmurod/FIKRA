const { Telegraf } = require('telegraf');
const express = require('express');
const { logger } = require('./utils/logger');

const bot = new Telegraf(process.env.BOT_TOKEN);
const router = express.Router();

// ─── Bot commands ─────────────────────────────────────────────────────────────
bot.start(async (ctx) => {
  const firstName = ctx.from.first_name || 'Foydalanuvchi';
  const webAppUrl = process.env.FRONTEND_URL || 'https://your-app.railway.app';

  // Referral linkni tekshirish
  const startParam = ctx.startPayload;
  if (startParam && startParam.startsWith('ref_')) {
    const refUserId = startParam.replace('ref_', '');
    // Referral tokenni saqlash uchun deeplink param
    ctx.session = ctx.session || {};
    ctx.session.refBy = refUserId;
  }

  await ctx.reply(
    `Salom, ${firstName}! 🧠\n\nFIKRA — miya faolligi va bilimlarni sinab ko'rish platformasi.\n\n🎮 O'yinlar · 🤖 AI · 📚 DTM Test`,
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🚀 FIKRA ni ochish',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  );
});

bot.help((ctx) => {
  ctx.reply(
    '📋 Yordam:\n\n' +
    '🎮 /games — O\'yinlar ro\'yxati\n' +
    '💰 /tokens — Token balansingiz\n' +
    '👤 /profile — Profilingiz\n' +
    '⭐ /subscribe — Obuna rejalari'
  );
});

bot.command('tokens', async (ctx) => {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) return ctx.reply('Avval ilovani oching!');
    ctx.reply(`💰 Sizning tokenlaringiz: *${user.tokens}t*`, { parse_mode: 'Markdown' });
  } catch (err) {
    ctx.reply('Xatolik yuz berdi.');
  }
});

bot.command('profile', async (ctx) => {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) return ctx.reply('Avval ilovani oching!');
    ctx.reply(
      `👤 *Profil*\n\n` +
      `Ism: ${user.username || ctx.from.first_name}\n` +
      `Token: ${user.tokens}t\n` +
      `Tarif: ${user.plan}\n` +
      `Streak: ${user.streakDays} kun 🔥`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    ctx.reply('Xatolik yuz berdi.');
  }
});

// ─── Inline mode (optional) ──────────────────────────────────────────────────
bot.on('inline_query', async (ctx) => {
  const webAppUrl = process.env.FRONTEND_URL || 'https://your-app.railway.app';
  await ctx.answerInlineQuery([{
    type: 'article',
    id: '1',
    title: 'FIKRA ni ochish',
    description: 'Miya faolligi va bilim platformasi',
    input_message_content: {
      message_text: `🧠 FIKRA — Miya faolligi platformasi\n${webAppUrl}`
    }
  }]);
});

// ─── Webhook handler ─────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  bot.handleUpdate(req.body, res).catch(err => {
    logger.error('Bot webhook error:', err);
    res.sendStatus(200);
  });
});

// Bot ni webhook rejimida ishga tushirish
async function setupWebhook() {
  if (process.env.NODE_ENV === 'production') {
    const webhookUrl = `${process.env.FRONTEND_URL}/bot`;
    await bot.telegram.setWebhook(webhookUrl);
    logger.info(`Bot webhook set: ${webhookUrl}`);
  } else {
    // Dev muhitda long polling
    bot.launch().then(() => logger.info('Bot long polling started'));
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  }
}

setupWebhook().catch(err => logger.error('Webhook setup error:', err));

module.exports = router;
