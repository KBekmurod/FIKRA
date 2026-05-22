import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '../hooks/useGoBack';
export default function AiTestsPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/testlar');
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 16 }, children: "\uD83E\uDD16 AI testlarim" })] }), _jsxs("div", { style: { padding: '6px 20px 0' }, children: [_jsx("p", { style: { fontSize: 12, color: 'var(--txt-2)', marginBottom: 16 }, children: "O'z materiallaringizdan DTM standart bo'yicha test yarating" }), _jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsx("button", { onClick: () => navigate('/testlar/ai/papkalar'), style: cardStyle('rgba(0,212,170,0.25)'), children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 14 }, children: [_jsx("div", { style: iconCircle('rgba(0,212,170,0.15)'), children: "\uD83D\uDCC1" }), _jsxs("div", { style: { flex: 1, textAlign: 'left' }, children: [_jsx("div", { style: titleStyle('var(--g)'), children: "Papka testlari" }), _jsx("div", { style: descStyle(), children: "Har papka uchun alohida test (10 yoki 30 savol)" })] }), _jsx("div", { style: arrowStyle(), children: "\u2192" })] }) }), _jsx("button", { onClick: () => navigate('/testlar/ai/blok'), style: cardStyle('rgba(123,104,238,0.3)'), children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 14 }, children: [_jsx("div", { style: iconCircle('rgba(123,104,238,0.15)'), children: "\uD83D\uDCE6" }), _jsxs("div", { style: { flex: 1, textAlign: 'left' }, children: [_jsx("div", { style: titleStyle('var(--acc-l)'), children: "Maxsus blok testi" }), _jsx("div", { style: descStyle(), children: "DTM yo'nalish bo'yicha \u00B7 90 savol \u00B7 189 ball" })] }), _jsx("div", { style: arrowStyle(), children: "\u2192" })] }) }), _jsx("button", { onClick: () => navigate('/testlar/ai/erkin'), style: cardStyle('rgba(255,204,68,0.3)'), children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 14 }, children: [_jsx("div", { style: iconCircle('rgba(255,204,68,0.15)'), children: "\uD83C\uDFAF" }), _jsxs("div", { style: { flex: 1, textAlign: 'left' }, children: [_jsx("div", { style: titleStyle('var(--y)'), children: "Erkin tanlov" }), _jsx("div", { style: descStyle(), children: "2-5 fan va papkalar tanlang \u00B7 har biri uchun savol soni" })] }), _jsx("div", { style: arrowStyle(), children: "\u2192" })] }) })] }), _jsxs("div", { style: {
                            marginTop: 18,
                            padding: 12,
                            background: 'rgba(123,104,238,0.06)',
                            border: '1px solid rgba(123,104,238,0.18)',
                            borderRadius: 10,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            lineHeight: 1.55,
                        }, children: ["\uD83D\uDCA1 ", _jsx("strong", { children: "Eslatma:" }), " Test yaratish uchun avval", ' ', _jsx("strong", { children: "\uD83C\uDFDB Ombor" }), "ga material yuklang. Yetarli material bo'lsa, AI sizning materialingizdan sifatli test savol yaratadi."] }), _jsx("div", { style: { height: 30 } })] })] }));
}
function cardStyle(borderColor) {
    return {
        background: 'var(--s1)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        color: 'var(--txt)',
        width: '100%',
    };
}
function iconCircle(bg) {
    return {
        width: 48, height: 48, borderRadius: 14,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
    };
}
function titleStyle(color) {
    return { fontWeight: 800, fontSize: 14, color, marginBottom: 3 };
}
function descStyle() {
    return { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 };
}
function arrowStyle() {
    return { color: 'var(--txt-3)', fontSize: 18, flexShrink: 0 };
}
