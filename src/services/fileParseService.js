// ─── File Parse Service ──────────────────────────────────────────────────────
// PDF / DOCX / PPTX fayllaridan matn ajratib olish.
//
// PDF  → pdf-parse
// DOCX → mammoth
// PPTX → jszip + xml2js (slide XML'lardan a:t teglarini olish)
//
// Har biri { text, pageCount } qaytaradi.

const pdfParse  = require('pdf-parse');
const mammoth   = require('mammoth');
const JSZip     = require('jszip');
const xml2js    = require('xml2js');
const { logger } = require('../utils/logger');

const MIME = {
  PDF:  'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

// ─── PDF ─────────────────────────────────────────────────────────────────────
async function _parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text:      (data.text || '').trim(),
      pageCount: data.numpages || 0,
    };
  } catch (err) {
    logger.error('PDF parse error:', err.message);
    throw new Error('PDF faylni o\'qib bo\'lmadi. Fayl buzilgan yoki himoyalangan bo\'lishi mumkin.');
  }
}

// ─── DOCX ────────────────────────────────────────────────────────────────────
async function _parseDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();
    // DOCX'da sahifa soni aniq emas (struktura sahifasiz) — taxminan hisoblaymiz
    // Har taxminan 3000 belgi = 1 sahifa
    const pageCount = Math.max(1, Math.ceil(text.length / 3000));
    return { text, pageCount };
  } catch (err) {
    logger.error('DOCX parse error:', err.message);
    throw new Error('DOCX faylni o\'qib bo\'lmadi. Fayl buzilgan bo\'lishi mumkin.');
  }
}

// ─── PPTX ────────────────────────────────────────────────────────────────────
async function _parsePptx(buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const na = parseInt(a.match(/slide(\d+)\.xml/)[1], 10);
        const nb = parseInt(b.match(/slide(\d+)\.xml/)[1], 10);
        return na - nb;
      });

    if (slideFiles.length === 0) {
      throw new Error('PPTX faylida slide topilmadi');
    }

    const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: true });
    const slidesText = [];

    for (const fileName of slideFiles) {
      const xml = await zip.files[fileName].async('string');
      try {
        const parsed = await parser.parseStringPromise(xml);
        const texts = [];
        _collectText(parsed, texts);
        if (texts.length > 0) {
          slidesText.push(texts.join(' ').trim());
        }
      } catch (e) {
        // Bitta slide xato bersa, qolganini olamiz
        logger.warn(`Slide parse warning (${fileName}):`, e.message);
      }
    }

    const text = slidesText.join('\n\n').trim();
    return {
      text,
      pageCount: slideFiles.length,
    };
  } catch (err) {
    logger.error('PPTX parse error:', err.message);
    throw new Error('PPTX faylni o\'qib bo\'lmadi. Fayl buzilgan bo\'lishi mumkin.');
  }
}

// PPTX XML'dan barcha matnli teglarni recursive yig'ish
// a:t = text run; lekin namespaces ignoreAttrs bilan oddiy "t" bo'lib qoladi
function _collectText(node, out) {
  if (node === null || node === undefined) return;
  if (typeof node === 'string') {
    const trimmed = node.trim();
    if (trimmed) out.push(trimmed);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach(x => _collectText(x, out));
    return;
  }
  if (typeof node === 'object') {
    // a:t teg (text) — bizning xml2js sozlamalarda u "a:t" kalit bilan keladi
    if (node['a:t']) {
      _collectText(node['a:t'], out);
    }
    // Boshqa barcha child node'lar
    for (const key of Object.keys(node)) {
      if (key === 'a:t') continue;
      _collectText(node[key], out);
    }
  }
}

// ─── Asosiy dispatcher ───────────────────────────────────────────────────────
async function parseFile(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Fayl buffer kerak');
  }
  if (mimeType === MIME.PDF)  return _parsePdf(buffer);
  if (mimeType === MIME.DOCX) return _parseDocx(buffer);
  if (mimeType === MIME.PPTX) return _parsePptx(buffer);
  throw new Error(`Qo'llab-quvvatlanmaydigan fayl turi: ${mimeType}`);
}

module.exports = {
  parseFile,
  MIME,
};
