import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { materialApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import './MaterialAddPage.css';
export default function MaterialEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [material, setMaterial] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!id)
            return;
        materialApi.get(id).then(({ data }) => {
            setMaterial(data.material);
            setTitle(data.material.title);
            setContent(data.material.content);
        }).catch(() => {
            toast.error("Material topilmadi");
            navigate('/subjects');
        }).finally(() => setLoading(false));
    }, [id]);
    const onSave = async () => {
        if (!id)
            return;
        if (content.length < 50) {
            toast.error("Matn juda qisqa (kamida 50 belgi)");
            return;
        }
        setSaving(true);
        try {
            await materialApi.update(id, { title, content });
            toast.success("Yangilandi!");
            navigate(`/subjects/${material.subjectId}`);
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Xatolik");
        }
        finally {
            setSaving(false);
        }
    };
    if (loading)
        return _jsx("div", { className: "loading-overlay", children: _jsx("div", { className: "big-spinner" }) });
    if (!material)
        return null;
    return (_jsxs("div", { className: "material-add-page", children: [_jsxs("header", { className: "add-header", children: [_jsx("button", { className: "btn-back", onClick: () => navigate(`/subjects/${material.subjectId}`), children: "\u2190" }), _jsx("h1", { children: "\u270F\uFE0F Tahrirlash" })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Sarlavha" }), _jsx("input", { type: "text", value: title, onChange: e => setTitle(e.target.value), maxLength: 100 })] }), _jsxs("div", { className: "form-group", children: [_jsxs("label", { children: ["Matn ", _jsxs("span", { className: "char-count", children: [content.length, " / 30000 belgi"] })] }), _jsx("textarea", { value: content, onChange: e => setContent(e.target.value.slice(0, 30000)), rows: 16 })] }), _jsx("button", { className: "btn-primary btn-full", onClick: onSave, disabled: saving, children: saving ? "Saqlanmoqda..." : "💾 Saqlash" })] }));
}
