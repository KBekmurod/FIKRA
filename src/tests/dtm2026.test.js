/**
 * DTM 2026 config sanity checks
 *
 * Runs without a test framework — plain Node.js assertions.
 * Execute: node src/tests/dtm2026.test.js
 */

'use strict';

const assert = require('assert');
const DTM = require('../config/dtm2026');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

console.log('\n── DTM 2026 config sanity checks ──────────────────────────────\n');

// ─── Basic numeric invariants ────────────────────────────────────────────────
test('totalQuestions should be 90', () => {
  assert.strictEqual(DTM.totalQuestions, 90);
});

test('durationMinutes should be 180', () => {
  assert.strictEqual(DTM.durationMinutes, 180);
});

test('durationSeconds should be 10800 (180 × 60)', () => {
  assert.strictEqual(DTM.durationSeconds, 10800);
});

test('maxScore should be 189', () => {
  assert.strictEqual(DTM.maxScore, 189.0);
});

// ─── Mandatory block ─────────────────────────────────────────────────────────
test('mandatory block has 3 subjects', () => {
  assert.strictEqual(DTM.mandatory.subjects.length, 3);
});

test('mandatory questionCount is 10', () => {
  assert.strictEqual(DTM.mandatory.questionCount, 10);
});

test('mandatory weight is 1.1', () => {
  assert.strictEqual(DTM.mandatory.weight, 1.1);
});

test('mandatory subjects are uztil, math, tarix', () => {
  const ids = DTM.mandatory.subjects.map(s => s.id);
  assert.deepStrictEqual(ids, ['uztil', 'math', 'tarix']);
});

// ─── Specialty block ─────────────────────────────────────────────────────────
test('specialty has 2 slots', () => {
  assert.strictEqual(DTM.specialty.slots.length, 2);
});

test('specialty slot 1: weight 3.1, count 30', () => {
  const s = DTM.specialty.slots[0];
  assert.strictEqual(s.weight, 3.1);
  assert.strictEqual(s.questionCount, 30);
});

test('specialty slot 2: weight 2.1, count 30', () => {
  const s = DTM.specialty.slots[1];
  assert.strictEqual(s.weight, 2.1);
  assert.strictEqual(s.questionCount, 30);
});

// ─── Max score derivation ────────────────────────────────────────────────────
test('maxScore derivation: (10×1.1)×3 + 30×3.1 + 30×2.1 = 189', () => {
  const mandatory  = 3 * DTM.mandatory.questionCount * DTM.mandatory.weight;
  const specialty1 = DTM.specialty.slots[0].questionCount * DTM.specialty.slots[0].weight;
  const specialty2 = DTM.specialty.slots[1].questionCount * DTM.specialty.slots[1].weight;
  const total = parseFloat((mandatory + specialty1 + specialty2).toFixed(2));
  assert.strictEqual(total, DTM.maxScore);
});

// ─── Question count (mandatory + specialty × 2) ──────────────────────────────
test('total questions: 3×10 + 30 + 30 = 90', () => {
  const total = 3 * DTM.mandatory.questionCount +
                DTM.specialty.slots[0].questionCount +
                DTM.specialty.slots[1].questionCount;
  assert.strictEqual(total, DTM.totalQuestions);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
test('getDirection throws for unknown direction', () => {
  assert.throws(() => DTM.getDirection('unknown_dir'), /Noma'lum yo'nalish/);
});

test('getDirection returns correct object for tibbiyot', () => {
  const dir = DTM.getDirection('tibbiyot');
  assert.deepStrictEqual(dir.subjects, ['bio', 'kimyo']);
});

test('getDirection is case-insensitive', () => {
  const dir = DTM.getDirection('TIBBIYOT');
  assert.deepStrictEqual(dir.subjects, ['bio', 'kimyo']);
});

test('defaultQuestionCount: mandatory subject → 10', () => {
  assert.strictEqual(DTM.defaultQuestionCount('math'), 10);
  assert.strictEqual(DTM.defaultQuestionCount('tarix'), 10);
});

test('defaultQuestionCount: specialty subject → 30', () => {
  assert.strictEqual(DTM.defaultQuestionCount('bio'), 30);
  assert.strictEqual(DTM.defaultQuestionCount('fizika'), 30);
});

// ─── buildDtmSubjects ────────────────────────────────────────────────────────
test('buildDtmSubjects for tibbiyot returns 5 subjects', () => {
  const subs = DTM.buildDtmSubjects('tibbiyot');
  assert.strictEqual(subs.length, 5); // 3 mandatory + 2 specialty
});

test('buildDtmSubjects: mandatory subjects have weight 1.1 and count 10', () => {
  const subs = DTM.buildDtmSubjects('tibbiyot');
  const mandatory = subs.filter(s => s.block === 'majburiy');
  assert.strictEqual(mandatory.length, 3);
  for (const s of mandatory) {
    assert.strictEqual(s.weight, 1.1);
    assert.strictEqual(s.questionCount, 10);
  }
});

test('buildDtmSubjects: specialty subjects have correct weights and counts', () => {
  const subs = DTM.buildDtmSubjects('tibbiyot');
  const s1 = subs.find(s => s.block === 'mutaxassislik_1');
  const s2 = subs.find(s => s.block === 'mutaxassislik_2');
  assert.ok(s1, 'mutaxassislik_1 must exist');
  assert.ok(s2, 'mutaxassislik_2 must exist');
  assert.strictEqual(s1.weight, 3.1);
  assert.strictEqual(s1.questionCount, 30);
  assert.strictEqual(s2.weight, 2.1);
  assert.strictEqual(s2.questionCount, 30);
  // tibbiyot: bio=3.1, kimyo=2.1
  assert.strictEqual(s1.subjectId, 'bio');
  assert.strictEqual(s2.subjectId, 'kimyo');
});

// ─── buildSubjectSelectSubjects ──────────────────────────────────────────────
test('buildSubjectSelectSubjects throws for empty list', () => {
  assert.throws(() => DTM.buildSubjectSelectSubjects([]), /Kamida/);
});

test('buildSubjectSelectSubjects throws for unknown subject', () => {
  assert.throws(
    () => DTM.buildSubjectSelectSubjects([{ subjectId: 'badSubject' }]),
    /Noma'lum fan/,
  );
});

test('buildSubjectSelectSubjects: mandatory subject defaults to 10 questions', () => {
  const subs = DTM.buildSubjectSelectSubjects([{ subjectId: 'math' }]);
  assert.strictEqual(subs[0].questionCount, 10);
  assert.strictEqual(subs[0].weight, 1.1);
});

test('buildSubjectSelectSubjects: specialty subject defaults to 30 questions', () => {
  const subs = DTM.buildSubjectSelectSubjects([{ subjectId: 'bio' }]);
  assert.strictEqual(subs[0].questionCount, 30);
  assert.strictEqual(subs[0].weight, 3.1); // first specialty slot
});

test('buildSubjectSelectSubjects: second specialty gets weight 2.1', () => {
  const subs = DTM.buildSubjectSelectSubjects([
    { subjectId: 'bio' },
    { subjectId: 'kimyo' },
  ]);
  assert.strictEqual(subs[0].weight, 3.1);
  assert.strictEqual(subs[1].weight, 2.1);
});

test('buildSubjectSelectSubjects: per-subject count override respected', () => {
  const subs = DTM.buildSubjectSelectSubjects(
    [{ subjectId: 'math' }],
    { math: 15 },
  );
  assert.strictEqual(subs[0].questionCount, 15);
});

// ─── computeDuration ─────────────────────────────────────────────────────────
test('computeDuration: override is respected', () => {
  const subs = [{ questionCount: 10 }];
  assert.strictEqual(DTM.computeDuration(subs, 3600), 3600);
});

test('computeDuration: proportional to total questions (min 300)', () => {
  const subs = [{ questionCount: 10 }]; // 10 × 60 = 600 > 300
  assert.strictEqual(DTM.computeDuration(subs, null), 600);
});

test('computeDuration: minimum 300 seconds (5 minutes)', () => {
  const subs = [{ questionCount: 1 }]; // 60 < 300 → clamp to 300
  assert.strictEqual(DTM.computeDuration(subs, null), 300);
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n──────────────────────────────────────────────────────────────`);
console.log(`Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) process.exit(1);
