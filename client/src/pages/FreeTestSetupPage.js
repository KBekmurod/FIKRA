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
var COMPULSORY = [
    { id: 'majburiy_onatili', name: 'Ona tili', icon: '📖', count: 10, weight: 1.1 },
    { id: 'majburiy_math', name: 'Matematika', icon: '🔢', count: 10, weight: 1.1 },
    { id: 'majburiy_tarix', name: "O'zbekiston tarixi", icon: '🏛', count: 10, weight: 1.1 },
];
var SPECIALTIES = [
    { id: 'math', name: 'Matematika', icon: '🔢', count: 30, weight: 3.1 },
    { id: 'fizika', name: 'Fizika', icon: '⚛', count: 30, weight: 3.1 },
    { id: 'kimyo', name: 'Kimyo', icon: '⚗', count: 30, weight: 2.1 },
    { id: 'bio', name: 'Biologiya', icon: '🧬', count: 30, weight: 3.1 },
    { id: 'geo', name: 'Geografiya', icon: '🌍', count: 30, weight: 3.1 },
    { id: 'tarix', name: 'Tarix', icon: '🏛', count: 30, weight: 3.1 },
    { id: 'adab', name: 'Adabiyot', icon: '📖', count: 30, weight: 2.1 },
    { id: 'ingliz', name: 'Ingliz tili', icon: '🇬🇧', count: 30, weight: 2.1 },
    { id: 'rus', name: 'Rus tili', icon: '🇷🇺', count: 30, weight: 2.1 },
    { id: 'inform', name: 'Informatika', icon: '💻', count: 30, weight: 3.1 },
    { id: 'iqtisod', name: 'Iqtisodiyot', icon: '💰', count: 30, weight: 2.1 },
];
export default function FreeTestSetupPage() {
    var _this = this;
    var navigate = useNavigate();
    var toast = useToast();
    var _a = useState(new Set()), selected = _a[0], setSelected = _a[1];
    var _b = useState(false), starting = _b[0], setStarting = _b[1];
    var toggle = function (id) {
        setSelected(function (prev) {
            var next = new Set(prev);
            if (next.has(id))
                next["delete"](id);
            else
                next.add(id);
            return next;
        });
    };
    // Statistika
    var selectedCompulsory = COMPULSORY.filter(function (s) { return selected.has('c_' + s.id); });
    var selectedSpec = SPECIALTIES.filter(function (s) { return selected.has('s_' + s.id); });
    var totalQuestions = selectedCompulsory.reduce(function (a, b) { return a + b.count; }, 0) +
        selectedSpec.reduce(function (a, b) { return a + b.count; }, 0);
    var totalScore = selectedCompulsory.reduce(function (a, b) { return a + b.count * b.weight; }, 0) +
        selectedSpec.reduce(function (a, b) { return a + b.count * b.weight; }, 0);
    var startTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var subjectIds, unique, data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selected.size === 0) {
                        toast.error('Kamida 1 ta fan tanlang');
                        return [2 /*return*/];
                    }
                    setStarting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    subjectIds = selectedCompulsory.map(function (s) { return s.id; }).concat(selectedSpec.map(function (s) { return s.id; }));
                    unique = new Set(subjectIds).slice();
                    return [4 /*yield*/, examApi.startSubject(unique)];
                case 2:
                    data = (_a.sent()).data;
                    navigate("/test-run/" + data.sessionId, {
                        state: __assign({ mode: 'free' }, data)
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
    return (<>
      <div className="header">
        <button onClick={function () { return navigate('/testlar/fikra'); }} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>📚 Erkin tanlov</div>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', margin: '4px 0 16px' }}>
          Istagan kombinatsiyada fanlarni tanlang
        </p>

        
        <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 10 }}>
          📌 MAJBURIY FANLAR
        </div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
          {COMPULSORY.map(function (s) {
        var key = 'c_' + s.id;
        var active = selected.has(key);
        return (<button key={key} onClick={function () { return toggle(key); }} style={{
            background: active ? 'rgba(0,212,170,0.12)' : 'var(--s1)',
            border: "1.5px solid " + (active ? 'var(--g)' : 'var(--f)'),
            borderRadius: 10,
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left'
        }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                    {s.count} savol · {s.weight} ball
                  </div>
                </div>
                <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: "1.5px solid " + (active ? 'var(--g)' : 'var(--txt-3)'),
            background: active ? 'var(--g)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 14, fontWeight: 800
        }}>{active ? '✓' : ''}</div>
              </button>);
    })}
        </div>

        
        <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--acc-l)', letterSpacing: 0.5, marginBottom: 10 }}>
          ⭐ MUTAXASSISLIK FANLARI
        </div>
        <div style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
          {SPECIALTIES.map(function (s) {
        var key = 's_' + s.id;
        var active = selected.has(key);
        return (<button key={key} onClick={function () { return toggle(key); }} style={{
            background: active ? 'rgba(123,104,238,0.12)' : 'var(--s1)',
            border: "1.5px solid " + (active ? 'var(--acc-l)' : 'var(--f)'),
            borderRadius: 10,
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left'
        }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                    {s.count} savol · {s.weight} ball
                  </div>
                </div>
                <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: "1.5px solid " + (active ? 'var(--acc-l)' : 'var(--txt-3)'),
            background: active ? 'var(--acc-l)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 14, fontWeight: 800
        }}>{active ? '✓' : ''}</div>
              </button>);
    })}
        </div>

        
        {selected.size > 0 && (<div style={{
        position: 'sticky',
        bottom: 8,
        background: 'rgba(10,10,20,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(123,104,238,0.3)',
        borderRadius: 14,
        padding: 14,
        marginTop: 10
    }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--txt-2)' }}>Tanlangan</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>
                {selected.size} fan · {totalQuestions} savol
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--txt-2)' }}>Maksimal ball</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--acc-l)' }}>
                {totalScore.toFixed(1)}
              </span>
            </div>
            <button onClick={startTest} disabled={starting} className="btn btn-primary btn-block btn-lg">
              {starting ? '⏳ Boshlanmoqda...' : 'TESTNI BOSHLASH →'}
            </button>
          </div>)}
      </div>
    </>);
}
