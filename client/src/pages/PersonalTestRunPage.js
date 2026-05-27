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
import { personalTestApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import RichText from '../components/RichText';
import { triggerHaptic } from '../utils/haptics';
import './TestRun.css'; // Import premium styles
export default function PersonalTestRunPage() {
    var _this = this;
    var navigate = useNavigate();
    var id = useParams().id;
    var location = useLocation();
    var toast = useToast();
    var state = location.state;
    var _a = useState(state ? .questions || [] : ), questions = _a[0], setQuestions = _a[1];
    var _b = useState(0), qIdx = _b[0], setQIdx = _b[1];
    var _c = useState(function () {
        if (state ? .answers : ) {
            var init_1 = {};
            state.answers.forEach(function (a) {
                if (a.selectedOption !== undefined && a.selectedOption !== null) {
                    init_1[a.questionIdx] = a.selectedOption;
                }
            });
            return init_1;
        }
        try {
            var cached = localStorage.getItem("fikra_test_answers_" + id);
            return cached ? JSON.parse(cached) : {};
        }
        catch (_a) {
            return {};
        }
    }), selected = _c[0], setSelected = _c[1];
    var _d = useState(state ? .durationSeconds || 1800 : ), timeLeft = _d[0], setTimeLeft = _d[1];
    var _e = useState(false), finishing = _e[0], setFinishing = _e[1];
    var _f = useState(null), exitTarget = _f[0], setExitTarget = _f[1];
    var _g = useState(false), showGrid = _g[0], setShowGrid = _g[1];
    var _h = useState(false), finishPrompt = _h[0], setFinishPrompt = _h[1];
    var _j = useState([]), pendingAnswers = _j[0], setPendingAnswers = _j[1];
    var _k = useState(!state ? .questions ? .length :  : ), loading = _k[0], setLoading = _k[1];
    // Animation key state to trigger CSS re-flow when qIdx changes
    var _l = useState(0), animKey = _l[0], setAnimKey = _l[1];
    var finishedRef = useRef(false);
    // Session Restore
    useEffect(function () {
        if (questions.length > 0 || !id)
            return;
        var restoreSession = function () { return __awaiter(_this, void 0, void 0, function () {
            var data, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, personalTestApi.review(id)];
                    case 1:
                        data = (_a.sent()).data;
                        if (data.test) {
                            setQuestions(data.test.questions);
                            setTimeLeft(data.test.durationSeconds || 1800);
                        }
                        setLoading(false);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        setLoading(false);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        restoreSession();
    }, [id, questions.length]);
    // Save to localStorage
    useEffect(function () {
        if (!id || Object.keys(selected).length === 0)
            return;
        try {
            localStorage.setItem("fikra_test_answers_" + id, JSON.stringify(selected));
        }
        catch (_a) { }
    }, [id, selected]);
    // Retry pending
    useEffect(function () {
        var retryPending = function () { return __awaiter(_this, void 0, void 0, function () {
            var toRetry, _loop_1, _i, toRetry_1, ans;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || pendingAnswers.length === 0)
                            return [2 /*return*/];
                        toRetry = pendingAnswers.slice();
                        setPendingAnswers([]);
                        _loop_1 = function (ans) {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, personalTestApi.answer(id, ans.qIdx, ans.selected)];
                                    case 1:
                                        _b.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        _a = _b.sent();
                                        setPendingAnswers(function (p) { return p.concat([ans]); });
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, toRetry_1 = toRetry;
                        _a.label = 1;
                    case 1:
                        if (!(_i < toRetry_1.length)) return [3 /*break*/, 4];
                        ans = toRetry_1[_i];
                        return [5 /*yield**/, _loop_1(ans)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        var onOnline = function () { return retryPending(); };
        window.addEventListener('online', onOnline);
        return function () { return window.removeEventListener('online', onOnline); };
    }, [id, pendingAnswers]);
    // Abandon on unload
    useEffect(function () {
        if (!id)
            return;
        var onUnload = function () {
            if (finishedRef.current)
                return;
            try {
                var url = "/api/personal-tests/" + id + "/abandon";
                var data = new Blob([JSON.stringify({})], { type: 'application/json' });
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
    }, [id]);
    // Navigation locks
    useEffect(function () {
        var onNavAttempt = function (e) {
            e.preventDefault();
            setExitTarget(e.detail.target);
        };
        window.addEventListener('fikra:nav-attempt', onNavAttempt);
        return function () { return window.removeEventListener('fikra:nav-attempt', onNavAttempt); };
    }, []);
    useEffect(function () {
        window.history.pushState(null, '', window.location.href);
        var onPopState = function (e) {
            window.history.pushState(null, '', window.location.href);
            setExitTarget('/tarix');
        };
        window.addEventListener('popstate', onPopState);
        return function () { return window.removeEventListener('popstate', onPopState); };
    }, []);
    // Timer
    useEffect(function () {
        if (finishedRef.current)
            return;
        var t = setInterval(function () {
            setTimeLeft(function (s) {
                if (s <= 1) {
                    clearInterval(t);
                    handleFinish(true);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return function () { return clearInterval(t); };
    }, []);
    var fmt = function (s) {
        var m = Math.floor(s / 60);
        var ss = s % 60;
        return m + ":" + String(ss).padStart(2, '0');
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
                    return [4 /*yield*/, personalTestApi.answer(id, qIdx, i)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    setPendingAnswers(function (p) { return p.concat([{ qIdx: qIdx, selected: i }]); });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleFinish = useCallback(function (auto) {
        if (auto === void 0) { auto = false; }
        return __awaiter(_this, void 0, void 0, function () {
            var _i, pendingAnswers_1, ans, _a, finalAnswers, data, e_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (finishing || finishedRef.current)
                            return [2 /*return*/];
                        setFinishing(true);
                        finishedRef.current = true;
                        if (!(pendingAnswers.length > 0)) return [3 /*break*/, 6];
                        _i = 0, pendingAnswers_1 = pendingAnswers;
                        _b.label = 1;
                    case 1:
                        if (!(_i < pendingAnswers_1.length)) return [3 /*break*/, 6];
                        ans = pendingAnswers_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, personalTestApi.answer(id, ans.qIdx, ans.selected)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        finalAnswers = Object.entries(selected).map(function (_a) {
                            var qIdx = _a[0], sel = _a[1];
                            return ({
                                questionIdx: parseInt(qIdx),
                                selectedOption: sel
                            });
                        });
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, personalTestApi.finish(id, finalAnswers)];
                    case 8:
                        data = (_b.sent()).data;
                        try {
                            localStorage.removeItem("fikra_test_answers_" + id);
                        }
                        catch (_c) { }
                        navigate("/personal-tests/" + id + "/result", { state: data, replace: true });
                        return [3 /*break*/, 10];
                    case 9:
                        e_1 = _b.sent();
                        if (!auto)
                            toast.error('Yakunlashda xatolik. Internetni tekshiring.');
                        setFinishing(false);
                        finishedRef.current = false;
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    }, [id, finishing, navigate, toast, pendingAnswers, selected]);
    var confirmExit = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, target;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    finishedRef.current = true;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, personalTestApi.abandon(id)];
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
    var navigateTo = function (index) {
        if (index >= 0 && index < questions.length && index !== qIdx) {
            setQIdx(index);
            setAnimKey(function (k) { return k + 1; });
            triggerHaptic('light');
            setShowGrid(false);
        }
    };
    if (loading) {
        return (<div className="test-run-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse 1s infinite' }}>⏳</div>
        <div style={{ fontWeight: 600, color: 'var(--txt-2)' }}>Test holati tiklanmoqda...</div>
      </div>);
    }
    if (!id || !questions.length) {
        return (<div className="test-run-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>Test ma'lumotlari topilmadi</div>
        <button className="btn btn-primary" onClick={function () { return navigate('/ombor'); }}>Omborga qaytish</button>
      </div>);
    }
    var q = questions[qIdx];
    var total = questions.length;
    var isLast = qIdx === total - 1;
    var answered = Object.keys(selected).length;
    var progressPercent = (answered / total) * 100;
    return (<div className="test-run-layout">
      
      <div className="test-top-bar">
        <button onClick={function () { return setExitTarget('/ombor'); }} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0
    }}>⨉ Chiqish</button>
        
        <div style={{
        background: timeLeft < 60 ? 'rgba(255,95,126,0.15)' : 'rgba(255,255,255,0.05)',
        border: "1px solid " + (timeLeft < 60 ? 'var(--r)' : 'rgba(255,255,255,0.1)'),
        borderRadius: 100, padding: '6px 16px', fontFamily: 'monospace', fontWeight: 800,
        fontSize: 15, color: timeLeft < 60 ? 'var(--r)' : '#fff',
        boxShadow: timeLeft < 60 ? '0 0 10px rgba(255,95,126,0.3)' : 'none'
    }}>
          {fmt(timeLeft)}
        </div>

        <button onClick={function () { return setShowGrid(true); }} style={{
        background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0
    }}>
          {qIdx + 1}/{total} ☰
        </button>
      </div>
      
      <div className="test-progress-container">
        <div className="test-progress-bar" style={{ width: progressPercent + "%" }}/>
      </div>

      
      <div className="test-slide-container">
        <div key={animKey} className="test-slide-enter">
          
          <div className="test-topic-label">
            {state ? .subjectName : } {q.topic ? "\u00B7 " + q.topic : ''}
          </div>

          <div className="test-question-card">
            <RichText content={q.question} images={q.images}/>
          </div>

          <div className="test-options-grid">
            {q.options.map(function (opt, i) {
        var isSel = selected[qIdx] === i;
        return (<button key={i} onClick={function () { return pickAnswer(i); }} disabled={selected[qIdx] !== undefined} className={"test-option-btn " + (isSel ? 'selected' : '')}>
                  <div className="test-radio">
                    <div className="test-radio-inner"/>
                  </div>
                  <div style={{ flex: 1, paddingTop: 1 }}>
                    <RichText content={opt.replace(/^[A-D][).]\s*/i, '')} inline/>
                  </div>
                </button>);
    })}
          </div>

        </div>
      </div>

      
      <div className="test-bottom-nav">
        <button className="test-nav-btn prev" onClick={function () { return navigateTo(qIdx - 1); }} disabled={qIdx === 0}>← Oldingi</button>
        
        {!isLast ? (<button className="test-nav-btn next" onClick={function () { return navigateTo(qIdx + 1); }}>Keyingi →</button>) : (<button className="test-nav-btn finish" onClick={function () { return setFinishPrompt(true); }} disabled={finishing}>Yakunlash 🏁</button>)}
      </div>

      
      {showGrid && (<div className="test-grid-overlay" onClick={function () { return setShowGrid(false); }}>
          <div className="test-grid-sheet" onClick={function (e) { return e.stopPropagation(); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Savollar xaritasi</div>
              <button onClick={function () { return setShowGrid(false); }} style={{
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 50,
        width: 30, height: 30, color: '#fff', fontWeight: 800, cursor: 'pointer'
    }}>⨉</button>
            </div>
            
            <div className="test-grid-scroll">
              <div className="test-grid-bubbles">
                {questions.map(function (_, i) {
        var isAns = selected[i] !== undefined;
        var isCur = i === qIdx;
        var cls = 'test-bubble';
        if (isCur)
            cls += ' current';
        else if (isAns)
            cls += ' answered';
        return (<div key={i} className={cls} onClick={function () { return navigateTo(i); }}>
                      {i + 1}
                    </div>);
    })}
              </div>
            </div>
          </div>
        </div>)}

      
      {exitTarget && (<div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--f)', borderRadius: 24, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Testdan chiqasizmi?</div>
            <p style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 24 }}>Jarayon arxivlanadi, xohlagan payt qaytib davom ettirishingiz mumkin.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={function () { return setExitTarget(null); }} style={{ flex: 1 }}>Qolish</button>
              <button className="btn btn-danger" onClick={confirmExit} style={{ flex: 1 }}>Chiqish</button>
            </div>
          </div>
        </div>)}

      {finishPrompt && (<div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--f)', borderRadius: 24, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Testni yakunlaysizmi?</div>
            <p style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 24 }}>
              {answered < total ? "Hali " + (total - answered) + " ta savolga javob bermadingiz." : 'Barcha savollarga javob berdingiz!'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={function () { return setFinishPrompt(false); }} style={{ flex: 1 }}>Orqaga</button>
              <button className="btn btn-success" onClick={function () { return handleFinish(false); }} disabled={finishing} style={{ flex: 1 }}>
                {finishing ? '...' : 'Yakunlash'}
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
