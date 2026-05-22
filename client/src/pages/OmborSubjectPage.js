import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS, getAllowedContexts } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function OmborSubjectPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/ombor');
    const { subjectId } = useParams();
    const [searchParams] = useSearchParams();
    const initialContext = searchParams.get('context') || 'mutaxassislik';
    const toast = useToast();
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [context, setContext] = useState(initialContext);
    const subj = subjectId ? SUBJECTS[subjectId] : null;
    const allowed = subjectId ? getAllowedContexts(subjectId) : ['mutaxassislik'];
    const showContextSwitch = allowed.length > 1;
    const standardCount = context === 'majburiy' ? 10 : 30;
    useEffect(() => {
        if (!subjectId)
            return;
        setLoading(true);
        api.get(`/api/folders/by-subject/${subjectId}`, { params: { context } })
            .then(({ data }) => setFolders(data.folders || []))
            .catch(() => toast.error("Yuklab bo'lmadi"))
            .finally(() => setLoading(false));
    }, [subjectId, context]);
    if (!subj) {
        return (_jsx(_Fragment, { children: _jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: { background: 'none', border: 'none', color: 'var(--txt-2)', fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8 }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "Fan topilmadi" })] }) }));
    }
    const masteryEmoji = (m) => m === 'strong' ? '💪' : m === 'medium' ? '👍' : m === 'weak' ? '📖' : '🆕';
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsxs("div", { className: "header-logo", style: { fontSize: 16 }, children: [subj.icon, " ", subj.name] })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [showContextSwitch && (_jsxs("div", { className: "seg-tabs", children: [_jsx("button", { className: `seg-tab ${context === 'majburiy' ? 'active' : ''}`, onClick: () => setContext('majburiy'), children: "Majburiy (10)" }), _jsx("button", { className: `seg-tab ${context === 'mutaxassislik' ? 'active' : ''}`, onClick: () => setContext('mutaxassislik'), children: "Mutaxassislik (30)" })] })), _jsxs("div", { style: {
                            padding: 12,
                            background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
                            border: `1px solid ${context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'}`,
                            borderRadius: 12,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            lineHeight: 1.5,
                            marginBottom: 14,
                        }, children: [_jsx("strong", { style: { color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }, children: context === 'majburiy' ? 'Majburiy kontekst' : 'Mutaxassislik kontekst' }), _jsx("br", {}), "Har papkadan AI ", _jsxs("strong", { children: [standardCount, " ta test savol"] }), " yaratadi (", context === 'majburiy' ? '1.1 ball' : '2.1–3.1 ball', ")."] }), _jsx("button", { onClick: () => navigate(`/ombor/${subjectId}/add-folder?context=${context}`), style: {
                            width: '100%',
                            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                            color: 'white',
                            border: 'none',
                            borderRadius: 14,
                            padding: '14px 16px',
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            marginBottom: 16,
                        }, children: "\u2295 Yangi material papkasi yaratish" }), loading ? (_jsx("div", { className: "skel-card" })) : folders.length === 0 ? (_jsxs("div", { style: {
                            padding: 30, textAlign: 'center',
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            borderRadius: 14,
                        }, children: [_jsx("div", { style: { fontSize: 40 }, children: "\uD83D\uDCC1" }), _jsxs("p", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 8, lineHeight: 1.5 }, children: ["Hozircha papkalar yo'q", _jsx("br", {}), _jsx("span", { style: { fontSize: 11, color: 'var(--txt-3)' }, children: "Yuqoridagi tugma orqali yangi material va test yarating" })] })] })) : (_jsxs("div", { style: { display: 'grid', gap: 10 }, children: [_jsxs("div", { style: { fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5 }, children: ["\uD83D\uDCC1 PAPKALAR (", folders.length, ")"] }), folders.map(f => (_jsx(FolderCard, { folder: f, masteryEmoji: masteryEmoji, onClick: () => navigate(`/ombor/folder/${f._id}`) }, f._id)))] })), _jsx("div", { style: { height: 24 } })] })] }));
}
function FolderCard({ folder, masteryEmoji, onClick }) {
    const hasTest = folder.testStatus === 'has_test';
    const isGenerating = folder.testStatus === 'generating';
    const isFailed = folder.testStatus === 'generation_failed';
    const isNoTest = folder.testStatus === 'no_test';
    return (_jsxs("button", { onClick: onClick, style: {
            background: 'var(--s1)',
            border: `1px solid ${hasTest ? 'rgba(0,212,170,0.25)' : isFailed ? 'rgba(255,95,126,0.25)' : 'var(--f)'}`,
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left',
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("span", { style: { fontSize: 18 }, children: masteryEmoji(folder.stats?.masteryLevel || 'unknown') }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                    fontWeight: 700,
                                    fontSize: 13,
                                    lineHeight: 1.35,
                                    // BEST PRACTICE: 2 qatorga sig'dirish + ellipsis
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: 2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    wordBreak: 'break-word',
                                }, children: folder.title }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 1 }, children: folder.materials && folder.materials.length > 0
                                    ? _jsxs(_Fragment, { children: [folder.materials.reduce((s, m) => s + m.charCount, 0).toLocaleString(), " belgi \u00B7 ", folder.materials.length, " ta material \u00B7 ", folder.testStandardCount, " savol"] })
                                    : _jsxs(_Fragment, { children: [folder.testStandardCount, " savol"] }) })] }), hasTest && folder.stats.attemptsCount > 0 && (_jsxs("div", { style: { textAlign: 'right' }, children: [_jsxs("div", { style: {
                                    fontWeight: 800, fontSize: 14,
                                    color: folder.stats.bestScore >= 70 ? 'var(--g)' : folder.stats.bestScore >= 50 ? 'var(--y)' : 'var(--r)',
                                }, children: [folder.stats.bestScore, "%"] }), _jsx("div", { style: { fontSize: 9, color: 'var(--txt-3)' }, children: "eng yaxshi" })] }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }, children: [isNoTest && (_jsx("span", { style: { color: 'var(--y)', fontWeight: 700 }, children: "\u26A0\uFE0F Test yaratilmagan \u2014 kirib yarating" })), isGenerating && (_jsx("span", { style: { color: 'var(--acc-l)', fontWeight: 700 }, children: "\u23F3 Test yaratilmoqda..." })), isFailed && (_jsx("span", { style: { color: 'var(--r)', fontWeight: 700 }, children: "\u274C Test yaratishda xato \u2014 qaytadan urinib ko'ring" })), hasTest && folder.stats.attemptsCount === 0 && (_jsx("span", { style: { color: 'var(--g)', fontWeight: 700 }, children: "\u2713 Test tayyor \u2014 ishlashga tayyor" })), hasTest && folder.stats.attemptsCount > 0 && (_jsxs("span", { style: { color: 'var(--txt-3)' }, children: [folder.stats.attemptsCount, " marta ishlangan \u00B7 o'rtacha ", folder.stats.avgScore, "%"] }))] })] }));
}
