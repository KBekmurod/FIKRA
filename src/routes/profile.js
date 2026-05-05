// FIKRA — Profil va Sertifikat API routes
// /api/profile/*

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

// ─── GET /api/profile/me ───────────────────────────────────────────────────
// Foydalanuvchi profilini olish
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      'username firstName lastName photoUrl plan planExpiresAt xp rank certificates'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// ─── GET /api/profile/certificates ─────────────────────────────────────────
// Foydalanuvchining barcha sertifikatlarini olish
router.get('/certificates', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('certificates');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ certificates: user.certificates || [] });
  } catch (err) { next(err); }
});

// ─── GET /api/profile/certificates/verified ────────────────────────────────
// Faqat tasdiqlangan sertifikatlar (imtihondan ozod bo'lish uchun)
router.get('/certificates/verified', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('certificates');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const verified = (user.certificates || []).filter(c => 
      c.verificationStatus === 'verified' && 
      (!c.expiresDate || c.expiresDate > new Date())
    );
    
    const certsBySubject = {};
    for (const cert of verified) {
      certsBySubject[cert.subjectId] = {
        type: cert.type,
        level: cert.level,
        certificateNumber: cert.certificateNumber,
        issuedDate: cert.issuedDate,
      };
    }
    
    res.json(certsBySubject);
  } catch (err) { next(err); }
});

// ─── POST /api/profile/certificates/add ────────────────────────────────────
// Sertifikat qo'shish (pending holat bilan, admin tasdiqlaydi)
router.post('/certificates/add', authMiddleware, async (req, res, next) => {
  try {
    const { type, subjectId, level, certificateNumber } = req.body;
    
    if (!type || !subjectId) {
      return res.status(400).json({ error: 'type va subjectId kerak' });
    }
    
    if (!['ielts', 'cefr', 'national'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type: ielts, cefr, atau national' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Bir xil sertifikat mavjud bo'lsa, update qil
    const existingIdx = user.certificates.findIndex(c => 
      c.type === type && c.subjectId === subjectId
    );
    
    const certData = {
      type,
      subjectId,
      level: level || '',
      certificateNumber: certificateNumber || '',
      issuedDate: new Date(),
      expiresDate: null,
      verificationStatus: 'pending',
    };
    
    if (existingIdx >= 0) {
      user.certificates[existingIdx] = { ...user.certificates[existingIdx].toObject(), ...certData };
    } else {
      user.certificates.push(certData);
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'Sertifikat saqlandi. Adminning tasdiqini kutishda...',
      certificate: certData 
    });
  } catch (err) { next(err); }
});

// ─── DELETE /api/profile/certificates/:certId ──────────────────────────────
// Sertifikatni o'chirish (faqat pending yoki o'zining)
router.delete('/certificates/:certId', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const certIndex = user.certificates.findIndex(c => c._id.toString() === req.params.certId);
    if (certIndex < 0) {
      return res.status(404).json({ error: 'Sertifikat topilmadi' });
    }
    
    // Faqat pending yoki verified bo'lgan o'zining sertifikatini o'chirish mumkin
    user.certificates.splice(certIndex, 1);
    await user.save();
    
    res.json({ success: true, message: 'Sertifikat o\'chirildi' });
  } catch (err) { next(err); }
});

module.exports = router;
