import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBJECTS, COMPULSORY_IDS, SPEC_IDS, formatChars } from '../constants/subjects';
import { materialApi, personalTestApi } from '../api/endpoints';
import './SubjectsPage.css';
export default function SubjectsPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState('majburiy');
    const [summary, setSummary] = useState({});
    const [testCounts, setTestCounts] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([
            materialApi.subjectsSummary().catch(() => ({ data: { summary: {} } })),
            personalTestApi.history().catch(() => ({ data: { tests: [], total: 0 } })),
        ]).then(([sumRes, testRes]) => {
            setSummary(sumRes.data.summary || {});
            // Test count per subject
            const counts = {};
            (testRes.data.tests || []).forEach((t) => {
                counts[t.subjectId] = (counts[t.subjectId] || 0) + 1;
            });
            setTestCounts(counts);
        }).finally(() => setLoading(false));
    }, []);
    const ids = tab === 'majburiy' ? COMPULSORY_IDS : SPEC_IDS;
    return (_jsxs("div", { className: "subjects-page", children: [_jsxs("header", { className: "page-header", children: [_jsx("h1", { children: "\uD83D\uDCDA Fanlar" }), _jsx("p", { className: "page-sub", children: "Materiallar yuklang, AI bilan testlar yarating" })] }), _jsxs("div", { className: "tab-switcher", children: [_jsx("button", { className: `tab-btn ${tab === 'majburiy' ? 'active' : ''}`, onClick: () => setTab('majburiy'), children: "Majburiy" }), _jsx("button", { className: `tab-btn ${tab === 'mutaxassislik' ? 'active' : ''}`, onClick: () => setTab('mutaxassislik'), children: "Mutaxassislik" })] }), loading ? (_jsx("div", { className: "loading-state", children: "Yuklanmoqda..." })) : (_jsx("div", { className: "subjects-grid", children: ids.map(id => {
                    const subj = SUBJECTS[id];
                    const stat = summary[id];
                    const tCount = testCounts[id] || 0;
                    return (_jsxs("button", { className: "subject-card", onClick: () => navigate(`/subjects/${id}`), children: [_jsx("div", { className: "subject-icon", children: subj.icon }), _jsxs("div", { className: "subject-info", children: [_jsx("div", { className: "subject-name", children: subj.name }), _jsx("div", { className: "subject-stats", children: stat ? (_jsxs(_Fragment, { children: [_jsxs("span", { children: [stat.count, " material"] }), _jsx("span", { className: "dot", children: "\u00B7" }), _jsxs("span", { children: [formatChars(stat.totalChars), " belgi"] }), _jsx("span", { className: "dot", children: "\u00B7" }), _jsxs("span", { children: [tCount, " test"] })] })) : (_jsx("span", { className: "empty-hint", children: "Material yo'q \u2014 qo'shing" })) })] }), _jsx("div", { className: "subject-arrow", children: "\u203A" })] }, id));
                }) })), _jsxs("div", { className: "info-banner", children: [_jsx("span", { className: "info-icon", children: "\uD83D\uDCA1" }), _jsx("span", { children: "Har bir fanga o'z materiallaringizni yuklang. AI ulardan sizga test savollar yaratib beradi." })] })] }));
}
