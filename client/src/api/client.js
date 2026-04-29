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
let _refreshing = false;
api.interceptors.response.use(res => res, async (err) => {
    const cfg = err.config;
    const auth = getStoredAuth();
    if (err.response?.status === 401 && auth?.refresh && !cfg.__retry) {
        cfg.__retry = true;
        if (_refreshing)
            return Promise.reject(err);
        _refreshing = true;
        try {
            const r = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken: auth.refresh });
            if (r.data.accessToken) {
                setAuth(r.data.accessToken, r.data.refreshToken, auth.tgId);
                cfg.headers.Authorization = `Bearer ${r.data.accessToken}`;
                return api.request(cfg);
            }
        }
        catch {
            clearAuth();
            window.location.reload();
        }
        finally {
            _refreshing = false;
        }
    }
    return Promise.reject(err);
});
export default api;
