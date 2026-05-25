require('dotenv').config();
const mongoose = require('mongoose');
const TestQuestion = require('../src/models/TestQuestion');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const res = await TestQuestion.updateMany({ subject: 'uztil' }, { $set: { subject: 'onatili' } });
  console.log('Updated DB:', res);
  process.exit(0);
});
