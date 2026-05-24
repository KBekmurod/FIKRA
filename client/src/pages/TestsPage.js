import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
export default function TestsPage() {
    const navigate = useNavigate();
    const { user, setAuthModalOpen } = useAppStore();
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "header", children: _jsx("div", { className: "header-logo", children: "\uD83D\uDCDD Testlar" }) }), _jsxs("div", { style: { padding: '8px 20px 0' }, children: [_jsx("p", { style: { fontSize: 13, color: 'var(--txt-2)', margin: '4px 0 16px' }, children: "Test turini tanlang" }), _jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                        }, children: [_jsxs("button", { onClick: () => {
                                    if (!user)
                                        return setAuthModalOpen(true);
                                    navigate('/testlar/ai');
                                }, style: {
                                    background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(167,139,250,0.10))',
                                    border: '1.5px solid rgba(123,104,238,0.35)',
                                    borderRadius: 18,
                                    padding: '24px 14px',
                                    minHeight: 200,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'center',
                                    gap: 10,
                                }, children: [_jsx("div", { style: { fontSize: 44 }, children: "\uD83E\uDD16" }), _jsx("div", { style: { fontWeight: 800, fontSize: 15, color: 'var(--acc-l)' }, children: "AI testlarim" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 }, children: "Ombordagi materiallaringizdan AI yaratgan testlar" })] }), _jsxs("button", { onClick: () => {
                                    if (!user)
                                        return setAuthModalOpen(true);
                                    navigate('/testlar/fikra');
                                }, style: {
                                    background: 'linear-gradient(135deg, rgba(0,212,170,0.18), rgba(74,222,128,0.10))',
                                    border: '1.5px solid rgba(0,212,170,0.35)',
                                    borderRadius: 18,
                                    padding: '24px 14px',
                                    minHeight: 200,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'var(--txt)',
                                    textAlign: 'center',
                                    gap: 10,
                                }, children: [_jsx("div", { style: { fontSize: 44 }, children: "\uD83C\uDF93" }), _jsx("div", { style: { fontWeight: 800, fontSize: 15, color: 'var(--g)' }, children: "FIKRA testlari" }), _jsx("div", { style: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 }, children: "DTM standart imtihonlari" })] })] }), _jsxs("div", { style: {
                            marginTop: 18,
                            padding: 14,
                            background: 'rgba(123,104,238,0.06)',
                            border: '1px solid rgba(123,104,238,0.15)',
                            borderRadius: 12,
                            fontSize: 11,
                            color: 'var(--txt-2)',
                            lineHeight: 1.6,
                        }, children: [_jsx("div", { style: { fontWeight: 700, color: 'var(--txt)', marginBottom: 6 }, children: "\uD83D\uDCA1 Qaysi birini tanlash kerak?" }), _jsxs("div", { children: [_jsx("strong", { children: "AI testlarim" }), " \u2014 siz yuklagan kitob, dars, konspektlardan yaratiladi. Shaxsiy mavzularingiz uchun."] }), _jsxs("div", { style: { marginTop: 6 }, children: [_jsx("strong", { children: "FIKRA testlari" }), " \u2014 DTM standartiga ko'ra (maxsus blok va erkin tanlov). Imtihonga tayyorgarlik uchun."] })] })] })] }));
}
