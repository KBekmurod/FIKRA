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
import { create } from 'zustand';
{
    User;
}
from;
'../types';
import { authApi } from '../api/endpoints';
import { setAuth, clearAuth, getStoredAuth } from '../api/client';
export var useAppStore = create(function (set, get) { return ({
    user: null,
    loading: true,
    initialized: false,
    error: null,
    authModalOpen: false,
    setAuthModalOpen: function (open) { return set({ authModalOpen: open }); },
    // ─── Bootstrap: dastur ochilganda mavjud sessiyani tekshirish ─────────
    bootstrap: function () { return __awaiter(_this, void 0, void 0, function () {
        var stored, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    set({ loading: true, error: null });
                    stored = getStoredAuth();
                    if (!stored) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, authApi.me()];
                case 2:
                    data = (_b.sent()).data;
                    set({ user: data, loading: false, initialized: true });
                    return [2 /*return*/];
                case 3:
                    _a = _b.sent();
                    clearAuth();
                    return [3 /*break*/, 4];
                case 4:
                    set({ user: null, loading: false, initialized: true });
                    return [2 /*return*/];
            }
        });
    }); },
    // ─── Google orqali kirish/ro'yxatdan o'tish ───────────────────────────
    googleLogin: function (token) { return __awaiter(_this, void 0, void 0, function () {
        var data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    set({ loading: true, error: null });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, authApi.googleLogin(token)];
                case 2:
                    data = (_a.sent()).data;
                    setAuth(data.accessToken, data.refreshToken);
                    set({ user: data.user, loading: false, initialized: true });
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    set({ loading: false });
                    throw err_1;
                case 4: return [2 /*return*/];
            }
        });
    }); },
    refreshUser: function () { return __awaiter(_this, void 0, void 0, function () {
        var data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!getStoredAuth())
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, authApi.me()];
                case 2:
                    data = (_b.sent()).data;
                    set({ user: data });
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); },
    logout: function () {
        clearAuth();
        set({ user: null });
    }
}); });
export var usePwaStore = create(function (set, get) { return ({
    canInstall: false,
    isInstalled: false,
    deferredPrompt: null,
    initPwa: function () {
        var standalone = window.matchMedia ? .('(display-mode: standalone)').matches ||
            window.navigator.standalone === true
            :
        ;
        if (standalone) {
            set({ isInstalled: true });
            return;
        }
        var handler = function (e) {
            e.preventDefault();
            set({ deferredPrompt: e, canInstall: true });
        };
        window.addEventListener('beforeinstallprompt', handler);
        var onInstalled = function () { return set({ isInstalled: true, canInstall: false }); };
        window.addEventListener('appinstalled', onInstalled);
        // Optional cleanup is generally not needed for singleton store, but good practice
        // We just attach once.
    },
    installPwa: function () { return __awaiter(_this, void 0, void 0, function () {
        var deferredPrompt, outcome;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    deferredPrompt = get().deferredPrompt;
                    if (!deferredPrompt)
                        return [2 /*return*/];
                    deferredPrompt.prompt();
                    return [4 /*yield*/, deferredPrompt.userChoice];
                case 1:
                    outcome = (_a.sent()).outcome;
                    if (outcome === 'accepted') {
                        set({ canInstall: false });
                    }
                    set({ deferredPrompt: null });
                    return [2 /*return*/];
            }
        });
    }); }
}); });
export var useAiStore = create(function (set) { return ({
    chatSessionId: null,
    chatMessages: [],
    chatInput: '',
    chatSending: false,
    setChatState: function (state) { return set(state); },
    docPrompt: '',
    docFormat: 'DOCX',
    docMaxPages: 2,
    docRemoveWatermark: false,
    docLoading: false,
    docStatusMsg: '',
    docResult: null,
    setDocState: function (state) { return set(state); }
}); });
