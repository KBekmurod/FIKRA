import { create } from 'zustand';
import { authApi } from '../api/endpoints';
import { setAuth, clearAuth, getStoredAuth } from '../api/client';
export const useAppStore = create((set, get) => ({
    user: null,
    loading: true,
    error: null,
    login: async () => {
        set({ loading: true, error: null });
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || '';
        const initUser = tg?.initDataUnsafe?.user;
        const tid = initUser?.id;
        // Brauzerdan to'g'ridan-to'g'ri kirish (Telegram WebApp yo'q)
        if (!initData || !tid) {
            // Serverga bot WebApp'siz login qilib ko'rish
            // (development va test uchun qulay)
            try {
                const { data } = await authApi.login('browser_test');
                set({ user: data.user, loading: false });
                return;
            }
            catch {
                // Server ham rад etsa — anonymous rejim
                set({
                    user: {
                        telegramId: 0,
                        firstName: 'Telegram orqali kiring',
                        plan: 'free',
                        effectivePlan: 'free',
                        streakDays: 0,
                        xp: 0,
                        totalGamesPlayed: 0,
                        totalAiRequests: 0,
                        aiUsage: { hints: 0, chats: 0, docs: 0, images: 0 },
                        aiLimits: { hints: 5, chats: 10, docs: 2, images: 0 },
                        _demo: true,
                    },
                    loading: false,
                });
                return;
            }
        }
        // Saqlangan token bilan urinib ko'rish
        const stored = getStoredAuth();
        if (stored && stored.tgId === tid) {
            try {
                const { data } = await authApi.me();
                if (data.telegramId === tid) {
                    set({ user: data, loading: false });
                    return;
                }
            }
            catch {
                clearAuth();
            }
        }
        else if (stored && stored.tgId !== tid) {
            clearAuth();
        }
        // Login
        try {
            const refCode = new URLSearchParams(window.location.search).get('ref')
                || tg?.initDataUnsafe?.start_param;
            const { data } = await authApi.login(initData, refCode || undefined);
            if (data.user.telegramId !== tid)
                throw new Error('ID mismatch');
            setAuth(data.accessToken, data.refreshToken, tid);
            set({ user: data.user, loading: false });
        }
        catch (e) {
            console.warn('[FIKRA] Login error:', e.message);
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
                },
                loading: false,
                error: e.message,
            });
        }
    },
    refreshUser: async () => {
        // Agar token yo'q bo'lsa — refresh qilmaymiz
        if (!getStoredAuth())
            return;
        try {
            const { data } = await authApi.me();
            set({ user: data });
        }
        catch {
            // 401 bo'lsa client.ts interceptor hal qiladi
        }
    },
    logout: () => { clearAuth(); set({ user: null }); }
}));
