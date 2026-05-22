import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi, personalTestApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { SUBJECTS } from '../constants/subjects';
import { useAppStore } from '../store';
export default function HistoryPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAppStore();
    const [topTab, setTopTab] = useState('fikra');
    const [fikraMode, setFikraMode] = useState('blok');
    const [aiMode, setAiMode] = useState('papka');
    const [fikra, setFikra] = useState([]);
    const [ai, setAi] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadAll = async () => {
        setLoading(true);
        try {
            const [f, a] = await Promise.all([
                examApi.history(undefined, 1).catch(() => ({ data: { items: [] } })),
                personalTestApi.history(undefined, undefined, 1).catch(() => ({ data: { tests: [] } })),
            ]);
            // QUSUR TUZATILDI: backend 'items' qaytaradi, eski versiya 'sessions' yoki 'history'
            const fd = f.data;
            const rawFikra = fd?.items || fd?.sessions || fd?.history || [];
            // Backend mode='dtm' → testMode='blok', mode='subject' → testMode='free'
            const normalized = rawFikra.map((s) => ({
                ...s,
                testMode: s.mode === 'dtm' ? 'blok' : 'free',
                blockSubject: s.direction,
                freeSubjects: s.selectedSubjects,
                totalCorrect: s.subjectBreakdown?.reduce((sum, sb) => sum + (sb.correctCount || 0), 0) || 0,
                totalQuestions: s.subjectBreakdown?.reduce((sum, sb) => sum + (sb.totalCount || 0), 0) || 0,
                status: s.status || 'completed',
            }));
            setFikra(normalized);
            setAi((a.data?.tests || []));
        }
        catch {
            toast.error("Tarix yuklanmadi");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        loadAll();
    }, [user]);
    // FIKRA testlar bo'yicha filter
    const fikraByMode = fikra.filter(s => s.testMode === fikraMode);
    // AI testlar bo'yicha filter
    // - papka rejimi: testType === 'material' yoki 'mini' (folderId bilan)
    // - blok: testType === 'ai_blok'
    // - free: testType === 'ai_free'
    const aiByMode = ai.filter(t => {
        if (aiMode === 'papka')
            return t.testType === 'material' || t.testType === 'mini';
        if (aiMode === 'blok')
            return t.testType === 'ai_blok';
        if (aiMode === 'free')
            return t.testType === 'ai_free';
        return true;
    });
    // Dastlabki testlar va mini-testlarni ajratish
    const primaryAi = aiByMode.filter(t => t.testType !== 'mini');
    const miniAi = aiByMode.filter(t => t.testType === 'mini');
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsx("div", { className: "header-logo", children: "\uD83D\uDCDA Tarix" }) }), !user ? (_jsxs("div", { style: { padding: '40px 20px', textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 50, marginBottom: 16 }, children: "\uD83D\uDCDA" }), _jsx("h3", { style: { fontSize: 18, color: 'var(--txt)', marginBottom: 8 }, children: "Testlar tarixi yopiq" }), _jsx("p", { style: { fontSize: 13, color: 'var(--txt-2)', marginBottom: 24, lineHeight: 1.5 }, children: "Siz ishlagan testlar va xatolar ustida qilingan ishlar bu yerda saqlanadi. Ko'rish uchun hisobingizga kiring." }), _jsx("button", { onClick: () => navigate('/auth/login'), style: {
                            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                            color: '#fff', border: 'none',
                            padding: '12px 24px', borderRadius: 12,
                            fontSize: 14, fontWeight: 800, cursor: 'pointer'
                        }, children: "Tizimga kirish" })] })) : (_jsxs("div", { style: { padding: '8px 20px 0' }, children: [_jsxs("div", { className: "seg-tabs", children: [_jsxs("button", { className: `seg-tab ${topTab === 'fikra' ? 'active' : ''}`, onClick: () => setTopTab('fikra'), children: ["\uD83C\uDF93 FIKRA (", fikra.length, ")"] }), _jsxs("button", { className: `seg-tab ${topTab === 'ai' ? 'active' : ''}`, onClick: () => setTopTab('ai'), children: ["\uD83E\uDD16 AI (", ai.length, ")"] })] }), topTab === 'fikra' ? (_jsxs("div", { style: { display: 'flex', gap: 6, marginBottom: 12 }, children: [_jsx(ModeChip, { active: fikraMode === 'blok', onClick: () => setFikraMode('blok'), icon: "\uD83D\uDCE6", label: "Maxsus blok", count: fikra.filter(s => s.testMode === 'blok').length }), _jsx(ModeChip, { active: fikraMode === 'free', onClick: () => setFikraMode('free'), icon: "\uD83C\uDFAF", label: "Erkin tanlov", count: fikra.filter(s => s.testMode === 'free').length })] })) : (_jsxs("div", { style: { display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }, children: [_jsx(ModeChip, { active: aiMode === 'papka', onClick: () => setAiMode('papka'), icon: "\uD83D\uDCC1", label: "Papka testlari", count: ai.filter(t => t.testType === 'material' || t.testType === 'mini').length }), _jsx(ModeChip, { active: aiMode === 'blok', onClick: () => setAiMode('blok'), icon: "\uD83D\uDCE6", label: "Maxsus blok", count: ai.filter(t => t.testType === 'ai_blok').length }), _jsx(ModeChip, { active: aiMode === 'free', onClick: () => setAiMode('free'), icon: "\uD83C\uDFAF", label: "Erkin tanlov", count: ai.filter(t => t.testType === 'ai_free').length })] })), loading ? (_jsx("div", { className: "skel-card" })) : topTab === 'fikra' ? (_jsx(FikraHistoryList, { items: fikraByMode, onClick: s => navigate(`/test-result/${s._id}`) })) : (_jsx(AiHistoryList, { primaryItems: primaryAi, miniItems: miniAi, allTests: ai, onClick: t => navigate(`/personal-tests/${t._id}/result`) })), _jsx("div", { style: { height: 30 } })] }))] }));
}
// ─── Rejim chip ─────────────────────────────────────────────────────────
function ModeChip({ active, onClick, icon, label, count }) {
    return (_jsxs("button", { onClick: onClick, style: {
            flex: '0 0 auto',
            padding: '7px 12px',
            fontSize: 11, fontWeight: 700,
            borderRadius: 100,
            border: active ? '1.5px solid var(--acc)' : '1px solid var(--f)',
            background: active ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
            color: active ? 'var(--acc-l)' : 'var(--txt-2)',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center', gap: 6,
        }, children: [_jsx("span", { children: icon }), _jsx("span", { children: label }), _jsx("span", { style: {
                    background: active ? 'rgba(123,104,238,0.2)' : 'var(--s1)',
                    color: active ? 'var(--acc-l)' : 'var(--txt-3)',
                    borderRadius: 100, padding: '1px 6px',
                    fontSize: 10,
                }, children: count })] }));
}
// ─── FIKRA testlar ro'yxati ───────────────────────────────────────────────
function FikraHistoryList({ items, onClick }) {
    if (items.length === 0) {
        return (_jsxs("div", { style: { padding: 30, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 40 }, children: "\uD83D\uDCED" }), _jsx("p", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }, children: "Hozircha bu turdagi FIKRA testlari yo'q" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { style: { fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }, children: ["\uD83D\uDCCB DASTLABKI ISHLANGAN TESTLAR (", items.length, ")"] }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: items.map(s => {
                    const pct = s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0;
                    let metaText = '';
                    if (s.testMode === 'blok' && s.blockSubject) {
                        const subj = SUBJECTS[s.blockSubject];
                        metaText = subj ? `Yo'nalish: ${subj.icon} ${subj.name}` : s.blockSubject;
                    }
                    else if (s.freeSubjects?.length) {
                        metaText = 'Fanlar: ' + s.freeSubjects.map(sid => {
                            const x = SUBJECTS[sid];
                            return x ? x.icon : sid;
                        }).join(' ');
                    }
                    return (_jsx("button", { onClick: () => onClick(s), style: cardStyle(), children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', gap: 10 }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontSize: 12.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }, children: metaText }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: [new Date(s.endTime).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), ' · ', s.totalCorrect, "/", s.totalQuestions] })] }), _jsxs("div", { style: {
                                        fontWeight: 800, fontSize: 16,
                                        color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                                        whiteSpace: 'nowrap',
                                    }, children: [pct, "%"] })] }) }, s._id));
                }) })] }));
}
// ─── AI testlar — dastlabki + mini ajratilgan ────────────────────────────
function AiHistoryList({ primaryItems, miniItems, allTests, onClick }) {
    if (primaryItems.length === 0 && miniItems.length === 0) {
        return (_jsxs("div", { style: { padding: 30, textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: 40 }, children: "\uD83D\uDCED" }), _jsx("p", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }, children: "Hozircha bu turdagi AI testlari yo'q" })] }));
    }
    return (_jsxs(_Fragment, { children: [primaryItems.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }, children: ["\uD83D\uDCCB DASTLABKI ISHLANGAN TESTLAR (", primaryItems.length, ")"] }), _jsx("div", { style: { display: 'grid', gap: 8, marginBottom: 14 }, children: primaryItems.map(t => {
                            const relatedMini = allTests.find(x => x.testType === 'mini' && x.sourceTestId === t._id);
                            return (_jsx(AiTestCard, { test: t, relatedMini: relatedMini, onClick: () => onClick(t) }, t._id));
                        }) })] })), miniItems.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { style: {
                            fontSize: 10, fontWeight: 700, color: 'var(--y)',
                            letterSpacing: 0.5, marginBottom: 8,
                            marginTop: primaryItems.length > 0 ? 14 : 0,
                        }, children: ["\uD83C\uDFAF XATOLAR USTIDA ISHLANGAN MINI-TESTLAR (", miniItems.length, ")"] }), _jsx("div", { style: {
                            padding: 10, marginBottom: 8,
                            background: 'rgba(255,204,68,0.05)',
                            border: '1px dashed rgba(255,204,68,0.2)',
                            borderRadius: 10,
                            fontSize: 10.5, color: 'var(--txt-3)', lineHeight: 1.4,
                        }, children: "\uD83D\uDCA1 Mini-test \u2014 dastlabki testdagi xatolaringizdan AI tomonidan yaratilgan o'rganish testi" }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: miniItems.map(t => (_jsx(AiTestCard, { test: t, onClick: () => onClick(t), isMini: true }, t._id))) })] }))] }));
}
function AiTestCard({ test: t, relatedMini, onClick, isMini }) {
    const subj = SUBJECTS[t.subjectId];
    const folderTitle = t.folderInfo?.title;
    const isBlok = t.testType === 'ai_blok';
    const isFree = t.testType === 'ai_free';
    return (_jsx("button", { onClick: onClick, style: cardStyle(), children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', gap: 10 }, children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: {
                                display: 'inline-block',
                                fontSize: 9.5, fontWeight: 800,
                                padding: '2px 8px', borderRadius: 100,
                                background: isMini ? 'rgba(255,204,68,0.15)' :
                                    isBlok ? 'rgba(167,139,250,0.15)' :
                                        isFree ? 'rgba(0,212,170,0.15)' : 'rgba(123,104,238,0.15)',
                                color: isMini ? 'var(--y)' :
                                    isBlok ? 'var(--acc-l)' :
                                        isFree ? 'var(--g)' : 'var(--acc-l)',
                                marginBottom: 4, letterSpacing: 0.3,
                            }, children: isMini ? '🎯 MINI' : isBlok ? '📦 BLOK' : isFree ? '🎯 ERKIN' : '🤖 PAPKA' }), _jsxs("div", { style: {
                                fontSize: 12.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 2,
                                display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
                                overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word',
                                lineHeight: 1.35,
                            }, children: [subj?.icon || (isBlok || isFree ? '📊' : ''), " ", t.subjectName] }), folderTitle && !isBlok && !isFree && (_jsxs("div", { style: {
                                fontSize: 10, color: 'var(--txt-2)', marginBottom: 2,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }, children: ["\uD83D\uDCC1 \"", folderTitle, "\""] })), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: [new Date(t.endTime || t.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), ' · ', t.totalCorrect, "/", t.totalQuestions] }), relatedMini && (_jsxs("div", { style: {
                                marginTop: 6, padding: '4px 8px',
                                background: 'rgba(255,204,68,0.08)',
                                border: '1px solid rgba(255,204,68,0.2)',
                                borderRadius: 6,
                                fontSize: 10, color: 'var(--y)',
                                display: 'inline-block',
                            }, children: ["\u2713 Mini-test ham bor (", relatedMini.totalCorrect, "/", relatedMini.totalQuestions, ")"] }))] }), _jsxs("div", { style: {
                        fontWeight: 800, fontSize: 16,
                        color: t.scorePercent >= 70 ? 'var(--g)' : t.scorePercent >= 50 ? 'var(--y)' : 'var(--r)',
                        whiteSpace: 'nowrap',
                    }, children: [t.scorePercent, "%"] })] }) }));
}
function cardStyle() {
    return {
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'left',
        width: '100%',
    };
}
