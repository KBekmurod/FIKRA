import { create } from 'zustand';
import { authApi } from '../api/endpoints';
import { setAuth, clearAuth, getStoredAuth } from '../api/client';
export const useAppStore = create((set, get) => ({
    user: null,
    loading: true,
    initialized: false,
    error: null,
    // ─── Bootstrap: dastur ochilganda mavjud sessiyani tekshirish ─────────
    bootstrap: async () => {
        set({ loading: true, error: null });
        const stored = getStoredAuth();
        if (stored) {
            try {
                const { data } = await authApi.me();
                set({ user: data, loading: false, initialized: true });
                return;
            }
            catch {
                clearAuth();
            }
        }
        set({ user: null, loading: false, initialized: true });
    },
    // ─── Kirish (email yoki telefon + parol) ──────────────────────────────
    login: async (identifier, password) => {
        set({ loading: true, error: null });
        try {
            const { data } = await authApi.login(identifier, password);
            setAuth(data.accessToken, data.refreshToken);
            set({ user: data.user, loading: false, initialized: true });
        }
        catch (err) {
            set({ loading: false });
            throw err;
        }
    },
    // ─── Ro'yxatdan o'tish (email yoki telefon + parol + ism) ─────────────
    register: async (identifier, password, name) => {
        set({ loading: true, error: null });
        try {
            const { data } = await authApi.register(identifier, password, name);
            setAuth(data.accessToken, data.refreshToken);
            set({ user: data.user, loading: false, initialized: true });
        }
        catch (err) {
            set({ loading: false });
            throw err;
        }
    },
    refreshUser: async () => {
        if (!getStoredAuth())
            return;
        try {
            const { data } = await authApi.me();
            set({ user: data });
        }
        catch { /* interceptor handles 401 */ }
    },
    logout: () => {
        clearAuth();
        set({ user: null });
    },
}));
export const usePwaStore = create((set, get) => ({
    canInstall: false,
    isInstalled: false,
    deferredPrompt: null,
    initPwa: () => {
        const standalone = window.matchMedia?.('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        if (standalone) {
            set({ isInstalled: true });
            return;
        }
        const handler = (e) => {
            e.preventDefault();
            set({ deferredPrompt: e, canInstall: true });
        };
        window.addEventListener('beforeinstallprompt', handler);
        const onInstalled = () => set({ isInstalled: true, canInstall: false });
        window.addEventListener('appinstalled', onInstalled);
        // Optional cleanup is generally not needed for singleton store, but good practice
        // We just attach once.
    },
    installPwa: async () => {
        const { deferredPrompt } = get();
        if (!deferredPrompt)
            return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            set({ canInstall: false });
        }
        set({ deferredPrompt: null });
    },
}));
