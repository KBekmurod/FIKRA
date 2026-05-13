import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubject, formatBytes } from '../constants/subjects';
import { materialApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import './MaterialAddPage.css';
export default function MaterialAddPage() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const subject = getSubject(subjectId || '');
    const [tab, setTab] = useState('text');
    const [limits, setLimits] = useState(null);
    // Text tab
    const [textTitle, setTextTitle] = useState('');
    const [textContent, setTextContent] = useState('');
    // Image/File tab — draft (extract qilingan matn)
    const [draftId, setDraftId] = useState(null);
    const [draftKind, setDraftKind] = useState(null);
    const [draftTitle, setDraftTitle] = useState('');
    const [draftText, setDraftText] = useState('');
    const [draftMeta, setDraftMeta] = useState(null);
    // Processing state
    const [extracting, setExtracting] = useState(false);
    const [saving, setSaving] = useState(false);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    useEffect(() => {
        materialApi.limits().then(({ data }) => setLimits(data)).catch(() => { });
    }, []);
    if (!subject) {
        return (_jsxs("div", { className: "material-add-page", children: [_jsx("div", { className: "error-state", children: "Fan topilmadi" }), _jsx("button", { className: "btn-back", onClick: () => navigate('/subjects'), children: "\u2190 Orqaga" })] }));
    }
    // ─── Tab 1: Matn (copy-paste) saqlash ─────────────────────────────────
    const onTextSave = async () => {
        if (!textContent.trim() || textContent.length < (limits?.rules.minTextChars || 50)) {
            toast.error(`Matn juda qisqa (kamida ${limits?.rules.minTextChars || 50} belgi)`);
            return;
        }
        setSaving(true);
        try {
            await materialApi.createText(subject.id, textTitle || `${subject.name} — matn`, textContent);
            toast.success("Material qo'shildi!");
            navigate(`/subjects/${subject.id}`);
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Xatolik");
        }
        finally {
            setSaving(false);
        }
    };
    // ─── Tab 2: Rasm (OCR) ────────────────────────────────────────────────
    const onImagePick = async (file) => {
        if (file.size > (limits?.rules.maxImageBytes || 3 * 1024 * 1024)) {
            toast.error(`Rasm juda katta (maksimum 3 MB)`);
            return;
        }
        setExtracting(true);
        try {
            const { data } = await materialApi.ocrExtract(file);
            setDraftId(data.draftId);
            setDraftKind('ocr');
            setDraftText(data.text);
            setDraftTitle(`${subject.name} — ${file.name.split('.')[0]}`);
            setDraftMeta(data.sourceMeta);
            toast.info(data.notice || "Matnni tekshirib chiqing");
        }
        catch (e) {
            toast.error(e.response?.data?.error || "OCR xatoligi");
        }
        finally {
            setExtracting(false);
        }
    };
    // ─── Tab 3: Fayl (PDF/DOCX/PPTX) ──────────────────────────────────────
    const onFilePick = async (file) => {
        if (file.size > (limits?.rules.maxFileBytes || 7 * 1024 * 1024)) {
            toast.error(`Fayl juda katta (maksimum 7 MB)`);
            return;
        }
        setExtracting(true);
        try {
            const { data } = await materialApi.fileParse(file);
            setDraftId(data.draftId);
            setDraftKind('file');
            setDraftText(data.text);
            setDraftTitle(`${subject.name} — ${file.name.split('.')[0]}`);
            setDraftMeta(data.sourceMeta);
            if (data.wasTrimmed) {
                toast.info(`Matn juda uzun edi (${data.originalChars} belgi) — qisqartirildi`);
            }
            else {
                toast.info(data.notice || "Matnni tekshirib chiqing");
            }
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Fayl tahlilida xatolik");
        }
        finally {
            setExtracting(false);
        }
    };
    // ─── Draft saqlash (OCR/File uchun) ───────────────────────────────────
    const onDraftSave = async () => {
        if (!draftId || !draftKind)
            return;
        if (draftText.length < (limits?.rules.minTextChars || 50)) {
            toast.error(`Matn juda qisqa (kamida ${limits?.rules.minTextChars || 50} belgi)`);
            return;
        }
        setSaving(true);
        try {
            if (draftKind === 'ocr') {
                await materialApi.ocrSave(draftId, subject.id, draftTitle, draftText);
            }
            else {
                await materialApi.fileSave(draftId, subject.id, draftTitle, draftText);
            }
            toast.success("Material qo'shildi!");
            navigate(`/subjects/${subject.id}`);
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Saqlashda xatolik");
        }
        finally {
            setSaving(false);
        }
    };
    const onDraftCancel = () => {
        setDraftId(null);
        setDraftKind(null);
        setDraftText('');
        setDraftTitle('');
        setDraftMeta(null);
    };
    const maxChars = limits?.rules.maxTextChars || 30000;
    const ocrLeft = limits ? (limits.ocrUploads.limit === null ? -1 : (limits.ocrUploads.limit - limits.ocrUploads.used)) : -1;
    const fileLeft = limits ? (limits.fileUploads.limit === null ? -1 : (limits.fileUploads.limit - limits.fileUploads.used)) : -1;
    return (_jsxs("div", { className: "material-add-page", children: [_jsxs("header", { className: "add-header", children: [_jsx("button", { className: "btn-back", onClick: () => navigate(`/subjects/${subject.id}`), children: "\u2190" }), _jsxs("h1", { children: [subject.icon, " Material qo'shish"] })] }), draftId && draftKind ? (_jsxs("div", { className: "draft-editor", children: [_jsxs("div", { className: "notice-banner", children: [_jsx("span", { children: "\u26A0\uFE0F" }), _jsxs("div", { children: [_jsx("strong", { children: "Matnni tekshirib chiqing" }), _jsx("div", { className: "notice-text", children: draftKind === 'ocr'
                                            ? "OCR 100% aniq bo'lmasligi mumkin — kerak bo'lsa tahrirlang"
                                            : "Fayldan ajratilgan matn — kerak bo'lsa tahrirlang" })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Sarlavha" }), _jsx("input", { type: "text", value: draftTitle, onChange: e => setDraftTitle(e.target.value), placeholder: "Material nomi", maxLength: 100 })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { children: ["Matn (", draftText.length, "/", maxChars, " belgi)"] }), _jsx("textarea", { value: draftText, onChange: e => setDraftText(e.target.value.slice(0, maxChars)), rows: 14, placeholder: "Matn shu yerda..." })] }), draftMeta && (_jsxs("div", { className: "meta-info", children: [draftMeta.fileName && _jsxs("div", { children: ["\uD83D\uDCC4 ", draftMeta.fileName] }), draftMeta.fileSizeKb && _jsx("div", { children: formatBytes(draftMeta.fileSizeKb) }), draftMeta.pageCount && _jsxs("div", { children: [draftMeta.pageCount, " sahifa"] })] })), _jsxs("div", { className: "draft-actions", children: [_jsx("button", { className: "btn-secondary", onClick: onDraftCancel, disabled: saving, children: "Bekor qilish" }), _jsx("button", { className: "btn-primary", onClick: onDraftSave, disabled: saving, children: saving ? "Saqlanmoqda..." : "💾 Saqlash" })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "add-tabs", children: [_jsxs("button", { className: `add-tab ${tab === 'text' ? 'active' : ''}`, onClick: () => setTab('text'), children: [_jsx("span", { children: "\uD83D\uDCDD" }), " Matn"] }), _jsxs("button", { className: `add-tab ${tab === 'image' ? 'active' : ''}`, onClick: () => setTab('image'), children: [_jsx("span", { children: "\uD83D\uDCF7" }), " Rasm"] }), _jsxs("button", { className: `add-tab ${tab === 'file' ? 'active' : ''}`, onClick: () => setTab('file'), children: [_jsx("span", { children: "\uD83D\uDCC1" }), " Fayl"] })] }), tab === 'text' && (_jsxs("div", { className: "tab-content", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Sarlavha (ixtiyoriy)" }), _jsx("input", { type: "text", value: textTitle, onChange: e => setTextTitle(e.target.value), placeholder: `${subject.name} — matn`, maxLength: 100 })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { children: ["Matn", _jsxs("span", { className: "char-count", children: [textContent.length, " / ", maxChars, " belgi"] })] }), _jsx("textarea", { value: textContent, onChange: e => setTextContent(e.target.value.slice(0, maxChars)), rows: 14, placeholder: `O'quv materialingizni shu yerga yopishtiring (kamida ${limits?.rules.minTextChars || 50}, maksimum ${maxChars} belgi)` })] }), _jsxs("div", { className: "info-text", children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Free tarif:" }), " 1 ta fanga 1 ta matn material", _jsx("br", {}), "\uD83D\uDC8E ", _jsx("strong", { children: "Pro tarif:" }), " 20 tagacha material"] }), _jsx("button", { className: "btn-primary btn-full", onClick: onTextSave, disabled: saving || textContent.length < (limits?.rules.minTextChars || 50), children: saving ? "Saqlanmoqda..." : "💾 Saqlash" })] })), tab === 'image' && (_jsxs("div", { className: "tab-content", children: [_jsxs("div", { className: "upload-area", onClick: () => imageInputRef.current?.click(), children: [_jsx("input", { ref: imageInputRef, type: "file", accept: "image/jpeg,image/jpg,image/png", hidden: true, onChange: e => e.target.files?.[0] && onImagePick(e.target.files[0]) }), _jsx("div", { className: "upload-icon", children: "\uD83D\uDCF7" }), _jsx("div", { className: "upload-title", children: "Rasm yuklang" }), _jsx("div", { className: "upload-sub", children: "AI rasmdan matnni avtomatik ajratib oladi (OCR)" }), _jsx("div", { className: "upload-formats", children: ".jpg, .jpeg, .png \u00B7 Maks 3 MB" })] }), _jsxs("div", { className: "info-text", children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Bugun qoldi:" }), " ", ocrLeft === -1 ? '∞' : `${ocrLeft} ta OCR`, _jsx("br", {}), "\u26A0\uFE0F Test yaratishdan oldin matnni tekshirib chiqing \u2014 OCR 100% aniq bo'lmasligi mumkin"] })] })), tab === 'file' && (_jsxs("div", { className: "tab-content", children: [_jsxs("div", { className: "upload-area", onClick: () => fileInputRef.current?.click(), children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation", hidden: true, onChange: e => e.target.files?.[0] && onFilePick(e.target.files[0]) }), _jsx("div", { className: "upload-icon", children: "\uD83D\uDCC1" }), _jsx("div", { className: "upload-title", children: "Fayl yuklang" }), _jsx("div", { className: "upload-sub", children: "PDF, Word yoki PowerPoint" }), _jsx("div", { className: "upload-formats", children: ".pdf, .docx, .pptx \u00B7 Maks 7 MB, 20 sahifa" })] }), _jsxs("div", { className: "info-text", children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Bugun qoldi:" }), " ", fileLeft === -1 ? '∞' : `${fileLeft} ta fayl`, _jsx("br", {}), "\u26A0\uFE0F Bu funksiya faqat Pro/VIP tariflarda mavjud"] })] }))] })), extracting && (_jsxs("div", { className: "loading-overlay", children: [_jsx("div", { className: "big-spinner" }), _jsx("div", { children: "Matn ajratilmoqda..." })] }))] }));
}
