require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const fs      = require('fs');

const { connectDB }    = require('./utils/db');
const { logger }       = require('./utils/logger');
const { errorHandler, notFoundHandler, setupGlobalHandlers } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Global handlers (uncaught exceptions, promise rejections)
setupGlobalHandlers();

const authRoutes          = require('./routes/auth');
const gameRoutes          = require('./routes/games');
const aiRoutes            = require('./routes/ai');
const subRoutes           = require('./routes/subscription');
const adminRoutes         = require('./routes/admin');
const examRoutes          = require('./routes/exams');
const materialRoutes      = require('./routes/materials');
const folderRoutes        = require('./routes/folders');
const personalTestRoutes  = require('./routes/personalTests');
const levelRoutes         = require('./routes/level');
const logRoutes           = require('./routes/log');

const app  = express();

// ─── Proxy trust ─────────────────────────────────────────────────────────
app.set('trust proxy', 1);
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
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  // PWA fayllar uchun to'g'ri header'lar
  app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(path.join(publicDir, 'manifest.json'));
  });
  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(publicDir, 'sw.js'));
  });
  app.get('/service-worker.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Service-Worker-Allowed', '/');
    res.sendFile(path.join(publicDir, 'sw.js'));
  });

  app.use(express.static(publicDir, {
    maxAge: '7d',
    setHeaders: (res, filepath) => {
      if (filepath.endsWith('.html')) {
        res.set('Cache-Control', 'no-cache');
      }
    },
  }));
  logger.info('Static: ' + publicDir);
} else {
  logger.warn('public/ papkasi topilmadi: ' + publicDir);
}

// ─── API Rate Limit (umumiy) ──────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/games',          gameRoutes);
app.use('/api/ai',             aiRoutes);
app.use('/api/sub',            subRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/exams',          examRoutes);
app.use('/api/materials',      materialRoutes);
app.use('/api/folders',        folderRoutes);
app.use('/api/personal-tests', personalTestRoutes);
app.use('/api/level',          levelRoutes);
app.use('/api/log',            logRoutes);

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

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const { isConnected } = require('./utils/db');
  res.json({
    status: 'ok',
    ts: Date.now(),
    db: isConnected() ? 'connected' : 'disconnected',
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
    },
  });
});

// ─── Client config (public keys only) ────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    adminUsername:  process.env.ADMIN_USERNAME  || '',
    version: '8.0.0',
  });
});

// ─── Admin panel (himoyalangan) ───────────────────────────────────────────────
app.get('/admin', (req, res) => {
  const adminFile = path.join(publicDir, 'admin.html');
  if (fs.existsSync(adminFile)) res.sendFile(adminFile);
  else res.status(404).send('Admin panel topilmadi');
});

// ─── API 404 handler ──────────────────────────────────────────────────────────
// API yo'llari uchun 404 — SPA fallback'dan OLDIN bo'lishi kerak
app.use(notFoundHandler);

// ─── SPA fallback ─────────────────────────────────────────────────────────────
// Faqat API bo'lmagan GET yo'llar uchun — React Router ishlashi uchun
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

// ─── Cron Jobs ────────────────────────────────────────────────────────────────
require('./cron/sessionCleanup').startCron();

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`✅ FIKRA server ${PORT} portda ishlamoqda`);
});

// DB ga fonda ulanish
connectDB().then(ok => {
  if (!ok) {
    logger.warn('⚠️  Server DB siz ishlamoqda. UI faqat ma\'lumotsiz ishlaydi.');
  }
}).catch(err => {
  logger.error('DB initial connect error:', err.message);
});

// Eslatma: global error handlers setupGlobalHandlers() orqali o'rnatilgan (L13)

module.exports = server;
