// Frontend SUBJECT_META — backend examService.js bilan moslashtirilgan
// Fanlar icon va kategoriya bilan boyitilgan

export type SubjectId =
  | 'uztil' | 'math' | 'tarix'
  | 'bio' | 'kimyo' | 'fizika' | 'ingliz' | 'inform'
  | 'iqtisod' | 'rus' | 'geo' | 'adab'

export interface SubjectMeta {
  id: SubjectId
  name: string
  icon: string
  block: 'majburiy' | 'mutaxassislik'
  weight: number
}

export const SUBJECTS: Record<SubjectId, SubjectMeta> = {
  // Majburiy fanlar (3 ta)
  uztil:   { id: 'uztil',   name: 'Ona tili',           icon: '📖', block: 'majburiy',      weight: 1.1 },
  math:    { id: 'math',    name: 'Matematika',         icon: '🔢', block: 'majburiy',      weight: 1.1 },
  tarix:   { id: 'tarix',   name: "O'zbekiston tarixi", icon: '🏛️', block: 'majburiy',      weight: 1.1 },

  // Mutaxassislik fanlari
  bio:     { id: 'bio',     name: 'Biologiya',          icon: '🧬', block: 'mutaxassislik', weight: 3.1 },
  kimyo:   { id: 'kimyo',   name: 'Kimyo',              icon: '⚗️', block: 'mutaxassislik', weight: 2.1 },
  fizika:  { id: 'fizika',  name: 'Fizika',             icon: '⚛️', block: 'mutaxassislik', weight: 3.1 },
  ingliz:  { id: 'ingliz',  name: 'Ingliz tili',        icon: '🇬🇧', block: 'mutaxassislik', weight: 2.1 },
  inform:  { id: 'inform',  name: 'Informatika',        icon: '💻', block: 'mutaxassislik', weight: 3.1 },
  iqtisod: { id: 'iqtisod', name: 'Iqtisodiyot',        icon: '📊', block: 'mutaxassislik', weight: 2.1 },
  rus:     { id: 'rus',     name: 'Rus tili',           icon: '🇷🇺', block: 'mutaxassislik', weight: 2.1 },
  geo:     { id: 'geo',     name: 'Geografiya',         icon: '🌍', block: 'mutaxassislik', weight: 3.1 },
  adab:    { id: 'adab',    name: 'Adabiyot',           icon: '📚', block: 'mutaxassislik', weight: 2.1 },
}

export const COMPULSORY_IDS: SubjectId[] = ['uztil', 'math', 'tarix']
export const SPEC_IDS: SubjectId[] = [
  'bio', 'kimyo', 'fizika', 'ingliz', 'inform',
  'iqtisod', 'rus', 'geo', 'adab',
]

export function getSubject(id: string): SubjectMeta | null {
  return (SUBJECTS as any)[id] || null
}

// Plan badge'lari
export const PLAN_BADGES: Record<string, { name: string; color: string; icon: string }> = {
  free:  { name: 'Free',  color: '#9ca3af', icon: '🆓' },
  basic: { name: 'Basic', color: '#3b82f6', icon: '⭐' },
  pro:   { name: 'Pro',   color: '#a855f7', icon: '💎' },
  vip:   { name: 'VIP',   color: '#fbbf24', icon: '👑' },
}

// Daraja rang/icon
export const GRADE_META = {
  beta:  { name: 'Beta',  icon: 'β', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)' },
  delta: { name: 'Delta', icon: 'δ', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
  alfa:  { name: 'Alfa',  icon: 'α', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)' },
}

export function formatChars(n: number): string {
  if (n < 1000) return String(n)
  return (n / 1000).toFixed(n < 10000 ? 1 : 0) + 'K'
}

export function formatBytes(kb: number): string {
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
