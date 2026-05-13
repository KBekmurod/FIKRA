import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubject, formatChars, formatBytes } from '../constants/subjects';
import { materialApi, personalTestApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import './SubjectDetailPage.css';
export default function SubjectDetailPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const subject = getSubject(subjectId || '');
    const [materials, setMaterials] = useState([]);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [estimating, setEstimating] = useState(false);
    const [estimate, setEstimate] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [confirmGen, setConfirmGen] = useState(false);
    const [selectedMaterialIds, setSelectedMaterialIds] = useState(new Set());
    useEffect(() => {
        if (!subject)
            return;
        Promise.all([
            materialApi.list(subject.id),
            personalTestApi.history(subject.id),
        ]).then(([mRes, tRes]) => {
            setMaterials(mRes.data.materials || []);
            setTests(tRes.data.tests || []);
        }).catch(() => {
            toast.error("Ma'lumotlar yuklanmadi");
        }).finally(() => setLoading(false));
    }, [subject?.id]);
    // Estimate generation
    const onEstimate = async () => {
        if (materials.length === 0) {
            toast.error("Avval material qo'shing");
            return;
        }
        setEstimating(true);
        try {
            // Tanlangan materiallar yoki hammasi
            const ids = selectedMaterialIds.size > 0
                ? Array.from(selectedMaterialIds)
                : materials.map(m => m._id);
            const totalChars = materials
                .filter(m => ids.includes(m._id))
                .reduce((s, m) => s + m.charCount, 0);
            const count = Math.min(20, Math.max(3, Math.floor(totalChars / 500)));
            setEstimate({ count, totalChars });
            setConfirmGen(true);
        }
        catch (e) {
            toast.error(e.message);
        }
        finally {
            setEstimating(false);
        }
    };
    // Generate test
    const onGenerate = async () => {
        if (!estimate || !subject)
            return;
        setGenerating(true);
        setConfirmGen(false);
        try {
            const ids = selectedMaterialIds.size > 0
                ? Array.from(selectedMaterialIds)
                : materials.map(m => m._id);
            const { data } = await personalTestApi.generate(subject.id, ids, estimate.count);
            // Test ekraniga otish
            navigate(`/personal-tests/${data.testId}/run`, { state: data });
        }
        catch (e) {
            toast.error(e.response?.data?.error || e.message || 'AI test yaratishda xatolik');
        }
        finally {
            setGenerating(false);
        }
    };
    const onDelete = async (id) => {
        if (!confirm("Materialni o'chirasizmi? Bu amalni qaytarib bo'lmaydi."))
            return;
        try {
            await materialApi.delete(id);
            setMaterials(prev => prev.filter(m => m._id !== id));
            toast.success("O'chirildi");
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Xatolik");
        }
    };
    const toggleSelect = (id) => {
        setSelectedMaterialIds(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    if (!subject) {
        return (_jsxs("div", { className: "subject-detail-page", children: [_jsx("div", { className: "error-state", children: "Fan topilmadi" }), _jsx("button", { onClick: () => navigate('/subjects'), className: "btn-back", children: "\u2190 Orqaga" })] }));
    }
    const totalChars = materials.reduce((s, m) => s + m.charCount, 0);
    const completedTests = tests.filter(t => t.status === 'completed');
    const correctTotal = completedTests.reduce((s, t) => s + t.totalCorrect, 0);
    const totalQs = completedTests.reduce((s, t) => s + t.totalQuestions, 0);
    const accuracy = totalQs > 0 ? Math.round((correctTotal / totalQs) * 100) : 0;
    return (_jsxs("div", { className: "subject-detail-page", children: [_jsxs("header", { className: "detail-header", children: [_jsx("button", { className: "btn-back", onClick: () => navigate('/subjects'), children: "\u2190" }), _jsxs("div", { className: "detail-title", children: [_jsx("span", { className: "header-icon", children: subject.icon }), _jsx("h1", { children: subject.name })] })] }), _jsxs("div", { className: "stats-card", children: [_jsxs("div", { className: "stat-item", children: [_jsx("div", { className: "stat-label", children: "Materiallar" }), _jsx("div", { className: "stat-value", children: materials.length })] }), _jsx("div", { className: "stat-divider" }), _jsxs("div", { className: "stat-item", children: [_jsx("div", { className: "stat-label", children: "Jami belgi" }), _jsx("div", { className: "stat-value", children: formatChars(totalChars) })] }), _jsx("div", { className: "stat-divider" }), _jsxs("div", { className: "stat-item", children: [_jsx("div", { className: "stat-label", children: "Testlar" }), _jsx("div", { className: "stat-value", children: completedTests.length })] }), completedTests.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "stat-divider" }), _jsxs("div", { className: "stat-item", children: [_jsx("div", { className: "stat-label", children: "Aniqlik" }), _jsxs("div", { className: "stat-value", children: [accuracy, "%"] })] })] }))] }), _jsxs("div", { className: "actions-section", children: [_jsx("h2", { children: "Tezkor harakatlar" }), _jsxs("div", { className: "action-buttons", children: [_jsxs("button", { className: "action-btn primary", onClick: () => navigate(`/subjects/${subject.id}/add`), children: [_jsx("span", { className: "action-icon", children: "\u2295" }), _jsxs("div", { className: "action-text", children: [_jsx("div", { className: "action-title", children: "Ma'lumot qo'shish" }), _jsx("div", { className: "action-sub", children: "Matn, rasm yoki fayl" })] })] }), _jsxs("button", { className: "action-btn", onClick: onEstimate, disabled: materials.length === 0 || estimating || generating, children: [_jsx("span", { className: "action-icon", children: "\uD83E\uDD16" }), _jsxs("div", { className: "action-text", children: [_jsx("div", { className: "action-title", children: generating ? 'AI ishlamoqda...' : 'AI test yaratish' }), _jsx("div", { className: "action-sub", children: materials.length === 0 ? "Avval material qo'shing" : 'Materiallardan test' })] })] }), _jsxs("button", { className: "action-btn", onClick: () => navigate(`/test`), children: [_jsx("span", { className: "action-icon", children: "\uD83D\uDCDD" }), _jsxs("div", { className: "action-text", children: [_jsx("div", { className: "action-title", children: "Standart DTM test" }), _jsx("div", { className: "action-sub", children: "Fikra savollar bazasidan" })] })] })] })] }), _jsxs("div", { className: "materials-section", children: [_jsxs("h2", { children: ["Materiallarim", _jsx("span", { className: "section-count", children: materials.length })] }), selectedMaterialIds.size > 0 && (_jsxs("div", { className: "selection-info", children: [selectedMaterialIds.size, " ta tanlandi \u00B7 AI test uchun", _jsx("button", { onClick: () => setSelectedMaterialIds(new Set()), children: "Bekor qilish" })] })), materials.length === 0 ? (_jsxs("div", { className: "empty-state", children: [_jsx("div", { className: "empty-icon", children: "\uD83D\uDCED" }), _jsx("div", { className: "empty-title", children: "Materiallar yo'q" }), _jsx("div", { className: "empty-text", children: "Birinchi materialingizni qo'shing \uD83D\uDC47" }), _jsx("button", { className: "empty-cta", onClick: () => navigate(`/subjects/${subject.id}/add`), children: "\u2295 Material qo'shish" })] })) : (_jsx("div", { className: "materials-list", children: materials.map(m => (_jsxs("div", { className: `material-card ${selectedMaterialIds.has(m._id) ? 'selected' : ''}`, children: [_jsx("button", { className: "material-select-btn", onClick: () => toggleSelect(m._id), children: selectedMaterialIds.has(m._id) ? '☑' : '☐' }), _jsxs("div", { className: "material-source-icon", title: m.source, children: [m.source === 'text' && '📝', m.source === 'ocr' && '📷', m.source === 'file' && '📁'] }), _jsxs("div", { className: "material-info", children: [_jsx("div", { className: "material-title", children: m.title }), _jsxs("div", { className: "material-meta", children: [_jsxs("span", { children: [formatChars(m.charCount), " belgi"] }), m.sourceMeta?.pageCount ? _jsxs(_Fragment, { children: [_jsx("span", { className: "dot", children: "\u00B7" }), _jsxs("span", { children: [m.sourceMeta.pageCount, " sahifa"] })] }) : null, m.sourceMeta?.fileSizeKb ? _jsxs(_Fragment, { children: [_jsx("span", { className: "dot", children: "\u00B7" }), _jsx("span", { children: formatBytes(m.sourceMeta.fileSizeKb) })] }) : null] })] }), _jsxs("div", { className: "material-actions", children: [_jsx("button", { className: "material-action-btn", onClick: () => navigate(`/materials/${m._id}/edit`), title: "Tahrirlash", children: "\u270F\uFE0F" }), _jsx("button", { className: "material-action-btn danger", onClick: () => onDelete(m._id), title: "O'chirish", children: "\uD83D\uDDD1" })] })] }, m._id))) }))] }), completedTests.length > 0 && (_jsxs("div", { className: "my-tests-section", children: [_jsxs("h2", { children: ["Mening testlarim", _jsx("span", { className: "section-count", children: completedTests.length })] }), _jsx("div", { className: "tests-list", children: completedTests.slice(0, 5).map(t => (_jsxs("div", { className: "test-history-card", children: [_jsx("div", { className: "test-icon", children: t.testType === 'mini' ? '🎯' : '📊' }), _jsxs("div", { className: "test-info", children: [_jsx("div", { className: "test-title", children: t.testType === 'mini' ? 'Mini-test' : 'Material testi' }), _jsxs("div", { className: "test-meta", children: [t.totalCorrect, "/", t.totalQuestions, " \u00B7 ", t.scorePercent, "%", _jsx("span", { className: "dot", children: "\u00B7" }), _jsx("span", { children: new Date(t.endTime).toLocaleDateString('uz-UZ') })] })] }), _jsxs("div", { className: `test-score ${t.scorePercent >= 70 ? 'good' : t.scorePercent >= 50 ? 'mid' : 'low'}`, children: [t.scorePercent, "%"] })] }, t._id))) })] })), confirmGen && estimate && (_jsx("div", { className: "modal-backdrop", onClick: () => setConfirmGen(false), children: _jsxs("div", { className: "modal", onClick: e => e.stopPropagation(), children: [_jsx("h3", { children: "\uD83E\uDD16 AI test yaratamizmi?" }), _jsxs("p", { className: "modal-text", children: [formatChars(estimate.totalChars), " belgili materialdan", ' ', _jsxs("strong", { children: [estimate.count, " ta test"] }), " savol yarataman."] }), _jsx("p", { className: "modal-hint", children: "Bu jarayon 15-30 soniya davom etadi." }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { className: "btn-secondary", onClick: () => setConfirmGen(false), children: "Bekor qilish" }), _jsx("button", { className: "btn-primary", onClick: onGenerate, disabled: generating, children: generating ? "Yaratilmoqda..." : "Ha, boshla" })] })] }) })), loading && _jsx("div", { className: "loading-overlay", children: "Yuklanmoqda..." }), generating && (_jsxs("div", { className: "loading-overlay", children: [_jsx("div", { className: "big-spinner" }), _jsx("div", { children: "AI testlar yaratmoqda..." })] }))] }));
}
