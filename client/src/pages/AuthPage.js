import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../api/endpoints';
import { setAuth } from '../api/client';
import { useAppStore } from '../store';
import { useToast } from '../components/Toast';
export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);
    const { refreshUser } = useAppStore();
    const { toast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                const { data } = await authApi.loginStandard(phone, password);
                setAuth(data.accessToken, data.refreshToken, data.user.telegramId || 0);
                await refreshUser();
            }
            else {
                const { data } = await authApi.register(phone, password, firstName, lastName);
                setAuth(data.accessToken, data.refreshToken, data.user.telegramId || 0);
                toast('Muvaffaqiyatli ro\'yxatdan o\'tingiz', 'ok');
                await refreshUser();
            }
        }
        catch (err) {
            toast(err.response?.data?.error || 'Xatolik yuz berdi', 'err');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const { data } = await authApi.googleLogin(credentialResponse.credential);
            setAuth(data.accessToken, data.refreshToken, data.user.telegramId || 0);
            toast('Google orqali muvaffaqiyatli kirishingiz amalga oshdi', 'ok');
            await refreshUser();
        }
        catch (err) {
            toast(err.response?.data?.error || 'Google bilan kirish xato', 'err');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogleError = () => {
        toast('Google bilan kirish xato yuz berdi', 'err');
    };
    return (_jsx("div", { className: "p-4", style: { display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }, children: _jsxs("div", { className: "card shadow-md", children: [_jsx("h2", { style: { fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }, children: isLogin ? 'Tizimga kirish' : 'Ro\'yxatdan o\'tish' }), _jsx("div", { style: { marginBottom: '20px', display: 'flex', justifyContent: 'center' }, children: _jsx(GoogleLogin, { onSuccess: handleGoogleSuccess, onError: handleGoogleError, useOneTap: true }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }, children: [_jsx("div", { style: { flex: 1, height: '1px', background: 'var(--border)' } }), _jsx("span", { style: { color: 'var(--text-secondary)', fontSize: '12px' }, children: "YOKI" }), _jsx("div", { style: { flex: 1, height: '1px', background: 'var(--border)' } })] }), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '15px' }, children: [!isLogin && (_jsxs(_Fragment, { children: [_jsx("input", { className: "input", placeholder: "Ism", value: firstName, onChange: e => setFirstName(e.target.value), required: true }), _jsx("input", { className: "input", placeholder: "Familiya", value: lastName, onChange: e => setLastName(e.target.value) })] })), _jsx("input", { className: "input", placeholder: "Telefon raqam", value: phone, onChange: e => setPhone(e.target.value), type: "tel", required: true }), _jsx("input", { className: "input", type: "password", placeholder: "Parol", value: password, onChange: e => setPassword(e.target.value), required: true }), _jsx("button", { className: "btn btn-primary", type: "submit", disabled: loading, style: { marginTop: '10px' }, children: loading ? 'Kutib uring...' : (isLogin ? 'Kirish' : 'Ro\'yxatdan o\'tish') })] }), _jsxs("p", { style: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }, children: [isLogin ? 'Akkauntingiz yo\'qmi?' : 'Akkauntingiz bormi?', _jsx("button", { type: "button", onClick: () => setIsLogin(!isLogin), style: { background: 'none', border: 'none', color: 'var(--primary)', marginLeft: '5px', fontWeight: 'bold', cursor: 'pointer' }, children: isLogin ? 'Ro\'yxatdan o\'tish' : 'Kirish' })] })] }) }));
}
