import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import SubscriptionModal from '../components/SubscriptionModal';
const SUBJECT_EMOJI = {
    uztil: '🔤', math: '➕', tarix: '🏛️', bio: '🧬', kimyo: '⚗️',
    fizika: '⚛️', ingliz: '🇬🇧', inform: '💻', iqtisod: '💰', rus: '🇷🇺',
    geo: '🌍', adab: '📖',
};
// ─── Asosiy komponent ──────────────────────────────────────────────────────
export default function CabinetPage() {
    const navigate = useNavigate();
    const [screen, setScreen] = useState('home');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filterSubject, setFilterSubject] = useState(null);
    const [activeAnswer, setActiveAnswer] = useState(null);
    const [subOpen, setSubOpen] = useState(false);
    const { toast } = useToast();
    const loadCabinet = useCallback(async (subject) => {
        setLoading(true);
        try {
            const { data } = await examApi.cabinet(subject || undefined);
            setData(data);
        }
        catch (e) {
            toast(e.response?.data?.error || 'Yuklanmadi', 'err');
        }
        finally {
            setLoading(false);
        }
    }, [toast]);
    useEffect(() => {
        loadCabinet(filterSubject);
    }, [filterSubject, loadCabinet]);
    // ─── Mini-test boshlash ──────────────────────────────────────────────
    const startMiniTest = async (subject) => {
        try {
            const { data } = await examApi.cabinetMiniTest(subject || undefined, 10);
            // Test sahifasiga sessionData bilan navigate
            // localStorage orqali sessiyani yuborish (router state alternativasi)
            localStorage.setItem('fikra_cabinet_session', JSON.stringify(data));
            navigate('/test/cabinet-quiz');
        }
        catch (e) {
            toast(e.response?.data?.error || 'Mini-test yaratib bo\'lmadi', 'err');
        }
    };
    if (loading) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsx("div", { style: { fontSize: 13, color: 'var(--txt-2)' }, children: "Kabinet" })] }), _jsxs("div", { style: { padding: 40, textAlign: 'center' }, children: [_jsx("div", { className: "spin", style: { margin: '0 auto' } }), _jsx("div", { style: { marginTop: 12, fontSize: 12, color: 'var(--txt-3)' }, children: "Tahlil qilinmoqda..." })] })] }));
    }
    if (!data || data.empty) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsx("div", { style: { fontSize: 13, color: 'var(--txt-2)' }, children: "AI Kabinet" })] }), _jsxs("div", { style: { padding: '60px 24px', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 56, marginBottom: 16 }, children: "\uD83C\uDF93" }), _jsx("div", { style: { fontSize: 17, fontWeight: 800, marginBottom: 10 }, children: "Kabinet hali bo'sh" }), _jsx("div", { style: { fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }, children: "Bu yerda DTM testlaridagi xato qilgan savollaringiz to'planadi va AI orqali tahlil qilinadi. Birinchi DTM testini o'tib ko'ring!" }), _jsx("button", { onClick: () => navigate('/test'), className: "btn btn-primary btn-lg", children: "\uD83C\uDFAF DTM testini boshlash \u2192" })] })] }));
    }
    // ─── Wrong answer detail ─────────────────────────────────────────────
    if (screen === 'wrong_detail' && activeAnswer) {
        return (_jsx(WrongAnswerDetail, { answer: activeAnswer, onBack: () => { setActiveAnswer(null); setScreen(filterSubject ? 'subject_view' : 'home'); }, onSubOpen: () => setSubOpen(true) }));
    }
    if (screen === 'analysis') {
        return (_jsxs(_Fragment, { children: [_jsx(AnalysisScreen, { stats: data.stats, onBack: () => setScreen('home'), onMiniTest: () => startMiniTest() }), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
    }
    if (screen === 'subject_view' && filterSubject) {
        const subjectName = data.stats.bySubject.find(s => s.subjectId === filterSubject)?.subjectName || filterSubject;
        const wrongs = data.wrongAnswers || [];
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: () => { setFilterSubject(null); setScreen('home'); }, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsxs("div", { style: { fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { children: SUBJECT_EMOJI[filterSubject] || '📘' }), _jsx("span", { children: subjectName })] }), _jsx("div", { style: { width: 70 } })] }), _jsx("div", { style: { padding: '8px 16px 12px' }, children: _jsxs("div", { style: {
                            background: 'rgba(255,95,126,0.08)', border: '1px solid rgba(255,95,126,0.2)',
                            borderRadius: 12, padding: '14px 16px',
                        }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 4 }, children: "Bu fanda xato qilingan savollar:" }), _jsxs("div", { style: { fontSize: 22, fontWeight: 800, color: 'var(--r)' }, children: [wrongs.length, " ta"] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }, children: "Har biriga bosib AI tushuntirish oling" })] }) }), _jsx("div", { style: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }, children: wrongs.length === 0 ? (_jsx("div", { className: "empty", children: "\u2728 Bu fanda xato qilingan savollar yo'q. Ajoyib!" })) : (wrongs.map((w, i) => (_jsxs("button", { onClick: () => { setActiveAnswer(w); setScreen('wrong_detail'); }, style: {
                            background: 'var(--s1)', border: '1px solid var(--f)',
                            borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                            color: 'var(--txt)', cursor: 'pointer', display: 'flex', gap: 10,
                            alignItems: 'flex-start',
                        }, children: [_jsx("span", { style: {
                                    width: 24, height: 24, borderRadius: 6, background: 'rgba(255,95,126,0.15)',
                                    color: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 800, flexShrink: 0,
                                }, children: i + 1 }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                            fontSize: 12, lineHeight: 1.5, color: 'var(--txt)',
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }, children: w.questionText }), _jsxs("div", { style: { display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }, children: [_jsxs("span", { style: { fontSize: 10, color: 'var(--r)', fontWeight: 700 }, children: ["\u2717 Siz: ", ['A', 'B', 'C', 'D'][w.selectedOption]] }), _jsxs("span", { style: { fontSize: 10, color: 'var(--g)', fontWeight: 700 }, children: ["\u2713 To'g'ri: ", ['A', 'B', 'C', 'D'][w.correctAnswer]] }), w.topic && (_jsx("span", { style: { fontSize: 9, color: 'var(--txt-3)', marginLeft: 'auto' }, children: w.topic }))] })] }), _jsx("span", { style: { color: 'var(--txt-3)', fontSize: 18, alignSelf: 'center' }, children: "\u203A" })] }, w._id)))) }), wrongs.length > 0 && (_jsx("div", { style: {
                        position: 'fixed', bottom: 76, left: 0, right: 0, padding: '10px 16px',
                        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
                        maxWidth: 480, margin: '0 auto',
                    }, children: _jsxs("button", { onClick: () => startMiniTest(filterSubject), className: "btn btn-primary btn-block btn-lg", children: ["\uD83C\uDFAF Faqat shu xatolarni qayta ishlash (", Math.min(wrongs.length, 10), " ta)"] }) })), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
    }
    // ─── Home — kabinet bosh sahifasi ────────────────────────────────────
    const stats = data.stats;
    const totalCorrect = (data.totalAnswered || 0) - (data.wrongCount || 0);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }, children: [_jsx("span", { children: "\uD83C\uDF93" }), " Kabinet"] })] }), _jsx("div", { style: { padding: '4px 16px 0' }, children: _jsxs("div", { style: {
                        background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(0,212,170,0.08))',
                        border: '1px solid rgba(123,104,238,0.3)',
                        borderRadius: 16, padding: 18,
                    }, children: [_jsxs("div", { style: { fontSize: 11, color: 'var(--txt-2)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }, children: ["\uD83D\uDCCA SHAXSIY KABINET \u2014 ", data.sessionCount, " ta DTM testi"] }), _jsxs("div", { style: { display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 10 }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontSize: 36, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }, children: [stats.overallAccuracy, _jsx("span", { style: { fontSize: 18 }, children: "%" })] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 4 }, children: "aniqlik" })] }), _jsxs("div", { style: { flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 17, fontWeight: 800, color: 'var(--g)' }, children: totalCorrect }), _jsx("div", { style: { fontSize: 9, color: 'var(--txt-3)' }, children: "To'g'ri" })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 17, fontWeight: 800, color: 'var(--r)' }, children: data.wrongCount || 0 }), _jsx("div", { style: { fontSize: 9, color: 'var(--txt-3)' }, children: "Xato" })] })] })] }), _jsx("div", { style: { height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100 }, children: _jsx("div", { style: {
                                    height: '100%',
                                    width: `${stats.overallAccuracy}%`,
                                    background: stats.overallAccuracy >= 70 ? 'var(--g)' : stats.overallAccuracy >= 50 ? 'var(--y)' : 'var(--r)',
                                    borderRadius: 100, transition: 'width 0.6s',
                                } }) })] }) }), (data.wrongCount || 0) > 0 && (_jsx("div", { style: { padding: '12px 16px 0' }, children: _jsxs("button", { onClick: () => setScreen('analysis'), style: {
                        width: '100%',
                        background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(255,204,68,0.08))',
                        border: '1px solid rgba(123,104,238,0.3)',
                        borderRadius: 14, padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        color: 'var(--txt)', cursor: 'pointer', textAlign: 'left',
                    }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\uD83E\uDD16" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 14 }, children: "AI Tahlil olish" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Zaif sohalaringizni va keyingi qadamlarni AI tushuntirib beradi" })] }), _jsx("div", { style: { color: 'var(--acc-l)', fontSize: 18 }, children: "\u2192" })] }) })), _jsx("div", { className: "section-title", children: "Bloklar bo'yicha" }), _jsx("div", { style: { padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }, children: [
                    { id: 'majburiy', label: 'Majburiy', emoji: '📌', color: 'var(--acc-l)' },
                    { id: 'mutaxassislik_1', label: 'Mutax. 1', emoji: '🎯', color: 'var(--g)' },
                    { id: 'mutaxassislik_2', label: 'Mutax. 2', emoji: '🎯', color: 'var(--y)' },
                ].map(b => {
                    const bs = stats.byBlock[b.id];
                    if (!bs.total)
                        return (_jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12, opacity: 0.5 }, children: [_jsx("div", { style: { fontSize: 18, marginBottom: 4 }, children: b.emoji }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }, children: b.label }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }, children: "\u2014" })] }, b.id));
                    return (_jsxs("div", { className: "card", style: { textAlign: 'center', padding: 12 }, children: [_jsx("div", { style: { fontSize: 18, marginBottom: 4 }, children: b.emoji }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }, children: b.label }), _jsxs("div", { style: { fontSize: 18, fontWeight: 900, color: b.color, marginTop: 3 }, children: [bs.accuracy, "%"] }), _jsxs("div", { style: { fontSize: 9, color: 'var(--txt-3)', marginTop: 2 }, children: [bs.correct, "/", bs.total] })] }, b.id));
                }) }), _jsx("div", { className: "section-title", children: "Fanlar bo'yicha \u2014 bos va ko'r" }), _jsx("div", { style: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }, children: stats.bySubject.length === 0 ? (_jsx("div", { className: "empty", children: "Hech qanday fan ma'lumoti yo'q" })) : (stats.bySubject.map(s => {
                    const isWeak = s.accuracy < 50;
                    const color = s.accuracy >= 70 ? 'var(--g)' : s.accuracy >= 50 ? 'var(--y)' : 'var(--r)';
                    return (_jsxs("button", { onClick: () => { setFilterSubject(s.subjectId); setScreen('subject_view'); }, style: {
                            background: isWeak ? 'rgba(255,95,126,0.06)' : 'var(--s1)',
                            border: `1px solid ${isWeak ? 'rgba(255,95,126,0.2)' : 'var(--f)'}`,
                            borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                            color: 'var(--txt)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 12,
                        }, children: [_jsx("span", { style: { fontSize: 22 }, children: SUBJECT_EMOJI[s.subjectId] || '📘' }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: s.subjectName }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }, children: [_jsx("div", { style: { flex: 1, height: 4, background: 'var(--s3)', borderRadius: 100 }, children: _jsx("div", { style: {
                                                        height: '100%', width: `${s.accuracy}%`,
                                                        background: color, borderRadius: 100, transition: 'width 0.5s',
                                                    } }) }), _jsxs("span", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: [s.correct, "/", s.total] })] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: { fontSize: 16, fontWeight: 800, color }, children: [s.accuracy, "%"] }), s.wrong > 0 && (_jsxs("div", { style: { fontSize: 10, color: 'var(--r)' }, children: ["\u2717 ", s.wrong, " xato"] }))] }), _jsx("span", { style: { color: 'var(--txt-3)', fontSize: 18 }, children: "\u203A" })] }, s.subjectId));
                })) }), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// Wrong Answer Detail — bitta xato uchun AI tushuntirish
// ═══════════════════════════════════════════════════════════════════════════
function WrongAnswerDetail({ answer, onBack, onSubOpen }) {
    const [aiExplanation, setAiExplanation] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [originalExp, setOriginalExp] = useState('');
    const { toast } = useToast();
    const askAi = async () => {
        setLoadingAi(true);
        try {
            const { data } = await examApi.cabinetExplain(answer._id);
            setAiExplanation(data.explanation);
            setOriginalExp(data.originalExplanation || '');
        }
        catch (e) {
            const code = e.response?.data?.code;
            if (code === 'DAILY_LIMIT_REACHED' || code === 'SUBSCRIPTION_REQUIRED') {
                toast('Bugungi AI limit tugadi', 'err');
                onSubOpen();
            }
            else {
                toast(e.response?.data?.error || 'AI tahlil qilolmadi', 'err');
            }
        }
        finally {
            setLoadingAi(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: onBack, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsxs("div", { style: { fontWeight: 700, fontSize: 14 }, children: [SUBJECT_EMOJI[answer.subjectId] || '📘', " Xato tahlili"] }), _jsx("div", { style: { width: 70 } })] }), _jsxs("div", { style: { padding: '4px 16px 24px' }, children: [_jsxs("div", { className: "card", style: { marginBottom: 12 }, children: [_jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }, children: ["SAVOL", answer.topic ? ` · ${answer.topic}` : ''] }), _jsx("div", { style: { fontSize: 14, lineHeight: 1.6, fontWeight: 500, whiteSpace: 'pre-wrap' }, children: answer.questionText })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }, children: answer.questionOptions.map((opt, i) => {
                            let bg = 'var(--s2)', border = 'var(--f)', label = '';
                            if (i === answer.correctAnswer) {
                                bg = 'rgba(0,212,170,0.12)';
                                border = 'var(--g)';
                                label = '✓ TO\'G\'RI';
                            }
                            else if (i === answer.selectedOption) {
                                bg = 'rgba(255,95,126,0.1)';
                                border = 'var(--r)';
                                label = '✗ Siz tanladingiz';
                            }
                            return (_jsx("div", { style: {
                                    padding: '12px 14px', background: bg,
                                    border: `1.5px solid ${border}`,
                                    borderRadius: 10, fontSize: 13, lineHeight: 1.5,
                                }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 10 }, children: [_jsx("span", { style: { fontWeight: 800, color: 'var(--txt-3)', flexShrink: 0 }, children: ['A', 'B', 'C', 'D'][i] }), _jsx("span", { style: { flex: 1 }, children: opt }), label && (_jsx("span", { style: { fontSize: 9, fontWeight: 800,
                                                color: i === answer.correctAnswer ? 'var(--g)' : 'var(--r)',
                                                whiteSpace: 'nowrap',
                                            }, children: label }))] }) }, i));
                        }) }), answer.explanation && (_jsxs("div", { style: {
                            background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
                            borderRadius: 10, padding: 12, marginBottom: 12,
                        }, children: [_jsx("div", { style: { fontSize: 10, color: 'var(--g)', fontWeight: 800, marginBottom: 5, letterSpacing: 0.5 }, children: "\uD83D\uDCA1 ASOSIY TUSHUNTIRISH" }), _jsx("div", { style: { fontSize: 12, lineHeight: 1.6, color: 'var(--txt)' }, children: answer.explanation })] })), !aiExplanation && !loadingAi && (_jsx("button", { onClick: askAi, style: {
                            width: '100%', padding: 14, borderRadius: 12, cursor: 'pointer',
                            background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(0,212,170,0.08))',
                            border: '1px solid rgba(123,104,238,0.3)',
                            color: 'var(--txt)', fontSize: 13, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }, children: "\uD83E\uDD16 AI orqali batafsil tushuntirish olish" })), loadingAi && (_jsxs("div", { style: {
                            background: 'var(--s1)', border: '1px solid var(--f)',
                            borderRadius: 12, padding: 20, textAlign: 'center',
                        }, children: [_jsx("div", { className: "spin", style: { margin: '0 auto 10px' } }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-3)' }, children: "AI tahlil qilmoqda..." })] })), aiExplanation && (_jsxs("div", { style: {
                            background: 'rgba(123,104,238,0.07)', border: '1px solid rgba(123,104,238,0.25)',
                            borderRadius: 12, padding: 14,
                        }, children: [_jsxs("div", { style: { fontSize: 10, color: 'var(--acc-l)', fontWeight: 800, marginBottom: 8, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }, children: [_jsx("span", { children: "\uD83E\uDD16" }), " FIKRA AI TUSHUNTIRISHI"] }), _jsx("div", { style: { fontSize: 13, lineHeight: 1.7, color: 'var(--txt)', whiteSpace: 'pre-wrap' }, children: aiExplanation })] }))] })] }));
}
// ═══════════════════════════════════════════════════════════════════════════
// Analysis Screen — umumiy AI tahlil
// ═══════════════════════════════════════════════════════════════════════════
function AnalysisScreen({ stats, onBack, onMiniTest }) {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const { toast } = useToast();
    useEffect(() => {
        let mounted = true;
        examApi.cabinetAnalysis()
            .then(({ data }) => {
            if (mounted && data.success)
                setAnalysis(data.analysis);
            else if (mounted)
                toast(data.message || 'Tahlil qilolmadi', 'err');
        })
            .catch((e) => {
            if (mounted)
                toast(e.response?.data?.error || 'Xatolik', 'err');
        })
            .finally(() => { if (mounted)
            setLoading(false); });
        return () => { mounted = false; };
    }, []);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: onBack, className: "btn btn-ghost btn-sm", children: "\u2190 Orqaga" }), _jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: "\uD83E\uDD16 AI Tahlil" }), _jsx("div", { style: { width: 70 } })] }), _jsx("div", { style: { padding: '4px 16px 24px' }, children: loading ? (_jsxs("div", { style: {
                        background: 'var(--s1)', border: '1px solid var(--f)',
                        borderRadius: 14, padding: 30, textAlign: 'center',
                    }, children: [_jsx("div", { className: "spin", style: { margin: '0 auto 12px' } }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-3)' }, children: "FIKRA AI sizning natijalaringizni tahlil qilmoqda..." })] })) : analysis ? (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                                background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(0,212,170,0.06))',
                                border: '1px solid rgba(123,104,238,0.25)',
                                borderRadius: 14, padding: 16, marginBottom: 14,
                            }, children: [_jsxs("div", { style: { fontSize: 10, color: 'var(--acc-l)', fontWeight: 800, marginBottom: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }, children: [_jsx("span", { children: "\uD83C\uDF93" }), " SHAXSIY MASLAHATCHI"] }), _jsx("div", { style: { fontSize: 13, lineHeight: 1.75, color: 'var(--txt)', whiteSpace: 'pre-wrap' }, children: analysis })] }), stats.weakestSubject && (_jsxs("div", { style: {
                                background: 'rgba(255,95,126,0.06)', border: '1px solid rgba(255,95,126,0.2)',
                                borderRadius: 12, padding: 14, marginBottom: 14,
                            }, children: [_jsx("div", { style: { fontSize: 10, color: 'var(--r)', fontWeight: 800, marginBottom: 6, letterSpacing: 0.5 }, children: "\u26A0\uFE0F ENG ZAIF FAN" }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("span", { style: { fontSize: 26 }, children: SUBJECT_EMOJI[stats.weakestSubject.subjectId] || '📘' }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: stats.weakestSubject.subjectName }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: [stats.weakestSubject.accuracy, "% aniqlik \u00B7 ", stats.weakestSubject.wrong, " ta xato"] })] })] })] })), _jsx("button", { onClick: onMiniTest, className: "btn btn-primary btn-block btn-lg", children: "\uD83C\uDFAF Xato qilingan savollar bo'yicha mini-test" })] })) : (_jsx("div", { className: "empty", children: "Tahlil yuklanmadi. Qayta urining." })) })] }));
}
