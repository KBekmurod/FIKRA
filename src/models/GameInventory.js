// ─── O'yin ichi obyektlar (Inventory) ─────────────────────────────────────────
// Avto, kiyim, futbolchi — hammasi shu yagona collection da

const mongoose = require('mongoose');

const gameInventorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  telegramId: { type: Number, index: true, required: true },

  gameType: {
    type: String,
    enum: ['auto', 'fashion', 'football'],
    required: true,
    index: true,
  },

  // Umumiy
  itemType: String,     // auto: 'car', fashion: 'outfit', football: 'player'
  name: { type: String, default: '' },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },

  // Avto uchun
  carModel: String,       // 'lada', 'cobalt', 'camry', 'bmw', ...
  carColor: String,       // 'white', 'red', 'black', ...
  tuning: {
    engine:  { type: Number, default: 0 },  // 0-5 darajali
    suspension: { type: Number, default: 0 },
    tires:   { type: Number, default: 0 },
    paint:   { type: Number, default: 0 },
    spoiler: { type: Number, default: 0 },
    rims:    { type: Number, default: 0 },
  },

  // Kiyim uchun (fashion)
  outfitStyle: String,    // 'classic', 'sport', 'bohem', ...
  outfitParts: {
    top:    { color: String, pattern: String },
    bottom: { color: String, pattern: String },
    shoes:  { color: String, style: String },
    accessory: String,
  },

  // Futbolchi uchun
  playerPosition: String, // 'GK', 'DEF', 'MID', 'FWD'
  playerStats: {
    speed: { type: Number, default: 50 },
    skill: { type: Number, default: 50 },
    shot:  { type: Number, default: 50 },
    defense: { type: Number, default: 50 },
  },
  clubId: String,         // agar klubga tegishli bo'lsa

  // Bozor
  isForSale: { type: Boolean, default: false, index: true },
  priceTokens: { type: Number, default: 0 },
  value: { type: Number, default: 0 }, // hozirgi qiymat (auto-calculated)

  // Meta
  acquiredFrom: { type: String, default: 'starter' }, // starter, purchase, trade, reward
  acquiredAt: { type: Date, default: Date.now },
}, { timestamps: true });

gameInventorySchema.index({ userId: 1, gameType: 1 });
gameInventorySchema.index({ isForSale: 1, gameType: 1, priceTokens: 1 });

module.exports = mongoose.model('GameInventory', gameInventorySchema);
