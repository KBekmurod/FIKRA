import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { folderApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import { useJobStore } from '../store/jobStore';
import { SUBJECTS } from '../constants/subjects';
// Frontend yo'nalishlar — backend bilan moslashtirilgan
const DIRECTIONS = [
    { id: 'engineering', name: 'Muhandislik · Texnologiya', icon: '⚙️', spec: ['math', 'fizika'] },
    { id: 'medicine', name: "Tibbiyot · Q-xo'jaligi", icon: '🏥', spec: ['bio', 'kimyo'] },
    { id: 'international', name: 'Xalqaro · Turizm', icon: '🌍', spec: ['tarix', 'ingliz'] },
    { id: 'philology', name: 'Filologiya', icon: '📖', spec: ['adab', 'ingliz'] },
    { id: 'economy', name: 'Iqtisod · IT', icon: '💰', spec: ['math', 'ingliz'] },
    { id: 'geodesy', name: 'Geodeziya · Kadastr', icon: '🗺', spec: ['tarix', 'geo'] },
    { id: 'law', name: "Huquq · Davlat boshqaruvi", icon: '⚖', spec: ['huquq', 'tarix'] },
    { id: 'german_studies', name: 'Nemis tili va madaniyati', icon: '🇩🇪', spec: ['nemis', 'adab'] },
    { id: 'french_studies', name: 'Fransuz tili va madaniyati', icon: '🇫🇷', spec: ['fransuz', 'adab'] },
    { id: 'arabic_studies', name: 'Arab tili va sharqshunoslik', icon: '🕌', spec: ['arab', 'tarix'] },
];
const COMPULSORY = ['uztil', 'math', 'tarix'];
export default function AiBlokSetupPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/testlar/ai');
    const toast = useToast();
    const [selectedDir, setSelectedDir] = useState(null);
    const [folders, setFolders] = useState({});
    const [selectedFolders, setSelectedFolders] = useState({});
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const dir = DIRECTIONS.find(d => d.id === selectedDir);
    const allSubjects = dir ? [...COMPULSORY, ...dir.spec] : [];
    // Yo'nalish tanlanganda har fan uchun papkalarni yuklash
    useEffect(() => {
        if (!dir)
            return;
        setLoading(true);
        const subjectsToLoad = [...COMPULSORY, ...dir.spec];
        Promise.all(subjectsToLoad.map(async (sid) => {
            try {
                // Majburiy fanlar uchun context=majburiy, mutaxassislik uchun context=mutaxassislik
                const context = COMPULSORY.includes(sid) ? 'majburiy' : 'mutaxassislik';
                // math/tarix dual-context — agar dir.spec'da bo'lsa mutaxassislik
                const isInSpec = dir.spec.includes(sid);
                const finalContext = isInSpec ? 'mutaxassislik' : 'majburiy';
                const { data } = await folderApi.bySubject(sid, finalContext);
                return [sid, data.folders];
            }
            catch {
                return [sid, []];
            }
        })).then(results => {
            const map = {};
            results.forEach(([sid, list]) => { map[sid] = list; });
            setFolders(map);
            setLoading(false);
        });
    }, [selectedDir]);
    const toggleFolder = (subjectId, folderId) => {
        setSelectedFolders(prev => {
            const curr = prev[subjectId] || [];
            const next = curr.includes(folderId)
                ? curr.filter(id => id !== folderId)
                : [...curr, folderId];
            return { ...prev, [subjectId]: next };
        });
    };
    const { startJob } = useJobStore();
    const allReady = dir && allSubjects.every(sid => (selectedFolders[sid] || []).length > 0);
    const startTest = async () => {
        if (!dir || !allReady) {
            toast.error("Barcha fanlar uchun papka tanlash kerak");
            return;
        }
        const subjectsPayload = {};
        allSubjects.forEach(sid => {
            subjectsPayload[sid] = { folderIds: selectedFolders[sid] || [] };
        });
        try {
            toast.info("Jarayon yuborilmoqda...");
            const { data } = await api.post('/api/personal-tests/ai-blok', {
                direction: dir.id,
                subjects: subjectsPayload,
            });
            if (data.testId) {
                startJob(data.testId, 'test_generation', 'AI Blok Test');
                navigate('/testlar/ai', { replace: true });
            }
        }
        catch (e) {
            toast.error(e?.response?.data?.error || "Xatolik yuz berdi");
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 15 }, children: "\uD83D\uDCE6 AI maxsus blok" })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsx("div", { style: { fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }, children: "1. YO'NALISH TANLANG" }), _jsx("div", { style: { display: 'grid', gap: 6, marginBottom: 16 }, children: DIRECTIONS.map(d => (_jsxs("button", { onClick: () => { setSelectedDir(d.id); setSelectedFolders({}); }, style: {
                                background: selectedDir === d.id ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
                                border: `1.5px solid ${selectedDir === d.id ? 'var(--acc)' : 'var(--f)'}`,
                                borderRadius: 12, padding: '10px 14px',
                                display: 'flex', alignItems: 'center', gap: 10,
                                cursor: 'pointer', color: 'var(--txt)', textAlign: 'left',
                            }, children: [_jsx("span", { style: { fontSize: 20 }, children: d.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: d.name }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 1 }, children: ["Spec: ", d.spec.map(s => SUBJECTS[s]?.name).join(' + ')] })] }), selectedDir === d.id && _jsx("span", { style: { color: 'var(--acc-l)' }, children: "\u2713" })] }, d.id))) }), dir && (_jsxs(_Fragment, { children: [_jsx("div", { style: { fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }, children: "2. HAR FAN UCHUN PAPKA TANLANG" }), loading ? (_jsx("div", { className: "skel-card" })) : (_jsx("div", { style: { display: 'grid', gap: 10, marginBottom: 16 }, children: allSubjects.map(sid => {
                                    const subj = SUBJECTS[sid];
                                    const list = folders[sid] || [];
                                    const isCompulsory = COMPULSORY.includes(sid);
                                    const count = isCompulsory ? 10 : 30;
                                    const selected = selectedFolders[sid] || [];
                                    return (_jsxs("div", { style: {
                                            background: 'var(--s1)',
                                            border: `1px solid ${selected.length > 0 ? 'rgba(0,212,170,0.3)' : 'var(--f)'}`,
                                            borderRadius: 12, padding: 12,
                                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsx("span", { style: { fontSize: 18 }, children: subj?.icon }), _jsxs("div", { style: { flex: 1, fontWeight: 700, fontSize: 13 }, children: [subj?.name, _jsxs("span", { style: { fontSize: 10, color: 'var(--txt-3)', fontWeight: 500, marginLeft: 6 }, children: ["\u00B7 ", count, " savol \u00B7 ", isCompulsory ? 'majburiy' : 'mutaxassislik'] })] }), selected.length > 0 && (_jsxs("span", { style: { fontSize: 10, color: 'var(--g)', fontWeight: 700 }, children: [selected.length, " ta tanlandi"] }))] }), list.length === 0 ? (_jsx("div", { style: {
                                                    fontSize: 11, color: 'var(--r)',
                                                    padding: '8px 0', fontStyle: 'italic',
                                                }, children: "\u26A0\uFE0F Papka yo'q \u2014 Omborga material yuklang" })) : (_jsx("div", { style: { display: 'grid', gap: 4 }, children: list.map(f => {
                                                    const isSel = selected.includes(f._id);
                                                    return (_jsxs("button", { onClick: () => toggleFolder(sid, f._id), style: {
                                                            background: isSel ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
                                                            border: `1px solid ${isSel ? 'var(--g)' : 'var(--f)'}`,
                                                            borderRadius: 8, padding: '7px 10px',
                                                            display: 'flex', alignItems: 'center', gap: 8,
                                                            cursor: 'pointer', color: 'var(--txt)',
                                                            fontSize: 11, textAlign: 'left',
                                                        }, children: [_jsx("span", { style: {
                                                                    width: 16, height: 16, borderRadius: 4,
                                                                    background: isSel ? 'var(--g)' : 'transparent',
                                                                    border: `1.5px solid ${isSel ? 'var(--g)' : 'var(--txt-3)'}`,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    flexShrink: 0,
                                                                }, children: isSel && _jsx("span", { style: { color: '#0a0a14', fontSize: 11, fontWeight: 800 }, children: "\u2713" }) }), _jsx("span", { style: { flex: 1 }, children: f.title }), f.materialId && (_jsxs("span", { style: { color: 'var(--txt-3)', fontSize: 9 }, children: [f.materialId.charCount.toLocaleString(), " b."] }))] }, f._id));
                                                }) }))] }, sid));
                                }) })), _jsx("button", { onClick: startTest, disabled: !allReady, style: {
                                    width: '100%',
                                    background: allReady ? 'linear-gradient(135deg, var(--acc), var(--acc-l))' : 'var(--s2)',
                                    color: allReady ? 'white' : 'var(--txt-3)',
                                    border: 'none', borderRadius: 14,
                                    padding: '15px 18px',
                                    fontSize: 14, fontWeight: 800,
                                    cursor: allReady ? 'pointer' : 'default',
                                }, children: "\uD83D\uDE80 90 ta savolli blok testni boshlash" })] })), _jsx("div", { style: { height: 30 } })] })] }));
}
