require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('./src/models/TestQuestion');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
  
  const allQs = await TestQuestion.find({});
  console.log("Total questions in DB:", allQs.length);
  
  const grouped = {};
  for (let q of allQs) {
    if (!grouped[q.question]) grouped[q.question] = [];
    grouped[q.question].push(q);
  }
  
  let exactDuplicates = 0;
  let conflictGroups = 0;
  let totalConflicts = 0;
  
  for (let qText in grouped) {
    const arr = grouped[qText];
    if (arr.length > 1) {
      // check if all have the same answer TEXT
      const firstCorrect = arr[0].options[arr[0].answer];
      const isConflict = arr.some(a => a.options[a.answer] !== firstCorrect);
      
      if (isConflict) {
        conflictGroups++;
        totalConflicts += arr.length;
        if (conflictGroups <= 5) {
           console.log(`\nConflict: "${qText}" (${arr.length} versions)`);
           arr.forEach((a, i) => console.log(` V${i+1}: Correct answer text -> ${a.options[a.answer]}`));
        }
      } else {
        exactDuplicates += (arr.length - 1);
      }
    }
  }
  
  console.log(`\nExact duplicates (safe to delete): ${exactDuplicates}`);
  console.log(`Conflict groups: ${conflictGroups} (involving ${totalConflicts} questions)`);
  
  process.exit(0);
}

run().catch(console.error);
