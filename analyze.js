const { QUESTIONS } = require('./src/utils/seedQuestions');

console.log("Total questions parsed:", QUESTIONS.length);

const subjectCounts = {};
const questionMap = {};
const conflicts = [];
const allDuplicates = [];

QUESTIONS.forEach(q => {
  subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
  
  if (questionMap[q.question]) {
    const existing = questionMap[q.question];
    const currentCorrectText = q.options[q.answer];
    const existingCorrectText = existing.options[existing.answer];
    
    if (currentCorrectText !== existingCorrectText) {
      conflicts.push({
        question: q.question,
        ans1: existingCorrectText,
        ans2: currentCorrectText
      });
    } else {
      allDuplicates.push(q.question);
    }
  } else {
    questionMap[q.question] = q;
  }
});

console.log("\n--- Subject Counts ---");
console.log(subjectCounts);

console.log("\n--- Conflicts found:", conflicts.length, "---");
if (conflicts.length > 0) {
  console.log("First 5 conflicts:");
  conflicts.slice(0, 5).forEach(c => console.log(`Q: ${c.question}\n A1: ${c.ans1}\n A2: ${c.ans2}\n`));
}

console.log(`\n--- Other non-conflicting duplicates: ${allDuplicates.length}`);

const topics = new Set(QUESTIONS.map(q => q.topic || "undefined"));
console.log("\n--- Topics ---", Array.from(topics));
