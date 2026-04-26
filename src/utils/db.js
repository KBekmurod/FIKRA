const mongoose = require('mongoose');
const { logger } = require('./logger');

let _isConnected = false;

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    logger.error('⚠️  MONGODB_URI sozlanmagan!');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    _isConnected = true;
    logger.info('✅ MongoDB ulanish muvaffaqiyatli');

    mongoose.connection.on('error', err => {
      logger.error('MongoDB xatosi:', err.message);
      _isConnected = false;
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB uzildi, qayta ulanmoqda...');
      _isConnected = false;
    });
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB qayta ulandi');
      _isConnected = true;
    });
    return true;
  } catch (err) {
    logger.error('❌ MongoDB ulanishda xatolik:', err.message);
    // Server o'lmasin - 30 soniyada qayta urinib ko'ramiz
    setTimeout(() => connectDB(), 30000);
    return false;
  }
}

function isConnected() { return _isConnected; }

module.exports = { connectDB, isConnected };
