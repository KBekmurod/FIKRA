import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { levelApi } from '../api/endpoints';
import { GRADE_META } from '../constants/subjects';
import SubscriptionModal from '../components/SubscriptionModal';
export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAppStore();
    const [subOpen, setSubOpen] = useState(false);
    const [level, setLevel] = useState(null);
    const isSub = user?.effectivePlan && user.effectivePlan !== 'free';
    const planLabel = {
        free: '', basic: '⭐ Basic', pro: '✨ Pro', vip: '💎 VIP'
    };
    useEffect(() => {
        levelApi.current()
            .then(({ data }) => setLevel(data))
            .catch(() => { });
    }, []);
    const grade = level?.currentGrade || 'beta';
    const gradeMeta = GRADE_META[grade];
    const versionInGrade = level ? (grade === 'beta' ? level.currentVersion
        : grade === 'delta' ? level.currentVersion - 3
            : level.currentVersion - 7) : 1;
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsxs("div", { className: "header-logo", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsx("button", { className: "plan-pill", onClick: () => setSubOpen(true), children: isSub
                            ? _jsx("span", { style: { color: 'var(--y)' }, children: planLabel[user.effectivePlan || 'free'] })
                            : _jsxs(_Fragment, { children: [_jsx("span", { style: { color: 'var(--txt-2)' }, children: "Bepul" }), " ", _jsx("span", { style: { color: 'var(--acc-l)' }, children: "\u2197" })] }) })] }), _jsx("div", { style: { padding: '6px 20px 0' }, children: _jsx("div", { style: {
                        background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(0,212,170,0.08))',
                        border: '1px solid rgba(123,104,238,0.25)',
                        borderRadius: 'var(--br)',
                        padding: 18,
                    }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12 }, children: [_jsx("div", { style: { fontSize: 36 }, children: "\uD83C\uDF93" }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { fontWeight: 800, fontSize: 16 }, children: ["Salom, ", user?.firstName || 'Abituriyent', "!"] }), _jsx("div", { style: { fontSize: 12, color: 'var(--txt-2)', marginTop: 2 }, children: isSub
                                            ? `${planLabel[user.effectivePlan || 'free']} · cheksiz AI`
                                            : "DTM tayyorlik platformasi" })] }), level && (_jsxs("button", { onClick: () => navigate('/level'), style: {
                                    background: gradeMeta.bgColor,
                                    border: `1px solid ${gradeMeta.color}40`,
                                    borderRadius: 12,
                                    padding: '8px 12px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                }, children: [_jsx("div", { style: { fontSize: 18, color: gradeMeta.color, fontWeight: 800 }, children: gradeMeta.icon }), _jsxs("div", { style: { fontSize: 10, fontWeight: 800, color: gradeMeta.color }, children: [gradeMeta.name, " ", versionInGrade] })] }))] }) }) }), _jsx("div", { className: "section-title", children: "Asosiy" }), _jsxs("div", { style: { padding: '0 20px', display: 'grid', gap: 10 }, children: [_jsxs("button", { onClick: () => navigate('/subjects'), style: {
                            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                            border: 'none',
                            borderRadius: 'var(--br)',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            color: 'white',
                            cursor: 'pointer',
                        }, children: [_jsx("div", { style: { fontSize: 36 }, children: "\uD83D\uDCDA" }), _jsxs("div", { style: { flex: 1, textAlign: 'left' }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 17, marginBottom: 2 }, children: "Fanlar" }), _jsx("div", { style: { fontSize: 12, opacity: 0.9 }, children: "Material qo'shing \u00B7 AI test yarating" })] }), _jsx("div", { style: { fontSize: 22 }, children: "\u2192" })] }), _jsxs("button", { onClick: () => navigate('/test'), style: {
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            borderRadius: 'var(--br)',
                            padding: '16px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--txt)',
                            cursor: 'pointer',
                        }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\uD83D\uDCDD" }), _jsxs("div", { style: { flex: 1, textAlign: 'left' }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: "Fikra standart DTM test" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Yo'nalish bo'yicha to'liq imtihon" })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--txt-3)' }, children: "\u2192" })] }), _jsxs("button", { onClick: () => navigate('/cabinet'), style: {
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            borderRadius: 'var(--br)',
                            padding: '16px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--txt)',
                            cursor: 'pointer',
                        }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\uD83C\uDFAF" }), _jsxs("div", { style: { flex: 1, textAlign: 'left' }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: "Xatolar tahlili" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "AI bilan zaif joylarni o'rganing" })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--txt-3)' }, children: "\u2192" })] }), _jsxs("button", { onClick: () => navigate('/ai'), style: {
                            background: 'var(--s1)',
                            border: '1px solid var(--f)',
                            borderRadius: 'var(--br)',
                            padding: '16px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--txt)',
                            cursor: 'pointer',
                        }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\uD83E\uDD16" }), _jsxs("div", { style: { flex: 1, textAlign: 'left' }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 14 }, children: "AI yordamchi" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }, children: "Chat \u00B7 Hujjat \u00B7 Rasm" })] }), _jsx("div", { style: { fontSize: 18, color: 'var(--txt-3)' }, children: "\u2192" })] })] }), !isSub && (_jsx("div", { style: { padding: '16px 20px 0' }, children: _jsxs("button", { onClick: () => setSubOpen(true), style: {
                        width: '100%',
                        background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(255,204,68,0.08))',
                        border: '1px solid rgba(123,104,238,0.25)',
                        borderRadius: 'var(--br)',
                        padding: 16,
                        cursor: 'pointer',
                        color: 'var(--txt)',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }, children: [_jsx("div", { style: { fontSize: 28 }, children: "\u2B50" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 700, fontSize: 13, marginBottom: 2 }, children: "Imkoniyatlarni cheksiz oching" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Basic 149\u2B50 \u00B7 ko'proq material, AI test, fayl yuklash" })] }), _jsx("div", { style: { fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }, children: "\u2197" })] }) })), level && (_jsxs(_Fragment, { children: [_jsx("div", { className: "section-title", children: "Joriy oy statistikasi" }), _jsxs("div", { style: { padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }, children: [_jsxs("div", { className: "card", style: { textAlign: 'center', padding: 14 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--acc-l)' }, children: level.standardTests.total }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Standart" })] }), _jsxs("div", { className: "card", style: { textAlign: 'center', padding: 14 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--g)' }, children: level.personalTests.total }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Shaxsiy" })] }), _jsxs("div", { className: "card", style: { textAlign: 'center', padding: 14 }, children: [_jsxs("div", { style: { fontWeight: 800, fontSize: 22, color: 'var(--y)' }, children: [level.accuracyPercent, "%"] }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)' }, children: "Aniqlik" })] })] })] })), _jsx(SubscriptionModal, { open: subOpen, onClose: () => setSubOpen(false) })] }));
}
