import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import RichText from '../components/RichText';
import '../components/RichText.css';
export default function TestExplainPage() {
    const navigate = useNavigate();
    const { sessionId, subjectId } = useParams();
    const goBack = useGoBack(sessionId ? `/test-result/${sessionId}` : '/tarix');
    const toast = useToast();
    const location = useLocation();
    const [overview, setOverview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [miniGenerating, setMiniGenerating] = useState(false);
    // Bitta fan tushuntirilayotgan bo'lsa
    const [currentAnswer, setCurrentAnswer] = useState(null);
    const [explanation, setExplanation] = useState(null);
    const [loadingExplain, setLoadingExplain] = useState(false);
    const [explainUsed, setExplainUsed] = useState(false);
    const isOverview = subjectId === '_overview';
    useEffect(() => {
        if (!sessionId)
            return;
        if (isOverview) {
            // Sessiya javoblarini olib, xato bo'lganlarini fan bo'yicha guruhlash
            examApi.review(sessionId)
                .then(({ data }) => {
                const wrongs = (data.answers || []).filter((a) => !a.isCorrect && a.selectedOption !== null);
                const grouped = {};
                for (const a of wrongs) {
                    const sid = a.subject || a.subjectId;
                    if (!grouped[sid]) {
                        grouped[sid] = {
                            subjectId: sid,
                            subjectName: a.subjectName || sid,
                            block: a.block || 'mutaxassislik',
                            count: 0,
                            answers: [],
                        };
                    }
                    grouped[sid].count++;
                    grouped[sid].answers.push(a);
                }
                setOverview(Object.values(grouped));
            })
                .catch(() => toast.error("Yuklanmadi"))
                .finally(() => setLoading(false));
        }
        else {
            // Aniq fan uchun tushuntirish — sessiyadagi xato javoblardan birinchisini ochish
            examApi.review(sessionId)
                .then(({ data }) => {
                const wrongs = (data.answers || [])
                    .filter((a) => !a.isCorrect && (a.subject === subjectId || a.subjectId === subjectId));
                if (wrongs.length > 0) {
                    setCurrentAnswer(wrongs[0]);
                    triggerExplain(wrongs[0]._id);
                }
            })
                .catch(() => toast.error("Yuklanmadi"))
                .finally(() => setLoading(false));
        }
    }, [sessionId, subjectId]);
    const triggerExplain = async (answerId) => {
        setLoadingExplain(true);
        try {
            const { data } = await examApi.cabinetExplain(answerId);
            setExplanation(data);
        }
        catch (e) {
            if (e?.response?.data?.code === 'EXPLAIN_ALREADY_USED') {
                setExplainUsed(true);
                toast.info('Bu fan uchun AI tushuntirish allaqachon olingan');
            }
            else {
                toast.error("AI tushuntirish olishda xatolik");
            }
        }
        finally {
            setLoadingExplain(false);
        }
    };
    const generateMiniTest = async () => {
        if (!sessionId)
            return;
        setMiniGenerating(true);
        try {
            const { data } = await examApi.cabinetMiniTest(undefined, 30, sessionId);
            // Mini-test sessiyasiga o'tish
            navigate(`/test-run/${data.sessionId}`, { state: { ...data, isMini: true } });
        }
        catch (e) {
            if (e?.response?.data?.code === 'MINI_TEST_ALREADY_USED') {
                toast.info('Mini-test allaqachon yaratilgan');
            }
            else {
                toast.error(e?.response?.data?.error || "Mini-test yaratishda xatolik");
            }
        }
        finally {
            setMiniGenerating(false);
        }
    };
    if (loading) {
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: _jsx("div", { className: "spin" }) });
    }
    // ─── OVERVIEW — Fanlar ro'yxati ─────────────────────────────────────────
    if (isOverview) {
        const majburiy = overview.filter(o => ['uztil', 'math', 'tarix'].includes(o.subjectId));
        const mutaxassislik = overview.filter(o => !['uztil', 'math', 'tarix'].includes(o.subjectId));
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                                background: 'none', border: 'none', color: 'var(--txt-2)',
                                fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                            }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "\uD83C\uDFAF Xatolar tahlili" })] }), _jsxs("div", { style: { padding: '8px 20px 0' }, children: [_jsxs("p", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }, children: ["Tushuntirishni ko'rmoqchi bo'lgan fanni bosing. AI batafsil tahlil qiladi (har fan uchun ", _jsx("strong", { children: "1 marta" }), ")."] }), majburiy.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontWeight: 800, fontSize: 11, color: 'var(--g)', letterSpacing: 0.5, margin: '14px 0 8px' }, children: "\uD83D\uDCCC MAJBURIY FANLARDAGI XATOLAR" }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: majburiy.map(s => (_jsx(SubjectCard, { subj: s, onClick: () => navigate(`/test-explain/${sessionId}/${s.subjectId}`) }, s.subjectId))) })] })), mutaxassislik.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontWeight: 800, fontSize: 11, color: 'var(--acc-l)', letterSpacing: 0.5, margin: '18px 0 8px' }, children: "\u2B50 MUTAXASSISLIK FANLARIDAGI XATOLAR" }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: mutaxassislik.map(s => (_jsx(SubjectCard, { subj: s, onClick: () => navigate(`/test-explain/${sessionId}/${s.subjectId}`) }, s.subjectId))) })] })), _jsxs("div", { style: { marginTop: 24, marginBottom: 20 }, children: [_jsx("button", { onClick: generateMiniTest, disabled: miniGenerating, style: {
                                        width: '100%',
                                        background: 'linear-gradient(135deg, var(--y), #fbbf24)',
                                        color: '#0a0a14',
                                        border: 'none',
                                        borderRadius: 14,
                                        padding: '14px 16px',
                                        fontSize: 14,
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                    }, children: miniGenerating ? '⏳ Mini-test yaratilmoqda...' : '🔄 Mini-test yaratish (xatolardan)' }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 6, textAlign: 'center' }, children: ["Majburiy fan: 5 ta, mutaxassislik: 15 ta \u00B7 ", _jsx("strong", { children: "1 marta" })] })] })] })] }));
    }
    // ─── BITTA FAN UCHUN TUSHUNTIRISH ─────────────────────────────────────
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsxs("div", { className: "header-logo", style: { fontSize: 16 }, children: ["\uD83C\uDFAF ", currentAnswer?.subjectName || 'Tushuntirish'] })] }), _jsxs("div", { style: { padding: '8px 20px 24px' }, children: [!currentAnswer && (_jsxs("div", { style: { textAlign: 'center', padding: 40 }, children: [_jsx("div", { style: { fontSize: 40 }, children: "\u2713" }), _jsx("p", { children: "Bu fanda xato yo'q" })] })), currentAnswer && (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    borderRadius: 12,
                                    padding: 14,
                                    marginBottom: 10,
                                }, children: [_jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }, children: ["SAVOL ", currentAnswer.topic ? `· ${currentAnswer.topic}` : ''] }), _jsx("div", { style: { fontSize: 13, lineHeight: 1.6 }, children: _jsx(RichText, { content: currentAnswer.questionText || currentAnswer.question }) })] }), _jsx("div", { style: { display: 'grid', gap: 6, marginBottom: 14 }, children: (currentAnswer.questionOptions || currentAnswer.options || []).map((opt, i) => {
                                    const correctIdx = currentAnswer.correctAnswer ?? currentAnswer.correctIndex;
                                    const isCorrect = i === correctIdx;
                                    const isUser = i === currentAnswer.selectedOption;
                                    let bg = 'var(--s2)', border = 'var(--f)', label = '';
                                    if (isCorrect) {
                                        bg = 'rgba(0,212,170,0.12)';
                                        border = 'var(--g)';
                                        label = "✓ TO'G'RI";
                                    }
                                    else if (isUser) {
                                        bg = 'rgba(255,95,126,0.1)';
                                        border = 'var(--r)';
                                        label = '✗ Siz tanladingiz';
                                    }
                                    return (_jsx("div", { style: {
                                            padding: '10px 12px', background: bg,
                                            border: `1.5px solid ${border}`,
                                            borderRadius: 10, fontSize: 12, lineHeight: 1.5,
                                        }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 10 }, children: [_jsx("span", { style: { fontWeight: 800, color: 'var(--txt-3)', flexShrink: 0 }, children: ['A', 'B', 'C', 'D'][i] }), _jsx("span", { style: { flex: 1 }, children: _jsx(RichText, { content: opt, inline: true }) }), label && (_jsx("span", { style: {
                                                        fontSize: 9, fontWeight: 800,
                                                        color: isCorrect ? 'var(--g)' : 'var(--r)',
                                                        whiteSpace: 'nowrap',
                                                    }, children: label }))] }) }, i));
                                }) }), loadingExplain && (_jsxs("div", { style: {
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    borderRadius: 12,
                                    padding: 20,
                                    textAlign: 'center',
                                }, children: [_jsx("div", { className: "spin", style: { margin: '0 auto 10px' } }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-3)' }, children: "AI tahlil qilmoqda..." })] })), explainUsed && !explanation && (_jsx("div", { style: {
                                    background: 'rgba(255,204,68,0.08)',
                                    border: '1px solid rgba(255,204,68,0.25)',
                                    borderRadius: 12,
                                    padding: 14,
                                    fontSize: 12,
                                    color: 'var(--txt-2)',
                                }, children: "\u26A0\uFE0F Bu test va fan uchun AI tushuntirish allaqachon olingan. Boshqa test ishlab keyingisidan foydalanishingiz mumkin." })), explanation && (_jsxs("div", { style: { display: 'grid', gap: 10 }, children: [_jsx(ContextCard, { icon: "\uD83D\uDCCD", title: "MAVZU", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.08)", content: currentAnswer.topic || explanation.subjectName }), _jsx(ContextCard, { icon: "\uD83E\uDDE0", title: "NEGA TO'G'RI?", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.08)", content: extractSection(explanation.explanation, 'nega') || explanation.explanation }), _jsx(ContextCard, { icon: "\u26A0\uFE0F", title: "CHALG'ITUVCHI USULLAR", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.08)", content: extractSection(explanation.explanation, 'chalg') || "Bu turdagi savollarda noto'g'ri javoblar haqqoniy ko'rinadi. Mavzuni chuqurroq o'rganib, asosiy formulalarga e'tibor bering." }), _jsx(ContextCard, { icon: "\uD83D\uDCA1", title: "XULOSA", color: "#a78bfa", bgColor: "rgba(167, 139, 250, 0.08)", content: extractSection(explanation.explanation, 'xulosa') || "Bu savol orqali o'rgangan asosiy g'oyani eslab qoling — kelajakdagi testlarda yordam beradi." })] }))] }))] })] }));
}
// ─── Subject Card (overview uchun) ──────────────────────────────────────
function SubjectCard({ subj, onClick }) {
    return (_jsxs("button", { onClick: onClick, style: {
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left',
        }, children: [_jsx("div", { style: {
                    background: 'rgba(255,95,126,0.12)',
                    border: '1px solid rgba(255,95,126,0.25)',
                    borderRadius: 100,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                    color: 'var(--r)',
                }, children: subj.count }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: subj.subjectName }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }, children: [subj.count, " ta xato \u00B7 AI tushuntirish uchun bosing"] })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--acc-l)' }, children: "\u2192" })] }));
}
// ─── Kontekstli karta (rangli) ──────────────────────────────────────────
function ContextCard({ icon, title, color, bgColor, content }) {
    return (_jsxs("div", { style: {
            background: bgColor,
            border: `1px solid ${color}40`,
            borderRadius: 12,
            padding: 14,
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsx("span", { style: { fontSize: 16 }, children: icon }), _jsx("span", { style: { fontSize: 11, fontWeight: 800, color, letterSpacing: 0.5 }, children: title })] }), _jsx("div", { style: { fontSize: 13, lineHeight: 1.6, color: 'var(--txt)' }, children: _jsx(RichText, { content: content || '' }) })] }));
}
// AI matnidan bo'lim ajratish (oddiy heuristic)
function extractSection(text, keyword) {
    if (!text)
        return null;
    const lines = text.split('\n');
    const idx = lines.findIndex(l => l.toLowerCase().includes(keyword));
    if (idx === -1)
        return null;
    // Keyingi 1-3 qatorni olish
    return lines.slice(idx, idx + 3).join('\n').trim() || null;
}
