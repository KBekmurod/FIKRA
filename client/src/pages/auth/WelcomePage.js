import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
export default function WelcomePage() {
    const navigate = useNavigate();
    return (_jsxs("div", { style: { minHeight: '100vh', padding: '32px 24px', display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { style: { textAlign: 'center', marginTop: 28 }, children: [_jsxs("h1", { style: {
                            fontFamily: "'Syne', sans-serif",
                            fontSize: 56,
                            fontWeight: 800,
                            margin: 0,
                            background: 'linear-gradient(135deg, #fff, var(--acc-l))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1,
                        }, children: ["FIKRA", _jsx("span", { style: { color: 'var(--acc)' }, children: "." })] }), _jsx("div", { style: {
                            display: 'inline-block',
                            padding: '5px 14px',
                            background: 'rgba(123,104,238,0.15)',
                            border: '1px solid rgba(123,104,238,0.3)',
                            borderRadius: 100,
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--acc-l)',
                            marginTop: 14,
                            letterSpacing: 0.5,
                        }, children: "DTM TAYYORLIK PLATFORMASI" }), _jsxs("p", { style: {
                            fontSize: 14,
                            color: 'var(--txt-2)',
                            marginTop: 16,
                            lineHeight: 1.55,
                            maxWidth: 320,
                            margin: '16px auto 0',
                        }, children: ["AI yordamida shaxsiy testlar yarating va DTM'ga", _jsx("strong", { style: { color: 'var(--txt)' }, children: " ishonchli tayyorgarlik " }), "ko'ring"] })] }), _jsxs("div", { style: { marginTop: 28, display: 'grid', gap: 8 }, children: [_jsx(FeatureItem, { icon: "\uD83C\uDFDB", text: "Konspekt, PDF, rasm \u2014 har biridan AI test" }), _jsx(FeatureItem, { icon: "\uD83C\uDF93", text: "DTM standart bloklarini ishlash" }), _jsx(FeatureItem, { icon: "\uD83C\uDFAF", text: "Xatolaringizni AI tushuntiradi" }), _jsx(FeatureItem, { icon: "\uD83D\uDCCA", text: "Delta \u2192 Beta \u2192 Alfa darajalar" })] }), _jsx("div", { style: { flex: 1 } }), _jsxs("div", { style: { marginTop: 28, display: 'grid', gap: 10 }, children: [_jsx("button", { onClick: () => navigate('/auth/register'), style: {
                            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                            color: 'white',
                            border: 'none',
                            borderRadius: 14,
                            padding: '15px 18px',
                            fontSize: 14,
                            fontWeight: 800,
                            cursor: 'pointer',
                        }, children: "Ro'yxatdan o'tish" }), _jsx("button", { onClick: () => navigate('/auth/login'), style: {
                            background: 'var(--s1)',
                            color: 'var(--txt)',
                            border: '1px solid var(--f)',
                            borderRadius: 14,
                            padding: '15px 18px',
                            fontSize: 14,
                            fontWeight: 800,
                            cursor: 'pointer',
                        }, children: "Mavjud akkountga kirish" })] }), _jsxs("div", { style: {
                    marginTop: 14, marginBottom: 8,
                    fontSize: 10, color: 'var(--txt-3)', textAlign: 'center',
                    lineHeight: 1.5,
                }, children: ["Ro'yxatdan o'tib siz ", _jsx("strong", { children: "Foydalanish shartlari" }), ' ', "va ", _jsx("strong", { children: "Maxfiylik" }), " bilan rozisiz"] })] }));
}
function FeatureItem({ icon, text }) {
    return (_jsxs("div", { style: {
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
        }, children: [_jsx("span", { style: { fontSize: 20 }, children: icon }), _jsx("span", { style: { fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.4 }, children: text })] }));
}
