const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const TestQuestion = require('../src/models/TestQuestion');

const DIR_PATH = path.join(__dirname, '../yangi test manbasi/majburiy fan testlari');

// Map headers to subject keys
const SUBJECT_MAP = {
  "ONA TILI": "majburiy_onatili",
  "MATEMATIKA": "majburiy_math",
  "O'ZBEKISTON TARIXI": "majburiy_tarix"
};

const ANSWER_MAP = {
  "A": 0, "B": 1, "C": 2, "D": 3
};

async function importPackages() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Delete existing compulsory questions to avoid duplicates (optional, we already cleared db but good to have)
  await TestQuestion.deleteMany({ block: 'majburiy' });
  console.log("Cleared old majburiy questions.");

  const files = fs.readdirSync(DIR_PATH).filter(f => f.endsWith('.md'));

  for (const file of files) {
    console.log(`\nParsing ${file}...`);
    const content = fs.readFileSync(path.join(DIR_PATH, file), 'utf-8');
    
    // Extract package ID from filename (e.g., majburiy_fanlar_paket_1.md -> paket_1)
    const packageMatch = file.match(/paket_(\d+)/i);
    const packageId = packageMatch ? `paket_${packageMatch[1]}` : file.replace('.md', '');

    // Split content into major sections
    const parts = content.split(/^## /m);
    
    // This will hold the parsed questions before applying answers
    // shape: { majburiy_onatili: [ {question, options}, ... ] }
    const questionsTemp = {
      "majburiy_onatili": [],
      "majburiy_math": [],
      "majburiy_tarix": []
    };

    let answerKeys = {
      "majburiy_onatili": {},
      "majburiy_math": {},
      "majburiy_tarix": {}
    };

    for (let i = 1; i < parts.length; i++) { // Skip part 0 (header)
      const partText = parts[i].trim();
      const firstLine = partText.split('\n')[0].trim();

      if (firstLine.includes('JAVOBLAR KALITI')) {
        // Parse Answer Keys
        const tables = partText.split(/^### /m);
        for (let j = 1; j < tables.length; j++) {
          const tableText = tables[j];
          let subjectKey = null;
          if (tableText.toLowerCase().includes('ona tili')) subjectKey = 'majburiy_onatili';
          else if (tableText.toLowerCase().includes('matematika')) subjectKey = 'majburiy_math';
          else if (tableText.toLowerCase().includes('tarixi')) subjectKey = 'majburiy_tarix';
          
          if (!subjectKey) continue;

          // Parse markdown table
          const lines = tableText.split('\n').map(l => l.trim()).filter(l => l.startsWith('|'));
          if (lines.length >= 3) { // Savol, separator, Javob
            const qRow = lines[0].split('|').map(s => s.trim()).filter(Boolean);
            const aRow = lines[2].split('|').map(s => s.trim()).filter(Boolean);
            
            // Skip the first cell "Savol" and "Javob"
            for (let k = 1; k < qRow.length; k++) {
              const qNum = parseInt(qRow[k]);
              const ansLetter = aRow[k];
              if (!isNaN(qNum) && ANSWER_MAP[ansLetter] !== undefined) {
                answerKeys[subjectKey][qNum] = ANSWER_MAP[ansLetter];
              }
            }
          }
        }
      } else {
        // Parse questions
        let currentSubject = null;
        for (const [key, subj] of Object.entries(SUBJECT_MAP)) {
          if (firstLine.toUpperCase().includes(key)) {
            currentSubject = subj;
            break;
          }
        }

        if (currentSubject) {
          // Find all questions using regex
          // Match "**1.** Question text"
          const qBlocks = partText.split(/\*\*\d+\.\*\*/).slice(1); // skip stuff before Q1
          
          let qNumber = 1;
          for (let block of qBlocks) {
            block = block.trim();
            // extract options
            const optMatches = block.match(/-\s+[A-D]\)\s+(.*)/g);
            if (!optMatches || optMatches.length !== 4) {
              console.log(`WARNING: Could not parse 4 options for Q${qNumber} in ${currentSubject}`);
              continue;
            }

            // Remove options from block to get the pure question text
            let questionText = block;
            for (const opt of optMatches) {
              questionText = questionText.replace(opt, '');
            }
            questionText = questionText.trim();

            const optionsText = optMatches.map(o => o.replace(/-\s+[A-D]\)\s+/, '').trim());

            questionsTemp[currentSubject].push({
              num: qNumber,
              question: questionText,
              options: optionsText
            });
            qNumber++;
          }
        }
      }
    }

    // Now insert them into MongoDB
    let insertCount = 0;
    for (const [subj, qs] of Object.entries(questionsTemp)) {
      for (const q of qs) {
        const answerIdx = answerKeys[subj][q.num];
        if (answerIdx === undefined) {
          console.log(`WARNING: Missing answer key for ${subj} Q${q.num} in ${packageId}`);
          continue;
        }

        await TestQuestion.create({
          subject: subj,
          block: 'majburiy',
          question: q.question,
          options: q.options,
          answer: answerIdx,
          packageId: packageId,
          topic: `Savol_${q.num}` // useful for stats or backup
        });
        insertCount++;
      }
    }
    console.log(`-> Inserted ${insertCount} questions for ${packageId}.`);
  }

  console.log("\n✅ All packages imported successfully!");
  process.exit(0);
}

importPackages().catch(err => {
  console.error(err);
  process.exit(1);
});
