import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
export default function AuthModal() {
    const navigate = useNavigate();
    const { authModalOpen, setAuthModalOpen } = useAppStore();
    if (!authModalOpen)
        return null;
    return (_jsx("div", { style: {
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999,
            padding: 20
        }, children: _jsxs("div", { style: {
                background: 'var(--bg)',
                border: '1px solid var(--f)',
                borderRadius: 20,
                width: '100%',
                maxWidth: 380,
                padding: 24,
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                textAlign: 'center',
                animation: 'slideUp 0.3s ease-out'
            }, children: [_jsx("button", { onClick: () => setAuthModalOpen(false), style: {
                        position: 'absolute', top: 12, right: 12,
                        background: 'var(--s2)', border: 'none',
                        width: 32, height: 32, borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--txt)'
                    }, children: "\u2715" }), _jsx("div", { style: { fontSize: 48, marginBottom: 16 }, children: "\uD83D\uDE80" }), _jsx("h3", { style: { margin: '0 0 12px 0', fontSize: 20, fontWeight: 800, color: 'var(--txt)' }, children: "Harakatni davom ettirish" }), _jsx("p", { style: { margin: '0 0 24px 0', fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.5 }, children: "Ushbu ajoyib imkoniyatdan foydalanish uchun tizimga kiring yoki bepul hisob yarating." }), _jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsx("button", { onClick: () => {
                                setAuthModalOpen(false);
                                navigate('/auth/register');
                            }, style: {
                                background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                                color: '#fff', border: 'none',
                                padding: '14px', borderRadius: 12,
                                fontSize: 14, fontWeight: 800, cursor: 'pointer'
                            }, children: "Hisob yaratish (Bepul)" }), _jsx("button", { onClick: () => {
                                setAuthModalOpen(false);
                                navigate('/auth/login');
                            }, style: {
                                background: 'var(--s2)',
                                color: 'var(--txt)', border: 'none',
                                padding: '14px', borderRadius: 12,
                                fontSize: 14, fontWeight: 800, cursor: 'pointer'
                            }, children: "Tizimga kirish" })] })] }) }));
}
