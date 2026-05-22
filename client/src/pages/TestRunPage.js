import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import RichText from '../components/RichText';
import '../components/RichText.css';
export default function TestRunPage() {
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const location = useLocation();
    const toast = useToast();
    const state = location.state;
    const [questions] = useState(state?.questions || []);
    const [qIdx, setQIdx] = useState(0);
    const [selected, setSelected] = useState({});
    const [timeLeft, setTimeLeft] = useState(state?.durationSeconds || 10800);
    const [finishing, setFinishing] = useState(false);
    const [exitTarget, setExitTarget] = useState(null);
    const finishedRef = useRef(false);
    // Sessiya holatini yo'qotmaslik uchun beforeunload + abandon
    useEffect(() => {
        if (!sessionId)
            return;
        const onUnload = () => {
            // Yopilishda abandon (best effort, navigator.sendBeacon)
            if (finishedRef.current)
                return;
            try {
                const auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
                const data = new Blob([JSON.stringify({})], { type: 'application/json' });
                const url = `/api/exams/sessions/${sessionId}/abandon`;
                // Token Authorization Header beacon'da ishlamaydi, lekin server hech bo'lmasa
                // sessiyani tozalashga harakat qiladi. Aniq abandon /home dan keyin ham yuboriladi.
                navigator.sendBeacon?.(url, data);
            }
            catch { }
        };
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('pagehide', onUnload);
        return () => {
            window.removeEventListener('beforeunload', onUnload);
            window.removeEventListener('pagehide', onUnload);
        };
    }, [sessionId]);
    // Nav tugma bossa — modal
    useEffect(() => {
        const onNavAttempt = (e) => {
            e.preventDefault();
            setExitTarget(e.detail.target);
        };
        window.addEventListener('fikra:nav-attempt', onNavAttempt);
        return () => window.removeEventListener('fikra:nav-attempt', onNavAttempt);
    }, []);
    // Timer
    useEffect(() => {
        if (finishedRef.current)
            return;
        const id = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(id);
                    handleFinish(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, []);
    // Agar questions kelmagan bo'lsa
    if (!sessionId || !questions.length) {
        return (_jsxs("div", { style: { padding: 40, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\u26A0\uFE0F" }), _jsx("p", { style: { marginTop: 12 }, children: "Test ma'lumotlari topilmadi" }), _jsx("button", { className: "btn btn-primary", onClick: () => navigate('/testlar'), style: { marginTop: 16 }, children: "Testlarga qaytish" })] }));
    }
    const q = questions[qIdx];
    const total = questions.length;
    const isLast = qIdx === total - 1;
    const fmt = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        return h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
            : `${m}:${String(ss).padStart(2, '0')}`;
    };
    const pickAnswer = async (i) => {
        if (selected[qIdx] !== undefined)
            return;
        setSelected(prev => ({ ...prev, [qIdx]: i }));
        try {
            await examApi.answer(sessionId, q._id, i);
        }
        catch { }
    };
    const next = () => {
        if (qIdx < total - 1)
            setQIdx(qIdx + 1);
    };
    const prev = () => {
        if (qIdx > 0)
            setQIdx(qIdx - 1);
    };
    const handleFinish = useCallback(async (auto = false) => {
        if (finishing || finishedRef.current)
            return;
        setFinishing(true);
        finishedRef.current = true;
        try {
            const { data } = await examApi.finish(sessionId);
            navigate(`/test-result/${sessionId}`, { state: data });
        }
        catch (e) {
            if (!auto)
                toast.error('Yakunlashda xatolik');
            setFinishing(false);
            finishedRef.current = false;
        }
    }, [sessionId, finishing, navigate, toast]);
    // Modal — chiqish tasdig'i
    const confirmExit = async () => {
        finishedRef.current = true;
        try {
            await examApi.abandon(sessionId);
        }
        catch { }
        const target = exitTarget || '/testlar';
        setExitTarget(null);
        navigate(target);
    };
    const cancelExit = () => setExitTarget(null);
    const answered = Object.keys(selected).length;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    background: 'rgba(10,10,20,0.95)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--f)',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }, children: [_jsx("button", { onClick: () => setExitTarget('/testlar'), style: {
                            background: 'none', border: 'none', color: 'var(--r)',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0,
                        }, children: "Chiqish" }), _jsx("div", { style: { flex: 1, textAlign: 'center' }, children: _jsxs("div", { style: {
                                display: 'inline-block',
                                background: timeLeft < 300 ? 'rgba(255,95,126,0.15)' : 'rgba(123,104,238,0.12)',
                                border: `1px solid ${timeLeft < 300 ? 'var(--r)' : 'rgba(123,104,238,0.3)'}`,
                                borderRadius: 100,
                                padding: '4px 14px',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                fontSize: 14,
                                color: timeLeft < 300 ? 'var(--r)' : 'var(--acc-l)',
                            }, children: ["\u23F1 ", fmt(timeLeft)] }) }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', fontWeight: 700, minWidth: 50, textAlign: 'right' }, children: [qIdx + 1, "/", total] })] }), _jsxs("div", { style: { padding: '8px 16px 4px' }, children: [_jsx("div", { style: { height: 3, background: 'var(--s2)', borderRadius: 100 }, children: _jsx("div", { style: {
                                height: '100%',
                                width: `${(answered / total) * 100}%`,
                                background: 'var(--acc)',
                                borderRadius: 100,
                                transition: 'width 0.3s',
                            } }) }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 4, textAlign: 'right' }, children: [answered, "/", total, " javob berildi"] })] }), _jsxs("div", { style: { padding: '8px 16px 100px' }, children: [_jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }, children: q.subjectName || q.subject }), _jsx("div", { style: {
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            borderRadius: 14,
                            padding: 16,
                            marginBottom: 12,
                            fontSize: 14,
                            lineHeight: 1.6,
                            fontWeight: 500,
                        }, children: _jsx(RichText, { content: q.question }) }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: q.options.map((opt, i) => {
                            const isSel = selected[qIdx] === i;
                            return (_jsxs("button", { onClick: () => pickAnswer(i), disabled: selected[qIdx] !== undefined, style: {
                                    background: isSel ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
                                    border: `1.5px solid ${isSel ? 'var(--acc-l)' : 'var(--f)'}`,
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    cursor: selected[qIdx] !== undefined ? 'default' : 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'left',
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                    width: '100%',
                                }, children: [_jsx("span", { style: {
                                            fontWeight: 800,
                                            color: isSel ? 'var(--acc-l)' : 'var(--txt-3)',
                                            flexShrink: 0,
                                            minWidth: 18,
                                        }, children: ['A', 'B', 'C', 'D'][i] }), _jsx("span", { style: { flex: 1 }, children: _jsx(RichText, { content: opt, inline: true }) })] }, i));
                        }) }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 16 }, children: [_jsx("button", { onClick: prev, disabled: qIdx === 0, className: "btn btn-ghost", style: { flex: 1, opacity: qIdx === 0 ? 0.4 : 1 }, children: "\u2190 Oldingi" }), !isLast ? (_jsx("button", { onClick: next, className: "btn btn-primary", style: { flex: 2 }, children: "Keyingi \u2192" })) : (_jsx("button", { onClick: () => handleFinish(false), disabled: finishing, className: "btn btn-success", style: { flex: 2 }, children: finishing ? '⏳ Yakunlanmoqda...' : '🏁 Testni yakunlash' }))] })] }), exitTarget && (_jsx("div", { style: {
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 20,
                }, children: _jsxs("div", { style: {
                        background: 'var(--s1)',
                        border: '1px solid var(--f)',
                        borderRadius: 18,
                        padding: 22,
                        maxWidth: 360,
                        width: '100%',
                    }, children: [_jsx("div", { style: { fontSize: 36, textAlign: 'center', marginBottom: 8 }, children: "\u26A0\uFE0F" }), _jsx("div", { style: { fontWeight: 800, fontSize: 16, textAlign: 'center', marginBottom: 8 }, children: "Testdan chiqasizmi?" }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: 16 }, children: ["Test to'liq yakunlanmagan. Chiqsangiz natija ", _jsx("strong", { children: "saqlanmaydi" }), " va keyingi safar boshidan boshlanadi."] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { onClick: cancelExit, className: "btn btn-ghost btn-block", children: "Davom etish" }), _jsx("button", { onClick: confirmExit, style: {
                                        flex: 1,
                                        background: 'rgba(255,95,126,0.15)',
                                        border: '1.5px solid var(--r)',
                                        color: 'var(--r)',
                                        fontWeight: 700,
                                        fontSize: 13,
                                        padding: '11px 14px',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                    }, children: "Chiqish" })] })] }) }))] }));
}
