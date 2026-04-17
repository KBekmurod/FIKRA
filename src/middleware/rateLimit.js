const rateLimit = require('express-rate-limit');

// Umumiy API limit
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Juda ko\'p so\'rov. Keyinroq urinib ko\'ring.' },
});

// Auth uchun qattiqroq limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Juda ko\'p urinish. 15 daqiqadan keyin.' },
});

// Ads reward uchun limit (suistemodallikni oldini olish)
const adsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 daqiqa
  max: parseInt(process.env.ADS_RATE_LIMIT_PER_MINUTE) || 3,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
  message: { error: 'Reklama chastotasi haddan oshdi.' },
});

// AI uchun limit
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
  message: { error: 'AI so\'rovlar haddan oshdi. Bir daqiqada max 20 ta.' },
});

module.exports = { apiLimiter, authLimiter, adsLimiter, aiLimiter };
