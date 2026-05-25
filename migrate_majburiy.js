require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('./src/models/TestQuestion');
const MaterialFolder = require('./src/models/MaterialFolder');
const StudyMaterial = require('./src/models/StudyMaterial');
const UserAnswer = require('./src/models/UserAnswer');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // 1. TestQuestions
  const r1 = await TestQuestion.updateMany({ block: 'majburiy', subject: 'math' }, { $set: { subject: 'majburiy_math' } });
  const r2 = await TestQuestion.updateMany({ block: 'majburiy', subject: 'tarix' }, { $set: { subject: 'majburiy_tarix' } });
  const r3 = await TestQuestion.updateMany({ block: 'majburiy', subject: 'onatili' }, { $set: { subject: 'majburiy_onatili' } });
  console.log('TestQuestion update:', r1.modifiedCount, r2.modifiedCount, r3.modifiedCount);

  // 2. MaterialFolder
  const f1 = await MaterialFolder.updateMany({ context: 'majburiy', subjectId: 'math' }, { $set: { subjectId: 'majburiy_math' } });
  const f2 = await MaterialFolder.updateMany({ context: 'majburiy', subjectId: 'tarix' }, { $set: { subjectId: 'majburiy_tarix' } });
  const f3 = await MaterialFolder.updateMany({ context: 'majburiy', subjectId: 'onatili' }, { $set: { subjectId: 'majburiy_onatili' } });
  console.log('MaterialFolder update:', f1.modifiedCount, f2.modifiedCount, f3.modifiedCount);

  // 3. StudyMaterial (based on folder)
  // Get all majburiy folders
  const majFolders = await MaterialFolder.find({ context: 'majburiy' });
  let matUpdates = 0;
  for (const f of majFolders) {
    if (f.subjectId.startsWith('majburiy_')) {
      const res = await StudyMaterial.updateMany({ folderId: f._id }, { $set: { subjectId: f.subjectId } });
      matUpdates += res.modifiedCount;
    }
  }
  console.log('StudyMaterial update:', matUpdates);

  // 4. UserAnswer
  const a1 = await UserAnswer.updateMany({ block: 'majburiy', subject: 'math' }, { $set: { subject: 'majburiy_math' } });
  const a2 = await UserAnswer.updateMany({ block: 'majburiy', subject: 'tarix' }, { $set: { subject: 'majburiy_tarix' } });
  const a3 = await UserAnswer.updateMany({ block: 'majburiy', subject: 'onatili' }, { $set: { subject: 'majburiy_onatili' } });
  console.log('UserAnswer update:', a1.modifiedCount, a2.modifiedCount, a3.modifiedCount);

  await mongoose.disconnect();
  console.log('Done');
}
migrate().catch(console.error);
