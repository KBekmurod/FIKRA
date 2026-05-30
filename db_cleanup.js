require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('./src/models/TestQuestion');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Fix subjects
  await TestQuestion.updateMany({ subject: 'geografiya' }, { $set: { subject: 'geo' } });
  await TestQuestion.updateMany({ subject: 'informatika' }, { $set: { subject: 'inform' } });
  await TestQuestion.updateMany({ subject: 'adabiyot' }, { $set: { subject: 'adab' } });

  const allQs = await TestQuestion.find({});
  const grouped = {};
  for (let q of allQs) {
    if (!grouped[q.question]) grouped[q.question] = [];
    grouped[q.question].push(q);
  }
  
  let deletedCount = 0;
  for (let qText in grouped) {
    const arr = grouped[qText];
    if (arr.length > 1) {
      arr.sort((a, b) => {
        const aHasPrefix = a.options.some(opt => /^[A-D][\)\.]\s/.test(opt));
        const bHasPrefix = b.options.some(opt => /^[A-D][\)\.]\s/.test(opt));
        if (aHasPrefix && !bHasPrefix) return 1;
        if (!aHasPrefix && bHasPrefix) return -1;
        return 0;
      });
      const deleteIds = arr.slice(1).map(q => q._id);
      const res = await TestQuestion.deleteMany({ _id: { $in: deleteIds } });
      deletedCount += res.deletedCount;
    }
  }

  const remainingQs = await TestQuestion.find({});
  let fixedPrefixes = 0;
  for (let q of remainingQs) {
    let changed = false;
    const newOptions = q.options.map(opt => {
      if (/^[A-D][\)\.]\s(.*)/.test(opt)) {
        changed = true;
        return opt.replace(/^[A-D][\)\.]\s/, '').trim();
      }
      return opt;
    });
    if (changed) {
      // By using Object ID to bypass mongoose validation in case there's another invalid field
      await mongoose.connection.collection('testquestions').updateOne(
        { _id: q._id },
        { $set: { options: newOptions } }
      );
      fixedPrefixes++;
    }
  }
  
  console.log('Deleted ' + deletedCount + ' duplicates');
  console.log('Fixed prefixes in ' + fixedPrefixes);
  console.log('Final count: ' + await TestQuestion.countDocuments());
  process.exit(0);
}
run().catch(console.error);
