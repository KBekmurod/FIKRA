const mongoose = require('mongoose');
const TestQuestion = require('../models/TestQuestion');
const { getTestHint, explainTestQuestion } = require('../services/aiService');
require('dotenv').config();

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fikra';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ MongoDB ga ulandi');
}

async function run() {
  await connectDB();
  
  // Javobi 0 bo'lgan (yoki tekshirilmagan) savollarni topish
  const questions = await TestQuestion.find({ answer: 0 }).limit(10); // boshlang'ich 10 ta
  console.log(`Jami tekshiriladigan savollar: ${questions.length}`);
  
  for (const q of questions) {
    try {
      console.log(`\nSavol: ${q.question.substring(0, 50)}...`);
      const explanation = await explainTestQuestion(q.question, q.options, q.subject);
      console.log(`Tushuntirish: ${explanation.substring(0, 100)}...`);
      
      // Javobni aniqlash kodi kerak
    } catch (e) {
      console.error('Xatolik:', e.message);
    }
  }
  
  process.exit();
}

run();
