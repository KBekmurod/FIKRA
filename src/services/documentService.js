const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  LevelFormat, convertInchesToTwip, Table, TableRow, TableCell, WidthType, BorderStyle,
  Header, Footer, PageNumber, PageBreak, TableOfContents
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
    if (t.type === 'table') return {
      type: 'table',
      header: t.header.map(h => ({ segments: parseInlineTokens(h.tokens) })),
      rows: t.rows.map(r => r.map(c => ({ segments: parseInlineTokens(c.tokens) }))),
    };
    if (t.raw && t.raw.trim()) return { type: 'para', segments: [{ text: t.raw.trim() }] };
    return null;
  }).filter(Boolean);
}

//  DOCX yaratish 
async function createDocx(title, content, options = {}) {
  const blocks = parseMarkdown(content);
  const children = [];

  // Sarlavha (Muqova)
  children.push(new Paragraph({
    children: [new TextRun({ text: "FIKRA AI HISOBOTI", bold: true, size: 28, font: 'Calibri', color: '999999' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 2000, after: 400 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 56, font: 'Calibri', color: '2E3B4E' })],
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `Tayyorlangan sana: ${new Date().toLocaleDateString('uz-UZ')}`, size: 24, font: 'Calibri', color: '666666' })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));
  children.push(new Paragraph({
    children: [new PageBreak()],
  }));

  // Mundarija
  children.push(new Paragraph({
    children: [new TextRun({ text: "Mundarija", bold: true, size: 32, font: 'Calibri', color: '3B4CCA' })],
    spacing: { after: 200 },
  }));
  children.push(new TableOfContents("Mundarija", {
    hyperlink: true,
    headingStyleRange: "1-3",
  }));
  children.push(new Paragraph({
    children: [new PageBreak()],
  }));

  blocks.forEach(b => {
    if (b.type === 'heading') {
      const sizeMap = { 1: 36, 2: 32, 3: 28, 4: 24, 5: 22, 6: 20 };
      children.push(new Paragraph({
        children: b.segments.map(s => new TextRun({ text: s.text, bold: true, italics: s.italics, size: sizeMap[b.level] || 28, font: 'Calibri', color: '3B4CCA' })),
        spacing: { before: 300, after: 150 },
      }));
    } else if (b.type === 'para') {
      children.push(new Paragraph({
        children: b.segments.map(s => new TextRun({ text: s.text, bold: s.bold, italics: s.italics, size: 24, font: s.code ? 'Courier New' : 'Calibri', color: '333333' })),
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED,
      }));
    } else if (b.type === 'list') {
      b.items.forEach((item, i) => {
        const trs = item.segments.map(s => new TextRun({ text: s.text, bold: s.bold, italics: s.italics, size: 24, font: s.code ? 'Courier New' : 'Calibri', color: '333333' }));
        trs.unshift(new TextRun({ text: (b.ordered ? `${i + 1}. ` : '• '), size: 24, font: 'Calibri', color: '3B4CCA', bold: true }));
        children.push(new Paragraph({
          children: trs,
          indent: { left: convertInchesToTwip(0.4) },
          spacing: { after: 100 },
        }));
      });
    } else if (b.type === 'quote') {
      children.push(new Paragraph({
        children: b.segments.map(s => new TextRun({ text: s.text, size: 24, font: 'Calibri', color: '1A365D', bold: s.bold || true })),
        indent: { left: convertInchesToTwip(0.2) },
        spacing: { before: 150, after: 200 },
        shading: { type: 'clear', color: 'auto', fill: 'EBF8FF' },
        border: { left: { color: '3182CE', space: 15, size: 30, style: 'single' } }
      }));
    } else if (b.type === 'code') {
      children.push(new Paragraph({
        children: [new TextRun({ text: b.text, font: 'Courier New', size: 20, color: 'D63384' })],
        shading: { type: 'clear', color: 'auto', fill: 'F8F9FA' },
        spacing: { before: 100, after: 200 },
      }));
    } else if (b.type === 'hr') {
      children.push(new Paragraph({
        children: [new TextRun({ text: '────────────────────────────────────────' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }));
    } else if (b.type === 'table') {
      const rows = [];
      rows.push(new TableRow({
        children: b.header.map(h => new TableCell({
          children: [new Paragraph({ children: h.segments.map(s => new TextRun({ text: s.text, bold: true, color: 'FFFFFF', size: 24, font: 'Calibri' })), alignment: AlignmentType.CENTER })],
          shading: { fill: '3B4CCA' },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
        }))
      }));
      b.rows.forEach((r, idx) => {
        rows.push(new TableRow({
          children: r.map(c => new TableCell({
            children: [new Paragraph({ children: c.segments.map(s => new TextRun({ text: s.text, bold: s.bold, italics: s.italics, size: 24, color: '333333', font: 'Calibri' })) })],
            shading: { fill: idx % 2 === 0 ? 'F9FAFC' : 'FFFFFF' },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          }))
        }));
      });
      children.push(new Table({
        rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
          left: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
          right: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD' },
        }
      }));
      children.push(new Paragraph({ spacing: { after: 200 } }));
    }
  });

  const doc = new Document({
    creator: 'FIKRA AI',
    title,
    sections: [{
      properties: {
        page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } },
        titlePage: true, // First page doesn't show header/footer
      },
      headers: {
        default: new Header({
          children: [new Paragraph({ children: [new TextRun({ text: title, color: 'AAAAAA', size: 20, font: 'Calibri', italics: true })], alignment: AlignmentType.RIGHT })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            children: [
              new TextRun({ text: '📱 FIKRA AI platformasi (fikra.ai) | Sahifa ', size: 20, color: '999999', font: 'Calibri' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 20, color: '999999', font: 'Calibri' }),
              new TextRun({ text: ' / ', size: 20, color: '999999', font: 'Calibri' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, color: '999999', font: 'Calibri' })
            ],
            alignment: AlignmentType.CENTER
          })]
        })
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
      bufferPages: true,
    });

    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.on('pageAdded', () => {
      doc.rect(0, 0, doc.page.width, 10).fill('#3B4CCA');
    });
    
    // Muqova
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#F8F9FA');
    doc.rect(0, 0, doc.page.width, 10).fill('#3B4CCA');
    
    doc.moveDown(10);
    doc.fillColor('#999999').fontSize(16).font('Helvetica').text('FIKRA AI HISOBOTI', { align: 'center' }).moveDown(1);
    doc.fillColor('#2E3B4E').fontSize(36).font('Helvetica-Bold').text(title, { align: 'center' }).moveDown(2);
    doc.fillColor('#666666').fontSize(12).font('Helvetica').text(`Tayyorlangan sana: ${new Date().toLocaleDateString('uz-UZ')}`, { align: 'center' });
    
    doc.addPage();
    // Kontent sahifalari
    doc.fillColor('#333333');
    doc.moveDown(1);

    const blocks = parseMarkdown(content);
    blocks.forEach(b => {
      if (b.type === 'heading') {
        const sizes = { 1: 22, 2: 18, 3: 16, 4: 14, 5: 12, 6: 12 };
        doc.font('Helvetica-Bold').fontSize(sizes[b.level] || 16).fillColor('#3B4CCA').moveDown(0.8);
        b.segments.forEach((s, idx) => {
          doc.font(s.italics ? 'Helvetica-BoldOblique' : 'Helvetica-Bold');
          doc.text(s.text, { continued: idx < b.segments.length - 1 });
        });
        doc.moveDown(0.4);
        doc.font('Helvetica').fontSize(12).fillColor('#333333');
      } else if (b.type === 'para') {
        if (!b.segments || b.segments.length === 0) return;
        doc.font('Helvetica').fontSize(12).fillColor('#333333');
        b.segments.forEach((s, idx) => {
          const isLast = idx === b.segments.length - 1;
          doc.font(s.bold ? (s.italics ? 'Helvetica-BoldOblique' : 'Helvetica-Bold') : (s.italics ? 'Helvetica-Oblique' : (s.code ? 'Courier' : 'Helvetica')));
          doc.fillColor(s.code ? '#D63384' : '#333333');
          doc.text(s.text, { continued: !isLast, align: 'justify', lineGap: 4 });
        });
        doc.moveDown(0.8);
        doc.font('Helvetica');
      } else if (b.type === 'list') {
        doc.font('Helvetica').fontSize(12).fillColor('#333333');
        b.items.forEach((item, i) => {
          const prefix = b.ordered ? `${i + 1}. ` : '• ';
          doc.font('Helvetica-Bold').fillColor('#3B4CCA').text(prefix, { indent: 20, continued: true });
          doc.fillColor('#333333');
          item.segments.forEach((s, idx) => {
            const isLast = idx === item.segments.length - 1;
            doc.font(s.bold ? (s.italics ? 'Helvetica-BoldOblique' : 'Helvetica-Bold') : (s.italics ? 'Helvetica-Oblique' : (s.code ? 'Courier' : 'Helvetica')));
            doc.fillColor(s.code ? '#D63384' : '#333333');
            doc.text(s.text, { continued: !isLast, lineGap: 3 });
          });
          doc.moveDown(0.3);
        });
        doc.moveDown(0.5);
      } else if (b.type === 'quote') {
        doc.moveDown(0.5);
        const currentY = doc.y;
        const estHeight = doc.heightOfString(b.segments.map(s=>s.text).join(''), { width: doc.page.width - 130, lineGap: 4 });
        doc.rect(50, currentY, 4, estHeight + 10).fill('#3182CE');
        
        doc.x = 65;
        doc.y = currentY + 5;
        doc.fillColor('#1A365D').fontSize(12);
        b.segments.forEach((s, idx) => {
          doc.font(s.bold ? 'Helvetica-BoldOblique' : 'Helvetica-Oblique');
          doc.text(s.text, { continued: idx < b.segments.length - 1, lineGap: 4 });
        });
        doc.x = 50;
        doc.moveDown(0.8);
      } else if (b.type === 'code') {
        doc.rect(doc.x + 10, doc.y, doc.page.width - 120, doc.heightOfString(b.text, { font: 'Courier', fontSize: 10 }) + 10)
           .fill('#F8F9FA');
        doc.font('Courier').fontSize(10).fillColor('#333333')
           .text(b.text, { indent: 15 })
           .font('Helvetica').fontSize(12).fillColor('#333333')
           .moveDown(0.8);
      } else if (b.type === 'hr') {
        doc.moveDown(0.5);
        doc.strokeColor('#EEEEEE').lineWidth(1)
           .moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.8);
      } else if (b.type === 'table') {
        doc.moveDown(0.5);
        b.rows.forEach((row, rIdx) => {
          doc.rect(50, doc.y, doc.page.width - 100, 20).fill('#F8F9FA');
          doc.moveDown(0.3);
          doc.fillColor('#3B4CCA').font('Helvetica-Bold').fontSize(12);
          doc.text(`Qator ${rIdx + 1}:`, { underline: true });
          doc.moveDown(0.3);
          row.forEach((cell, cIdx) => {
            const headerText = b.header[cIdx]?.segments.map(s => s.text).join('') || `Ustun ${cIdx + 1}`;
            doc.font('Helvetica-Bold').fillColor('#3B4CCA').text(`${headerText}: `, { continued: true, indent: 15 });
            doc.font('Helvetica').fillColor('#333333');
            cell.segments.forEach((s, idx) => {
              const isLast = idx === cell.segments.length - 1;
              doc.font(s.bold ? 'Helvetica-Bold' : 'Helvetica');
              doc.text(s.text, { continued: !isLast });
            });
            doc.moveDown(0.2);
          });
          doc.moveDown(0.6);
        });
      }
    });

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      if (i === 0) continue; // Skip cover page footer
      doc.fontSize(10).fillColor('#AAAAAA');
      const footerText = options.removeWatermark ? `Sahifa ${i} / ${range.count - 1}` : `📱 Yaratildi: FIKRA AI (fikra.ai)   |   Sahifa ${i} / ${range.count - 1}`;
      doc.text(footerText, 50, doc.page.height - 40, { align: 'center', width: doc.page.width - 100 });
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

  function autoTheme(t) {
    const topic = (t || '').toLowerCase();
    if (topic.match(/biznes|iqtisod|moliya|marketing|savdo|pul|tijorat/)) return { bg: 'F9FAFC', acc: '3B4CCA', text: '2E3B4E', dark: '1A2639' };
    if (topic.match(/ta'lim|maktab|biologiya|kimyo|fizika|ekolog|ilm|tibbiyot|sog'liq/)) return { bg: 'F5FAF5', acc: '2E8B57', text: '1B4D3E', dark: '143628' };
    if (topic.match(/texnologiya|dastur|it|intellekt|robot|raqamli|ai/)) return { bg: 'F0F8FF', acc: '0078D7', text: '002050', dark: '001133' };
    if (topic.match(/ijod|san'at|musiqa|dizayn|adabiyot/)) return { bg: 'FDF8FF', acc: '8A2BE2', text: '4B0082', dark: '290046' };
    if (topic.match(/sport|energiya|kuch|motivatsiya|psixologiya/)) return { bg: 'FFF5F5', acc: 'DC143C', text: '800000', dark: '4A0000' };
    return { bg: 'F9FAFC', acc: '3B4CCA', text: '2E3B4E', dark: '1A2639' };
  }
  const theme = autoTheme(title);

  pptx.defineSlideMaster({
    title: 'MASTER_SLIDE',
    background: { color: theme.bg },
    slideNumber: { x: 0.5, y: 7.0, color: 'AAAAAA', fontSize: 10 },
    objects: [
      { rect: { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: theme.acc } } },
      (!options.removeWatermark ? { text: { text: 'FIKRA AI', options: { x: 11.5, y: 7.0, w: 1.5, h: 0.3, fontSize: 10, color: 'AAAAAA', align: 'right' } } } : null)
    ].filter(Boolean)
  });

  // Birinchi slayd — title
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: 'FFFFFF' };
  
  // Decorative top bar
  titleSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.2, fill: { color: theme.acc } });

  titleSlide.addText(title, {
    x: 1, y: 2.0, w: 11, h: 1.5,
    fontSize: 48, bold: true, color: theme.dark,
    align: 'center', fontFace: 'Arial',
  });
  
  if (!options.removeWatermark) {
    titleSlide.addText('FIKRA AI Platformasi orqali tayyorlandi', {
      x: 1, y: 3.5, w: 11, h: 0.5,
      fontSize: 18, color: '666666', align: 'center',
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
      currentBullets.forEach((bulletObj, idx) => {
        currentSlide.addText(bulletObj.textElements, {
          x: 0.6, y: 1.4 + (idx * 0.45), w: 12, h: 0.5,
          fontSize: 20, color: '333333', fontFace: 'Arial', valign: 'top', bullet: { type: 'number', color: theme.acc }
        });
      });
    }
    currentBullets = [];
  }

  blocks.forEach(b => {
    if (b.type === 'heading' && b.level <= 2) {
      flushSlide();
      currentSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
      
      slideTitle = b.text;
      currentSlide.addText(slideTitle, {
        x: 0.6, y: 0.4, w: 12, h: 0.8,
        fontSize: 32, bold: true, color: theme.text,
        fontFace: 'Arial',
      });
      // Underline
      currentSlide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.1, w: 2.0, h: 0.03, fill: { color: theme.acc } });

    } else {
      if (!currentSlide) {
        currentSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        currentSlide.addText('Umumiy Ma\'lumot', {
          x: 0.6, y: 0.4, w: 12, h: 0.8,
          fontSize: 32, bold: true, color: theme.text, fontFace: 'Arial'
        });
        currentSlide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.1, w: 2.0, h: 0.03, fill: { color: theme.acc } });
      }
      
      const toPptxText = (segments) => segments.map(s => ({ text: s.text, options: { bold: s.bold, italic: s.italics, fontFace: s.code ? 'Courier' : 'Arial', color: s.code ? 'D63384' : '333333' } }));

      if (b.type === 'para') currentBullets.push({ textElements: toPptxText(b.segments) });
      else if (b.type === 'list') b.items.forEach(i => currentBullets.push({ textElements: toPptxText(i.segments) }));
      else if (b.type === 'heading') currentBullets.push({ textElements: [{ text: '▸ ' + b.text, options: { bold: true, color: theme.acc } }] });
      else if (b.type === 'quote') currentBullets.push({ textElements: [{ text: '💡 ', options: { bold: true } }, ...toPptxText(b.segments).map(s => ({ ...s, options: { ...s.options, italic: true, color: theme.text } }))] });
      else if (b.type === 'table') {
        flushSlide();
        const rows = [];
        rows.push(b.header.map(h => ({ text: h.segments.map(s => s.text).join(''), options: { bold: true, color: 'FFFFFF', fill: theme.acc, fontFace: 'Arial' } })));
        b.rows.forEach((r, idx) => {
          rows.push(r.map(c => ({ text: c.segments.map(s => s.text).join(''), options: { color: '333333', fill: idx % 2 === 0 ? theme.bg : 'FFFFFF', fontFace: 'Arial' } })));
        });
        
        currentSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        currentSlide.addText('Tahliliy Jadval', { x: 0.6, y: 0.4, w: 12, h: 0.8, fontSize: 32, bold: true, color: theme.text, fontFace: 'Arial' });
        currentSlide.addShape(pptx.ShapeType.rect, { x: 0.6, y: 1.1, w: 2.0, h: 0.03, fill: { color: theme.acc } });
        
        currentSlide.addTable(rows, { x: 0.6, y: 1.5, w: 12, colW: 12 / Math.max(1, b.header.length), fontSize: 16, border: { type: 'solid', color: 'DDDDDD', pt: 1 } });
      }
    }
  });

  flushSlide();

  if (!options.removeWatermark) {
    // Oxirgi slayd — rahmat
    const endSlide = pptx.addSlide();
    endSlide.background = { color: 'FFFFFF' };
    endSlide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: 0.2, fill: { color: theme.acc } });
    endSlide.addText('E\'TIBORINGIZ UCHUN RAHMAT', {
      x: 0.5, y: 2.5, w: 12, h: 1.5,
      fontSize: 48, bold: true, color: theme.dark,
      align: 'center', fontFace: 'Arial',
    });
    endSlide.addText('Hujjat FIKRA AI orqali yozildi (fikra.ai)', {
      x: 0.5, y: 4.5, w: 12, h: 0.5,
      fontSize: 20, color: '666666', align: 'center',
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
