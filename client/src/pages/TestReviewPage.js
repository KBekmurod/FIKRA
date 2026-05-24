import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import RichText from '../components/RichText';
import '../components/RichText.css';
const PAGE_SIZE = 10;
export default function TestReviewPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/tarix');
    const { sessionId } = useParams();
    const location = useLocation();
    const toast = useToast();
    const initial = location.state;
    const [data, setData] = useState(initial || null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [page, setPage] = useState(1);
    useEffect(() => {
        if (!sessionId)
            return;
        examApi.review(sessionId)
            .then(({ data }) => {
            setData(prev => ({ ...prev, ...(data.session || data) }));
            setAnswers(data.answers || []);
        })
            .catch(() => toast.error("Ma'lumotlar yuklanmadi"))
            .finally(() => setLoading(false));
    }, [sessionId]);
    if (loading || !data) {
        return (_jsx("div", { style: { padding: 20 }, children: _jsx("div", { className: "skel-card" }) }));
    }
    const breakdown = data.subjectBreakdown || [];
    const filtered = subjectFilter === 'all'
        ? answers
        : answers.filter((a) => a.subject === subjectFilter || a.subjectId === subjectFilter);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "\uD83D\uDCCA Natijalar" })] }), _jsxs("div", { style: { padding: '8px 20px 0' }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }, children: "FAN BO'YICHA" }), _jsx("div", { style: { display: 'grid', gap: 6 }, children: breakdown.map((b, i) => {
                            const acc = b.questionCount > 0 ? Math.round((b.correct / b.questionCount) * 100) : 0;
                            return (_jsxs("div", { style: {
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    borderRadius: 10,
                                    padding: '11px 14px',
                                }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 }, children: [_jsx("span", { style: { fontWeight: 700, fontSize: 13 }, children: b.subjectName }), _jsxs("span", { style: { fontSize: 12, color: acc >= 70 ? 'var(--g)' : acc >= 50 ? 'var(--y)' : 'var(--r)', fontWeight: 700 }, children: [b.correct, "/", b.questionCount, " \u00B7 ", acc, "%"] })] }), _jsx("div", { style: { height: 4, background: 'var(--s2)', borderRadius: 100 }, children: _jsx("div", { style: {
                                                height: '100%',
                                                width: `${acc}%`,
                                                background: acc >= 70 ? 'var(--g)' : acc >= 50 ? 'var(--y)' : 'var(--r)',
                                                borderRadius: 100,
                                            } }) }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 4 }, children: [b.score.toFixed(1), " / ", b.maxScore.toFixed(1), " ball"] })] }, i));
                        }) }), _jsxs("div", { style: {
                            marginTop: 12, padding: 12,
                            background: 'rgba(123,104,238,0.08)',
                            border: '1px solid rgba(123,104,238,0.2)',
                            borderRadius: 10,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }, children: [_jsx("span", { style: { fontSize: 12, fontWeight: 700, color: 'var(--txt)' }, children: "UMUMIY" }), _jsxs("span", { style: { fontSize: 14, fontWeight: 800, color: 'var(--acc-l)' }, children: [data.totalScore?.toFixed(1) || 0, " / ", data.maxTotalScore?.toFixed(1) || 0, " \u00B7 ", data.percent || 0, "%"] })] })] }), answers.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "section-title", children: ["Barcha savollar (", filtered.length, ")"] }), _jsxs("div", { style: { padding: '0 20px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }, children: [_jsx("button", { onClick: () => { setSubjectFilter('all'); setPage(1); }, style: {
                                    background: subjectFilter === 'all' ? 'var(--acc)' : 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    color: subjectFilter === 'all' ? 'white' : 'var(--txt-2)',
                                    fontSize: 11, fontWeight: 700,
                                    padding: '6px 12px', borderRadius: 100,
                                    cursor: 'pointer',
                                }, children: "Hammasi" }), breakdown.map((b) => (_jsx("button", { onClick: () => { setSubjectFilter(b.subjectId); setPage(1); }, style: {
                                    background: subjectFilter === b.subjectId ? 'var(--acc)' : 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    color: subjectFilter === b.subjectId ? 'white' : 'var(--txt-2)',
                                    fontSize: 11, fontWeight: 700,
                                    padding: '6px 12px', borderRadius: 100,
                                    cursor: 'pointer',
                                }, children: b.subjectName }, b.subjectId)))] }), _jsx("div", { style: { padding: '0 20px', display: 'grid', gap: 8 }, children: pageItems.map((a, i) => (_jsx(AnswerCard, { answer: a, index: (page - 1) * PAGE_SIZE + i }, a._id || i))) }), totalPages > 1 && (_jsxs("div", { style: { padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: 8 }, children: [_jsx("button", { disabled: page === 1, onClick: () => setPage(p => p - 1), className: "btn btn-ghost", style: { opacity: page === 1 ? 0.4 : 1 }, children: "\u2190 Oldingi" }), _jsxs("span", { style: {
                                    padding: '8px 14px',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: 'var(--txt-2)',
                                }, children: [page, "/", totalPages] }), _jsx("button", { disabled: page === totalPages, onClick: () => setPage(p => p + 1), className: "btn btn-ghost", style: { opacity: page === totalPages ? 0.4 : 1 }, children: "Keyingi \u2192" })] }))] })), _jsx("div", { style: { height: 20 } })] }));
}
function AnswerCard({ answer, index }) {
    const [open, setOpen] = useState(false);
    const correct = answer.isCorrect;
    const skipped = answer.selectedOption === null || answer.selectedOption === undefined;
    return (_jsxs("div", { style: {
            background: 'var(--s1)',
            border: `1px solid ${correct ? 'rgba(0,212,170,0.25)' : skipped ? 'var(--f)' : 'rgba(255,95,126,0.25)'}`,
            borderRadius: 12,
            overflow: 'hidden',
        }, children: [_jsxs("button", { onClick: () => setOpen(o => !o), style: {
                    width: '100%', padding: '12px 14px',
                    background: 'none', border: 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--txt)', cursor: 'pointer', textAlign: 'left',
                }, children: [_jsx("span", { style: {
                            width: 24, height: 24, borderRadius: 6,
                            background: correct ? 'rgba(0,212,170,0.15)' : skipped ? 'var(--s2)' : 'rgba(255,95,126,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: correct ? 'var(--g)' : skipped ? 'var(--txt-3)' : 'var(--r)',
                            fontWeight: 800, fontSize: 12,
                        }, children: correct ? '✓' : skipped ? '−' : '✗' }), _jsxs("span", { style: { fontSize: 11, color: 'var(--txt-3)', fontWeight: 700, minWidth: 30 }, children: ["#", index + 1] }), _jsxs("span", { style: { flex: 1, fontSize: 12, lineHeight: 1.5, color: 'var(--txt-2)' }, children: [_jsx(RichText, { content: (answer.questionText || answer.question || '').slice(0, 80), inline: true }), (answer.questionText || answer.question || '').length > 80 && '...'] }), _jsx("span", { style: { color: 'var(--txt-3)', fontSize: 13 }, children: open ? '▲' : '▼' })] }), open && (_jsxs("div", { style: { padding: '0 14px 12px' }, children: [_jsx("div", { style: { fontSize: 12, color: 'var(--txt)', marginBottom: 8, lineHeight: 1.5 }, children: _jsx(RichText, { content: answer.questionText || answer.question }) }), (answer.questionOptions || answer.options || []).map((opt, i) => {
                        let color = 'var(--txt-3)', icon = '';
                        const correctIdx = answer.correctAnswer !== undefined ? answer.correctAnswer : answer.correctIndex;
                        if (i === correctIdx) {
                            color = 'var(--g)';
                            icon = '✓ ';
                        }
                        else if (i === answer.selectedOption && !correct) {
                            color = 'var(--r)';
                            icon = '✗ ';
                        }
                        return (_jsxs("div", { style: { fontSize: 11, color, marginBottom: 4, lineHeight: 1.5 }, children: [icon, _jsxs("span", { style: { fontWeight: 700 }, children: [['A', 'B', 'C', 'D'][i], ")"] }), " ", _jsx(RichText, { content: opt, inline: true })] }, i));
                    })] }))] }));
}
