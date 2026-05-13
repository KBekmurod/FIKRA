import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { levelApi } from '../api/endpoints';
import { GRADE_META } from '../constants/subjects';
export default function LevelPage() {
    const [level, setLevel] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('now');
    useEffect(() => {
        Promise.all([levelApi.current(), levelApi.history()])
            .then(([curr, hist]) => {
            setLevel(curr.data);
            setHistory(hist.data.history || []);
        })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    if (loading || !level) {
        return (_jsx("div", { className: "page", style: { padding: 20 }, children: _jsx("div", { className: "skel-card" }) }));
    }
    const grade = level.currentGrade;
    const gradeMeta = GRADE_META[grade];
    const versionInGrade = grade === 'beta' ? level.currentVersion :
        grade === 'delta' ? level.currentVersion - 3 :
            level.currentVersion - 7;
    const next = level.nextVersionInfo;
    const allTotal = level.standardTests.total + level.personalTests.total + level.miniTests.total;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsx("div", { className: "header-logo", children: "\uD83D\uDCCA Daraja" }) }), _jsx("div", { style: { padding: '4px 20px 0' }, children: _jsxs("div", { className: "seg-tabs", children: [_jsx("button", { className: `seg-tab ${tab === 'now' ? 'active' : ''}`, onClick: () => setTab('now'), children: "Joriy oy" }), _jsx("button", { className: `seg-tab ${tab === 'history' ? 'active' : ''}`, onClick: () => setTab('history'), children: "Tarix" })] }) }), tab === 'now' ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { style: {
                                background: `linear-gradient(135deg, ${gradeMeta.bgColor}, transparent)`,
                                border: `1.5px solid ${gradeMeta.color}40`,
                                borderRadius: 18,
                                padding: 22,
                                textAlign: 'center',
                            }, children: [_jsx("div", { style: {
                                        fontSize: 60,
                                        fontWeight: 900,
                                        color: gradeMeta.color,
                                        lineHeight: 1,
                                        marginBottom: 8,
                                        textShadow: `0 0 24px ${gradeMeta.color}50`,
                                    }, children: gradeMeta.icon }), _jsxs("div", { style: { fontWeight: 900, fontSize: 22, color: gradeMeta.color }, children: [gradeMeta.name, " ", versionInGrade] }), _jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }, children: ["Versiya ", level.currentVersion, "/10 \u00B7 Joriy oy"] }), _jsxs("div", { style: {
                                        marginTop: 16,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: 24,
                                    }, children: [_jsxs("div", { children: [_jsxs("div", { style: { fontWeight: 800, fontSize: 20 }, children: [level.accuracyPercent, "%"] }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "Aniqlik" })] }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 800, fontSize: 20 }, children: allTotal }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: "Savol ishlangan" })] })] })] }) }), !next.isMax && (_jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { className: "card", children: [_jsxs("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 8 }, children: ["Keyingi daraja: ", _jsxs("strong", { style: { color: 'var(--txt)' }, children: [GRADE_META[next.nextGrade]?.name, " ", next.nextGrade === 'beta' ? next.nextVersion :
                                                    next.nextGrade === 'delta' ? next.nextVersion - 3 :
                                                        next.nextVersion - 7] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }, children: [_jsx("span", { children: "Aniqlik kerak" }), _jsxs("span", { style: { fontWeight: 700 }, children: [next.currentAccuracy || 0, "% / ", next.requiredAccuracy || 0, "%"] })] }), _jsx("div", { style: { height: 6, background: 'var(--s2)', borderRadius: 100, marginBottom: 12 }, children: _jsx("div", { style: {
                                            height: '100%',
                                            background: next.isReady ? 'var(--g)' : 'var(--acc)',
                                            width: `${Math.min(100, ((next.currentAccuracy || 0) / (next.requiredAccuracy || 1)) * 100)}%`,
                                            borderRadius: 100,
                                            transition: 'width 0.3s',
                                        } }) }), (next.questionsNeeded || 0) > 0 ? (_jsxs("div", { style: { fontSize: 11, color: 'var(--y)' }, children: ["\u23F3 Yana ", _jsx("strong", { children: next.questionsNeeded }), " ta savol ishlash kerak"] })) : next.isReady ? (_jsx("div", { style: { fontSize: 11, color: 'var(--g)', fontWeight: 700 }, children: "\u2713 Keyingi testda yangi darajaga o'tish ehtimoli yuqori!" })) : (_jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Aniqligingizni oshirib ko'ring" })), next.testSource === 'mini' && (_jsxs("div", { style: {
                                        marginTop: 10, padding: 10,
                                        background: 'rgba(245, 158, 11, 0.08)',
                                        border: '1px solid rgba(245, 158, 11, 0.2)',
                                        borderRadius: 10,
                                        fontSize: 11, color: 'var(--txt-2)',
                                    }, children: ["\u26A0\uFE0F Alfa darajaga o'tish uchun ", _jsx("strong", { children: "mini-testlar" }), " kerak. Xatolar tahlilidan ularni yarating."] }))] }) })), next.isMax && (_jsx("div", { style: { padding: '12px 20px 0' }, children: _jsxs("div", { className: "card", style: { textAlign: 'center', padding: 22 }, children: [_jsx("div", { style: { fontSize: 40 }, children: "\uD83C\uDFC6" }), _jsx("div", { style: { fontWeight: 800, fontSize: 16, color: 'var(--y)', marginTop: 8 }, children: "Maksimal daraja!" }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }, children: "Siz ALFA 3 darajasiga yetdingiz" })] }) })), _jsx("div", { className: "section-title", children: "Test natijalari (joriy oy)" }), _jsxs("div", { style: { padding: '0 20px', display: 'grid', gap: 8 }, children: [_jsx(ResultRow, { icon: "\uD83D\uDCDD", label: "Fikra standart testlar", correct: level.standardTests.correct, total: level.standardTests.total }), _jsx(ResultRow, { icon: "\uD83D\uDCDA", label: "Shaxsiy testlar", correct: level.personalTests.correct, total: level.personalTests.total }), _jsx(ResultRow, { icon: "\uD83C\uDFAF", label: "Mini-testlar (xatolardan)", correct: level.miniTests.correct, total: level.miniTests.total })] }), _jsx("div", { style: { padding: '14px 20px 24px' }, children: _jsxs("div", { style: {
                                padding: 12,
                                background: 'rgba(123,104,238,0.08)',
                                border: '1px solid rgba(123,104,238,0.18)',
                                borderRadius: 12,
                                fontSize: 11,
                                color: 'var(--txt-2)',
                                lineHeight: 1.5,
                            }, children: ["\uD83D\uDCA1 Daraja ", _jsx("strong", { children: "har oy boshida" }), " avtomatik nolga tushadi. O'tgan oylar tarixda saqlanib qoladi \u2014 bu sizni har oy yangidan harakat qilishga undaydi."] }) })] })) : (_jsx("div", { style: { padding: '12px 20px 24px' }, children: history.length === 0 ? (_jsxs("div", { className: "card", style: { textAlign: 'center', padding: 24 }, children: [_jsx("div", { style: { fontSize: 36 }, children: "\uD83D\uDCC5" }), _jsx("div", { style: { fontWeight: 700, marginTop: 8 }, children: "Tarix bo'sh" }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }, children: "Birinchi oyingizni yakunlang" })] })) : (_jsx("div", { style: { display: 'grid', gap: 8 }, children: history.map((h, i) => {
                        const hMeta = GRADE_META[h.grade];
                        const vInG = h.grade === 'beta' ? h.maxVersion :
                            h.grade === 'delta' ? h.maxVersion - 3 :
                                h.maxVersion - 7;
                        const total = h.standardTests.total + h.personalTests.total + h.miniTests.total;
                        const correct = h.standardTests.correct + h.personalTests.correct + h.miniTests.correct;
                        const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
                        return (_jsxs("div", { className: "card", style: {
                                display: 'flex', alignItems: 'center', gap: 12,
                            }, children: [_jsx("div", { style: {
                                        width: 48, height: 48,
                                        background: hMeta.bgColor,
                                        border: `1px solid ${hMeta.color}40`,
                                        borderRadius: 12,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: 18, color: hMeta.color,
                                    }, children: hMeta.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 700, fontSize: 13 }, children: [h.monthKey, " \u00B7 ", hMeta.name, " ", vInG] }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }, children: [total, " savol \u00B7 ", acc, "% aniqlik"] })] })] }, i));
                    }) })) }))] }));
}
function ResultRow({ icon, label, correct, total }) {
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (_jsxs("div", { className: "card", style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("div", { style: { fontSize: 22 }, children: icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: label }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }, children: total > 0 ? `${correct}/${total} to'g'ri (${acc}%)` : "Hozircha yo'q" })] })] }));
}
