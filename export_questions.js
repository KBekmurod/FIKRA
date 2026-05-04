const mongoose = require('mongoose');
const fs = require('fs');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/fikra');
  const db = mongoose.connection.db;
  const questions = await db.collection('testquestions').find({}).toArray();
  fs.writeFileSync('questions_dump.json', JSON.stringify(questions, null, 2));
  console.log(`Eksport qilingan savollar: ${questions.length}`);
  process.exit(0);
}
run();
