const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// ─── GET /api/misc/announcements/active ─────────────────────────────────────
router.get('/announcements/active', async (req, res) => {
  try {
    const ann = await Announcement.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({ announcement: ann });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
