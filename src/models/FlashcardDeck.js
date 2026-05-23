const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  topic: { type: String, default: '' },
  // Swipe holati saqlanishi mumkin (lekin odatda sessiyada saqlanadi)
}, { _id: false });

const flashcardDeckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialFolder',
    required: true,
    index: true,
  },
  cards: {
    type: [flashcardSchema],
    default: [],
  },
  status: {
    type: String,
    enum: ['generating', 'ready', 'failed'],
    default: 'generating',
  },
  lastStudiedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('FlashcardDeck', flashcardDeckSchema);
