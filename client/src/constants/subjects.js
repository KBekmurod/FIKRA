// Frontend SUBJECT_META - backend examService.js bilan moslashtirilgan
// To'liq DTM fanlari ro'yxati (18 ta fan + 3 ta majburiy)

export const SUBJECTS = {
  // Majburiy fanlar (3) - Alohida ID va Nom
  majburiy_onatili: { id: 'majburiy_onatili', name: 'Ona tili (Majburiy)',           icon: '🗣️', block: 'majburiy',      weight: 1.1 },
  majburiy_math:    { id: 'majburiy_math',    name: 'Matematika (Majburiy)',         icon: '🔢', block: 'majburiy',      weight: 1.1 },
  majburiy_tarix:   { id: 'majburiy_tarix',   name: "O'zbekiston tarixi (Majburiy)", icon: '🏛️', block: 'majburiy',      weight: 1.1 },

  // Mutaxassislik (Aniq va tabiiy fanlar)
  math:    { id: 'math',    name: 'Matematika',   icon: '🔢', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
  fizika:  { id: 'fizika',  name: 'Fizika',       icon: '⚡',  block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
  kimyo:   { id: 'kimyo',   name: 'Kimyo',        icon: '🧪',  block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 2.1 },
  bio:     { id: 'bio',     name: 'Biologiya',    icon: '🧬', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
  geo:     { id: 'geo',     name: 'Geografiya',   icon: '🌍', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },

  // Mutaxassislik (Gumanitar fanlar)
  tarix:   { id: 'tarix',   name: "Tarix",        icon: '🏛️', block: 'mutaxassislik', category: 'gumanitar', weight: 3.1 },
  onatili: { id: 'onatili', name: "Ona tili",     icon: '🗣️', block: 'mutaxassislik', category: 'gumanitar', weight: 3.1 },
  adab:    { id: 'adab',    name: 'Ona tili va adabiyoti', icon: '📖', block: 'mutaxassislik', category: 'gumanitar', weight: 2.1 },
  huquq:   { id: 'huquq',   name: 'Davlat va huquq',       icon: '⚖️',  block: 'mutaxassislik', category: 'gumanitar', weight: 2.1 },

  // Chet tillari
  ingliz:  { id: 'ingliz',  name: 'Ingliz tili',  icon: '🇬🇧', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  nemis:   { id: 'nemis',   name: 'Nemis tili',   icon: '🇩🇪', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  fransuz: { id: 'fransuz', name: 'Fransuz tili', icon: '🇫🇷', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  arab:    { id: 'arab',    name: 'Arab tili',    icon: '🇸🇦', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  fors:    { id: 'fors',    name: 'Fors tili',    icon: '🇮🇷', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  turk:    { id: 'turk',    name: 'Turk tili',    icon: '🇹🇷', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },

  // Boshqalar (DTM da bor)
  rus:     { id: 'rus',     name: 'Rus tili',     icon: '🇷🇺', block: 'mutaxassislik', category: 'boshqa', weight: 2.1 },
  inform:  { id: 'inform',  name: 'Informatika',  icon: '💻', block: 'mutaxassislik', category: 'boshqa', weight: 3.1 },
  iqtisod: { id: 'iqtisod', name: 'Iqtisodiyot',  icon: '📈', block: 'mutaxassislik', category: 'boshqa', weight: 2.1 },
}

export const COMPULSORY_IDS = ['majburiy_onatili', 'majburiy_math', 'majburiy_tarix']
export const SPEC_IDS = [
  'math', 'fizika', 'kimyo', 'bio', 'geo',
  'tarix', 'onatili', 'adab', 'huquq',
  'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
  'rus', 'inform', 'iqtisod',
]

export const DUAL_CONTEXT_SUBJECTS = new Set()
export const ONLY_COMPULSORY_SUBJECTS = new Set(COMPULSORY_IDS)
export const ONLY_SPECIALTY_SUBJECTS = new Set(SPEC_IDS)

export function getAllowedContexts(subjectId) {
  if (ONLY_COMPULSORY_SUBJECTS.has(subjectId)) return ['majburiy']
  return ['mutaxassislik']
}

export function getStandardCountByContext(context) {
  return context === 'majburiy' ? 10 : 30
}

export const SPEC_BY_CATEGORY = {
  aniq_tabiiy: ['math', 'fizika', 'kimyo', 'bio', 'geo'],
  gumanitar:   ['tarix', 'onatili', 'adab', 'huquq'],
  chet_tili:   ['ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk'],
  boshqa:      ['rus', 'inform', 'iqtisod'],
}

export const SPEC_CATEGORY_NAMES = {
  aniq_tabiiy: 'Aniq va tabiiy fanlar',
  gumanitar:   'Gumanitar fanlar',
  chet_tili:   'Chet tillari',
  boshqa:      'Boshqalar',
}

export function getSubject(id) {
  return SUBJECTS[id] || null
}

export function getStandardTestCount(subjectId) {
  const subj = getSubject(subjectId)
  if (!subj) return 10
  return subj.block === 'majburiy' ? 10 : 30
}

export function getMinCharsRequired(subjectId) {
  return getStandardTestCount(subjectId) * 500
}

export const PLAN_BADGES = {
  free:  { name: 'Free',  color: '#9ca3af', icon: '🆓' },
  basic: { name: 'Basic', color: '#3b82f6', icon: '🚀' },
  pro:   { name: 'Pro',   color: '#a855f7', icon: '💎' },
  vip:   { name: 'VIP',   color: '#fbbf24', icon: '👑' },
}

export const GRADE_META = {
  delta: { name: 'Delta', icon: 'Δ', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
  beta:  { name: 'Beta',  icon: 'β', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
  alfa:  { name: 'Alfa',  icon: 'α', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
}

export function versionToGrade(version) {
  if (version <= 3) return 'delta'
  if (version <= 7) return 'beta'
  return 'alfa'
}

export function versionInGrade(version) {
  const grade = versionToGrade(version)
  const offset = grade === 'delta' ? 0 : grade === 'beta' ? 3 : 7
  return version - offset
}

export function formatChars(n) {
  if (n < 1000) return String(n)
  return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K'
}

export function formatBytes(kb) {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
