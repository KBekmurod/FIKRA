var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
import axios from 'axios';
var API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';
export var api = axios.create({
    baseURL: API_BASE,
    timeout: 30000
});
var TOKEN_KEY = 'fikra_auth';
export function getStoredAuth() {
    try {
        var raw = localStorage.getItem(TOKEN_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
export function setAuth(access, refresh) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access: access, refresh: refresh, ts: Date.now() }));
}
export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    // XAVFSIZLIK: barcha user-scoped cache'larni tozalaymiz
    // (chat tarixi, qoralamalar va h.k.)
    try {
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!key)
                continue;
            if (key.startsWith('fikra_chat_history') ||
                key.startsWith('fikra_draft_') ||
                key.startsWith('fikra_pending_') ||
                key.startsWith('fikra_test_state_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(function (k) { return localStorage.removeItem(k); });
    }
    catch (_a) { }
}
api.interceptors.request.use(function (config) {
    var auth = getStoredAuth();
    if (auth ? .access : )
        config.headers.Authorization = "Bearer " + auth.access;
    return config;
});
var _refreshing = false;
var _refreshCallbacks = [];
api.interceptors.response.use(function (res) { return res; }, function (err) { return __awaiter(_this, void 0, void 0, function () {
    var cfg, auth, r_1, _a, payload;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                cfg = err.config;
                auth = getStoredAuth();
                if (!(err.response ? .status === 401 && auth ? .refresh && !cfg.__retry :  : )) return [3 /*break*/, 5];
                cfg.__retry = true;
                // Agar allaqachon refresh bo'lmoqda bo'lsa — kutish
                if (_refreshing) {
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            _refreshCallbacks.push(function (token) {
                                cfg.headers.Authorization = "Bearer " + token;
                                resolve(api.request(cfg));
                            });
                        })];
                }
                _refreshing = true;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, axios.post(API_BASE + "/api/auth/refresh", { refreshToken: auth.refresh })];
            case 2:
                r_1 = _b.sent();
                if (r_1.data.accessToken) {
                    setAuth(r_1.data.accessToken, r_1.data.refreshToken || auth.refresh);
                    cfg.headers.Authorization = "Bearer " + r_1.data.accessToken;
                    // Kutgan so'rovlarni ham bajarish
                    _refreshCallbacks.forEach(function (cb) { return cb(r_1.data.accessToken); });
                    _refreshCallbacks = [];
                    return [2 /*return*/, api.request(cfg)];
                }
                return [3 /*break*/, 5];
            case 3:
                _a = _b.sent();
                // Token yangilash muvaffaqiyatsiz — faqat auth tozalash, reload EMAS
                clearAuth();
                _refreshCallbacks = [];
                // Ilovani saqlash: foydalanuvchini login sahifasiga yubormaymiz,
                // store.login() qayta chaqirilishi uchun event yuboramiz
                window.dispatchEvent(new CustomEvent('fikra:auth-expired'));
                return [3 /*break*/, 5];
            case 4:
                _refreshing = false;
                return [7 /*endfinally*/];
            case 5:
                // ─── 5xx server xatolarini backend log endpoint'ga yuborish ─────────
                // Auth xatolari (401/403) va 404'lar tashqarida qoldiriladi
                if (err.response && err.response.status >= 500) {
                    try {
                        payload = {
                            type: 'network',
                            message: err.message || 'Server xatosi',
                            url: err.config ? .url || 'unknown' : ,
                            method: err.config ? .method ? .toUpperCase() || 'GET' :  : ,
                            status: err.response.status,
                            timestamp: new Date().toISOString()
                        };
                        // sendBeacon — nimagadir crash bo'lsa ham yuboradi
                        if (navigator.sendBeacon) {
                            navigator.sendBeacon('/api/log/client-info', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
                        }
                    }
                    catch (_c) { }
                }
                return [2 /*return*/, Promise.reject(err)];
        }
    });
}); });
// ─── window.onerror va unhandledrejection — uncaught xatolar ───────────
// Bu xatolarni darrov backend log endpoint'ga yuborib, terminalda ko'rinadigan qilamiz
if (typeof window !== 'undefined') {
    window.addEventListener('error', function (event) {
        try {
            var payload = {
                type: 'window.onerror',
                message: event.message || 'Unknown error',
                stack: (event.error ? .stack || '' : ).slice(0, 800),
                url: window.location.href,
                userAgent: navigator.userAgent.slice(0, 150),
                timestamp: new Date().toISOString(),
                component: event.filename + ":" + event.lineno + ":" + event.colno
            };
            navigator.sendBeacon ? .('/api/log/client-error', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
                :
            ;
        }
        catch (_a) { }
    });
    window.addEventListener('unhandledrejection', function (event) {
        try {
            var reason = event.reason;
            var payload = {
                type: 'unhandledRejection',
                message: reason ? .message || String(reason) || 'Unknown rejection' : ,
                stack: (reason ? .stack || '' : ).slice(0, 800),
                url: window.location.href,
                userAgent: navigator.userAgent.slice(0, 150),
                timestamp: new Date().toISOString()
            };
            navigator.sendBeacon ? .('/api/log/client-error', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
                :
            ;
        }
        catch (_a) { }
    });
}
export default api;
