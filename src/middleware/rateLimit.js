const rateLimit = require('express-rate-limit');

// Umumiy API limit
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
});

// Auth uchun qattiqroq limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Juda ko\'p urinish. 15 daqiqadan keyin.' },
});

// AI uchun limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
  message: { error: 'AI so\'rovlar haddan oshdi. Bir daqiqada max 50 ta.' },
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
