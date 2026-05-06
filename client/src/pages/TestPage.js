import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { examApi, aiApi, testApi } from '../api/endpoints';
import { getStoredAuth } from '../api/client';
import { useToast } from '../components/Toast';
import SubscriptionModal from '../components/SubscriptionModal';
import { buildOfflineDtmSession, buildOfflineSubjectSession, calculateOfflineResult, getCachedExamConfig, saveCachedExamConfig, warmOfflineQuestionBank, } from '../utils/offlinePractice';
import { enqueueOfflineResult } from '../utils/offlineSync';
const SUBJECT_EMOJI = {
    uztil: '🔤', math: '➕', tarix: '🏛️', bio: '🧬', kimyo: '⚗️',
    fizika: '⚛️', ingliz: '🇬🇧', inform: '💻', iqtisod: '💰', rus: '🇷🇺',
    geo: '🌍', adab: '📖',
};
// ─── Asosiy komponent ──────────────────────────────────────────────────────
export default function TestPage() {
    const [screen, setScreen] = useState('home');
    const [config, setConfig] = useState(null);
    const [sessionData, setSessionData] = useState(null); // quiz uchun
    const [resultData, setResultData] = useState(null);
    const [reviewSessionId, setReviewSessionId] = useState(null);
    const [historyMode, setHistoryMode] = useState('dtm');
    const [subOpen, setSubOpen] = useState(false);
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const drillStartedRef = useRef(false);
    useEffect(() => {
        let alive = true;
        const loadConfig = async () => {
            try {
                const { data } = await examApi.config();
                if (!alive)
                    return;
                setConfig(data);
                saveCachedExamConfig(data);
                if (navigator.onLine) {
                    warmOfflineQuestionBank(data, async (subject, block, limit) => {
                        const { data: pack } = await testApi.offlinePack(subject, block, limit);
                        return pack;
                    }).catch(() => { });
                }
            }
            catch {
                const cached = getCachedExamConfig();
                if (cached && alive)
                    setConfig(cached);
            }
        };
        loadConfig();
    }, []);
    useEffect(() => {
        if (!config || drillStartedRef.current)
            return;
        const params = new URLSearchParams(location.search);
        if (params.get('drill') !== '1')
            return;
        const subject = params.get('subject');
        if (!subject)
            return;
        const rawCount = parseInt(params.get('count') || '5', 10);
        const count = Number.isFinite(rawCount) ? Math.min(10, Math.max(1, rawCount)) : 5;
        drillStartedRef.current = true;
        navigate('/test', { replace: true });
        void startSubject([subject], {
            questionCounts: { [subject]: count },
            durationSeconds: Math.max(10 * 60, count * 90),
        });
    }, [config, location.search, navigate]);
    // Support starting drill via location.state (from AIPage)
    useEffect(() => {
        const state = location.state;
        if (state && state.drillSession) {
            setSessionData(state.drillSession);
            setScreen('quiz');
        }
    }, [location]);
    const goHome = () => {
        setScreen('home');
        setSessionData(null);
        setResultData(null);
    };
    // ─── DTM boshlash ──────────────────────────────────────────────────────
    const startDtm = async (direction) => {
        try {
            const { data } = await examApi.startDtm(direction);
            setSessionData(data);
            setScreen('quiz');
        }
        catch (e) {
            const offlineSession = config ? buildOfflineDtmSession(config, direction) : null;
            if (offlineSession) {
                setSessionData(offlineSession);
                setScreen('quiz');
                toast('Oflayn mashq rejimi ishga tushdi', 'ok');
                return;
            }
            toast(e.response?.data?.error || 'Xatolik', 'err');
        }
    };
    // ─── Subject boshlash ──────────────────────────────────────────────────
    const startSubject = async (subjects, advanced) => {
        try {
            const { data } = await examApi.startSubject(subjects, advanced);
            setSessionData(data);
            setScreen('quiz');
        }
        catch (e) {
            const counts = advanced?.questionCounts || undefined;
            const offlineSession = config ? buildOfflineSubjectSession(config, subjects, counts) : null;
            if (offlineSession) {
                setSessionData({ ...offlineSession, advanced });
                setScreen('quiz');
                toast('Oflayn mashq rejimi ishga tushdi', 'ok');
                return;
            }
            toast(e.response?.data?.error || 'Xatolik', 'err');
        }
    };
    // ─── Quiz tugadi → natija ──────────────────────────────────────────────
    const onQuizFinish = (result) => {
        setResultData(result);
        setScreen('result');
    };
    if (screen === 'home') {
        return (_jsx(HomeScreen, { onDtm: () => setScreen('dtm_setup'), onSubject: () => setScreen('subject_setup'), onHistory: () => setScreen('history') }));
    }
    if (screen === 'dtm_setup') {
        return (_jsx(DtmSetup, { directions: config?.directions || [], onStart: startDtm, onBack: goHome }));
    }
    if (screen === 'subject_setup') {
        return (_jsx(SubjectSetup, { subjects: config?.subjects || [], onStart: startSubject, onBack: goHome }));
    }
    if (screen === 'quiz' && sessionData) {
        return (_jsx(QuizScreen, { sessionData: sessionData, onFinish: onQuizFinish, onExit: goHome, onSubOpen: () => setSubOpen(true) }));
    }
    if (screen === 'result' && resultData) {
        return (_jsx(ResultScreen, { result: resultData, onBack: goHome, onHistory: () => setScreen('history'), onReview: () => { setReviewSessionId(resultData.sessionId); setScreen('review'); } }));
    }
    if (screen === 'history') {
        return (_jsx(HistoryScreen, { mode: historyMode, onModeChange: setHistoryMode, onBack: goHome, onReview: (id) => { setReviewSessionId(id); setScreen('review'); } }));
    }
    if (screen === 'review' && reviewSessionId) {
        return (_jsx(ReviewScreen, { sessionId: reviewSessionId, onBack: () => setScreen('history'), onSubOpen: () => setSubOpen(true) }));
    }
    return (_jsx(_Fragment, { children: _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) }) }));
}
// ═══════════════════════════════════════════════════════════════════════════
// HomeScreen
// ═══════════════════════════════════════════════════════════════════════════
function HomeScreen({ onDtm, onSubject, onHistory }) {
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsx("button", { onClick: onHistory, style: {
                            background: 'var(--s2)', border: '1px solid var(--f)',
                            borderRadius: 10, padding: '7px 12px', fontSize: 12,
                            color: 'var(--txt-2)', cursor: 'pointer', fontWeight: 600,
                        }, children: "\uD83D\uDCC1 Tarix" })] }), _jsx("div", { style: { padding: '6px 20px 0' }, children: _jsx("div", { style: {
                        background: 'rgba(123,104,238,0.07)', border: '1px solid rgba(123,104,238,0.18)',
                        borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5,
                    }, children: "\uD83D\uDCCB DTM 2026 \u00B7 90 savol \u00B7 180 daqiqa \u00B7 maks. 189 ball" }) }), _jsx("div", { className: "section-title", style: { marginTop: 16 }, children: "Test turini tanlang" }), _jsxs("div", { style: { padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }, children: [_jsxs("button", { onClick: onDtm, style: {
                            background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(123,104,238,0.06))',
                            border: '1.5px solid rgba(123,104,238,0.35)',
                            borderRadius: 14, padding: '18px 18px', textAlign: 'left',
                            color: 'var(--txt)', cursor: 'pointer', width: '100%',
                        }, children: [_jsx("div", { style: { fontSize: 28, marginBottom: 8 }, children: "\uD83C\uDFAF" }), _jsx("div", { style: { fontWeight: 800, fontSize: 16, marginBottom: 4 }, children: "Yo'nalish bo'yicha (DTM)" }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }, children: ["Yo'nalishingizni tanlang \u2014 3 majburiy + 2 mutaxassislik fan", _jsx("br", {}), _jsx("span", { style: { color: 'var(--acc-l)', fontWeight: 700 }, children: "90 savol \u00B7 180 daqiqa \u00B7 189 ball" })] }), _jsx("div", { style: { marginTop: 12, display: 'flex', gap: 6 }, children: ['Majburiy 3×10', 'Mutax. 2×30'].map(t => (_jsx("span", { style: {
                                        background: 'rgba(123,104,238,0.15)', border: '1px solid rgba(123,104,238,0.3)',
                                        borderRadius: 100, padding: '3px 10px', fontSize: 10, color: 'var(--acc-l)', fontWeight: 700,
                                    }, children: t }, t))) })] }), _jsxs("button", { onClick: onSubject, style: {
                            background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,212,170,0.04))',
                            border: '1.5px solid rgba(0,212,170,0.28)',
                            borderRadius: 14, padding: '18px 18px', textAlign: 'left',
                            color: 'var(--txt)', cursor: 'pointer', width: '100%',
                        }, children: [_jsx("div", { style: { fontSize: 28, marginBottom: 8 }, children: "\uD83D\uDCDA" }), _jsx("div", { style: { fontWeight: 800, fontSize: 16, marginBottom: 4 }, children: "Alohida fanlar bo'yicha" }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }, children: ["Istagan fan(lar)ni o'zingiz tanlang, 1 ta ham bo'ladi", _jsx("br", {}), _jsx("span", { style: { color: 'var(--g)', fontWeight: 700 }, children: "Erkin tanlash \u00B7 o'z tempingizda" })] }), _jsx("div", { style: { marginTop: 12, display: 'flex', gap: 6 }, children: ['1 yoki ko\'p fan', 'Savollar soni', 'Vaqt — auto'].map(t => (_jsx("span", { style: {
                                        background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)',
                                        borderRadius: 100, padding: '3px 10px', fontSize: 10, color: 'var(--g)', fontWeight: 700,
                                    }, children: t }, t))) })] })] }), _jsx("div", { style: { padding: '12px 20px 20px' }, children: _jsxs("button", { onClick: onHistory, style: {
                        width: '100%', background: 'var(--s1)', border: '1px solid var(--f)',
                        borderRadius: 12, padding: '14px 16px', display: 'flex',
                        alignItems: 'center', gap: 12, cursor: 'pointer', color: 'var(--txt)',
                    }, children: [_jsx("span", { style: { fontSize: 24 }, children: "\uD83D\uDCC1" }), _jsxs("div", { style: { textAlign: 'left' }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: "Testlar tarixi" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Oldingi testlarni ko'ring, xatolarni tahlil qiling" })] }), _jsx("span", { style: { marginLeft: 'auto', color: 'var(--txt-3)', fontSize: 18 }, children: "\u203A" })] }) })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// DtmSetup
// ═══════════════════════════════════════════════════════════════════════════
function DtmSetup({ directions, onStart, onBack }) {
    const [selected, setSelected] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const dir = directions.find((d) => d.id === selected);
    const handleStart = async () => {
        if (!selected) {
            toast("Yo'nalishni tanlang", 'err');
            return;
        }
        setLoading(true);
        try {
            await onStart(selected);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: onBack, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsx("div", { style: { fontWeight: 700, fontSize: 15 }, children: "DTM Testi" }), _jsx("div", { style: { width: 70 } })] }), _jsx("div", { style: { padding: '4px 20px 8px' }, children: _jsx("div", { style: {
                        background: 'rgba(123,104,238,0.07)', border: '1px solid rgba(123,104,238,0.18)',
                        borderRadius: 10, padding: '10px 14px', fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.6,
                    }, children: "\uD83D\uDD22 Ball formula: (Majburiy\u00D71.1) + (Mutax.1\u00D73.1) + (Mutax.2\u00D72.1) = maks. 189" }) }), _jsx("div", { className: "section-title", children: "Yo'nalishni tanlang" }), _jsxs("div", { style: { padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }, children: [directions.map((d) => (_jsxs("button", { onClick: () => setSelected(d.id), style: {
                            padding: '12px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                            background: selected === d.id ? 'rgba(123,104,238,0.18)' : 'var(--s1)',
                            border: `1.5px solid ${selected === d.id ? 'rgba(123,104,238,0.5)' : 'var(--f)'}`,
                            color: 'var(--txt)', width: '100%',
                        }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: d.name }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }, children: [d.spec1Name, " (3.1) \u00B7 ", d.spec2Name, " (2.1)"] })] }, d.id))), directions.length === 0 && (_jsx("div", { style: { color: 'var(--txt-3)', fontSize: 13, textAlign: 'center', padding: 20 }, children: "Yuklanmoqda..." }))] }), dir && (_jsx("div", { style: { padding: '10px 20px 0' }, children: _jsxs("div", { style: {
                        background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
                        borderRadius: 10, padding: '10px 14px',
                    }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 6 }, children: "Tanlangan yo'nalish:" }), _jsx("div", { style: { fontSize: 13, fontWeight: 700 }, children: dir.name }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }, children: ["Majburiy: Ona tili, Matematika, Tarix (10\u00D71.1 = 33 ball)", _jsx("br", {}), dir.spec1Name, " 30\u00D73.1 = 93 ball \u00B7 ", dir.spec2Name, " 30\u00D72.1 = 63 ball"] })] }) })), _jsx("div", { style: { padding: '14px 20px' }, children: _jsx("button", { onClick: handleStart, disabled: !selected || loading, className: "btn btn-primary btn-block btn-lg", children: loading ? '⏳ Yuklanmoqda...' : '🚀 Testni boshlash' }) })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// SubjectSetup
// ═══════════════════════════════════════════════════════════════════════════
function SubjectSetup({ subjects, onStart, onBack }) {
    const [selected, setSelected] = useState([]);
    const [advanced, setAdvanced] = useState(false);
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const majburiy = subjects.filter((s) => s.block === 'majburiy');
    const mutax = subjects.filter((s) => s.block !== 'majburiy');
    const toggle = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };
    const getCount = (s) => counts[s.id] ?? s.defaultCount;
    const totalQ = selected.reduce((sum, id) => {
        const s = subjects.find((x) => x.id === id);
        return sum + (s ? getCount(s) : 0);
    }, 0);
    const handleStart = async () => {
        if (selected.length === 0) {
            toast("Kamida 1 ta fan tanlang", 'err');
            return;
        }
        setLoading(true);
        try {
            const adv = advanced && Object.keys(counts).length > 0
                ? { questionCounts: counts }
                : undefined;
            await onStart(selected, adv);
        }
        finally {
            setLoading(false);
        }
    };
    const SubjectChip = ({ s }) => {
        const isSelected = selected.includes(s.id);
        return (_jsxs("button", { onClick: () => toggle(s.id), style: {
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                background: isSelected ? 'rgba(0,212,170,0.14)' : 'var(--s1)',
                border: `1.5px solid ${isSelected ? 'rgba(0,212,170,0.4)' : 'var(--f)'}`,
                color: 'var(--txt)', textAlign: 'left', width: '100%',
            }, children: [_jsx("span", { style: { fontSize: 18 }, children: SUBJECT_EMOJI[s.id] || '📘' }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 700 }, children: s.name }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: [s.defaultCount, " savol \u00B7 ", s.weight, " ball"] })] }), isSelected && (_jsx("span", { style: { color: 'var(--g)', fontSize: 16, fontWeight: 800 }, children: "\u2713" }))] }));
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: onBack, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsx("div", { style: { fontWeight: 700, fontSize: 15 }, children: "Fanlar tanlash" }), _jsxs("div", { style: { fontSize: 12, color: 'var(--g)', fontWeight: 700 }, children: [selected.length, " ta"] })] }), _jsxs("div", { style: { padding: '0 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }, children: [_jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 10, paddingTop: 4 }, children: "\uD83D\uDCCC Majburiy fanlar" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }, children: majburiy.map((s) => _jsx(SubjectChip, { s: s }, s.id)) }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 10 }, children: "\uD83C\uDFAF Mutaxassislik fanlari" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }, children: mutax.map((s) => _jsx(SubjectChip, { s: s }, s.id)) }), _jsxs("button", { onClick: () => setAdvanced(a => !a), style: {
                            width: '100%', padding: '10px 14px', borderRadius: 10,
                            background: 'var(--s2)', border: '1px solid var(--f)',
                            color: 'var(--txt-2)', fontSize: 12, cursor: 'pointer', textAlign: 'left',
                        }, children: ["\u2699\uFE0F Qo'shimcha sozlamalar ", advanced ? '▲' : '▼'] }), advanced && selected.length > 0 && (_jsxs("div", { style: {
                            background: 'var(--s1)', border: '1px solid var(--f)',
                            borderRadius: 10, padding: 14, marginTop: 8,
                        }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 8 }, children: "Har fan uchun savol soni (1\u201350):" }), selected.map(id => {
                                const s = subjects.find((x) => x.id === id);
                                if (!s)
                                    return null;
                                return (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }, children: [_jsxs("span", { style: { flex: 1, fontSize: 12, fontWeight: 600 }, children: [SUBJECT_EMOJI[id], " ", s.name] }), _jsx("input", { type: "number", min: 1, max: 50, value: getCount(s), onChange: e => setCounts(c => ({ ...c, [id]: Math.min(50, Math.max(1, parseInt(e.target.value) || s.defaultCount)) })), style: {
                                                width: 56, padding: '5px 8px', borderRadius: 8,
                                                background: 'var(--s2)', border: '1px solid var(--f)',
                                                color: 'var(--txt)', fontSize: 13, textAlign: 'center',
                                            } })] }, id));
                            })] })), selected.length > 0 && (_jsxs("div", { style: {
                            background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
                            borderRadius: 10, padding: '10px 14px', marginTop: 10,
                        }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 4 }, children: "Testingiz:" }), _jsxs("div", { style: { fontSize: 12, fontWeight: 700, color: 'var(--g)' }, children: [totalQ, " ta savol \u00B7 ~", Math.round(totalQ * 2), " daqiqa"] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }, children: selected.map(id => subjects.find((x) => x.id === id)?.name).join(', ') })] })), _jsx("div", { style: { height: 16 } })] }), _jsx("div", { style: { padding: '10px 20px 16px' }, children: _jsx("button", { onClick: handleStart, disabled: selected.length === 0 || loading, className: "btn btn-primary btn-block btn-lg", children: loading ? '⏳ Yuklanmoqda...' : `🚀 Boshlash (${totalQ} savol)` }) })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// QuizScreen
// ═══════════════════════════════════════════════════════════════════════════
function QuizScreen({ sessionData, onFinish, onExit, onSubOpen }) {
    const { sessionId, questions, durationSeconds, subjectBreakdown, mode, offline } = sessionData;
    const [qIdx, setQIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null);
    const [hint, setHint] = useState(null);
    const [hintLoading, setHintLoading] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [offlineAnswers, setOfflineAnswers] = useState({});
    const timerRef = useRef(null);
    const { user } = useAppStore();
    const { toast } = useToast();
    const handleFinish = useCallback(async () => {
        if (finishing)
            return;
        setFinishing(true);
        if (timerRef.current)
            clearInterval(timerRef.current);
        if (offline) {
            const offlineResult = calculateOfflineResult(sessionData, offlineAnswers);
            enqueueOfflineResult({
                gameType: sessionData.mode === 'dtm' ? 'dtm' : 'subject',
                subject: sessionData.mode === 'subject'
                    ? (sessionData.subjectBreakdown?.map((item) => item.subjectId).join(',') || undefined)
                    : undefined,
                direction: sessionData.direction,
                ballAmount: Math.round(offlineResult.totalScore),
                maxBall: Math.round(offlineResult.maxTotalScore),
                correctCount: Object.values(offlineAnswers).filter(item => item.isCorrect).length,
                totalQuestions: questions.length,
            });
            onFinish(offlineResult);
            return;
        }
        try {
            const { data } = await examApi.finish(sessionId);
            onFinish(data);
        }
        catch (e) {
            toast(e.response?.data?.error || 'Xato', 'err');
            setFinishing(false);
        }
    }, [finishing, sessionId, onFinish, toast]);
    // Taymer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleFinish();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current)
            clearInterval(timerRef.current); };
    }, [handleFinish]);
    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0)
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    const q = questions[qIdx];
    const totalQ = questions.length;
    const selectAnswer = async (idx) => {
        if (selected !== null)
            return;
        setSelected(idx);
        if (offline) {
            const isCorrect = idx === q.answer;
            const offlineResponse = {
                isCorrect,
                correctIndex: q.answer,
                explanation: q.explanation || '',
            };
            setResult(offlineResponse);
            setAnswers(prev => ({ ...prev, [q._id]: { selected: idx, isCorrect, correctIndex: q.answer, explanation: q.explanation || '' } }));
            setOfflineAnswers(prev => ({ ...prev, [q._id]: { selected: idx, isCorrect } }));
            if (!isCorrect && q.explanation)
                setHint(q.explanation);
            return;
        }
        try {
            const { data } = await examApi.answer(sessionId, q._id, idx);
            setResult(data);
            setAnswers(prev => ({ ...prev, [q._id]: { selected: idx, isCorrect: data.isCorrect, correctIndex: data.correctIndex, explanation: data.explanation } }));
            if (!data.isCorrect && data.explanation)
                setHint(data.explanation);
        }
        catch (e) {
            toast(e.response?.data?.error || 'Xato', 'err');
        }
    };
    const askHint = async () => {
        setHintLoading(true);
        try {
            const { data } = await aiApi.hint(q.question, q.options, q.subject, 'hint');
            setHint(data.hint);
        }
        catch (e) {
            if (e.response?.data?.code === 'DAILY_LIMIT_REACHED' || e.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
                toast('Bugungi AI limit tugadi. Obuna oling!', 'err');
                onSubOpen();
            }
            else {
                toast(e.response?.data?.error || 'AI xato', 'err');
            }
        }
        finally {
            setHintLoading(false);
        }
    };
    const nextQ = () => {
        setSelected(null);
        setResult(null);
        setHint(null);
        setQIdx(i => i + 1);
    };
    // Joriy fan nomi
    const currentSubjectName = q?.subjectName
        || subjectBreakdown?.find((s) => s.subjectId === q?.subject)?.subjectName
        || q?.subject || '';
    const hintsUsed = user?.aiUsage?.hints ?? 0;
    const hintsLimit = user?.aiLimits?.hints ?? 5;
    const canHint = hintsLimit === null || hintsUsed < hintsLimit;
    const pct = Math.round((qIdx / totalQ) * 100);
    const timeWarning = timeLeft < 300; // 5 daqiqa
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }, children: [_jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => { if (window.confirm('Testdan chiqasizmi? Natija saqlanmaydi.'))
                            onExit(); }, children: "\u2190 Chiqish" }), _jsxs("div", { style: { flex: 1, textAlign: 'center' }, children: [_jsxs("span", { style: { fontSize: 11, fontWeight: 700, color: 'var(--txt-2)' }, children: [qIdx + 1, " / ", totalQ] }), currentSubjectName && (_jsxs("span", { style: { fontSize: 10, color: 'var(--txt-3)', marginLeft: 6 }, children: ["\u00B7 ", currentSubjectName] }))] }), _jsxs("div", { style: {
                            fontSize: 12, fontWeight: 700,
                            color: timeWarning ? 'var(--r)' : 'var(--txt-2)',
                            fontVariantNumeric: 'tabular-nums',
                        }, children: ["\u23F1 ", formatTime(timeLeft)] })] }), _jsx("div", { style: { height: 4, background: 'var(--s2)', borderRadius: 100, marginBottom: 14 }, children: _jsx("div", { style: {
                        height: '100%', background: 'var(--acc)',
                        width: `${pct}%`, borderRadius: 100, transition: 'width 0.3s',
                    } }) }), _jsx("div", { className: "card", style: { marginBottom: 10, flex: '0 0 auto' }, children: _jsx("div", { style: { fontSize: 13, lineHeight: 1.65, fontWeight: 500, whiteSpace: 'pre-wrap' }, children: q.question }) }), !hint && selected === null && (_jsx("button", { disabled: hintLoading, onClick: canHint ? askHint : onSubOpen, style: {
                    padding: '9px 12px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                    background: canHint ? 'rgba(0,212,170,0.08)' : 'rgba(255,95,126,0.06)',
                    border: `1px solid ${canHint ? 'rgba(0,212,170,0.25)' : 'rgba(255,95,126,0.2)'}`,
                    color: canHint ? 'var(--g)' : 'var(--txt-2)',
                    fontSize: 12, fontWeight: 700,
                }, children: hintLoading ? '⏳ Yuklanmoqda...' : canHint ? '💡 AI maslahat' : '💡 Limit tugadi · Obuna ↗' })), hint && (_jsx("div", { style: {
                    background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 1.6, marginBottom: 10, color: 'var(--txt)',
                }, children: hint })), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }, children: q.options.map((opt, i) => {
                    let bg = 'var(--s2)', border = 'var(--f)';
                    if (selected !== null) {
                        if (i === result?.correctIndex) {
                            bg = 'rgba(0,212,170,0.1)';
                            border = 'var(--g)';
                        }
                        else if (i === selected) {
                            bg = 'rgba(255,95,126,0.08)';
                            border = 'var(--r)';
                        }
                    }
                    return (_jsxs("button", { disabled: selected !== null, onClick: () => selectAnswer(i), style: {
                            padding: '11px 14px', background: bg,
                            border: `1.5px solid ${border}`,
                            borderRadius: 10, textAlign: 'left', fontSize: 13, lineHeight: 1.5,
                            color: 'var(--txt)', cursor: selected !== null ? 'default' : 'pointer',
                            transition: 'all 0.15s',
                        }, children: [_jsx("span", { style: { fontWeight: 800, color: 'var(--txt-3)', marginRight: 10 }, children: ['A', 'B', 'C', 'D'][i] }), opt] }, i));
                }) }), selected !== null && (qIdx + 1 >= totalQ ? (_jsx("button", { onClick: handleFinish, disabled: finishing, className: "btn btn-primary btn-block btn-lg", style: { marginTop: 14 }, children: finishing ? '⏳ Saqlanmoqda...' : '🏁 Natijani ko\'rish' })) : (_jsx("button", { onClick: nextQ, className: "btn btn-primary btn-block btn-lg", style: { marginTop: 14 }, children: "Keyingi savol \u2192" })))] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// ResultScreen
// ═══════════════════════════════════════════════════════════════════════════
function ResultScreen({ result, onBack, onHistory, onReview }) {
    const { totalScore, maxTotalScore, percent, subjectBreakdown, mode, xp } = result;
    const certificate = result.certificate || null;
    const emoji = percent >= 80 ? '🏆' : percent >= 60 ? '👏' : percent >= 40 ? '💪' : '📖';
    const grade = percent >= 90 ? "A'lo" : percent >= 75 ? 'Yaxshi' : percent >= 50 ? "O'rtacha" : "Yana o'qing";
    const downloadCertificate = async (format) => {
        if (!certificate)
            return;
        const url = format === 'pdf' ? certificate.pdfUrl : certificate.pngUrl;
        const auth = getStoredAuth();
        const response = await fetch(url, {
            headers: auth?.access ? { Authorization: `Bearer ${auth.access}` } : {},
        });
        if (!response.ok)
            throw new Error('Sertifikat yuklab olinmadi');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = `fikra-mandat-${certificate.certificateNumber}.${format}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }) }), _jsxs("div", { style: { padding: '8px 20px 20px' }, children: [_jsxs("div", { style: {
                            background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(0,212,170,0.08))',
                            border: '1px solid rgba(123,104,238,0.25)', borderRadius: 16,
                            padding: 20, textAlign: 'center', marginBottom: 16,
                        }, children: [_jsx("div", { style: { fontSize: 52, marginBottom: 6 }, children: emoji }), _jsx("div", { style: { fontSize: 42, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }, children: totalScore.toFixed(1) }), _jsxs("div", { style: { fontSize: 13, color: 'var(--txt-2)', marginTop: 4 }, children: ["/ ", maxTotalScore.toFixed(1), " ball \u00B7 ", percent, "%"] }), _jsx("div", { style: {
                                    display: 'inline-block', marginTop: 8,
                                    background: 'rgba(123,104,238,0.15)', border: '1px solid rgba(123,104,238,0.3)',
                                    borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: 'var(--acc-l)',
                                }, children: grade }), result.directionName && (_jsxs("div", { style: { marginTop: 8, fontSize: 12, color: 'var(--txt-2)', fontWeight: 600 }, children: ["\uD83C\uDFAF ", result.directionName] })), xp && (_jsxs("div", { style: { marginTop: 12, fontSize: 12, color: 'var(--y)' }, children: ["\u26A1 +", xp.added, " XP qo'shildi", xp.levelUp ? ' · 🎉 Yangi daraja!' : ''] }))] }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 8, fontWeight: 700 }, children: "Fan bo'yicha natijalar:" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }, children: subjectBreakdown.map((s) => {
                            const subPct = s.maxScore > 0 ? Math.round(s.score / s.maxScore * 100) : 0;
                            return (_jsxs("div", { style: {
                                    background: 'var(--s1)', border: '1px solid var(--f)',
                                    borderRadius: 10, padding: '10px 14px',
                                }, children: [_jsx("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, children: _jsxs("span", { style: { fontSize: 13, fontWeight: 700 }, children: [SUBJECT_EMOJI[s.subjectId] || '📘', " ", s.subjectName] }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }, children: [_jsxs("div", { style: { padding: '8px', background: 'rgba(0,212,170,0.08)', borderRadius: 8, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginBottom: 2 }, children: "Savol" }), _jsxs("div", { style: { fontSize: 14, fontWeight: 800, color: 'var(--acc-l)' }, children: [s.correct, "/", s.questionCount] })] }), _jsxs("div", { style: { padding: '8px', background: 'rgba(123,104,238,0.08)', borderRadius: 8, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginBottom: 2 }, children: "Ball" }), _jsxs("div", { style: { fontSize: 14, fontWeight: 800, color: subPct >= 70 ? 'var(--g)' : subPct >= 50 ? 'var(--y)' : 'var(--r)' }, children: [s.score.toFixed(1), "/", s.maxScore.toFixed(1)] })] })] }), _jsx("div", { style: { height: 5, background: 'var(--s3)', borderRadius: 100, marginBottom: 6 }, children: _jsx("div", { style: {
                                                height: '100%', borderRadius: 100,
                                                width: `${subPct}%`,
                                                background: subPct >= 70 ? 'var(--g)' : subPct >= 50 ? 'var(--y)' : 'var(--r)',
                                                transition: 'width 0.5s',
                                            } }) }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: ["\u2713 ", s.correct, " to'g'ri \u00B7 \u2717 ", s.wrong, " xato \u00B7 ", subPct, "%"] })] }, s.subjectId));
                        }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 8 }, children: [_jsx("button", { onClick: onReview, className: "btn btn-primary btn-block", children: "\uD83D\uDD0D Xatolarni ko'rish" }), certificate && (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: [_jsx("button", { onClick: () => downloadCertificate('pdf').catch(() => { }), className: "btn btn-ghost btn-block", children: "\uD83D\uDCC4 PDF Manda" }), _jsx("button", { onClick: () => downloadCertificate('png').catch(() => { }), className: "btn btn-ghost btn-block", children: "\uD83D\uDDBC PNG Manda" })] })), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: onHistory, className: "btn btn-ghost btn-block", children: "\uD83D\uDCC1 Tarix" }), _jsx("button", { onClick: onBack, className: "btn btn-ghost btn-block", children: "\uD83C\uDFE0 Bosh sahifa" })] })] })] })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// HistoryScreen
// ═══════════════════════════════════════════════════════════════════════════
function HistoryScreen({ mode, onModeChange, onBack, onReview }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const { toast } = useToast();
    useEffect(() => {
        setLoading(true);
        setItems([]);
        setPage(1);
        examApi.history(mode, 1)
            .then(r => { setItems(r.data.items); setPages(r.data.pages); })
            .catch(() => toast('Tarix yuklanmadi', 'err'))
            .finally(() => setLoading(false));
    }, [mode]);
    const loadMore = () => {
        const next = page + 1;
        examApi.history(mode, next)
            .then(r => { setItems(prev => [...prev, ...r.data.items]); setPage(next); })
            .catch(() => { });
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: onBack, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsx("div", { style: { fontWeight: 700, fontSize: 15 }, children: "Testlar tarixi" }), _jsx("div", { style: { width: 70 } })] }), _jsx("div", { style: { padding: '0 20px 12px', display: 'flex', gap: 8 }, children: ['dtm', 'subject'].map(m => (_jsx("button", { onClick: () => onModeChange(m), style: {
                        flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                        background: mode === m ? 'var(--acc)' : 'var(--s2)',
                        color: mode === m ? 'white' : 'var(--txt-2)',
                        border: `1px solid ${mode === m ? 'var(--acc)' : 'var(--f)'}`,
                    }, children: m === 'dtm' ? '🎯 DTM' : '📚 Alohida fanlar' }, m))) }), _jsxs("div", { style: { padding: '0 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }, children: [loading && (_jsx("div", { style: { textAlign: 'center', color: 'var(--txt-3)', padding: 40 }, children: "Yuklanmoqda..." })), !loading && items.length === 0 && (_jsxs("div", { style: {
                            textAlign: 'center', padding: '40px 20px',
                            background: 'var(--s1)', borderRadius: 14, border: '1px solid var(--f)',
                        }, children: [_jsx("div", { style: { fontSize: 40, marginBottom: 10 }, children: "\uD83D\uDCED" }), _jsx("div", { style: { fontWeight: 700, marginBottom: 4 }, children: "Tarix bo'sh" }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)' }, children: mode === 'dtm' ? "DTM testi o'ting, natijalar bu yerda ko'rinadi" : "Alohida fanlar bo'yicha test o'ting" })] })), items.map((item) => {
                        const date = new Date(item.createdAt);
                        const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
                        const pct = item.maxTotalScore > 0 ? Math.round(item.totalScore / item.maxTotalScore * 100) : 0;
                        const subjects = item.subjectBreakdown?.map((s) => s.subjectName).join(', ');
                        return (_jsxs("div", { onClick: () => onReview(item._id), style: {
                                background: 'var(--s1)', border: '1px solid var(--f)',
                                borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
                            }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 }, children: [_jsx("span", { style: { fontSize: 11, color: 'var(--txt-3)' }, children: dateStr }), _jsxs("span", { style: {
                                                fontSize: 13, fontWeight: 800,
                                                color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                                            }, children: [item.totalScore.toFixed(1), " ball \u00B7 ", pct, "%"] })] }), mode === 'dtm' && item.direction && (_jsxs("div", { style: { fontSize: 13, fontWeight: 700, marginBottom: 3 }, children: ["\uD83C\uDFAF ", item.subjectBreakdown?.find((s) => s.block === 'mutaxassislik_1')?.subjectId
                                            ? (() => {
                                                const dirNames = {
                                                    tibbiyot: 'Tibbiyot', it: 'IT / Dasturlash', iqtisodiyot: 'Iqtisodiyot',
                                                    pedagogika: 'Pedagogika', arxitektura: 'Arxitektura', jurnalistika: 'Jurnalistika',
                                                    rus_filologiya: 'Rus filologiyasi', kimyo_fan: 'Kimyo fani',
                                                    fizika_fan: 'Fizika fani', ingliz_filol: 'Ingliz filologiyasi',
                                                    biologiya_fan: 'Biologiya fani',
                                                };
                                                return dirNames[item.direction] || item.direction;
                                            })()
                                            : item.direction] })), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: subjects }), _jsx("div", { style: { height: 4, background: 'var(--s3)', borderRadius: 100, marginTop: 8 }, children: _jsx("div", { style: {
                                            height: '100%', borderRadius: 100, width: `${pct}%`,
                                            background: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                                        } }) })] }, item._id));
                    }), page < pages && (_jsx("button", { onClick: loadMore, style: {
                            width: '100%', padding: 12, background: 'var(--s2)',
                            border: '1px solid var(--f)', borderRadius: 10, color: 'var(--txt-2)',
                            fontSize: 12, cursor: 'pointer', marginTop: 4, marginBottom: 16,
                        }, children: "Yana ko'rish \u2193" }))] })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// ReviewScreen — sessiya ichki ko'rish
// ═══════════════════════════════════════════════════════════════════════════
function ReviewScreen({ sessionId, onBack, onSubOpen }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterSubject, setFilterSubject] = useState('all');
    const [filterCorrect, setFilterCorrect] = useState('all');
    const { toast } = useToast();
    useEffect(() => {
        examApi.review(sessionId)
            .then(r => setData(r.data))
            .catch(() => toast('Yuklanmadi', 'err'))
            .finally(() => setLoading(false));
    }, [sessionId]);
    if (loading) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: onBack, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsx("div", { style: { fontWeight: 700, fontSize: 15 }, children: "Ko'rish" }), _jsx("div", { style: { width: 70 } })] }), _jsx("div", { style: { textAlign: 'center', color: 'var(--txt-3)', padding: 40 }, children: "Yuklanmoqda..." })] }));
    }
    if (!data)
        return null;
    const { session, answers } = data;
    const subjects = [...new Set(answers.map((a) => a.subjectId).filter(Boolean))];
    const filtered = answers.filter((a) => {
        if (filterSubject !== 'all' && a.subjectId !== filterSubject)
            return false;
        if (filterCorrect === 'correct' && !a.isCorrect)
            return false;
        if (filterCorrect === 'wrong' && a.isCorrect)
            return false;
        return true;
    });
    const subjectNames = {};
    answers.forEach((a) => { if (a.subjectId && a.subject)
        subjectNames[a.subjectId] = a.subject; });
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: onBack, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsx("div", { style: { fontWeight: 700, fontSize: 15 }, children: "Xatolar tahlili" }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)' }, children: [answers.filter((a) => a.isCorrect).length, "/", answers.length] })] }), _jsxs("div", { style: { padding: '0 20px 10px', display: 'flex', gap: 6, overflowX: 'auto' }, children: [['all', 'correct', 'wrong'].map(f => (_jsx("button", { onClick: () => setFilterCorrect(f), style: {
                            padding: '7px 12px', borderRadius: 100, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            background: filterCorrect === f ? (f === 'correct' ? 'rgba(0,212,170,0.15)' : f === 'wrong' ? 'rgba(255,95,126,0.12)' : 'var(--acc)') : 'var(--s2)',
                            color: filterCorrect === f ? (f === 'correct' ? 'var(--g)' : f === 'wrong' ? 'var(--r)' : 'white') : 'var(--txt-2)',
                            border: `1px solid ${filterCorrect === f ? 'transparent' : 'var(--f)'}`,
                            whiteSpace: 'nowrap',
                        }, children: f === 'all' ? '📋 Hammasi' : f === 'correct' ? '✓ To\'g\'ri' : '✗ Xato' }, f))), subjects.map(sid => (_jsxs("button", { onClick: () => setFilterSubject(filterSubject === sid ? 'all' : sid), style: {
                            padding: '7px 12px', borderRadius: 100, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                            background: filterSubject === sid ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
                            color: filterSubject === sid ? 'var(--acc-l)' : 'var(--txt-2)',
                            border: `1px solid ${filterSubject === sid ? 'rgba(123,104,238,0.3)' : 'var(--f)'}`,
                            whiteSpace: 'nowrap',
                        }, children: [SUBJECT_EMOJI[sid] || '📘', " ", answers.find((a) => a.subjectId === sid)?.subjectName || sid] }, sid)))] }), _jsxs("div", { style: { padding: '0 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }, children: [filtered.map((a, i) => (_jsx(AnswerCard, { answer: a, onSubOpen: onSubOpen }, a.questionId || i))), filtered.length === 0 && (_jsx("div", { style: { textAlign: 'center', color: 'var(--txt-3)', padding: 30, fontSize: 13 }, children: "Savollar topilmadi" })), _jsx("div", { style: { height: 16 } })] })] }));
}
function AnswerCard({ answer, onSubOpen }) {
    const [expanded, setExpanded] = useState(!answer.isCorrect);
    const [aiHint, setAiHint] = useState(answer.explanation || null);
    const [loading, setLoading] = useState(false);
    const { user } = useAppStore();
    const { toast } = useToast();
    const askAi = async () => {
        setLoading(true);
        try {
            const { data } = await aiApi.hint(answer.question, answer.options, answer.subject || answer.subjectId, 'explain');
            setAiHint(data.hint);
        }
        catch (e) {
            if (e.response?.data?.code === 'DAILY_LIMIT_REACHED' || e.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
                toast('AI limit tugadi. Obuna oling!', 'err');
                onSubOpen();
            }
            else {
                toast('AI xato', 'err');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: {
            background: answer.isCorrect ? 'rgba(0,212,170,0.05)' : 'rgba(255,95,126,0.05)',
            border: `1px solid ${answer.isCorrect ? 'rgba(0,212,170,0.2)' : 'rgba(255,95,126,0.2)'}`,
            borderRadius: 12, marginBottom: 8, overflow: 'hidden',
        }, children: [_jsxs("div", { onClick: () => setExpanded(e => !e), style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }, children: [_jsx("span", { style: {
                            fontSize: 16, flexShrink: 0, marginTop: 1,
                            color: answer.isCorrect ? 'var(--g)' : 'var(--r)',
                        }, children: answer.isCorrect ? '✓' : '✗' }), _jsx("div", { style: { fontSize: 12, lineHeight: 1.5, flex: 1 }, children: answer.question }), _jsx("span", { style: { color: 'var(--txt-3)', fontSize: 14 }, children: expanded ? '▲' : '▼' })] }), expanded && (_jsxs("div", { style: { padding: '0 14px 12px' }, children: [answer.options?.map((opt, i) => {
                        let color = 'var(--txt-3)';
                        let icon = '';
                        if (i === answer.correctIndex) {
                            color = 'var(--g)';
                            icon = '✓ ';
                        }
                        else if (i === answer.selectedOption && !answer.isCorrect) {
                            color = 'var(--r)';
                            icon = '✗ ';
                        }
                        return (_jsxs("div", { style: { fontSize: 12, color, marginBottom: 4, lineHeight: 1.5 }, children: [icon, _jsxs("span", { style: { fontWeight: 700 }, children: [['A', 'B', 'C', 'D'][i], ")"] }), " ", opt] }, i));
                    }), aiHint && (_jsx("div", { style: {
                            background: 'rgba(123,104,238,0.08)', border: '1px solid rgba(123,104,238,0.2)',
                            borderRadius: 8, padding: 10, marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--txt)',
                        }, children: aiHint })), !aiHint && !answer.isCorrect && (_jsx("button", { onClick: askAi, disabled: loading, style: {
                            marginTop: 8, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                            background: 'rgba(123,104,238,0.1)', border: '1px solid rgba(123,104,238,0.25)',
                            color: 'var(--acc-l)', fontSize: 11, fontWeight: 700,
                        }, children: loading ? '⏳...' : '🤖 AI tushuntirish' }))] }))] }));
}
