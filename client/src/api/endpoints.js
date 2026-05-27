var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import api from './client';
{
    User, Question, CheckResult, PlanData, DocumentResponse, ImageResponse,
        StudyMaterial, MaterialLimits, SubjectsSummary,
        PersonalTest, PtQuestion, UserLevelData, LevelHistoryItem,
    ;
}
from;
'../types';
export var authApi = {
    // Google orqali kirish/ro'yxatdan o'tish
    googleLogin: function (token) {
        return api.post('/api/auth/google', { token: token });
    },
    // Joriy user
    me: function () { return api.get('/api/auth/me'); }
};
// ─── Games / Test (eski API, hali ham ishlatiladi) ────────────────────────
export var testApi = {
    questions: function (subject, block, limit) {
        if (limit === void 0) { limit = 10; }
        return api.get('/api/games/test/questions', { params: { subject: subject, block: block, limit: limit } });
    },
    checkAnswer: function (questionId, selectedIndex) {
        return api.post('/api/games/test/check-answer', { questionId: questionId, selectedIndex: selectedIndex });
    },
    result: function (data) {
        return api.post('/api/games/test/result', data);
    }
};
// ─── Exam (Fikra standart DTM/Subject sessiyalar) ─────────────────────────
export var examApi = {
    config: function () { return api.get('/api/exams/config'); },
    startDtm: function (direction) {
        return api.post('/api/exams/start-dtm', { direction: direction });
    },
    startSubject: function (subjects, advanced) {
        return api.post('/api/exams/start-subject', { subjects: subjects, advanced: advanced });
    },
    answer: function (sessionId, questionId, selectedOption) {
        return api.post("/api/exams/sessions/" + sessionId + "/answer", { questionId: questionId, selectedOption: selectedOption });
    },
    finish: function (sessionId) {
        return api.post("/api/exams/sessions/" + sessionId + "/finish");
    },
    abandon: function (sessionId) {
        return api.post("/api/exams/sessions/" + sessionId + "/abandon");
    },
    review: function (sessionId) {
        return api.get("/api/exams/sessions/" + sessionId + "/review");
    },
    history: function (mode, page) {
        if (page === void 0) { page = 1; }
        return api.get('/api/exams/history', { params: { mode: mode, page: page } });
    },
    deleteSession: function (sessionId) {
        return api["delete"]("/api/exams/sessions/" + sessionId);
    },
    repeatSession: function (sessionId) {
        return api.post("/api/exams/sessions/" + sessionId + "/repeat");
    },
    // AI Kabinet
    cabinet: function (subject) {
        return api.get('/api/exams/cabinet', { params: subject ? { subject: subject } : {} });
    },
    cabinetExplain: function (answerId, sessionId) {
        return api.get("/api/exams/cabinet/wrong/" + answerId + "/explain", { params: sessionId ? { sessionId: sessionId } : {} });
    },
    cabinetAnalysis: function () {
        return api.post('/api/exams/cabinet/analysis');
    },
    cabinetMiniTest: function (subject, limit, fromSessionId) {
        if (limit === void 0) { limit = 10; }
        return api.post('/api/exams/cabinet/mini-test', { subject: subject, limit: limit, fromSessionId: fromSessionId });
    }
};
// ─── AI ────────────────────────────────────────────────────────────────────
export var aiApi = {
    hint: function (question, options, subject, mode) {
        if (mode === void 0) { mode = 'hint'; }
        return api.post('/api/ai/hint', { question: question, options: options, subject: subject, mode: mode });
    },
    document: function (prompt, format, maxPages) {
        return api.post('/api/ai/document', { prompt: prompt, format: format, maxPages: maxPages });
    },
    chatSessions: function () { return api.get('/api/ai/chat/sessions'); },
    chatSession: function (id) { return api.get("/api/ai/chat/sessions/" + id); },
    deleteChatSession: function (id) { return api["delete"]("/api/ai/chat/sessions/" + id); }
};
// ─── Streaming chat ────────────────────────────────────────────────────────
export function streamChat(message, sessionId, onChunk, onSessionId, onDone, onError, signal) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, API_BASE, res, err, newSessionId, reader, decoder, buffer, _a, done, value, lines, _i, lines_1, line, data, parsed, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
                    API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, , 9]);
                    return [4 /*yield*/, fetch(API_BASE + "/api/ai/chat", {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer " + (auth.access || '')
                            },
                            body: JSON.stringify({ message: message, sessionId: sessionId }),
                            signal: signal
                        })];
                case 2:
                    res = _b.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()["catch"](function () { return ({}); })];
                case 3:
                    err = _b.sent();
                    onError(err);
                    return [2 /*return*/];
                case 4:
                    newSessionId = res.headers.get('X-Session-Id');
                    if (newSessionId)
                        onSessionId(newSessionId);
                    reader = res.body.getReader();
                    decoder = new TextDecoder();
                    buffer = '';
                    _b.label = 5;
                case 5:
                    if (!true) return [3 /*break*/, 7];
                    return [4 /*yield*/, reader.read()];
                case 6:
                    _a = _b.sent(), done = _a.done, value = _a.value;
                    if (done)
                        return [3 /*break*/, 7];
                    buffer += decoder.decode(value, { stream: true });
                    lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        if (!line.startsWith('data: '))
                            continue;
                        data = line.slice(6);
                        if (data === '[DONE]') {
                            onDone();
                            return [2 /*return*/];
                        }
                        try {
                            parsed = JSON.parse(data);
                            if (parsed.content)
                                onChunk(parsed.content);
                        }
                        catch (_c) { }
                    }
                    return [3 /*break*/, 5];
                case 7:
                    onDone();
                    return [3 /*break*/, 9];
                case 8:
                    e_1 = _b.sent();
                    if (e_1.name === 'AbortError') {
                        onDone(); // Silently finish if aborted
                    }
                    else {
                        onError(e_1);
                    }
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// ─── Utility for SSE JSON fetch (Timeout oldini olish uchun) ───────────────
export function streamJsonFetch(url, body, timeoutMs) {
    if (timeoutMs === void 0) { timeoutMs = 180000; }
    return __awaiter(this, void 0, Promise, function () {
        var auth, API_BASE, controller, timeoutId, res, err, reader_1, decoder_1, buffer_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
                    API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
                    controller = new AbortController();
                    timeoutId = setTimeout(function () { return controller.abort(); }, timeoutMs);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, fetch("" + API_BASE + url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': "Bearer " + (auth.access || '')
                            },
                            body: JSON.stringify(body),
                            signal: controller.signal
                        })];
                case 2:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, res.json()["catch"](function () { return ({}); })];
                case 3:
                    err = _a.sent();
                    throw { response: { data: err } }; // Axios kabi xato qaytarish
                case 4:
                    reader_1 = res.body.getReader();
                    decoder_1 = new TextDecoder();
                    buffer_1 = '';
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            function read() {
                                return __awaiter(this, void 0, void 0, function () {
                                    var _a, done, value, lines, _i, lines_2, line, data, parsed, e_2;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _b.trys.push([0, 4, , 5]);
                                                _b.label = 1;
                                            case 1:
                                                if (!true) return [3 /*break*/, 3];
                                                return [4 /*yield*/, reader_1.read()];
                                            case 2:
                                                _a = _b.sent(), done = _a.done, value = _a.value;
                                                if (done)
                                                    return [3 /*break*/, 3];
                                                buffer_1 += decoder_1.decode(value, { stream: true });
                                                lines = buffer_1.split('\n');
                                                buffer_1 = lines.pop() || '';
                                                for (_i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
                                                    line = lines_2[_i];
                                                    if (!line.startsWith('data: '))
                                                        continue;
                                                    data = line.slice(6).trim();
                                                    if (data === '[DONE]')
                                                        return [2 /*return*/]; // resolved before
                                                    try {
                                                        parsed = JSON.parse(data);
                                                        if (parsed.error)
                                                            reject({ response: { data: parsed } });
                                                        else
                                                            resolve({ data: parsed });
                                                    }
                                                    catch (_c) { }
                                                }
                                                return [3 /*break*/, 1];
                                            case 3: return [3 /*break*/, 5];
                                            case 4:
                                                e_2 = _b.sent();
                                                reject(e_2);
                                                return [3 /*break*/, 5];
                                            case 5: return [2 /*return*/];
                                        }
                                    });
                                });
                            }
                            read();
                        })];
                case 5: return [2 /*return*/, _a.sent()];
                case 6:
                    error_1 = _a.sent();
                    if (error_1.name === 'AbortError') {
                        throw { response: { data: { error: "Kechirasiz, jarayon juda cho'zilib ketdi (Timeout). Iltimos qayta urinib ko'ring." } } };
                    }
                    throw error_1;
                case 7:
                    clearTimeout(timeoutId);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// ─── Subscription ──────────────────────────────────────────────────────────
export var subApi = {
    plans: function () { return api.get('/api/sub/plans'); },
    status: function () { return api.get('/api/sub/status'); },
    validatePromo: function (code) {
        return api.post('/api/sub/validate-promo', { code: code });
    },
    createP2POrder: function (planId, promoCode) {
        return api.post('/api/sub/create-p2p-order', { planId: planId, promoCode: promoCode });
    },
    myOrders: function () { return api.get('/api/sub/my-orders'); }
};
// ─── v2: Materials ────────────────────────────────────────────────────────
export var materialApi = {
    limits: function () {
        return api.get('/api/materials/limits');
    },
    subjectsSummary: function () {
        return api.get('/api/materials/subjects-summary');
    },
    list: function (subject) {
        return api.get('/api/materials', { params: subject ? { subject: subject } : {} });
    },
    get: function (id) {
        return api.get("/api/materials/" + id);
    },
    createText: function (folderId, subjectId, title, content) {
        return api.post('/api/materials/text', { folderId: folderId, subjectId: subjectId, title: title, content: content });
    },
    ocrExtract: function (file) {
        var fd = new FormData();
        fd.append('image', file);
        return api.post('/api/materials/ocr/extract', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    ocrSave: function (draftId, folderId, subjectId, title, content) {
        return api.post('/api/materials/ocr/save', { draftId: draftId, folderId: folderId, subjectId: subjectId, title: title, content: content });
    },
    fileParse: function (file) {
        var fd = new FormData();
        fd.append('file', file);
        return api.post('/api/materials/file/parse', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000
        });
    },
    fileSave: function (draftId, folderId, subjectId, title, content) {
        return api.post('/api/materials/file/save', { draftId: draftId, folderId: folderId, subjectId: subjectId, title: title, content: content });
    },
    update: function (id, data) {
        return api.put("/api/materials/" + id, data);
    },
    "delete": function (id) {
        return api["delete"]("/api/materials/" + id);
    }
};
// ─── v2: Personal Tests ───────────────────────────────────────────────────
export var personalTestApi = {
    estimate: function (subjectId) {
        return api.get("/api/personal-tests/estimate/" + subjectId);
    },
    generate: function (subjectId, materialIds, count) {
        return streamJsonFetch('/api/personal-tests/generate', { subjectId: subjectId, materialIds: materialIds, count: count });
    },
    generateMini: function (subjectId, wrongAnswers, count, sourceTestId) {
        if (count === void 0) { count = 10; }
        return streamJsonFetch('/api/personal-tests/mini', { subjectId: subjectId, wrongAnswers: wrongAnswers, count: count, sourceTestId: sourceTestId });
    },
    explain: function (testId, qIdx) {
        return api.post("/api/personal-tests/" + testId + "/explain", { qIdx: qIdx });
    },
    answer: function (testId, questionIdx, selectedOption) {
        return api.post("/api/personal-tests/" + testId + "/answer", { questionIdx: questionIdx, selectedOption: selectedOption });
    },
    finish: function (testId, finalAnswers) {
        return api.post("/api/personal-tests/" + testId + "/finish", { finalAnswers: finalAnswers });
    },
    abandon: function (testId) {
        return api.post("/api/personal-tests/" + testId + "/abandon");
    },
    history: function (subject, type, page) {
        if (page === void 0) { page = 1; }
        return api.get('/api/personal-tests', { params: { subject: subject, type: type, page: page } });
    },
    review: function (testId) {
        return api.get("/api/personal-tests/" + testId);
    }
};
// ─── v2: Level ────────────────────────────────────────────────────────────
export var levelApi = {
    current: function () {
        return api.get('/api/level/current');
    },
    history: function () {
        return api.get('/api/level/history');
    }
};
// ─── v3: Folders (Ombor) ──────────────────────────────────────────────────
export var folderApi = {
    bySubject: function (subjectId, context) {
        return api.get("/api/folders/by-subject/" + subjectId, { params: context ? { context: context } : {} });
    },
    subjectsSummary: function () {
        return api.get('/api/folders/subjects-summary');
    },
    detail: function (id) {
        return api.get("/api/folders/" + id);
    },
    create: function (data) {
        return api.post('/api/folders', data);
    },
    checkSufficiency: function (id) {
        return api.post("/api/folders/" + id + "/check-sufficiency");
    },
    generate: function (id, opt) {
        if (opt === void 0) { opt = 'standard'; }
        return streamJsonFetch("/api/folders/" + id + "/generate", { opt: opt });
    },
    retry: function (id) {
        return api.post("/api/folders/" + id + "/retry");
    },
    "delete": function (id) {
        return api["delete"]("/api/folders/" + id);
    },
    getFlashcards: function (id) {
        return api.get("/api/folders/" + id + "/flashcards");
    },
    generateFlashcards: function (id) {
        return api.post("/api/folders/" + id + "/flashcards");
    }
};
// ─── Misc (E'lonlar) ────────────────────────────────────────────────────────
export var miscApi = {
    activeAnnouncement: function () {
        return api.get('/api/misc/announcements/active');
    }
};
