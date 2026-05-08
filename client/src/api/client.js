import axios from 'axios';
const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
export const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});
const TOKEN_KEY = 'fikra_auth';
export function getStoredAuth() {
    try {
        const raw = localStorage.getItem(TOKEN_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function setAuth(access, refresh, tgId) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access, refresh, tgId, ts: Date.now() }));
}
export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
}
api.interceptors.request.use(config => {
    const auth = getStoredAuth();
    if (auth?.access)
        config.headers.Authorization = `Bearer ${auth.access}`;
    return config;
});
// ─── Refresh token race condition'ni oldini oluvchi queue ────────────────────
let _refreshPromise = null;
async function refreshAccessToken() {
    const auth = getStoredAuth();
    if (!auth?.refresh)
        return null;
    try {
        const r = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken: auth.refresh });
        if (r.data.accessToken) {
            setAuth(r.data.accessToken, r.data.refreshToken ?? auth.refresh, auth.tgId);
            return r.data.accessToken;
        }
        return null;
    }
    catch {
        clearAuth();
        return null;
    }
}
api.interceptors.response.use(res => res, async (err) => {
    const cfg = err.config;
    if (err.response?.status === 401 && !cfg.__retry) {
        cfg.__retry = true;
        // Bir vaqtda ko'p refresh so'rovi kelsa — bitta promise'ni kutamiz
        if (!_refreshPromise) {
            _refreshPromise = refreshAccessToken().finally(() => {
                _refreshPromise = null;
            });
        }
        const newToken = await _refreshPromise;
        if (newToken) {
            cfg.headers.Authorization = `Bearer ${newToken}`;
            return api.request(cfg);
        }
        // Token yangilanmadi — sahifani qayta yuklash
        window.location.reload();
    }
    return Promise.reject(err);
});
export default api;
