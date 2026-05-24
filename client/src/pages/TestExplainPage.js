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
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import RichText from '../components/RichText';
import '../components/RichText.css';
export default function TestExplainPage() {
    var _this = this;
    var navigate = useNavigate();
    var _a = useParams(), sessionId = _a.sessionId, subjectId = _a.subjectId;
    var goBack = useGoBack(sessionId ? "/test-result/" + sessionId : '/tarix');
    var toast = useToast();
    var location = useLocation();
    var _b = useState([]), overview = _b[0], setOverview = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(false), miniGenerating = _d[0], setMiniGenerating = _d[1];
    // Bitta fan tushuntirilayotgan bo'lsa
    var _e = useState(null), currentAnswer = _e[0], setCurrentAnswer = _e[1];
    var _f = useState(null), explanation = _f[0], setExplanation = _f[1];
    var _g = useState(false), loadingExplain = _g[0], setLoadingExplain = _g[1];
    var _h = useState(false), explainUsed = _h[0], setExplainUsed = _h[1];
    var isOverview = subjectId === '_overview';
    useEffect(function () {
        if (!sessionId)
            return;
        if (isOverview) {
            // Sessiya javoblarini olib, xato bo'lganlarini fan bo'yicha guruhlash
            examApi.review(sessionId)
                .then(function (_a) {
                var data = _a.data;
                var wrongs = (data.answers || []).filter(function (a) { return !a.isCorrect && a.selectedOption !== null; });
                var grouped = {};
                for (var _i = 0, wrongs_1 = wrongs; _i < wrongs_1.length; _i++) {
                    var a = wrongs_1[_i];
                    var sid = a.subject || a.subjectId;
                    if (!grouped[sid]) {
                        grouped[sid] = {
                            subjectId: sid,
                            subjectName: a.subjectName || sid,
                            block: a.block || 'mutaxassislik',
                            count: 0,
                            answers: []
                        };
                    }
                    grouped[sid].count++;
                    grouped[sid].answers.push(a);
                }
                setOverview(Object.values(grouped));
            })["catch"](function () { return toast.error("Yuklanmadi"); })["finally"](function () { return setLoading(false); });
        }
        else {
            // Aniq fan uchun tushuntirish — sessiyadagi xato javoblardan birinchisini ochish
            examApi.review(sessionId)
                .then(function (_a) {
                var data = _a.data;
                var wrongs = (data.answers || [])
                    .filter(function (a) { return !a.isCorrect && (a.subject === subjectId || a.subjectId === subjectId); });
                if (wrongs.length > 0) {
                    setCurrentAnswer(wrongs[0]);
                    triggerExplain(wrongs[0]._id);
                }
            })["catch"](function () { return toast.error("Yuklanmadi"); })["finally"](function () { return setLoading(false); });
        }
    }, [sessionId, subjectId]);
    var triggerExplain = function (answerId) { return __awaiter(_this, void 0, void 0, function () {
        var data, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoadingExplain(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, examApi.cabinetExplain(answerId)];
                case 2:
                    data = (_a.sent()).data;
                    setExplanation(data);
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    if (e_1 ? .response ? .data ? .code === 'EXPLAIN_ALREADY_USED' :  :  : ) {
                        setExplainUsed(true);
                        toast.info('Bu fan uchun AI tushuntirish allaqachon olingan');
                    }
                    else {
                        toast.error("AI tushuntirish olishda xatolik");
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setLoadingExplain(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var generateMiniTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var data, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!sessionId)
                        return [2 /*return*/];
                    setMiniGenerating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, examApi.cabinetMiniTest(undefined, 30, sessionId)
                        // Mini-test sessiyasiga o'tish
                    ];
                case 2:
                    data = (_a.sent()).data;
                    // Mini-test sessiyasiga o'tish
                    navigate("/test-run/" + data.sessionId, { state: __assign({}, data, { isMini: true }) });
                    return [3 /*break*/, 5];
                case 3:
                    e_2 = _a.sent();
                    if (e_2 ? .response ? .data ? .code === 'MINI_TEST_ALREADY_USED' :  :  : ) {
                        toast.info('Mini-test allaqachon yaratilgan');
                    }
                    else {
                        toast.error(e_2 ? .response ? .data ? .error || "Mini-test yaratishda xatolik" :  :  : );
                    }
                    return [3 /*break*/, 5];
                case 4:
                    setMiniGenerating(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin"/></div>;
    }
    // ─── OVERVIEW — Fanlar ro'yxati ─────────────────────────────────────────
    if (isOverview) {
        var majburiy = overview.filter(function (o) { return ['uztil', 'math', 'tarix'].includes(o.subjectId); });
        var mutaxassislik = overview.filter(function (o) { return !['uztil', 'math', 'tarix'].includes(o.subjectId); });
        return (<>
        <div className="header">
          <button onClick={goBack} style={{
            background: 'none', border: 'none', color: 'var(--txt-2)',
            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
        }}>←</button>
          <div className="header-logo" style={{ fontSize: 16 }}>🎯 Xatolar tahlili</div>
        </div>

        <div style={{ padding: '8px 20px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }}>
            Tushuntirishni ko'rmoqchi bo'lgan fanni bosing. AI batafsil tahlil qiladi (har fan uchun <strong>1 marta</strong>).
          </p>

          {majburiy.length > 0 && (<>
              <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--g)', letterSpacing: 0.5, margin: '14px 0 8px' }}>
                📌 MAJBURIY FANLARDAGI XATOLAR
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {majburiy.map(function (s) { return (<SubjectCard key={s.subjectId} subj={s} onClick={function () { return navigate("/test-explain/" + sessionId + "/" + s.subjectId); }}/>); })}
              </div>
            </>)}

          {mutaxassislik.length > 0 && (<>
              <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--acc-l)', letterSpacing: 0.5, margin: '18px 0 8px' }}>
                ⭐ MUTAXASSISLIK FANLARIDAGI XATOLAR
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {mutaxassislik.map(function (s) { return (<SubjectCard key={s.subjectId} subj={s} onClick={function () { return navigate("/test-explain/" + sessionId + "/" + s.subjectId); }}/>); })}
              </div>
            </>)}

          
          <div style={{ marginTop: 24, marginBottom: 20 }}>
            <button onClick={generateMiniTest} disabled={miniGenerating} style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--y), #fbbf24)',
            color: '#0a0a14',
            border: 'none',
            borderRadius: 14,
            padding: '14px 16px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
        }}>
              {miniGenerating ? '⏳ Mini-test yaratilmoqda...' : '🔄 Mini-test yaratish (xatolardan)'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 6, textAlign: 'center' }}>
              Majburiy fan: 5 ta, mutaxassislik: 15 ta · <strong>1 marta</strong>
            </div>
          </div>
        </div>
      </>);
    }
    // ─── BITTA FAN UCHUN TUSHUNTIRISH ─────────────────────────────────────
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>
          🎯 {currentAnswer ? .subjectName || 'Tushuntirish' : }
        </div>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        {!currentAnswer && (<div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <p>Bu fanda xato yo'q</p>
          </div>)}

        {currentAnswer && (<>
            
            <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10
    }}>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>
                SAVOL {currentAnswer.topic ? "\u00B7 " + currentAnswer.topic : ''}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <RichText content={currentAnswer.questionText || currentAnswer.question}/>
              </div>
            </div>

            
            <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
              {(currentAnswer.questionOptions || currentAnswer.options || []).map(function (opt, i) {
        var correctIdx = currentAnswer.correctAnswer ?  ? currentAnswer.correctIndex
            :
            :
        ;
        var isCorrect = i === correctIdx;
        var isUser = i === currentAnswer.selectedOption;
        var bg = 'var(--s2)', border = 'var(--f)', label = '';
        if (isCorrect) {
            bg = 'rgba(0,212,170,0.12)';
            border = 'var(--g)';
            label = "✓ TO'G'RI";
        }
        else if (isUser) {
            bg = 'rgba(255,95,126,0.1)';
            border = 'var(--r)';
            label = '✗ Siz tanladingiz';
        }
        return (<div key={i} style={{
            padding: '10px 12px', background: bg,
            border: "1.5px solid " + border,
            borderRadius: 10, fontSize: 12, lineHeight: 1.5
        }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontWeight: 800, color: 'var(--txt-3)', flexShrink: 0 }}>
                        {['A', 'B', 'C', 'D'][i]}
                      </span>
                      <span style={{ flex: 1 }}><RichText content={opt} inline/></span>
                      {label && (<span style={{
            fontSize: 9, fontWeight: 800,
            color: isCorrect ? 'var(--g)' : 'var(--r)',
            whiteSpace: 'nowrap'
        }}>{label}</span>)}
                    </div>
                  </div>);
    })}
            </div>

            
            {loadingExplain && (<div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center'
    }}>
                <div className="spin" style={{ margin: '0 auto 10px' }}/>
                <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>
                  AI tahlil qilmoqda...
                </div>
              </div>)}

            
            {explainUsed && !explanation && (<div style={{
        background: 'rgba(255,204,68,0.08)',
        border: '1px solid rgba(255,204,68,0.25)',
        borderRadius: 12,
        padding: 14,
        fontSize: 12,
        color: 'var(--txt-2)'
    }}>
                ⚠️ Bu test va fan uchun AI tushuntirish allaqachon olingan.
                Boshqa test ishlab keyingisidan foydalanishingiz mumkin.
              </div>)}

            
            {explanation && (<div style={{ display: 'grid', gap: 10 }}>
                <ContextCard icon="📍" title="MAVZU" color="#3b82f6" bgColor="rgba(59, 130, 246, 0.08)" content={currentAnswer.topic || explanation.subjectName}/>
                <ContextCard icon="🧠" title="NEGA TO'G'RI?" color="#10b981" bgColor="rgba(16, 185, 129, 0.08)" content={extractSection(explanation.explanation, 'nega') || explanation.explanation}/>
                <ContextCard icon="⚠️" title="CHALG'ITUVCHI USULLAR" color="#f59e0b" bgColor="rgba(245, 158, 11, 0.08)" content={extractSection(explanation.explanation, 'chalg') || "Bu turdagi savollarda noto'g'ri javoblar haqqoniy ko'rinadi. Mavzuni chuqurroq o'rganib, asosiy formulalarga e'tibor bering."}/>
                <ContextCard icon="💡" title="XULOSA" color="#a78bfa" bgColor="rgba(167, 139, 250, 0.08)" content={extractSection(explanation.explanation, 'xulosa') || "Bu savol orqali o'rgangan asosiy g'oyani eslab qoling — kelajakdagi testlarda yordam beradi."}/>
              </div>)}
          </>)}
      </div>
    </>);
}
// ─── Subject Card (overview uchun) ──────────────────────────────────────
function SubjectCard(_a) {
    var subj = _a.subj, onClick = _a.onClick;
    return (<button onClick={onClick} style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'left'
    }}>
      <div style={{
        background: 'rgba(255,95,126,0.12)',
        border: '1px solid rgba(255,95,126,0.25)',
        borderRadius: 100,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 800,
        color: 'var(--r)'
    }}>
        {subj.count}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{subj.subjectName}</div>
        <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }}>
          {subj.count} ta xato · AI tushuntirish uchun bosing
        </div>
      </div>
      <div style={{ fontSize: 18, color: 'var(--acc-l)' }}>→</div>
    </button>);
}
// ─── Kontekstli karta (rangli) ──────────────────────────────────────────
function ContextCard(_a) {
    var icon = _a.icon, title = _a.title, color = _a.color, bgColor = _a.bgColor, content = _a.content;
    return (<div style={{
        background: bgColor,
        border: "1px solid " + color + "40",
        borderRadius: 12,
        padding: 14
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: color, letterSpacing: 0.5 }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--txt)' }}>
        <RichText content={content || ''}/>
      </div>
    </div>);
}
// AI matnidan bo'lim ajratish (oddiy heuristic)
function extractSection(text, keyword) {
    if (!text)
        return null;
    var lines = text.split('\n');
    var idx = lines.findIndex(function (l) { return l.toLowerCase().includes(keyword); });
    if (idx === -1)
        return null;
    // Keyingi 1-3 qatorni olish
    return lines.slice(idx, idx + 3).join('\n').trim() || null;
}
