import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useGoBack } from '../hooks/useGoBack';
export default function FikraTestsPage() {
    const navigate = useNavigate();
    const goBack = useGoBack('/testlar');
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "header", children: [_jsx("button", { onClick: goBack, style: {
                            background: 'none', border: 'none', color: 'var(--txt-2)',
                            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
                        }, children: "\u2190" }), _jsx("div", { className: "header-logo", style: { fontSize: 18 }, children: "\uD83C\uDF93 FIKRA testlari" })] }), _jsxs("div", { style: { padding: '8px 20px 0' }, children: [_jsx("p", { style: { fontSize: 13, color: 'var(--txt-2)', margin: '4px 0 16px' }, children: "DTM standartiga ko'ra ikki xil rejim" }), _jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsxs("button", { onClick: () => navigate('/testlar/fikra/blok'), style: {
                                    background: 'linear-gradient(135deg, rgba(0,212,170,0.14), rgba(74,222,128,0.06))',
                                    border: '1.5px solid rgba(0,212,170,0.3)',
                                    borderRadius: 16,
                                    padding: '20px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'left',
                                }, children: [_jsx("div", { style: { fontSize: 36 }, children: "\uD83C\uDFAF" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 15, color: 'var(--g)', marginBottom: 4 }, children: "Maxsus blok testlar" }), _jsxs("div", { style: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5 }, children: ["Majburiy 3 fan + Mutaxassislik 2 fan \u00B7 Yo'nalish bo'yicha tayyor bloklar yoki alohida tanlov \u00B7 ", _jsx("strong", { children: "189 ball" })] })] }), _jsx("div", { style: { fontSize: 20, color: 'var(--g)' }, children: "\u2192" })] }), _jsxs("button", { onClick: () => navigate('/testlar/fikra/free'), style: {
                                    background: 'linear-gradient(135deg, rgba(123,104,238,0.14), rgba(167,139,250,0.06))',
                                    border: '1.5px solid rgba(123,104,238,0.3)',
                                    borderRadius: 16,
                                    padding: '20px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'left',
                                }, children: [_jsx("div", { style: { fontSize: 36 }, children: "\uD83D\uDCDA" }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { fontWeight: 800, fontSize: 15, color: 'var(--acc-l)', marginBottom: 4 }, children: "Erkin tanlov" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5 }, children: "Fanlarni o'zingiz tanlang \u2014 bittadan barchasigacha \u00B7 Hohlagan kombinatsiya bilan test ishlang" })] }), _jsx("div", { style: { fontSize: 20, color: 'var(--acc-l)' }, children: "\u2192" })] })] }), _jsxs("div", { style: {
                            marginTop: 18,
                            padding: 12,
                            background: 'rgba(255,204,68,0.08)',
                            border: '1px solid rgba(255,204,68,0.2)',
                            borderRadius: 12,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            lineHeight: 1.5,
                        }, children: ["\u26A0\uFE0F ", _jsx("strong", { children: "Diqqat:" }), " Test boshlangach to'liq tugatmasangiz, natija saqlanmaydi. Test ichidan chiqsangiz tarixga yozilmaydi."] })] })] }));
}
