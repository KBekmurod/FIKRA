import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
// ─── Auth sahifalari — kichik, darrov yuklanadi ─────────────────────────
import WelcomePage from './pages/auth/WelcomePage';
// ─── Asosiy sahifa — darrov yuklanadi ────────────────────────────────────
import HomePage from './pages/HomePage';
// ─── Boshqa sahifalar — LAZY LOADING ───────────────────────────────────
// Bu Android WebView'da memory bosimini kamaytiradi — har sahifa kerak
// bo'lganda yuklanadi, hammasini bir paytda RAM'da saqlamaydi.
const OmborPage = lazy(() => import('./pages/OmborPage'));
const OmborSubjectPage = lazy(() => import('./pages/OmborSubjectPage'));
const OmborFolderPage = lazy(() => import('./pages/OmborFolderPage'));
const FolderAddPage = lazy(() => import('./pages/FolderAddPage'));
const MaterialAddPage = lazy(() => import('./pages/MaterialAddPage'));
const MaterialEditPage = lazy(() => import('./pages/MaterialEditPage'));
const FlashcardPage = lazy(() => import('./pages/FlashcardPage'));
const TestsPage = lazy(() => import('./pages/TestsPage'));
const FikraTestsPage = lazy(() => import('./pages/FikraTestsPage'));
const AiTestsPage = lazy(() => import('./pages/AiTestsPage'));
const AiPapkalarPage = lazy(() => import('./pages/AiPapkalarPage'));
const AiBlokSetupPage = lazy(() => import('./pages/AiBlokSetupPage'));
const AiFreeSetupPage = lazy(() => import('./pages/AiFreeSetupPage'));
const BlokTestSetupPage = lazy(() => import('./pages/BlokTestSetupPage'));
const FreeTestSetupPage = lazy(() => import('./pages/FreeTestSetupPage'));
const TestRunPage = lazy(() => import('./pages/TestRunPage'));
const TestResultPage = lazy(() => import('./pages/TestResultPage'));
const TestReviewPage = lazy(() => import('./pages/TestReviewPage'));
const TestExplainPage = lazy(() => import('./pages/TestExplainPage'));
const PersonalTestRunPage = lazy(() => import('./pages/PersonalTestRunPage'));
const PersonalTestResultPage = lazy(() => import('./pages/PersonalTestResultPage'));
const PersonalTestReviewPage = lazy(() => import('./pages/PersonalTestReviewPage'));
const PersonalTestExplainPage = lazy(() => import('./pages/PersonalTestExplainPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const AIPage = lazy(() => import('./pages/AIPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
import { ToastProvider } from './components/Toast';
function FullLoader() {
    return (_jsxs("div", { className: "full-loader", children: [_jsxs("div", { className: "full-loader-text", children: ["FIKRA", _jsx("span", { children: "." })] }), _jsxs("div", { className: "crystal-loader", children: [_jsx("div", { className: "crystal-face front" }), _jsx("div", { className: "crystal-face back" }), _jsx("div", { className: "crystal-face left" }), _jsx("div", { className: "crystal-face right" }), _jsx("div", { className: "crystal-face top" }), _jsx("div", { className: "crystal-face bottom" })] })] }));
}
// Lazy sahifalar uchun 3D loader
function PageLoader() {
    return (_jsx("div", { style: {
            minHeight: 'calc(var(--vh, 1vh) * 100 - 64px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }, children: _jsxs("div", { className: "crystal-loader small", children: [_jsx("div", { className: "crystal-face front" }), _jsx("div", { className: "crystal-face back" }), _jsx("div", { className: "crystal-face left" }), _jsx("div", { className: "crystal-face right" }), _jsx("div", { className: "crystal-face top" }), _jsx("div", { className: "crystal-face bottom" })] }) }));
}
// PWA state is now managed globally in store/index.ts
const NAV_ITEMS = [
    { path: '/', icon: '🏠', label: 'Asosiy' },
    { path: '/ombor', icon: '🏛', label: 'Ombor' },
    { path: '/testlar', icon: '📝', label: 'Testlar' },
    { path: '/ai', icon: '🤖', label: 'AI' },
    { path: '/profil', icon: '👤', label: 'Profil' },
];
function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const isInTestRun = location.pathname.includes('/test-run/') ||
        (location.pathname.includes('/personal-tests/') && location.pathname.endsWith('/run'));
    const handleNavClick = (target) => {
        if (isInTestRun && target !== location.pathname) {
            const ev = new CustomEvent('fikra:nav-attempt', {
                detail: { target },
                cancelable: true,
            });
            const allowed = window.dispatchEvent(ev);
            if (!allowed)
                return;
        }
        navigate(target);
    };
    return (_jsx("nav", { className: "nav nav-6", children: NAV_ITEMS.map(item => {
            const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (_jsxs("button", { className: `nav-item ${isActive ? 'active' : ''}`, onClick: () => handleNavClick(item.path), children: [_jsx("span", { className: "nav-icon", children: item.icon }), _jsx("span", { className: "nav-label", children: item.label })] }, item.path));
        }) }));
}
// ─── Auth Guard ─────────────────────────────────────────────────────────
function RequireAuth({ children }) {
    const { user } = useAppStore();
    const location = useLocation();
    if (!user) {
        return _jsx(Navigate, { to: "/auth/welcome", state: { from: location }, replace: true });
    }
    return children;
}
import { usePwaStore } from './store';
import { useJobStore, initJobPoller } from './store/jobStore';
import { useToast } from './components/Toast';
import AuthModal from './components/AuthModal';
import AnnouncementBanner from './components/AnnouncementBanner';
function GlobalJobWatcher() {
    const { jobs, removeJob } = useJobStore();
    const navigate = useNavigate();
    const toast = useToast();
    const runningJobs = Object.values(jobs).filter(j => j.status === 'running');
    useEffect(() => {
        Object.values(jobs).forEach(job => {
            if (job.status === 'success') {
                toast.success(`${job.title} tayyor!`);
                if (job.type === 'test_generation' && job.result?.testId) {
                    navigate(`/personal-tests/${job.result.testId}/run`);
                }
                else if (job.type === 'ai_chat' && job.result?.sessionId) {
                    navigate(`/ai/chat/${job.result.sessionId}`);
                }
                removeJob(job.id);
            }
            else if (job.status === 'error') {
                toast.error(`${job.title} da xato: ${job.error}`);
                removeJob(job.id);
            }
        });
    }, [jobs, navigate, toast, removeJob]);
    if (runningJobs.length === 0)
        return null;
    return (_jsxs("div", { style: {
            background: 'rgba(255,165,0,0.9)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            fontSize: 13,
            fontWeight: 'bold',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }, children: ["\u23F3 ", runningJobs.length, " ta jarayon orqa fonda ishlamoqda..."] }));
}
export default function App() {
    const { user, initialized, bootstrap, refreshUser } = useAppStore();
    const { initPwa, canInstall, isInstalled, installPwa } = usePwaStore();
    const location = useLocation();
    const pollRef = useRef(null);
    // App ochilganda config va sessiyani yuklash
    useEffect(() => {
        bootstrap();
        initPwa();
        initJobPoller();
        fetch('/api/config')
            .then(r => r.json())
            .then(c => {
            ;
            window.ADMIN_USERNAME = c.adminUsername;
        })
            .catch(() => { });
    }, []);
    // User mavjud bo'lsa polling
    useEffect(() => {
        if (!user) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }
        pollRef.current = setInterval(() => {
            if (!document.hidden)
                refreshUser();
        }, 60000);
        const onVisChange = () => {
            if (!document.hidden)
                refreshUser();
        };
        document.addEventListener('visibilitychange', onVisChange);
        const onAuthExpired = () => bootstrap();
        window.addEventListener('fikra:auth-expired', onAuthExpired);
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            document.removeEventListener('visibilitychange', onVisChange);
            window.removeEventListener('fikra:auth-expired', onAuthExpired);
        };
    }, [user?.id]);
    if (!initialized)
        return _jsx(FullLoader, {});
    const isAuthRoute = location.pathname.startsWith('/auth');
    return (_jsxs("div", { className: "app", children: [_jsx(AuthModal, {}), _jsx(AnnouncementBanner, {}), !isInstalled && canInstall && !isAuthRoute && (_jsxs("div", { style: {
                    background: 'linear-gradient(90deg, var(--acc), var(--acc-l))',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#fff',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    boxShadow: '0 2px 10px rgba(123,104,238,0.3)',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10 }, children: [_jsx("span", { style: { fontSize: 20 }, children: "\uD83D\uDCF2" }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("span", { style: { fontSize: 13, fontWeight: 700 }, children: "Ilovani yuklab oling" }), _jsx("span", { style: { fontSize: 11, opacity: 0.9 }, children: "Tezroq va qulay ishlash uchun" })] })] }), _jsx("button", { onClick: installPwa, style: {
                            background: '#fff',
                            color: 'var(--acc)',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 100,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }, children: "O'rnatish" })] })), _jsxs(ToastProvider, { children: [_jsx(GlobalJobWatcher, {}), !isAuthRoute && _jsx(BottomNav, {}), _jsx("div", { className: "app-content", children: _jsx(Suspense, { fallback: _jsx(PageLoader, {}), children: _jsx(AnimatePresence, { mode: "wait", children: _jsx(motion.div, { initial: { opacity: 0, scale: 0.95, y: 15 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 1.05, y: -15 }, transition: { duration: 0.3, type: 'tween', ease: 'easeInOut' }, style: { width: '100%', height: '100%', overflowX: 'hidden' }, children: _jsxs(Routes, { location: location, children: [_jsx(Route, { path: "/auth/welcome", element: _jsx(WelcomePage, {}) }), _jsx(Route, { path: "/auth/login", element: _jsx(Navigate, { to: "/auth/welcome", replace: true }) }), _jsx(Route, { path: "/auth/register", element: _jsx(Navigate, { to: "/auth/welcome", replace: true }) }), _jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/ombor", element: _jsx(OmborPage, {}) }), _jsx(Route, { path: "/ombor/:subjectId", element: _jsx(RequireAuth, { children: _jsx(OmborSubjectPage, {}) }) }), _jsx(Route, { path: "/ombor/:subjectId/add-folder", element: _jsx(RequireAuth, { children: _jsx(FolderAddPage, {}) }) }), _jsx(Route, { path: "/ombor/folder/:folderId", element: _jsx(RequireAuth, { children: _jsx(OmborFolderPage, {}) }) }), _jsx(Route, { path: "/ombor/folder/:folderId/add", element: _jsx(RequireAuth, { children: _jsx(MaterialAddPage, {}) }) }), _jsx(Route, { path: "/ombor/folder/:folderId/flash", element: _jsx(RequireAuth, { children: _jsx(FlashcardPage, {}) }) }), _jsx(Route, { path: "/materials/:id/edit", element: _jsx(RequireAuth, { children: _jsx(MaterialEditPage, {}) }) }), _jsx(Route, { path: "/testlar", element: _jsx(TestsPage, {}) }), _jsx(Route, { path: "/testlar/fikra", element: _jsx(RequireAuth, { children: _jsx(FikraTestsPage, {}) }) }), _jsx(Route, { path: "/testlar/ai", element: _jsx(RequireAuth, { children: _jsx(AiTestsPage, {}) }) }), _jsx(Route, { path: "/testlar/ai/papkalar", element: _jsx(RequireAuth, { children: _jsx(AiPapkalarPage, {}) }) }), _jsx(Route, { path: "/testlar/ai/blok", element: _jsx(RequireAuth, { children: _jsx(AiBlokSetupPage, {}) }) }), _jsx(Route, { path: "/testlar/ai/erkin", element: _jsx(RequireAuth, { children: _jsx(AiFreeSetupPage, {}) }) }), _jsx(Route, { path: "/testlar/fikra/blok", element: _jsx(RequireAuth, { children: _jsx(BlokTestSetupPage, {}) }) }), _jsx(Route, { path: "/testlar/fikra/free", element: _jsx(RequireAuth, { children: _jsx(FreeTestSetupPage, {}) }) }), _jsx(Route, { path: "/test-run/:sessionId", element: _jsx(RequireAuth, { children: _jsx(TestRunPage, {}) }) }), _jsx(Route, { path: "/test-result/:sessionId", element: _jsx(RequireAuth, { children: _jsx(TestResultPage, {}) }) }), _jsx(Route, { path: "/test-review/:sessionId", element: _jsx(RequireAuth, { children: _jsx(TestReviewPage, {}) }) }), _jsx(Route, { path: "/test-explain/:sessionId/:subjectId", element: _jsx(RequireAuth, { children: _jsx(TestExplainPage, {}) }) }), _jsx(Route, { path: "/personal-tests/:id/run", element: _jsx(RequireAuth, { children: _jsx(PersonalTestRunPage, {}) }) }), _jsx(Route, { path: "/personal-tests/:id/result", element: _jsx(RequireAuth, { children: _jsx(PersonalTestResultPage, {}) }) }), _jsx(Route, { path: "/personal-tests/:id/review", element: _jsx(RequireAuth, { children: _jsx(PersonalTestReviewPage, {}) }) }), _jsx(Route, { path: "/personal-tests/:id/explain", element: _jsx(RequireAuth, { children: _jsx(PersonalTestExplainPage, {}) }) }), _jsx(Route, { path: "/tarix", element: _jsx(HistoryPage, {}) }), _jsx(Route, { path: "/ai/*", element: _jsx(AIPage, {}) }), _jsx(Route, { path: "/profil", element: _jsx(ProfilePage, {}) })] }, location.pathname) }, location.pathname) }) }) })] })] }));
}
