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
  streakDays?: number
  totalGamesPlayed?: number
  totalAiRequests?: number
  xp?: number
  rank?: RankProgress | null
  aiUsage?: Record<string, number>
  aiLimits?: Record<string, number | null>
  isNew?: boolean
  _demo?: boolean
}

export interface Rank {
  id: string
  level: number
  name: string
  emoji: string
  minXp: number
  color: string
  glow: string
}

export interface RankProgress {
  current: Rank
  next: Rank | null
  percent: number
  xpInLevel?: number
  xpToNext?: number
  currentXp?: number
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
