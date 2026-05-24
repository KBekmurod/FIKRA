import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GRADE_META, versionToGrade, versionInGrade } from '../constants/subjects';
export default function TestResultPage() {
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const location = useLocation();
    const state = location.state;
    const [showConfetti, setShowConfetti] = useState(false);
    useEffect(() => {
        if (state) {
            if (state.totalScore === state.maxTotalScore && state.maxTotalScore > 0) {
                setShowConfetti(true);
            }
        }
    }, [state]);
    if (!state || !sessionId) {
        return (_jsxs("div", { style: { padding: 40, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\u26A0\uFE0F" }), _jsx("p", { children: "Natija topilmadi" }), _jsx("button", { onClick: () => navigate('/testlar'), className: "btn btn-primary", children: "Testlarga qaytish" })] }));
    }
    const { totalScore, maxTotalScore, percent, level } = state;
    const grade = percent >= 90 ? 'A\'lo' : percent >= 75 ? 'Yaxshi' : percent >= 50 ? "O'rtacha" : 'Yaxshilash kerak';
    const emoji = percent >= 80 ? '🏆' : percent >= 60 ? '👏' : percent >= 40 ? '💪' : '📖';
    // Xatolar bormi (tahlil tugmasini aktivlashtirish uchun)
    const hasErrors = state.subjectBreakdown.some(b => b.wrong > 0);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsx("div", { className: "header-logo", children: "\uD83C\uDFC1 Yakunlandi" }) }), _jsx("div", { style: { padding: '8px 20px 0' }, children: _jsxs("div", { style: {
                        background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(0,212,170,0.08))',
                        border: '1px solid rgba(123,104,238,0.3)',
                        borderRadius: 18,
                        padding: 24,
                        textAlign: 'center',
                    }, children: [_jsx("div", { style: { fontSize: 56, marginBottom: 4 }, children: emoji }), _jsx("div", { style: { fontSize: 48, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }, children: totalScore.toFixed(1) }), _jsxs("div", { style: { fontSize: 13, color: 'var(--txt-2)', marginTop: 4 }, children: ["/ ", maxTotalScore.toFixed(1), " ball \u00B7 ", percent, "%"] }), _jsx("div", { style: {
                                display: 'inline-block', marginTop: 10,
                                background: 'rgba(123,104,238,0.15)',
                                border: '1px solid rgba(123,104,238,0.3)',
                                borderRadius: 100,
                                padding: '5px 16px',
                                fontSize: 12, fontWeight: 700, color: 'var(--acc-l)',
                            }, children: grade }), level && level.levelUp && (_jsxs("div", { style: {
                                marginTop: 12, padding: '8px 14px',
                                background: 'rgba(251,191,36,0.12)',
                                border: '1px solid rgba(251,191,36,0.3)',
                                borderRadius: 100,
                                fontSize: 12, fontWeight: 700, color: 'var(--y)',
                                display: 'inline-block',
                            }, children: ["\uD83C\uDF89 Yangi daraja: ", GRADE_META[versionToGrade(level.versionAfter)].name, " ", versionInGrade(level.versionAfter), "!"] }))] }) }), _jsx("div", { className: "section-title", children: "Keyingi qadam" }), _jsxs("div", { style: { padding: '0 20px', display: 'grid', gap: 10 }, children: [_jsxs("button", { onClick: () => navigate(`/test-review/${sessionId}`, { state }), style: {
                            background: 'var(--s1)',
                            border: '1.5px solid var(--f)',
                            borderRadius: 14,
                            padding: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            cursor: 'pointer',
                            color: 'var(--txt)',
                            textAlign: 'left',
                        }, children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83D\uDCCA" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: "Natijalarni ko'rish" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Fan bo'yicha alohida tahlil" })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--txt-3)' }, children: "\u2192" })] }), _jsxs("button", { onClick: () => navigate(`/test-explain/${sessionId}/_overview`, { state }), disabled: !hasErrors, style: {
                            background: hasErrors ? 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(167,139,250,0.05))' : 'var(--s2)',
                            border: `1.5px solid ${hasErrors ? 'rgba(123,104,238,0.3)' : 'var(--f)'}`,
                            borderRadius: 14,
                            padding: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            cursor: hasErrors ? 'pointer' : 'default',
                            color: 'var(--txt)',
                            textAlign: 'left',
                            opacity: hasErrors ? 1 : 0.5,
                        }, children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83C\uDFAF" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: hasErrors ? "Xatolar bilan rivojlanish" : "Xatosiz a'lo natija!" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: hasErrors ? 'AI tushuntirish + mini-test' : 'Hammasi to\'g\'ri' })] }), _jsx("div", { style: { fontSize: 18, color: hasErrors ? 'var(--acc-l)' : 'var(--txt-3)' }, children: "\u2192" })] }), _jsxs("button", { onClick: () => navigate('/tarix'), style: {
                            background: 'var(--s1)',
                            border: '1.5px solid var(--f)',
                            borderRadius: 14,
                            padding: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            cursor: 'pointer',
                            color: 'var(--txt)',
                            textAlign: 'left',
                        }, children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83D\uDCDA" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14, color: 'var(--g)' }, children: "\u2713 Tarixga saqlandi" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Tarix bo'limidan keyin ko'rishingiz mumkin" })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--txt-3)' }, children: "\u2192" })] })] }), _jsx("div", { style: { padding: '24px 20px' }, children: _jsx("button", { onClick: () => navigate('/testlar'), className: "btn btn-ghost btn-block", children: "Testlar sahifasiga qaytish" }) })] }));
}
