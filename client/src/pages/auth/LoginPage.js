import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useToast } from '../../components/Toast';
import { GoogleLogin } from '@react-oauth/google';
export default function LoginPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { googleLogin } = useAppStore();
    const [loading, setLoading] = useState(false);
    return (_jsxs("div", { style: { minHeight: '100vh', padding: '24px 24px', display: 'flex', flexDirection: 'column' }, children: [_jsx("button", { onClick: () => navigate('/auth/welcome'), style: {
                    background: 'none', border: 'none', color: 'var(--txt-2)',
                    fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 12,
                    alignSelf: 'flex-start',
                }, children: "\u2190" }), _jsx("h1", { style: {
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 32, fontWeight: 800, margin: 0,
                }, children: "Kirish" }), _jsx("p", { style: { fontSize: 13, color: 'var(--txt-2)', marginTop: 6, marginBottom: 40 }, children: "Akkountingizga Google orqali kiring" }), loading ? (_jsx("div", { style: { textAlign: 'center', padding: 20, color: 'var(--txt-2)' }, children: "\u23F3 Kirilmoqda..." })) : (_jsx("div", { style: { display: 'flex', justifyContent: 'center' }, children: _jsx(GoogleLogin, { onSuccess: async (credentialResponse) => {
                        if (credentialResponse.credential) {
                            setLoading(true);
                            try {
                                await googleLogin(credentialResponse.credential);
                                navigate('/', { replace: true });
                            }
                            catch (e) {
                                toast.error(e?.response?.data?.error || "Google bilan kirishda xato");
                            }
                            finally {
                                setLoading(false);
                            }
                        }
                    }, onError: () => toast.error('Google bilan ulanishda xatolik'), theme: "filled_black", shape: "pill", text: "continue_with", size: "large", width: "100%" }) })), _jsx("div", { style: { flex: 1 } }), _jsxs("div", { style: { textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', marginTop: 16 }, children: ["Hali akkountingiz yo'qmi?", ' ', _jsx("button", { onClick: () => navigate('/auth/register'), style: {
                            background: 'none', border: 'none', color: 'var(--acc-l)',
                            fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12,
                        }, children: "Ro'yxatdan o'tish" })] })] }));
}
