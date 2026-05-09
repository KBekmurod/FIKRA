import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// ─── Telegram WebApp init ─────────────────────────────────────────────────
const tg = (window as any).Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
  try { tg.setHeaderColor('#0a0a14') } catch {}
  try { tg.setBackgroundColor('#0a0a14') } catch {}
  // Disallow vertical swipe-to-close (prevent accidental close during scroll)
  try { tg.disableVerticalSwipes?.() } catch {}
}

// ─── CSS viewport fix: real vh (iOS Safari, Telegram keyboard) ──────────────
// window.innerHeight = haqiqiy ko'rinadigan balandlik (keyboard ochilganda o'zgaradi)
function setVh() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}
setVh()
window.addEventListener('resize', setVh, { passive: true })
// Telegram viewport_changed hodisasi
if (tg) {
  tg.onEvent?.('viewportChanged', setVh)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
