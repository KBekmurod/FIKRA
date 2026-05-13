import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { personalTestApi } from '../api/endpoints';
import { GRADE_META } from '../constants/subjects';
import { useToast } from '../components/Toast';
import RichText from '../components/RichText';
import '../components/RichText.css';
import './PersonalTestResultPage.css';
export default function PersonalTestResultPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const state = location.state;
    const [result, setResult] = useState(state);
    const [review, setReview] = useState(null);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [generatingMini, setGeneratingMini] = useState(false);
    const [showReview, setShowReview] = useState(false);
    // If we navigated here directly, fetch the result
    useEffect(() => {
        if (!result && id) {
            personalTestApi.review(id).then(({ data }) => {
                const t = data.test;
                setResult({
                    testId: t._id,
                    subjectId: t.subjectId,
                    subjectName: t.subjectName,
                    testType: t.testType,
                    totalCorrect: t.totalCorrect,
                    totalQuestions: t.totalQuestions,
                    scorePercent: t.scorePercent,
                    level: null,
                });
            });
        }
    }, [id]);
    const loadReview = async () => {
        if (!id || review) {
            setShowReview(true);
            return;
        }
        setReviewLoading(true);
        try {
            const { data } = await personalTestApi.review(id);
            setReview(data.test);
            setShowReview(true);
        }
        catch (e) {
            toast.error("Tahlilni yuklab bo'lmadi");
        }
        finally {
            setReviewLoading(false);
        }
    };
    const generateMini = async () => {
        if (!review || !result)
            return;
        setGeneratingMini(true);
        try {
            // Xato javoblar
            const wrong = review.questions
                .map((q, idx) => ({
                ...q,
                correctAnswer: q.answer,
                userAnswer: review.answers.find((a) => a.questionIdx === idx)?.selectedOption,
            }))
                .filter((q) => q.userAnswer !== undefined && q.userAnswer !== q.correctAnswer);
            if (wrong.length === 0) {
                toast.info("Xato javob yo'q - mini-test kerak emas");
                setGeneratingMini(false);
                return;
            }
            const { data } = await personalTestApi.generateMini(result.subjectId, wrong);
            navigate(`/personal-tests/${data.testId}/run`, { state: data });
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Mini-test yaratishda xatolik");
        }
        finally {
            setGeneratingMini(false);
        }
    };
    if (!result)
        return _jsx("div", { className: "loading-overlay", children: _jsx("div", { className: "big-spinner" }) });
    const score = result.scorePercent;
    const scoreClass = score >= 70 ? 'excellent' : score >= 50 ? 'good' : 'low';
    return (_jsxs("div", { className: "result-page", children: [_jsxs("header", { className: "result-header", children: [_jsx("button", { className: "btn-back", onClick: () => navigate(`/subjects/${result.subjectId}`), children: "\u2190" }), _jsx("h1", { children: result.testType === 'mini' ? '🎯 Mini-test natijasi' : '📊 Test natijasi' })] }), _jsxs("div", { className: `score-card ${scoreClass}`, children: [_jsx("div", { className: "score-icon", children: score >= 90 ? '🏆' : score >= 70 ? '🎉' : score >= 50 ? '👍' : '💪' }), _jsxs("div", { className: "score-percent", children: [score, "%"] }), _jsxs("div", { className: "score-detail", children: [result.totalCorrect, " / ", result.totalQuestions, " to'g'ri"] }), _jsxs("div", { className: "score-message", children: [score >= 90 && "Zo'r natija! Davom et!", score >= 70 && score < 90 && "Yaxshi! Yana sa'y-harakat qil!", score >= 50 && score < 70 && "O'rtacha. Mavzularni qaytar.", score < 50 && "Xato savollarni o'rganib, qaytadan urinib ko'r."] })] }), result.level && result.level.levelUp && (_jsxs("div", { className: "level-up-banner", children: [_jsx("span", { className: "level-up-icon", children: "\u2B06\uFE0F" }), _jsxs("div", { children: [_jsx("div", { className: "level-up-title", children: "Daraja oshdi!" }), _jsxs("div", { className: "level-up-text", children: ["v", result.level.versionBefore, " \u2192 ", _jsxs("strong", { children: ["v", result.level.versionAfter] }), ' ', _jsxs("span", { style: { color: GRADE_META[result.level.gradeAfter]?.color || '#fff' }, children: ["(", GRADE_META[result.level.gradeAfter]?.name || result.level.gradeAfter, ")"] })] })] })] })), _jsxs("div", { className: "result-actions", children: [_jsx("button", { className: "result-btn", onClick: loadReview, disabled: reviewLoading, children: reviewLoading ? "Yuklanmoqda..." : "🔍 Tahlil ko'rish" }), result.testType !== 'mini' && (_jsx("button", { className: "result-btn primary", onClick: generateMini, disabled: generatingMini, children: generatingMini ? "Yaratilmoqda..." : "🎯 Xato savollardan mini-test" })), _jsx("button", { className: "result-btn", onClick: () => navigate(`/subjects/${result.subjectId}`), children: "\uD83C\uDFE0 Fan sahifasiga qaytish" })] }), showReview && review && (_jsxs("div", { className: "review-section", children: [_jsx("h2", { children: "\uD83D\uDCCB Savollar tahlili" }), review.questions.map((q, idx) => {
                        const ua = review.answers.find((a) => a.questionIdx === idx);
                        const isCorrect = ua?.isCorrect;
                        const skipped = !ua;
                        return (_jsxs("div", { className: `review-q ${isCorrect ? 'correct' : skipped ? 'skipped' : 'wrong'}`, children: [_jsxs("div", { className: "review-q-header", children: [_jsxs("span", { className: "review-q-num", children: ["#", idx + 1] }), q.topic && _jsxs("span", { className: "review-q-topic", children: ["\uD83D\uDCCD ", q.topic] }), _jsx("span", { className: `review-q-status ${isCorrect ? 'correct' : skipped ? 'skipped' : 'wrong'}`, children: isCorrect ? '✓ To\'g\'ri' : skipped ? '⊘ O\'tkazilgan' : '✗ Xato' })] }), _jsx("div", { className: "review-q-text", children: _jsx(RichText, { content: q.question }) }), _jsx("div", { className: "review-options", children: q.options.map((opt, i) => {
                                        const letter = String.fromCharCode(65 + i);
                                        let cls = "review-option";
                                        if (i === q.answer)
                                            cls += " correct";
                                        if (ua && i === ua.selectedOption && !isCorrect)
                                            cls += " user-wrong";
                                        return (_jsxs("div", { className: cls, children: [_jsx("span", { className: "opt-letter", children: letter }), _jsx("span", { children: _jsx(RichText, { content: opt, inline: true }) }), i === q.answer && _jsx("span", { className: "opt-mark", children: "\u2713" })] }, i));
                                    }) }), q.explanation && !isCorrect && (_jsx("div", { className: "review-explanation", children: _jsxs("div", { className: "exp-section", children: [_jsx("div", { className: "exp-label", children: "\uD83C\uDFAF Nega to'g'ri javob?" }), _jsx("div", { className: "exp-text", children: _jsx(RichText, { content: q.explanation }) })] }) }))] }, idx));
                    })] }))] }));
}
