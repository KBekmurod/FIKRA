// ─── Global Error Logging ────────────────────────────────────────────────
// Frontend va backend xatolarini terminalda ko'rinadigan qiladi.
// Frontend ErrorBoundary va `window.onerror` shu endpoint'ga yuboradi.

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// ─── POST /api/log/client-error ──────────────────────────────────────────
// Frontend xatolari (ErrorBoundary, window.onerror, unhandledrejection)
// Auth shart emas — log uchun ochiq endpoint (rate limited)
router.post('/client-error', express.json({ limit: '50kb' }), async (req, res) => {
  try {
    const { message, stack, component, url, userAgent, timestamp, type } = req.body || {};

    // Terminal'da diqqat tortadigan formatda chiqaramiz
    logger.error('═══════════ CLIENT ERROR ═══════════');
    logger.error(`[FRONTEND] ${type || 'error'}: ${message || 'unknown'}`);
    if (url) logger.error(`  URL: ${url}`);
    if (userAgent) logger.error(`  UA: ${userAgent?.slice(0, 100)}`);
    if (component) logger.error(`  Component: ${component?.slice(0, 300)}`);
    if (stack) logger.error(`  Stack: ${stack?.slice(0, 500)}`);
    if (timestamp) logger.error(`  Time: ${timestamp}`);
    logger.error('═══════════════════════════════════');

    res.status(204).end();
  } catch (e) {
    logger.error('Client error log failed:', e.message);
    res.status(204).end();
  }
});

// ─── POST /api/log/client-info ───────────────────────────────────────────
// Frontend info-level log'lar (network xatolari va h.k.)
router.post('/client-info', express.json({ limit: '50kb' }), async (req, res) => {
  try {
    const { message, url, status, method } = req.body || {};
    logger.warn(`[FRONTEND-INFO] ${message} ${method || ''} ${url || ''} ${status || ''}`);
    res.status(204).end();
  } catch (e) {
    res.status(204).end();
  }
});

module.exports = router;
