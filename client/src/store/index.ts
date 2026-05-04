import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api/endpoints'
import { setAuth, clearAuth, getStoredAuth } from '../api/client'

interface AppState {
  user: User | null
  loading: boolean
  error: string | null

  login: () => Promise<void>
  refreshUser: () => Promise<void>
  logout: () => void
}

declare global {
  interface Window {
    Telegram?: any
    BOT_USERNAME?: string
    ADMIN_USERNAME?: string
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  loading: true,
  error: null,

  login: async () => {
    set({ loading: true, error: null })
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData || ''
    const initUser = tg?.initDataUnsafe?.user
    const tid = initUser?.id

    // Agar Telegramdan kirmasa va saqlangan token bo'lmasa => user: null qoldiramiz (Login pageni ko'rsatish uchun)
    const stored = getStoredAuth()
    
    if (stored) {
      try {
        const { data } = await authApi.me()
        set({ user: data, loading: false })
        return
      } catch {
        clearAuth()
      }
    }

    if (initData && tid) {
      try {
        const refCode = new URLSearchParams(window.location.search).get('ref')
          || tg?.initDataUnsafe?.start_param
        const { data } = await authApi.login(initData, refCode || undefined)
        setAuth(data.accessToken, data.refreshToken, tid)
        set({ user: data.user, loading: false })
        return
      } catch (e: any) {
        console.warn('[FIKRA] Telegram Login error:', e.message)
      }
    }

    // Hech qanday auth topilmadi => Auth page
    set({ user: null, loading: false })
  },

  refreshUser: async () => {
    try {
      const { data } = await authApi.me()
      set({ user: data })
    } catch {}
  },

  logout: () => { clearAuth(); set({ user: null }) }
}))
