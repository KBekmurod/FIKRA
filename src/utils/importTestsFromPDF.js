const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mongoose = require('mongoose');
require('dotenv').config();

const TestQuestion = require('../models/TestQuestion');

const PDF_DIR = path.join(__dirname, '../../testlar agent uchun');

// Subject mapping from filename
const SUBJECT_MAP = {
  matematika: 'math',
  'ona tili': 'uztil',
  tarix: 'tarix',
  biologiya: 'bio',
  fizika: 'fizika',
  kimyo: 'kimyo',
  'ingliz tili': 'ingliz',
  'rus tili': 'rus',
  informatika: 'inform',
  iqtisodiyot: 'iqtisod',
  geografiya: 'geografiya',
  adabiyot: 'adab',
  huquqshunoslik: 'huquq',
};

// Block determination
const SUBJECT_BLOCK = {
  'uztil': 'majburiy',
  'math': 'majburiy',
  'tarix': 'majburiy',
  'bio': 'mutaxassislik',
  'fizika': 'mutaxassislik',
  'kimyo': 'mutaxassislik',
  'ingliz': 'mutaxassislik',
  'rus': 'mutaxassislik',
  'inform': 'mutaxassislik',
  'iqtisod': 'mutaxassislik',
  'geografiya': 'mutaxassislik',
  'adab': 'mutaxassislik',
  'huquq': 'mutaxassislik',
};

async function connectDB() {
  // Development rejimida local MongoDB, production'da env orqali
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fikra';
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB ga ulandi: ${uri.substring(0, 50)}...`);
  } catch (err) {
    console.error('❌ DB ulanishida xato:', err.message);
    console.error('Ishlatilgan URI:', uri);
    process.exit(1);
  }
}

function extractTextFromPDF(filePath) {
  try {
    const text = execSync(`pdftotext "${filePath}" -`, { encoding: 'utf-8' });
    return text;
  } catch (err) {
    console.error(`❌ ${filePath} o'qishda xato:`, err.message);
    return '';
  }
}

function identifySubject(fileName) {
  const lower = fileName.toLowerCase();
  for (const [key, value] of Object.entries(SUBJECT_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'uztil'; // default
}

function parseQuestionsFromText(text) {
  const questions = [];
  
  // Regex: raqam + nuqta + savol matni + A) + variantlar + B) + D) hangacha
  // Masalan: "1. Savol matni A) javob1 B) javob2 C) javob3 D) javob4"
  
  // Ilk, barcha savollarni alohida qilib olamiz
  const questionBlocks = text.split(/\n(?=\d+\.)/);
  
  for (const block of questionBlocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    if (lines.length < 5) continue; // Minimal 5 dona qator bo'lishi kerak
    
    // Birinchi qatorda savol raqami va matn
    const firstLine = lines[0];
    const match = firstLine.match(/^(\d+)\.\s+(.*)/);
    if (!match) continue;
    
    const questionNumber = parseInt(match[1]);
    let questionText = match[2];
    
    // Agar savol ko'p qatorga o'tib ketsa, keyingi qatorlardan to A) gacha yig'aymiz
    let answerStartIndex = 1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].match(/^\s*A\)/)) {
        answerStartIndex = i;
        break;
      }
      questionText += ' ' + lines[i];
    }
    
    questionText = questionText.replace(/^1\.\s+/, '').trim();
    
    // Variantlarni olish (A, B, C, D)
    const options = [];
    const answerTexts = lines.slice(answerStartIndex).join(' ');
    
    // A, B, C, D variantlarni ajratish
    const aMatch = answerTexts.match(/A\)\s*([^B]*?)(?=B\)|$)/);
    const bMatch = answerTexts.match(/B\)\s*([^C]*?)(?=C\)|$)/);
    const cMatch = answerTexts.match(/C\)\s*([^D]*?)(?=D\)|$)/);
    const dMatch = answerTexts.match(/D\)\s*(.*?)(?=\d+\.|$)/);
    
    if (aMatch) options.push(aMatch[1].trim());
    if (bMatch) options.push(bMatch[1].trim());
    if (cMatch) options.push(cMatch[1].trim());
    if (dMatch) options.push(dMatch[1].trim());
    
    // Agar to'liq 4 ta variant bo'lsa, savolni qo'shamiz
    if (options.length === 4 && questionText.length > 10) {
      // Javob kalitini tuzatish (bu joyda default 0, keyin kalitka qarab to'g'rilaymiz)
      questions.push({
        question: questionText,
        options: options,
        answer: 0, // placeholder
        difficulty: 'medium',
        explanation: '',
      });
    }
  }
  
  return questions;
}

async function importAllPDFs() {
  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));
  
  if (files.length === 0) {
    console.log('❌ Hech qanday PDF topilmadi');
    return;
  }
  
  console.log(`📂 Topilgan ${files.length} ta PDF fayl:\n`);
  
  let totalImported = 0;
  
  for (const file of files) {
    const filePath = path.join(PDF_DIR, file);
    const subject = identifySubject(file);
    const block = SUBJECT_BLOCK[subject] || 'mutaxassislik';
    
    console.log(`📄 ${file}`);
    
    // PDF dan matn o'qish
    const text = extractTextFromPDF(filePath);
    if (!text) {
      console.log(`  ❌ Matn o'qilmadi\n`);
      continue;
    }
    
    // Savollarni parse qilish
    const questions = parseQuestionsFromText(text);
    console.log(`  ✓ ${questions.length} ta savol ajratib olindi`);
    
    // DB ga yozish
    const docs = questions.map(q => ({
      subject,
      block,
      question: q.question,
      options: q.options,
      answer: q.answer,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
    }));
    
    try {
      const result = await TestQuestion.insertMany(docs);
      console.log(`  ✅ ${result.length} ta savol DB ga yozildi\n`);
      totalImported += result.length;
    } catch (err) {
      console.error(`  ❌ DB ga yozishda xato:`, err.message, '\n');
    }
  }
  
  console.log(`\n🎉 Jami ${totalImported} ta savol import qilindi!`);
}

// Main
(async () => {
  await connectDB();
  await importAllPDFs();
  process.exit(0);
})().catch(err => {
  console.error('❌ Xatolik:', err.message);
  process.exit(1);
});
