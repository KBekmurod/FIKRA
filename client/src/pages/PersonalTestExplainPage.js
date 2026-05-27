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
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { streamJsonFetch } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import SubscriptionModal from '../components/SubscriptionModal';
import { useAppStore } from '../store';
import RichText from '../components/RichText';
import '../components/RichText.css';
export default function PersonalTestExplainPage() {
    var _this = this;
    var navigate = useNavigate();
    var id = useParams().id;
    var goBack = useGoBack("/personal-tests/" + id + "/result");
    var toast = useToast();
    var user = useAppStore().user;
    var _a = useState(false), subOpen = _a[0], setSubOpen = _a[1];
    var isFree = !user ? .effectivePlan || user.effectivePlan === 'free'
        :
    ;
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState([]), wrongs = _c[0], setWrongs = _c[1];
    var _d = useState(null), test = _d[0], setTest = _d[1];
    var _e = useState(false), generatingMini = _e[0], setGeneratingMini = _e[1];
    var _f = useState(null), folderInfo = _f[0], setFolderInfo = _f[1];
    useEffect(function () {
        if (!id)
            return;
        api.get("/api/personal-tests/" + id)
            .then(function (_a) {
            var data = _a.data;
            var t = data.test;
            setTest(t);
            // Xato javoblarni yig'amiz
            // QUSUR TUZATILDI: backend field nomi 'questionIdx' (qIdx emas)
            var ws = [];
            var _loop_1 = function (ans) {
                // Ikkala variantni qo'llab-quvvatlaymiz (backward compat)
                var ansIdx = ans.questionIdx ?  ? ans.qIdx
                    :
                    :
                ;
                if (!ans.isCorrect && ansIdx !== undefined) {
                    var q = t.questions.find(function (qq) { return qq.idx === ansIdx; });
                    if (q) {
                        ws.push({
                            qIdx: q.idx,
                            question: q.question,
                            options: q.options,
                            selected: ans.selectedOption ?  ? ans.selected :  : ,
                            correct: q.answer,
                            topic: q.topic,
                            aiExplanation: q.explanation
                        });
                    }
                }
            };
            for (var _i = 0, _b = (t.answers || []); _i < _b.length; _i++) {
                var ans = _b[_i];
                _loop_1(ans);
            }
            setWrongs(ws);
            if (t.folderId) {
                api.get("/api/folders/" + t.folderId).then(function (_a) {
                    var f = _a.data;
                    setFolderInfo(f.folder);
                })["catch"](function () { });
            }
        })["catch"](function () { return toast.error("Yuklab bo'lmadi"); })["finally"](function () { return setLoading(false); });
    }, [id]);
    // AI batafsil tushuntirish
    var requestAiExplain = function (idx) { return __awaiter(_this, void 0, void 0, function () {
        var data_1, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setWrongs(function (prev) { return prev.map(function (w) { return w.qIdx === idx ? __assign({}, w, { loadingAi: true }) : w; }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api.post("/api/personal-tests/" + id + "/explain", {
                            qIdx: idx
                        })];
                case 2:
                    data_1 = (_a.sent()).data;
                    setWrongs(function (prev) { return prev.map(function (w) {
                        return w.qIdx === idx
                            ? __assign({}, w, { aiExplanation: data_1.explanation, loadingAi: false }) : w;
                    }); });
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1 ? .response ? .data ? .error || "AI tushuntirish xato" :  :  : );
                    setWrongs(function (prev) { return prev.map(function (w) { return w.qIdx === idx ? __assign({}, w, { loadingAi: false }) : w; }); });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Mini-test yaratish (1 marta universal qoidasi):
    // - material test: folder.miniTestGenerated
    // - ai_blok/ai_free test: test.miniTestId
    var startMiniTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var hasMini, miniId, wrongAnswers, data, newTestId, e_2, errData, status_1, existingId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!id || !test)
                        return [2 /*return*/];
                    setGeneratingMini(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    hasMini = test.miniTestId || (folderInfo ? .miniTestId && folderInfo ? .miniTestGenerated :  : );
                    if (hasMini) {
                        miniId = test.miniTestId || folderInfo ? .miniTestId
                            :
                        ;
                        toast.info("Mini-test allaqachon yaratilgan");
                        navigate("/personal-tests/" + miniId + "/result");
                        return [2 /*return*/];
                    }
                    wrongAnswers = wrongs.map(function (w) { return ({
                        question: w.question,
                        options: w.options,
                        userAnswer: w.selected,
                        correctAnswer: w.correct,
                        topic: w.topic
                    }); });
                    return [4 /*yield*/, streamJsonFetch('/api/personal-tests/mini', {
                            sourceTestId: id,
                            subjectId: test.subjectId,
                            wrongAnswers: wrongAnswers
                        })
                        // QUSUR TUZATILDI: testId obyekt bo'lishi mumkin, string'ga aylantiramiz
                    ]; // streamJsonFetch uses SSE
                case 2:
                    data = (_a.sent()) // streamJsonFetch uses SSE
                    .data;
                    newTestId = typeof data.testId === 'object'
                        ? data.testId ? ._id || String(data.testId)
                            : data.testId
                        :
                    ;
                    navigate("/personal-tests/" + newTestId + "/run", {
                        state: {
                            testId: newTestId,
                            subjectId: data.subjectId,
                            subjectName: data.subjectName,
                            totalQuestions: data.totalQuestions,
                            durationSeconds: data.durationSeconds || data.totalQuestions * 60,
                            questions: data.questions,
                            folderId: test.folderId
                        }
                    });
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    errData = e_2 ? .response ? .data
                        :
                        :
                    ;
                    status_1 = e_2 ? .response ? .status
                        :
                        :
                    ;
                    // QUSUR TUZATILDI: 409 — mini-test allaqachon bor → mavjud testga yo'naltir
                    if (status_1 === 409 && errData ? .existingMiniTestId : ) {
                        existingId = typeof errData.existingMiniTestId === 'object'
                            ? errData.existingMiniTestId._id || String(errData.existingMiniTestId)
                            : errData.existingMiniTestId;
                        toast.info("Mini-test allaqachon yaratilgan");
                        navigate("/personal-tests/" + existingId + "/result", { replace: true });
                        return [2 /*return*/];
                    }
                    // Timeout xatosi — foydalanuvchi tushunadigan xabar
                    if (e_2 ? .code === 'ECONNABORTED' || e_2 ? .message ? .includes('timeout') :  :  : ) {
                        toast.error("AI hozir sekin javob bermoqda. Iltimos 30 soniyadan keyin tarixdan tekshiring — test allaqachon yaratilgan bo'lishi mumkin.");
                    }
                    else {
                        toast.error(errData ? .error || "Mini-test yaratishda xato" : );
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setGeneratingMini(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin" style={{ margin: '0 auto' }}/></div>;
    }
    if (wrongs.length === 0) {
        return (<>
        <div className="header">
          <button onClick={goBack} style={{
            background: 'none', border: 'none', color: 'var(--txt-2)',
            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
        }}>←</button>
          <div className="header-logo" style={{ fontSize: 15 }}>🎯 Xatolar bilan rivojlanish</div>
        </div>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <p style={{ marginTop: 12, fontSize: 14, color: 'var(--txt-2)' }}>
            A'lo! Sizda xato javob yo'q.
          </p>
        </div>
      </>);
    }
    var miniAlreadyGenerated = !!test ? .miniTestId || !!folderInfo ? .miniTestGenerated
        :
        :
    ;
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>🎯 Xatolar bilan rivojlanish</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <div style={{
        padding: 12,
        background: 'rgba(255,95,126,0.08)',
        border: '1px solid rgba(255,95,126,0.25)',
        borderRadius: 10,
        fontSize: 11.5,
        color: 'var(--txt-2)',
        marginBottom: 14,
        lineHeight: 1.5
    }}>
          📋 Quyida <strong>{wrongs.length} ta xato</strong> javob.
          AI har biri uchun tushuntirish berishi mumkin, so'ngra
          <strong> mini-test </strong> ishlasangiz xatolaringizni mustahkamlaysiz.
        </div>

        {isFree && (<div style={{
        background: 'linear-gradient(90deg, rgba(255,160,0,0.1), rgba(255,100,0,0.1))',
        border: '1px solid rgba(255,160,0,0.3)',
        borderRadius: 10, padding: 12, marginBottom: 14,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>Tushuntirishlarni cheksiz ko'ring 🚀</div>
              <div style={{ fontSize: 10.5, color: 'var(--txt-2)' }}>Pro obunaga o'ting va limitlarsiz tahlil qiling</div>
            </div>
            <button onClick={function () { return setSubOpen(true); }} style={{
        background: 'var(--y)', color: '#000', border: 'none',
        padding: '6px 10px', borderRadius: 100, fontSize: 10, fontWeight: 800, cursor: 'pointer'
    }}>Sotib olish</button>
          </div>)}

        
        <div style={{ display: 'grid', gap: 12 }}>
          {wrongs.map(function (w) { return (<div key={w.qIdx} style={{
        background: 'var(--s1)',
        border: '1px solid rgba(255,95,126,0.25)',
        borderRadius: 12,
        padding: 14
    }}>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, marginBottom: 6 }}>
                SAVOL #{w.qIdx + 1}{w.topic ? " \u00B7 " + w.topic : ''}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                <RichText content={w.question} images={w.images}/>
              </div>

              <div style={{ display: 'grid', gap: 5, marginBottom: 10 }}>
                {w.options.map(function (opt, i) {
        var isC = i === w.correct;
        var isU = i === w.selected;
        var bg = 'var(--s2)';
        var border = '1px solid var(--f)';
        var color = 'var(--txt-2)';
        if (isC) {
            bg = 'rgba(0,212,170,0.12)';
            border = '1px solid rgba(0,212,170,0.35)';
            color = 'var(--g)';
        }
        else if (isU) {
            bg = 'rgba(255,95,126,0.12)';
            border = '1px solid rgba(255,95,126,0.35)';
            color = 'var(--r)';
        }
        return (<div key={i} style={{
            background: bg, border: border, color: color,
            borderRadius: 8, padding: '7px 10px',
            fontSize: 12, display: 'flex', gap: 8
        }}>
                      <span style={{ fontWeight: 800, minWidth: 16 }}>{['A', 'B', 'C', 'D'][i]}</span>
                      <span style={{ flex: 1 }}><RichText content={opt.replace(/^[A-D][).\\s]*/i, '')} inline/></span>
                      {isC && <span style={{ fontSize: 11 }}>✓ to'g'ri</span>}
                      {isU && !isC && <span style={{ fontSize: 11 }}>← siz</span>}
                    </div>);
    })}
              </div>

              {w.aiExplanation ? (<div style={{
        background: 'rgba(123,104,238,0.08)',
        border: '1px solid rgba(123,104,238,0.2)',
        borderRadius: 8,
        padding: 10,
        fontSize: 11.5,
        color: 'var(--txt-2)',
        lineHeight: 1.55
    }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--acc-l)', marginBottom: 4, letterSpacing: 0.5 }}>
                    🤖 AI TUSHUNTIRISHI
                  </div>
                  <RichText content={w.aiExplanation} inline/>
                </div>) : (<button onClick={function () { return requestAiExplain(w.qIdx); }} disabled={w.loadingAi} style={{
        background: 'rgba(123,104,238,0.08)',
        border: '1px solid rgba(123,104,238,0.2)',
        color: 'var(--acc-l)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 11.5,
        fontWeight: 700,
        cursor: 'pointer',
        width: '100%'
    }}>
                  {w.loadingAi ? '⏳ AI yozmoqda...' : '🤖 AI batafsil tushuntirsin'}
                </button>)}
            </div>); })}
        </div>

        
        <div style={{
        marginTop: 18,
        padding: 14,
        background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(0,212,170,0.05))',
        border: '1px solid rgba(123,104,238,0.3)',
        borderRadius: 14
    }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            🎯 Mini-test orqali mustahkamlash
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 10, lineHeight: 1.5 }}>
            AI sizning xatolaringizdan o'xshash savollar yaratadi va siz ishlaysiz.
            {miniAlreadyGenerated && <> <strong style={{ color: 'var(--y)' }}>Allaqachon yaratilgan</strong> — qayta yaratib bo'lmaydi.</>}
          </div>
          <button onClick={startMiniTest} disabled={generatingMini || miniAlreadyGenerated} style={{
        width: '100%',
        background: miniAlreadyGenerated ? 'var(--s2)' : 'linear-gradient(135deg, var(--acc), var(--acc-l))',
        color: miniAlreadyGenerated ? 'var(--txt-3)' : 'white',
        border: 'none',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 13,
        fontWeight: 800,
        cursor: (generatingMini || miniAlreadyGenerated) ? 'default' : 'pointer',
        opacity: generatingMini ? 0.6 : 1
    }}>
            {generatingMini
        ? '⏳ Yaratilmoqda...'
        : miniAlreadyGenerated
            ? '✓ Allaqachon yaratilgan'
            : '🚀 Mini-test boshlash'}
          </button>
        </div>

        <div style={{ height: 30 }}/>
      </div>
      
      <SubscriptionModal open={subOpen} onClose={function () { return setSubOpen(false); }}/>
    </>);
}
