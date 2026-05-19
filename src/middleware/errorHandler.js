const { logger } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  // ═══ Hammasi terminalga ko'rinadigan formatda chiqarsin ═══════════════
  const statusCode = err.statusCode || err.status || 500;
  const isServerErr = statusCode >= 500;

  if (isServerErr) {
    // Critical server errors — diqqat tortadigan formatda
    logger.error('═══════════ SERVER ERROR ═══════════');
    logger.error(`[${statusCode}] ${req.method} ${req.originalUrl || req.path}`);
    logger.error(`  Message: ${err.message}`);
    logger.error(`  User: ${req.user?._id || 'anonymous'}`);
    if (req.body && Object.keys(req.body).length) {
      try {
        const bodyStr = JSON.stringify(req.body).slice(0, 300);
        logger.error(`  Body: ${bodyStr}`);
      } catch {}
    }
    if (err.stack) {
      const stackLines = err.stack.split('\n').slice(0, 6).join('\n');
      logger.error(`  Stack:\n${stackLines}`);
    }
    logger.error('═══════════════════════════════════');
  } else {
    // Client errors (4xx) — oddiy log
    logger.warn(`[${statusCode}] ${req.method} ${req.originalUrl || req.path} — ${err.message}`, {
      userId: req.user?._id?.toString() || null,
    });
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: 'Validatsiya xatosi', details: errors });
  }

  // Mongoose CastError (ObjectId noto'g'ri)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Yaroqsiz ID format: ${err.value}`,
      code: 'INVALID_ID',
    });
  }

  // Duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Bunday yozuv allaqachon mavjud' });
  }

  // JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Yaroqsiz token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token muddati tugagan', code: 'TOKEN_EXPIRED' });
  }

  // Multer (fayl yuklash xatolari)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Fayl juda katta' });
  }

  res.status(statusCode).json({
    error: err.message || 'Server xatosi',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// ─── 404 handler — noma'lum route ──────────────────────────────────────
function notFoundHandler(req, res, next) {
  // Faqat API yo'llari uchun (static fayllar uchun emas)
  if (req.path.startsWith('/api/')) {
    logger.warn(`[404] ${req.method} ${req.originalUrl} — Route topilmadi`);
    return res.status(404).json({ error: 'Endpoint topilmadi', path: req.path });
  }
  next();
}

// ─── Promise rejection va uncaughtException global handler ────────────
function setupGlobalHandlers() {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('═══════════ UNHANDLED PROMISE REJECTION ═══════════');
    logger.error(`  Reason: ${reason}`);
    if (reason instanceof Error && reason.stack) {
      logger.error(`  Stack:\n${reason.stack.split('\n').slice(0, 6).join('\n')}`);
    }
    logger.error('═════════════════════════════════════════════════');
  });

  process.on('uncaughtException', (err) => {
    logger.error('═══════════ UNCAUGHT EXCEPTION ═══════════');
    logger.error(`  Message: ${err.message}`);
    if (err.stack) {
      logger.error(`  Stack:\n${err.stack.split('\n').slice(0, 6).join('\n')}`);
    }
    logger.error('═══════════════════════════════════════════');
    // Eslatma: production'da bu yerda graceful shutdown qilinishi mumkin
  });
}

module.exports = { errorHandler, notFoundHandler, setupGlobalHandlers };
