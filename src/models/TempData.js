const mongoose = require('mongoose');

const tempDataSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // ba'zi ma'lumotlarda auth kerak emas bo'lishi mumkin (masalan ai file yuklab olish)
  },
  kind: {
    type: String, // 'ocr', 'file', 'document', 'image'
  },
  payload: {
    type: mongoose.Schema.Types.Mixed, // Har xil obyekt saqlash uchun
  },
  bufferData: {
    type: Buffer, // Fayl kelsa buffer uchun
  },
  mimeType: {
    type: String,
  },
  fileName: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800, // 30 daqiqadan keyin o'chadi
  },
});

module.exports = mongoose.model('TempData', tempDataSchema);
