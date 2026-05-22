const mongoose = require('mongoose');

// P2P to'lov orqali obuna so'rovi
// Foydalanuvchi ID oladi → admin panelda tasdiqlaydi
const pendingOrderSchema = new mongoose.Schema({
  // Foydalanuvchi
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userEmail:    { type: String, default: '' },
  userPhone:    { type: String, default: '' },
  firstName:    { type: String, default: '' },

  // Buyurtma
  orderId:      { type: String, required: true, unique: true }, // #FK-XXXXX
  planId:       { type: String, required: true },  // 'basic_1m', 'pro_3m' ...
  planName:     { type: String, default: '' },
  priceUZS:     { type: Number, default: 0 },
  paymentType:  { type: String, enum: ['p2p'], default: 'p2p' },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'expired'],
    default: 'pending',
    index: true,
  },

  // Admin
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  confirmedAt: { type: Date,   default: null },
  rejectedReason: { type: String, default: '' },
  note: { type: String, default: '' },

  expiresAt: { type: Date, default: () => new Date(Date.now() + 72 * 3600000) },
}, { timestamps: true });

module.exports = mongoose.model('PendingOrder', pendingOrderSchema);
