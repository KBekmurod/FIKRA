/**
 * DTM 2026 — Imtihon tuzilishi (yagona manba / single source of truth)
 *
 * Ballar hisoblash formulasi:
 *   Ball = (majburiy_to'g'ri × 1.1) + (mutaxassislik_1_to'g'ri × 3.1) + (mutaxassislik_2_to'g'ri × 2.1)
 * Maksimal ball: (10+10+10)×1.1 + 30×3.1 + 30×2.1 = 33 + 93 + 63 = 189
 */

const DTM_2026 = {
  // ─── Umumiy parametrlar ──────────────────────────────────────────────────
  totalQuestions:  90,
  durationMinutes: 180,
  durationSeconds: 10800, // 180 × 60
  maxScore:        189.0,

  // ─── Majburiy fanlar bloki ───────────────────────────────────────────────
  mandatory: {
    block:         'majburiy',
    weight:        1.1,
    questionCount: 10,
    subjects: [
      { id: 'uztil',  name: "Ona tili (O'zbek / Rus / Qoraqalpoq)" },
      { id: 'math',   name: 'Matematika' },
      { id: 'tarix',  name: "O'zbekiston tarixi" },
    ],
  },

  // ─── Mutaxassislik fanlari bloki ─────────────────────────────────────────
  specialty: {
    slots: [
      { block: 'mutaxassislik_1', weight: 3.1, questionCount: 30 },
      { block: 'mutaxassislik_2', weight: 2.1, questionCount: 30 },
    ],
  },

  // ─── Yo'nalishlar → mutaxassislik fanlari juftligi ───────────────────────
  // subjects[0] → mutaxassislik_1 (3.1 ball), subjects[1] → mutaxassislik_2 (2.1 ball)
  directions: {
    tibbiyot:     { name: 'Tibbiyot',                   subjects: ['bio',    'kimyo']  },
    it:           { name: 'Axborot texnologiyalari',     subjects: ['inform', 'fizika'] },
    iqtisodiyot:  { name: 'Iqtisodiyot',                subjects: ['iqtisod','ingliz'] },
    pedagogika:   { name: 'Pedagogika',                  subjects: ['ingliz', 'rus']   },
    arxitektura:  { name: 'Arxitektura',                 subjects: ['fizika', 'rus']   },
    jurnalistika: { name: 'Jurnalistika',                subjects: ['ingliz', 'rus']   },
    rus_fili:     { name: "Rus filologiyasi",             subjects: ['rus',    'ingliz']},
    kimyo:        { name: 'Kimyo (yo\'nalish)',           subjects: ['kimyo',  'bio']   },
    fizika:       { name: 'Fizika (yo\'nalish)',          subjects: ['fizika', 'kimyo'] },
    ingliz_tili:  { name: "Ingliz tili (yo'nalish)",     subjects: ['ingliz', 'inform']},
  },

  // ─── Barcha fanlar (majburiy + mutaxassislik) ─────────────────────────────
  allSubjects: [
    { id: 'uztil',   name: "Ona tili",           type: 'mandatory' },
    { id: 'math',    name: 'Matematika',          type: 'mandatory' },
    { id: 'tarix',   name: "O'zbekiston tarixi",  type: 'mandatory' },
    { id: 'bio',     name: 'Biologiya',           type: 'specialty' },
    { id: 'kimyo',   name: 'Kimyo',               type: 'specialty' },
    { id: 'fizika',  name: 'Fizika',              type: 'specialty' },
    { id: 'ingliz',  name: 'Ingliz tili',         type: 'specialty' },
    { id: 'inform',  name: 'Informatika',         type: 'specialty' },
    { id: 'iqtisod', name: 'Iqtisodiyot',         type: 'specialty' },
    { id: 'rus',     name: 'Rus tili',            type: 'specialty' },
  ],
};

// ─── Derived lookups ──────────────────────────────────────────────────────
/** Set of mandatory subject IDs for O(1) lookup */
DTM_2026.mandatorySubjectIds = new Set(DTM_2026.mandatory.subjects.map(s => s.id));

/** Map of subjectId → subject meta for O(1) lookup */
DTM_2026.subjectMap = Object.fromEntries(DTM_2026.allSubjects.map(s => [s.id, s]));

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the direction config or throws a descriptive error.
 * @param {string} directionId
 */
DTM_2026.getDirection = function getDirection(directionId) {
  const key = (directionId || '').toLowerCase();
  const dir = DTM_2026.directions[key];
  if (!dir) {
    throw new Error(
      `Noma'lum yo'nalish: "${directionId}". ` +
      `Qo'llab-quvvatlanadigan yo'nalishlar: ${Object.keys(DTM_2026.directions).join(', ')}`,
    );
  }
  return { id: key, ...dir };
};

/**
 * Returns the default question count for a subject based on its type.
 * Mandatory → 10, Specialty → 30
 * @param {string} subjectId
 */
DTM_2026.defaultQuestionCount = function defaultQuestionCount(subjectId) {
  return DTM_2026.mandatorySubjectIds.has(subjectId)
    ? DTM_2026.mandatory.questionCount
    : DTM_2026.specialty.slots[0].questionCount;
};

/**
 * Builds the subjects metadata array for a DTM-mode session.
 * @param {string} directionId
 * @returns {{ subjectId, name, block, questionCount, weight }[]}
 */
DTM_2026.buildDtmSubjects = function buildDtmSubjects(directionId) {
  const dir = DTM_2026.getDirection(directionId);
  const subjects = [];

  // Majburiy fanlar
  for (const s of DTM_2026.mandatory.subjects) {
    subjects.push({
      subjectId:     s.id,
      name:          s.name,
      block:         DTM_2026.mandatory.block,
      questionCount: DTM_2026.mandatory.questionCount,
      weight:        DTM_2026.mandatory.weight,
    });
  }

  // Mutaxassislik fanlari (2 ta)
  dir.subjects.forEach((sId, idx) => {
    const slot = DTM_2026.specialty.slots[idx];
    const meta = DTM_2026.subjectMap[sId];
    subjects.push({
      subjectId:     sId,
      name:          meta ? meta.name : sId,
      block:         slot.block,
      questionCount: slot.questionCount,
      weight:        slot.weight,
    });
  });

  return subjects;
};

/**
 * Builds the subjects metadata array for a subject-select session.
 * - Mandatory subjects default to 10 questions (weight 1.1)
 * - Specialty subjects default to 30 questions; the 1st specialty → 3.1, 2nd → 2.1, rest → 2.1
 * - Per-subject questionCount override accepted via `overrides` map.
 *
 * @param {{ subjectId: string }[]} selectedSubjects
 * @param {{ [subjectId: string]: number }} [questionCountOverrides] optional per-subject count
 * @returns {{ subjectId, name, block, questionCount, weight }[]}
 */
DTM_2026.buildSubjectSelectSubjects = function buildSubjectSelectSubjects(
  selectedSubjects,
  questionCountOverrides = {},
) {
  if (!selectedSubjects || selectedSubjects.length === 0) {
    throw new Error('Kamida 1 ta fan tanlanishi kerak');
  }

  let specialtySlotIdx = 0;
  return selectedSubjects.map(({ subjectId }) => {
    const meta = DTM_2026.subjectMap[subjectId];
    if (!meta) {
      throw new Error(`Noma'lum fan: "${subjectId}"`);
    }

    const isMandatory    = meta.type === 'mandatory';
    const defaultCount   = isMandatory
      ? DTM_2026.mandatory.questionCount
      : DTM_2026.specialty.slots[0].questionCount;
    const questionCount  = questionCountOverrides[subjectId] || defaultCount;

    let block, weight;
    if (isMandatory) {
      block  = DTM_2026.mandatory.block;
      weight = DTM_2026.mandatory.weight;
    } else {
      // assign specialty slots in order; fallback to last slot weight for extras
      const slot = DTM_2026.specialty.slots[specialtySlotIdx] ||
                   DTM_2026.specialty.slots[DTM_2026.specialty.slots.length - 1];
      block  = slot.block;
      weight = slot.weight;
      specialtySlotIdx++;
    }

    return { subjectId, name: meta.name, block, questionCount, weight };
  });
};

/**
 * Computes the total duration (in seconds) for a subject-select session.
 * - Proportional to total question count (1 minute per question), min 5 min.
 * - Can be overridden by caller.
 * @param {{ questionCount: number }[]} subjects
 * @param {number|null} [override]
 */
DTM_2026.computeDuration = function computeDuration(subjects, override) {
  if (override && override > 0) return override;
  const total = subjects.reduce((s, x) => s + x.questionCount, 0);
  return Math.max(300, total * 60); // 60 sec per question, min 5 min
};

module.exports = DTM_2026;
