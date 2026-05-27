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
import { GoogleLogin } from '@react-oauth/google';
export default function WelcomePage() {
    var _this = this;
    var navigate = useNavigate();
    var toast = useToast();
    var googleLogin = useAppStore().googleLogin;
    var _a = useState(false), loading = _a[0], setLoading = _a[1];
    return (<div style={{ minHeight: '100vh', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 56,
        fontWeight: 800,
        margin: 0,
        background: 'linear-gradient(135deg, #fff, var(--acc-l))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1
    }}>FIKRA<span style={{ color: 'var(--acc)' }}>.</span></h1>

        <div style={{
        display: 'inline-block',
        padding: '5px 14px',
        background: 'rgba(123,104,238,0.15)',
        border: '1px solid rgba(123,104,238,0.3)',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--acc-l)',
        marginTop: 14,
        letterSpacing: 0.5
    }}>DTM TAYYORLIK PLATFORMASI</div>

        <p style={{
        fontSize: 14,
        color: 'var(--txt-2)',
        marginTop: 16,
        lineHeight: 1.55,
        maxWidth: 320,
        margin: '16px auto 0'
    }}>
          AI yordamida shaxsiy testlar yarating va DTM'ga
          <strong style={{ color: 'var(--txt)' }}> ishonchli tayyorgarlik </strong>
          ko'ring
        </p>
      </div>

      
      <div style={{ marginTop: 28, display: 'grid', gap: 8 }}>
        <FeatureItem icon="🏛" text="Konspekt, PDF, rasm — har biridan AI test"/>
        <FeatureItem icon="🎓" text="DTM standart bloklarini ishlash"/>
        <FeatureItem icon="🎯" text="Xatolaringizni AI tushuntiradi"/>
        <FeatureItem icon="📊" text="Delta → Beta → Alfa darajalar"/>
      </div>

      
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {loading ? (<div style={{ textAlign: 'center', padding: 20, color: 'var(--txt-2)', fontSize: 14 }}>
            ⏳ Kirilmoqda...
          </div>) : (<GoogleLogin onSuccess={function (credentialResponse) { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!credentialResponse.credential) return [3 /*break*/, 5];
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, googleLogin(credentialResponse.credential)];
                case 2:
                    _a.sent();
                    navigate('/', { replace: true });
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1 ? .response ? .data ? .error || "Google autentifikatsiyasida xatolik" :  :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }} onError={function () { return toast.error('Google bilan ulanishda xatolik'); }} theme="filled_black" shape="pill" text="continue_with" size="large"/>)}
      </div>

      <div style={{
        marginTop: 14, marginBottom: 8,
        fontSize: 10, color: 'var(--txt-3)', textAlign: 'center',
        lineHeight: 1.5
    }}>
        Davom etish orqali siz <strong>Foydalanish shartlari</strong>{' '}
        va <strong>Maxfiylik</strong> bilan rozisiz
      </div>
    </div>);
}
function FeatureItem(_a) {
    var icon = _a.icon, text = _a.text;
    return (<div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.4 }}>{text}</span>
    </div>);
}
