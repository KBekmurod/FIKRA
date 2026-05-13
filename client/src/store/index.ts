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

export const useAppStore = create<AppState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async () => {
    set({ loading: true, error: null })
    const tg = window.Telegram?.WebApp
    const initData = tg?.initData || ''
    const initUser = tg?.initDataUnsafe?.user
    const tid = initUser?.id

    if (!initData || !tid) {
      try {
        const { data } = await authApi.login('browser_test')
        set({ user: data.user, loading: false })
        return
      } catch {
        set({
          user: {
            telegramId: 0,
            firstName: 'Telegram orqali kiring',
            plan: 'free',
            effectivePlan: 'free',
            aiUsage: {},
            aiLimits: { hints: 5, chats: 10, docs: 2, images: 0 },
            _demo: true,
          } as any,
          loading: false,
        })
        return
      }
    }

    const stored = getStoredAuth()
    if (stored && stored.tgId === tid) {
      try {
        const { data } = await authApi.me()
        if (data.telegramId === tid) {
          set({ user: data, loading: false })
          return
        }
      } catch {
        clearAuth()
      }
    } else if (stored && stored.tgId !== tid) {
      clearAuth()
    }

    try {
      const refCode = new URLSearchParams(window.location.search).get('ref')
        || tg?.initDataUnsafe?.start_param
      const { data } = await authApi.login(initData, refCode || undefined)
      if (data.user.telegramId !== tid) throw new Error('ID mismatch')
      setAuth(data.accessToken, data.refreshToken, tid)
      set({ user: data.user, loading: false })
    } catch (e: any) {
      console.warn('[FIKRA] Login error:', e.message)
      set({
        user: {
          telegramId: tid || 0,
          firstName: initUser?.first_name || 'Foydalanuvchi',
          username: initUser?.username,
          plan: 'free',
          effectivePlan: 'free',
          aiUsage: {},
          aiLimits: { hints: 5, chats: 10, docs: 2, images: 0 },
        } as any,
        loading: false,
        error: e.message,
      })
    }
  },

  refreshUser: async () => {
    if (!getStoredAuth()) return
    try {
      const { data } = await authApi.me()
      set({ user: data })
    } catch { /* interceptor handles 401 */ }
  },

  logout: () => { clearAuth(); set({ user: null }) }
}))
