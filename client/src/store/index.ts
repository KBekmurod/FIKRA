import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api/endpoints'
import { setAuth, clearAuth, getStoredAuth } from '../api/client'

interface AppState {
  user: User | null
  loading: boolean
  initialized: boolean
  error: string | null

  // Auth metodlari
  bootstrap: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  loginWithTelegram: () => Promise<void>
  linkTelegram: () => Promise<void>

  refreshUser: () => Promise<void>
  logout: () => void
}

declare global {
  interface Window {
    Telegram?: any
    BOT_USERNAME?: string
    ADMIN_USERNAME?: string
    GOOGLE_CLIENT_ID?: string
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  loading: true,
  initialized: false,
  error: null,

  // ─── Bootstrap: dastur ochilganda mavjud sessiyani tekshirish ─────────
  bootstrap: async () => {
    set({ loading: true, error: null })

    const stored = getStoredAuth()
    if (stored) {
      try {
        const { data } = await authApi.me()
        set({ user: data, loading: false, initialized: true })
        return
      } catch {
        clearAuth()
      }
    }

    set({ user: null, loading: false, initialized: true })
  },

  // ─── Email/parol bilan kirish ─────────────────────────────────────────
  loginWithEmail: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authApi.loginEmail(email, password)
      setAuth(data.accessToken, data.refreshToken, data.user.telegramId || null)
      // QUSUR TUZATILDI: initialized=true ham qilamiz, RequireAuth race condition oldini olish
      set({ user: data.user, loading: false, initialized: true })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  // ─── Email/parol bilan ro'yxat ────────────────────────────────────────
  register: async (email, password, name) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authApi.register(email, password, name)
      setAuth(data.accessToken, data.refreshToken, data.user.telegramId || null)
      set({ user: data.user, loading: false, initialized: true })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  // ─── Google ID token bilan kirish ─────────────────────────────────────
  loginWithGoogle: async (idToken: string) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authApi.google(idToken)
      setAuth(data.accessToken, data.refreshToken, data.user.telegramId || null)
      set({ user: data.user, loading: false, initialized: true })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  // ─── Telegram orqali kirish ───────────────────────────────────────────
  loginWithTelegram: async () => {
    set({ loading: true, error: null })
    try {
      const tg = window.Telegram?.WebApp
      const initData = tg?.initData || ''
      if (!initData) throw new Error('Telegram initData yo\'q')
      const { data } = await authApi.telegramLogin(initData)
      setAuth(data.accessToken, data.refreshToken, data.user.telegramId || null)
      set({ user: data.user, loading: false, initialized: true })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  // ─── Joriy akkountga Telegram bog'lash ──────────────────────────────
  linkTelegram: async () => {
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData || ''
    if (!initData) throw new Error('Telegram initData yo\'q')
    const { data } = await authApi.telegramLink(initData)
    set({ user: data.user })
  },

  refreshUser: async () => {
    if (!getStoredAuth()) return
    try {
      const { data } = await authApi.me()
      set({ user: data })
    } catch { /* interceptor handles 401 */ }
  },

  logout: () => {
    clearAuth()
    set({ user: null })
    // Welcome sahifaga yo'naltirish — bu komponentlarda navigate orqali bo'ladi
  },
}))
