import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { SUBJECTS, GRADE_META, versionToGrade, versionInGrade } from '../constants/subjects';
export default function PersonalTestResultPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const toast = useToast();
    const initial = location.state;
    const [state, setState] = useState(initial);
    const [loading, setLoading] = useState(!initial);
    const [folderTitle, setFolderTitle] = useState('');
    const [wrongCount, setWrongCount] = useState(0);
    const [miniGenerated, setMiniGenerated] = useState(false);
    const [miniTestData, setMiniTestData] = useState(null);
    const [breakdown, setBreakdown] = useState([]);
    const [test, setTest] = useState(null);
    useEffect(() => {
        if (!id)
            return;
        setLoading(true);
        api.get(`/api/personal-tests/${id}`)
            .then(({ data }) => {
            const t = data.test;
            setTest(t);
            setWrongCount(t.totalQuestions - t.totalCorrect);
            // Agar state yo'q bo'lsa (tarixdan kelgan)
            if (!state) {
                setState({
                    testId: t._id,
                    subjectId: t.subjectId,
                    subjectName: t.subjectName,
                    testType: t.testType,
                    folderId: t.folderId || null,
                    totalCorrect: t.totalCorrect,
                    totalQuestions: t.totalQuestions,
                    scorePercent: t.scorePercent,
                    level: null,
                });
            }
            // Helper: id'ni xavfsiz string'ga aylantirish
            const safeId = (id) => {
                if (!id)
                    return null;
                if (typeof id === 'string')
                    return id;
                if (typeof id === 'object') {
                    return id._id ? String(id._id) : (id.toString ? id.toString() : null);
                }
                return String(id);
            };
            // Folder ma'lumotini olish
            const folderIdSafe = safeId(t.folderId);
            if (folderIdSafe) {
                api.get(`/api/folders/${folderIdSafe}`).then(({ data: f }) => {
                    setFolderTitle(f.folder?.title || '');
                    setMiniGenerated(f.folder?.miniTestGenerated || false);
                    // Mini-test ma'lumotini olish (agar mavjud va asosiy test bo'lsa)
                    const miniIdSafe = safeId(f.folder?.miniTestId);
                    if (miniIdSafe && t.testType !== 'mini') {
                        api.get(`/api/personal-tests/${miniIdSafe}`)
                            .then(({ data: mt }) => {
                            if (mt.test && mt.test.status === 'completed') {
                                setMiniTestData(mt.test);
                            }
                        })
                            .catch(() => { });
                    }
                }).catch(() => { });
            }
            // Test'ning o'zida miniTestId bo'lsa (ai_blok/ai_free uchun)
            const testMiniIdSafe = safeId(t.miniTestId);
            if (testMiniIdSafe && t.testType !== 'mini' && !folderIdSafe) {
                api.get(`/api/personal-tests/${testMiniIdSafe}`)
                    .then(({ data: mt }) => {
                    if (mt.test && mt.test.status === 'completed') {
                        setMiniTestData(mt.test);
                    }
                })
                    .catch(() => { });
            }
            // Fan bo'yicha breakdown (faqat ai_blok va ai_free uchun)
            if (t.testType === 'ai_blok' || t.testType === 'ai_free') {
                const map = {};
                for (const q of (t.questions || [])) {
                    if (!q.subjectId)
                        continue;
                    if (!map[q.subjectId]) {
                        map[q.subjectId] = {
                            subjectId: q.subjectId,
                            subjectName: q.subjectName || q.subjectId,
                            total: 0,
                            correct: 0,
                            pct: 0,
                        };
                    }
                    map[q.subjectId].total++;
                }
                for (const ans of (t.answers || [])) {
                    const qIdx = ans.questionIdx ?? ans.qIdx;
                    const q = t.questions.find((qq) => qq.idx === qIdx);
                    if (q?.subjectId && ans.isCorrect && map[q.subjectId]) {
                        map[q.subjectId].correct++;
                    }
                }
                const bdArr = Object.values(map).map(b => ({
                    ...b,
                    pct: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
                }));
                setBreakdown(bdArr);
            }
        })
            .catch(() => toast.error("Natija yuklanmadi"))
            .finally(() => setLoading(false));
    }, [id]);
    if (loading || !state) {
        return (_jsx("div", { style: { padding: 40, textAlign: 'center' }, children: _jsx("div", { className: "spin", style: { margin: '0 auto' } }) }));
    }
    const { totalCorrect, totalQuestions, scorePercent, level, testType } = state;
    const grade = scorePercent >= 90 ? "A'lo" : scorePercent >= 75 ? 'Yaxshi' : scorePercent >= 50 ? "O'rtacha" : 'Yaxshilash kerak';
    const emoji = scorePercent >= 80 ? '🏆' : scorePercent >= 60 ? '👏' : scorePercent >= 40 ? '💪' : '📖';
    const hasErrors = wrongCount > 0;
    const isBlok = testType === 'ai_blok';
    const isFree = testType === 'ai_free';
    const isMini = testType === 'mini';
    const isMaterial = testType === 'material';
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "\uD83C\uDFC1 Yakunlandi" }) }), _jsxs("div", { style: { padding: '8px 20px 0' }, children: [_jsxs("div", { style: {
                            padding: 10,
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            borderRadius: 10,
                            marginBottom: 12,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            display: 'flex', alignItems: 'center', gap: 8,
                        }, children: [_jsx("span", { style: { fontSize: 14, flexShrink: 0 }, children: isMini ? '🎯' : isBlok ? '📦' : isFree ? '🎯' : '🤖' }), _jsxs("div", { style: {
                                    flex: 1, minWidth: 0,
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }, children: [isMini ? 'Mini-test' :
                                        isBlok ? 'AI Maxsus blok' :
                                            isFree ? 'AI Erkin tanlov' : 'AI test', ' · ', state.subjectName, folderTitle && _jsxs(_Fragment, { children: [" \u00B7 \"", folderTitle, "\""] })] })] }), _jsxs("div", { style: {
                            background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(0,212,170,0.08))',
                            border: '1px solid rgba(123,104,238,0.3)',
                            borderRadius: 18,
                            padding: 24,
                            textAlign: 'center',
                        }, children: [_jsx("div", { style: { fontSize: 56, marginBottom: 4 }, children: emoji }), _jsxs("div", { style: { fontSize: 48, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }, children: [scorePercent, "%"] }), _jsxs("div", { style: { fontSize: 13, color: 'var(--txt-2)', marginTop: 4 }, children: [totalCorrect, " / ", totalQuestions, " to'g'ri"] }), _jsx("div", { style: {
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
                                }, children: ["\uD83C\uDF89 Yangi daraja: ", GRADE_META[versionToGrade(level.versionAfter)].name, " ", versionInGrade(level.versionAfter), "!"] }))] }), (isBlok || isFree) && breakdown.length > 0 && (_jsxs("div", { style: { marginTop: 14 }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 800, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }, children: "\uD83D\uDCCA FAN BO'YICHA NATIJA" }), _jsx("div", { style: {
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    borderRadius: 12,
                                    padding: 12,
                                    display: 'grid', gap: 8,
                                }, children: breakdown.map(b => {
                                    const subj = SUBJECTS[b.subjectId];
                                    return (_jsxs("div", { style: {
                                            display: 'flex', alignItems: 'center', gap: 10,
                                        }, children: [_jsx("span", { style: { fontSize: 18 }, children: subj?.icon || '📚' }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 12, fontWeight: 600 }, children: b.subjectName }), _jsx("div", { style: {
                                                            marginTop: 4, height: 5, background: 'var(--s2)',
                                                            borderRadius: 100, overflow: 'hidden',
                                                        }, children: _jsx("div", { style: {
                                                                height: '100%',
                                                                width: `${b.pct}%`,
                                                                background: b.pct >= 70 ? 'var(--g)' : b.pct >= 50 ? 'var(--y)' : 'var(--r)',
                                                                transition: 'width 0.5s',
                                                            } }) })] }), _jsxs("div", { style: { textAlign: 'right', minWidth: 60 }, children: [_jsxs("div", { style: {
                                                            fontWeight: 800, fontSize: 13,
                                                            color: b.pct >= 70 ? 'var(--g)' : b.pct >= 50 ? 'var(--y)' : 'var(--r)',
                                                        }, children: [b.pct, "%"] }), _jsxs("div", { style: { fontSize: 9, color: 'var(--txt-3)' }, children: [b.correct, "/", b.total] })] })] }, b.subjectId));
                                }) })] })), miniTestData && !isMini && (_jsxs("div", { style: { marginTop: 14 }, children: [_jsx("div", { style: { fontSize: 10, fontWeight: 800, color: 'var(--y)', letterSpacing: 0.5, marginBottom: 8 }, children: "\uD83C\uDFAF MINI-TEST NATIJASI (XATOLAR USTIDA ISHLANGAN)" }), _jsx("button", { onClick: () => navigate(`/personal-tests/${miniTestData._id}/result`), style: {
                                    width: '100%',
                                    background: 'linear-gradient(135deg, rgba(255,204,68,0.12), rgba(255,204,68,0.04))',
                                    border: '1px solid rgba(255,204,68,0.3)',
                                    borderRadius: 12,
                                    padding: 14,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    color: 'var(--txt)',
                                }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83C\uDFAF" }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13, color: 'var(--y)' }, children: "Mini-test tugatilgan" }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: [miniTestData.totalCorrect, "/", miniTestData.totalQuestions, " to'g'ri \u00B7", ' ', miniTestData.totalQuestions, " ta savol"] }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }, children: new Date(miniTestData.endTime || miniTestData.createdAt).toLocaleString('uz-UZ', {
                                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                                    }) })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: {
                                                        fontWeight: 900, fontSize: 24,
                                                        color: miniTestData.scorePercent >= 70 ? 'var(--g)' :
                                                            miniTestData.scorePercent >= 50 ? 'var(--y)' : 'var(--r)',
                                                    }, children: [miniTestData.scorePercent, "%"] }), _jsx("div", { style: { fontSize: 9, color: 'var(--txt-3)' }, children: "natija \u2192" })] })] }) })] }))] }), _jsx("div", { className: "section-title", children: "Keyingi qadam" }), _jsxs("div", { style: { padding: '0 20px', display: 'grid', gap: 10 }, children: [_jsxs("button", { onClick: () => navigate(`/personal-tests/${id}/review`), style: cardBtn(false), children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83D\uDCCA" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: "Savollarni ko'rish" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Har bir savol va javob tahlili" })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--txt-3)' }, children: "\u2192" })] }), !isMini && (_jsxs("button", { onClick: () => navigate(`/personal-tests/${id}/explain`), disabled: !hasErrors, style: {
                            ...cardBtn(hasErrors),
                            background: hasErrors ? 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(167,139,250,0.05))' : 'var(--s2)',
                            border: `1.5px solid ${hasErrors ? 'rgba(123,104,238,0.3)' : 'var(--f)'}`,
                            opacity: hasErrors ? 1 : 0.5,
                            cursor: hasErrors ? 'pointer' : 'default',
                        }, children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83C\uDFAF" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: hasErrors ? "Xatolar bilan rivojlanish" : "Xatosiz a'lo natija!" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: hasErrors
                                            ? `${wrongCount} ta xato · AI tushuntirish + mini-test`
                                            : 'Barcha javoblar to\'g\'ri' })] }), _jsx("div", { style: { fontSize: 18, color: hasErrors ? 'var(--acc-l)' : 'var(--txt-3)' }, children: "\u2192" })] })), _jsxs("button", { onClick: () => navigate('/tarix'), style: cardBtn(false), children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83D\uDCDA" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14, color: 'var(--g)' }, children: "\u2713 Tarixga saqlandi" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Tarix bo'limidan ko'rishingiz mumkin" })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--txt-3)' }, children: "\u2192" })] })] }), _jsx("div", { style: { padding: '24px 20px' }, children: _jsx("button", { onClick: () => navigate(state.folderId ? `/ombor/folder/${state.folderId}` : '/testlar'), className: "btn btn-ghost btn-block", children: state.folderId ? '🏛 Papkaga qaytish' : "Testlar sahifasiga qaytish" }) })] }));
}
function cardBtn(_active) {
    return {
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
    };
}
