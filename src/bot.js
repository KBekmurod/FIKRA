const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const { logger } = require('./utils/logger');
const examService      = require('./services/examService');
const analyticsService = require('./services/analyticsService');
const aiService        = require('./services/aiService');
const documentService  = require('./services/documentService');
const User             = require('./models/User');
const ExamSession      = require('./models/ExamSession');

// ─── In-memory conversation state ────────────────────────────────────────────
// Stores per-user flow state (direction selection, AI chat, etc.)
const userStates = new Map();

// ─── Daily exam session limits per plan ──────────────────────────────────────
const EXAM_DAILY_LIMITS = { free: 1, basic: 3, pro: Infinity, vip: Infinity };

// ─── Supported directions (must match examService.DIRECTION_MAP keys) ────────
const DIRECTIONS = [
  { label: '🏥 Tibbiyot',         value: 'tibbiyot' },
  { label: '💻 IT / Informatika', value: 'it' },
  { label: '💰 Iqtisodiyot',      value: 'iqtisodiyot' },
  { label: '📖 Pedagogika',       value: 'pedagogika' },
  { label: '🏗 Arxitektura',      value: 'arxitektura' },
  { label: '📰 Jurnalistika',     value: 'jurnalistika' },
  { label: '🇷🇺 Rus filologiyasi', value: 'rus_fili' },
  { label: '⚗️ Kimyo',            value: 'kimyo' },
  { label: '⚡ Fizika',           value: 'fizika' },
  { label: '🇬🇧 Ingliz tili',     value: 'ingliz_tili' },
];

// ─── Persistent main-menu ReplyKeyboard ──────────────────────────────────────
const mainMenu = Markup.keyboard([
  ['📝 Blok test boshlash', '📊 Mening natijalarim'],
  ['🧠 Xatolar ustida ishlash', '👤 Profilim'],
  ['🚀 Ilovani ochish'],
]).resize();

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getUser(telegramId) {
  return User.findOne({ telegramId });
}

/**
 * Count how many ExamSession documents the user has started today
 * (in Tashkent UTC+5 timezone).
 */
async function countTodayExams(userId) {
  const todayKey = User.todayKey(); // 'YYYY-MM-DD' Tashkent time
  // Midnight Tashkent = midnight UTC of the same date minus 5 h
  const startOfDay = new Date(
    new Date(todayKey + 'T00:00:00.000Z').getTime() - 5 * 3600 * 1000,
  );
  return ExamSession.countDocuments({ userId, startTime: { $gte: startOfDay } });
}

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

  // ─── /start ───────────────────────────────────────────────────────────────
  bot.start(async (ctx) => {
    const name = ctx.from.first_name || 'Abituriyent';
    await ctx.reply(
      `Salom, ${name}! 🎓\n\n` +
      `*FIKRA* — DTM testlariga tayyorlanish platformasi.\n\n` +
      `📝 Blok test — 90 savollik DTM formati\n` +
      `📊 Natijalar — o'sishingizni kuzating\n` +
      `🧠 AI tahlil — zaif mavzularni mustahkamlang\n` +
      `🤖 AI Chat va Hujjat yaratish\n\n` +
      `Menyudan tanlang yoki ilovani oching 👇`,
      {
        parse_mode: 'Markdown',
        ...mainMenu,
      },
    );
  });

  // ─── 📝 Blok test boshlash ────────────────────────────────────────────────
  bot.hears('📝 Blok test boshlash', async (ctx) => {
    try {
      const user = await getUser(ctx.from.id);
      if (!user) {
        return ctx.reply(
          `❗ Avval ilovani oching va ro'yxatdan o'ting:\n${webAppUrl}`,
          mainMenu,
        );
      }

      const plan  = user.effectivePlan();
      const limit = EXAM_DAILY_LIMITS[plan] ?? 1;

      if (limit !== Infinity) {
        const todayCount = await countTodayExams(user._id);
        if (todayCount >= limit) {
          const upgradeMsg = plan === 'free'
            ? '🆓 *Free tarif:* kuniga 1 ta test.\n\n⭐ *Basic* (3 ta/kun) yoki ✨ *Pro* (cheksiz) tarifga o\'ting!'
            : '⭐ *Basic tarif:* kuniga 3 ta test.\n\n✨ *Pro* (cheksiz) tarifga o\'ting!';
          return ctx.reply(
            `❌ Bugungi test limitingiz tugadi.\n\n${upgradeMsg}`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [[
                  { text: '💎 Tarifni yangilash', web_app: { url: `${webAppUrl}/pricing` } },
                ]],
              },
            },
          );
        }
      }

      // Build direction selection inline keyboard (2 per row)
      const rows = [];
      for (let i = 0; i < DIRECTIONS.length; i += 2) {
        const row = [Markup.button.callback(DIRECTIONS[i].label, `dir:${DIRECTIONS[i].value}`)];
        if (DIRECTIONS[i + 1]) {
          row.push(Markup.button.callback(DIRECTIONS[i + 1].label, `dir:${DIRECTIONS[i + 1].value}`));
        }
        rows.push(row);
      }
      rows.push([Markup.button.callback('❌ Bekor qilish', 'cancel')]);

      await ctx.reply('📚 *Yo\'nalishni tanlang:*', {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: rows },
      });
    } catch (err) {
      logger.error('Blok test handler:', err.message);
      ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.').catch(() => {});
    }
  });

  // ─── 📊 Mening natijalarim ────────────────────────────────────────────────
  bot.hears('📊 Mening natijalarim', async (ctx) => {
    try {
      const user = await getUser(ctx.from.id);
      if (!user) {
        return ctx.reply(
          `❗ Avval ilovani oching va ro'yxatdan o'ting:\n${webAppUrl}`,
          mainMenu,
        );
      }

      const progress = await analyticsService.getUserProgress(user._id);

      if (!progress.history.length) {
        return ctx.reply(
          '📊 *Natijalarim*\n\nHali birorta test topshirmagansiz.\n\n📝 "Blok test boshlash" tugmasini bosing!',
          { parse_mode: 'Markdown', ...mainMenu },
        );
      }

      const trendStr = progress.growthTrend >= 0
        ? `📈 +${progress.growthTrend}%`
        : `📉 ${progress.growthTrend}%`;

      let text =
        `📊 *Mening natijalarim*\n\n` +
        `🏆 O'rtacha ball: *${progress.overallAvg}*\n` +
        `📅 Oxirgi 3 ta test o'rtachasi: *${progress.recentAvg}*\n` +
        `${trendStr} O'sish tendentsiyasi\n` +
        `📋 Jami testlar: *${progress.history.length}*\n`;

      const plan = user.effectivePlan();

      if (plan === 'pro' || plan === 'vip') {
        // Detailed topic analytics for Pro/VIP
        const topicData = await analyticsService.getUserTopicAnalytics(user._id);
        if (topicData.length) {
          text += '\n━━━━━━━━━━━━━━━━━━━━\n';
          text += '📚 *Mavzu bo\'yicha tahlil:*\n\n';
          for (const subj of topicData.slice(0, 4)) {
            const weak = subj.topics.filter(t => t.isWeak).slice(0, 2);
            const best = subj.topics.reduce(
              (a, b) => (b.accuracy > a.accuracy ? b : a),
              subj.topics[0],
            );
            text += `*${subj.subject.toUpperCase()}*\n`;
            text += `  🔴 Zaif: ${weak.map(t => `${t.topic} (${t.accuracy}%)`).join(', ') || 'yo\'q'}\n`;
            text += `  🟢 Kuchli: ${best.topic} (${best.accuracy}%)\n\n`;
          }
        }
        await ctx.reply(text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📄 PDF yuklash',  callback_data: 'export_analytics_pdf' }],
              [{ text: '📝 Word yuklash', callback_data: 'export_analytics_docx' }],
            ],
          },
        });
      } else {
        // Basic analytics only for free/basic
        text += '\n\n💡 *Pro/VIP tarifda* chuqur mavzu tahlili va hujjat eksporti mavjud!';
        await ctx.reply(text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '✨ Pro tarifga o\'tish', web_app: { url: `${webAppUrl}/pricing` } },
            ]],
          },
        });
      }
    } catch (err) {
      logger.error('Natijalar handler:', err.message);
      ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.').catch(() => {});
    }
  });

  // ─── 🧠 Xatolar ustida ishlash ────────────────────────────────────────────
  bot.hears('🧠 Xatolar ustida ishlash', async (ctx) => {
    try {
      const user = await getUser(ctx.from.id);
      if (!user) {
        return ctx.reply(
          `❗ Avval ilovani oching va ro'yxatdan o'ting:\n${webAppUrl}`,
          mainMenu,
        );
      }

      const topicData = await analyticsService.getUserTopicAnalytics(user._id);

      let systemCtx = 'Sen FIKRA — DTM testlariga tayyorlovchi AI yordamchisan. O\'zbek tilida samimiy, aniq va foydali javob ber.';
      let intro = '🧠 *AI bilan xatolar ustida ishlash*\n\n';

      if (topicData.length) {
        const weakTopics = [];
        for (const subj of topicData) {
          subj.topics.filter(t => t.isWeak).forEach(t =>
            weakTopics.push(`${subj.subject}: ${t.topic} (${t.accuracy}%)`),
          );
        }
        if (weakTopics.length) {
          intro += 'Tahlil asosida zaif mavzularingiz:\n';
          weakTopics.slice(0, 5).forEach((t, i) => { intro += `${i + 1}. ${t}\n`; });
          intro += '\nQuyida biror mavzu haqida savol bering, AI tushuntirib beradi!';
          systemCtx += ` Foydalanuvchining zaif mavzulari: ${weakTopics.slice(0, 5).join(', ')}. Ana shu mavzularga e'tibor qarat.`;
        } else {
          intro += 'Siz barcha mavzularda yaxshi ko\'rsatkichga egasiz! 🎉\n\nBaribir biror savol bo\'lsa so\'rang!';
        }
      } else {
        intro += 'Hali testlar topshirmagansiz, shuning uchun tahlil yo\'q.\n\nAmmo istalgan DTM mavzusida savol berishingiz mumkin!';
      }

      intro += '\n\n💬 Savolingizni yozing... (chiqish: /menu)';

      userStates.set(ctx.from.id, { step: 'ai_chat', systemContext: systemCtx });

      await ctx.reply(intro, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [['❌ Chatni yakunlash']],
          resize_keyboard: true,
        },
      });
    } catch (err) {
      logger.error('Xatolar ustida ishlash handler:', err.message);
      ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.').catch(() => {});
    }
  });

  // ─── ❌ Chatni yakunlash / /menu ──────────────────────────────────────────
  bot.hears('❌ Chatni yakunlash', async (ctx) => {
    userStates.delete(ctx.from.id);
    await ctx.reply('✅ AI chat yakunlandi.', mainMenu);
  });

  bot.command('menu', async (ctx) => {
    userStates.delete(ctx.from.id);
    await ctx.reply('Asosiy menyu:', mainMenu);
  });

  // ─── 👤 Profilim ──────────────────────────────────────────────────────────
  bot.hears('👤 Profilim', async (ctx) => {
    try {
      const user = await getUser(ctx.from.id);
      if (!user) return ctx.reply('Avval ilovani oching!', mainMenu);

      const planEmoji = { free: '🆓', basic: '⭐', pro: '✨', vip: '💎' };
      const effective = user.effectivePlan();
      const isActive  = effective !== 'free';
      const daysLeft  = (isActive && user.planExpiresAt)
        ? Math.ceil((user.planExpiresAt - new Date()) / 86400000) : 0;

      await ctx.reply(
        `👤 *${user.firstName || 'Profil'}*\n\n` +
        `${planEmoji[effective] || '🆓'} Tarif: *${effective}*${isActive ? ` (${daysLeft} kun)` : ''}\n` +
        `🔥 Streak: ${user.streakDays} kun\n` +
        `⚡ XP: ${user.xp || 0}\n` +
        `🤖 AI so'rovlar: ${user.totalAiRequests || 0}`,
        { parse_mode: 'Markdown', ...mainMenu },
      );
    } catch { ctx.reply('Xatolik.').catch(() => {}); }
  });

  // ─── 🚀 Ilovani ochish ────────────────────────────────────────────────────
  bot.hears('🚀 Ilovani ochish', async (ctx) => {
    await ctx.reply('🚀 *FIKRA ilovasini oching:*', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🚀 FIKRA — DTM tayyorlik', web_app: { url: webAppUrl } },
        ]],
      },
    });
  });

  // ─── /profile (backward compatibility) ───────────────────────────────────
  bot.command('profile', async (ctx) => {
    try {
      const user = await getUser(ctx.from.id);
      if (!user) return ctx.reply('Avval ilovani oching!');

      const planEmoji = { free: '🆓', basic: '⭐', pro: '✨', vip: '💎' };
      const effective = user.effectivePlan();
      const isActive  = effective !== 'free';
      const daysLeft  = (isActive && user.planExpiresAt)
        ? Math.ceil((user.planExpiresAt - new Date()) / 86400000) : 0;

      await ctx.reply(
        `👤 *${user.firstName || 'Profil'}*\n\n` +
        `${planEmoji[effective] || '🆓'} Tarif: *${effective}*${isActive ? ` (${daysLeft} kun)` : ''}\n` +
        `🔥 Streak: ${user.streakDays} kun\n` +
        `⚡ XP: ${user.xp || 0}\n` +
        `🤖 AI so'rovlar: ${user.totalAiRequests || 0}`,
        { parse_mode: 'Markdown' },
      );
    } catch { ctx.reply('Xatolik.').catch(() => {}); }
  });

  // ─── /admin ───────────────────────────────────────────────────────────────
  bot.command('admin', async (ctx) => {
    const adminIds = (process.env.ADMIN_TELEGRAM_IDS || '')
      .split(',').map(s => parseInt(s.trim(), 10)).filter(Boolean);
    if (!adminIds.includes(ctx.from.id)) return;
    ctx.reply(
      `🔐 *Admin Panel*\n${webAppUrl}/admin\n\nKalitni kiritib kirish mumkin.`,
      {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [[{ text: '🔐 Admin Panel', url: `${webAppUrl}/admin` }]] },
      },
    );
  });

  // ─── /help ────────────────────────────────────────────────────────────────
  bot.command('help', (ctx) => {
    ctx.reply(
      `📚 *FIKRA buyruqlari*\n\n` +
      `/start — Bosh sahifa\n` +
      `/profile — Profilim\n` +
      `/menu — Asosiy menyuga qaytish\n` +
      `/help — Yordam\n\n` +
      `*Menyudan foydalanish:*\n` +
      `📝 Blok test boshlash — 90 savollik DTM testi\n` +
      `📊 Mening natijalarim — statistika va tahlil\n` +
      `🧠 Xatolar ustida ishlash — AI bilan zaif mavzular`,
      { parse_mode: 'Markdown', ...mainMenu },
    );
  });

  // ─── Callback queries ─────────────────────────────────────────────────────
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery?.data;
    if (!data) return ctx.answerCbQuery().catch(() => {});

    try {
      // ── Direction selection ──────────────────────────────────────────────
      if (data.startsWith('dir:')) {
        const direction = data.slice(4);
        await ctx.answerCbQuery();

        const user = await getUser(ctx.from.id);
        if (!user) {
          return ctx.editMessageText('❗ Avval ilovani oching va ro\'yxatdan o\'ting.');
        }

        // Re-check limit (guard against double-taps)
        const plan  = user.effectivePlan();
        const limit = EXAM_DAILY_LIMITS[plan] ?? 1;
        if (limit !== Infinity) {
          const todayCount = await countTodayExams(user._id);
          if (todayCount >= limit) {
            return ctx.editMessageText(
              '❌ Bugungi test limitingiz tugadi. Ertaga qayta urinib ko\'ring yoki tarifni yangilang.',
            );
          }
        }

        await ctx.editMessageText(
          `⏳ *${direction}* yo'nalishi uchun test tayyorlanmoqda...`,
          { parse_mode: 'Markdown' },
        );

        const { session, questions } = await examService.startExamSession(user._id, direction);

        userStates.set(ctx.from.id, {
          step: 'exam_started',
          sessionId: session._id,
          direction,
        });

        const dirLabel = DIRECTIONS.find(d => d.value === direction)?.label || direction;
        await ctx.reply(
          `✅ *Test boshlandi!*\n\n` +
          `📚 Yo'nalish: ${dirLabel}\n` +
          `📋 Savollar soni: ${questions.length}\n` +
          `🆔 Sessiya ID: \`${session._id}\`\n\n` +
          `Test topshirish uchun ilovani oching 👇`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '🚀 Testni boshlash', web_app: { url: `${webAppUrl}/exam/${session._id}` } },
              ]],
            },
          },
        );
        return;
      }

      // ── Cancel ────────────────────────────────────────────────────────────
      if (data === 'cancel') {
        await ctx.answerCbQuery('Bekor qilindi');
        return ctx.editMessageText('❌ Bekor qilindi.');
      }

      // ── Analytics document export (Pro/VIP only) ──────────────────────────
      if (data === 'export_analytics_pdf' || data === 'export_analytics_docx') {
        await ctx.answerCbQuery('⏳ Hujjat tayyorlanmoqda...');

        const user = await getUser(ctx.from.id);
        if (!user) return ctx.reply('❗ Foydalanuvchi topilmadi.');

        const plan = user.effectivePlan();
        if (plan !== 'pro' && plan !== 'vip') {
          return ctx.reply(
            '❌ Hujjat eksporti faqat Pro/VIP foydalanuvchilar uchun.\n\n✨ Pro tarifga o\'ting!',
          );
        }

        const [progress, topicData] = await Promise.all([
          analyticsService.getUserProgress(user._id),
          analyticsService.getUserTopicAnalytics(user._id),
        ]);

        // Build markdown content for the document
        let content = `# ${user.firstName || 'Foydalanuvchi'} — DTM Tahlil Hisoboti\n\n`;
        content += `## Umumiy ko'rsatkichlar\n\n`;
        content += `- O'rtacha ball: ${progress.overallAvg}\n`;
        content += `- Oxirgi 3 test o'rtachasi: ${progress.recentAvg}\n`;
        content += `- O'sish tendentsiyasi: ${progress.growthTrend >= 0 ? '+' : ''}${progress.growthTrend}%\n`;
        content += `- Jami testlar: ${progress.history.length}\n\n`;

        if (topicData.length) {
          content += `## Mavzu bo'yicha tahlil\n\n`;
          for (const subj of topicData) {
            content += `### ${subj.subject.toUpperCase()}\n\n`;
            for (const topic of subj.topics) {
              const status = topic.isWeak ? '🔴' : '🟢';
              content += `- ${status} ${topic.topic}: ${topic.accuracy}% (${topic.correct}/${topic.total})\n`;
            }
            content += '\n';
          }
        }

        content += '\n---\n*FIKRA AI tomonidan tayyorlandi*';

        const fmt      = data === 'export_analytics_pdf' ? 'pdf' : 'docx';
        const buffer   = await documentService.exportDocumentAsBuffer(content, fmt);
        const filename = `FIKRA_tahlil_${new Date().toISOString().slice(0, 10)}.${fmt}`;

        await ctx.replyWithDocument({ source: buffer, filename });
        return;
      }

      await ctx.answerCbQuery();
    } catch (err) {
      logger.error('callback_query handler:', err.message);
      try { await ctx.answerCbQuery('❌ Xatolik'); } catch {}
      ctx.reply('❌ Xatolik yuz berdi. Qayta urinib ko\'ring.').catch(() => {});
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

  // ─── Message handler: Stars payment + AI chat ─────────────────────────────
  bot.on('message', async (ctx, next) => {
    const msg = ctx.message;

    // 1. Handle Stars successful_payment
    if (msg?.successful_payment) {
      try {
        const pay         = msg.successful_payment;
        const payload     = JSON.parse(pay.invoice_payload);
        const telegramId  = ctx.from.id;
        const id          = payload.id;
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
          { parse_mode: 'Markdown', ...mainMenu },
        );
      } catch (err) {
        logger.error('successful_payment:', err.message);
        try { await ctx.reply('❌ Xato. Qayta urinib ko\'ring.'); } catch {}
      }
      return;
    }

    // 2. Handle AI chat mode (stateful)
    const state = userStates.get(ctx.from.id);
    if (state?.step === 'ai_chat' && msg?.text) {
      try {
        await ctx.sendChatAction('typing');

        const user = await getUser(ctx.from.id);
        if (!user) {
          userStates.delete(ctx.from.id);
          return ctx.reply('❗ Avval ilovani oching.', mainMenu);
        }

        const reply = await aiService.chatWithMemory(user._id, msg.text);

        await ctx.reply(reply, {
          reply_markup: {
            keyboard: [['❌ Chatni yakunlash']],
            resize_keyboard: true,
          },
        });
      } catch (err) {
        logger.error('AI chat handler:', err.message);
        ctx.reply('❌ AI javob bera olmadi. Qayta urinib ko\'ring.').catch(() => {});
      }
      return;
    }

    return next();
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
