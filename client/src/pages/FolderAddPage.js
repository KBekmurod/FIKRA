import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function FolderAddPage() {
    const navigate = useNavigate();
    const { subjectId } = useParams();
    const [searchParams] = useSearchParams();
    const context = searchParams.get('context') || 'mutaxassislik';
    const goBack = useGoBack(`/ombor/${subjectId}?context=${context}`);
    const toast = useToast();
    const [title, setTitle] = useState('');
    const [saving, setSaving] = useState(false);
    const subj = subjectId ? SUBJECTS[subjectId] : null;
    if (!subj) {
        return _jsx("div", { style: { padding: 40, textAlign: 'center' }, children: "Fan topilmadi" });
    }
    const standardCount = context === 'majburiy' ? 10 : 30;
    const submitFolder = async () => {
        const finalTitle = title.trim() || `Yangi papka — ${new Date().toLocaleDateString('uz-UZ')}`;
        setSaving(true);
        try {
            const { data: f } = await api.post('/api/folders', {
                subjectId,
                title: finalTitle,
                context,
            });
            toast.success('Papka yaratildi!');
            // Papka ichiga kiramiz
            navigate(`/ombor/folder/${f.folder._id}`);
        }
        catch (e) {
            toast.error(e.response?.data?.error || 'Xatolik');
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsxs("div", { className: "header-logo", style: { fontSize: 15 }, children: ["\u2295 Yangi Papka (", subj.name, ")"] })] }), _jsxs("div", { style: { padding: '20px' }, children: [_jsxs("div", { style: {
                            padding: 12,
                            background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
                            border: `1px solid ${context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'}`,
                            borderRadius: 10,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            marginBottom: 20,
                        }, children: [_jsx("strong", { style: { color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }, children: context === 'majburiy' ? 'Majburiy' : 'Mutaxassislik' }), ' ', "konteksti \u00B7 AI ", _jsxs("strong", { children: [standardCount, " ta test"] }), " yaratadi"] }), _jsx("label", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 8, display: 'block' }, children: "Mavzu yoki Papka nomi" }), _jsx("input", { value: title, onChange: e => setTitle(e.target.value), placeholder: "Masalan: Kvadrat tenglamalar", maxLength: 200, autoFocus: true, style: {
                            width: '100%',
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            color: 'var(--txt)',
                            borderRadius: 10,
                            padding: '14px',
                            fontSize: 14,
                            marginBottom: 24,
                        } }), _jsx("button", { onClick: submitFolder, disabled: saving, className: "btn btn-primary btn-block btn-lg", style: { opacity: saving ? 0.7 : 1 }, children: saving ? '⏳ Yaratilmoqda...' : '📁 Papka yaratish' })] })] }));
}
