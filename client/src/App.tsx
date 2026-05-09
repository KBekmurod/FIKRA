import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from './store'
import HomePage from './pages/HomePage'
import TestPage from './pages/TestPage'
import AIPage from './pages/AIPage'
import ProfilePage from './pages/ProfilePage'
import CabinetPage from './pages/CabinetPage'
import { ToastProvider } from './components/Toast'

function FullLoader() {
  return (
    <div className="full-loader">
      <div className="full-loader-text">FIKRA<span>.</span></div>
      <div className="spin" />
    </div>
  )
}

const NAV_ITEMS = [
  { path: '/',        icon: '🏠', label: 'Bosh' },
  { path: '/test',    icon: '📚', label: 'Test' },
  { path: '/cabinet', icon: '🎓', label: 'Kabinet' },
  { path: '/ai',      icon: '🤖', label: 'AI' },
  { path: '/profile', icon: '👤', label: 'Profil' },
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
  const { user, loading, login, refreshUser } = useAppStore()
  const [bootstrapped, setBootstrapped] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    login().finally(() => setBootstrapped(true))

    // Config olish
    fetch('/api/config')
      .then(r => r.json())
      .then(c => {
        ;(window as any).BOT_USERNAME = c.botUsername
        ;(window as any).ADMIN_USERNAME = c.adminUsername
      })
      .catch(() => {})

    // Polling — faqat tab active bo'lganda ishlaydi (UI freeze oldini olish)
    // 60s ga oshirdik (30s juda tez edi va freeze keltirar edi)
    const startPoll = () => {
      stopPoll()
      pollRef.current = setInterval(() => {
        // Faqat document visible bo'lganda refresh
        if (!document.hidden) {
          refreshUser()
        }
      }, 60_000)
    }

    const stopPoll = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }

    startPoll()

    // Visibility change: tab yashirilganda polling to'xtatish
    const onVisChange = () => {
      if (document.hidden) {
        stopPoll()
      } else {
        // Tab qayta ko'rindi — darhol bir refresh, keyin polling qayta boshlash
        refreshUser()
        startPoll()
      }
    }
    document.addEventListener('visibilitychange', onVisChange)

    // Auth expired event (token yangilanmasa)
    const onAuthExpired = () => {
      login()
    }
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
