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
export default function LoginPage() {
    var _this = this;
    var navigate = useNavigate();
    var toast = useToast();
    var googleLogin = useAppStore().googleLogin;
    var _a = useState(false), loading = _a[0], setLoading = _a[1];
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
      <p style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 6, marginBottom: 40 }}>
        Akkountingizga Google orqali kiring
      </p>

      {loading ? (<div style={{ textAlign: 'center', padding: 20, color: 'var(--txt-2)' }}>
          ⏳ Kirilmoqda...
        </div>) : (<div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin onSuccess={function (credentialResponse) { return __awaiter(_this, void 0, void 0, function () {
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
                    toast.error(e_1 ? .response ? .data ? .error || "Google bilan kirishda xato" :  :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }} onError={function () { return toast.error('Google bilan ulanishda xatolik'); }} theme="filled_black" shape="pill" text="continue_with" size="large" width="100%"/>
        </div>)}

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
