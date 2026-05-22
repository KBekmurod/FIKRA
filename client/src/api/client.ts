import axios, { AxiosError } from 'axios'

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

const TOKEN_KEY = 'fikra_auth'

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { access: string; refresh: string; ts: number }
  } catch { return null }
}

export function setAuth(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ access, refresh, ts: Date.now() }))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  // XAVFSIZLIK: barcha user-scoped cache'larni tozalaymiz
  // (chat tarixi, qoralamalar va h.k.)
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      if (
        key.startsWith('fikra_chat_history') ||
        key.startsWith('fikra_draft_') ||
        key.startsWith('fikra_pending_') ||
        key.startsWith('fikra_test_state_')
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  } catch {}
}

api.interceptors.request.use(config => {
  const auth = getStoredAuth()
  if (auth?.access) config.headers.Authorization = `Bearer ${auth.access}`
  return config
})

let _refreshing = false
let _refreshCallbacks: Array<(token: string) => void> = []

api.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const cfg: any = err.config
    const auth = getStoredAuth()

    if (err.response?.status === 401 && auth?.refresh && !cfg.__retry) {
      cfg.__retry = true

      // Agar allaqachon refresh bo'lmoqda bo'lsa — kutish
      if (_refreshing) {
        return new Promise((resolve, reject) => {
          _refreshCallbacks.push((token: string) => {
            cfg.headers.Authorization = `Bearer ${token}`
            resolve(api.request(cfg))
          })
        })
      }

      _refreshing = true
      try {
        const r = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken: auth.refresh })
        if (r.data.accessToken) {
          setAuth(r.data.accessToken, r.data.refreshToken || auth.refresh)
          cfg.headers.Authorization = `Bearer ${r.data.accessToken}`
          // Kutgan so'rovlarni ham bajarish
          _refreshCallbacks.forEach(cb => cb(r.data.accessToken))
          _refreshCallbacks = []
          return api.request(cfg)
        }
      } catch {
        // Token yangilash muvaffaqiyatsiz — faqat auth tozalash, reload EMAS
        clearAuth()
        _refreshCallbacks = []
        // Ilovani saqlash: foydalanuvchini login sahifasiga yubormaymiz,
        // store.login() qayta chaqirilishi uchun event yuboramiz
        window.dispatchEvent(new CustomEvent('fikra:auth-expired'))
      } finally {
        _refreshing = false
      }
    }

    // ─── 5xx server xatolarini backend log endpoint'ga yuborish ─────────
    // Auth xatolari (401/403) va 404'lar tashqarida qoldiriladi
    if (err.response && err.response.status >= 500) {
      try {
        const payload = {
          type: 'network',
          message: err.message || 'Server xatosi',
          url: err.config?.url || 'unknown',
          method: err.config?.method?.toUpperCase() || 'GET',
          status: err.response.status,
          timestamp: new Date().toISOString(),
        }
        // sendBeacon — nimagadir crash bo'lsa ham yuboradi
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/log/client-info',
            new Blob([JSON.stringify(payload)], { type: 'application/json' })
          )
        }
      } catch {}
    }

    return Promise.reject(err)
  }
)

// ─── window.onerror va unhandledrejection — uncaught xatolar ───────────
// Bu xatolarni darrov backend log endpoint'ga yuborib, terminalda ko'rinadigan qilamiz
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    try {
      const payload = {
        type: 'window.onerror',
        message: event.message || 'Unknown error',
        stack: (event.error?.stack || '').slice(0, 800),
        url: window.location.href,
        userAgent: navigator.userAgent.slice(0, 150),
        timestamp: new Date().toISOString(),
        component: `${event.filename}:${event.lineno}:${event.colno}`,
      }
      navigator.sendBeacon?.('/api/log/client-error',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      )
    } catch {}
  })

  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason
      const payload = {
        type: 'unhandledRejection',
        message: reason?.message || String(reason) || 'Unknown rejection',
        stack: (reason?.stack || '').slice(0, 800),
        url: window.location.href,
        userAgent: navigator.userAgent.slice(0, 150),
        timestamp: new Date().toISOString(),
      }
      navigator.sendBeacon?.('/api/log/client-error',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      )
    } catch {}
  })
}

export default api
