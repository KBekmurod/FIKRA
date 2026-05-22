require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB connected');

  const db = mongoose.connection.db;

  // 1. Get all folders
  const folders = await db.collection('materialfolders').find({}).toArray();
  console.log(`Found ${folders.length} folders`);

  let updatedMaterials = 0;

  for (const folder of folders) {
    if (folder.materialId) {
      // Find the material and ensure its folderId is set
      const result = await db.collection('studymaterials').updateOne(
        { _id: folder.materialId },
        { $set: { folderId: folder._id } }
      );
      if (result.modifiedCount > 0) {
        updatedMaterials++;
      }
      
      // We can also remove materialId from folder to clean up
      await db.collection('materialfolders').updateOne(
        { _id: folder._id },
        { $unset: { materialId: "" } }
      );
    }
  }

  console.log(`Migration completed. Updated ${updatedMaterials} materials' folderId to match their folder.`);
  process.exit(0);
}

migrate().catch(console.error);
