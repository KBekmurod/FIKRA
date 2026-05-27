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
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
// PDF mind-mapdagi tayyor yo'nalish bloklari
var DIRECTION_BLOCKS = [
    {
        id: 'engineering',
        name: 'Muhandislik · Texnologiya',
        icon: '⚙️',
        subjects: [
            { id: 'math', name: 'Matematika' },
            { id: 'fizika', name: 'Fizika' },
        ]
    },
    {
        id: 'medicine',
        name: 'Tibbiyot · Q-xo\'jaligi',
        icon: '🏥',
        subjects: [
            { id: 'bio', name: 'Biologiya' },
            { id: 'kimyo', name: 'Kimyo' },
        ]
    },
    {
        id: 'international',
        name: 'Xalqaro · Turizm',
        icon: '🌍',
        subjects: [
            { id: 'tarix', name: 'Tarix' },
            { id: 'ingliz', name: 'Chet tili' },
        ]
    },
    {
        id: 'philology',
        name: 'Filologiya',
        icon: '📖',
        subjects: [
            { id: 'adab', name: 'Ona tili va adabiyot' },
            { id: 'ingliz', name: 'Chet tili' },
        ]
    },
    {
        id: 'economy',
        name: "Iqtisod · IT",
        icon: '💰',
        subjects: [
            { id: 'math', name: 'Matematika' },
            { id: 'ingliz', name: 'Chet tili' },
        ]
    },
    {
        id: 'geodesy',
        name: 'Geodeziya · Kadastr',
        icon: '🗺',
        subjects: [
            { id: 'tarix', name: 'Tarix' },
            { id: 'geo', name: 'Geografiya' },
        ]
    },
];
// Alohida tanlov uchun barcha mutaxassislik fanlari
var SPEC_SUBJECTS = [
    { id: 'math', name: 'Matematika', icon: '🔢' },
    { id: 'fizika', name: 'Fizika', icon: '⚛' },
    { id: 'kimyo', name: 'Kimyo', icon: '⚗' },
    { id: 'bio', name: 'Biologiya', icon: '🧬' },
    { id: 'geo', name: 'Geografiya', icon: '🌍' },
    { id: 'tarix', name: 'Tarix', icon: '🏛' },
    { id: 'adab', name: 'Adabiyot', icon: '📖' },
    { id: 'ingliz', name: 'Ingliz tili', icon: '🇬🇧' },
    { id: 'rus', name: 'Rus tili', icon: '🇷🇺' },
    { id: 'inform', name: 'Informatika', icon: '💻' },
    { id: 'iqtisod', name: 'Iqtisodiyot', icon: '💰' },
];
export default function BlokTestSetupPage() {
    var _this = this;
    var navigate = useNavigate();
    var toast = useToast();
    var _a = useState('block'), mode = _a[0], setMode = _a[1];
    var _b = useState(null), selectedBlock = _b[0], setSelectedBlock = _b[1];
    var _c = useState([]), customSubjects = _c[0], setCustomSubjects = _c[1];
    var _d = useState(false), starting = _d[0], setStarting = _d[1];
    var toggleCustom = function (id) {
        setCustomSubjects(function (prev) {
            if (prev.includes(id))
                return prev.filter(function (x) { return x !== id; });
            if (prev.length >= 2) {
                toast.info('Faqat 2 ta fan tanlash mumkin');
                return prev;
            }
            return prev.concat([id]);
        });
    };
    var startTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var direction, selectedIds, blk, data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setStarting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    direction = void 0;
                    selectedIds = void 0;
                    if (mode === 'block') {
                        if (!selectedBlock) {
                            toast.error('Yo\'nalish tanlang');
                            setStarting(false);
                            return [2 /*return*/];
                        }
                        blk = DIRECTION_BLOCKS.find(function (b) { return b.id === selectedBlock; });
                        selectedIds = blk.subjects.map(function (s) { return s.id; });
                        direction = selectedBlock;
                    }
                    else {
                        if (customSubjects.length !== 2) {
                            toast.error('Aniq 2 ta mutaxassislik tanlang');
                            setStarting(false);
                            return [2 /*return*/];
                        }
                        selectedIds = customSubjects;
                        direction = "custom_" + customSubjects.join('_');
                    }
                    return [4 /*yield*/, examApi.startDtm(direction)];
                case 2:
                    data = (_a.sent()).data;
                    navigate("/test-run/" + data.sessionId, {
                        state: __assign({ mode: 'blok' }, data)
                    });
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1 ? .response ? .data ? .error || 'Test boshlashda xatolik' :  :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setStarting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var canStart = mode === 'block' ? !!selectedBlock : customSubjects.length === 2;
    return (<>
      <div className="header">
        <button onClick={function () { return navigate('/testlar/fikra'); }} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>🎯 Maxsus blok</div>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        
        <div style={{
        background: 'rgba(0,212,170,0.08)',
        border: '1px solid rgba(0,212,170,0.25)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16
    }}>
          <div style={{ fontSize: 11, color: 'var(--g)', fontWeight: 800, marginBottom: 8, letterSpacing: 0.5 }}>
            📌 MAJBURIY BLOK (avtomatik)
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--txt-2)' }}>
            • Ona tili (10 savol · 1.1 ball){' '}<br />
            • Matematika (10 savol · 1.1 ball)<br />
            • O'zbekiston tarixi (10 savol · 1.1 ball)
          </div>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--g)' }}>
            Jami: 33 ball
          </div>
        </div>

        
        <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--txt-2)', letterSpacing: 0.5, marginBottom: 10 }}>
          ⭐ MUTAXASSISLIKNI TANLANG (2 ta)
        </div>

        
        <div className="seg-tabs" style={{ marginBottom: 12 }}>
          <button className={"seg-tab " + (mode === 'block' ? 'active' : '')} onClick={function () { return setMode('block'); }}>Tayyor yo'nalish</button>
          <button className={"seg-tab " + (mode === 'custom' ? 'active' : '')} onClick={function () { return setMode('custom'); }}>Alohida 2 fan</button>
        </div>

        {mode === 'block' && (<div style={{ display: 'grid', gap: 8 }}>
            {DIRECTION_BLOCKS.map(function (b) {
        var active = selectedBlock === b.id;
        return (<button key={b.id} onClick={function () { return setSelectedBlock(b.id); }} style={{
            background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
            border: "1.5px solid " + (active ? 'var(--acc-l)' : 'var(--f)'),
            borderRadius: 12,
            padding: '14px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left'
        }}>
                  <div style={{ fontSize: 22 }}>{b.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                      {b.subjects.map(function (s) { return s.name; }).join(' + ')}
                    </div>
                  </div>
                  {active && <div style={{ color: 'var(--acc-l)', fontSize: 18 }}>✓</div>}
                </button>);
    })}
          </div>)}

        {mode === 'custom' && (<>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }}>
              Tanlangan: {customSubjects.length}/2
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SPEC_SUBJECTS.map(function (s) {
        var active = customSubjects.includes(s.id);
        return (<button key={s.id} onClick={function () { return toggleCustom(s.id); }} style={{
            background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
            border: "1.5px solid " + (active ? 'var(--acc-l)' : 'var(--f)'),
            borderRadius: 12,
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            color: 'var(--txt)'
        }}>
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{s.name}</div>
                  </button>);
    })}
            </div>
          </>)}

        
        <div style={{
        marginTop: 14,
        padding: 12,
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 10,
        fontSize: 11,
        color: 'var(--txt-2)'
    }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>1-mutaxassislik (30 savol)</span>
            <span style={{ fontWeight: 700 }}>3.1 × 30 = 93 ball</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>2-mutaxassislik (30 savol)</span>
            <span style={{ fontWeight: 700 }}>2.1 × 30 = 63 ball</span>
          </div>
          <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: 6,
        borderTop: '1px solid var(--f)',
        fontWeight: 800,
        color: 'var(--txt)',
        fontSize: 13
    }}>
            <span>JAMI</span>
            <span style={{ color: 'var(--g)' }}>189 ball</span>
          </div>
        </div>

        
        <button onClick={startTest} disabled={!canStart || starting} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 16, opacity: canStart ? 1 : 0.5 }}>
          {starting ? '⏳ Boshlanmoqda...' : 'TESTNI BOSHLASH →'}
        </button>
      </div>
    </>);
}
