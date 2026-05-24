import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from './store'

// ─── Auth sahifalari — kichik, darrov yuklanadi ─────────────────────────
import WelcomePage from './pages/auth/WelcomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// ─── Asosiy sahifa — darrov yuklanadi ────────────────────────────────────
import HomePage from './pages/HomePage'

// ─── Boshqa sahifalar — LAZY LOADING ───────────────────────────────────
// Bu Android WebView'da memory bosimini kamaytiradi — har sahifa kerak
// bo'lganda yuklanadi, hammasini bir paytda RAM'da saqlamaydi.
const OmborPage = lazy(() => import('./pages/OmborPage'))
const OmborSubjectPage = lazy(() => import('./pages/OmborSubjectPage'))
const OmborFolderPage = lazy(() => import('./pages/OmborFolderPage'))
const FolderAddPage = lazy(() => import('./pages/FolderAddPage'))
const MaterialAddPage = lazy(() => import('./pages/MaterialAddPage'))
const MaterialEditPage = lazy(() => import('./pages/MaterialEditPage'))
const FlashcardPage = lazy(() => import('./pages/FlashcardPage'))

const TestsPage = lazy(() => import('./pages/TestsPage'))
const FikraTestsPage = lazy(() => import('./pages/FikraTestsPage'))
const AiTestsPage = lazy(() => import('./pages/AiTestsPage'))
const AiPapkalarPage = lazy(() => import('./pages/AiPapkalarPage'))
const AiBlokSetupPage = lazy(() => import('./pages/AiBlokSetupPage'))
const AiFreeSetupPage = lazy(() => import('./pages/AiFreeSetupPage'))
const BlokTestSetupPage = lazy(() => import('./pages/BlokTestSetupPage'))
const FreeTestSetupPage = lazy(() => import('./pages/FreeTestSetupPage'))
const TestRunPage = lazy(() => import('./pages/TestRunPage'))
const TestResultPage = lazy(() => import('./pages/TestResultPage'))
const TestReviewPage = lazy(() => import('./pages/TestReviewPage'))
const TestExplainPage = lazy(() => import('./pages/TestExplainPage'))

const PersonalTestRunPage = lazy(() => import('./pages/PersonalTestRunPage'))
const PersonalTestResultPage = lazy(() => import('./pages/PersonalTestResultPage'))
const PersonalTestReviewPage = lazy(() => import('./pages/PersonalTestReviewPage'))
const PersonalTestExplainPage = lazy(() => import('./pages/PersonalTestExplainPage'))

const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const AIPage = lazy(() => import('./pages/AIPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
import { ToastProvider } from './components/Toast'
import { FikraEntity } from './components/FikraEntity'

function FullLoader() {
  return (
    <div className="full-loader">
      <div className="full-loader-text">FIKRA<span>.</span></div>
      <div className="crystal-loader">
        <div className="crystal-face front"></div>
        <div className="crystal-face back"></div>
        <div className="crystal-face left"></div>
        <div className="crystal-face right"></div>
        <div className="crystal-face top"></div>
        <div className="crystal-face bottom"></div>
      </div>
    </div>
  )
}

// Lazy sahifalar uchun 3D loader
function PageLoader() {
  return (
    <div style={{
      minHeight: 'calc(var(--vh, 1vh) * 100 - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="crystal-loader small">
        <div className="crystal-face front"></div>
        <div className="crystal-face back"></div>
        <div className="crystal-face left"></div>
        <div className="crystal-face right"></div>
        <div className="crystal-face top"></div>
        <div className="crystal-face bottom"></div>
      </div>
    </div>
  )
}

// PWA state is now managed globally in store/index.ts

const NAV_ITEMS = [
  { path: '/',         icon: '🏠', label: 'Asosiy'  },
  { path: '/ombor',    icon: '🏛',  label: 'Ombor'   },
  { path: '/testlar',  icon: '📝', label: 'Testlar' },
  { path: '/ai',       icon: '🤖', label: 'AI'      },
  { path: '/profil',   icon: '👤', label: 'Profil'  },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isInTestRun =
    location.pathname.includes('/test-run/') ||
    (location.pathname.includes('/personal-tests/') && location.pathname.endsWith('/run'))

  const handleNavClick = (target: string) => {
    if (isInTestRun && target !== location.pathname) {
      const ev = new CustomEvent('fikra:nav-attempt', {
        detail: { target },
        cancelable: true,
      })
      const allowed = window.dispatchEvent(ev)
      if (!allowed) return
    }
    navigate(target)
  }

  return (
    <nav className="nav nav-6">
      {NAV_ITEMS.map(item => {
        const isActive =
          item.path === '/'
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/')
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Auth Guard ─────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: JSX.Element }) {
  const { user } = useAppStore()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/auth/welcome" state={{ from: location }} replace />
  }
  return children
}

import { usePwaStore } from './store'
import { useJobStore, initJobPoller } from './store/jobStore'
import { useToast } from './components/Toast'
import AuthModal from './components/AuthModal'
import AnnouncementBanner from './components/AnnouncementBanner'

function GlobalJobWatcher() {
  const { jobs, removeJob } = useJobStore()
  const navigate = useNavigate()
  const toast = useToast()

  const runningJobs = Object.values(jobs).filter(j => j.status === 'running')

  useEffect(() => {
    Object.values(jobs).forEach(job => {
      if (job.status === 'success') {
        toast.success(`${job.title} tayyor!`)
        if (job.type === 'test_generation' && job.result?.testId) {
          navigate(`/personal-tests/${job.result.testId}/run`)
        } else if (job.type === 'ai_chat' && job.result?.sessionId) {
          navigate(`/ai/chat/${job.result.sessionId}`)
        }
        removeJob(job.id)
      } else if (job.status === 'error') {
        toast.error(`${job.title} da xato: ${job.error}`)
        removeJob(job.id)
      }
    })
  }, [jobs, navigate, toast, removeJob])

  if (runningJobs.length === 0) return null

  return (
    <div style={{
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
    </div>
  )
}

export default function App() {
  const { user, initialized, bootstrap, refreshUser } = useAppStore()
  const { initPwa, canInstall, isInstalled, installPwa } = usePwaStore()
  const location = useLocation()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // App ochilganda config va sessiyani yuklash
  useEffect(() => {
    bootstrap()
    initPwa()
    initJobPoller()

    fetch('/api/config')
      .then(r => r.json())
      .then(c => {
        ;(window as any).ADMIN_USERNAME = c.adminUsername
      })
      .catch(() => {})
  }, [])

  // User mavjud bo'lsa polling
  useEffect(() => {
    if (!user) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      return
    }
    pollRef.current = setInterval(() => {
      if (!document.hidden) refreshUser()
    }, 60_000)

    const onVisChange = () => {
      if (!document.hidden) refreshUser()
    }
    document.addEventListener('visibilitychange', onVisChange)

    const onAuthExpired = () => bootstrap()
    window.addEventListener('fikra:auth-expired', onAuthExpired)

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      document.removeEventListener('visibilitychange', onVisChange)
      window.removeEventListener('fikra:auth-expired', onAuthExpired)
    }
  }, [user?.id])

  if (!initialized) return <FullLoader />

  const isAuthRoute = location.pathname.startsWith('/auth')

  return (
    <div className="app">
      <AuthModal />
      <AnnouncementBanner />
      {/* Global PWA Install Banner */}
      {!isInstalled && canInstall && !isAuthRoute && (
        <div style={{
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
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📲</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Ilovani yuklab oling</span>
              <span style={{ fontSize: 11, opacity: 0.9 }}>Tezroq va qulay ishlash uchun</span>
            </div>
          </div>
          <button
            onClick={installPwa}
            style={{
              background: '#fff',
              color: 'var(--acc)',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            O'rnatish
          </button>
        </div>
      )}
      <ToastProvider>
        <GlobalJobWatcher />
        {!isAuthRoute && <BottomNav />}
        <div className="app-content">
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -15 }}
                transition={{ duration: 0.3, type: 'tween', ease: 'easeInOut' }}
                style={{ width: '100%', height: '100%', overflowX: 'hidden' }}
              >
                <Routes location={location} key={location.pathname}>
                {/* Auth marshrutlari (public) */}
                <Route path="/auth/welcome"  element={<WelcomePage />} />
                <Route path="/auth/login"    element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* Himoyalangan marshrutlar */}
                <Route path="/" element={<HomePage />} />

                <Route path="/ombor"                       element={<OmborPage />} />
                <Route path="/ombor/:subjectId"            element={<RequireAuth><OmborSubjectPage /></RequireAuth>} />
                <Route path="/ombor/:subjectId/add-folder" element={<RequireAuth><FolderAddPage /></RequireAuth>} />
                <Route path="/ombor/folder/:folderId"      element={<RequireAuth><OmborFolderPage /></RequireAuth>} />
                <Route path="/ombor/folder/:folderId/add"  element={<RequireAuth><MaterialAddPage /></RequireAuth>} />
                <Route path="/ombor/folder/:folderId/flash" element={<RequireAuth><FlashcardPage /></RequireAuth>} />
                <Route path="/materials/:id/edit"          element={<RequireAuth><MaterialEditPage /></RequireAuth>} />

                <Route path="/testlar"                     element={<TestsPage />} />
                <Route path="/testlar/fikra"               element={<RequireAuth><FikraTestsPage /></RequireAuth>} />
                <Route path="/testlar/ai"                  element={<RequireAuth><AiTestsPage /></RequireAuth>} />
                <Route path="/testlar/ai/papkalar"         element={<RequireAuth><AiPapkalarPage /></RequireAuth>} />
                <Route path="/testlar/ai/blok"             element={<RequireAuth><AiBlokSetupPage /></RequireAuth>} />
                <Route path="/testlar/ai/erkin"            element={<RequireAuth><AiFreeSetupPage /></RequireAuth>} />
                <Route path="/testlar/fikra/blok"          element={<RequireAuth><BlokTestSetupPage /></RequireAuth>} />
                <Route path="/testlar/fikra/free"          element={<RequireAuth><FreeTestSetupPage /></RequireAuth>} />
                <Route path="/test-run/:sessionId"         element={<RequireAuth><TestRunPage /></RequireAuth>} />
                <Route path="/test-result/:sessionId"      element={<RequireAuth><TestResultPage /></RequireAuth>} />
                <Route path="/test-review/:sessionId"      element={<RequireAuth><TestReviewPage /></RequireAuth>} />
                <Route path="/test-explain/:sessionId/:subjectId" element={<RequireAuth><TestExplainPage /></RequireAuth>} />

                <Route path="/personal-tests/:id/run"      element={<RequireAuth><PersonalTestRunPage /></RequireAuth>} />
                <Route path="/personal-tests/:id/result"   element={<RequireAuth><PersonalTestResultPage /></RequireAuth>} />
                <Route path="/personal-tests/:id/review"   element={<RequireAuth><PersonalTestReviewPage /></RequireAuth>} />
                <Route path="/personal-tests/:id/explain"  element={<RequireAuth><PersonalTestExplainPage /></RequireAuth>} />

                <Route path="/tarix"                       element={<HistoryPage />} />
                <Route path="/ai/*"                        element={<AIPage />} />
                <Route path="/profil"                      element={<ProfilePage />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </ToastProvider>
    </div>
  )
}
