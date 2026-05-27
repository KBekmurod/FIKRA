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
var OmborPage = lazy(function () { return import('./pages/OmborPage'); });
var OmborSubjectPage = lazy(function () { return import('./pages/OmborSubjectPage'); });
var OmborFolderPage = lazy(function () { return import('./pages/OmborFolderPage'); });
var FolderAddPage = lazy(function () { return import('./pages/FolderAddPage'); });
var MaterialAddPage = lazy(function () { return import('./pages/MaterialAddPage'); });
var MaterialEditPage = lazy(function () { return import('./pages/MaterialEditPage'); });
var FlashcardPage = lazy(function () { return import('./pages/FlashcardPage'); });
var TestsPage = lazy(function () { return import('./pages/TestsPage'); });
var FikraTestsPage = lazy(function () { return import('./pages/FikraTestsPage'); });
var AiTestsPage = lazy(function () { return import('./pages/AiTestsPage'); });
var AiPapkalarPage = lazy(function () { return import('./pages/AiPapkalarPage'); });
var AiBlokSetupPage = lazy(function () { return import('./pages/AiBlokSetupPage'); });
var AiFreeSetupPage = lazy(function () { return import('./pages/AiFreeSetupPage'); });
var BlokTestSetupPage = lazy(function () { return import('./pages/BlokTestSetupPage'); });
var FreeTestSetupPage = lazy(function () { return import('./pages/FreeTestSetupPage'); });
var TestRunPage = lazy(function () { return import('./pages/TestRunPage'); });
var TestResultPage = lazy(function () { return import('./pages/TestResultPage'); });
var TestReviewPage = lazy(function () { return import('./pages/TestReviewPage'); });
var TestExplainPage = lazy(function () { return import('./pages/TestExplainPage'); });
var PersonalTestRunPage = lazy(function () { return import('./pages/PersonalTestRunPage'); });
var PersonalTestResultPage = lazy(function () { return import('./pages/PersonalTestResultPage'); });
var PersonalTestReviewPage = lazy(function () { return import('./pages/PersonalTestReviewPage'); });
var PersonalTestExplainPage = lazy(function () { return import('./pages/PersonalTestExplainPage'); });
var HistoryPage = lazy(function () { return import('./pages/HistoryPage'); });
var AIPage = lazy(function () { return import('./pages/AIPage'); });
var ProfilePage = lazy(function () { return import('./pages/ProfilePage'); });
import { ToastProvider } from './components/Toast';
function FullLoader() {
    return (<div className="full-loader">
      <div className="full-loader-text">FIKRA<span>.</span></div>
      <div className="crystal-loader">
        <div className="crystal-face front"></div>
        <div className="crystal-face back"></div>
        <div className="crystal-face left"></div>
        <div className="crystal-face right"></div>
        <div className="crystal-face top"></div>
        <div className="crystal-face bottom"></div>
      </div>
    </div>);
}
// Lazy sahifalar uchun 3D loader
function PageLoader() {
    return (<div style={{
        minHeight: 'calc(var(--vh, 1vh) * 100 - 64px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="crystal-loader small">
        <div className="crystal-face front"></div>
        <div className="crystal-face back"></div>
        <div className="crystal-face left"></div>
        <div className="crystal-face right"></div>
        <div className="crystal-face top"></div>
        <div className="crystal-face bottom"></div>
      </div>
    </div>);
}
// PWA state is now managed globally in store/index.ts
var NAV_ITEMS = [
    { path: '/', icon: '🏠', label: 'Asosiy' },
    { path: '/ombor', icon: '🏛', label: 'Ombor' },
    { path: '/testlar', icon: '📝', label: 'Testlar' },
    { path: '/ai', icon: '🤖', label: 'AI' },
    { path: '/profil', icon: '👤', label: 'Profil' },
];
function BottomNav() {
    var location = useLocation();
    var navigate = useNavigate();
    var isInTestRun = location.pathname.includes('/test-run/') ||
        (location.pathname.includes('/personal-tests/') && location.pathname.endsWith('/run'));
    var handleNavClick = function (target) {
        if (isInTestRun && target !== location.pathname) {
            var ev = new CustomEvent('fikra:nav-attempt', {
                detail: { target: target },
                cancelable: true
            });
            var allowed = window.dispatchEvent(ev);
            if (!allowed)
                return;
        }
        navigate(target);
    };
    return (<nav className="nav nav-6">
      {NAV_ITEMS.map(function (item) {
        var isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (<button key={item.path} className={"nav-item " + (isActive ? 'active' : '')} onClick={function () { return handleNavClick(item.path); }}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>);
    })}
    </nav>);
}
// ─── Auth Guard ─────────────────────────────────────────────────────────
function RequireAuth(_a) {
    var children = _a.children;
    var user = useAppStore().user;
    var location = useLocation();
    if (!user) {
        return <Navigate to="/auth/welcome" state={{ from: location }} replace/>;
    }
    return children;
}
import { usePwaStore } from './store';
import { useJobStore, initJobPoller } from './store/jobStore';
import { useToast } from './components/Toast';
import AuthModal from './components/AuthModal';
import AnnouncementBanner from './components/AnnouncementBanner';
function GlobalJobWatcher() {
    var _a = useJobStore(), jobs = _a.jobs, removeJob = _a.removeJob;
    var navigate = useNavigate();
    var toast = useToast();
    var runningJobs = Object.values(jobs).filter(function (j) { return j.status === 'running'; });
    useEffect(function () {
        Object.values(jobs).forEach(function (job) {
            if (job.status === 'success') {
                toast.success(job.title + " tayyor!");
                if (job.type === 'test_generation' && job.result ? .testId : ) {
                    navigate("/personal-tests/" + job.result.testId + "/run");
                }
                else if (job.type === 'ai_chat' && job.result ? .sessionId : ) {
                    navigate("/ai/chat/" + job.result.sessionId);
                }
                removeJob(job.id);
            }
            else if (job.status === 'error') {
                toast.error(job.title + " da xato: " + job.error);
                removeJob(job.id);
            }
        });
    }, [jobs, navigate, toast, removeJob]);
    if (runningJobs.length === 0)
        return null;
    return (<div style={{
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
    }}>
      ⏳ {runningJobs.length} ta jarayon orqa fonda ishlamoqda...
    </div>);
}
export default function App() {
    var _a = useAppStore(), user = _a.user, initialized = _a.initialized, bootstrap = _a.bootstrap, refreshUser = _a.refreshUser;
    var _b = usePwaStore(), initPwa = _b.initPwa, canInstall = _b.canInstall, isInstalled = _b.isInstalled, installPwa = _b.installPwa;
    var location = useLocation();
    var pollRef = useRef(null);
    // App ochilganda config va sessiyani yuklash
    useEffect(function () {
        bootstrap();
        initPwa();
        initJobPoller();
        fetch('/api/config')
            .then(function (r) { return r.json(); })
            .then(function (c) {
            ;
            window.ADMIN_USERNAME = c.adminUsername;
        })["catch"](function () { });
    }, []);
    // User mavjud bo'lsa polling
    useEffect(function () {
        if (!user) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }
        pollRef.current = setInterval(function () {
            if (!document.hidden)
                refreshUser();
        }, 60000);
        var onVisChange = function () {
            if (!document.hidden)
                refreshUser();
        };
        document.addEventListener('visibilitychange', onVisChange);
        var onAuthExpired = function () { return bootstrap(); };
        window.addEventListener('fikra:auth-expired', onAuthExpired);
        return function () {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            document.removeEventListener('visibilitychange', onVisChange);
            window.removeEventListener('fikra:auth-expired', onAuthExpired);
        };
    }, [user ? .id : ]);
    if (!initialized)
        return <FullLoader />;
    var isAuthRoute = location.pathname.startsWith('/auth');
    return (<div className="app">
      <AuthModal />
      <AnnouncementBanner />
      
      {!isInstalled && canInstall && !isAuthRoute && (<div style={{
        background: 'linear-gradient(90deg, var(--acc), var(--acc-l))',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(123,104,238,0.3)'
    }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📲</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Ilovani yuklab oling</span>
              <span style={{ fontSize: 11, opacity: 0.9 }}>Tezroq va qulay ishlash uchun</span>
            </div>
          </div>
          <button onClick={installPwa} style={{
        background: '#fff',
        color: 'var(--acc)',
        border: 'none',
        padding: '6px 14px',
        borderRadius: 100,
        fontSize: 12,
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
            O'rnatish
          </button>
        </div>)}
      <ToastProvider>
        <GlobalJobWatcher />
        {!isAuthRoute && <BottomNav />}
        <div className="app-content">
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05, y: -15 }} transition={{ duration: 0.3, type: 'tween', ease: 'easeInOut' }} style={{ width: '100%', height: '100%', overflowX: 'hidden' }}>
                <Routes location={location} key={location.pathname}>
                
                <Route path="/auth/welcome" element={<WelcomePage />}/>
                <Route path="/auth/login" element={<Navigate to="/auth/welcome" replace/>}/>
                <Route path="/auth/register" element={<Navigate to="/auth/welcome" replace/>}/>

                
                <Route path="/" element={<HomePage />}/>

                <Route path="/ombor" element={<OmborPage />}/>
                <Route path="/ombor/:subjectId" element={<RequireAuth><OmborSubjectPage /></RequireAuth>}/>
                <Route path="/ombor/:subjectId/add-folder" element={<RequireAuth><FolderAddPage /></RequireAuth>}/>
                <Route path="/ombor/folder/:folderId" element={<RequireAuth><OmborFolderPage /></RequireAuth>}/>
                <Route path="/ombor/folder/:folderId/add" element={<RequireAuth><MaterialAddPage /></RequireAuth>}/>
                <Route path="/ombor/folder/:folderId/flash" element={<RequireAuth><FlashcardPage /></RequireAuth>}/>
                <Route path="/materials/:id/edit" element={<RequireAuth><MaterialEditPage /></RequireAuth>}/>

                <Route path="/testlar" element={<TestsPage />}/>
                <Route path="/testlar/fikra" element={<RequireAuth><FikraTestsPage /></RequireAuth>}/>
                <Route path="/testlar/ai" element={<RequireAuth><AiTestsPage /></RequireAuth>}/>
                <Route path="/testlar/ai/papkalar" element={<RequireAuth><AiPapkalarPage /></RequireAuth>}/>
                <Route path="/testlar/ai/blok" element={<RequireAuth><AiBlokSetupPage /></RequireAuth>}/>
                <Route path="/testlar/ai/erkin" element={<RequireAuth><AiFreeSetupPage /></RequireAuth>}/>
                <Route path="/testlar/fikra/blok" element={<RequireAuth><BlokTestSetupPage /></RequireAuth>}/>
                <Route path="/testlar/fikra/free" element={<RequireAuth><FreeTestSetupPage /></RequireAuth>}/>
                <Route path="/test-run/:sessionId" element={<RequireAuth><TestRunPage /></RequireAuth>}/>
                <Route path="/test-result/:sessionId" element={<RequireAuth><TestResultPage /></RequireAuth>}/>
                <Route path="/test-review/:sessionId" element={<RequireAuth><TestReviewPage /></RequireAuth>}/>
                <Route path="/test-explain/:sessionId/:subjectId" element={<RequireAuth><TestExplainPage /></RequireAuth>}/>

                <Route path="/personal-tests/:id/run" element={<RequireAuth><PersonalTestRunPage /></RequireAuth>}/>
                <Route path="/personal-tests/:id/result" element={<RequireAuth><PersonalTestResultPage /></RequireAuth>}/>
                <Route path="/personal-tests/:id/review" element={<RequireAuth><PersonalTestReviewPage /></RequireAuth>}/>
                <Route path="/personal-tests/:id/explain" element={<RequireAuth><PersonalTestExplainPage /></RequireAuth>}/>

                <Route path="/tarix" element={<HistoryPage />}/>
                <Route path="/ai/*" element={<AIPage />}/>
                <Route path="/profil" element={<ProfilePage />}/>
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </ToastProvider>
    </div>);
}
