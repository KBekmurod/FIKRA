require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { connectDB } = require('./utils/db');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const tokenRoutes = require('./routes/tokens');
const gameRoutes = require('./routes/games');
const aiRoutes = require('./routes/ai');
const subRoutes = require('./routes/subscription');
const botWebhook = require('./bot');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Mini App iframe uchun
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, 'https://web.telegram.org']
    : '*',
  credentials: true,
}));

// ─── Body parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static frontend ─────────────────────────────────────────────────────────
// frontend/ papkasi backend/ ichida joylashgan (Railway deploy uchun)
const fs = require('fs');
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
  logger.info(`Frontend serving from: ${frontendPath}`);
  app.use(express.static(frontendPath));
} else {
  logger.warn('Frontend papkasi topilmadi: ' + frontendPath);
}

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sub', subRoutes);

// ─── Telegram Bot webhook ────────────────────────────────────────────────────
app.use('/bot', botWebhook);

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// ─── SPA fallback ────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ status: 'API ishlayapti', frontend: 'topilmadi' });
  }
});

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`FIKRA server started on port ${PORT}`);
  });
}

start().catch(err => {
  logger.error('Server start error:', err);
  process.exit(1);
});

module.exports = app;
