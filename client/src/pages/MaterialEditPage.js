import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function MaterialEditPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const folderId = searchParams.get('folderId') || '';
    const goBack = useGoBack(folderId ? `/ombor/folder/${folderId}` : '/ombor');
    const toast = useToast();
    const [material, setMaterial] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [hasTest, setHasTest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAppendMode, setShowAppendMode] = useState(false);
    const [appendText, setAppendText] = useState('');
    useEffect(() => {
        if (!id)
            return;
        api.get(`/api/materials/${id}`)
            .then(({ data }) => {
            const m = data.material || data;
            setMaterial(m);
            setTitle(m.title);
            setContent(m.content);
            setHasTest(!!m.hasGeneratedTest);
        })
            .catch(() => toast.error("Material yuklanmadi"))
            .finally(() => setLoading(false));
    }, [id]);
    const save = async () => {
        if (!id)
            return;
        if (!title.trim()) {
            toast.error("Sarlavha kerak");
            return;
        }
        if (content.length < 500) {
            toast.error("Matn kamida 500 belgi");
            return;
        }
        if (content.length > 30000) {
            toast.error("Matn maksimum 30,000 belgi");
            return;
        }
        setSaving(true);
        try {
            await api.put(`/api/materials/${id}`, { title, content });
            toast.success("Material yangilandi!");
            navigate(folderId ? `/ombor/folder/${folderId}` : '/ombor');
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Saqlashda xato");
        }
        finally {
            setSaving(false);
        }
    };
    const appendAndSave = async () => {
        if (!appendText.trim()) {
            toast.error("Qo'shimcha matn kerak");
            return;
        }
        const newContent = content + '\n\n' + appendText.trim();
        if (newContent.length > 30000) {
            toast.error(`Birga qo'shganda 30,000 belgidan oshib ketadi (jami ${newContent.length})`);
            return;
        }
        setSaving(true);
        try {
            await api.put(`/api/materials/${id}`, { title, content: newContent });
            toast.success("Qo'shildi va saqlandi!");
            navigate(folderId ? `/ombor/folder/${folderId}` : '/ombor');
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Saqlashda xato");
        }
        finally {
            setSaving(false);
        }
    };
    if (loading) {
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: _jsx("div", { className: "spin", style: { margin: '0 auto' } }) });
    }
    if (!material) {
        return (_jsxs("div", { style: { padding: 40, textAlign: 'center' }, children: [_jsx("p", { children: "Material topilmadi" }), _jsx("button", { onClick: goBack, className: "btn btn-primary", style: { marginTop: 16 }, children: "Qaytish" })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 15 }, children: "\u270F\uFE0F Material tahriri" })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [hasTest && (_jsxs("div", { style: {
                            padding: 12,
                            background: 'rgba(255,204,68,0.08)',
                            border: '1px solid rgba(255,204,68,0.25)',
                            borderRadius: 10,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            lineHeight: 1.5,
                            marginBottom: 14,
                        }, children: ["\u26A0\uFE0F ", _jsx("strong", { style: { color: 'var(--y)' }, children: "Diqqat:" }), " Bu papkadan test allaqachon yaratilgan. Materialni tahrirlash test'ga ta'sir qilmaydi \u2014 test eski versiyaga asoslangan qoladi."] })), _jsxs("div", { className: "seg-tabs", children: [_jsx("button", { className: `seg-tab ${!showAppendMode ? 'active' : ''}`, onClick: () => setShowAppendMode(false), children: "\u270F\uFE0F Tahrir" }), _jsx("button", { className: `seg-tab ${showAppendMode ? 'active' : ''}`, onClick: () => setShowAppendMode(true), children: "\u2795 Qo'shimcha qo'shish" })] }), !showAppendMode ? (
                    // ─── TAHRIRLASH REJIMI ──────────────────────────────────────────
                    _jsxs(_Fragment, { children: [_jsx("label", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }, children: "Sarlavha" }), _jsx("input", { value: title, onChange: e => setTitle(e.target.value), maxLength: 200, style: {
                                    width: '100%',
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    color: 'var(--txt)',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    fontSize: 13,
                                    marginBottom: 12,
                                } }), _jsxs("label", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }, children: ["Matn (", content.length.toLocaleString(), " / 30,000)"] }), _jsx("textarea", { value: content, onChange: e => setContent(e.target.value), rows: 14, maxLength: 30000, style: {
                                    width: '100%',
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    color: 'var(--txt)',
                                    borderRadius: 10,
                                    padding: 12,
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                } }), _jsx("button", { onClick: save, disabled: saving, className: "btn btn-primary btn-block btn-lg", style: { marginTop: 14 }, children: saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash' })] })) : (
                    // ─── QO'SHIMCHA QO'SHISH REJIMI ─────────────────────────────────
                    _jsxs(_Fragment, { children: [_jsxs("div", { style: {
                                    padding: 10,
                                    background: 'rgba(0,212,170,0.06)',
                                    border: '1px solid rgba(0,212,170,0.2)',
                                    borderRadius: 10,
                                    fontSize: 11,
                                    color: 'var(--txt-2)',
                                    marginBottom: 12,
                                    lineHeight: 1.5,
                                }, children: ["\uD83D\uDCA1 Mavjud matnga qo'shimcha qo'shing \u2014 mavjud matn", ' ', _jsx("strong", { children: "o'chmaydi" }), ", faqat ostiga qo'shiladi.", _jsx("br", {}), "Joriy hajm: ", _jsx("strong", { children: content.length.toLocaleString() }), " belgi"] }), _jsx("label", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }, children: "Yangi qo'shimcha matn" }), _jsx("textarea", { value: appendText, onChange: e => setAppendText(e.target.value), placeholder: "Bu yerga yangi material qo'shing...", rows: 12, maxLength: 30000 - content.length, style: {
                                    width: '100%',
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    color: 'var(--txt)',
                                    borderRadius: 10,
                                    padding: 12,
                                    fontSize: 13,
                                    lineHeight: 1.5,
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                } }), _jsxs("div", { style: {
                                    fontSize: 10, color: 'var(--txt-3)',
                                    marginTop: 4, textAlign: 'right',
                                }, children: [appendText.length.toLocaleString(), " qo'shimcha \u00B7 Jami", ' ', (content.length + appendText.length).toLocaleString(), " / 30,000"] }), _jsx("button", { onClick: appendAndSave, disabled: saving || !appendText.trim(), className: "btn btn-primary btn-block btn-lg", style: { marginTop: 14, opacity: (saving || !appendText.trim()) ? 0.5 : 1 }, children: saving ? '⏳ Saqlanmoqda...' : "➕ Qo'shish va saqlash" })] })), _jsx("div", { style: { height: 30 } })] })] }));
}
