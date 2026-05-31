const mongoose = require('mongoose');

const adminConfigSchema = new mongoose.Schema({
  // Faqat 1 ta yozuv bo'lishi uchun
  isSingleton: { type: Boolean, default: true, unique: true },

  // Valyuta
  usdToUzsRate: { type: Number, default: 12700 },

  // API Xarajatlar (USD hisobida)
  costPerChat: { type: Number, default: 0.00042 },
  costPerTest: { type: Number, default: 0.00150 },
  costPerDoc:  { type: Number, default: 0.00100 },
  costPerHint: { type: Number, default: 0.00020 },
  costPerImg:  { type: Number, default: 0.00050 },

  // Doimiy xarajatlar (Server, Domain va h.k - USD hisobida oylik)
  fixedMonthlyCosts: { type: Number, default: 5.00 },

}, { timestamps: true });

module.exports = mongoose.model('AdminConfig', adminConfigSchema);
