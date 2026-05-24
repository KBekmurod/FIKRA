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
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function MaterialEditPage() {
    var _this = this;
    var navigate = useNavigate();
    var id = useParams().id;
    var searchParams = useSearchParams()[0];
    var folderId = searchParams.get('folderId') || '';
    var goBack = useGoBack(folderId ? "/ombor/folder/" + folderId : '/ombor');
    var toast = useToast();
    var _a = useState(null), material = _a[0], setMaterial = _a[1];
    var _b = useState(''), title = _b[0], setTitle = _b[1];
    var _c = useState(''), content = _c[0], setContent = _c[1];
    var _d = useState(false), hasTest = _d[0], setHasTest = _d[1];
    var _e = useState(true), loading = _e[0], setLoading = _e[1];
    var _f = useState(false), saving = _f[0], setSaving = _f[1];
    var _g = useState(false), showAppendMode = _g[0], setShowAppendMode = _g[1];
    var _h = useState(''), appendText = _h[0], setAppendText = _h[1];
    useEffect(function () {
        if (!id)
            return;
        api.get("/api/materials/" + id)
            .then(function (_a) {
            var data = _a.data;
            var m = data.material || data;
            setMaterial(m);
            setTitle(m.title);
            setContent(m.content);
            setHasTest(!!m.hasGeneratedTest);
        })["catch"](function () { return toast.error("Material yuklanmadi"); })["finally"](function () { return setLoading(false); });
    }, [id]);
    var save = function () { return __awaiter(_this, void 0, void 0, function () {
        var e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!id)
                        return [2 /*return*/];
                    if (!title.trim()) {
                        toast.error("Sarlavha kerak");
                        return [2 /*return*/];
                    }
                    if (content.length < 500) {
                        toast.error("Matn kamida 500 belgi");
                        return [2 /*return*/];
                    }
                    if (content.length > 30000) {
                        toast.error("Matn maksimum 30,000 belgi");
                        return [2 /*return*/];
                    }
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, api.put("/api/materials/" + id, { title: title, content: content })];
                case 2:
                    _a.sent();
                    toast.success("Material yangilandi!");
                    navigate(folderId ? "/ombor/folder/" + folderId : '/ombor');
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1.response ? .data ? .error || "Saqlashda xato" :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var appendAndSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var newContent, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!appendText.trim()) {
                        toast.error("Qo'shimcha matn kerak");
                        return [2 /*return*/];
                    }
                    newContent = content + '\n\n' + appendText.trim();
                    if (newContent.length > 30000) {
                        toast.error("Birga qo'shganda 30,000 belgidan oshib ketadi (jami " + newContent.length + ")");
                        return [2 /*return*/];
                    }
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, api.put("/api/materials/" + id, { title: title, content: newContent })];
                case 2:
                    _a.sent();
                    toast.success("Qo'shildi va saqlandi!");
                    navigate(folderId ? "/ombor/folder/" + folderId : '/ombor');
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    toast.error(e_2.response ? .data ? .error || "Saqlashda xato" :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin" style={{ margin: '0 auto' }}/></div>;
    }
    if (!material) {
        return (<div style={{ padding: 40, textAlign: 'center' }}>
        <p>Material topilmadi</p>
        <button onClick={goBack} className="btn btn-primary" style={{ marginTop: 16 }}>Qaytish</button>
      </div>);
    }
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>
          ✏️ Material tahriri
        </div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        
        {hasTest && (<div style={{
        padding: 12,
        background: 'rgba(255,204,68,0.08)',
        border: '1px solid rgba(255,204,68,0.25)',
        borderRadius: 10,
        fontSize: 11,
        color: 'var(--txt-2)',
        lineHeight: 1.5,
        marginBottom: 14
    }}>
            ⚠️ <strong style={{ color: 'var(--y)' }}>Diqqat:</strong> Bu papkadan
            test allaqachon yaratilgan. Materialni tahrirlash test'ga ta'sir
            qilmaydi — test eski versiyaga asoslangan qoladi.
          </div>)}

        
        <div className="seg-tabs">
          <button className={"seg-tab " + (!showAppendMode ? 'active' : '')} onClick={function () { return setShowAppendMode(false); }}>✏️ Tahrir</button>
          <button className={"seg-tab " + (showAppendMode ? 'active' : '')} onClick={function () { return setShowAppendMode(true); }}>➕ Qo'shimcha qo'shish</button>
        </div>

        {!showAppendMode ? (
    // ─── TAHRIRLASH REJIMI ──────────────────────────────────────────
    <>
            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Sarlavha
            </label>
            <input value={title} onChange={function (e) { return setTitle(e.target.value); }} maxLength={200} style={{
        width: '100%',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        color: 'var(--txt)',
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 13,
        marginBottom: 12
    }}/>

            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Matn ({content.length.toLocaleString()} / 30,000)
            </label>
            <textarea value={content} onChange={function (e) { return setContent(e.target.value); }} rows={14} maxLength={30000} style={{
        width: '100%',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        color: 'var(--txt)',
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        lineHeight: 1.5,
        fontFamily: 'inherit',
        resize: 'vertical'
    }}/>

            <button onClick={save} disabled={saving} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 14 }}>
              {saving ? '⏳ Saqlanmoqda...' : '💾 Saqlash'}
            </button>
          </>) : (
    // ─── QO'SHIMCHA QO'SHISH REJIMI ─────────────────────────────────
    <>
            <div style={{
        padding: 10,
        background: 'rgba(0,212,170,0.06)',
        border: '1px solid rgba(0,212,170,0.2)',
        borderRadius: 10,
        fontSize: 11,
        color: 'var(--txt-2)',
        marginBottom: 12,
        lineHeight: 1.5
    }}>
              💡 Mavjud matnga qo'shimcha qo'shing — mavjud matn{' '}
              <strong>o'chmaydi</strong>, faqat ostiga qo'shiladi.
              <br />
              Joriy hajm: <strong>{content.length.toLocaleString()}</strong> belgi
            </div>

            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Yangi qo'shimcha matn
            </label>
            <textarea value={appendText} onChange={function (e) { return setAppendText(e.target.value); }} placeholder="Bu yerga yangi material qo'shing..." rows={12} maxLength={30000 - content.length} style={{
        width: '100%',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        color: 'var(--txt)',
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        lineHeight: 1.5,
        fontFamily: 'inherit',
        resize: 'vertical'
    }}/>
            <div style={{
        fontSize: 10, color: 'var(--txt-3)',
        marginTop: 4, textAlign: 'right'
    }}>
              {appendText.length.toLocaleString()} qo'shimcha · Jami{' '}
              {(content.length + appendText.length).toLocaleString()} / 30,000
            </div>

            <button onClick={appendAndSave} disabled={saving || !appendText.trim()} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 14, opacity: (saving || !appendText.trim()) ? 0.5 : 1 }}>
              {saving ? '⏳ Saqlanmoqda...' : "➕ Qo'shish va saqlash"}
            </button>
          </>)}

        <div style={{ height: 30 }}/>
      </div>
    </>);
}
