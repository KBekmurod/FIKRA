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
export default function RegisterPage() {
    var _this = this;
    var navigate = useNavigate();
    var toast = useToast();
    var register = useAppStore().register;
    var _a = useState(''), name = _a[0], setName = _a[1];
    var _b = useState('email'), mode = _b[0], setMode = _b[1];
    var _c = useState(''), email = _c[0], setEmail = _c[1];
    var _d = useState(''), phone = _d[0], setPhone = _d[1];
    var _e = useState(''), password = _e[0], setPassword = _e[1];
    var _f = useState(''), confirmPwd = _f[0], setConfirmPwd = _f[1];
    var _g = useState(false), loading = _g[0], setLoading = _g[1];
    var _h = useState(false), showPwd = _h[0], setShowPwd = _h[1];
    var submit = function () { return __awaiter(_this, void 0, void 0, function () {
        var identifier, digitsOnly, uzbRegex, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!name.trim() || name.trim().length < 2) {
                        toast.error("Ism kerak (kamida 2 belgi)");
                        return [2 /*return*/];
                    }
                    identifier = '';
                    if (mode === 'email') {
                        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                            toast.error("Email yaroqsiz");
                            return [2 /*return*/];
                        }
                        identifier = email.trim();
                    }
                    else {
                        digitsOnly = phone.replace(/\D/g, '');
                        uzbRegex = /^998(33|50|55|77|88|90|91|93|94|95|97|98|99)\d{7}$/;
                        if (!uzbRegex.test(digitsOnly)) {
                            toast.error("Faqat O'zbekiston mobil raqamlari qabul qilinadi (+998...)");
                            return [2 /*return*/];
                        }
                        identifier = '+' + digitsOnly;
                    }
                    if (!password || password.length < 8) {
                        toast.error("Parol kamida 8 belgi bo'lsin");
                        return [2 /*return*/];
                    }
                    if (password !== confirmPwd) {
                        toast.error("Parollar mos kelmadi");
                        return [2 /*return*/];
                    }
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, register(identifier, password, name.trim())];
                case 2:
                    _a.sent();
                    toast.success("Ro'yxatdan o'tildi!");
                    navigate('/', { replace: true });
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1 ? .response ? .data ? .error || "Ro'yxatdan o'tishda xato" :  :  : );
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
    }}>Ro'yxatdan o'tish</h1>
      <p style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 6 }}>
        Yangi akkount yarating
      </p>

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <div>
          <label style={fieldLabel}>ISM</label>
          <input value={name} onChange={function (e) { return setName(e.target.value); }} placeholder="Ismingiz" autoComplete="name" disabled={loading} style={inputStyle}/>
        </div>

        
        <div>
          <label style={fieldLabel}>QAYSI USULDA RO'YXATDAN O'TASIZ?</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={function () { return setMode('email'); }} style={tabBtnStyle(mode === 'email')}>📧 Email</button>
            <button type="button" onClick={function () { return setMode('phone'); }} style={tabBtnStyle(mode === 'phone')}>📱 Telefon nomer</button>
          </div>
        </div>

        {mode === 'email' ? (<div>
            <label style={fieldLabel}>EMAIL</label>
            <input type="email" value={email} onChange={function (e) { return setEmail(e.target.value); }} placeholder="email@example.com" autoComplete="email" inputMode="email" disabled={loading} style={inputStyle}/>
          </div>) : (<div>
            <label style={fieldLabel}>TELEFON NOMER</label>
            <input type="tel" value={phone} onChange={function (e) {
        var val = e.target.value.replace(/\D/g, '');
        if (val.startsWith('998'))
            val = val.substring(3);
        var formatted = '+998 ';
        if (val.length > 0)
            formatted += val.substring(0, 2);
        if (val.length > 2)
            formatted += ' ' + val.substring(2, 5);
        if (val.length > 5)
            formatted += ' ' + val.substring(5, 7);
        if (val.length > 7)
            formatted += ' ' + val.substring(7, 9);
        if (e.target.value === '' || e.target.value === '+998' || e.target.value === '+998 ') {
            setPhone('');
        }
        else {
            setPhone(formatted.trim());
        }
    }} placeholder="+998 90 123 45 67" autoComplete="tel" inputMode="tel" disabled={loading} style={inputStyle}/>
            <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 4 }}>
              Faqat O'zbekiston raqamlari (Masalan: +998 90 123 45 67)
            </div>
          </div>)}

        <div>
          <label style={fieldLabel}>PAROL (kamida 8 belgi)</label>
          <div style={{ position: 'relative' }}>
            <input type={showPwd ? "text" : "password"} value={password} onChange={function (e) { return setPassword(e.target.value); }} placeholder="••••••••" autoComplete="new-password" disabled={loading} style={__assign({}, inputStyle, { paddingRight: 44 })}/>
            <button type="button" onClick={function () { return setShowPwd(function (p) { return !p; }); }} style={{
        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', color: 'var(--txt-3)',
        cursor: 'pointer', fontSize: 14, padding: 4
    }}>{showPwd ? '🙈' : '👁'}</button>
          </div>
        </div>

        <div>
          <label style={fieldLabel}>PAROL TASDIQI</label>
          <input type={showPwd ? "text" : "password"} value={confirmPwd} onChange={function (e) { return setConfirmPwd(e.target.value); }} placeholder="••••••••" autoComplete="new-password" disabled={loading} style={inputStyle} onKeyDown={function (e) { return e.key === 'Enter' && submit(); }}/>
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
    }}>{loading ? "⏳ Yaratilmoqda..." : "Akkount yaratish →"}</button>

      <div style={{ flex: 1 }}/>

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', marginTop: 16 }}>
        Akkountingiz bormi?{' '}
        <button onClick={function () { return navigate('/auth/login'); }} style={{
        background: 'none', border: 'none', color: 'var(--acc-l)',
        fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12
    }}>Kirish</button>
      </div>
    </div>);
}
var fieldLabel = {
    fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700
};
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
function tabBtnStyle(active) {
    return {
        flex: 1,
        padding: '10px 8px',
        background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
        border: "1px solid " + (active ? 'var(--acc)' : 'var(--f)'),
        color: active ? 'var(--acc-l)' : 'var(--txt-2)',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer'
    };
}
