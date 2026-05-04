import api from './client'
import type { User, Question, CheckResult, PlanData, DocumentResponse, ImageResponse, ExamSession, ExamQuestion, AnswerResult, DtmConfig } from '../types'

export const authApi = {
  login: (initData: string, referralCode?: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/api/auth/login', { initData, referralCode }
    ),
  loginStandard: (phone: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/api/auth/login-standard', { phone, password }
    ),
  register: (phone: string, password: string, firstName: string, lastName: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/api/auth/register', { phone, password, firstName, lastName }
    ),
  me: () => api.get<User>('/api/auth/me'),
  rank: () => api.get('/api/auth/rank'),
}

export const testApi = {
  questions: (subject: string, block?: string, limit = 10) =>
    api.get<Question[]>('/api/games/test/questions', { params: { subject, block, limit } }),
  checkAnswer: (questionId: string, selectedIndex: number) =>
    api.post<CheckResult>('/api/games/test/check-answer', { questionId, selectedIndex }),
  result: (data: any) =>
    api.post('/api/games/test/result', data),
}

// ─── Exam (yangi DTM/Subject sessiyalar) ──────────────────────────────────
export const examApi = {
  config: () => api.get('/api/exams/config'),
  startDtm: (direction: string) =>
    api.post('/api/exams/start-dtm', { direction }),
  startSubject: (subjects: string[], advanced?: any) =>
    api.post('/api/exams/start-subject', { subjects, advanced }),
  answer: (sessionId: string, questionId: string, selectedOption: number) =>
    api.post(`/api/exams/sessions/${sessionId}/answer`, { questionId, selectedOption }),
  finish: (sessionId: string) =>
    api.post(`/api/exams/sessions/${sessionId}/finish`),
  review: (sessionId: string) =>
    api.get(`/api/exams/sessions/${sessionId}/review`),
  history: (mode?: string, page = 1) =>
    api.get('/api/exams/history', { params: { mode, page } }),
}

// ─── Exam API (Phase 2) ───────────────────────────────────────────────────────
export const examApi = {
  /** DTM 2026 exam structure config (no auth required) */
  config: () =>
    api.get<DtmConfig>('/api/exam/config'),

  /** Start DTM-mode session (yo'nalish bo'yicha) */
  startDtm: (directionId: string) =>
    api.post<{ session: ExamSession; questions: ExamQuestion[] }>(
      '/api/exam/start/dtm', { directionId }
    ),

  /**
   * Start subject-select session (erkin fan tanlash)
   * @param subjects   - Array of { subjectId }
   * @param questionCounts  - Optional per-subject count override
   * @param durationSeconds - Optional total duration override
   */
  startSubject: (
    subjects: { subjectId: string }[],
    questionCounts?: Record<string, number>,
    durationSeconds?: number,
  ) =>
    api.post<{ session: ExamSession; questions: ExamQuestion[] }>(
      '/api/exam/start/subject', { subjects, questionCounts, durationSeconds }
    ),

  /** Submit one answer */
  submitAnswer: (sessionId: string, questionId: string, selectedOption: number) =>
    api.post<AnswerResult>(`/api/exam/${sessionId}/answer`, { questionId, selectedOption }),

  /** Finish session and get computed scores */
  finish: (sessionId: string) =>
    api.post<{ session: ExamSession; subjectScores: any[]; totalScore: number }>(
      `/api/exam/${sessionId}/finish`
    ),

  /** Get full results (session + answered questions) for review */
  results: (sessionId: string) =>
    api.get<{ session: ExamSession; answers: any[] }>(`/api/exam/${sessionId}/results`),

  /** Paginated session history */
  history: (params?: { mode?: 'dtm' | 'subject'; page?: number; limit?: number }) =>
    api.get<{ sessions: ExamSession[]; total: number; page: number; limit: number }>(
      '/api/exam/history', { params }
    ),
}

export const aiApi = {
  hint: (question: string, options: string[], subject: string, mode: 'hint' | 'explain' = 'hint') =>
    api.post<{ hint: string; used: number; limit: number | null }>(
      '/api/ai/hint', { question, options, subject, mode }
    ),
  document: (prompt: string, format: string, history: any[] = []) =>
    api.post<DocumentResponse>('/api/ai/document', { prompt, format, history }),
  image: (prompt: string) =>
    api.post<ImageResponse>('/api/ai/image', { prompt }),
}

export async function streamChat(
  message: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  const auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}')
  const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000'
  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.access || ''}`,
      },
      body: JSON.stringify({ message, history })
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); onError(err); return }
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') { onDone(); return }
        try { const parsed = JSON.parse(data); if (parsed.content) onChunk(parsed.content) } catch {}
      }
    }
    onDone()
  } catch (e) { onError(e) }
}

export const subApi = {
  plans: () => api.get<PlanData[]>('/api/sub/plans'),
  status: () => api.get('/api/sub/status'),
  createInvoice: (planId: string) =>
    api.post<{ invoiceUrl: string }>('/api/sub/create-invoice', { planId }),
  createP2POrder: (planId: string) =>
    api.post<{ order: { orderId: string; planName: string; priceUZS: number } }>('/api/sub/create-p2p-order', { planId }),
  myOrders: () => api.get('/api/sub/my-orders'),
}
