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
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function MaterialAddPage() {
    var _this = this;
    var navigate = useNavigate();
    var folderId = useParams().folderId;
    var goBack = useGoBack("/ombor/folder/" + folderId);
    var toast = useToast();
    var _a = useState(null), folder = _a[0], setFolder = _a[1];
    var _b = useState(true), loadingFolder = _b[0], setLoadingFolder = _b[1];
    useEffect(function () {
        if (!folderId)
            return;
        api.get("/api/folders/" + folderId)
            .then(function (res) { return setFolder(res.data.folder); })["catch"](function () { return toast.error('Papka topilmadi'); })["finally"](function () { return setLoadingFolder(false); });
    }, [folderId]);
    var _c = useState('text'), tab = _c[0], setTab = _c[1];
    var _d = useState(''), title = _d[0], setTitle = _d[1];
    var _e = useState(''), content = _e[0], setContent = _e[1];
    var _f = useState(false), saving = _f[0], setSaving = _f[1];
    var subj = folder ? .subjectId ? SUBJECTS[folder.subjectId] : null
        :
    ;
    var context = folder ? .context || 'mutaxassislik'
        :
    ;
    if (loadingFolder)
        return <div style={{ padding: 40, textAlign: 'center' }}>Yuklanmoqda...</div>;
    if (!folder || !subj)
        return <div style={{ padding: 40, textAlign: 'center' }}>Papka yoki fan topilmadi</div>;
    var standardCount = context === 'majburiy' ? 10 : 30;
    // ─── Avtomatik sarlavha generatsiyasi ──────────────────────────────────
    // Sarlavha bo'sh bo'lsa matnning birinchi qatoridan yaratiladi.
    var autoTitle = function (text) {
        var trimmed = text.trim();
        if (!trimmed)
            return "Material \u2014 " + new Date().toLocaleDateString('uz-UZ');
        // Birinchi qatorni olamiz
        var firstLine = trimmed.split('\n')[0].trim();
        if (firstLine.length === 0) {
            return "Material \u2014 " + new Date().toLocaleDateString('uz-UZ');
        }
        // Agar juda uzun bo'lsa, 60 belgida kesib qo'shamiz
        if (firstLine.length > 70) {
            // So'zlarda silliq kesish
            var words = firstLine.split(/\s+/);
            var result = '';
            for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
                var w = words_1[_i];
                if ((result + ' ' + w).trim().length > 60)
                    break;
                result = (result + ' ' + w).trim();
            }
            return (result || firstLine.slice(0, 60)) + '...';
        }
        return firstLine;
    };
    var submitText = function () { return __awaiter(_this, void 0, void 0, function () {
        var finalTitle, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (content.length < 500) {
                        toast.error("Matn juda kichik (kamida 500 belgi)");
                        return [2 /*return*/];
                    }
                    if (content.length > 30000) {
                        toast.error("Matn juda katta (maksimum 30,000 belgi)");
                        return [2 /*return*/];
                    }
                    finalTitle = title.trim() || autoTitle(content);
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, api.post('/api/materials/text', {
                            folderId: folderId, subjectId: folder.subjectId, title: finalTitle, content: content
                        })];
                case 2:
                    _a.sent();
                    toast.success('Material qo\'shildi!');
                    navigate("/ombor/folder/" + folderId + "?fresh=1", { replace: true });
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
    var submitOcr = function (file) { return __awaiter(_this, void 0, void 0, function () {
        var fd, drft, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    fd = new FormData();
                    fd.append('image', file);
                    return [4 /*yield*/, api.post('/api/materials/ocr/extract', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        })
                        // Foydalanuvchi tahrirlash imkoniyatiga ega bo'lsin — kontent state'ga qo'yamiz
                    ];
                case 2:
                    drft = (_a.sent()).data;
                    // Foydalanuvchi tahrirlash imkoniyatiga ega bo'lsin — kontent state'ga qo'yamiz
                    setContent(drft.text);
                    setTab('text');
                    toast.success('Matn ajratildi. Tekshiring va sarlavha bering!');
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    toast.error(e_2.response ? .data ? .error || 'OCR xatolik' :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var submitFile = function (file) { return __awaiter(_this, void 0, void 0, function () {
        var fd, drft, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    fd = new FormData();
                    fd.append('file', file);
                    return [4 /*yield*/, api.post('/api/materials/file/parse', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            timeout: 60000
                        })];
                case 2:
                    drft = (_a.sent()).data;
                    setContent(drft.text);
                    setTab('text');
                    toast.success("Fayl tahlil qilindi! " + drft.charCount + " belgi. Tekshiring va sarlavha bering.");
                    return [3 /*break*/, 5];
                case 3:
                    e_3 = _a.sent();
                    toast.error(e_3.response ? .data ? .error || 'Fayl xatolik' :  : );
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
          ⊕ Material ({subj.name})
        </div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <div style={{
        padding: 12,
        background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
        border: "1px solid " + (context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'),
        borderRadius: 10,
        fontSize: 11,
        color: 'var(--txt-2)',
        marginBottom: 14
    }}>
          <strong style={{ color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }}>
            {context === 'majburiy' ? 'Majburiy' : 'Mutaxassislik'}
          </strong>
          {' '}konteksti · AI <strong>{standardCount} ta test</strong> yaratadi
        </div>

        <div className="seg-tabs">
          <button className={"seg-tab " + (tab === 'text' ? 'active' : '')} onClick={function () { return setTab('text'); }}>📝 Matn</button>
          <button className={"seg-tab " + (tab === 'ocr' ? 'active' : '')} onClick={function () { return setTab('ocr'); }}>📷 Rasm</button>
          <button className={"seg-tab " + (tab === 'file' ? 'active' : '')} onClick={function () { return setTab('file'); }}>📁 Fayl</button>
        </div>

        {tab === 'text' && (<div>
            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Sarlavha <span style={{ color: 'var(--txt-3)', fontSize: 10, fontWeight: 400 }}>(ixtiyoriy)</span>
            </label>
            <input value={title} onChange={function (e) { return setTitle(e.target.value); }} placeholder="Bo'sh qoldirsangiz, matndan avtomatik yaratiladi" maxLength={200} style={{
        width: '100%',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        color: 'var(--txt)',
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 13,
        marginBottom: 4
    }}/>
            {!title.trim() && content.length >= 50 && (<div style={{ fontSize: 10, color: 'var(--txt-3)', marginBottom: 12, fontStyle: 'italic' }}>
                📝 Avtomatik: "{autoTitle(content)}"
              </div>)}
            {(title.trim() || content.length < 50) && <div style={{ height: 8 }}/>}

            <label style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 4, display: 'block' }}>
              Matn (500–30,000 belgi)
            </label>
            <textarea value={content} onChange={function (e) { return setContent(e.target.value); }} placeholder="Matningizni shu yerga joylang..." rows={12} maxLength={30000} style={{
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
        fontSize: 10, color: content.length > 30000 ? 'var(--r)' : 'var(--txt-3)',
        marginTop: 4, textAlign: 'right'
    }}>
              {content.length.toLocaleString()} / 30,000
            </div>

            <button onClick={submitText} disabled={saving || content.length < 500} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 14, opacity: (saving || content.length < 500) ? 0.5 : 1 }}>
              {saving ? '⏳ Saqlanmoqda...' : '💾 Materialni papkaga qo\'shish'}
            </button>
          </div>)}

        {tab === 'ocr' && (<div>
            <div style={{
        padding: 14,
        background: 'var(--s1)',
        border: '1px dashed var(--f)',
        borderRadius: 12,
        textAlign: 'center'
    }}>
              <div style={{ fontSize: 32 }}>📷</div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8, marginBottom: 12 }}>
                Rasm yuklang — AI matnni o'qib chiqaradi (JPG, PNG, maks 3 MB)
              </div>
              <label style={{
        display: 'inline-block',
        background: 'var(--acc)', color: 'white',
        padding: '10px 18px', borderRadius: 10,
        fontSize: 12, fontWeight: 700, cursor: 'pointer'
    }}>
                Rasm tanlash
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={function (e) { var f = e.target.files ? .[0] : ; if (f)
        submitOcr(f); }} disabled={saving}/>
              </label>
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 10, textAlign: 'center' }}>
              ⚠️ OCR 100% aniq emas — natijani tahrirlash uchun "Matn" tabga o'tasiz
            </div>
          </div>)}

        {tab === 'file' && (<div>
            <div style={{
        padding: 14,
        background: 'var(--s1)',
        border: '1px dashed var(--f)',
        borderRadius: 12,
        textAlign: 'center'
    }}>
              <div style={{ fontSize: 32 }}>📁</div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8, marginBottom: 12 }}>
                PDF, DOCX, PPTX — matn ajratiladi (maks 7 MB, 20 sahifa)
              </div>
              <label style={{
        display: 'inline-block',
        background: 'var(--acc)', color: 'white',
        padding: '10px 18px', borderRadius: 10,
        fontSize: 12, fontWeight: 700, cursor: 'pointer'
    }}>
                Fayl tanlash
                <input type="file" accept=".pdf,.docx,.pptx" style={{ display: 'none' }} onChange={function (e) { var f = e.target.files ? .[0] : ; if (f)
        submitFile(f); }} disabled={saving}/>
              </label>
            </div>
          </div>)}

        <div style={{ height: 24 }}/>
      </div>
    </>);
}
