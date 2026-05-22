import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import RichText from '../components/RichText';
import '../components/RichText.css';
const PAGE_SIZE = 10;
export default function PersonalTestReviewPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const goBack = useGoBack(`/personal-tests/${id}/result`);
    const toast = useToast();
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [filter, setFilter] = useState('all');
    useEffect(() => {
        if (!id)
            return;
        api.get(`/api/personal-tests/${id}`)
            .then(({ data }) => setTest(data.test))
            .catch(() => toast.error("Yuklab bo'lmadi"))
            .finally(() => setLoading(false));
    }, [id]);
    if (loading || !test) {
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: _jsx("div", { className: "spin", style: { margin: '0 auto' } }) });
    }
    const questions = test.questions || [];
    const answers = (test.answers || []).reduce((acc, a) => {
        // QUSUR TUZATILDI: backend 'questionIdx' qaytaradi, 'qIdx' emas
        const idx = a.questionIdx ?? a.qIdx;
        if (idx !== undefined) {
            acc[idx] = {
                qIdx: idx,
                selected: a.selectedOption ?? a.selected,
                isCorrect: a.isCorrect,
            };
        }
        return acc;
    }, {});
    // Filter
    const filtered = questions.filter(q => {
        if (filter === 'all')
            return true;
        const ans = answers[q.idx];
        if (filter === 'correct')
            return ans?.isCorrect;
        if (filter === 'wrong')
            return !ans?.isCorrect;
        return true;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageQuestions = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 15 }, children: "\uD83D\uDCCA Savollarni ko'rish" })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsxs("div", { className: "seg-tabs", children: [_jsxs("button", { className: `seg-tab ${filter === 'all' ? 'active' : ''}`, onClick: () => { setFilter('all'); setPage(0); }, children: ["Barchasi (", questions.length, ")"] }), _jsxs("button", { className: `seg-tab ${filter === 'correct' ? 'active' : ''}`, onClick: () => { setFilter('correct'); setPage(0); }, children: ["\u2713 To'g'ri (", test.totalCorrect, ")"] }), _jsxs("button", { className: `seg-tab ${filter === 'wrong' ? 'active' : ''}`, onClick: () => { setFilter('wrong'); setPage(0); }, children: ["\u2717 Xato (", test.totalQuestions - test.totalCorrect, ")"] })] }), _jsx("div", { style: { display: 'grid', gap: 12 }, children: pageQuestions.map(q => {
                            const ans = answers[q.idx];
                            const isCorrect = ans?.isCorrect;
                            const userPick = ans?.selected ?? null;
                            const correct = q.answer;
                            return (_jsxs("div", { style: {
                                    background: 'var(--s1)',
                                    border: `1.5px solid ${isCorrect ? 'rgba(0,212,170,0.3)' : 'rgba(255,95,126,0.3)'}`,
                                    borderRadius: 12,
                                    padding: 14,
                                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsx("span", { style: {
                                                    fontSize: 11, fontWeight: 800,
                                                    padding: '2px 8px', borderRadius: 100,
                                                    background: isCorrect ? 'rgba(0,212,170,0.15)' : 'rgba(255,95,126,0.15)',
                                                    color: isCorrect ? 'var(--g)' : 'var(--r)',
                                                }, children: isCorrect ? '✓ To\'g\'ri' : '✗ Xato' }), _jsxs("span", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }, children: ["#", q.idx + 1] }), q.topic && _jsxs("span", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: ["\u00B7 ", q.topic] })] }), _jsx("div", { style: { fontSize: 13, lineHeight: 1.5, marginBottom: 10 }, children: _jsx(RichText, { content: q.question }) }), _jsx("div", { style: { display: 'grid', gap: 5 }, children: q.options.map((opt, i) => {
                                            const isC = i === correct;
                                            const isU = i === userPick;
                                            let bg = 'var(--s2)';
                                            let border = '1px solid var(--f)';
                                            let color = 'var(--txt-2)';
                                            if (isC) {
                                                bg = 'rgba(0,212,170,0.12)';
                                                border = '1px solid rgba(0,212,170,0.35)';
                                                color = 'var(--g)';
                                            }
                                            else if (isU && !isC) {
                                                bg = 'rgba(255,95,126,0.12)';
                                                border = '1px solid rgba(255,95,126,0.35)';
                                                color = 'var(--r)';
                                            }
                                            return (_jsxs("div", { style: {
                                                    background: bg, border, color,
                                                    borderRadius: 8,
                                                    padding: '8px 10px',
                                                    fontSize: 12,
                                                    display: 'flex', gap: 8,
                                                }, children: [_jsx("span", { style: { fontWeight: 800, minWidth: 16 }, children: ['A', 'B', 'C', 'D'][i] }), _jsx("span", { style: { flex: 1 }, children: _jsx(RichText, { content: opt, inline: true }) }), isC && _jsx("span", { style: { fontSize: 11 }, children: "\u2713" }), isU && !isC && _jsx("span", { style: { fontSize: 11 }, children: "\u2190 siz" })] }, i));
                                        }) }), q.explanation && (_jsxs("div", { style: {
                                            marginTop: 10, padding: 10,
                                            background: 'rgba(123,104,238,0.06)',
                                            borderRadius: 8,
                                            fontSize: 11,
                                            color: 'var(--txt-2)',
                                            lineHeight: 1.5,
                                        }, children: ["\uD83D\uDCA1 ", _jsx(RichText, { content: q.explanation, inline: true })] }))] }, q.idx));
                        }) }), totalPages > 1 && (_jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }, children: [_jsx("button", { onClick: () => setPage(p => Math.max(0, p - 1)), disabled: page === 0, className: "btn btn-ghost", style: { opacity: page === 0 ? 0.4 : 1 }, children: "\u2190 Oldingi" }), _jsxs("div", { style: {
                                    padding: '8px 14px', background: 'var(--s2)', borderRadius: 8,
                                    fontSize: 11, color: 'var(--txt-2)', fontWeight: 700,
                                }, children: [page + 1, " / ", totalPages] }), _jsx("button", { onClick: () => setPage(p => Math.min(totalPages - 1, p + 1)), disabled: page >= totalPages - 1, className: "btn btn-ghost", style: { opacity: page >= totalPages - 1 ? 0.4 : 1 }, children: "Keyingi \u2192" })] })), _jsx("div", { style: { height: 30 } })] })] }));
}
