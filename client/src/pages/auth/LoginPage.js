import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useToast } from '../../components/Toast';
// Identifier turini aniqlash (UI uchun)
function detectIdentifierType(s) {
    const t = s.trim();
    if (!t)
        return 'unknown';
    if (t.includes('@'))
        return 'email';
    if (/^[+\d\s()-]+$/.test(t))
        return 'phone';
    return 'unknown';
}
export default function LoginPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { login } = useAppStore();
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const idType = detectIdentifierType(identifier);
    const submit = async () => {
        if (!identifier.trim() || !password) {
            toast.error("Email/telefon va parol kerak");
            return;
        }
        setLoading(true);
        try {
            await login(identifier.trim(), password);
            navigate('/', { replace: true });
        }
        catch (e) {
            toast.error(e?.response?.data?.error || "Kirish xato");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { minHeight: '100vh', padding: '24px 24px', display: 'flex', flexDirection: 'column' }, children: [_jsx("button", { onClick: () => navigate('/auth/welcome'), style: {
                    background: 'none', border: 'none', color: 'var(--txt-2)',
                    fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 12,
                    alignSelf: 'flex-start',
                }, children: "\u2190" }), _jsx("h1", { style: {
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 32, fontWeight: 800, margin: 0,
                }, children: "Kirish" }), _jsx("p", { style: { fontSize: 13, color: 'var(--txt-2)', marginTop: 6 }, children: "Akkountingizga kiring" }), _jsxs("div", { style: { marginTop: 24, display: 'grid', gap: 12 }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700 }, children: "EMAIL YOKI TELEFON NOMER" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { type: "text", value: identifier, onChange: e => setIdentifier(e.target.value), placeholder: "email@example.com  yoki  +998 90 123 45 67", autoComplete: "username", disabled: loading, style: inputStyle, onKeyDown: e => e.key === 'Enter' && submit(), inputMode: idType === 'phone' ? 'tel' : 'email' }), identifier && (_jsx("div", { style: {
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            fontSize: 16, color: 'var(--txt-3)', pointerEvents: 'none',
                                        }, children: idType === 'email' ? '📧' : idType === 'phone' ? '📱' : '' }))] })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700 }, children: "PAROL" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { type: showPwd ? "text" : "password", value: password, onChange: e => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", disabled: loading, style: { ...inputStyle, paddingRight: 44 }, onKeyDown: e => e.key === 'Enter' && submit() }), _jsx("button", { type: "button", onClick: () => setShowPwd(p => !p), style: {
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--txt-3)',
                                            cursor: 'pointer', fontSize: 14, padding: 4,
                                        }, children: showPwd ? '🙈' : '👁' })] })] })] }), _jsx("button", { onClick: submit, disabled: loading, style: {
                    marginTop: 20,
                    background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                    color: 'white',
                    border: 'none',
                    borderRadius: 14,
                    padding: '15px 18px',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: loading ? 'wait' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                }, children: loading ? '⏳ Kirilmoqda...' : 'Kirish →' }), _jsx("button", { onClick: () => {
                    const adminUser = window.ADMIN_USERNAME || '';
                    if (adminUser) {
                        const url = `https://t.me/${adminUser}?text=${encodeURIComponent('Salom! Men FIKRA akkountimga kira olmayman, parolni unutdim. Yordam bering iltimos.')}`;
                        window.open(url, '_blank');
                    }
                    else {
                        toast.info("Adminga murojaat qiling");
                    }
                }, style: {
                    marginTop: 12,
                    background: 'none',
                    border: 'none',
                    color: 'var(--txt-3)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 8,
                    textAlign: 'center',
                }, children: "Parolni unutdingizmi? Adminga murojaat" }), _jsx("div", { style: { flex: 1 } }), _jsxs("div", { style: { textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', marginTop: 16 }, children: ["Hali akkountingiz yo'qmi?", ' ', _jsx("button", { onClick: () => navigate('/auth/register'), style: {
                            background: 'none', border: 'none', color: 'var(--acc-l)',
                            fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12,
                        }, children: "Ro'yxatdan o'tish" })] })] }));
}
const inputStyle = {
    width: '100%',
    background: 'var(--s1)',
    border: '1px solid var(--f)',
    color: 'var(--txt)',
    borderRadius: 12,
    padding: '13px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
};
