require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const TestQuestion = require('../src/models/TestQuestion');

const mutaxassislikFile = path.join(__dirname, '../src/seed/mutaxassislik_seed.json');
const majburiyFile = path.join(__dirname, '../src/seed/majburiy_seed.json');

async function importAll() {
  try {
    let mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI .env faylda topilmadi!");
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('MongoDB ga ulandi.');

    console.log('Eski testlarni o`chirish...');
    await TestQuestion.deleteMany({});
    console.log('Barcha eski testlar o`chirildi!');

    const mutaxassislikTests = JSON.parse(fs.readFileSync(mutaxassislikFile, 'utf-8'));
    console.log(`Mutaxassislikdan ${mutaxassislikTests.length} ta test o'qildi. Bazaga yozilmoqda...`);
    await TestQuestion.insertMany(mutaxassislikTests);
    console.log('Mutaxassislik testlari muvaffaqiyatli saqlandi!');

    const majburiyTests = JSON.parse(fs.readFileSync(majburiyFile, 'utf-8'));
    console.log(`Majburiy fanlardan ${majburiyTests.length} ta test o'qildi. Bazaga yozilmoqda...`);
    await TestQuestion.insertMany(majburiyTests);
    console.log('Majburiy testlar muvaffaqiyatli saqlandi!');

    console.log('Barcha testlar sifatli va muvaffaqiyatli yuklandi!');
    process.exit(0);
  } catch (error) {
    console.error('Xatolik yuz berdi:', error);
    process.exit(1);
  }
}

importAll();
