require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('./src/models/TestQuestion');

const TOPICS = {
  majburiy_onatili: ['Fonetika', 'Morfologiya', 'Sintaksis', 'Leksikologiya'],
  majburiy_math: ['Arifmetika', 'Algebra', 'Geometriya', 'Tenglamalar', 'Funksiyalar'],
  majburiy_tarix: ['Qadimgi davr', 'O\'rta asrlar', 'Yangi tarix', 'Eng yangi tarix'],
  bio: ['Botanika', 'Zoologiya', 'Odam anatomiyasi', 'Genetika', 'Sitosiologiya'],
  kimyo: ['Anorganik kimyo', 'Organik kimyo', 'Fizik kimyo', 'Eritmalar'],
  fizika: ['Mexanika', 'Elektrodinamika', 'Optika', 'Kvant fizikasi', 'Termodinamika'],
  ingliz: ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Tenses'],
  inform: ['Dasturlash', 'Tarmoqlar', 'Axborot xavfsizligi', 'Arxitektura'],
  iqtisod: ['Mikroiqtisodiyot', 'Makroiqtisodiyot', 'Moliya', 'Bozor iqtisodiyoti'],
  rus: ['Fonetika', 'Morfologiya', 'Sintaksis', 'Orfografiya'],
  geo: ['Tabiiy geografiya', 'Iqtisodiy geografiya', 'Jahon geografiyasi', 'O\'zbekiston geografiyasi'],
  adab: ['Mumtoz adabiyot', 'Jadid adabiyoti', 'Zamonaviy adabiyot', 'Jahon adabiyoti']
};

async function fixTopics() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const questions = await TestQuestion.find({});
  let fixedCount = 0;

  for (let q of questions) {
    if (!q.topic || q.topic === 'DTM Namunaviy' || q.topic === 'Noma\'lum') {
      const availableTopics = TOPICS[q.subject];
      if (availableTopics && availableTopics.length > 0) {
        // Assign a random topic
        const randTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
        q.topic = randTopic;
        await q.save();
        fixedCount++;
      }
    }
  }

  console.log(`Assigned diverse topics to ${fixedCount} existing questions.`);
  process.exit(0);
}

fixTopics().catch(console.error);
