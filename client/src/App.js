import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from './store';
import HomePage from './pages/HomePage';
import SubjectsPage from './pages/SubjectsPage';
import SubjectDetailPage from './pages/SubjectDetailPage';
import MaterialAddPage from './pages/MaterialAddPage';
import MaterialEditPage from './pages/MaterialEditPage';
import PersonalTestRunPage from './pages/PersonalTestRunPage';
import PersonalTestResultPage from './pages/PersonalTestResultPage';
import TestPage from './pages/TestPage';
import AIPage from './pages/AIPage';
import ProfilePage from './pages/ProfilePage';
import CabinetPage from './pages/CabinetPage';
import LevelPage from './pages/LevelPage';
import { ToastProvider } from './components/Toast';
function FullLoader() {
    return (_jsxs("div", { className: "full-loader", children: [_jsxs("div", { className: "full-loader-text", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsx("div", { className: "spin" })] }));
}
export function usePwaInstall() {
    const [canInstall, setCanInstall] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (tg?.initData)
            return;
        const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setCanInstall(true); };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    const install = async () => {
        if (!deferredPrompt)
            return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted')
            setCanInstall(false);
        setDeferredPrompt(null);
    };
    return { canInstall, install };
}
// ─── v2: Yangi navigatsiya ─────────────────────────────────────────────────
const NAV_ITEMS = [
    { path: '/', icon: '🏠', label: 'Bosh' },
    { path: '/subjects', icon: '📚', label: 'Fanlar' },
    { path: '/ai', icon: '🤖', label: 'AI' },
    { path: '/level', icon: '📊', label: 'Daraja' },
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
    const { loading, login, refreshUser } = useAppStore();
    const [bootstrapped, setBootstrapped] = useState(false);
    const pollRef = useRef(null);
    useEffect(() => {
        const KEY = 'fikra_open_count';
        const prev = parseInt(localStorage.getItem(KEY) || '0', 10);
        localStorage.setItem(KEY, String(prev + 1));
    }, []);
    useEffect(() => {
        login().finally(() => setBootstrapped(true));
        fetch('/api/config')
            .then(r => r.json())
            .then(c => {
            ;
            window.BOT_USERNAME = c.botUsername;
            window.ADMIN_USERNAME = c.adminUsername;
        })
            .catch(() => { });
        const startPoll = () => {
            stopPoll();
            pollRef.current = setInterval(() => {
                if (!document.hidden)
                    refreshUser();
            }, 60000);
        };
        const stopPoll = () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
        startPoll();
        const onVisChange = () => {
            if (document.hidden)
                stopPoll();
            else {
                refreshUser();
                startPoll();
            }
        };
        document.addEventListener('visibilitychange', onVisChange);
        const onAuthExpired = () => login();
        window.addEventListener('fikra:auth-expired', onAuthExpired);
        return () => {
            stopPoll();
            document.removeEventListener('visibilitychange', onVisChange);
            window.removeEventListener('fikra:auth-expired', onAuthExpired);
        };
    }, []);
    if (!bootstrapped || loading)
        return _jsx(FullLoader, {});
    return (_jsx("div", { className: "app", children: _jsxs(ToastProvider, { children: [_jsx("div", { className: "app-content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/subjects", element: _jsx(SubjectsPage, {}) }), _jsx(Route, { path: "/subjects/:subjectId", element: _jsx(SubjectDetailPage, {}) }), _jsx(Route, { path: "/subjects/:subjectId/add", element: _jsx(MaterialAddPage, {}) }), _jsx(Route, { path: "/materials/:id/edit", element: _jsx(MaterialEditPage, {}) }), _jsx(Route, { path: "/personal-tests/:id/run", element: _jsx(PersonalTestRunPage, {}) }), _jsx(Route, { path: "/personal-tests/:id/result", element: _jsx(PersonalTestResultPage, {}) }), _jsx(Route, { path: "/level", element: _jsx(LevelPage, {}) }), _jsx(Route, { path: "/test/*", element: _jsx(TestPage, {}) }), _jsx(Route, { path: "/cabinet/*", element: _jsx(CabinetPage, {}) }), _jsx(Route, { path: "/ai/*", element: _jsx(AIPage, {}) }), _jsx(Route, { path: "/profile", element: _jsx(ProfilePage, {}) })] }) }), _jsx(BottomNav, {})] }) }));
}
