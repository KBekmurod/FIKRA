// Frontend SUBJECT_META - backend examService.js bilan moslashtirilgan
// To'liq DTM fanlari ro'yxati (18 ta fan + 3 ta majburiy)

export type SubjectId =
  // Majburiy (3) alohida ID lar
  | 'majburiy_onatili' | 'majburiy_math' | 'majburiy_tarix'
  // Aniq va tabiiy fanlar
  | 'math' | 'fizika' | 'kimyo' | 'bio' | 'geo'
  // Gumanitar
  | 'tarix' | 'onatili' | 'adab' | 'huquq'
  // Chet tillari
  | 'ingliz' | 'nemis' | 'fransuz' | 'arab' | 'fors' | 'turk'
  // Boshqalar
  | 'rus' | 'inform' | 'iqtisod'

export interface SubjectMeta {
  id: SubjectId
  name: string
  icon: string
  block: 'majburiy' | 'mutaxassislik'
  category?: 'aniq_tabiiy' | 'gumanitar' | 'chet_tili' | 'boshqa'
  weight: number
}

export const SUBJECTS: Record<SubjectId, SubjectMeta> = {
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

export const COMPULSORY_IDS: SubjectId[] = ['majburiy_onatili', 'majburiy_math', 'majburiy_tarix']
export const SPEC_IDS: SubjectId[] = [
  'math', 'fizika', 'kimyo', 'bio', 'geo',
  'tarix', 'onatili', 'adab', 'huquq',
  'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
  'rus', 'inform', 'iqtisod',
]

// Endi hech qanday fan dual-context emas, hammasi o'zining aniq ID siga ega
export const DUAL_CONTEXT_SUBJECTS = new Set<string>()

export const ONLY_COMPULSORY_SUBJECTS = new Set<string>(COMPULSORY_IDS)
export const ONLY_SPECIALTY_SUBJECTS = new Set<string>(SPEC_IDS)

export type Context = 'majburiy' | 'mutaxassislik'

export function getAllowedContexts(subjectId: string): Context[] {
  if (ONLY_COMPULSORY_SUBJECTS.has(subjectId)) return ['majburiy']
  return ['mutaxassislik']
}

export function getStandardCountByContext(context: Context): number {
  return context === 'majburiy' ? 10 : 30
}

export const SPEC_BY_CATEGORY = {
  aniq_tabiiy: ['math', 'fizika', 'kimyo', 'bio', 'geo'] as SubjectId[],
  gumanitar:   ['tarix', 'onatili', 'adab', 'huquq'] as SubjectId[],
  chet_tili:   ['ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk'] as SubjectId[],
  boshqa:      ['rus', 'inform', 'iqtisod'] as SubjectId[],
}

export const SPEC_CATEGORY_NAMES: Record<string, string> = {
  aniq_tabiiy: 'Aniq va tabiiy fanlar',
  gumanitar:   'Gumanitar fanlar',
  chet_tili:   'Chet tillari',
  boshqa:      'Boshqalar',
}

export function getSubject(id: string): SubjectMeta | null {
  return (SUBJECTS as any)[id] || null
}

export function getStandardTestCount(subjectId: string): number {
  const subj = getSubject(subjectId)
  if (!subj) return 10
  return subj.block === 'majburiy' ? 10 : 30
}

export function getMinCharsRequired(subjectId: string): number {
  return getStandardTestCount(subjectId) * 500
}

export const PLAN_BADGES: Record<string, { name: string; color: string; icon: string }> = {
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

export type Grade = 'delta' | 'beta' | 'alfa'

export function versionToGrade(version: number): Grade {
  if (version <= 3) return 'delta'
  if (version <= 7) return 'beta'
  return 'alfa'
}

export function versionInGrade(version: number): number {
  const grade = versionToGrade(version)
  const offset = grade === 'delta' ? 0 : grade === 'beta' ? 3 : 7
  return version - offset
}

export function formatChars(n: number): string {
  if (n < 1000) return String(n)
  return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K'
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
