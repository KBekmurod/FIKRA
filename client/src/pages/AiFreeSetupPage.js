import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { folderApi, streamJsonFetch } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import { SUBJECTS, COMPULSORY_IDS, SPEC_BY_CATEGORY } from '../constants/subjects';
export default function AiFreeSetupPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/testlar/ai');
    const toast = useToast();
    const [selected, setSelected] = useState([]);
    const [foldersBySubj, setFoldersBySubj] = useState({});
    const [starting, setStarting] = useState(false);
    // Fan qo'shish
    const addSubject = async (id) => {
        if (selected.length >= 5) {
            toast.error("Maksimum 5 ta fan");
            return;
        }
        if (selected.some(s => s.id === id)) {
            toast.info("Bu fan allaqachon tanlangan");
            return;
        }
        const context = COMPULSORY_IDS.includes(id) ? 'majburiy' : 'mutaxassislik';
        setSelected(prev => [...prev, { id, context, folderIds: [], count: context === 'majburiy' ? 10 : 20 }]);
        // Papkalarni yuklash
        if (!foldersBySubj[id]) {
            try {
                const { data } = await folderApi.bySubject(id, context);
                setFoldersBySubj(prev => ({ ...prev, [id]: data.folders }));
            }
            catch { }
        }
    };
    const removeSubject = (id) => {
        setSelected(prev => prev.filter(s => s.id !== id));
    };
    const toggleFolder = (subjId, folderId) => {
        setSelected(prev => prev.map(s => {
            if (s.id !== subjId)
                return s;
            const has = s.folderIds.includes(folderId);
            return { ...s, folderIds: has ? s.folderIds.filter(id => id !== folderId) : [...s.folderIds, folderId] };
        }));
    };
    const updateCount = (id, count) => {
        setSelected(prev => prev.map(s => s.id === id ? { ...s, count } : s));
    };
    const totalQuestions = selected.reduce((a, s) => a + s.count, 0);
    const isReady = selected.length >= 2 && selected.every(s => s.folderIds.length > 0);
    const startTest = async () => {
        if (!isReady) {
            toast.error("Kamida 2 ta fan va har biri uchun papka tanlash kerak");
            return;
        }
        setStarting(true);
        try {
            const { data } = await streamJsonFetch('/api/personal-tests/ai-free', {
                subjects: selected.map(s => ({
                    id: s.id,
                    folderIds: s.folderIds,
                    count: s.count,
                })),
            });
            navigate(`/personal-tests/${data.testId}/run`, {
                state: {
                    testId: data.testId,
                    subjectId: data.subjectId,
                    subjectName: data.subjectName,
                    totalQuestions: data.totalQuestions,
                    durationSeconds: data.durationSeconds,
                    questions: data.questions,
                },
            });
        }
        catch (e) {
            toast.error(e.response?.data?.error || "Test yaratishda xato");
            setStarting(false);
        }
    };
    // Tanlash uchun barcha fanlar
    const availableSubjects = [
        ...COMPULSORY_IDS,
        ...SPEC_BY_CATEGORY.aniq_tabiiy,
        ...SPEC_BY_CATEGORY.gumanitar,
        ...SPEC_BY_CATEGORY.chet_tili,
        ...SPEC_BY_CATEGORY.boshqa,
    ];
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 15 }, children: "\uD83C\uDFAF AI erkin tanlov" })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsx("p", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }, children: "2-5 ta fan tanlang, har biri uchun papkalar va savol sonini belgilang" }), selected.length > 0 && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { fontSize: 11, fontWeight: 700, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }, children: ["\u2713 TANLANGAN (", selected.length, "/5) \u00B7 Jami: ", totalQuestions, " savol"] }), _jsx("div", { style: { display: 'grid', gap: 10, marginBottom: 14 }, children: selected.map(s => {
                                    const subj = SUBJECTS[s.id];
                                    const list = foldersBySubj[s.id] || [];
                                    return (_jsxs("div", { style: {
                                            background: 'var(--s1)',
                                            border: `1px solid ${s.folderIds.length > 0 ? 'rgba(0,212,170,0.3)' : 'rgba(255,95,126,0.25)'}`,
                                            borderRadius: 12, padding: 12,
                                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsx("span", { style: { fontSize: 18 }, children: subj?.icon }), _jsxs("div", { style: { flex: 1, fontWeight: 700, fontSize: 13 }, children: [subj?.name, _jsxs("span", { style: { fontSize: 10, color: 'var(--txt-3)', marginLeft: 6 }, children: ["\u00B7 ", s.context] })] }), _jsx("button", { onClick: () => removeSubject(s.id), style: {
                                                            background: 'none', border: 'none',
                                                            color: 'var(--r)', fontSize: 18, cursor: 'pointer',
                                                            padding: '0 4px',
                                                        }, children: "\u00D7" })] }), _jsxs("div", { style: { marginBottom: 10 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 }, children: [_jsx("label", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }, children: "SAVOL SONI" }), _jsx("span", { style: { fontSize: 12, fontWeight: 700, color: 'var(--acc-l)' }, children: s.count })] }), _jsx("input", { type: "range", min: 5, max: 30, step: 5, value: s.count, onChange: e => updateCount(s.id, parseInt(e.target.value)), style: { width: '100%', accentColor: 'var(--acc)' } })] }), _jsxs("div", { children: [_jsxs("label", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, display: 'block', marginBottom: 4 }, children: ["PAPKALAR ", s.folderIds.length > 0 && _jsxs("span", { style: { color: 'var(--g)' }, children: ["(", s.folderIds.length, " ta)"] })] }), list.length === 0 ? (_jsx("div", { style: { fontSize: 11, color: 'var(--r)', fontStyle: 'italic', padding: '4px 0' }, children: "Papka yo'q \u2014 Omborga material yuklang" })) : (_jsx("div", { style: { display: 'grid', gap: 4 }, children: list.map(f => {
                                                            const isSel = s.folderIds.includes(f._id);
                                                            return (_jsxs("button", { onClick: () => toggleFolder(s.id, f._id), style: {
                                                                    background: isSel ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
                                                                    border: `1px solid ${isSel ? 'var(--g)' : 'var(--f)'}`,
                                                                    borderRadius: 8, padding: '6px 10px',
                                                                    display: 'flex', alignItems: 'center', gap: 8,
                                                                    cursor: 'pointer', color: 'var(--txt)',
                                                                    fontSize: 11, textAlign: 'left',
                                                                }, children: [_jsx("span", { style: {
                                                                            width: 14, height: 14, borderRadius: 4,
                                                                            background: isSel ? 'var(--g)' : 'transparent',
                                                                            border: `1.5px solid ${isSel ? 'var(--g)' : 'var(--txt-3)'}`,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            flexShrink: 0,
                                                                        }, children: isSel && _jsx("span", { style: { color: '#0a0a14', fontSize: 10, fontWeight: 800 }, children: "\u2713" }) }), _jsx("span", { style: { flex: 1 }, children: f.title })] }, f._id));
                                                        }) }))] })] }, s.id));
                                }) })] })), _jsx("div", { style: { fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }, children: "\u2795 FAN QO'SHISH" }), _jsx("div", { style: {
                            display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16,
                        }, children: availableSubjects.map(id => {
                            const subj = SUBJECTS[id];
                            const isSelected = selected.some(s => s.id === id);
                            return (_jsxs("button", { onClick: () => !isSelected && addSubject(id), disabled: isSelected || selected.length >= 5, style: {
                                    padding: '6px 10px',
                                    fontSize: 11, fontWeight: 600,
                                    background: isSelected ? 'rgba(0,212,170,0.1)' : 'var(--s1)',
                                    border: `1px solid ${isSelected ? 'var(--g)' : 'var(--f)'}`,
                                    borderRadius: 100,
                                    color: isSelected ? 'var(--g)' : 'var(--txt-2)',
                                    cursor: isSelected || selected.length >= 5 ? 'default' : 'pointer',
                                    opacity: isSelected || selected.length >= 5 ? 0.6 : 1,
                                }, children: [subj?.icon, " ", subj?.name] }, id));
                        }) }), _jsx("button", { onClick: startTest, disabled: !isReady || starting, style: {
                            width: '100%',
                            background: isReady ? 'linear-gradient(135deg, var(--acc), var(--acc-l))' : 'var(--s2)',
                            color: isReady ? 'white' : 'var(--txt-3)',
                            border: 'none', borderRadius: 14,
                            padding: '15px 18px',
                            fontSize: 14, fontWeight: 800,
                            cursor: isReady && !starting ? 'pointer' : 'default',
                            opacity: starting ? 0.6 : 1,
                        }, children: starting ? '⏳ Yaratilmoqda...' :
                            isReady ? `🚀 ${totalQuestions} ta savolli testni boshlash` :
                                'Kamida 2 ta fan tanlang' }), _jsx("div", { style: { height: 30 } })] })] }));
}
