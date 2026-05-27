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
import { examApi, personalTestApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { SUBJECTS } from '../constants/subjects';
import { useAppStore } from '../store';
var DIRECTION_NAMES = {
    engineering: { name: 'Muhandislik · Texnologiya', icon: '⚙️' },
    medicine: { name: 'Tibbiyot · Q-xo\'jaligi', icon: '🏥' },
    international: { name: 'Xalqaro · Turizm', icon: '🌍' },
    philology: { name: 'Filologiya', icon: '📖' },
    economy: { name: "Iqtisod · IT", icon: '💰' },
    geodesy: { name: 'Geodeziya · Kadastr', icon: '🗺' }
};
export default function HistoryPage() {
    var _this = this;
    var navigate = useNavigate();
    var toast = useToast();
    var user = useAppStore().user;
    var _a = useState('fikra'), topTab = _a[0], setTopTab = _a[1];
    var _b = useState('blok'), fikraMode = _b[0], setFikraMode = _b[1];
    var _c = useState('papka'), aiMode = _c[0], setAiMode = _c[1];
    var _d = useState([]), fikra = _d[0], setFikra = _d[1];
    var _e = useState([]), ai = _e[0], setAi = _e[1];
    var _f = useState(true), loading = _f[0], setLoading = _f[1];
    var loadAll = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, f, a, fd, rawFikra, normalized, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    setLoading(true);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            examApi.history(undefined, 1)["catch"](function () { return ({ data: { items: [] } }); }),
                            personalTestApi.history(undefined, undefined, 1)["catch"](function () { return ({ data: { tests: [] } }); }),
                        ])
                        // QUSUR TUZATILDI: backend 'items' qaytaradi, eski versiya 'sessions' yoki 'history'
                    ];
                case 2:
                    _a = _c.sent(), f = _a[0], a = _a[1];
                    fd = f.data;
                    rawFikra = fd ? .items || fd ? .sessions || fd ? .history || []
                        :
                        :
                        :
                    ;
                    normalized = rawFikra.map(function (s) { return (__assign({}, s, { testMode: s.mode === 'dtm' ? 'blok' : 'free', blockSubject: s.direction, freeSubjects: s.selectedSubjects, totalCorrect: s.subjectBreakdown ? .reduce(function (sum, sb) {
                            return sum + (sb.correctCount || 0);
                        }, 0) || 0 : , totalQuestions: s.subjectBreakdown ? .reduce(function (sum, sb) {
                            return sum + (sb.totalCount || 0);
                        }, 0) || 0 : , status: s.status || 'completed' })); });
                    setFikra(normalized);
                    setAi((a.data ? .tests || [] : ));
                    return [3 /*break*/, 5];
                case 3:
                    _b = _c.sent();
                    toast.error("Tarix yuklanmadi");
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        if (!user) {
            setLoading(false);
            return;
        }
        loadAll();
    }, [user]);
    // FIKRA testlar bo'yicha filter
    var fikraByMode = fikra.filter(function (s) { return s.testMode === fikraMode; });
    // AI testlar bo'yicha filter
    // - papka rejimi: testType === 'material' yoki 'mini' (folderId bilan)
    // - blok: testType === 'ai_blok'
    // - free: testType === 'ai_free'
    var aiByMode = ai.filter(function (t) {
        if (aiMode === 'papka')
            return t.testType === 'material' || t.testType === 'mini';
        if (aiMode === 'blok')
            return t.testType === 'ai_blok';
        if (aiMode === 'free')
            return t.testType === 'ai_free';
        return true;
    });
    // Dastlabki testlar va mini-testlarni ajratish
    var primaryAi = aiByMode.filter(function (t) { return t.testType !== 'mini'; });
    var miniAi = aiByMode.filter(function (t) { return t.testType === 'mini'; });
    return (<>
      <div className="header">
        <div className="header-logo">📚 Tarix</div>
      </div>

      {!user ? (<div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>📚</div>
          <h3 style={{ fontSize: 18, color: 'var(--txt)', marginBottom: 8 }}>Testlar tarixi yopiq</h3>
          <p style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 24, lineHeight: 1.5 }}>
            Siz ishlagan testlar va xatolar ustida qilingan ishlar bu yerda saqlanadi. Ko'rish uchun hisobingizga kiring.
          </p>
          <button onClick={function () { return navigate('/auth/login'); }} style={{
        background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
        color: '#fff', border: 'none',
        padding: '12px 24px', borderRadius: 12,
        fontSize: 14, fontWeight: 800, cursor: 'pointer'
    }}>
            Tizimga kirish
          </button>
        </div>) : (<div style={{ padding: '8px 20px 0' }}>
          
        <div className="seg-tabs">
          <button className={"seg-tab " + (topTab === 'fikra' ? 'active' : '')} onClick={function () { return setTopTab('fikra'); }}>🎓 FIKRA ({fikra.length})</button>
          <button className={"seg-tab " + (topTab === 'ai' ? 'active' : '')} onClick={function () { return setTopTab('ai'); }}>🤖 AI ({ai.length})</button>
        </div>

        
        {topTab === 'fikra' ? (<div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <ModeChip active={fikraMode === 'blok'} onClick={function () { return setFikraMode('blok'); }} icon="📦" label="Maxsus blok" count={fikra.filter(function (s) { return s.testMode === 'blok'; }).length}/>
            <ModeChip active={fikraMode === 'free'} onClick={function () { return setFikraMode('free'); }} icon="🎯" label="Erkin tanlov" count={fikra.filter(function (s) { return s.testMode === 'free'; }).length}/>
          </div>) : (<div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <ModeChip active={aiMode === 'papka'} onClick={function () { return setAiMode('papka'); }} icon="📁" label="Papka testlari" count={ai.filter(function (t) { return t.testType === 'material' || t.testType === 'mini'; }).length}/>
            <ModeChip active={aiMode === 'blok'} onClick={function () { return setAiMode('blok'); }} icon="📦" label="Maxsus blok" count={ai.filter(function (t) { return t.testType === 'ai_blok'; }).length}/>
            <ModeChip active={aiMode === 'free'} onClick={function () { return setAiMode('free'); }} icon="🎯" label="Erkin tanlov" count={ai.filter(function (t) { return t.testType === 'ai_free'; }).length}/>
          </div>)}

        {loading ? (<div className="skel-card"/>) : topTab === 'fikra' ? (<FikraHistoryList items={fikraByMode} onClick={function (s) { return navigate("/test-review/" + s._id); }}/>) : (<AiHistoryList primaryItems={primaryAi} miniItems={miniAi} allTests={ai} onClick={function (t) { return navigate("/personal-tests/" + t._id + "/result"); }}/>)}

          <div style={{ height: 30 }}/>
        </div>)}
    </>);
}
// ─── Rejim chip ─────────────────────────────────────────────────────────
function ModeChip(_a) {
    var active = _a.active, onClick = _a.onClick, icon = _a.icon, label = _a.label, count = _a.count;
    return (<button onClick={onClick} style={{
        flex: '0 0 auto',
        padding: '7px 12px',
        fontSize: 11, fontWeight: 700,
        borderRadius: 100,
        border: active ? '1.5px solid var(--acc)' : '1px solid var(--f)',
        background: active ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
        color: active ? 'var(--acc-l)' : 'var(--txt-2)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center', gap: 6
    }}>
      <span>{icon}</span>
      <span>{label}</span>
      <span style={{
        background: active ? 'rgba(123,104,238,0.2)' : 'var(--s1)',
        color: active ? 'var(--acc-l)' : 'var(--txt-3)',
        borderRadius: 100, padding: '1px 6px',
        fontSize: 10
    }}>{count}</span>
    </button>);
}
// ─── FIKRA testlar ro'yxati ───────────────────────────────────────────────
function FikraHistoryList(_a) {
    var items = _a.items, onClick = _a.onClick;
    if (items.length === 0) {
        return (<div style={{ padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }}>
          Hozircha bu turdagi FIKRA testlari yo'q
        </p>
      </div>);
    }
    return (<>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
        📋 DASTLABKI ISHLANGAN TESTLAR ({items.length})
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(function (s) {
        var pct = s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0;
        var metaText = '';
        if (s.testMode === 'blok' && s.blockSubject) {
            var subj = SUBJECTS[s.blockSubject];
            var dir = DIRECTION_NAMES[s.blockSubject];
            if (dir) {
                metaText = "Yo'nalish: " + dir.icon + " " + dir.name;
            }
            else if (subj) {
                metaText = "Yo'nalish: " + subj.icon + " " + subj.name;
            }
            else {
                metaText = s.blockSubject;
            }
        }
        else if (s.freeSubjects ? .length : ) {
            metaText = 'Fanlar: ' + s.freeSubjects.map(function (sid) {
                var x = SUBJECTS[sid];
                return x ? x.icon : sid;
            }).join(' ');
        }
        return (<button key={s._id} onClick={function () { return onClick(s); }} style={cardStyle()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
                    {metaText}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                    {new Date(s.endTime).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{s.totalCorrect}/{s.totalQuestions}
                  </div>
                </div>
                <div style={{
            fontWeight: 800, fontSize: 16,
            color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
            whiteSpace: 'nowrap'
        }}>{pct}%</div>
              </div>
            </button>);
    })}
      </div>
    </>);
}
// ─── AI testlar — dastlabki + mini ajratilgan ────────────────────────────
function AiHistoryList(_a) {
    var primaryItems = _a.primaryItems, miniItems = _a.miniItems, allTests = _a.allTests, onClick = _a.onClick;
    if (primaryItems.length === 0 && miniItems.length === 0) {
        return (<div style={{ padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }}>
          Hozircha bu turdagi AI testlari yo'q
        </p>
      </div>);
    }
    return (<>
      
      {primaryItems.length > 0 && (<>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
            📋 DASTLABKI ISHLANGAN TESTLAR ({primaryItems.length})
          </div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
            {primaryItems.map(function (t) {
        var relatedMini = allTests.find(function (x) { return x.testType === 'mini' && x.sourceTestId === t._id; });
        return (<AiTestCard key={t._id} test={t} relatedMini={relatedMini} onClick={function () { return onClick(t); }}/>);
    })}
          </div>
        </>)}

      
      {miniItems.length > 0 && (<>
          <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--y)',
        letterSpacing: 0.5, marginBottom: 8,
        marginTop: primaryItems.length > 0 ? 14 : 0
    }}>
            🎯 XATOLAR USTIDA ISHLANGAN MINI-TESTLAR ({miniItems.length})
          </div>
          <div style={{
        padding: 10, marginBottom: 8,
        background: 'rgba(255,204,68,0.05)',
        border: '1px dashed rgba(255,204,68,0.2)',
        borderRadius: 10,
        fontSize: 10.5, color: 'var(--txt-3)', lineHeight: 1.4
    }}>
            💡 Mini-test — dastlabki testdagi xatolaringizdan AI tomonidan
            yaratilgan o'rganish testi
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {miniItems.map(function (t) { return (<AiTestCard key={t._id} test={t} onClick={function () { return onClick(t); }} isMini/>); })}
          </div>
        </>)}
    </>);
}
function AiTestCard(_a) {
    var t = _a.test, relatedMini = _a.relatedMini, onClick = _a.onClick, isMini = _a.isMini;
    var subj = SUBJECTS[t.subjectId];
    var folderTitle = t.folderInfo ? .title
        :
    ;
    var isBlok = t.testType === 'ai_blok';
    var isFree = t.testType === 'ai_free';
    return (<button onClick={onClick} style={cardStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
        display: 'inline-block',
        fontSize: 9.5, fontWeight: 800,
        padding: '2px 8px', borderRadius: 100,
        background: isMini ? 'rgba(255,204,68,0.15)' :
            isBlok ? 'rgba(167,139,250,0.15)' :
                isFree ? 'rgba(0,212,170,0.15)' : 'rgba(123,104,238,0.15)',
        color: isMini ? 'var(--y)' :
            isBlok ? 'var(--acc-l)' :
                isFree ? 'var(--g)' : 'var(--acc-l)',
        marginBottom: 4, letterSpacing: 0.3
    }}>
            {isMini ? '🎯 MINI' : isBlok ? '📦 BLOK' : isFree ? '🎯 ERKIN' : '🤖 PAPKA'}
          </div>
          <div style={{
        fontSize: 12.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 2,
        display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word',
        lineHeight: 1.35
    }}>
            {subj ? .icon || (isBlok || isFree ? '📊' : '') : } {t.subjectName}
          </div>
          {folderTitle && !isBlok && !isFree && (<div style={{
        fontSize: 10, color: 'var(--txt-2)', marginBottom: 2,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    }}>
              📁 "{folderTitle}"
            </div>)}
          <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
            {new Date(t.endTime || t.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            {' · '}{t.totalCorrect}/{t.totalQuestions}
          </div>
          {relatedMini && (<div style={{
        marginTop: 6, padding: '4px 8px',
        background: 'rgba(255,204,68,0.08)',
        border: '1px solid rgba(255,204,68,0.2)',
        borderRadius: 6,
        fontSize: 10, color: 'var(--y)',
        display: 'inline-block'
    }}>
              ✓ Mini-test ham bor ({relatedMini.totalCorrect}/{relatedMini.totalQuestions})
            </div>)}
        </div>
        <div style={{
        fontWeight: 800, fontSize: 16,
        color: t.scorePercent >= 70 ? 'var(--g)' : t.scorePercent >= 50 ? 'var(--y)' : 'var(--r)',
        whiteSpace: 'nowrap'
    }}>{t.scorePercent}%</div>
      </div>
    </button>);
}
function cardStyle() {
    return {
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: '12px 14px',
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'left',
        width: '100%'
    };
}
