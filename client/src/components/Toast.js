import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
const Ctx = createContext({ toast: () => { } });
export function ToastProvider({ children }) {
    const [msg, setMsg] = useState(null);
    const toast = useCallback((text, type = 'info') => {
        setMsg({ text, type });
        try {
            const tg = window.Telegram?.WebApp;
            if (type === 'ok')
                tg?.HapticFeedback?.notificationOccurred('success');
            else if (type === 'err')
                tg?.HapticFeedback?.notificationOccurred('error');
        }
        catch { }
        setTimeout(() => setMsg(null), 3000);
    }, []);
    return (_jsxs(Ctx.Provider, { value: { toast }, children: [children, msg && (_jsx("div", { className: "toast", style: {
                    borderColor: msg.type === 'ok' ? 'var(--g)' : msg.type === 'err' ? 'var(--r)' : 'var(--f)'
                }, children: msg.text }))] }));
}
export const useToast = () => useContext(Ctx);
