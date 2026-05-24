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
import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { triggerHaptic } from '../utils/haptics';
import RichText from '../components/RichText';
import ShadowRival from '../components/ShadowRival';
import '../components/RichText.css';
export default function TestRunPage() {
    var _this = this;
    var navigate = useNavigate();
    var sessionId = useParams().sessionId;
    var location = useLocation();
    var toast = useToast();
    var state = location.state;
    var questions = useState(state ? .questions || [] : )[0];
    var _a = useState(0), qIdx = _a[0], setQIdx = _a[1];
    var _b = useState({}), selected = _b[0], setSelected = _b[1];
    var _c = useState(state ? .durationSeconds || 10800 : ), timeLeft = _c[0], setTimeLeft = _c[1];
    var _d = useState(false), finishing = _d[0], setFinishing = _d[1];
    var _e = useState(null), exitTarget = _e[0], setExitTarget = _e[1];
    var finishedRef = useRef(false);
    // Sessiya holatini yo'qotmaslik uchun beforeunload + abandon
    useEffect(function () {
        if (!sessionId)
            return;
        var onUnload = function () {
            // Yopilishda abandon (best effort, navigator.sendBeacon)
            if (finishedRef.current)
                return;
            try {
                var auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}');
                var data = new Blob([JSON.stringify({})], { type: 'application/json' });
                var url = "/api/exams/sessions/" + sessionId + "/abandon";
                // Token Authorization Header beacon'da ishlamaydi, lekin server hech bo'lmasa
                // sessiyani tozalashga harakat qiladi. Aniq abandon /home dan keyin ham yuboriladi.
                navigator.sendBeacon ? .(url, data)
                    :
                ;
            }
            catch (_a) { }
        };
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('pagehide', onUnload);
        return function () {
            window.removeEventListener('beforeunload', onUnload);
            window.removeEventListener('pagehide', onUnload);
        };
    }, [sessionId]);
    // Nav tugma bossa — modal
    useEffect(function () {
        var onNavAttempt = function (e) {
            e.preventDefault();
            setExitTarget(e.detail.target);
        };
        window.addEventListener('fikra:nav-attempt', onNavAttempt);
        return function () { return window.removeEventListener('fikra:nav-attempt', onNavAttempt); };
    }, []);
    // Timer
    useEffect(function () {
        if (finishedRef.current)
            return;
        var id = setInterval(function () {
            setTimeLeft(function (t) {
                if (t <= 1) {
                    clearInterval(id);
                    handleFinish(true);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return function () { return clearInterval(id); };
    }, []);
    // Agar questions kelmagan bo'lsa
    if (!sessionId || !questions.length) {
        return (<div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 28 }}>⚠️</div>
        <p style={{ marginTop: 12 }}>Test ma'lumotlari topilmadi</p>
        <button className="btn btn-primary" onClick={function () { return navigate('/testlar'); }} style={{ marginTop: 16 }}>
          Testlarga qaytish
        </button>
      </div>);
    }
    var q = questions[qIdx];
    var total = questions.length;
    var isLast = qIdx === total - 1;
    var fmt = function (s) {
        var h = Math.floor(s / 3600);
        var m = Math.floor((s % 3600) / 60);
        var ss = s % 60;
        return h > 0
            ? h + ":" + String(m).padStart(2, '0') + ":" + String(ss).padStart(2, '0')
            : m + ":" + String(ss).padStart(2, '0');
    };
    var pickAnswer = function (i) { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (selected[qIdx] !== undefined)
                        return [2 /*return*/];
                    triggerHaptic('click');
                    setSelected(function (prev) {
                        var _a;
                        return (__assign({}, prev, (_a = {}, _a[qIdx] = i, _a)));
                    });
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, examApi.answer(sessionId, q._id, i)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var next = function () {
        if (qIdx < total - 1)
            setQIdx(qIdx + 1);
    };
    var prev = function () {
        if (qIdx > 0)
            setQIdx(qIdx - 1);
    };
    var handleFinish = useCallback(function (auto) {
        if (auto === void 0) { auto = false; }
        return __awaiter(_this, void 0, void 0, function () {
            var data, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (finishing || finishedRef.current)
                            return [2 /*return*/];
                        setFinishing(true);
                        finishedRef.current = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, examApi.finish(sessionId)];
                    case 2:
                        data = (_a.sent()).data;
                        navigate("/test-result/" + sessionId, { state: data });
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        if (!auto)
                            toast.error('Yakunlashda xatolik');
                        setFinishing(false);
                        finishedRef.current = false;
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    }, [sessionId, finishing, navigate, toast]);
    // Modal — chiqish tasdig'i
    var confirmExit = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, target;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    finishedRef.current = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, examApi.abandon(sessionId)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    target = exitTarget || '/testlar';
                    setExitTarget(null);
                    navigate(target);
                    return [2 /*return*/];
            }
        });
    }); };
    var cancelExit = function () { return setExitTarget(null); };
    var answered = Object.keys(selected).length;
    return (<>
      
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10,10,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--f)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10
    }}>
        <button onClick={function () { return setExitTarget('/testlar'); }} style={{
        background: 'none', border: 'none', color: 'var(--r)',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0
    }}>Chiqish</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
        display: 'inline-block',
        background: timeLeft < 300 ? 'rgba(255,95,126,0.15)' : 'rgba(123,104,238,0.12)',
        border: "1px solid " + (timeLeft < 300 ? 'var(--r)' : 'rgba(123,104,238,0.3)'),
        borderRadius: 100,
        padding: '4px 14px',
        fontFamily: 'monospace',
        fontWeight: 700,
        fontSize: 14,
        color: timeLeft < 300 ? 'var(--r)' : 'var(--acc-l)'
    }}>
            ⏱ {fmt(timeLeft)}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--txt-2)', fontWeight: 700, minWidth: 50, textAlign: 'right' }}>
          {qIdx + 1}/{total}
        </div>
      </div>

      
      <div style={{ padding: '8px 16px 4px' }}>
        <div style={{ height: 3, background: 'var(--s2)', borderRadius: 100 }}>
          <div style={{
        height: '100%',
        width: (answered / total) * 100 + "%",
        background: 'var(--acc)',
        borderRadius: 100,
        transition: 'width 0.3s'
    }}/>
        </div>
        <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 4, textAlign: 'right' }}>
          {answered}/{total} javob berildi
        </div>
      </div>

      {state ? .rivalData && (<div style={{ padding: '0 16px' }}>
          <ShadowRival name={state.rivalData.name} expectedScore={state.rivalData.expectedScore} accuracy={state.rivalData.accuracy} duration={state.durationSeconds || 10800} isActive={!finishing}/>
        </div>) : }

      
      <div style={{ padding: '8px 16px 100px' }}>
        <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>
          {q.subjectName || q.subject}
        </div>
        <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        fontSize: 14,
        lineHeight: 1.6,
        fontWeight: 500
    }}>
          <RichText content={q.question}/>
        </div>

        
        <div style={{ display: 'grid', gap: 8 }}>
          {q.options.map(function (opt, i) {
        var isSel = selected[qIdx] === i;
        return (<button key={i} onClick={function () { return pickAnswer(i); }} disabled={selected[qIdx] !== undefined} style={{
            background: isSel ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
            border: "1.5px solid " + (isSel ? 'var(--acc-l)' : 'var(--f)'),
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            cursor: selected[qIdx] !== undefined ? 'default' : 'pointer',
            color: 'var(--txt)',
            textAlign: 'left',
            fontSize: 13,
            lineHeight: 1.5,
            width: '100%'
        }}>
                <span style={{
            fontWeight: 800,
            color: isSel ? 'var(--acc-l)' : 'var(--txt-3)',
            flexShrink: 0,
            minWidth: 18
        }}>
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                <span style={{ flex: 1 }}><RichText content={opt} inline/></span>
              </button>);
    })}
        </div>

        
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={prev} disabled={qIdx === 0} className="btn btn-ghost" style={{ flex: 1, opacity: qIdx === 0 ? 0.4 : 1 }}>← Oldingi</button>
          {!isLast ? (<button onClick={next} className="btn btn-primary" style={{ flex: 2 }}>Keyingi →</button>) : (<button onClick={function () { return handleFinish(false); }} disabled={finishing} className="btn btn-success" style={{ flex: 2 }}>{finishing ? '⏳ Yakunlanmoqda...' : '🏁 Testni yakunlash'}</button>)}
        </div>
      </div>

      
      {exitTarget && (<div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
    }}>
          <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 18,
        padding: 22,
        maxWidth: 360,
        width: '100%'
    }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: 16, textAlign: 'center', marginBottom: 8 }}>
              Testdan chiqasizmi?
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: 16 }}>
              Test to'liq yakunlanmagan. Chiqsangiz natija <strong>saqlanmaydi</strong> va keyingi safar boshidan boshlanadi.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={cancelExit} className="btn btn-ghost btn-block">Davom etish</button>
              <button onClick={confirmExit} style={{
        flex: 1,
        background: 'rgba(255,95,126,0.15)',
        border: '1.5px solid var(--r)',
        color: 'var(--r)',
        fontWeight: 700,
        fontSize: 13,
        padding: '11px 14px',
        borderRadius: 10,
        cursor: 'pointer'
    }}>Chiqish</button>
            </div>
          </div>
        </div>)}
    </>);
}
