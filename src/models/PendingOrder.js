const mongoose = require('mongoose');

// P2P to'lov orqali obuna so'rovi
// Foydalanuvchi ID oladi → admin panelda tasdiqlaydi
const pendingOrderSchema = new mongoose.Schema({
  // Foydalanuvchi
  telegramId:   { type: Number, required: true, index: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:     { type: String, default: '' },
  firstName:    { type: String, default: '' },

  // Buyurtma
  orderId:      { type: String, required: true, unique: true }, // #FK-XXXXX
  planId:       { type: String, required: true },  // 'basic_1m', 'pro_3m' ...
  planName:     { type: String, default: '' },
  priceUZS:    { type: Number, default: 0 },
  priceStars:  { type: Number, default: 0 },
  paymentType: { type: String, enum: ['p2p', 'stars'], default: 'p2p' },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'expired'],
    default: 'pending',
    index: true,
  },

  // Admin
  confirmedBy: { type: Number, default: null },  // admin telegramId
  confirmedAt: { type: Date,   default: null },
  rejectedReason: { type: String, default: '' },
  note: { type: String, default: '' }, // admin izohi

  expiresAt: { type: Date, default: () => new Date(Date.now() + 72 * 3600000) }, // 72 soat
}, { timestamps: true });

module.exports = mongoose.model('PendingOrder', pendingOrderSchema);
