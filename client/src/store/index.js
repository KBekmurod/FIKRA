import { create } from 'zustand';
import { authApi } from '../api/endpoints';
import { setAuth, clearAuth, getStoredAuth } from '../api/client';
export const useAppStore = create((set) => ({
    user: null,
    loading: true,
    error: null,
    login: async () => {
        set({ loading: true, error: null });
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || '';
        const initUser = tg?.initDataUnsafe?.user;
        const tid = initUser?.id;
        const stored = getStoredAuth();
        // ─── 1-qadam: Saqlangan token bor bo'lsa — uni sinab ko'ramiz ───────────
        if (stored?.access) {
            try {
                const { data } = await authApi.me();
                // ─── Telegram WebApp'da ochilgan bo'lsa va token bor, lekin
                //     bu user'da telegramId yo'q (Chrome'dan kirgan) —
                //     avtomatik link qilish urinishini qilamiz ──────────────────────
                if (initData && tid && !data.telegramId) {
                    try {
                        const { data: linked } = await authApi.linkTelegram(initData);
                        if (linked.accessToken) {
                            setAuth(linked.accessToken, linked.refreshToken, tid);
                        }
                        set({ user: linked.user, loading: false });
                        return;
                    }
                    catch (linkErr) {
                        console.warn('[FIKRA] Telegram link failed:', linkErr?.response?.data?.error);
                    }
                }
                set({ user: data, loading: false });
                return;
            }
            catch {
                clearAuth();
            }
        }
        // ─── 2-qadam: Token yo'q, Telegram WebApp bor — Telegram orqali kirish ──
        if (initData && tid) {
            try {
                const refCode = new URLSearchParams(window.location.search).get('ref')
                    || tg?.initDataUnsafe?.start_param;
                const { data } = await authApi.login(initData, refCode || undefined);
                setAuth(data.accessToken, data.refreshToken, tid);
                set({ user: data.user, loading: false });
                return;
            }
            catch (e) {
                console.warn('[FIKRA] Telegram login error:', e.message);
            }
        }
        // ─── 3-qadam: Hech qanday auth topilmadi — AuthPage ko'rsatiladi ────────
        set({ user: null, loading: false });
    },
    refreshUser: async () => {
        try {
            const { data } = await authApi.me();
            set({ user: data });
        }
        catch { }
    },
    logout: () => { clearAuth(); set({ user: null }); },
}));
