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
import api from '../api/client';
import { folderApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import { useJobStore } from '../store/jobStore';
import { SUBJECTS, COMPULSORY_IDS, SPEC_BY_CATEGORY } from '../constants/subjects';
export default function AiFreeSetupPage() {
    var _this = this;
    var navigate = useNavigate();
    var goBack = useGoBack('/testlar/ai');
    var toast = useToast();
    var startJob = useJobStore().startJob;
    var _a = useState([]), selected = _a[0], setSelected = _a[1];
    var _b = useState({}), foldersBySubj = _b[0], setFoldersBySubj = _b[1];
    // Fan qo'shish
    var addSubject = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var context, data_1, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (selected.length >= 5) {
                        toast.error("Maksimum 5 ta fan");
                        return [2 /*return*/];
                    }
                    if (selected.some(function (s) { return s.id === id; })) {
                        toast.info("Bu fan allaqachon tanlangan");
                        return [2 /*return*/];
                    }
                    context = COMPULSORY_IDS.includes(id) ? 'majburiy' : 'mutaxassislik';
                    setSelected(function (prev) { return prev.concat([{ id: id, context: context, folderIds: [], count: context === 'majburiy' ? 10 : 20 }]); });
                    if (!!foldersBySubj[id]) return [3 /*break*/, 4];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, folderApi.bySubject(id, context)];
                case 2:
                    data_1 = (_b.sent()).data;
                    setFoldersBySubj(function (prev) {
                        var _a;
                        return (__assign({}, prev, (_a = {}, _a[id] = data_1.folders, _a)));
                    });
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var removeSubject = function (id) {
        setSelected(function (prev) { return prev.filter(function (s) { return s.id !== id; }); });
    };
    var toggleFolder = function (subjId, folderId) {
        setSelected(function (prev) { return prev.map(function (s) {
            if (s.id !== subjId)
                return s;
            var has = s.folderIds.includes(folderId);
            return __assign({}, s, { folderIds: has ? s.folderIds.filter(function (id) { return id !== folderId; }) : s.folderIds.concat([folderId]) });
        }); });
    };
    var updateCount = function (id, count) {
        setSelected(function (prev) { return prev.map(function (s) { return s.id === id ? __assign({}, s, { count: count }) : s; }); });
    };
    var totalQuestions = selected.reduce(function (a, s) { return a + s.count; }, 0);
    var isReady = selected.length >= 2 && selected.every(function (s) { return s.folderIds.length > 0; });
    var startTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var missing, data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selected.length < 2) {
                        toast.error("Kamida 2 ta fan tanlash kerak");
                        return [2 /*return*/];
                    }
                    missing = selected.find(function (s) { return s.folderIds.length === 0; });
                    if (missing) {
                        toast.error("\"" + (SUBJECTS[missing.id] ? .name : ) + "\" uchun papka tanlanmagan");
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    toast.info("Jarayon yuborilmoqda...");
                    return [4 /*yield*/, api.post('/api/personal-tests/ai-free', {
                            subjects: selected.map(function (s) { return ({
                                id: s.id,
                                folderIds: s.folderIds,
                                count: s.count
                            }); })
                        })];
                case 2:
                    data = (_a.sent()).data;
                    if (data.testId) {
                        startJob(data.testId, 'test_generation', 'AI Erkin Test');
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
    // Tanlash uchun barcha fanlar
    var availableSubjects = COMPULSORY_IDS.concat(SPEC_BY_CATEGORY.aniq_tabiiy, SPEC_BY_CATEGORY.gumanitar, SPEC_BY_CATEGORY.chet_tili, SPEC_BY_CATEGORY.boshqa);
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>🎯 AI erkin tanlov</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }}>
          2-5 ta fan tanlang, har biri uchun papkalar va savol sonini belgilang
        </p>

        
        {selected.length > 0 && (<>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }}>
              ✓ TANLANGAN ({selected.length}/5) · Jami: {totalQuestions} savol
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              {selected.map(function (s) {
        var subj = SUBJECTS[s.id];
        var list = foldersBySubj[s.id] || [];
        return (<div key={s.id} style={{
            background: 'var(--s1)',
            border: "1px solid " + (s.folderIds.length > 0 ? 'rgba(0,212,170,0.3)' : 'rgba(255,95,126,0.25)'),
            borderRadius: 12, padding: 12
        }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 18 }}>{subj ? .icon : }</span>
                      <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>
                        {subj ? .name : }
                        <span style={{ fontSize: 10, color: 'var(--txt-3)', marginLeft: 6 }}>· {s.context}</span>
                      </div>
                      <button onClick={function () { return removeSubject(s.id); }} style={{
            background: 'none', border: 'none',
            color: 'var(--r)', fontSize: 18, cursor: 'pointer',
            padding: '0 4px'
        }}>×</button>
                    </div>

                    
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <label style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }}>SAVOL SONI</label>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--acc-l)' }}>{s.count}</span>
                      </div>
                      <input type="range" min={5} max={30} step={5} value={s.count} onChange={function (e) { return updateCount(s.id, parseInt(e.target.value)); }} style={{ width: '100%', accentColor: 'var(--acc)' }}/>
                    </div>

                    
                    <div>
                      <label style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                        PAPKALAR {s.folderIds.length > 0 && <span style={{ color: 'var(--g)' }}>({s.folderIds.length} ta)</span>}
                      </label>
                      {list.length === 0 ? (<div style={{ fontSize: 11, color: 'var(--r)', fontStyle: 'italic', padding: '4px 0' }}>
                          Papka yo'q — Omborga material yuklang
                        </div>) : (<div style={{ display: 'grid', gap: 4 }}>
                          {list.map(function (f) {
            var isSel = s.folderIds.includes(f._id);
            return (<button key={f._id} onClick={function () { return toggleFolder(s.id, f._id); }} style={{
                background: isSel ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
                border: "1px solid " + (isSel ? 'var(--g)' : 'var(--f)'),
                borderRadius: 8, padding: '6px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', color: 'var(--txt)',
                fontSize: 11, textAlign: 'left'
            }}>
                                <span style={{
                width: 14, height: 14, borderRadius: 4,
                background: isSel ? 'var(--g)' : 'transparent',
                border: "1.5px solid " + (isSel ? 'var(--g)' : 'var(--txt-3)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                                  {isSel && <span style={{ color: '#0a0a14', fontSize: 10, fontWeight: 800 }}>✓</span>}
                                </span>
                                <span style={{ flex: 1 }}>{f.title}</span>
                              </button>);
        })}
                        </div>)}
                    </div>
                  </div>);
    })}
            </div>
          </>)}

        
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
          ➕ FAN QO'SHISH
        </div>
        <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16
    }}>
          {availableSubjects.map(function (id) {
        var subj = SUBJECTS[id];
        var isSelected = selected.some(function (s) { return s.id === id; });
        return (<button key={id} onClick={function () { return !isSelected && addSubject(id); }} disabled={isSelected || selected.length >= 5} style={{
            padding: '6px 10px',
            fontSize: 11, fontWeight: 600,
            background: isSelected ? 'rgba(0,212,170,0.1)' : 'var(--s1)',
            border: "1px solid " + (isSelected ? 'var(--g)' : 'var(--f)'),
            borderRadius: 100,
            color: isSelected ? 'var(--g)' : 'var(--txt-2)',
            cursor: isSelected || selected.length >= 5 ? 'default' : 'pointer',
            opacity: isSelected || selected.length >= 5 ? 0.6 : 1
        }}>
                {subj ? .icon : } {subj ? .name : }
              </button>);
    })}
        </div>

        
        <button onClick={startTest} disabled={!isReady} style={{
        width: '100%',
        background: isReady ? 'linear-gradient(135deg, var(--acc), var(--acc-l))' : 'var(--s2)',
        color: isReady ? 'white' : 'var(--txt-3)',
        border: 'none', borderRadius: 14,
        padding: '15px 18px',
        fontSize: 14, fontWeight: 800,
        cursor: isReady ? 'pointer' : 'default'
    }}>
          {isReady ? "\uD83D\uDE80 " + totalQuestions + " ta savolli testni boshlash" : 'Kamida 2 ta fan tanlang'}
        </button>

        <div style={{ height: 30 }}/>
      </div>
    </>);
}
