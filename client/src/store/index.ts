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

    // Demo mode (brauzerda to'g'ridan-to'g'ri kirish)
    if (!initData || !tid) {
      set({
        user: {
          telegramId: 0,
          firstName: 'Demo Foydalanuvchi',
          plan: 'free',
          effectivePlan: 'free',
          streakDays: 3,
          xp: 150,
          totalGamesPlayed: 5,
          totalAiRequests: 2,
          aiUsage: { hints: 2, chats: 3, docs: 0, images: 0 },
          aiLimits: { hints: 5, chats: 10, docs: 2, images: 0 },
          _demo: true,
        } as any,
        loading: false,
      })
      return
    }

    // Saqlangan token bilan urinib ko'rish
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

    // Login
    try {
      const refCode = new URLSearchParams(window.location.search).get('ref')
        || tg?.initDataUnsafe?.start_param
      const { data } = await authApi.login(initData, refCode || undefined)
      if (data.user.telegramId !== tid) throw new Error('ID mismatch')
      setAuth(data.accessToken, data.refreshToken, tid)
      set({ user: data.user, loading: false })
    } catch (e: any) {
      console.warn('[FIKRA] Login error:', e.message)
      // Fallback: demo rejim (server xatosi bo'lsa)
      set({
        user: {
          telegramId: tid || 0,
          firstName: initUser?.first_name || 'Foydalanuvchi',
          username: initUser?.username,
          plan: 'free',
          effectivePlan: 'free',
          streakDays: 0,
          xp: 0,
          totalGamesPlayed: 0,
          totalAiRequests: 0,
          aiUsage: {},
          aiLimits: { hints: 5, chats: 10, docs: 2, images: 0 },
        } as any,
        loading: false,
        error: e.message,
      })
    }
  },

  refreshUser: async () => {
    // Agar token yo'q bo'lsa — refresh qilmaymiz
    if (!getStoredAuth()) return
    try {
      const { data } = await authApi.me()
      set({ user: data })
    } catch {
      // 401 bo'lsa client.ts interceptor hal qiladi
    }
  },

  logout: () => { clearAuth(); set({ user: null }) }
}))
