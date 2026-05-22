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
  login: (identifier: string, password: string) => Promise<void>
  register: (identifier: string, password: string, name: string) => Promise<void>

  refreshUser: () => Promise<void>
  logout: () => void
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

  // ─── Kirish (email yoki telefon + parol) ──────────────────────────────
  login: async (identifier, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authApi.login(identifier, password)
      setAuth(data.accessToken, data.refreshToken)
      set({ user: data.user, loading: false, initialized: true })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  // ─── Ro'yxatdan o'tish (email yoki telefon + parol + ism) ─────────────
  register: async (identifier, password, name) => {
    set({ loading: true, error: null })
    try {
      const { data } = await authApi.register(identifier, password, name)
      setAuth(data.accessToken, data.refreshToken)
      set({ user: data.user, loading: false, initialized: true })
    } catch (err) {
      set({ loading: false })
      throw err
    }
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
  },
}))
