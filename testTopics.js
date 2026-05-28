const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const TestQuestion = require('./src/models/TestQuestion');
  const topics = await TestQuestion.aggregate([{ $group: { _id: '$topic', count: { $sum: 1 } } }]);
  console.log(topics);
  process.exit(0);
});
