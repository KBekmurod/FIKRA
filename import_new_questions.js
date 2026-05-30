require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const TestQuestion = require('./src/models/TestQuestion');

async function importQuestions() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB for importing new questions.');

  const dir = path.join(__dirname, 'src', 'data', 'new_questions');
  if (!fs.existsSync(dir)) {
    console.log('Directory not found:', dir);
    process.exit(0);
  }

  const files = fs.readdirSync(dir);
  let totalImported = 0;

  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(dir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const questions = JSON.parse(content);

        // Filter valid ones
        const validQuestions = questions.filter(q => 
          q.subject && q.question && Array.isArray(q.options) && 
          q.options.length === 4 && typeof q.answer === 'number'
        );

        if (validQuestions.length > 0) {
          await TestQuestion.insertMany(validQuestions, { ordered: false });
          console.log(`Imported ${validQuestions.length} questions from ${file}`);
          totalImported += validQuestions.length;
        }
      } catch (err) {
        console.error(`Error importing ${file}:`, err.message);
      }
    }
  }

  console.log(`\nSuccessfully imported ${totalImported} new questions!`);
  const finalCount = await TestQuestion.countDocuments();
  console.log(`Total questions in DB: ${finalCount}`);
  
  process.exit(0);
}

importQuestions().catch(console.error);
