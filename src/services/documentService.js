// ─── Document Service — DOCX/PDF/PPTX yaratish ──────────────────────────────
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  LevelFormat, convertInchesToTwip
} = require('docx');
const PDFDocument = require('pdfkit');
const PptxGenJS = require('pptxgenjs');
const { marked } = require('marked');
const { logger } = require('../utils/logger');

function parseInlineTokens(tokens) {
  if (!tokens) return [];
  const segments = [];
  tokens.forEach(t => {
    if (t.type === 'strong') {
      segments.push({ text: t.text, bold: true });
    } else if (t.type === 'em') {
      segments.push({ text: t.text, italics: true });
    } else if (t.type === 'codespan') {
      segments.push({ text: t.text, code: true });
    } else if (t.type === 'text' || t.type === 'escape') {
      segments.push({ text: t.text });
    } else {
      segments.push({ text: t.raw });
    }
  });
  return segments;
}

function parseMarkdown(text) {
  const tokens = marked.lexer(text);
  return tokens.map(t => {
    if (t.type === 'heading') return { type: 'heading', level: t.depth, text: t.text, segments: parseInlineTokens(t.tokens) };
    if (t.type === 'paragraph') return { type: 'para', segments: parseInlineTokens(t.tokens) };
    if (t.type === 'list') return {
      type: 'list',
      ordered: t.ordered,
      items: t.items.map(i => ({ segments: parseInlineTokens(i.tokens) })),
    };
    if (t.type === 'blockquote') return { type: 'quote', segments: parseInlineTokens(t.tokens) };
    if (t.type === 'code') return { type: 'code', text: t.text };
    if (t.type === 'space') return null;
    if (t.type === 'hr') return { type: 'hr' };
    if (t.raw && t.raw.trim()) return { type: 'para', segments: [{ text: t.raw.trim() }] };
    return null;
  }).filter(Boolean);
}

//  DOCX yaratish 
async function createDocx(title, content, options = {}) {
  const blocks = parseMarkdown(content);
  const children = [];

  // Sarlavha
  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 36, color: '7B68EE' })],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  blocks.forEach(b => {
    if (b.type === 'heading') {
      const sizeMap = { 1: 32, 2: 28, 3: 24, 4: 22, 5: 20, 6: 18 };
      children.push(new Paragraph({
        children: b.segments.map(s => new TextRun({ text: s.text, bold: true, italics: s.italics, size: sizeMap[b.level] || 22 })),
        spacing: { before: 200, after: 100 },
      }));
    } else if (b.type === 'para') {
      children.push(new Paragraph({
        children: b.segments.map(s => new TextRun({ text: s.text, bold: s.bold, italics: s.italics, size: 22, font: s.code ? 'Courier New' : undefined })),
        spacing: { after: 120 },
      }));
    } else if (b.type === 'list') {
      b.items.forEach((item, i) => {
        const trs = item.segments.map(s => new TextRun({ text: s.text, bold: s.bold, italics: s.italics, size: 22, font: s.code ? 'Courier New' : undefined }));
        trs.unshift(new TextRun({ text: (b.ordered ? `${i + 1}. ` : '• '), size: 22 }));
        children.push(new Paragraph({
          children: trs,
          indent: { left: convertInchesToTwip(0.3) },
          spacing: { after: 60 },
        }));
      });
    } else if (b.type === 'quote') {
      children.push(new Paragraph({
        children: b.segments.map(s => new TextRun({ text: s.text, italics: true, color: '666666', size: 22, bold: s.bold })),
        indent: { left: convertInchesToTwip(0.4) },
        spacing: { after: 120 },
      }));
    } else if (b.type === 'code') {
      children.push(new Paragraph({
        children: [new TextRun({ text: b.text, font: 'Courier New', size: 20 })],
        spacing: { after: 120 },
      }));
    } else if (b.type === 'hr') {
      children.push(new Paragraph({
        children: [new TextRun({ text: '─────────────────────' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }));
    }
  });

  if (!options.removeWatermark) {
    // Footer
    children.push(new Paragraph({
      children: [new TextRun({
        text: '\n\n📱 FIKRA AI · fikra.ai', size: 18, color: '999999'
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
    }));
  }

  const doc = new Document({
    creator: 'FIKRA AI',
    title,
    sections: [{
      properties: {
        page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
      },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}

//  PDF yaratish 
async function createPdf(title, content, options = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: { Title: title, Creator: 'FIKRA AI', Producer: 'FIKRA' },
    });

    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Sarlavha
    doc.fillColor('#7B68EE')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text(title, { align: 'center' })
       .moveDown(1);

    doc.fillColor('#000000').font('Helvetica').fontSize(11);

    const blocks = parseMarkdown(content);
    blocks.forEach(b => {
      if (b.type === 'heading') {
        const sizes = { 1: 18, 2: 16, 3: 14, 4: 13, 5: 12, 6: 11 };
        doc.font('Helvetica-Bold').fontSize(sizes[b.level] || 12).fillColor('#222').moveDown(0.5);
        b.segments.forEach((s, idx) => {
          doc.font(s.italics ? 'Helvetica-BoldOblique' : 'Helvetica-Bold');
          doc.text(s.text, { continued: idx < b.segments.length - 1 });
        });
        doc.moveDown(0.3);
        doc.font('Helvetica').fontSize(11).fillColor('#000');
      } else if (b.type === 'para') {
        if (!b.segments || b.segments.length === 0) return;
        b.segments.forEach((s, idx) => {
          const isLast = idx === b.segments.length - 1;
          doc.font(s.bold ? (s.italics ? 'Helvetica-BoldOblique' : 'Helvetica-Bold') : (s.italics ? 'Helvetica-Oblique' : (s.code ? 'Courier' : 'Helvetica')));
          doc.text(s.text, { continued: !isLast, align: 'justify' });
        });
        doc.moveDown(0.5);
        doc.font('Helvetica');
      } else if (b.type === 'list') {
        b.items.forEach((item, i) => {
          const prefix = b.ordered ? `${i + 1}. ` : '• ';
          doc.font('Helvetica').text(prefix, { indent: 20, continued: true });
          item.segments.forEach((s, idx) => {
            const isLast = idx === item.segments.length - 1;
            doc.font(s.bold ? (s.italics ? 'Helvetica-BoldOblique' : 'Helvetica-Bold') : (s.italics ? 'Helvetica-Oblique' : (s.code ? 'Courier' : 'Helvetica')));
            doc.text(s.text, { continued: !isLast });
          });
          doc.moveDown(0.2);
        });
        doc.moveDown(0.3);
        doc.font('Helvetica');
      } else if (b.type === 'quote') {
        doc.fillColor('#666');
        b.segments.forEach((s, idx) => {
          doc.font(s.bold ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique');
          doc.text(s.text, { indent: idx === 0 ? 25 : 0, continued: idx < b.segments.length - 1 });
        });
        doc.font('Helvetica').fillColor('#000').moveDown(0.4);
      } else if (b.type === 'code') {
        doc.font('Courier').fontSize(10).fillColor('#333')
           .text(b.text, { indent: 20 })
           .font('Helvetica').fontSize(11).fillColor('#000')
           .moveDown(0.4);
      } else if (b.type === 'hr') {
        doc.moveDown(0.3);
        doc.strokeColor('#ccc').lineWidth(0.5)
           .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
      }
    });

    if (!options.removeWatermark) {
      // Footer
      doc.moveDown(2)
         .fontSize(9)
         .fillColor('#999')
         .text('📱 FIKRA AI · fikra.ai', { align: 'center' });
    }

    doc.end();
  });
}

//  PPTX yaratish 
async function createPptx(title, content, options = {}) {
  const pptx = new PptxGenJS();
  pptx.author = 'FIKRA AI';
  pptx.title = title;
  pptx.layout = 'LAYOUT_WIDE';

  // Birinchi slayd — title
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '0E0E1C' };
  titleSlide.addText(title, {
    x: 0.5, y: 2.5, w: 12, h: 1.5,
    fontSize: 44, bold: true, color: '7B68EE',
    align: 'center', fontFace: 'Arial',
  });
  
  if (!options.removeWatermark) {
    titleSlide.addText('FIKRA AI', {
      x: 0.5, y: 4.5, w: 12, h: 0.5,
      fontSize: 16, color: '888888', align: 'center',
    });
  }

  const blocks = parseMarkdown(content);

  // Blocklarni slaydlarga bo'lish — har heading yangi slayd
  let currentSlide = null;
  let currentBullets = [];
  let slideTitle = '';

  function flushSlide() {
    if (!currentSlide) return;
    if (currentBullets.length > 0) {
      // PptxGenJS accepts an array of objects for multi-format text blocks
      currentBullets.forEach((bulletObj, idx) => {
        currentSlide.addText(bulletObj.textElements, {
          x: 0.5, y: 1.5 + (idx * 0.4), w: 12, h: 0.5,
          fontSize: 18, color: 'EEEAFF', fontFace: 'Arial', valign: 'top', bullet: true
        });
      });
    }
    currentBullets = [];
  }

  blocks.forEach(b => {
    if (b.type === 'heading' && b.level <= 2) {
      flushSlide();
      currentSlide = pptx.addSlide();
      currentSlide.background = { color: '0E0E1C' };
      slideTitle = b.text;
      currentSlide.addText(slideTitle, {
        x: 0.5, y: 0.3, w: 12, h: 1,
        fontSize: 32, bold: true, color: '7B68EE',
        fontFace: 'Arial',
      });
    } else {
      if (!currentSlide) {
        currentSlide = pptx.addSlide();
        currentSlide.background = { color: '0E0E1C' };
        currentSlide.addText('Ma\'lumot', {
          x: 0.5, y: 0.3, w: 12, h: 1,
          fontSize: 32, bold: true, color: '7B68EE',
        });
      }
      
      const toPptxText = (segments) => segments.map(s => ({ text: s.text, options: { bold: s.bold, italic: s.italics, fontFace: s.code ? 'Courier' : 'Arial' } }));

      if (b.type === 'para') currentBullets.push({ textElements: toPptxText(b.segments) });
      else if (b.type === 'list') b.items.forEach(i => currentBullets.push({ textElements: toPptxText(i.segments) }));
      else if (b.type === 'heading') currentBullets.push({ textElements: [{ text: '▸ ' + b.text, options: { bold: true } }] });
      else if (b.type === 'quote') currentBullets.push({ textElements: toPptxText(b.segments).map(s => ({ ...s, options: { ...s.options, italic: true, color: 'AAAAAA' } })) });
    }
  });

  flushSlide();

  if (!options.removeWatermark) {
    // Oxirgi slayd — rahmat
    const endSlide = pptx.addSlide();
    endSlide.background = { color: '0E0E1C' };
    endSlide.addText('Rahmat!', {
      x: 0.5, y: 2.5, w: 12, h: 1.5,
      fontSize: 54, bold: true, color: '00D4AA',
      align: 'center', fontFace: 'Arial',
    });
    endSlide.addText('📱 FIKRA AI', {
      x: 0.5, y: 4.5, w: 12, h: 0.5,
      fontSize: 20, color: '888888', align: 'center',
    });
  }

  const buf = await pptx.write({ outputType: 'nodebuffer' });
  return buf;
}

//  Umumiy interfeys 
async function generateFile(format, title, content, options = {}) {
  const fmt = (format || 'DOCX').toUpperCase();
  try {
    if (fmt === 'DOCX') {
      return {
        buffer: await createDocx(title, content, options),
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ext: 'docx',
      };
    } else if (fmt === 'PDF') {
      return {
        buffer: await createPdf(title, content, options),
        mime: 'application/pdf',
        ext: 'pdf',
      };
    } else if (fmt === 'PPTX') {
      return {
        buffer: await createPptx(title, content, options),
        mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ext: 'pptx',
      };
    }
    throw new Error('Qo\'llab-quvvatlanmaydigan format: ' + fmt);
  } catch (err) {
    logger.error('Document generation error:', err);
    throw err;
  }
}

// ─── Eksport: Buffer qaytaruvchi sodda interfeys ──────────────────────────────
// format: 'pdf' | 'docx'
async function exportDocumentAsBuffer(textFormatContent, format) {
  const fmt = (format || 'pdf').toLowerCase();
  try {
    if (fmt === 'pdf') {
      return await createPdf('Hujjat', textFormatContent);
    } else if (fmt === 'docx') {
      return await createDocx('Hujjat', textFormatContent);
    }
    throw new Error(`Qo'llab-quvvatlanmaydigan format: ${format}`);
  } catch (err) {
    logger.error('exportDocumentAsBuffer error:', err);
    throw err;
  }
}

module.exports = { generateFile, exportDocumentAsBuffer, createDocx, createPdf, createPptx };
