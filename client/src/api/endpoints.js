import api from './client';
export const authApi = {
    // Google orqali kirish/ro'yxatdan o'tish
    googleLogin: (token) => api.post('/api/auth/google', { token }),
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
    document: (prompt, format, maxPages) => api.post('/api/ai/document', { prompt, format, maxPages }),
    chatSessions: () => api.get('/api/ai/chat/sessions'),
    chatSession: (id) => api.get(`/api/ai/chat/sessions/${id}`),
    deleteChatSession: (id) => api.delete(`/api/ai/chat/sessions/${id}`),
};
// ─── Streaming chat ────────────────────────────────────────────────────────
export async function streamChat(message, sessionId, onChunk, onSessionId, onDone, onError, signal) {
    const auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
    try {
        const res = await fetch(`${API_BASE}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.access || ''}`,
            },
            body: JSON.stringify({ message, sessionId }),
            signal
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            onError(err);
            return;
        }
        const newSessionId = res.headers.get('X-Session-Id');
        if (newSessionId)
            onSessionId(newSessionId);
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
        if (e.name === 'AbortError') {
            onDone(); // Silently finish if aborted
        }
        else {
            onError(e);
        }
    }
}
// ─── Utility for SSE JSON fetch (Timeout oldini olish uchun) ───────────────
export async function streamJsonFetch(url, body, timeoutMs = 180000) {
    const auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(`${API_BASE}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${auth.access || ''}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw { response: { data: err } }; // Axios kabi xato qaytarish
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        return await new Promise((resolve, reject) => {
            async function read() {
                try {
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
                            const data = line.slice(6).trim();
                            if (data === '[DONE]')
                                return; // resolved before
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.error)
                                    reject({ response: { data: parsed } });
                                else
                                    resolve({ data: parsed });
                            }
                            catch { }
                        }
                    }
                }
                catch (e) {
                    reject(e);
                }
            }
            read();
        });
    }
    catch (error) {
        if (error.name === 'AbortError') {
            throw { response: { data: { error: "Kechirasiz, jarayon juda cho'zilib ketdi (Timeout). Iltimos qayta urinib ko'ring." } } };
        }
        throw error;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
// ─── Subscription ──────────────────────────────────────────────────────────
export const subApi = {
    plans: () => api.get('/api/sub/plans'),
    status: () => api.get('/api/sub/status'),
    validatePromo: (code) => api.post('/api/sub/validate-promo', { code }),
    createP2POrder: (planId, promoCode) => api.post('/api/sub/create-p2p-order', { planId, promoCode }),
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
    generate: (subjectId, materialIds, count) => streamJsonFetch('/api/personal-tests/generate', { subjectId, materialIds, count }),
    generateMini: (subjectId, wrongAnswers, count = 10, sourceTestId) => streamJsonFetch('/api/personal-tests/mini', { subjectId, wrongAnswers, count, sourceTestId }),
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
    generate: (id, opt = 'standard') => streamJsonFetch(`/api/folders/${id}/generate`, { opt }),
    retry: (id) => api.post(`/api/folders/${id}/retry`),
    delete: (id) => api.delete(`/api/folders/${id}`),
    getFlashcards: (id) => api.get(`/api/folders/${id}/flashcards`),
    generateFlashcards: (id) => api.post(`/api/folders/${id}/flashcards`),
};
// ─── Misc (E'lonlar) ────────────────────────────────────────────────────────
export const miscApi = {
    activeAnnouncement: () => api.get('/api/misc/announcements/active'),
};
