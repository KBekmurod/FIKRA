import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom'
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
const MaterialAddPage = lazy(() => import('./pages/MaterialAddPage'))
const MaterialEditPage = lazy(() => import('./pages/MaterialEditPage'))

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

function FullLoader() {
  return (
    <div className="full-loader">
      <div className="full-loader-text">FIKRA<span>.</span></div>
      <div className="spin" />
    </div>
  )
}

// Lazy sahifalar uchun yengil loader
function PageLoader() {
  return (
    <div style={{
      minHeight: 'calc(var(--vh, 1vh) * 100 - 64px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="spin" />
    </div>
  )
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (standalone) {
      setIsInstalled(true)
      return
    }

    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setCanInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)

    const onInstalled = () => setIsInstalled(true)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setCanInstall(false)
    setDeferredPrompt(null)
  }

  return { canInstall, install, isInstalled }
}

const NAV_ITEMS = [
  { path: '/',         icon: '🏠', label: 'Asosiy'  },
  { path: '/ombor',    icon: '🏛',  label: 'Ombor'   },
  { path: '/testlar',  icon: '📝', label: 'Testlar' },
  { path: '/tarix',    icon: '📚', label: 'Tarix'   },
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

export default function App() {
  const { user, initialized, bootstrap, refreshUser } = useAppStore()
  const location = useLocation()
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // App ochilganda config va sessiyani yuklash
  useEffect(() => {
    bootstrap()

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
      <ToastProvider>
        <div className="app-content">
          <Suspense fallback={<PageLoader />}>
            <Routes>
            {/* Auth marshrutlari (public) */}
            <Route path="/auth/welcome"  element={<WelcomePage />} />
            <Route path="/auth/login"    element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            {/* Himoyalangan marshrutlar */}
            <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />

            <Route path="/ombor"                       element={<RequireAuth><OmborPage /></RequireAuth>} />
            <Route path="/ombor/:subjectId"            element={<RequireAuth><OmborSubjectPage /></RequireAuth>} />
            <Route path="/ombor/:subjectId/add"        element={<RequireAuth><MaterialAddPage /></RequireAuth>} />
            <Route path="/ombor/folder/:folderId"      element={<RequireAuth><OmborFolderPage /></RequireAuth>} />
            <Route path="/materials/:id/edit"          element={<RequireAuth><MaterialEditPage /></RequireAuth>} />

            <Route path="/testlar"                     element={<RequireAuth><TestsPage /></RequireAuth>} />
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

            <Route path="/tarix"                       element={<RequireAuth><HistoryPage /></RequireAuth>} />
            <Route path="/ai/*"                        element={<RequireAuth><AIPage /></RequireAuth>} />
            <Route path="/profil"                      element={<RequireAuth><ProfilePage /></RequireAuth>} />
            </Routes>
          </Suspense>
        </div>
        {!isAuthRoute && user && <BottomNav />}
      </ToastProvider>
    </div>
  )
}
