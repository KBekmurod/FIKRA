import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
const COMPULSORY = [
    { id: 'uztil', name: 'Ona tili', icon: '📖', count: 10, weight: 1.1 },
    { id: 'math', name: 'Matematika', icon: '🔢', count: 10, weight: 1.1 },
    { id: 'tarix', name: "O'zbekiston tarixi", icon: '🏛', count: 10, weight: 1.1 },
];
const SPECIALTIES = [
    { id: 'math', name: 'Matematika', icon: '🔢', count: 30, weight: 3.1 },
    { id: 'fizika', name: 'Fizika', icon: '⚛', count: 30, weight: 3.1 },
    { id: 'kimyo', name: 'Kimyo', icon: '⚗', count: 30, weight: 2.1 },
    { id: 'bio', name: 'Biologiya', icon: '🧬', count: 30, weight: 3.1 },
    { id: 'geo', name: 'Geografiya', icon: '🌍', count: 30, weight: 3.1 },
    { id: 'tarix', name: 'Tarix', icon: '🏛', count: 30, weight: 3.1 },
    { id: 'adab', name: 'Adabiyot', icon: '📖', count: 30, weight: 2.1 },
    { id: 'ingliz', name: 'Ingliz tili', icon: '🇬🇧', count: 30, weight: 2.1 },
    { id: 'rus', name: 'Rus tili', icon: '🇷🇺', count: 30, weight: 2.1 },
    { id: 'inform', name: 'Informatika', icon: '💻', count: 30, weight: 3.1 },
    { id: 'iqtisod', name: 'Iqtisodiyot', icon: '💰', count: 30, weight: 2.1 },
];
export default function FreeTestSetupPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [selected, setSelected] = useState(new Set());
    const [starting, setStarting] = useState(false);
    const toggle = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    // Statistika
    const selectedCompulsory = COMPULSORY.filter(s => selected.has('c_' + s.id));
    const selectedSpec = SPECIALTIES.filter(s => selected.has('s_' + s.id));
    const totalQuestions = selectedCompulsory.reduce((a, b) => a + b.count, 0) +
        selectedSpec.reduce((a, b) => a + b.count, 0);
    const totalScore = selectedCompulsory.reduce((a, b) => a + b.count * b.weight, 0) +
        selectedSpec.reduce((a, b) => a + b.count * b.weight, 0);
    const startTest = async () => {
        if (selected.size === 0) {
            toast.error('Kamida 1 ta fan tanlang');
            return;
        }
        setStarting(true);
        try {
            // Backend: /api/exams/start-subject endpointi
            const subjectIds = [
                ...selectedCompulsory.map(s => s.id),
                ...selectedSpec.map(s => s.id),
            ];
            // Duplicate olib tashlaymiz (masalan math majburiy + math mutaxassislikda bo'lsa)
            const unique = [...new Set(subjectIds)];
            const { data } = await examApi.startSubject(unique);
            navigate(`/test-run/${data.sessionId}`, {
                state: { mode: 'free', ...data },
            });
        }
        catch (e) {
            toast.error(e?.response?.data?.error || 'Test boshlashda xatolik');
        }
        finally {
            setStarting(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: () => navigate('/testlar/fikra'), style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "\uD83D\uDCDA Erkin tanlov" })] }), _jsxs("div", { style: { padding: '8px 20px 24px' }, children: [_jsx("p", { style: { fontSize: 12, color: 'var(--txt-2)', margin: '4px 0 16px' }, children: "Istagan kombinatsiyada fanlarni tanlang" }), _jsx("div", { style: { fontWeight: 800, fontSize: 11, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 10 }, children: "\uD83D\uDCCC MAJBURIY FANLAR" }), _jsx("div", { style: { display: 'grid', gap: 6, marginBottom: 18 }, children: COMPULSORY.map(s => {
                            const key = 'c_' + s.id;
                            const active = selected.has(key);
                            return (_jsxs("button", { onClick: () => toggle(key), style: {
                                    background: active ? 'rgba(0,212,170,0.12)' : 'var(--s1)',
                                    border: `1.5px solid ${active ? 'var(--g)' : 'var(--f)'}`,
                                    borderRadius: 10,
                                    padding: '11px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'left',
                                }, children: [_jsx("div", { style: { fontSize: 20 }, children: s.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: s.name }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: [s.count, " savol \u00B7 ", s.weight, " ball"] })] }), _jsx("div", { style: {
                                            width: 22, height: 22, borderRadius: 6,
                                            border: `1.5px solid ${active ? 'var(--g)' : 'var(--txt-3)'}`,
                                            background: active ? 'var(--g)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: 14, fontWeight: 800,
                                        }, children: active ? '✓' : '' })] }, key));
                        }) }), _jsx("div", { style: { fontWeight: 800, fontSize: 11, color: 'var(--acc-l)', letterSpacing: 0.5, marginBottom: 10 }, children: "\u2B50 MUTAXASSISLIK FANLARI" }), _jsx("div", { style: { display: 'grid', gap: 6, marginBottom: 18 }, children: SPECIALTIES.map(s => {
                            const key = 's_' + s.id;
                            const active = selected.has(key);
                            return (_jsxs("button", { onClick: () => toggle(key), style: {
                                    background: active ? 'rgba(123,104,238,0.12)' : 'var(--s1)',
                                    border: `1.5px solid ${active ? 'var(--acc-l)' : 'var(--f)'}`,
                                    borderRadius: 10,
                                    padding: '11px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'left',
                                }, children: [_jsx("div", { style: { fontSize: 20 }, children: s.icon }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13 }, children: s.name }), _jsxs("div", { style: { fontSize: 10, color: 'var(--txt-3)' }, children: [s.count, " savol \u00B7 ", s.weight, " ball"] })] }), _jsx("div", { style: {
                                            width: 22, height: 22, borderRadius: 6,
                                            border: `1.5px solid ${active ? 'var(--acc-l)' : 'var(--txt-3)'}`,
                                            background: active ? 'var(--acc-l)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: 14, fontWeight: 800,
                                        }, children: active ? '✓' : '' })] }, key));
                        }) }), selected.size > 0 && (_jsxs("div", { style: {
                            position: 'sticky',
                            bottom: 8,
                            background: 'rgba(10,10,20,0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1.5px solid rgba(123,104,238,0.3)',
                            borderRadius: 14,
                            padding: 14,
                            marginTop: 10,
                        }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 }, children: [_jsx("span", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Tanlangan" }), _jsxs("span", { style: { fontSize: 11, fontWeight: 700 }, children: [selected.size, " fan \u00B7 ", totalQuestions, " savol"] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 }, children: [_jsx("span", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Maksimal ball" }), _jsx("span", { style: { fontSize: 13, fontWeight: 800, color: 'var(--acc-l)' }, children: totalScore.toFixed(1) })] }), _jsx("button", { onClick: startTest, disabled: starting, className: "btn btn-primary btn-block btn-lg", children: starting ? '⏳ Boshlanmoqda...' : 'TESTNI BOSHLASH →' })] }))] })] }));
}
