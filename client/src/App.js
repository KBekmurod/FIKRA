import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './store';
import HomePage from './pages/HomePage';
import TestPage from './pages/TestPage';
import AIPage from './pages/AIPage';
import ProfilePage from './pages/ProfilePage';
import { ToastProvider } from './components/Toast';
function FullLoader() {
    return (_jsxs("div", { className: "full-loader", children: [_jsxs("div", { className: "full-loader-text", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsx("div", { className: "spin" })] }));
}
const NAV_ITEMS = [
    { path: '/', icon: '🏠', label: 'Bosh' },
    { path: '/test', icon: '📚', label: 'Test' },
    { path: '/ai', icon: '🤖', label: 'AI' },
    { path: '/profile', icon: '👤', label: 'Profil' },
];
function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    return (_jsx("nav", { className: "nav", children: NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path
                || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (_jsxs("button", { className: `nav-item ${isActive ? 'active' : ''}`, onClick: () => {
                    navigate(item.path);
                    try {
                        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
                    }
                    catch { }
                }, children: [_jsx("span", { className: "nav-icon", children: item.icon }), _jsx("span", { className: "nav-label", children: item.label })] }, item.path));
        }) }));
}
export default function App() {
    const { user, loading, login, refreshUser } = useAppStore();
    const [bootstrapped, setBootstrapped] = useState(false);
    useEffect(() => {
        login().finally(() => setBootstrapped(true));
        // Config olish
        fetch('/api/config').then(r => r.json()).then(c => {
            ;
            window.BOT_USERNAME = c.botUsername;
            window.ADMIN_USERNAME = c.adminUsername;
        }).catch(() => { });
        // Polling — har 30 sek user ma'lumotlarini yangilash (limit, plan)
        const t = setInterval(() => refreshUser(), 30000);
        return () => clearInterval(t);
    }, []);
    if (!bootstrapped || loading)
        return _jsx(FullLoader, {});
    return (_jsx("div", { className: "app", children: _jsxs(ToastProvider, { children: [_jsx("div", { className: "app-content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/test/*", element: _jsx(TestPage, {}) }), _jsx(Route, { path: "/ai/*", element: _jsx(AIPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfilePage, {}) })] }) }), _jsx(BottomNav, {})] }) }));
}
