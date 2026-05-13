export type Plan = 'free' | 'basic' | 'pro' | 'vip'

export interface User {
  id?: string
  telegramId: number
  username?: string
  firstName?: string
  plan: Plan
  effectivePlan?: Plan
  planExpiresAt?: string | null
  isSubscribed?: boolean
  aiUsage?: Record<string, number>
  aiLimits?: Record<string, number | null>
  isNew?: boolean
  _demo?: boolean
}

export interface Question {
  _id: string
  question: string
  options: string[]
  subject: string
  block: string
}

export interface CheckResult {
  isCorrect: boolean
  correctIndex: number
  explanation: string
  questionContext: { question: string; options: string[]; subject: string }
}

export interface PlanData {
  id: string
  name: string
  tier: Plan
  period: string
  durationDays: number
  priceStars: number
  priceUZS: number
  badge: string | null
  features: string[]
}

export interface DocumentResponse {
  success: boolean
  format: string
  fileName: string
  fileId: string
  downloadUrl: string
  sizeKb: number
  title: string
  preview: string
}

export interface ImageResponse {
  success: boolean
  base64: string
  mimeType: string
  fileId: string
  downloadUrl: string
  fileName: string
}

// ─── Exam types ───────────────────────────────────────────────────────────
export interface SubjectBreakdown {
  subjectId: string
  subjectName: string
  block: string
  weight: number
  questionCount: number
  correct: number
  wrong: number
  score: number
  maxScore: number
}

export interface ExamSession {
  _id: string
  mode: 'dtm' | 'subject'
  direction?: string
  selectedSubjects: string[]
  durationSeconds: number
  status: 'in_progress' | 'completed' | 'abandoned'
  startTime: string
  endTime?: string
  totalScore: number
  maxTotalScore: number
  subjectBreakdown: SubjectBreakdown[]
}

export interface ExamQuestion {
  _id: string
  subject: string
  subjectName?: string
  block: string
  question: string
  options: string[]
  difficulty?: string
  topic?: string
}

// ─── v2: Materials ────────────────────────────────────────────────────────
export type MaterialSource = 'text' | 'ocr' | 'file'

export interface StudyMaterial {
  _id: string
  userId: string
  subjectId: string
  source: MaterialSource
  title: string
  content: string
  charCount: number
  sourceMeta?: {
    fileName?: string
    fileMime?: string
    fileSizeKb?: number
    pageCount?: number
    ocrRawLength?: number
  }
  testGenCount?: number
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface MaterialLimits {
  plan: Plan
  textMaterials: { limit: number | null }
  ocrUploads:    { limit: number | null; used: number }
  fileUploads:   { limit: number | null; used: number }
  testsGen:      { limit: number | null; used: number }
  rules: {
    maxTextChars: number
    minTextChars: number
    maxImageBytes: number
    maxFileBytes: number
    maxFilePages: number
    allowedImageMimes: string[]
    allowedFileMimes: string[]
  }
}

export interface SubjectsSummary {
  [subjectId: string]: {
    count: number
    totalChars: number
    bySource: { text: number; ocr: number; file: number }
  }
}

// ─── v2: Personal Tests ───────────────────────────────────────────────────
export interface PtQuestion {
  idx: number
  question: string
  options: string[]
  topic?: string
}

export interface PersonalTest {
  _id: string
  userId: string
  subjectId: string
  subjectName: string
  materialIds: string[]
  totalQuestions: number
  totalCorrect: number
  scorePercent: number
  status: 'in_progress' | 'completed' | 'abandoned'
  testType: 'material' | 'mini'
  startTime: string
  endTime?: string
  createdAt: string
}

// ─── v2: Level (beta/delta/alfa) ──────────────────────────────────────────
export type Grade = 'beta' | 'delta' | 'alfa'

export interface UserLevelData {
  currentVersion: number
  currentGrade: Grade
  currentMonth: string
  standardTests: { correct: number; total: number }
  personalTests: { correct: number; total: number }
  miniTests:     { correct: number; total: number }
  accuracyPercent: number
  nextVersionInfo: {
    isMax: boolean
    nextVersion?: number
    nextGrade?: Grade
    requiredAccuracy?: number
    currentAccuracy?: number
    questionsAnswered?: number
    questionsNeeded?: number
    testSource?: string
    isReady?: boolean
  }
}

export interface LevelHistoryItem {
  monthKey: string
  maxVersion: number
  grade: Grade
  standardTests: { correct: number; total: number }
  personalTests: { correct: number; total: number }
  miniTests:     { correct: number; total: number }
  endedAt: string
}
