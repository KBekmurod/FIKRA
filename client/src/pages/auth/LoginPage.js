var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useToast } from '../../components/Toast';
// Identifier turini aniqlash (UI uchun)
function detectIdentifierType(s) {
    var t = s.trim();
    if (!t)
        return 'unknown';
    if (t.includes('@'))
        return 'email';
    if (/^[+\d\s()-]+$/.test(t))
        return 'phone';
    return 'unknown';
}
export default function LoginPage() {
    var _this = this;
    var navigate = useNavigate();
    var toast = useToast();
    var login = useAppStore().login;
    var _a = useState(''), identifier = _a[0], setIdentifier = _a[1];
    var _b = useState(''), password = _b[0], setPassword = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(false), showPwd = _d[0], setShowPwd = _d[1];
    var idType = detectIdentifierType(identifier);
    var submit = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!identifier.trim() || !password) {
                        toast.error("Email/telefon va parol kerak");
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, login(identifier.trim(), password)];
                case 2:
                    _a.sent();
                    navigate('/', { replace: true });
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1 ? .response ? .data ? .error || "Kirish xato" :  :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<div style={{ minHeight: '100vh', padding: '24px 24px', display: 'flex', flexDirection: 'column' }}>
      <button onClick={function () { return navigate('/auth/welcome'); }} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 12,
        alignSelf: 'flex-start'
    }}>←</button>

      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 32, fontWeight: 800, margin: 0
    }}>Kirish</h1>
      <p style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 6 }}>
        Akkountingizga kiring
      </p>

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700 }}>
            EMAIL YOKI TELEFON NOMER
          </label>
          <div style={{ position: 'relative' }}>
            <input type="text" value={identifier} onChange={function (e) { return setIdentifier(e.target.value); }} placeholder="email@example.com  yoki  +998 90 123 45 67" autoComplete="username" disabled={loading} style={inputStyle} onKeyDown={function (e) { return e.key === 'Enter' && submit(); }} inputMode={idType === 'phone' ? 'tel' : 'email'}/>
            {identifier && (<div style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, color: 'var(--txt-3)', pointerEvents: 'none'
    }}>
                {idType === 'email' ? '📧' : idType === 'phone' ? '📱' : ''}
              </div>)}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700 }}>
            PAROL
          </label>
          <div style={{ position: 'relative' }}>
            <input type={showPwd ? "text" : "password"} value={password} onChange={function (e) { return setPassword(e.target.value); }} placeholder="••••••••" autoComplete="current-password" disabled={loading} style={__assign({}, inputStyle, { paddingRight: 44 })} onKeyDown={function (e) { return e.key === 'Enter' && submit(); }}/>
            <button type="button" onClick={function () { return setShowPwd(function (p) { return !p; }); }} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', color: 'var(--txt-3)',
        cursor: 'pointer', fontSize: 14, padding: 4
    }}>{showPwd ? '🙈' : '👁'}</button>
          </div>
        </div>
      </div>

      <button onClick={submit} disabled={loading} style={{
        marginTop: 20,
        background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
        color: 'white',
        border: 'none',
        borderRadius: 14,
        padding: '15px 18px',
        fontSize: 14,
        fontWeight: 800,
        cursor: loading ? 'wait' : 'pointer',
        opacity: loading ? 0.6 : 1
    }}>{loading ? '⏳ Kirilmoqda...' : 'Kirish →'}</button>

      
      <button onClick={function () {
        var adminUser = window.ADMIN_USERNAME || '';
        if (adminUser) {
            var url = "https://t.me/" + adminUser + "?text=" + encodeURIComponent('Salom! Men FIKRA akkountimga kira olmayman, parolni unutdim. Yordam bering iltimos.');
            window.open(url, '_blank');
        }
        else {
            toast.info("Adminga murojaat qiling");
        }
    }} style={{
        marginTop: 12,
        background: 'none',
        border: 'none',
        color: 'var(--txt-3)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        padding: 8,
        textAlign: 'center'
    }}>Parolni unutdingizmi? Adminga murojaat</button>

      <div style={{ flex: 1 }}/>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', marginTop: 16 }}>
        Hali akkountingiz yo'qmi?{' '}
        <button onClick={function () { return navigate('/auth/register'); }} style={{
        background: 'none', border: 'none', color: 'var(--acc-l)',
        fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12
    }}>Ro'yxatdan o'tish</button>
      </div>
    </div>);
}
var inputStyle = {
    width: '100%',
    background: 'var(--s1)',
    border: '1px solid var(--f)',
    color: 'var(--txt)',
    borderRadius: 12,
    padding: '13px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none'
};
