import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import RichText from '../components/RichText';
import '../components/RichText.css';
export default function PersonalTestExplainPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const goBack = useGoBack(`/personal-tests/${id}/result`);
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [wrongs, setWrongs] = useState([]);
    const [test, setTest] = useState(null);
    const [generatingMini, setGeneratingMini] = useState(false);
    const [folderInfo, setFolderInfo] = useState(null);
    useEffect(() => {
        if (!id)
            return;
        api.get(`/api/personal-tests/${id}`)
            .then(({ data }) => {
            const t = data.test;
            setTest(t);
            // Xato javoblarni yig'amiz
            // QUSUR TUZATILDI: backend field nomi 'questionIdx' (qIdx emas)
            const ws = [];
            for (const ans of (t.answers || [])) {
                // Ikkala variantni qo'llab-quvvatlaymiz (backward compat)
                const ansIdx = ans.questionIdx ?? ans.qIdx;
                if (!ans.isCorrect && ansIdx !== undefined) {
                    const q = t.questions.find((qq) => qq.idx === ansIdx);
                    if (q) {
                        ws.push({
                            qIdx: q.idx,
                            question: q.question,
                            options: q.options,
                            selected: ans.selectedOption ?? ans.selected,
                            correct: q.answer,
                            topic: q.topic,
                            aiExplanation: q.explanation,
                        });
                    }
                }
            }
            setWrongs(ws);
            if (t.folderId) {
                api.get(`/api/folders/${t.folderId}`).then(({ data: f }) => {
                    setFolderInfo(f.folder);
                }).catch(() => { });
            }
        })
            .catch(() => toast.error("Yuklab bo'lmadi"))
            .finally(() => setLoading(false));
    }, [id]);
    // AI batafsil tushuntirish
    const requestAiExplain = async (idx) => {
        setWrongs(prev => prev.map(w => w.qIdx === idx ? { ...w, loadingAi: true } : w));
        try {
            const { data } = await api.post(`/api/personal-tests/${id}/explain`, {
                qIdx: idx,
            });
            setWrongs(prev => prev.map(w => w.qIdx === idx
                ? { ...w, aiExplanation: data.explanation, loadingAi: false }
                : w));
        }
        catch (e) {
            toast.error(e?.response?.data?.error || "AI tushuntirish xato");
            setWrongs(prev => prev.map(w => w.qIdx === idx ? { ...w, loadingAi: false } : w));
        }
    };
    // Mini-test yaratish (1 marta universal qoidasi):
    // - material test: folder.miniTestGenerated
    // - ai_blok/ai_free test: test.miniTestId
    const startMiniTest = async () => {
        if (!id || !test)
            return;
        setGeneratingMini(true);
        try {
            // Mavjud mini-test bormi? (universal check)
            const hasMini = test.miniTestId || (folderInfo?.miniTestId && folderInfo?.miniTestGenerated);
            if (hasMini) {
                const miniId = test.miniTestId || folderInfo?.miniTestId;
                toast.info("Mini-test allaqachon yaratilgan");
                navigate(`/personal-tests/${miniId}/result`);
                return;
            }
            // Yangi mini-test yaratish
            const wrongAnswers = wrongs.map(w => ({
                question: w.question,
                options: w.options,
                userAnswer: w.selected,
                correctAnswer: w.correct,
                topic: w.topic,
            }));
            const { data } = await api.post('/api/personal-tests/mini', {
                sourceTestId: id,
                subjectId: test.subjectId,
                wrongAnswers,
            }, { timeout: 90000 }); // 90s — AI yaratish vaqti
            // QUSUR TUZATILDI: testId obyekt bo'lishi mumkin, string'ga aylantiramiz
            const newTestId = typeof data.testId === 'object'
                ? data.testId?._id || String(data.testId)
                : data.testId;
            navigate(`/personal-tests/${newTestId}/run`, {
                state: {
                    testId: newTestId,
                    subjectId: data.subjectId,
                    subjectName: data.subjectName,
                    totalQuestions: data.totalQuestions,
                    durationSeconds: data.durationSeconds || data.totalQuestions * 60,
                    questions: data.questions,
                    folderId: test.folderId,
                },
            });
        }
        catch (e) {
            const errData = e?.response?.data;
            const status = e?.response?.status;
            // QUSUR TUZATILDI: 409 — mini-test allaqachon bor → mavjud testga yo'naltir
            if (status === 409 && errData?.existingMiniTestId) {
                const existingId = typeof errData.existingMiniTestId === 'object'
                    ? errData.existingMiniTestId._id || String(errData.existingMiniTestId)
                    : errData.existingMiniTestId;
                toast.info("Mini-test allaqachon yaratilgan");
                navigate(`/personal-tests/${existingId}/result`, { replace: true });
                return;
            }
            // Timeout xatosi — foydalanuvchi tushunadigan xabar
            if (e?.code === 'ECONNABORTED' || e?.message?.includes('timeout')) {
                toast.error("AI hozir sekin javob bermoqda. Iltimos 30 soniyadan keyin tarixdan tekshiring — test allaqachon yaratilgan bo'lishi mumkin.");
            }
            else {
                toast.error(errData?.error || "Mini-test yaratishda xato");
            }
        }
        finally {
            setGeneratingMini(false);
        }
    };
    if (loading) {
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: _jsx("div", { className: "spin", style: { margin: '0 auto' } }) });
    }
    if (wrongs.length === 0) {
        return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                                background: 'none', border: 'none', color: 'var(--txt-2)',
                                fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                            }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 15 }, children: "\uD83C\uDFAF Xatolar bilan rivojlanish" })] }), _jsxs("div", { style: { padding: 40, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 48 }, children: "\uD83C\uDF89" }), _jsx("p", { style: { marginTop: 12, fontSize: 14, color: 'var(--txt-2)' }, children: "A'lo! Sizda xato javob yo'q." })] })] }));
    }
    const miniAlreadyGenerated = !!test?.miniTestId || !!folderInfo?.miniTestGenerated;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 15 }, children: "\uD83C\uDFAF Xatolar bilan rivojlanish" })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsxs("div", { style: {
                            padding: 12,
                            background: 'rgba(255,95,126,0.08)',
                            border: '1px solid rgba(255,95,126,0.25)',
                            borderRadius: 10,
                            fontSize: 11.5,
                            color: 'var(--txt-2)',
                            marginBottom: 14,
                            lineHeight: 1.5,
                        }, children: ["\uD83D\uDCCB Quyida ", _jsxs("strong", { children: [wrongs.length, " ta xato"] }), " javob. AI har biri uchun tushuntirish berishi mumkin, so'ngra", _jsx("strong", { children: " mini-test " }), " ishlasangiz xatolaringizni mustahkamlaysiz."] }), _jsx("div", { style: { display: 'grid', gap: 12 }, children: wrongs.map(w => (_jsxs("div", { style: {
                                background: 'var(--s1)',
                                border: '1px solid rgba(255,95,126,0.25)',
                                borderRadius: 12,
                                padding: 14,
                            }, children: [_jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, marginBottom: 6 }, children: ["SAVOL #", w.qIdx + 1, w.topic ? ` · ${w.topic}` : ''] }), _jsx("div", { style: { fontSize: 13, lineHeight: 1.5, marginBottom: 10 }, children: _jsx(RichText, { content: w.question }) }), _jsx("div", { style: { display: 'grid', gap: 5, marginBottom: 10 }, children: w.options.map((opt, i) => {
                                        const isC = i === w.correct;
                                        const isU = i === w.selected;
                                        let bg = 'var(--s2)';
                                        let border = '1px solid var(--f)';
                                        let color = 'var(--txt-2)';
                                        if (isC) {
                                            bg = 'rgba(0,212,170,0.12)';
                                            border = '1px solid rgba(0,212,170,0.35)';
                                            color = 'var(--g)';
                                        }
                                        else if (isU) {
                                            bg = 'rgba(255,95,126,0.12)';
                                            border = '1px solid rgba(255,95,126,0.35)';
                                            color = 'var(--r)';
                                        }
                                        return (_jsxs("div", { style: {
                                                background: bg, border, color,
                                                borderRadius: 8, padding: '7px 10px',
                                                fontSize: 12, display: 'flex', gap: 8,
                                            }, children: [_jsx("span", { style: { fontWeight: 800, minWidth: 16 }, children: ['A', 'B', 'C', 'D'][i] }), _jsx("span", { style: { flex: 1 }, children: _jsx(RichText, { content: opt, inline: true }) }), isC && _jsx("span", { style: { fontSize: 11 }, children: "\u2713 to'g'ri" }), isU && !isC && _jsx("span", { style: { fontSize: 11 }, children: "\u2190 siz" })] }, i));
                                    }) }), w.aiExplanation ? (_jsxs("div", { style: {
                                        background: 'rgba(123,104,238,0.08)',
                                        border: '1px solid rgba(123,104,238,0.2)',
                                        borderRadius: 8,
                                        padding: 10,
                                        fontSize: 11.5,
                                        color: 'var(--txt-2)',
                                        lineHeight: 1.55,
                                    }, children: [_jsx("div", { style: { fontSize: 9.5, fontWeight: 700, color: 'var(--acc-l)', marginBottom: 4, letterSpacing: 0.5 }, children: "\uD83E\uDD16 AI TUSHUNTIRISHI" }), _jsx(RichText, { content: w.aiExplanation, inline: true })] })) : (_jsx("button", { onClick: () => requestAiExplain(w.qIdx), disabled: w.loadingAi, style: {
                                        background: 'rgba(123,104,238,0.08)',
                                        border: '1px solid rgba(123,104,238,0.2)',
                                        color: 'var(--acc-l)',
                                        borderRadius: 8,
                                        padding: '8px 12px',
                                        fontSize: 11.5,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        width: '100%',
                                    }, children: w.loadingAi ? '⏳ AI yozmoqda...' : '🤖 AI batafsil tushuntirsin' }))] }, w.qIdx))) }), _jsxs("div", { style: {
                            marginTop: 18,
                            padding: 14,
                            background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(0,212,170,0.05))',
                            border: '1px solid rgba(123,104,238,0.3)',
                            borderRadius: 14,
                        }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 4 }, children: "\uD83C\uDFAF Mini-test orqali mustahkamlash" }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 10, lineHeight: 1.5 }, children: ["AI sizning xatolaringizdan o'xshash savollar yaratadi va siz ishlaysiz.", miniAlreadyGenerated && _jsxs(_Fragment, { children: [" ", _jsx("strong", { style: { color: 'var(--y)' }, children: "Allaqachon yaratilgan" }), " \u2014 qayta yaratib bo'lmaydi."] })] }), _jsx("button", { onClick: startMiniTest, disabled: generatingMini || miniAlreadyGenerated, style: {
                                    width: '100%',
                                    background: miniAlreadyGenerated ? 'var(--s2)' : 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                                    color: miniAlreadyGenerated ? 'var(--txt-3)' : 'white',
                                    border: 'none',
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    fontSize: 13,
                                    fontWeight: 800,
                                    cursor: (generatingMini || miniAlreadyGenerated) ? 'default' : 'pointer',
                                    opacity: generatingMini ? 0.6 : 1,
                                }, children: generatingMini
                                    ? '⏳ Yaratilmoqda...'
                                    : miniAlreadyGenerated
                                        ? '✓ Allaqachon yaratilgan'
                                        : '🚀 Mini-test boshlash' })] }), _jsx("div", { style: { height: 30 } })] })] }));
}
