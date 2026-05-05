require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const fs      = require('fs');

const { connectDB }    = require('./utils/db');
const { logger }       = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes  = require('./routes/auth');
const gameRoutes  = require('./routes/games');
const aiRoutes    = require('./routes/ai');
const subRoutes   = require('./routes/subscription');
const adminRoutes = require('./routes/admin');
const examRoutes  = require('./routes/exams');
const profileRoutes = require('./routes/profile');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret', 'x-admin-secret'],
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static frontend ──────────────────────────────────────────────────────────
// Railway: /app/public/  (package.json bilan bir papkada)
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  // PWA uchun service worker Endi mavjud, shuning uchun bu to'siq olib tashlandi
  // app.get('/service-worker.js', (req, res) => res.status(204).end());
  app.get('/manifest.json',     (req, res) => res.status(204).end());
  app.get('/favicon.ico',       (req, res) => res.status(204).end());

  app.use(express.static(publicDir, {
    maxAge: '7d', // Static cache 7 kun
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.html')) {
        res.set('Cache-Control', 'no-cache'); // HTML doim yangilanadi
      }
    },
  }));
  logger.info('Static: ' + publicDir);
} else {
  logger.warn('public/ papkasi topilmadi: ' + publicDir);
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/games',   gameRoutes);
app.use('/api/ai',      aiRoutes);
app.use('/api/sub',     subRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/exams',   examRoutes);
app.use('/api/profile', profileRoutes);

// ─── Telegram Bot ─────────────────────────────────────────────────────────────
require('./bot')(app);

// ─── Health ───────────────────────────────────────────────────────────────────
// ─── Bir martalik seed endpoint ──────────────────────────────────────────────
app.get('/api/seed-questions', async (req, res) => {
  const secret = req.query.secret;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Secret kerak: ?secret=...' });
  }
  try {
    const { seedQuestions } = require('./utils/seedQuestions');
    await seedQuestions();
    const TestQuestion = require('./models/TestQuestion');
    const count = await TestQuestion.countDocuments();
    res.json({ success: true, message: count + ' ta savol bazada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  const { isConnected } = require('./utils/db');
  res.json({
    status: 'ok',
    ts: Date.now(),
    db: isConnected() ? 'connected' : 'disconnected',
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasBotToken: !!process.env.BOT_TOKEN,
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
  });
});

// ─── Client config (public keys only) ────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    botUsername:    process.env.BOT_USERNAME    || 'fikraai_bot',
    adminUsername:  process.env.ADMIN_USERNAME  || '',
    version: '2.0.0',
  });
});

// ─── Admin panel (himoyalangan) ───────────────────────────────────────────────
app.get('/admin', (req, res) => {
  // Basic referer check — to'liq himoya ADMIN_SECRET orqali
  const adminFile = path.join(publicDir, 'admin.html');
  if (fs.existsSync(adminFile)) res.sendFile(adminFile);
  else res.status(404).send('Admin panel topilmadi');
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const index = path.join(publicDir, 'index.html');
  if (fs.existsSync(index)) {
    res.sendFile(index);
  } else {
    res.status(200).json({ status: 'FIKRA API ishlayapti', docs: '/health' });
  }
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
// MUHIM: server avval listen qiladi (Railway port detection uchun),
// keyin DB ga ulanishga urinadi. DB xato bersa ham server ishlaydi.
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ FIKRA server ${PORT} portda ishlamoqda`);
});

// DB ga fonda ulanish — xato bersa ham server o'lmaydi
connectDB().then(ok => {
  if (!ok) {
    logger.warn('⚠️  Server DB siz ishlamoqda. UI faqat ma\'lumotsiz ishlaydi.');
  }
}).catch(err => {
  logger.error('DB initial connect error:', err.message);
});

// Crash bo'lsa ham bilamiz
process.on('uncaughtException',  err => logger.error('Uncaught:', err));
process.on('unhandledRejection', err => logger.error('UnhandledRejection:', err));

module.exports = server;
