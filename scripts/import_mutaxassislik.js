const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const TestQuestion = require('../src/models/TestQuestion');

const DIR_PATH = path.join(__dirname, '../yangi test manbasi/mutaxasistlik testlari/paket 1');
const IMAGES_DIR = path.join(__dirname, '../client/public/test-images');

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Map filenames to DB subject keys and the image folder names
const SUBJECT_MAP = {
  "BIOLOGIYA": { key: "bio", imgFolder: "bialogiya" },
  "FIZIKA": { key: "fizika", imgFolder: "fizika" },
  "GEOGRAFIYA": { key: "geo", imgFolder: "GEOGRAFIYA" },
  "HUQUQSHUNOSLIK": { key: "huquq", imgFolder: "Huquqshunoslik" },
  "INGLIZ_TILI": { key: "ingliz", imgFolder: "ingliz tili" },
  "KIMYO": { key: "kimyo", imgFolder: "kimyo" },
  "MATEMATIKA": { key: "math", imgFolder: "matematika" }, // Matematika may not have images folder, that's fine
  "NEMIS_TILI": { key: "nemis", imgFolder: "nemis tili" },
  "ONA_TILI_ADABIYOT": { key: "adab", imgFolder: "ona tili va adabiyot" },
  "TARIX": { key: "tarix", imgFolder: "tarix" }
};

const ANSWER_MAP = { "A": 0, "B": 1, "C": 2, "D": 3 };

function parseAnswers() {
  const ansPath = path.join(DIR_PATH, "TO'G'RI_JAVOBLAR.md");
  const content = fs.readFileSync(ansPath, 'utf-8');
  const answerKeys = {};

  const tables = content.split(/^## /m);
  for (let i = 1; i < tables.length; i++) {
    const tableText = tables[i];
    let subjKey = null;
    
    // Find matching subject key
    const headerLine = tableText.split('\n')[0].toUpperCase().trim();
    for (const [filename, info] of Object.entries(SUBJECT_MAP)) {
      const displayTitle = filename.replace(/_ADABIYOT/, '').replace(/_TILI/, ' TILI').replace(/_/, ' ');
      if (headerLine.includes(displayTitle) || headerLine.includes(info.key.toUpperCase())) {
        subjKey = info.key;
        break;
      }
    }
    
    // Hardcode overrides if header text is tricky
    if (headerLine.includes("ONA TILI VA ADABIYOT")) subjKey = "adab";
    if (headerLine.includes("INGLIZ TILI")) subjKey = "ingliz";
    if (headerLine.includes("NEMIS TILI")) subjKey = "nemis";
    
    if (!subjKey) continue;
    if (!answerKeys[subjKey]) answerKeys[subjKey] = {};

    const rows = tableText.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
    if (rows.length >= 3) {
      for (let r = 2; r < rows.length; r++) { // skip header and separator
        const parts = rows[r].split('|').map(s => s.trim()).filter(Boolean);
        // parts looks like: ["1", "**B**", "7", "**D**", ...]
        for (let i = 0; i < parts.length; i += 2) {
          if (parts[i] && parts[i+1]) {
            const qNum = parseInt(parts[i]);
            const ansLetter = parts[i+1].replace(/\*/g, '').trim();
            if (!isNaN(qNum) && ANSWER_MAP[ansLetter] !== undefined) {
              answerKeys[subjKey][qNum] = ANSWER_MAP[ansLetter];
            } else {
              console.log(`Debug ans: subj=${subjKey}, q=${qNum}, raw=${parts[i+1]}, parsed=${ansLetter}`);
            }
          }
        }
      }
    }
  }
  return answerKeys;
}

function findImageForQuestion(imgFolder, qNum) {
  if (!imgFolder) return null;
  const folderPath = path.join(DIR_PATH, 'rasmlar', imgFolder);
  if (!fs.existsSync(folderPath)) return null;

  // Qidirish: masalan, "3-savol.png" yoki "3-savol.jpg"
  const possibleNames = [`${qNum}-savol.png`, `${qNum}-savol.jpg`, `${qNum}.png`, `${qNum}.jpg`];
  
  for (const name of possibleNames) {
    const fullPath = path.join(folderPath, name);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

async function importMutaxassislik() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Delete all old mutaxassislik questions
  await TestQuestion.deleteMany({ block: { $regex: /^mutaxassislik/ } });
  console.log("Cleared old mutaxassislik questions.");

  const answers = parseAnswers();
  
  const files = fs.readdirSync(DIR_PATH).filter(f => f.endsWith('.md') && f !== "TO'G'RI_JAVOBLAR.md");

  for (const file of files) {
    let subjectInfo = null;
    for (const [k, v] of Object.entries(SUBJECT_MAP)) {
      if (file.includes(k)) {
        subjectInfo = v;
        break;
      }
    }
    if (!subjectInfo) continue;

    console.log(`\nParsing ${file}... (Subject: ${subjectInfo.key})`);
    
    const content = fs.readFileSync(path.join(DIR_PATH, file), 'utf-8');
    
    // Parse the MD file manually (similar to majburiy script)
    const qBlocks = content.split(/\*\*\d+\.\*\*/).slice(1);
    
    let qNumber = 1;
    let insertCount = 0;
    
    for (let block of qBlocks) {
      block = block.trim();
      const optMatches = block.match(/-\s*(?:\*\*)*[A-D][\)\.](?:\*\*)*\s+(.*)/g);
      if (!optMatches || optMatches.length !== 4) {
        console.log(`WARNING: Could not parse 4 options for Q${qNumber} in ${subjectInfo.key}`);
        qNumber++;
        continue;
      }

      let questionText = block;
      for (const opt of optMatches) {
        questionText = questionText.replace(opt, '');
      }
      questionText = questionText.trim();
      // Remove trailing hyphens or lines left over from markdown structure
      questionText = questionText.replace(/---$/, '').trim();

      const optionsText = optMatches.map(o => {
        let clean = o.replace(/-\s*(?:\*\*)*[A-D][\)\.](?:\*\*)*\s+/, '').trim();
        clean = clean.replace(/\*\*$/, '').replace(/^\*\*/, ''); // remove trailing/leading bold
        return clean;
      });

      // Find Answer
      const answerIdx = answers[subjectInfo.key] ? answers[subjectInfo.key][qNumber] : undefined;
      if (answerIdx === undefined) {
        console.log(`WARNING: Missing answer key for ${subjectInfo.key} Q${qNumber}`);
        qNumber++;
        continue;
      }

      // Check for image
      const imagesArray = [];
      const imgPath = findImageForQuestion(subjectInfo.imgFolder, qNumber);
      if (imgPath) {
        const ext = path.extname(imgPath);
        const newFilename = `mutaxassislik_${subjectInfo.key}_${Date.now()}_q${qNumber}${ext}`;
        const newDest = path.join(IMAGES_DIR, newFilename);
        
        fs.copyFileSync(imgPath, newDest);
        imagesArray.push(`/test-images/${newFilename}`);
        console.log(` -> Found & attached image for Q${qNumber}: ${newFilename}`);
      }

      // Insert into DB
      await TestQuestion.create({
        subject: subjectInfo.key,
        block: 'mutaxassislik',
        question: questionText,
        options: optionsText,
        answer: answerIdx,
        packageId: 'mutaxassislik_paket_1',
        topic: `Savol_${qNumber}`,
        images: imagesArray
      });
      insertCount++;
      qNumber++;
    }
    console.log(`✅ Inserted ${insertCount} questions for ${subjectInfo.key}.`);
  }

  console.log("\n🚀 All Mutaxassislik tests imported successfully!");
  process.exit(0);
}

importMutaxassislik().catch(err => {
  console.error(err);
  process.exit(1);
});
