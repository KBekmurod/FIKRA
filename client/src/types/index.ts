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
