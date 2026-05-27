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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { folderApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import { useJobStore } from '../store/jobStore';
import { SUBJECTS } from '../constants/subjects';
// Frontend yo'nalishlar — backend bilan moslashtirilgan
var DIRECTIONS = [
    { id: 'engineering', name: 'Muhandislik · Texnologiya', icon: '⚙️', spec: ['math', 'fizika'] },
    { id: 'medicine', name: "Tibbiyot · Q-xo'jaligi", icon: '🏥', spec: ['bio', 'kimyo'] },
    { id: 'international', name: 'Xalqaro · Turizm', icon: '🌍', spec: ['tarix', 'ingliz'] },
    { id: 'philology', name: 'Filologiya', icon: '📖', spec: ['adab', 'ingliz'] },
    { id: 'economy', name: 'Iqtisod · IT', icon: '💰', spec: ['math', 'ingliz'] },
    { id: 'geodesy', name: 'Geodeziya · Kadastr', icon: '🗺', spec: ['tarix', 'geo'] },
    { id: 'law', name: "Huquq · Davlat boshqaruvi", icon: '⚖', spec: ['huquq', 'tarix'] },
    { id: 'german_studies', name: 'Nemis tili va madaniyati', icon: '🇩🇪', spec: ['nemis', 'adab'] },
    { id: 'french_studies', name: 'Fransuz tili va madaniyati', icon: '🇫🇷', spec: ['fransuz', 'adab'] },
    { id: 'arabic_studies', name: 'Arab tili va sharqshunoslik', icon: '🕌', spec: ['arab', 'tarix'] },
];
var COMPULSORY = ['majburiy_onatili', 'majburiy_math', 'majburiy_tarix'];
export default function AiBlokSetupPage() {
    var _this = this;
    var navigate = useNavigate();
    var goBack = useGoBack('/testlar/ai');
    var toast = useToast();
    var _a = useState(null), selectedDir = _a[0], setSelectedDir = _a[1];
    var _b = useState({}), folders = _b[0], setFolders = _b[1];
    var _c = useState({}), selectedFolders = _c[0], setSelectedFolders = _c[1];
    var _d = useState(false), loading = _d[0], setLoading = _d[1];
    var _e = useState(false), starting = _e[0], setStarting = _e[1];
    var dir = DIRECTIONS.find(function (d) { return d.id === selectedDir; });
    var allSubjects = dir ? COMPULSORY.concat(dir.spec) : [];
    // Yo'nalish tanlanganda har fan uchun papkalarni yuklash
    useEffect(function () {
        if (!dir)
            return;
        setLoading(true);
        var subjectsToLoad = COMPULSORY.concat(dir.spec);
        Promise.all(subjectsToLoad.map(function (sid) { return __awaiter(_this, void 0, void 0, function () {
            var context, finalContext, data, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        context = COMPULSORY.includes(sid) ? 'majburiy' : 'mutaxassislik';
                        finalContext = context;
                        return [4 /*yield*/, folderApi.bySubject(sid, finalContext)];
                    case 1:
                        data = (_b.sent()).data;
                        return [2 /*return*/, [sid, data.folders]];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, [sid, []]];
                    case 3: return [2 /*return*/];
                }
            });
        }); })).then(function (results) {
            var map = {};
            results.forEach(function (_a) {
                var sid = _a[0], list = _a[1];
                map[sid] = list;
            });
            setFolders(map);
            setLoading(false);
        });
    }, [selectedDir]);
    var toggleFolder = function (subjectId, folderId) {
        setSelectedFolders(function (prev) {
            var _a;
            var curr = prev[subjectId] || [];
            var next = curr.includes(folderId)
                ? curr.filter(function (id) { return id !== folderId; })
                : curr.concat([folderId]);
            return __assign({}, prev, (_a = {}, _a[subjectId] = next, _a));
        });
    };
    var startJob = useJobStore().startJob;
    var allReady = dir && allSubjects.every(function (sid) {
        return (selectedFolders[sid] || []).length > 0;
    });
    var startTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var subjectsPayload, data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!dir || !allReady) {
                        toast.error("Barcha fanlar uchun papka tanlash kerak");
                        return [2 /*return*/];
                    }
                    subjectsPayload = {};
                    allSubjects.forEach(function (sid) {
                        subjectsPayload[sid] = { folderIds: selectedFolders[sid] || [] };
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    toast.info("Jarayon yuborilmoqda...");
                    return [4 /*yield*/, api.post('/api/personal-tests/ai-blok', {
                            direction: dir.id,
                            subjects: subjectsPayload
                        })];
                case 2:
                    data = (_a.sent()).data;
                    if (data.testId) {
                        startJob(data.testId, 'test_generation', 'AI Blok Test');
                        navigate('/testlar/ai', { replace: true });
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1 ? .response ? .data ? .error || "Xatolik yuz berdi" :  :  : );
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>📦 AI maxsus blok</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
          1. YO'NALISH TANLANG
        </div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
          {DIRECTIONS.map(function (d) { return (<button key={d.id} onClick={function () { setSelectedDir(d.id); setSelectedFolders({}); }} style={{
        background: selectedDir === d.id ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
        border: "1.5px solid " + (selectedDir === d.id ? 'var(--acc)' : 'var(--f)'),
        borderRadius: 12, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        cursor: 'pointer', color: 'var(--txt)', textAlign: 'left'
    }}>
              <span style={{ fontSize: 20 }}>{d.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 1 }}>
                  Spec: {d.spec.map(function (s) { return SUBJECTS[s] ? .name : ; }).join(' + ')}
                </div>
              </div>
              {selectedDir === d.id && <span style={{ color: 'var(--acc-l)' }}>✓</span>}
            </button>); })}
        </div>

        
        {dir && (<>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
              2. HAR FAN UCHUN PAPKA TANLANG
            </div>

            {loading ? (<div className="skel-card"/>) : (<div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                {allSubjects.map(function (sid) {
        var subj = SUBJECTS[sid];
        var list = folders[sid] || [];
        var isCompulsory = COMPULSORY.includes(sid);
        var count = isCompulsory ? 10 : 30;
        var selected = selectedFolders[sid] || [];
        return (<div key={sid} style={{
            background: 'var(--s1)',
            border: "1px solid " + (selected.length > 0 ? 'rgba(0,212,170,0.3)' : 'var(--f)'),
            borderRadius: 12, padding: 12
        }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{subj ? .icon : }</span>
                        <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>
                          {subj ? .name : }
                          <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 500, marginLeft: 6 }}>
                            · {count} savol · {isCompulsory ? 'majburiy' : 'mutaxassislik'}
                          </span>
                        </div>
                        {selected.length > 0 && (<span style={{ fontSize: 10, color: 'var(--g)', fontWeight: 700 }}>
                            {selected.length} ta tanlandi
                          </span>)}
                      </div>

                      {list.length === 0 ? (<div style={{
            fontSize: 11, color: 'var(--r)',
            padding: '8px 0', fontStyle: 'italic'
        }}>
                          ⚠️ Papka yo'q — Omborga material yuklang
                        </div>) : (<div style={{ display: 'grid', gap: 4 }}>
                          {list.map(function (f) {
            var isSel = selected.includes(f._id);
            return (<button key={f._id} onClick={function () { return toggleFolder(sid, f._id); }} style={{
                background: isSel ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
                border: "1px solid " + (isSel ? 'var(--g)' : 'var(--f)'),
                borderRadius: 8, padding: '7px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', color: 'var(--txt)',
                fontSize: 11, textAlign: 'left'
            }}>
                                <span style={{
                width: 16, height: 16, borderRadius: 4,
                background: isSel ? 'var(--g)' : 'transparent',
                border: "1.5px solid " + (isSel ? 'var(--g)' : 'var(--txt-3)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                                  {isSel && <span style={{ color: '#0a0a14', fontSize: 11, fontWeight: 800 }}>✓</span>}
                                </span>
                                <span style={{ flex: 1 }}>{f.title}</span>
                                {f.materialId && (<span style={{ color: 'var(--txt-3)', fontSize: 9 }}>
                                    {f.materialId.charCount.toLocaleString()} b.
                                  </span>)}
                              </button>);
        })}
                        </div>)}
                    </div>);
    })}
              </div>)}

            
            <button onClick={startTest} disabled={!allReady} style={{
        width: '100%',
        background: allReady ? 'linear-gradient(135deg, var(--acc), var(--acc-l))' : 'var(--s2)',
        color: allReady ? 'white' : 'var(--txt-3)',
        border: 'none', borderRadius: 14,
        padding: '15px 18px',
        fontSize: 14, fontWeight: 800,
        cursor: allReady ? 'pointer' : 'default'
    }}>
              🚀 90 ta savolli blok testni boshlash
            </button>
          </>)}

        <div style={{ height: 30 }}/>
      </div>
    </>);
}
