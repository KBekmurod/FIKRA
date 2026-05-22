import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS, COMPULSORY_IDS, DUAL_CONTEXT_SUBJECTS, SPEC_BY_CATEGORY, SPEC_CATEGORY_NAMES, } from '../constants/subjects';
import { useToast } from '../components/Toast';
export default function OmborPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [tab, setTab] = useState('majburiy');
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get('/api/folders/subjects-summary')
            .then(({ data }) => setSummary(data.summary || {}))
            .catch(() => toast.error("Yuklab bo'lmadi"))
            .finally(() => setLoading(false));
    }, []);
    // Tab bo'yicha ko'rsatadigan fanlar
    // Majburiy: uztil, math, tarix
    // Mutaxassislik: hammasi (math/tarix dual, qolganlari fakat speciality)
    const compulsoryList = COMPULSORY_IDS;
    // Mutaxassislikda: math, tarix (dual) + 13 ta faqat-mutaxassislik fani = 15 ta
    const specialtyList = [
        'math', 'tarix',
        'fizika', 'kimyo', 'bio', 'geo',
        'adab', 'huquq',
        'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
    ];
    const getSummaryFor = (subjectId, context) => {
        // Dual subjects: key = subjectId__context
        if (DUAL_CONTEXT_SUBJECTS.has(subjectId)) {
            return summary[`${subjectId}__${context}`] || null;
        }
        return summary[subjectId] || null;
    };
    const renderSubjectCard = (subjectId, context) => {
        const subj = SUBJECTS[subjectId];
        if (!subj)
            return null;
        const stats = getSummaryFor(subjectId, context);
        const isEmpty = !stats || stats.folderCount === 0;
        const standardCount = context === 'majburiy' ? 10 : 30;
        return (_jsxs("button", { onClick: () => navigate(`/ombor/${subjectId}?context=${context}`), style: {
                width: '100%',
                background: 'var(--s1)',
                border: `1px solid ${isEmpty ? 'var(--f)' : 'rgba(123,104,238,0.25)'}`,
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                color: 'var(--txt)',
                textAlign: 'left',
            }, children: [_jsx("div", { style: {
                        width: 44, height: 44, borderRadius: 12,
                        background: context === 'majburiy' ? 'rgba(0,212,170,0.12)' : 'rgba(123,104,238,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                    }, children: subj.icon }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13.5 }, children: subj.name }), _jsx("div", { style: { fontSize: 10.5, color: 'var(--txt-3)', marginTop: 2 }, children: isEmpty
                                ? _jsx("span", { style: { fontStyle: 'italic' }, children: "Bo'sh \u2014 papka yaratish uchun bosing" })
                                : (_jsxs("span", { children: [stats.folderCount, " ta papka", stats.testsCompleted > 0 && (_jsxs(_Fragment, { children: [" \u00B7 ", stats.testsCompleted, " test \u00B7 ", _jsxs("strong", { style: { color: stats.avgScore >= 70 ? 'var(--g)' : stats.avgScore >= 50 ? 'var(--y)' : 'var(--r)' }, children: [stats.avgScore, "%"] })] }))] })) })] }), _jsxs("div", { style: {
                        fontSize: 10, color: 'var(--txt-3)', fontWeight: 700,
                        padding: '2px 8px', borderRadius: 100,
                        background: 'var(--s2)',
                        whiteSpace: 'nowrap',
                    }, children: [standardCount, " ta"] }), _jsx("div", { style: { color: 'var(--txt-3)', fontSize: 18 }, children: "\u2192" })] }, `${subjectId}_${context}`));
    };
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsx("div", { className: "header-logo", children: "\uD83C\uDFDB Ombor" }) }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsx("p", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }, children: "Materiallaringizni saqlang, AI testlar yarating" }), _jsxs("div", { className: "seg-tabs", children: [_jsx("button", { className: `seg-tab ${tab === 'majburiy' ? 'active' : ''}`, onClick: () => setTab('majburiy'), children: "Majburiy" }), _jsx("button", { className: `seg-tab ${tab === 'mutaxassislik' ? 'active' : ''}`, onClick: () => setTab('mutaxassislik'), children: "Mutaxassislik" })] }), loading ? (_jsx("div", { className: "skel-card" })) : tab === 'majburiy' ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 10, fontWeight: 800, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }, children: "\uD83D\uDCCC MAJBURIY 3 FAN \u00B7 har birida 10 ta savol \u00B7 1.1 ball" }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: compulsoryList.map(id => renderSubjectCard(id, 'majburiy')) })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 10, fontWeight: 800, color: 'var(--acc-l)', letterSpacing: 0.5, marginBottom: 8 }, children: "\u2B50 MUTAXASSISLIK \u00B7 har biri 30 ta savol \u00B7 2.1\u20133.1 ball" }), _jsx("div", { style: { fontSize: 9.5, fontWeight: 700, color: 'var(--y)', letterSpacing: 0.5, margin: '8px 0 6px' }, children: "\uD83D\uDD01 IKKALA KONTEKSTDA HAM (chuqurroq)" }), _jsx("div", { style: { display: 'grid', gap: 8, marginBottom: 14 }, children: ['math', 'tarix'].map(id => renderSubjectCard(id, 'mutaxassislik')) }), Object.entries(SPEC_BY_CATEGORY).map(([cat, ids]) => (_jsxs("div", { style: { marginBottom: 14 }, children: [_jsx("div", { style: { fontSize: 9.5, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 6 }, children: SPEC_CATEGORY_NAMES[cat]?.toUpperCase() }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: ids.map(id => renderSubjectCard(id, 'mutaxassislik')) })] }, cat)))] })), _jsxs("div", { style: {
                            marginTop: 14, marginBottom: 16,
                            padding: 12,
                            background: 'rgba(255,204,68,0.08)',
                            border: '1px solid rgba(255,204,68,0.2)',
                            borderRadius: 10,
                            fontSize: 10.5,
                            color: 'var(--txt-2)',
                            lineHeight: 1.55,
                        }, children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Qoida:" }), " Bitta fan ichida mavzular bo'yicha papkalar oching. Har bir papkaga istagancha konspekt, rasm yoki PDF yuklashingiz mumkin.", ' ', "AI shu papkadagi barcha ma'lumotlarni o'qib, mutlaqo yangi test yaratib beradi."] })] })] }));
}
