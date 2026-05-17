import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from './store'

// Asosiy
import HomePage from './pages/HomePage'

// Ombor (materiallar)
import OmborPage from './pages/OmborPage'
import OmborSubjectPage from './pages/OmborSubjectPage'
import MaterialAddPage from './pages/MaterialAddPage'
import MaterialEditPage from './pages/MaterialEditPage'

// Testlar
import TestsPage from './pages/TestsPage'
import FikraTestsPage from './pages/FikraTestsPage'
import AiTestsPage from './pages/AiTestsPage'
import BlokTestSetupPage from './pages/BlokTestSetupPage'
import FreeTestSetupPage from './pages/FreeTestSetupPage'
import TestRunPage from './pages/TestRunPage'
import TestResultPage from './pages/TestResultPage'
import TestReviewPage from './pages/TestReviewPage'
import TestExplainPage from './pages/TestExplainPage'

// Personal testlar (AI ombor testlari)
import PersonalTestRunPage from './pages/PersonalTestRunPage'
import PersonalTestResultPage from './pages/PersonalTestResultPage'

// Tarix
import HistoryPage from './pages/HistoryPage'

// AI
import AIPage from './pages/AIPage'

// Profil
import ProfilePage from './pages/ProfilePage'

import { ToastProvider } from './components/Toast'

function FullLoader() {
  return (
    <div className="full-loader">
      <div className="full-loader-text">FIKRA<span>.</span></div>
      <div className="spin" />
    </div>
  )
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // PWA o'rnatilgan-yoki yo'qligini aniqlash
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (standalone) {
      setIsInstalled(true)
      return
    }

    const tg = (window as any).Telegram?.WebApp
    if (tg?.initData) return

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

// ─── 6 ta navigatsiya tugmasi ─────────────────────────────────────────────
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

  // Test ishlash sahifalarida nav tugmasini bossa, modal so'rovi kerak
  const isInTestRun =
    location.pathname.includes('/test-run/') ||
    location.pathname.includes('/personal-tests/') && location.pathname.endsWith('/run')

  const handleNavClick = (target: string) => {
    if (isInTestRun && target !== location.pathname) {
      // Custom event — TestRunPage tinglashi mumkin
      const ev = new CustomEvent('fikra:nav-attempt', {
        detail: { target },
        cancelable: true,
      })
      const allowed = window.dispatchEvent(ev)
      if (!allowed) return
    }
    navigate(target)
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
    } catch {}
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

export default function App() {
  const { loading, login, refreshUser } = useAppStore()
  const [bootstrapped, setBootstrapped] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const KEY = 'fikra_open_count'
    const prev = parseInt(localStorage.getItem(KEY) || '0', 10)
    localStorage.setItem(KEY, String(prev + 1))
  }, [])

  useEffect(() => {
    login().finally(() => setBootstrapped(true))

    fetch('/api/config')
      .then(r => r.json())
      .then(c => {
        ;(window as any).BOT_USERNAME = c.botUsername
        ;(window as any).ADMIN_USERNAME = c.adminUsername
      })
      .catch(() => {})

    const startPoll = () => {
      stopPoll()
      pollRef.current = setInterval(() => {
        if (!document.hidden) refreshUser()
      }, 60_000)
    }
    const stopPoll = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }

    startPoll()

    const onVisChange = () => {
      if (document.hidden) stopPoll()
      else { refreshUser(); startPoll() }
    }
    document.addEventListener('visibilitychange', onVisChange)

    const onAuthExpired = () => login()
    window.addEventListener('fikra:auth-expired', onAuthExpired)

    return () => {
      stopPoll()
      document.removeEventListener('visibilitychange', onVisChange)
      window.removeEventListener('fikra:auth-expired', onAuthExpired)
    }
  }, [])

  if (!bootstrapped || loading) return <FullLoader />

  return (
    <div className="app">
      <ToastProvider>
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* OMBOR */}
            <Route path="/ombor"                       element={<OmborPage />} />
            <Route path="/ombor/:subjectId"            element={<OmborSubjectPage />} />
            <Route path="/ombor/:subjectId/add"        element={<MaterialAddPage />} />
            <Route path="/materials/:id/edit"          element={<MaterialEditPage />} />

            {/* TESTLAR */}
            <Route path="/testlar"                     element={<TestsPage />} />
            <Route path="/testlar/fikra"               element={<FikraTestsPage />} />
            <Route path="/testlar/ai"                  element={<AiTestsPage />} />
            <Route path="/testlar/fikra/blok"          element={<BlokTestSetupPage />} />
            <Route path="/testlar/fikra/free"          element={<FreeTestSetupPage />} />
            <Route path="/test-run/:sessionId"         element={<TestRunPage />} />
            <Route path="/test-result/:sessionId"      element={<TestResultPage />} />
            <Route path="/test-review/:sessionId"      element={<TestReviewPage />} />
            <Route path="/test-explain/:sessionId/:subjectId" element={<TestExplainPage />} />

            {/* Personal testlar (Ombor → AI test) */}
            <Route path="/personal-tests/:id/run"      element={<PersonalTestRunPage />} />
            <Route path="/personal-tests/:id/result"   element={<PersonalTestResultPage />} />

            {/* TARIX */}
            <Route path="/tarix"                       element={<HistoryPage />} />

            {/* AI */}
            <Route path="/ai/*"                        element={<AIPage />} />

            {/* PROFIL */}
            <Route path="/profil"                      element={<ProfilePage />} />
          </Routes>
        </div>
        <BottomNav />
      </ToastProvider>
    </div>
  )
}
