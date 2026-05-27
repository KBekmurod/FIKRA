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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function FolderAddPage() {
    var _this = this;
    var navigate = useNavigate();
    var subjectId = useParams().subjectId;
    var searchParams = useSearchParams()[0];
    var context = searchParams.get('context') || 'mutaxassislik';
    var goBack = useGoBack("/ombor/" + subjectId + "?context=" + context);
    var toast = useToast();
    var _a = useState(''), title = _a[0], setTitle = _a[1];
    var _b = useState(false), saving = _b[0], setSaving = _b[1];
    var subj = subjectId ? SUBJECTS[subjectId] : null;
    if (!subj) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Fan topilmadi</div>;
    }
    var standardCount = context === 'majburiy' ? 10 : 30;
    var submitFolder = function () { return __awaiter(_this, void 0, void 0, function () {
        var finalTitle, f, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    finalTitle = title.trim() || "Yangi papka \u2014 " + new Date().toLocaleDateString('uz-UZ');
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, api.post('/api/folders', {
                            subjectId: subjectId,
                            title: finalTitle,
                            context: context
                        })];
                case 2:
                    f = (_a.sent()).data;
                    toast.success('Papka yaratildi!');
                    // Papka ichiga kiramiz
                    navigate("/ombor/folder/" + f.folder._id);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1.response ? .data ? .error || 'Xatolik' :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>
          ⊕ Yangi Papka ({subj.name})
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{
        padding: 12,
        background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
        border: "1px solid " + (context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'),
        borderRadius: 10,
        fontSize: 11,
        color: 'var(--txt-2)',
        marginBottom: 20
    }}>
          <strong style={{ color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }}>
            {context === 'majburiy' ? 'Majburiy' : 'Mutaxassislik'}
          </strong>
          {' '}konteksti · AI <strong>{standardCount} ta test</strong> yaratadi
        </div>

        <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 8, display: 'block' }}>
          Mavzu yoki Papka nomi
        </label>
        <input value={title} onChange={function (e) { return setTitle(e.target.value); }} placeholder="Masalan: Kvadrat tenglamalar" maxLength={200} autoFocus style={{
        width: '100%',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        color: 'var(--txt)',
        borderRadius: 10,
        padding: '14px',
        fontSize: 14,
        marginBottom: 24
    }}/>

        <button onClick={submitFolder} disabled={saving} className="btn btn-primary btn-block btn-lg" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? '⏳ Yaratilmoqda...' : '📁 Papka yaratish'}
        </button>
      </div>
    </>);
}
