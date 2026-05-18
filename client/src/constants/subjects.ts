// Frontend SUBJECT_META — backend examService.js bilan moslashtirilgan
// To'liq DTM fanlari ro'yxati (18 ta fan)

export type SubjectId =
  // Majburiy (3)
  | 'uztil' | 'math' | 'tarix'
  // Aniq va tabiiy fanlar
  | 'fizika' | 'kimyo' | 'bio' | 'geo'
  // Gumanitar
  | 'adab' | 'huquq'
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
  // Majburiy fanlar (3)
  uztil:   { id: 'uztil',   name: 'Ona tili',           icon: '📖', block: 'majburiy',      weight: 1.1 },
  math:    { id: 'math',    name: 'Matematika',         icon: '🔢', block: 'majburiy',      weight: 1.1 },
  tarix:   { id: 'tarix',   name: "O'zbekiston tarixi", icon: '🏛', block: 'majburiy',      weight: 1.1 },

  // Aniq va tabiiy fanlar
  fizika:  { id: 'fizika',  name: 'Fizika',       icon: '⚛',  block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
  kimyo:   { id: 'kimyo',   name: 'Kimyo',        icon: '⚗',  block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 2.1 },
  bio:     { id: 'bio',     name: 'Biologiya',    icon: '🧬', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },
  geo:     { id: 'geo',     name: 'Geografiya',   icon: '🌍', block: 'mutaxassislik', category: 'aniq_tabiiy', weight: 3.1 },

  // Gumanitar fanlar
  adab:    { id: 'adab',    name: 'Ona tili va adabiyoti', icon: '📚', block: 'mutaxassislik', category: 'gumanitar', weight: 2.1 },
  huquq:   { id: 'huquq',   name: 'Davlat va huquq',       icon: '⚖',  block: 'mutaxassislik', category: 'gumanitar', weight: 2.1 },

  // Chet tillari
  ingliz:  { id: 'ingliz',  name: 'Ingliz tili',  icon: '🇬🇧', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  nemis:   { id: 'nemis',   name: 'Nemis tili',   icon: '🇩🇪', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  fransuz: { id: 'fransuz', name: 'Fransuz tili', icon: '🇫🇷', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  arab:    { id: 'arab',    name: 'Arab tili',    icon: '🕌', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  fors:    { id: 'fors',    name: 'Fors tili',    icon: '🌙', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },
  turk:    { id: 'turk',    name: 'Turk tili',    icon: '🇹🇷', block: 'mutaxassislik', category: 'chet_tili', weight: 2.1 },

  // Boshqalar (DTM da bor)
  rus:     { id: 'rus',     name: 'Rus tili',     icon: '🇷🇺', block: 'mutaxassislik', category: 'boshqa', weight: 2.1 },
  inform:  { id: 'inform',  name: 'Informatika',  icon: '💻', block: 'mutaxassislik', category: 'boshqa', weight: 3.1 },
  iqtisod: { id: 'iqtisod', name: 'Iqtisodiyot',  icon: '📊', block: 'mutaxassislik', category: 'boshqa', weight: 2.1 },
}

export const COMPULSORY_IDS: SubjectId[] = ['uztil', 'math', 'tarix']
export const SPEC_IDS: SubjectId[] = [
  // Aniq va tabiiy
  'fizika', 'kimyo', 'bio', 'geo',
  // Gumanitar
  'adab', 'huquq',
  // Chet tillari
  'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
  // Boshqalar
  'rus', 'inform', 'iqtisod',
  // Math va tarix mutaxassislikda ham bo'ladi (dual context)
  'math', 'tarix',
]

// Dual-context fanlar (majburiy va mutaxassislik ikkalasida bo'la oladi)
export const DUAL_CONTEXT_SUBJECTS = new Set<string>(['math', 'tarix'])

// Faqat majburiy
export const ONLY_COMPULSORY_SUBJECTS = new Set<string>(['uztil'])

// Faqat mutaxassislik
export const ONLY_SPECIALTY_SUBJECTS = new Set<string>([
  'fizika', 'kimyo', 'bio', 'geo',
  'adab', 'huquq',
  'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
  'rus', 'inform', 'iqtisod',
])

export type Context = 'majburiy' | 'mutaxassislik'

export function getAllowedContexts(subjectId: string): Context[] {
  if (DUAL_CONTEXT_SUBJECTS.has(subjectId)) return ['majburiy', 'mutaxassislik']
  if (ONLY_COMPULSORY_SUBJECTS.has(subjectId)) return ['majburiy']
  return ['mutaxassislik']
}

export function getStandardCountByContext(context: Context): number {
  return context === 'majburiy' ? 10 : 30
}

// Mutaxassislik fanlarini kategoriya bo'yicha guruhlash
export const SPEC_BY_CATEGORY = {
  aniq_tabiiy: ['fizika', 'kimyo', 'bio', 'geo'] as SubjectId[],
  gumanitar:   ['adab', 'huquq'] as SubjectId[],
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

// Standart test sonlari
// Majburiy fan papkasi: 10 ta
// Mutaxassislik fan papkasi: 30 ta
export function getStandardTestCount(subjectId: string): number {
  const subj = getSubject(subjectId)
  if (!subj) return 10
  return subj.block === 'majburiy' ? 10 : 30
}

// Material yetarliligi - har test uchun taxminan 500 belgi
export function getMinCharsRequired(subjectId: string): number {
  return getStandardTestCount(subjectId) * 500
}

// Plan badge'lari
export const PLAN_BADGES: Record<string, { name: string; color: string; icon: string }> = {
  free:  { name: 'Free',  color: '#9ca3af', icon: '🆓' },
  basic: { name: 'Basic', color: '#3b82f6', icon: '⭐' },
  pro:   { name: 'Pro',   color: '#a855f7', icon: '💎' },
  vip:   { name: 'VIP',   color: '#fbbf24', icon: '👑' },
}

// Daraja rang/icon — Delta (v1-3) → Beta (v4-7) → Alfa (v8-10)
export const GRADE_META = {
  delta: { name: 'Delta', icon: 'δ', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
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
