import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { folderApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import { SUBJECTS, DUAL_CONTEXT_SUBJECTS, SPEC_BY_CATEGORY, SPEC_CATEGORY_NAMES, COMPULSORY_IDS } from '../constants/subjects';
export default function AiPapkalarPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/testlar/ai');
    const toast = useToast();
    const [tab, setTab] = useState('mutaxassislik');
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        folderApi.subjectsSummary()
            .then(({ data }) => setSummary(data.summary || {}))
            .catch(() => toast.error("Yuklab bo'lmadi"))
            .finally(() => setLoading(false));
    }, []);
    const getSummaryFor = (subjectId, context) => {
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
        const hasFolders = stats && stats.folderCount > 0;
        return (_jsxs("button", { onClick: () => navigate(`/ombor/${subjectId}?context=${context}`), style: {
                width: '100%',
                background: 'var(--s1)',
                border: `1px solid ${hasFolders ? 'rgba(123,104,238,0.25)' : 'var(--f)'}`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', color: 'var(--txt)', textAlign: 'left',
            }, children: [_jsx("div", { style: {
                        width: 44, height: 44, borderRadius: 12,
                        background: context === 'majburiy' ? 'rgba(0,212,170,0.12)' : 'rgba(123,104,238,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22, flexShrink: 0,
                    }, children: subj.icon }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13.5 }, children: subj.name }), _jsx("div", { style: { fontSize: 10.5, color: 'var(--txt-3)', marginTop: 2 }, children: !hasFolders
                                ? _jsx("span", { style: { fontStyle: 'italic' }, children: "Material yo'q \u2014 Omborga yuklang" })
                                : _jsxs("span", { children: [stats.folderCount, " ta papka \u00B7 ", stats.testsCompleted, " test", stats.avgScore > 0 && (_jsxs(_Fragment, { children: [" \u00B7 ", _jsxs("strong", { style: { color: stats.avgScore >= 70 ? 'var(--g)' : stats.avgScore >= 50 ? 'var(--y)' : 'var(--r)' }, children: [stats.avgScore, "%"] })] }))] }) })] }), _jsx("div", { style: { color: 'var(--txt-3)', fontSize: 18 }, children: "\u2192" })] }, `${subjectId}_${context}`));
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "\uD83D\uDCC1 Papka testlari" })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsx("p", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }, children: "Har papka uchun alohida test \u00B7 majburiy 10, mutaxassislik 30 savol" }), _jsxs("div", { className: "seg-tabs", children: [_jsx("button", { className: `seg-tab ${tab === 'majburiy' ? 'active' : ''}`, onClick: () => setTab('majburiy'), children: "Majburiy" }), _jsx("button", { className: `seg-tab ${tab === 'mutaxassislik' ? 'active' : ''}`, onClick: () => setTab('mutaxassislik'), children: "Mutaxassislik" })] }), loading ? _jsx("div", { className: "skel-card" }) : tab === 'majburiy' ? (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 10, fontWeight: 800, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }, children: "\uD83D\uDCCC MAJBURIY \u00B7 10 ta savol" }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: COMPULSORY_IDS.map(id => renderSubjectCard(id, 'majburiy')) })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 10, fontWeight: 800, color: 'var(--acc-l)', letterSpacing: 0.5, marginBottom: 8 }, children: "\u2B50 MUTAXASSISLIK \u00B7 30 ta savol" }), _jsx("div", { style: { fontSize: 9.5, fontWeight: 700, color: 'var(--y)', letterSpacing: 0.5, margin: '8px 0 6px' }, children: "\uD83D\uDD01 DUAL-CONTEXT FANLAR" }), _jsx("div", { style: { display: 'grid', gap: 8, marginBottom: 14 }, children: ['math', 'tarix'].map(id => renderSubjectCard(id, 'mutaxassislik')) }), Object.entries(SPEC_BY_CATEGORY).map(([cat, ids]) => (_jsxs("div", { style: { marginBottom: 14 }, children: [_jsx("div", { style: { fontSize: 9.5, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 6 }, children: SPEC_CATEGORY_NAMES[cat]?.toUpperCase() }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: ids.map(id => renderSubjectCard(id, 'mutaxassislik')) })] }, cat)))] })), _jsx("div", { style: { height: 30 } })] })] }));
}
