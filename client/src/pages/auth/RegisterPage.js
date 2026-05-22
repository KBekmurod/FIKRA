import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useToast } from '../../components/Toast';
export default function RegisterPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const { register } = useAppStore();
    const [name, setName] = useState('');
    const [mode, setMode] = useState('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const submit = async () => {
        if (!name.trim() || name.trim().length < 2) {
            toast.error("Ism kerak (kamida 2 belgi)");
            return;
        }
        let identifier = '';
        if (mode === 'email') {
            if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                toast.error("Email yaroqsiz");
                return;
            }
            identifier = email.trim();
        }
        else {
            // Telefon validatsiyasi (frontend tomon)
            const digitsOnly = phone.replace(/\D/g, '');
            if (digitsOnly.length < 9 || digitsOnly.length > 15) {
                toast.error("Telefon nomer yaroqsiz");
                return;
            }
            identifier = phone.trim();
        }
        if (!password || password.length < 8) {
            toast.error("Parol kamida 8 belgi bo'lsin");
            return;
        }
        if (password !== confirmPwd) {
            toast.error("Parollar mos kelmadi");
            return;
        }
        setLoading(true);
        try {
            await register(identifier, password, name.trim());
            toast.success("Ro'yxatdan o'tildi!");
            navigate('/', { replace: true });
        }
        catch (e) {
            toast.error(e?.response?.data?.error || "Ro'yxatdan o'tishda xato");
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
                }, children: "Ro'yxatdan o'tish" }), _jsx("p", { style: { fontSize: 13, color: 'var(--txt-2)', marginTop: 6 }, children: "Yangi akkount yarating" }), _jsxs("div", { style: { marginTop: 24, display: 'grid', gap: 12 }, children: [_jsxs("div", { children: [_jsx("label", { style: fieldLabel, children: "ISM" }), _jsx("input", { value: name, onChange: e => setName(e.target.value), placeholder: "Ismingiz", autoComplete: "name", disabled: loading, style: inputStyle })] }), _jsxs("div", { children: [_jsx("label", { style: fieldLabel, children: "QAYSI USULDA RO'YXATDAN O'TASIZ?" }), _jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 8 }, children: [_jsx("button", { type: "button", onClick: () => setMode('email'), style: tabBtnStyle(mode === 'email'), children: "\uD83D\uDCE7 Email" }), _jsx("button", { type: "button", onClick: () => setMode('phone'), style: tabBtnStyle(mode === 'phone'), children: "\uD83D\uDCF1 Telefon nomer" })] })] }), mode === 'email' ? (_jsxs("div", { children: [_jsx("label", { style: fieldLabel, children: "EMAIL" }), _jsx("input", { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "email@example.com", autoComplete: "email", inputMode: "email", disabled: loading, style: inputStyle })] })) : (_jsxs("div", { children: [_jsx("label", { style: fieldLabel, children: "TELEFON NOMER" }), _jsx("input", { type: "tel", value: phone, onChange: e => setPhone(e.target.value), placeholder: "+998 90 123 45 67", autoComplete: "tel", inputMode: "tel", disabled: loading, style: inputStyle }), _jsx("div", { style: { fontSize: 10, color: 'var(--txt-3)', marginTop: 4 }, children: "Format: +998 XX XXX XX XX" })] })), _jsxs("div", { children: [_jsx("label", { style: fieldLabel, children: "PAROL (kamida 8 belgi)" }), _jsxs("div", { style: { position: 'relative' }, children: [_jsx("input", { type: showPwd ? "text" : "password", value: password, onChange: e => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "new-password", disabled: loading, style: { ...inputStyle, paddingRight: 44 } }), _jsx("button", { type: "button", onClick: () => setShowPwd(p => !p), style: {
                                            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', color: 'var(--txt-3)',
                                            cursor: 'pointer', fontSize: 14, padding: 4,
                                        }, children: showPwd ? '🙈' : '👁' })] })] }), _jsxs("div", { children: [_jsx("label", { style: fieldLabel, children: "PAROL TASDIQI" }), _jsx("input", { type: showPwd ? "text" : "password", value: confirmPwd, onChange: e => setConfirmPwd(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "new-password", disabled: loading, style: inputStyle, onKeyDown: e => e.key === 'Enter' && submit() })] })] }), _jsx("button", { onClick: submit, disabled: loading, style: {
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
                }, children: loading ? "⏳ Yaratilmoqda..." : "Akkount yaratish →" }), _jsx("div", { style: { flex: 1 } }), _jsxs("div", { style: { textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', marginTop: 16 }, children: ["Akkountingiz bormi?", ' ', _jsx("button", { onClick: () => navigate('/auth/login'), style: {
                            background: 'none', border: 'none', color: 'var(--acc-l)',
                            fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12,
                        }, children: "Kirish" })] })] }));
}
const fieldLabel = {
    fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700,
};
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
function tabBtnStyle(active) {
    return {
        flex: 1,
        padding: '10px 8px',
        background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
        border: `1px solid ${active ? 'var(--acc)' : 'var(--f)'}`,
        color: active ? 'var(--acc-l)' : 'var(--txt-2)',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
    };
}
