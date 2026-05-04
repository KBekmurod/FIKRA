import api from './client';
export const authApi = {
    login: (initData, referralCode) => api.post('/api/auth/login', { initData, referralCode }),
    loginStandard: (phone, password) => api.post('/api/auth/login-standard', { phone, password }),
    register: (phone, password, firstName, lastName) => api.post('/api/auth/register', { phone, password, firstName, lastName }),
    me: () => api.get('/api/auth/me'),
    rank: () => api.get('/api/auth/rank'),
};
export const testApi = {
    questions: (subject, block, limit = 10) => api.get('/api/games/test/questions', { params: { subject, block, limit } }),
    checkAnswer: (questionId, selectedIndex) => api.post('/api/games/test/check-answer', { questionId, selectedIndex }),
    result: (data) => api.post('/api/games/test/result', data),
};
// ─── Exam (yangi DTM/Subject sessiyalar) ──────────────────────────────────
export const examApi = {
    config: () => api.get('/api/exams/config'),
    startDtm: (direction) => api.post('/api/exams/start-dtm', { direction }),
    startSubject: (subjects, advanced) => api.post('/api/exams/start-subject', { subjects, advanced }),
    answer: (sessionId, questionId, selectedOption) => api.post(`/api/exams/sessions/${sessionId}/answer`, { questionId, selectedOption }),
    finish: (sessionId) => api.post(`/api/exams/sessions/${sessionId}/finish`),
    review: (sessionId) => api.get(`/api/exams/sessions/${sessionId}/review`),
    history: (mode, page = 1) => api.get('/api/exams/history', { params: { mode, page } }),
};
// ─── Exam API (Phase 2) ───────────────────────────────────────────────────────
export const examApi = {
    /** DTM 2026 exam structure config (no auth required) */
    config: () => api.get('/api/exam/config'),
    /** Start DTM-mode session (yo'nalish bo'yicha) */
    startDtm: (directionId) => api.post('/api/exam/start/dtm', { directionId }),
    /**
     * Start subject-select session (erkin fan tanlash)
     * @param subjects   - Array of { subjectId }
     * @param questionCounts  - Optional per-subject count override
     * @param durationSeconds - Optional total duration override
     */
    startSubject: (subjects, questionCounts, durationSeconds) => api.post('/api/exam/start/subject', { subjects, questionCounts, durationSeconds }),
    /** Submit one answer */
    submitAnswer: (sessionId, questionId, selectedOption) => api.post(`/api/exam/${sessionId}/answer`, { questionId, selectedOption }),
    /** Finish session and get computed scores */
    finish: (sessionId) => api.post(`/api/exam/${sessionId}/finish`),
    /** Get full results (session + answered questions) for review */
    results: (sessionId) => api.get(`/api/exam/${sessionId}/results`),
    /** Paginated session history */
    history: (params) => api.get('/api/exam/history', { params }),
};
export const aiApi = {
    hint: (question, options, subject, mode = 'hint') => api.post('/api/ai/hint', { question, options, subject, mode }),
    document: (prompt, format, history = []) => api.post('/api/ai/document', { prompt, format, history }),
    image: (prompt) => api.post('/api/ai/image', { prompt }),
};
export async function streamChat(message, history, onChunk, onDone, onError) {
    const auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
    try {
        const res = await fetch(`${API_BASE}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.access || ''}`,
            },
            body: JSON.stringify({ message, history })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            onError(err);
            return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (!line.startsWith('data: '))
                    continue;
                const data = line.slice(6);
                if (data === '[DONE]') {
                    onDone();
                    return;
                }
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.content)
                        onChunk(parsed.content);
                }
                catch { }
            }
        }
        onDone();
    }
    catch (e) {
        onError(e);
    }
}
export const subApi = {
    plans: () => api.get('/api/sub/plans'),
    status: () => api.get('/api/sub/status'),
    createInvoice: (planId) => api.post('/api/sub/create-invoice', { planId }),
    createP2POrder: (planId) => api.post('/api/sub/create-p2p-order', { planId }),
    myOrders: () => api.get('/api/sub/my-orders'),
};
