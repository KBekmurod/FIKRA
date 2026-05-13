// ─── Level Service ──────────────────────────────────────────────────────────
// Beta / Delta / Alfa daraja tizimi
//
// Versiya-daraja xaritasi:
//   v1, v2, v3  → Beta
//   v4, v5, v6, v7 → Delta
//   v8, v9, v10 → Alfa
//
// Daraja ko'tarilish mantiqidan:
//   Har bir test natijasi ball beradi.
//   Ball yig'ilib, versiya oshadi.
//   Har oy boshida avtomatik nolga tushadi (lazy reset).

const UserLevel = require('../models/UserLevel');
const { logger } = require('../utils/logger');

// ─── Versiyadan daraja nomi ───────────────────────────────────────────────────
function versionToGrade(version) {
  if (version <= 3) return 'beta';
  if (version <= 7) return 'delta';
  return 'alfa';
}

// ─── Tashkent UTC+5 oy kaliti ─────────────────────────────────────────────────
function _monthKey(date) {
  const d = date || new Date();
  const t = new Date(d.getTime() + 5 * 3600 * 1000);
  return t.toISOString().slice(0, 7); // 'YYYY-MM'
}

// ─── Versiya oshirish: neча ball kerak? ──────────────────────────────────────
// Har versiya uchun kerakli "accuracy ball" chegaralari:
// (Bu qiymatlarni loyiha jarayonida o'zgartirish oson)
const VERSION_THRESHOLDS = {
  // Standart + Personal testlar uchun: umumiy aniqlik % bo'yicha
  1: 60,   // v1 → v2 uchun: 60%+ aniqlik, 10+ savol ishlash
  2: 65,
  3: 68,
  4: 70,
  5: 73,
  6: 75,
  7: 78,
  8: 80,
  9: 85,
  // v10 = maksimum — oshirilmaydi
};

// Versiya oshishi uchun minimal savol soni
const MIN_QUESTIONS_PER_VERSION = {
  1: 10, 2: 15, 3: 15,
  4: 20, 5: 20, 6: 20, 7: 25,
  8: 30, 9: 30,
};

// ─── Joriy holat hisoblash ─────────────────────────────────────────────────────
function _computeVersion(levelDoc) {
  const v = levelDoc.currentVersion;
  if (v >= 10) return 10; // Maksimum

  const threshold = VERSION_THRESHOLDS[v];
  const minQ      = MIN_QUESTIONS_PER_VERSION[v] || 10;

  // Daraja turiga qarab qaysi natijalar hisoblanadi
  if (v <= 3) {
    // Beta: standart + personal testlar
    const total   = (levelDoc.standardTests.total || 0) + (levelDoc.personalTests.total || 0);
    const correct = (levelDoc.standardTests.correct || 0) + (levelDoc.personalTests.correct || 0);
    if (total < minQ) return v;
    const accuracy = Math.round((correct / total) * 100);
    return accuracy >= threshold ? v + 1 : v;
  }

  if (v <= 7) {
    // Delta: standart + personal (chuqurroq tahlil)
    const total   = (levelDoc.standardTests.total || 0) + (levelDoc.personalTests.total || 0);
    const correct = (levelDoc.standardTests.correct || 0) + (levelDoc.personalTests.correct || 0);
    if (total < minQ) return v;
    const accuracy = Math.round((correct / total) * 100);
    return accuracy >= threshold ? v + 1 : v;
  }

  // Alfa: mini-test natijalari asosida
  const total   = levelDoc.miniTests.total || 0;
  const correct = levelDoc.miniTests.correct || 0;
  if (total < minQ) return v;
  const accuracy = Math.round((correct / total) * 100);
  return accuracy >= threshold ? v + 1 : v;
}

// ─── Oylik reset tekshirish (lazy) ────────────────────────────────────────────
async function _ensureCurrentMonth(levelDoc) {
  const thisMonth = _monthKey();
  if (levelDoc.currentMonth === thisMonth) return levelDoc;

  // Eski oyni tarixga saqlaymiz
  if (levelDoc.currentMonth) {
    levelDoc.history.push({
      monthKey:      levelDoc.currentMonth,
      maxVersion:    levelDoc.currentVersion,
      grade:         levelDoc.currentGrade,
      standardTests: { ...levelDoc.standardTests },
      personalTests: { ...levelDoc.personalTests },
      miniTests:     { ...levelDoc.miniTests },
      endedAt:       new Date(),
    });
    // Faqat oxirgi 12 oyni saqlash
    if (levelDoc.history.length > 12) {
      levelDoc.history = levelDoc.history.slice(-12);
    }
  }

  // Yangi oy — nolga tushirish
  levelDoc.currentMonth    = thisMonth;
  levelDoc.currentVersion  = 1;
  levelDoc.currentGrade    = 'beta';
  levelDoc.standardTests   = { correct: 0, total: 0 };
  levelDoc.personalTests   = { correct: 0, total: 0 };
  levelDoc.miniTests       = { correct: 0, total: 0 };

  await levelDoc.save();
  return levelDoc;
}

// ─── Public API ───────────────────────────────────────────────────────────────

// Test natijasini qayd qilish va darajani yangilash
// source: 'standard' | 'personal' | 'mini'
async function recordResult(userId, { source, correct, total }) {
  if (!total || total <= 0) return null;

  let levelDoc = await UserLevel.findOne({ userId });
  if (!levelDoc) {
    levelDoc = await UserLevel.create({
      userId,
      currentMonth:   _monthKey(),
      currentVersion: 1,
      currentGrade:   'beta',
      standardTests:  { correct: 0, total: 0 },
      personalTests:  { correct: 0, total: 0 },
      miniTests:      { correct: 0, total: 0 },
    });
  }

  // Oylik reset (lazy)
  levelDoc = await _ensureCurrentMonth(levelDoc);

  const versionBefore = levelDoc.currentVersion;

  // Natijani qo'shamiz
  if (source === 'standard') {
    levelDoc.standardTests.correct += correct;
    levelDoc.standardTests.total   += total;
  } else if (source === 'personal') {
    levelDoc.personalTests.correct += correct;
    levelDoc.personalTests.total   += total;
  } else if (source === 'mini') {
    levelDoc.miniTests.correct += correct;
    levelDoc.miniTests.total   += total;
  }

  // Yangi versiyani hisoblash
  const newVersion = _computeVersion(levelDoc);
  const levelUp    = newVersion > versionBefore;

  levelDoc.currentVersion = newVersion;
  levelDoc.currentGrade   = versionToGrade(newVersion);
  await levelDoc.save();

  logger.info(`Level update: user=${userId} source=${source} ${correct}/${total} → v${newVersion}${levelUp ? ' ⬆️ LEVEL UP' : ''}`);

  return {
    versionBefore,
    versionAfter: newVersion,
    gradeBefore:  versionToGrade(versionBefore),
    gradeAfter:   levelDoc.currentGrade,
    levelUp,
  };
}

// Joriy daraja ma'lumotlarini olish
async function getLevel(userId) {
  let levelDoc = await UserLevel.findOne({ userId }).lean();
  if (!levelDoc) {
    return {
      currentVersion: 1,
      currentGrade:   'beta',
      currentMonth:   _monthKey(),
      standardTests:  { correct: 0, total: 0 },
      personalTests:  { correct: 0, total: 0 },
      miniTests:      { correct: 0, total: 0 },
      history:        [],
      accuracyPercent: 0,
      nextVersionInfo: _getNextVersionInfo(1, { correct: 0, total: 0 }),
      isNew: true,
    };
  }

  // Lazy reset agar boshqa endpoint chaqirmagan bo'lsa
  const thisMonth = _monthKey();
  if (levelDoc.currentMonth && levelDoc.currentMonth !== thisMonth) {
    // findOneAndUpdate orqali qilmaymiz — lean() bor, to'g'ri yo'li:
    const live = await UserLevel.findOne({ userId });
    if (live) {
      await _ensureCurrentMonth(live);
      levelDoc = live.toObject();
    }
  }

  const allTotal   = (levelDoc.standardTests?.total || 0) + (levelDoc.personalTests?.total || 0) + (levelDoc.miniTests?.total || 0);
  const allCorrect = (levelDoc.standardTests?.correct || 0) + (levelDoc.personalTests?.correct || 0) + (levelDoc.miniTests?.correct || 0);
  const accuracyPercent = allTotal > 0 ? Math.round((allCorrect / allTotal) * 100) : 0;

  return {
    ...levelDoc,
    accuracyPercent,
    nextVersionInfo: _getNextVersionInfo(levelDoc.currentVersion, levelDoc),
  };
}

// Keyingi versiyaga o'tish uchun nima kerakligini ko'rsatish (UI uchun)
function _getNextVersionInfo(currentVersion, levelDoc) {
  if (currentVersion >= 10) return { isMax: true };

  const threshold = VERSION_THRESHOLDS[currentVersion] || 90;
  const minQ      = MIN_QUESTIONS_PER_VERSION[currentVersion] || 10;
  const isAlfa    = currentVersion >= 8;

  let total, correct;
  if (currentVersion <= 7) {
    total   = (levelDoc.standardTests?.total || 0) + (levelDoc.personalTests?.total || 0);
    correct = (levelDoc.standardTests?.correct || 0) + (levelDoc.personalTests?.correct || 0);
  } else {
    total   = levelDoc.miniTests?.total || 0;
    correct = levelDoc.miniTests?.correct || 0;
  }

  const currentAccuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const questionsNeeded = Math.max(0, minQ - total);

  return {
    isMax:           false,
    nextVersion:     currentVersion + 1,
    nextGrade:       versionToGrade(currentVersion + 1),
    requiredAccuracy: threshold,
    currentAccuracy,
    questionsAnswered: total,
    questionsNeeded,
    testSource:      isAlfa ? 'mini' : 'standard_personal',
    isReady:         total >= minQ && currentAccuracy >= threshold,
  };
}

// Tarix olish
async function getLevelHistory(userId) {
  const levelDoc = await UserLevel.findOne({ userId }).select('history currentMonth currentVersion currentGrade').lean();
  if (!levelDoc) return { history: [], current: null };
  return {
    history: (levelDoc.history || []).slice().reverse(), // Eng yangi birinchi
    current: {
      month:   levelDoc.currentMonth,
      version: levelDoc.currentVersion,
      grade:   levelDoc.currentGrade,
    },
  };
}

module.exports = {
  versionToGrade,
  recordResult,
  getLevel,
  getLevelHistory,
};
