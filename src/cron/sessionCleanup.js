const { logger } = require('../utils/logger');
const ExamSession = require('../models/ExamSession');

async function cleanupAbandonedSessions() {
  try {
    // 10 daqiqa (600,000 ms) kechikish bilan tugagan sessiyalarni topish
    const now = new Date();
    
    // Aslida vaqt tugaganini aniqlash qiyin chunki startTime va durationSeconds xar xil.
    // MongoDB Aggregation orqali hisoblash mumkin.
    
    const abandonedSessions = await ExamSession.aggregate([
      { $match: { status: 'in_progress' } },
      {
        $addFields: {
          endTime: {
            $add: ['$startTime', { $multiply: ['$durationSeconds', 1000] }]
          }
        }
      },
      {
        $match: {
          // Vaqti tugaganiga 5 daqiqadan (300,000 ms) oshgan bo'lsa
          endTime: { $lt: new Date(now.getTime() - 300000) }
        }
      }
    ]);

    if (abandonedSessions.length > 0) {
      const ids = abandonedSessions.map(s => s._id);
      await ExamSession.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'abandoned', endReason: 'timeout_cron', endedAt: now } }
      );
      logger.info(`Cron: ${ids.length} ta tashlab ketilgan sessiyalar 'abandoned' holatiga o'tkazildi.`);
    }
  } catch (err) {
    logger.error('Cron session cleanup xatosi:', err.message);
  }
}

function startCron() {
  // Har 5 daqiqada ishlaydi
  setInterval(cleanupAbandonedSessions, 5 * 60 * 1000);
  
  // Dastur ishga tushganda bir marta darhol tekshirish
  setTimeout(cleanupAbandonedSessions, 5000);
  
  logger.info('Session cleanup cron (setInterval) ishga tushdi.');
}

module.exports = { startCron };
