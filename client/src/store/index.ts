import { create } from 'zustand'
import type { User } from '../types'
import { authApi } from '../api/endpoints'
import { setAuth, clearAuth, getStoredAuth } from '../api/client'

interface AppState {
  user: User | null
  loading: boolean
  initialized: boolean
  error: string | null
  authModalOpen: boolean

  // Auth metodlari
  setAuthModalOpen: (open: boolean) => void
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
  authModalOpen: false,

  setAuthModalOpen: (open: boolean) => set({ authModalOpen: open }),

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

interface PwaState {
  canInstall: boolean
  isInstalled: boolean
  deferredPrompt: any
  initPwa: () => void
  installPwa: () => Promise<void>
}

export const usePwaStore = create<PwaState>((set, get) => ({
  canInstall: false,
  isInstalled: false,
  deferredPrompt: null,

  initPwa: () => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    if (standalone) {
      set({ isInstalled: true })
      return
    }

    const handler = (e: any) => {
      e.preventDefault()
      set({ deferredPrompt: e, canInstall: true })
    }
    window.addEventListener('beforeinstallprompt', handler)

    const onInstalled = () => set({ isInstalled: true, canInstall: false })
    window.addEventListener('appinstalled', onInstalled)

    // Optional cleanup is generally not needed for singleton store, but good practice
    // We just attach once.
  },

  installPwa: async () => {
    const { deferredPrompt } = get()
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      set({ canInstall: false })
    }
    set({ deferredPrompt: null })
  },
}))

export interface AiState {
  // Chat
  chatSessionId: string | null
  chatMessages: { role: string; content: string }[]
  chatInput: string
  chatSending: boolean
  setChatState: (state: Partial<AiState>) => void

  // Doc
  docPrompt: string
  docFormat: 'DOCX' | 'PDF' | 'PPTX'
  docMaxPages: number
  docRemoveWatermark: boolean
  docLoading: boolean
  docStatusMsg: string
  docResult: any | null
  setDocState: (state: Partial<AiState>) => void
}

export const useAiStore = create<AiState>((set) => ({
  chatSessionId: null,
  chatMessages: [],
  chatInput: '',
  chatSending: false,
  setChatState: (state) => set(state),

  docPrompt: '',
  docFormat: 'DOCX',
  docMaxPages: 2,
  docRemoveWatermark: false,
  docLoading: false,
  docStatusMsg: '',
  docResult: null,
  setDocState: (state) => set(state),
}))
