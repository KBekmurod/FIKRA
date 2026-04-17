const mongoose = require('mongoose');
const { logger } = require('./logger');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('MongoDB Atlas ulanish muvaffaqiyatli');

    mongoose.connection.on('error', err => {
      logger.error('MongoDB xatosi:', err);
    });
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB uzildi, qayta ulanishga harakat...');
    });
  } catch (err) {
    logger.error('MongoDB ulanishda xatolik:', err.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
