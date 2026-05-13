import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from './store'
import HomePage from './pages/HomePage'
import SubjectsPage from './pages/SubjectsPage'
import SubjectDetailPage from './pages/SubjectDetailPage'
import MaterialAddPage from './pages/MaterialAddPage'
import MaterialEditPage from './pages/MaterialEditPage'
import PersonalTestRunPage from './pages/PersonalTestRunPage'
import PersonalTestResultPage from './pages/PersonalTestResultPage'
import TestPage from './pages/TestPage'
import AIPage from './pages/AIPage'
import ProfilePage from './pages/ProfilePage'
import CabinetPage from './pages/CabinetPage'
import LevelPage from './pages/LevelPage'
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

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initData) return
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setCanInstall(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setCanInstall(false)
    setDeferredPrompt(null)
  }

  return { canInstall, install }
}

// ─── v2: Yangi navigatsiya ─────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/',         icon: '🏠', label: 'Bosh' },
  { path: '/subjects', icon: '📚', label: 'Fanlar' },
  { path: '/ai',       icon: '🤖', label: 'AI' },
  { path: '/level',    icon: '📊', label: 'Daraja' },
  { path: '/profile',  icon: '👤', label: 'Profil' },
]

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="nav">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path
          || (item.path !== '/' && location.pathname.startsWith(item.path))
        return (
          <button
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              navigate(item.path)
              try {
                (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('light')
              } catch {}
            }}
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
            <Route path="/subjects" element={<SubjectsPage />} />
            <Route path="/subjects/:subjectId" element={<SubjectDetailPage />} />
            <Route path="/subjects/:subjectId/add" element={<MaterialAddPage />} />
            <Route path="/materials/:id/edit" element={<MaterialEditPage />} />
            <Route path="/personal-tests/:id/run" element={<PersonalTestRunPage />} />
            <Route path="/personal-tests/:id/result" element={<PersonalTestResultPage />} />
            <Route path="/level" element={<LevelPage />} />

            <Route path="/test/*" element={<TestPage />} />
            <Route path="/cabinet/*" element={<CabinetPage />} />
            <Route path="/ai/*" element={<AIPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
        <BottomNav />
      </ToastProvider>
    </div>
  )
}
