require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI mavjud emas!')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)
  console.log('✅ DB ulandi')

  const users = await User.find({ phone: { $ne: null } })
  const uzbRegex = /^\+998(33|50|55|77|88|90|91|93|94|95|97|98|99)\d{7}$/
  let deletedCount = 0

  for (const u of users) {
    if (!uzbRegex.test(u.phone)) {
      console.log(`❌ Noto'g'ri nomer topildi: ${u.phone} (User: ${u._id}) - O'chirilmoqda...`)
      await User.findByIdAndDelete(u._id)
      deletedCount++
    }
  }

  console.log(`\nJami ${deletedCount} ta xato nomerli foydalanuvchi o'chirildi.`)
  process.exit(0)
}

run()
