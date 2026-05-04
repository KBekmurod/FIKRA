const fs = require('fs');
const path = require('path');
const PdfParser = require('pdf-parse/lib/pdf-parse.js');

const PDF_DIR = path.join(__dirname, '../../testlar agent uchun');
const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));

async function check() {
  if (files.length === 0) return console.log('Hech qanday PDF topilmadi.');
  console.log(`Topilgan PDFlar soni: ${files.length}`);
  
  const mathFile = files.find(f => f.toLowerCase().includes('matemat')) || files[0];
  const filePath = path.join(PDF_DIR, mathFile);
  console.log(`O'qilmoqda: ${mathFile}`);
  
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await PdfParser(buffer);
    
    console.log("-------- DASTLABKI MATN --------");
    console.log(data.text.substring(0, 3000));
    console.log("----------------------------------------------------------");
    console.log("Jami savollar: " + (data.text.match(/\n\d+\./g) || []).length);
    console.log("Jami bet: " + data.numpages);
  } catch (err) {
    console.error('Xato:', err.message);
    console.error(err.stack);
  }
}

check();
