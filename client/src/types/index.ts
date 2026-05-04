export type Plan = 'free' | 'basic' | 'pro' | 'vip'

export interface User {
  id?: string
  telegramId: number
  username?: string
  firstName?: string
  plan: Plan
  effectivePlan?: Plan
  planExpiresAt?: string | null
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

  // ─── Exam / Session types (Phase 2) ──────────────────────────────────────────

  export type ExamMode = 'dtm' | 'subject'
  export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

  export interface SessionSubject {
    subjectId: string
    name: string
    block: string
    questionCount: number
    weight: number
  }

  export interface SubjectScore {
    subjectId: string
    name: string
    correct: number
    wrong: number
    score: number
  }

  export interface ExamSession {
    _id: string
    // Backwards-compatible fields
    mode: 'dtm' | 'subject'
    direction?: string | null
    selectedSubjects?: string[]
    durationSeconds: number
    status: 'in_progress' | 'completed' | 'abandoned'
    startTime: string
    endTime?: string | null
    totalScore: number
    maxTotalScore?: number

    // New-style fields
    userId?: string
    subjects?: SessionSubject[]
    subjectScores?: SubjectScore[]
    subjectBreakdown?: SubjectBreakdown[]
  }
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

<<<<<<< HEAD
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
=======
// ─── Exam / Session types (Phase 2) ──────────────────────────────────────────

export type ExamMode = 'dtm' | 'subject'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'

export interface SessionSubject {
  subjectId: string
  name: string
  block: string
  questionCount: number
  weight: number
}

export interface SubjectScore {
  subjectId: string
  name: string
  correct: number
  wrong: number
  score: number
>>>>>>> ab9ecca (Changes before error encountered)
}

export interface ExamSession {
  _id: string
<<<<<<< HEAD
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
=======
  userId: string
  mode: ExamMode
  direction?: string | null
  subjects: SessionSubject[]
  durationSeconds: number
  status: SessionStatus
  startTime: string
  endTime?: string | null
  totalScore: number
  subjectScores: SubjectScore[]
>>>>>>> ab9ecca (Changes before error encountered)
}

export interface ExamQuestion {
  _id: string
  subject: string
<<<<<<< HEAD
  subjectName?: string
  block: string
=======
  block: string | null
>>>>>>> ab9ecca (Changes before error encountered)
  question: string
  options: string[]
  difficulty?: string
  topic?: string
}
<<<<<<< HEAD
=======

export interface AnswerResult {
  answer: {
    _id: string
    sessionId: string
    subjectId: string
    isCorrect: boolean
    selectedOption: number
    block: string | null
  }
  isCorrect: boolean
  correctIndex: number
  explanation: string
}

export interface DtmSubjectMeta {
  id: string
  name: string
}

export interface DtmConfig {
  totalQuestions: number
  durationMinutes: number
  durationSeconds: number
  maxScore: number
  mandatory: {
    block: string
    weight: number
    questionCount: number
    subjects: DtmSubjectMeta[]
  }
  specialty: {
    slots: { block: string; weight: number; questionCount: number }[]
  }
  directions: Record<string, { name: string; subjects: string[] }>
  allSubjects: { id: string; name: string; type: 'mandatory' | 'specialty' }[]
}
>>>>>>> ab9ecca (Changes before error encountered)
