const mongoose = require('mongoose');

const aiCacheSchema = new mongoose.Schema({
  promptHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  model: {
    type: String,
    required: true,
  },
  response: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // 30 days TTL (Time To Live)
  }
});

module.exports = mongoose.model('AICache', aiCacheSchema);
