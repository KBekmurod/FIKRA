import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { personalTestApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import RichText from '../components/RichText';
import '../components/RichText.css';
import './PersonalTestRunPage.css';
export default function PersonalTestRunPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const state = location.state;
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [selectedOption, setSelectedOption] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [meta, setMeta] = useState({ subjectName: '', testType: 'material' });
    const timerRef = useRef(null);
    useEffect(() => {
        // State'dan yoki API'dan yuklash
        if (state?.questions?.length) {
            setQuestions(state.questions);
            setTimeLeft(state.durationSeconds || state.questions.length * 60);
            setMeta({ subjectName: state.subjectName, testType: state.testType || 'material' });
        }
        else if (id) {
            // State yo'q — review oxiriga yuborilsin
            personalTestApi.review(id).then(({ data }) => {
                const t = data.test;
                if (t.status === 'completed') {
                    navigate(`/personal-tests/${id}/result`, { state: t, replace: true });
                }
                else {
                    setQuestions(t.questions || []);
                    setTimeLeft((t.questions?.length || 10) * 60);
                    setMeta({ subjectName: t.subjectName, testType: t.testType });
                }
            }).catch(() => {
                toast.error("Test topilmadi");
                navigate(-1);
            });
        }
    }, [id]);
    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || questions.length === 0)
            return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    onFinish(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current)
            clearInterval(timerRef.current); };
    }, [questions.length]);
    const currentQ = questions[currentIdx];
    const currentAnswer = currentQ ? answers[currentQ.idx] : undefined;
    const onAnswer = async (optionIdx) => {
        if (!currentQ || currentAnswer || submitting || !id)
            return;
        setSelectedOption(optionIdx);
        setSubmitting(true);
        try {
            const { data } = await personalTestApi.answer(id, currentQ.idx, optionIdx);
            setAnswers(prev => ({
                ...prev,
                [currentQ.idx]: {
                    selected: optionIdx,
                    isCorrect: data.isCorrect,
                    correctIndex: data.correctIndex,
                    explanation: data.explanation,
                }
            }));
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Xatolik");
            setSelectedOption(null);
        }
        finally {
            setSubmitting(false);
        }
    };
    const onNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
            setSelectedOption(null);
        }
        else {
            onFinish();
        }
    };
    const onPrev = () => {
        if (currentIdx > 0) {
            setCurrentIdx(prev => prev - 1);
            setSelectedOption(null);
        }
    };
    const onFinish = async (auto = false) => {
        if (!id || finishing)
            return;
        setFinishing(true);
        try {
            const { data } = await personalTestApi.finish(id);
            if (auto)
                toast.info("Vaqt tugadi!");
            navigate(`/personal-tests/${id}/result`, { state: data, replace: true });
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Yakunlashda xatolik");
            setFinishing(false);
        }
    };
    if (questions.length === 0) {
        return _jsx("div", { className: "loading-overlay", children: _jsx("div", { className: "big-spinner" }) });
    }
    const progress = ((currentIdx + 1) / questions.length) * 100;
    const answeredCount = Object.keys(answers).length;
    return (_jsxs("div", { className: "pt-run-page", children: [_jsxs("div", { className: "run-header", children: [_jsxs("div", { className: "run-info", children: [_jsx("div", { className: "run-subject", children: meta.subjectName }), _jsxs("div", { className: "run-progress", children: ["Savol ", currentIdx + 1, " / ", questions.length, meta.testType === 'mini' && _jsx("span", { className: "badge-mini", children: "\uD83C\uDFAF Mini" })] })] }), _jsxs("div", { className: "run-timer", children: ["\u23F1 ", Math.floor(timeLeft / 60), ":", String(timeLeft % 60).padStart(2, '0')] })] }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress-fill", style: { width: `${progress}%` } }) }), _jsxs("div", { className: "question-card", children: [currentQ.topic && _jsxs("div", { className: "question-topic", children: ["\uD83D\uDCCD ", currentQ.topic] }), _jsx("div", { className: "question-text", children: _jsx(RichText, { content: currentQ.question }) }), _jsx("div", { className: "options-list", children: currentQ.options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i); // A, B, C, D
                            let cls = "option-btn";
                            if (currentAnswer) {
                                if (i === currentAnswer.correctIndex)
                                    cls += " correct";
                                else if (i === currentAnswer.selected && !currentAnswer.isCorrect)
                                    cls += " wrong";
                                else
                                    cls += " disabled";
                            }
                            else if (selectedOption === i) {
                                cls += " submitting";
                            }
                            return (_jsxs("button", { className: cls, disabled: !!currentAnswer || submitting, onClick: () => onAnswer(i), children: [_jsx("span", { className: "option-letter", children: letter }), _jsx("span", { className: "option-text", children: _jsx(RichText, { content: opt, inline: true }) })] }, i));
                        }) }), currentAnswer && (_jsxs("div", { className: `feedback ${currentAnswer.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`, children: [_jsx("div", { className: "feedback-title", children: currentAnswer.isCorrect ? '✅ To\'g\'ri javob!' : '❌ Noto\'g\'ri' }), currentAnswer.explanation && (_jsx("div", { className: "feedback-text", children: currentAnswer.explanation }))] }))] }), _jsxs("div", { className: "run-nav", children: [_jsx("button", { className: "nav-btn-secondary", onClick: onPrev, disabled: currentIdx === 0, children: "\u2190 Oldingi" }), _jsxs("div", { className: "nav-counter", children: [answeredCount, "/", questions.length, " javob"] }), currentIdx < questions.length - 1 ? (_jsx("button", { className: "nav-btn-primary", onClick: onNext, children: "Keyingi \u2192" })) : (_jsx("button", { className: "nav-btn-primary finish", onClick: () => onFinish(), disabled: finishing, children: finishing ? "..." : "Yakunlash ✓" }))] })] }));
}
