import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
// PDF mind-mapdagi tayyor yo'nalish bloklari
const DIRECTION_BLOCKS = [
    {
        id: 'engineering',
        name: 'Muhandislik · Texnologiya',
        icon: '⚙️',
        subjects: [
            { id: 'math', name: 'Matematika' },
            { id: 'fizika', name: 'Fizika' },
        ],
    },
    {
        id: 'medicine',
        name: 'Tibbiyot · Q-xo\'jaligi',
        icon: '🏥',
        subjects: [
            { id: 'bio', name: 'Biologiya' },
            { id: 'kimyo', name: 'Kimyo' },
        ],
    },
    {
        id: 'international',
        name: 'Xalqaro · Turizm',
        icon: '🌍',
        subjects: [
            { id: 'tarix', name: 'Tarix' },
            { id: 'ingliz', name: 'Chet tili' },
        ],
    },
    {
        id: 'philology',
        name: 'Filologiya',
        icon: '📖',
        subjects: [
            { id: 'adab', name: 'Ona tili va adabiyot' },
            { id: 'ingliz', name: 'Chet tili' },
        ],
    },
    {
        id: 'economy',
        name: "Iqtisod · IT",
        icon: '💰',
        subjects: [
            { id: 'math', name: 'Matematika' },
            { id: 'ingliz', name: 'Chet tili' },
        ],
    },
    {
        id: 'geodesy',
        name: 'Geodeziya · Kadastr',
        icon: '🗺',
        subjects: [
            { id: 'tarix', name: 'Tarix' },
            { id: 'geo', name: 'Geografiya' },
        ],
    },
];
// Alohida tanlov uchun barcha mutaxassislik fanlari
const SPEC_SUBJECTS = [
    { id: 'math', name: 'Matematika', icon: '🔢' },
    { id: 'fizika', name: 'Fizika', icon: '⚛' },
    { id: 'kimyo', name: 'Kimyo', icon: '⚗' },
    { id: 'bio', name: 'Biologiya', icon: '🧬' },
    { id: 'geo', name: 'Geografiya', icon: '🌍' },
    { id: 'tarix', name: 'Tarix', icon: '🏛' },
    { id: 'adab', name: 'Adabiyot', icon: '📖' },
    { id: 'ingliz', name: 'Ingliz tili', icon: '🇬🇧' },
    { id: 'rus', name: 'Rus tili', icon: '🇷🇺' },
    { id: 'inform', name: 'Informatika', icon: '💻' },
    { id: 'iqtisod', name: 'Iqtisodiyot', icon: '💰' },
];
export default function BlokTestSetupPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [mode, setMode] = useState('block');
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [customSubjects, setCustomSubjects] = useState([]);
    const [starting, setStarting] = useState(false);
    const toggleCustom = (id) => {
        setCustomSubjects(prev => {
            if (prev.includes(id))
                return prev.filter(x => x !== id);
            if (prev.length >= 2) {
                toast.info('Faqat 2 ta fan tanlash mumkin');
                return prev;
            }
            return [...prev, id];
        });
    };
    const startTest = async () => {
        setStarting(true);
        try {
            // Maxsus blok testida majburiy 3 fan + 2 mutaxassislik
            // Backend `/api/exams/start-dtm` endpointi shuni ta'minlaydi
            let direction;
            let selectedIds;
            if (mode === 'block') {
                if (!selectedBlock) {
                    toast.error('Yo\'nalish tanlang');
                    setStarting(false);
                    return;
                }
                const blk = DIRECTION_BLOCKS.find(b => b.id === selectedBlock);
                selectedIds = blk.subjects.map(s => s.id);
                direction = selectedBlock;
            }
            else {
                if (customSubjects.length !== 2) {
                    toast.error('Aniq 2 ta mutaxassislik tanlang');
                    setStarting(false);
                    return;
                }
                selectedIds = customSubjects;
                direction = `custom_${customSubjects.join('_')}`;
            }
            const { data } = await examApi.startDtm(direction);
            navigate(`/test-run/${data.sessionId}`, {
                state: { mode: 'blok', ...data },
            });
        }
        catch (e) {
            toast.error(e?.response?.data?.error || 'Test boshlashda xatolik');
        }
        finally {
            setStarting(false);
        }
    };
    const canStart = mode === 'block' ? !!selectedBlock : customSubjects.length === 2;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: () => navigate('/testlar/fikra'), style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "\uD83C\uDFAF Maxsus blok" })] }), _jsxs("div", { style: { padding: '8px 20px 24px' }, children: [_jsxs("div", { style: {
                            background: 'rgba(0,212,170,0.08)',
                            border: '1px solid rgba(0,212,170,0.25)',
                            borderRadius: 14,
                            padding: 14,
                            marginBottom: 16,
                        }, children: [_jsx("div", { style: { fontSize: 11, color: 'var(--g)', fontWeight: 800, marginBottom: 8, letterSpacing: 0.5 }, children: "\uD83D\uDCCC MAJBURIY BLOK (avtomatik)" }), _jsxs("div", { style: { fontSize: 12, lineHeight: 1.8, color: 'var(--txt-2)' }, children: ["\u2022 Ona tili (10 savol \u00B7 1.1 ball)", ' ', _jsx("br", {}), "\u2022 Matematika (10 savol \u00B7 1.1 ball)", _jsx("br", {}), "\u2022 O'zbekiston tarixi (10 savol \u00B7 1.1 ball)"] }), _jsx("div", { style: { marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--g)' }, children: "Jami: 33 ball" })] }), _jsx("div", { style: { fontWeight: 800, fontSize: 12, color: 'var(--txt-2)', letterSpacing: 0.5, marginBottom: 10 }, children: "\u2B50 MUTAXASSISLIKNI TANLANG (2 ta)" }), _jsxs("div", { className: "seg-tabs", style: { marginBottom: 12 }, children: [_jsx("button", { className: `seg-tab ${mode === 'block' ? 'active' : ''}`, onClick: () => setMode('block'), children: "Tayyor yo'nalish" }), _jsx("button", { className: `seg-tab ${mode === 'custom' ? 'active' : ''}`, onClick: () => setMode('custom'), children: "Alohida 2 fan" })] }), mode === 'block' && (_jsx("div", { style: { display: 'grid', gap: 8 }, children: DIRECTION_BLOCKS.map(b => {
                            const active = selectedBlock === b.id;
                            return (_jsxs("button", { onClick: () => setSelectedBlock(b.id), style: {
                                    background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
                                    border: `1.5px solid ${active ? 'var(--acc-l)' : 'var(--f)'}`,
                                    borderRadius: 12,
                                    padding: '14px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'left',
                                }, children: [_jsx("div", { style: { fontSize: 22 }, children: b.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: b.name }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }, children: b.subjects.map(s => s.name).join(' + ') })] }), active && _jsx("div", { style: { color: 'var(--acc-l)', fontSize: 18 }, children: "\u2713" })] }, b.id));
                        }) })), mode === 'custom' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: { fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }, children: ["Tanlangan: ", customSubjects.length, "/2"] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }, children: SPEC_SUBJECTS.map(s => {
                                    const active = customSubjects.includes(s.id);
                                    return (_jsxs("button", { onClick: () => toggleCustom(s.id), style: {
                                            background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
                                            border: `1.5px solid ${active ? 'var(--acc-l)' : 'var(--f)'}`,
                                            borderRadius: 12,
                                            padding: '12px 10px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 6,
                                            cursor: 'pointer',
                                            color: 'var(--txt)',
                                        }, children: [_jsx("div", { style: { fontSize: 22 }, children: s.icon }), _jsx("div", { style: { fontSize: 11, fontWeight: 700 }, children: s.name })] }, s.id));
                                }) })] })), _jsxs("div", { style: {
                            marginTop: 14,
                            padding: 12,
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            borderRadius: 10,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 3 }, children: [_jsx("span", { children: "1-mutaxassislik (30 savol)" }), _jsx("span", { style: { fontWeight: 700 }, children: "3.1 \u00D7 30 = 93 ball" })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 }, children: [_jsx("span", { children: "2-mutaxassislik (30 savol)" }), _jsx("span", { style: { fontWeight: 700 }, children: "2.1 \u00D7 30 = 63 ball" })] }), _jsxs("div", { style: {
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: 6,
                                    borderTop: '1px solid var(--f)',
                                    fontWeight: 800,
                                    color: 'var(--txt)',
                                    fontSize: 13,
                                }, children: [_jsx("span", { children: "JAMI" }), _jsx("span", { style: { color: 'var(--g)' }, children: "189 ball" })] })] }), _jsx("button", { onClick: startTest, disabled: !canStart || starting, className: "btn btn-primary btn-block btn-lg", style: { marginTop: 16, opacity: canStart ? 1 : 0.5 }, children: starting ? '⏳ Boshlanmoqda...' : 'TESTNI BOSHLASH →' })] })] }));
}
