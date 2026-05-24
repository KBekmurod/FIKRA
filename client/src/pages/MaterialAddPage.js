import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function MaterialAddPage() {
    const navigate = useNavigate();
    const { folderId } = useParams();
    const goBack = useGoBack(`/ombor/folder/${folderId}`);
    const toast = useToast();
    const [folder, setFolder] = useState(null);
    const [loadingFolder, setLoadingFolder] = useState(true);
    useEffect(() => {
        if (!folderId)
            return;
        api.get(`/api/folders/${folderId}`)
            .then(res => setFolder(res.data.folder))
            .catch(() => toast.error('Papka topilmadi'))
            .finally(() => setLoadingFolder(false));
    }, [folderId]);
    const [tab, setTab] = useState('text');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const subj = folder?.subjectId ? SUBJECTS[folder.subjectId] : null;
    const context = folder?.context || 'mutaxassislik';
    if (loadingFolder)
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: "Yuklanmoqda..." });
    if (!folder || !subj)
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: "Papka yoki fan topilmadi" });
    const standardCount = context === 'majburiy' ? 10 : 30;
    // ─── Avtomatik sarlavha generatsiyasi ──────────────────────────────────
    // Sarlavha bo'sh bo'lsa matnning birinchi qatoridan yaratiladi.
    const autoTitle = (text) => {
        const trimmed = text.trim();
        if (!trimmed)
            return `Material — ${new Date().toLocaleDateString('uz-UZ')}`;
        // Birinchi qatorni olamiz
        const firstLine = trimmed.split('\n')[0].trim();
        if (firstLine.length === 0) {
            return `Material — ${new Date().toLocaleDateString('uz-UZ')}`;
        }
        // Agar juda uzun bo'lsa, 60 belgida kesib qo'shamiz
        if (firstLine.length > 70) {
            // So'zlarda silliq kesish
            const words = firstLine.split(/\s+/);
            let result = '';
            for (const w of words) {
                if ((result + ' ' + w).trim().length > 60)
                    break;
                result = (result + ' ' + w).trim();
            }
            return (result || firstLine.slice(0, 60)) + '...';
        }
        return firstLine;
    };
    const submitText = async () => {
        if (content.length < 500) {
            toast.error("Matn juda kichik (kamida 500 belgi)");
            return;
        }
        if (content.length > 30000) {
            toast.error("Matn juda katta (maksimum 30,000 belgi)");
            return;
        }
        // Sarlavha bo'sh bo'lsa matndan avtomatik yaratiladi
        const finalTitle = title.trim() || autoTitle(content);
        setSaving(true);
        try {
            await api.post('/api/materials/text', {
                folderId, subjectId: folder.subjectId, title: finalTitle, content,
            });
            toast.success('Material qo\'shildi!');
            navigate(`/ombor/folder/${folderId}?fresh=1`, { replace: true });
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Xatolik');
        }
        finally {
            setSaving(false);
        }
    };
    const submitOcr = async (file) => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('image', file);
            const { data: drft } = await api.post('/api/materials/ocr/extract', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Foydalanuvchi tahrirlash imkoniyatiga ega bo'lsin — kontent state'ga qo'yamiz
            setContent(drft.text);
            setTab('text');
            toast.success('Matn ajratildi. Tekshiring va sarlavha bering!');
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'OCR xatolik');
        }
        finally {
            setSaving(false);
        }
    };
    const submitFile = async (file) => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data: drft } = await api.post('/api/materials/file/parse', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            });
            setContent(drft.text);
            setTab('text');
            toast.success(`Fayl tahlil qilindi! ${drft.charCount} belgi. Tekshiring va sarlavha bering.`);
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Fayl xatolik');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsxs("div", { className: "header-logo", style: { fontSize: 15 }, children: ["\u2295 Material (", subj.name, ")"] })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsxs("div", { style: {
                            padding: 12,
                            background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
                            border: `1px solid ${context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'}`,
                            borderRadius: 10,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            marginBottom: 14,
                        }, children: [_jsx("strong", { style: { color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }, children: context === 'majburiy' ? 'Majburiy' : 'Mutaxassislik' }), ' ', "konteksti \u00B7 AI ", _jsxs("strong", { children: [standardCount, " ta test"] }), " yaratadi"] }), _jsxs("div", { className: "seg-tabs", children: [_jsx("button", { className: `seg-tab ${tab === 'text' ? 'active' : ''}`, onClick: () => setTab('text'), children: "\uD83D\uDCDD Matn" }), _jsx("button", { className: `seg-tab ${tab === 'ocr' ? 'active' : ''}`, onClick: () => setTab('ocr'), children: "\uD83D\uDCF7 Rasm" }), _jsx("button", { className: `seg-tab ${tab === 'file' ? 'active' : ''}`, onClick: () => setTab('file'), children: "\uD83D\uDCC1 Fayl" })] }), tab === 'text' && (_jsxs("div", { children: [_jsxs("label", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }, children: ["Sarlavha ", _jsx("span", { style: { color: 'var(--txt-3)', fontSize: 10, fontWeight: 400 }, children: "(ixtiyoriy)" })] }), _jsx("input", { value: title, onChange: e => setTitle(e.target.value), placeholder: "Bo'sh qoldirsangiz, matndan avtomatik yaratiladi", maxLength: 200, style: {
                                    width: '100%',
                                    background: 'var(--s1)',
                                    border: '1px solid var(--f)',
                                    color: 'var(--txt)',
                                    borderRadius: 10,
                                    padding: '12px 14px',
                                    fontSize: 13,
                                    marginBottom: 4,
                                } }), !title.trim() && content.length >= 50 && (_jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginBottom: 12, fontStyle: 'italic' }, children: ["\uD83D\uDCDD Avtomatik: \"", autoTitle(content), "\""] })), (title.trim() || content.length < 50) && _jsx("div", { style: { height: 8 } }), _jsx("label", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }, children: "Matn (500\u201330,000 belgi)" }), _jsx("textarea", { value: content, onChange: e => setContent(e.target.value), placeholder: "Matningizni shu yerga joylang...", rows: 12, maxLength: 30000, style: {
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
                                    fontSize: 10, color: content.length > 30000 ? 'var(--r)' : 'var(--txt-3)',
                                    marginTop: 4, textAlign: 'right',
                                }, children: [content.length.toLocaleString(), " / 30,000"] }), _jsx("button", { onClick: submitText, disabled: saving || content.length < 500, className: "btn btn-primary btn-block btn-lg", style: { marginTop: 14, opacity: (saving || content.length < 500) ? 0.5 : 1 }, children: saving ? '⏳ Saqlanmoqda...' : '💾 Materialni papkaga qo\'shish' })] })), tab === 'ocr' && (_jsxs("div", { children: [_jsxs("div", { style: {
                                    padding: 14,
                                    background: 'var(--s1)',
                                    border: '1px dashed var(--f)',
                                    borderRadius: 12,
                                    textAlign: 'center',
                                }, children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83D\uDCF7" }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 8, marginBottom: 12 }, children: "Rasm yuklang \u2014 AI matnni o'qib chiqaradi (JPG, PNG, maks 3 MB)" }), _jsxs("label", { style: {
                                            display: 'inline-block',
                                            background: 'var(--acc)', color: 'white',
                                            padding: '10px 18px', borderRadius: 10,
                                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        }, children: ["Rasm tanlash", _jsx("input", { type: "file", accept: "image/*", style: { display: 'none' }, onChange: e => { const f = e.target.files?.[0]; if (f)
                                                    submitOcr(f); }, disabled: saving })] })] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 10, textAlign: 'center' }, children: "\u26A0\uFE0F OCR 100% aniq emas \u2014 natijani tahrirlash uchun \"Matn\" tabga o'tasiz" })] })), tab === 'file' && (_jsx("div", { children: _jsxs("div", { style: {
                                padding: 14,
                                background: 'var(--s1)',
                                border: '1px dashed var(--f)',
                                borderRadius: 12,
                                textAlign: 'center',
                            }, children: [_jsx("div", { style: { fontSize: 32 }, children: "\uD83D\uDCC1" }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 8, marginBottom: 12 }, children: "PDF, DOCX, PPTX \u2014 matn ajratiladi (maks 7 MB, 20 sahifa)" }), _jsxs("label", { style: {
                                        display: 'inline-block',
                                        background: 'var(--acc)', color: 'white',
                                        padding: '10px 18px', borderRadius: 10,
                                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                    }, children: ["Fayl tanlash", _jsx("input", { type: "file", accept: ".pdf,.docx,.pptx", style: { display: 'none' }, onChange: e => { const f = e.target.files?.[0]; if (f)
                                                submitFile(f); }, disabled: saving })] })] }) })), _jsx("div", { style: { height: 24 } })] })] }));
}
