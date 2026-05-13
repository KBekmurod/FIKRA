import api from './client'
import type {
  User, Question, CheckResult, PlanData, DocumentResponse, ImageResponse,
  StudyMaterial, MaterialLimits, SubjectsSummary,
  PersonalTest, PtQuestion, UserLevelData, LevelHistoryItem,
} from '../types'

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (initData: string, referralCode?: string) =>
    api.post<{ accessToken: string; refreshToken: string; user: User }>(
      '/api/auth/login', { initData, referralCode }
    ),
  me: () => api.get<User>('/api/auth/me'),
}

// ─── Games / Test (eski API, hali ham ishlatiladi) ────────────────────────
export const testApi = {
  questions: (subject: string, block?: string, limit = 10) =>
    api.get<Question[]>('/api/games/test/questions', { params: { subject, block, limit } }),
  checkAnswer: (questionId: string, selectedIndex: number) =>
    api.post<CheckResult>('/api/games/test/check-answer', { questionId, selectedIndex }),
  result: (data: any) =>
    api.post('/api/games/test/result', data),
}

// ─── Exam (Fikra standart DTM/Subject sessiyalar) ─────────────────────────
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
  deleteSession: (sessionId: string) =>
    api.delete(`/api/exams/sessions/${sessionId}`),
  repeatSession: (sessionId: string) =>
    api.post(`/api/exams/sessions/${sessionId}/repeat`),
  // AI Kabinet
  cabinet: (subject?: string) =>
    api.get('/api/exams/cabinet', { params: subject ? { subject } : {} }),
  cabinetExplain: (answerId: string) =>
    api.get<{ explanation: string; originalExplanation?: string }>(`/api/exams/cabinet/wrong/${answerId}/explain`),
  cabinetAnalysis: () =>
    api.post('/api/exams/cabinet/analysis'),
  cabinetMiniTest: (subject?: string, limit = 10) =>
    api.post('/api/exams/cabinet/mini-test', { subject, limit }),
}

// ─── AI ────────────────────────────────────────────────────────────────────
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

// ─── Streaming chat ────────────────────────────────────────────────────────
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

// ─── Subscription ──────────────────────────────────────────────────────────
export const subApi = {
  plans: () => api.get<PlanData[]>('/api/sub/plans'),
  status: () => api.get('/api/sub/status'),
  createInvoice: (planId: string) =>
    api.post<{ invoiceUrl: string }>('/api/sub/create-invoice', { planId }),
  createP2POrder: (planId: string) =>
    api.post<{ order: { orderId: string; planName: string; priceUZS: number } }>('/api/sub/create-p2p-order', { planId }),
  myOrders: () => api.get('/api/sub/my-orders'),
}

// ─── v2: Materials ────────────────────────────────────────────────────────
export const materialApi = {
  limits: () =>
    api.get<MaterialLimits>('/api/materials/limits'),
  subjectsSummary: () =>
    api.get<{ summary: SubjectsSummary }>('/api/materials/subjects-summary'),
  list: (subject?: string) =>
    api.get<{ materials: StudyMaterial[] }>('/api/materials', { params: subject ? { subject } : {} }),
  get: (id: string) =>
    api.get<{ material: StudyMaterial }>(`/api/materials/${id}`),

  createText: (subjectId: string, title: string, content: string) =>
    api.post<{ success: boolean; material: StudyMaterial }>(
      '/api/materials/text', { subjectId, title, content }
    ),

  ocrExtract: (file: File) => {
    const fd = new FormData()
    fd.append('image', file)
    return api.post<{
      success: boolean; draftId: string; text: string; charCount: number;
      sourceMeta: { fileName: string; fileSizeKb: number };
      notice: string;
    }>('/api/materials/ocr/extract', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  ocrSave: (draftId: string, subjectId: string, title: string, content: string) =>
    api.post<{ success: boolean; material: StudyMaterial }>(
      '/api/materials/ocr/save', { draftId, subjectId, title, content }
    ),

  fileParse: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<{
      success: boolean; draftId: string; text: string; charCount: number;
      wasTrimmed: boolean; originalChars: number; pageCount: number;
      sourceMeta: { fileName: string; fileSizeKb: number; pageCount: number };
      notice: string;
    }>('/api/materials/file/parse', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
  },
  fileSave: (draftId: string, subjectId: string, title: string, content: string) =>
    api.post<{ success: boolean; material: StudyMaterial }>(
      '/api/materials/file/save', { draftId, subjectId, title, content }
    ),

  update: (id: string, data: { title?: string; content?: string }) =>
    api.put<{ success: boolean; material: StudyMaterial }>(`/api/materials/${id}`, data),
  delete: (id: string) =>
    api.delete(`/api/materials/${id}`),
}

// ─── v2: Personal Tests ───────────────────────────────────────────────────
export const personalTestApi = {
  estimate: (subjectId: string) =>
    api.get<{
      canGenerate: boolean; estimatedCount?: number; totalChars?: number;
      materials?: Array<{ _id: string; title: string; charCount: number }>;
      reason?: string;
    }>(`/api/personal-tests/estimate/${subjectId}`),

  generate: (subjectId: string, materialIds: string[], count?: number) =>
    api.post<{
      testId: string; subjectId: string; subjectName: string;
      totalQuestions: number; durationSeconds: number;
      questions: PtQuestion[];
    }>('/api/personal-tests/generate', { subjectId, materialIds, count }),

  generateMini: (subjectId: string, wrongAnswers: any[], count = 10) =>
    api.post<{
      testId: string; subjectId: string; subjectName: string;
      testType: 'mini'; totalQuestions: number; durationSeconds: number;
      questions: PtQuestion[];
    }>('/api/personal-tests/mini', { subjectId, wrongAnswers, count }),

  answer: (testId: string, questionIdx: number, selectedOption: number) =>
    api.post<{ saved: boolean; isCorrect: boolean; correctIndex: number; explanation: string }>(
      `/api/personal-tests/${testId}/answer`,
      { questionIdx, selectedOption }
    ),

  finish: (testId: string) =>
    api.post<{
      testId: string; subjectId: string; subjectName: string;
      testType: 'material' | 'mini';
      totalCorrect: number; totalQuestions: number; scorePercent: number;
      level: { versionBefore: number; versionAfter: number; levelUp: boolean } | null;
    }>(`/api/personal-tests/${testId}/finish`),

  history: (subject?: string, type?: 'material' | 'mini', page = 1) =>
    api.get<{ tests: PersonalTest[]; total: number; page: number; pages: number }>(
      '/api/personal-tests', { params: { subject, type, page } }
    ),

  review: (testId: string) =>
    api.get<{ test: any }>(`/api/personal-tests/${testId}`),
}

// ─── v2: Level ────────────────────────────────────────────────────────────
export const levelApi = {
  current: () =>
    api.get<UserLevelData>('/api/level/current'),
  history: () =>
    api.get<{ history: LevelHistoryItem[]; current: { month: string; version: number; grade: string } }>(
      '/api/level/history'
    ),
}
