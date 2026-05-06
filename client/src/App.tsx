import { useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from './store'
import HomePage from './pages/HomePage'
import TestPage from './pages/TestPage'
import AIPage from './pages/AIPage'
import ProfilePage from './pages/ProfilePage'
import AuthPage from './pages/AuthPage'
import InstallPWA from './components/InstallPWA'
import { ToastProvider } from './components/Toast'
import { flushOfflineResultQueue } from './utils/offlineSync'

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

  useEffect(() => {
    login().finally(() => setBootstrapped(true))

    // Config olish
    fetch('/api/config').then(r => r.json()).then(c => {
      ;(window as any).BOT_USERNAME = c.botUsername
      ;(window as any).ADMIN_USERNAME = c.adminUsername
    }).catch(() => {})

    // Polling — har 30 sek user ma'lumotlarini yangilash
    const t = setInterval(() => {
      if (useAppStore.getState().user) {
        refreshUser()
      }
    }, 30000)

    const syncOfflineResults = () => {
      flushOfflineResultQueue().catch(() => {})
    }

    syncOfflineResults()
    window.addEventListener('online', syncOfflineResults)

    return () => {
      clearInterval(t)
      window.removeEventListener('online', syncOfflineResults)
    }
  }, [])

  if (!bootstrapped || loading) return <FullLoader />

  if (!user) {
    return (
      <div className="app">
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
          <ToastProvider>
            <AuthPage />
            <InstallPWA />
          </ToastProvider>
        </GoogleOAuthProvider>
      </div>
    )
  }

  return (
    <div className="app">
      <ToastProvider>
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/test/*" element={<TestPage />} />
            <Route path="/ai/*" element={<AIPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </div>
        <BottomNav />
        <InstallPWA />
      </ToastProvider>
    </div>
  )
}
