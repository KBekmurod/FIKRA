import api from './client';
export const authApi = {
    // Ro'yxatdan o'tish — identifier email yoki telefon bo'lishi mumkin
    register: (identifier, password, name) => api.post('/api/auth/register', { identifier, password, name }),
    // Kirish — identifier email yoki telefon bo'lishi mumkin
    login: (identifier, password) => api.post('/api/auth/login', { identifier, password }),
    // Parol o'zgartirish
    changePassword: (oldPassword, newPassword) => api.post('/api/auth/change-password', { oldPassword, newPassword }),
    // Mavjud akkountga email yoki telefon qo'shish
    addIdentifier: (data) => api.post('/api/auth/add-identifier', data),
    // Joriy user
    me: () => api.get('/api/auth/me'),
};
// ─── Games / Test (eski API, hali ham ishlatiladi) ────────────────────────
export const testApi = {
    questions: (subject, block, limit = 10) => api.get('/api/games/test/questions', { params: { subject, block, limit } }),
    checkAnswer: (questionId, selectedIndex) => api.post('/api/games/test/check-answer', { questionId, selectedIndex }),
    result: (data) => api.post('/api/games/test/result', data),
};
// ─── Exam (Fikra standart DTM/Subject sessiyalar) ─────────────────────────
export const examApi = {
    config: () => api.get('/api/exams/config'),
    startDtm: (direction) => api.post('/api/exams/start-dtm', { direction }),
    startSubject: (subjects, advanced) => api.post('/api/exams/start-subject', { subjects, advanced }),
    answer: (sessionId, questionId, selectedOption) => api.post(`/api/exams/sessions/${sessionId}/answer`, { questionId, selectedOption }),
    finish: (sessionId) => api.post(`/api/exams/sessions/${sessionId}/finish`),
    abandon: (sessionId) => api.post(`/api/exams/sessions/${sessionId}/abandon`),
    review: (sessionId) => api.get(`/api/exams/sessions/${sessionId}/review`),
    history: (mode, page = 1) => api.get('/api/exams/history', { params: { mode, page } }),
    deleteSession: (sessionId) => api.delete(`/api/exams/sessions/${sessionId}`),
    repeatSession: (sessionId) => api.post(`/api/exams/sessions/${sessionId}/repeat`),
    // AI Kabinet
    cabinet: (subject) => api.get('/api/exams/cabinet', { params: subject ? { subject } : {} }),
    cabinetExplain: (answerId, sessionId) => api.get(`/api/exams/cabinet/wrong/${answerId}/explain`, { params: sessionId ? { sessionId } : {} }),
    cabinetAnalysis: () => api.post('/api/exams/cabinet/analysis'),
    cabinetMiniTest: (subject, limit = 10, fromSessionId) => api.post('/api/exams/cabinet/mini-test', { subject, limit, fromSessionId }),
};
// ─── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
    hint: (question, options, subject, mode = 'hint') => api.post('/api/ai/hint', { question, options, subject, mode }),
    document: (prompt, format, history = []) => api.post('/api/ai/document', { prompt, format, history }),
    image: (prompt) => api.post('/api/ai/image', { prompt }),
};
// ─── Streaming chat ────────────────────────────────────────────────────────
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
// ─── Subscription ──────────────────────────────────────────────────────────
export const subApi = {
    plans: () => api.get('/api/sub/plans'),
    status: () => api.get('/api/sub/status'),
    createP2POrder: (planId) => api.post('/api/sub/create-p2p-order', { planId }),
    myOrders: () => api.get('/api/sub/my-orders'),
};
// ─── v2: Materials ────────────────────────────────────────────────────────
export const materialApi = {
    limits: () => api.get('/api/materials/limits'),
    subjectsSummary: () => api.get('/api/materials/subjects-summary'),
    list: (subject) => api.get('/api/materials', { params: subject ? { subject } : {} }),
    get: (id) => api.get(`/api/materials/${id}`),
    createText: (folderId, subjectId, title, content) => api.post('/api/materials/text', { folderId, subjectId, title, content }),
    ocrExtract: (file) => {
        const fd = new FormData();
        fd.append('image', file);
        return api.post('/api/materials/ocr/extract', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    ocrSave: (draftId, folderId, subjectId, title, content) => api.post('/api/materials/ocr/save', { draftId, folderId, subjectId, title, content }),
    fileParse: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return api.post('/api/materials/file/parse', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        });
    },
    fileSave: (draftId, folderId, subjectId, title, content) => api.post('/api/materials/file/save', { draftId, folderId, subjectId, title, content }),
    update: (id, data) => api.put(`/api/materials/${id}`, data),
    delete: (id) => api.delete(`/api/materials/${id}`),
};
// ─── v2: Personal Tests ───────────────────────────────────────────────────
export const personalTestApi = {
    estimate: (subjectId) => api.get(`/api/personal-tests/estimate/${subjectId}`),
    generate: (subjectId, materialIds, count) => api.post('/api/personal-tests/generate', { subjectId, materialIds, count }, { timeout: 90000 }),
    generateMini: (subjectId, wrongAnswers, count = 10, sourceTestId) => api.post('/api/personal-tests/mini', { subjectId, wrongAnswers, count, sourceTestId }, { timeout: 90000 }),
    explain: (testId, qIdx) => api.post(`/api/personal-tests/${testId}/explain`, { qIdx }),
    answer: (testId, questionIdx, selectedOption) => api.post(`/api/personal-tests/${testId}/answer`, { questionIdx, selectedOption }),
    finish: (testId, finalAnswers) => api.post(`/api/personal-tests/${testId}/finish`, { finalAnswers }),
    abandon: (testId) => api.post(`/api/personal-tests/${testId}/abandon`),
    history: (subject, type, page = 1) => api.get('/api/personal-tests', { params: { subject, type, page } }),
    review: (testId) => api.get(`/api/personal-tests/${testId}`),
};
// ─── v2: Level ────────────────────────────────────────────────────────────
export const levelApi = {
    current: () => api.get('/api/level/current'),
    history: () => api.get('/api/level/history'),
};
// ─── v3: Folders (Ombor) ──────────────────────────────────────────────────
export const folderApi = {
    bySubject: (subjectId, context) => api.get(`/api/folders/by-subject/${subjectId}`, { params: context ? { context } : {} }),
    subjectsSummary: () => api.get('/api/folders/subjects-summary'),
    detail: (id) => api.get(`/api/folders/${id}`),
    create: (data) => api.post('/api/folders', data),
    checkSufficiency: (id) => api.post(`/api/folders/${id}/check-sufficiency`),
    generate: (id, opt = 'standard') => api.post(`/api/folders/${id}/generate`, { opt }, { timeout: 90000 }),
    retry: (id) => api.post(`/api/folders/${id}/retry`),
    delete: (id) => api.delete(`/api/folders/${id}`),
};
