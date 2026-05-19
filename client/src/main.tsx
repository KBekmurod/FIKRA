import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// ─── Telegram WebApp init ─────────────────────────────────────────────────
const tg = (window as any).Telegram?.WebApp
if (tg) {
  try {
    tg.ready()
    tg.expand()
    try { tg.setHeaderColor('#0a0a14') } catch {}
    try { tg.setBackgroundColor('#0a0a14') } catch {}
    try { tg.disableVerticalSwipes?.() } catch {}
  } catch {}
}

// ─── CSS viewport fix: real vh (iOS Safari, Telegram keyboard) ──────────────
function setVh() {
  try {
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  } catch {}
}
setVh()
window.addEventListener('resize', setVh, { passive: true })
if (tg) {
  try { tg.onEvent?.('viewportChanged', setVh) } catch {}
}

// ─── Service Worker yangilash strategiyasi ────────────────────────────────
// Yangi versiya kelganda eski cache'ni darrov tozalash
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener?.('controllerchange', () => {
    // Yangi SW faollashgach sahifani yangilamiz
    if ((window as any).__fikra_reloading__) return
    ;(window as any).__fikra_reloading__ = true
    setTimeout(() => window.location.reload(), 200)
  })
}

// ─── Unhandled rejection log ──────────────────────────────────────────────
// Promise rejection'larini ushlab, console'ga chiqaramiz
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason)
  // Crash'ga aylantirmaymiz, faqat log
})

// Production'da StrictMode'ni olib tashlash — double-render WebView'da
// memory bosimini oshiradi
const Root = (
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV
    ? <React.StrictMode>{Root}</React.StrictMode>
    : Root
)
