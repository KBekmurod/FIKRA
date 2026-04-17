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
const tokenRoutes = require('./routes/tokens');
const gameRoutes  = require('./routes/games');
const aiRoutes    = require('./routes/ai');
const subRoutes   = require('./routes/subscription');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, 'https://web.telegram.org', /\.railway\.app$/]
    : '*',
  credentials: true,
}));

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static frontend ──────────────────────────────────────────────────────────
// Railway: /app/public/  (package.json bilan bir papkada)
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  logger.info('Static: ' + publicDir);
} else {
  logger.warn('public/ papkasi topilmadi: ' + publicDir);
}

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/games',  gameRoutes);
app.use('/api/ai',     aiRoutes);
app.use('/api/sub',    subRoutes);

// ─── Telegram Bot ─────────────────────────────────────────────────────────────
require('./bot')(app);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

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
async function start() {
  await connectDB();
  app.listen(PORT, () => logger.info(`FIKRA server started on port ${PORT}`));
}

start().catch(err => { logger.error('Start error:', err); process.exit(1); });
module.exports = app;
