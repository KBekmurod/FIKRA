const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const TestQuestion = require('../src/models/TestQuestion');

async function checkFizika() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const qCount = await TestQuestion.countDocuments({ subject: 'fizika', block: 'mutaxassislik' });
  console.log(`\nJami kiritilgan Fizika savollari: ${qCount} ta`);

  const questions = await TestQuestion.find({ subject: 'fizika', block: 'mutaxassislik' }).sort({ topic: 1 });
  
  let withImages = 0;
  for (const q of questions) {
    if (q.images && q.images.length > 0) withImages++;
  }
  
  console.log(`Rasmi bor savollar soni: ${withImages} ta\n`);

  console.log('--- NAMUNAVIY SAVOLLAR ---');
  // Print 3 random questions
  for (let i = 0; i < 3; i++) {
    const q = questions[i];
    console.log(`\nSavo (ID: ${q._id}, Topic: ${q.topic}):\n${q.question}`);
    console.log(`Variantlar:`);
    q.options.forEach((opt, idx) => {
      console.log(`  ${idx === q.answer ? '[TO\'G\'RI] ' : ''}${String.fromCharCode(65+idx)}) ${opt}`);
    });
    if (q.images && q.images.length > 0) {
      console.log(`Rasm ulangan: HA (${q.images.join(', ')})`);
    } else {
      console.log(`Rasm ulangan: YO'Q`);
    }
  }

  process.exit(0);
}

checkFizika().catch(console.error);
