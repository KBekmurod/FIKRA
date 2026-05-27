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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { streamJsonFetch } from '../api/endpoints';
import { SUBJECTS } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function OmborFolderPage() {
    var _this = this;
    var navigate = useNavigate();
    var folderId = useParams().folderId;
    var searchParams = useSearchParams()[0];
    var isFresh = searchParams.get('fresh') === '1';
    var toast = useToast();
    var _a = useState(null), data = _a[0], setData = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), generating = _c[0], setGenerating = _c[1];
    var _d = useState(false), starting = _d[0], setStarting = _d[1];
    // Modal: yetarlilik tekshirish (3 ta tanlov)
    var _e = useState(null), sufficiency = _e[0], setSufficiency = _e[1];
    var _f = useState(false), confirmDelete = _f[0], setConfirmDelete = _f[1];
    var goBack = useGoBack(data ? .folder ? .subjectId
        ? "/ombor/" + data.folder.subjectId + "?context=" + (data.folder.context || 'majburiy')
        : '/ombor'
        :
        :
    );
    var load = function () {
        if (!folderId)
            return;
        setLoading(true);
        api.get("/api/folders/" + folderId)
            .then(function (_a) {
            var data = _a.data;
            return setData(data);
        })["catch"](function (e) {
            if (e.response ? .status === 404 : ) {
                toast.error("Ushbu papka o'chirilgan yoki topilmadi");
                navigate('/tarix');
            }
            else {
                toast.error("Yuklab bo'lmadi");
            }
        })["finally"](function () { return setLoading(false); });
    };
    useEffect(function () { load(); }, [folderId]);
    // Sahifa ochilgan zahoti, agar yangi (fresh) va test yo'q bo'lsa — yetarlilikni tekshiramiz
    useEffect(function () {
        if (!isFresh || !data || !folderId)
            return;
        if (data.folder.testStatus === 'has_test')
            return;
        api.post("/api/folders/" + folderId + "/check-sufficiency")
            .then(function (_a) {
            var chk = _a.data;
            if (chk.isSufficient) {
                // Avtomatik generatsiya
                triggerGenerate('standard');
            }
            else if (chk.canAiFill) {
                // Modal so'rov
                setSufficiency(chk);
            }
            else if (chk.isTooSmall) {
                setSufficiency(chk);
            }
        })["catch"](function () { });
    }, [isFresh, data]);
    var triggerGenerate = function (opt) { return __awaiter(_this, void 0, void 0, function () {
        var r, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!folderId)
                        return [2 /*return*/];
                    setSufficiency(null);
                    setGenerating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, streamJsonFetch("/api/folders/" + folderId + "/generate", { opt: opt })];
                case 2:
                    r = (_a.sent()).data;
                    toast.success('Test yaratildi!');
                    load();
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    toast.error(e_1.response ? .data ? .error || 'Test yaratishda xato' :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setGenerating(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // ─── BEST PRACTICE: tugmani bosganda avval yetarlilikni tekshiramiz ─────
    // Yetarli bo'lsa darrov generate, yetarli emas bo'lsa modal so'rov chiqaramiz
    // (xato emas — chunki foydalanuvchi tanlash imkoniga ega bo'lishi kerak)
    var handleGenerateClick = function () { return __awaiter(_this, void 0, void 0, function () {
        var chk, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!folderId || generating)
                        return [2 /*return*/];
                    setGenerating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api.post("/api/folders/" + folderId + "/check-sufficiency")];
                case 2:
                    chk = (_a.sent()).data;
                    setGenerating(false);
                    if (chk.isSufficient) {
                        // Yetarli — darrov generatsiya
                        triggerGenerate('standard');
                    }
                    else if (chk.canAiFill || chk.isTooSmall) {
                        // Yetarli emas — modal so'rov ko'rsatamiz (xato emas!)
                        setSufficiency(chk);
                    }
                    else {
                        toast.error("Yetarlilik tekshiruvi muvaffaqiyatsiz");
                    }
                    return [3 /*break*/, 4];
                case 3:
                    e_2 = _a.sent();
                    setGenerating(false);
                    toast.error(e_2.response ? .data ? .error || "Tekshirishda xato" :  : );
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var startTest = function () { return __awaiter(_this, void 0, void 0, function () {
        var r, e_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!folderId)
                        return [2 /*return*/];
                    setStarting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, api.post("/api/folders/" + folderId + "/retry")];
                case 2:
                    r = (_a.sent()).data;
                    navigate("/personal-tests/" + r.testId + "/run", {
                        state: {
                            testId: r.testId,
                            subjectId: r.subjectId,
                            subjectName: r.subjectName,
                            totalQuestions: r.totalQuestions,
                            durationSeconds: r.durationSeconds,
                            questions: r.questions,
                            folderId: r.folderId
                        }
                    });
                    return [3 /*break*/, 5];
                case 3:
                    e_3 = _a.sent();
                    toast.error(e_3.response ? .data ? .error || 'Test boshlashda xato' :  : );
                    return [3 /*break*/, 5];
                case 4:
                    setStarting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var deleteFolder = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!folderId)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, api["delete"]("/api/folders/" + folderId)];
                case 2:
                    _b.sent();
                    toast.success("Papka o'chirildi");
                    navigate("/ombor/" + (data ? .folder.subjectId : ) + "?context=" + (data ? .folder.context : ));
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    toast.error("O'chirishda xato");
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    if (loading || !data) {
        return (<div style={{ padding: 30 }}>
        <div className="skel-card"/>
      </div>);
    }
    var folder = data.folder, attempts = data.attempts;
    var subj = SUBJECTS[folder.subjectId];
    var materials = folder.materials || [];
    var hasTest = folder.testStatus === 'has_test';
    var isGenerating = folder.testStatus === 'generating' || generating;
    var standardCount = folder.testStandardCount;
    var ctx = folder.context;
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{
        fontSize: 13,
        flex: 1,
        minWidth: 0,
        lineHeight: 1.3,
        // 2 qatorga sig'dirish — uzun nomlar yo'qolmaydi
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 2,
        overflow: 'hidden',
        wordBreak: 'break-word'
    }}>
          {subj ? .icon : } {folder.title}
        </div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        
        <div style={{
        display: 'inline-block',
        padding: '4px 12px',
        background: ctx === 'majburiy' ? 'rgba(0,212,170,0.12)' : 'rgba(123,104,238,0.12)',
        border: "1px solid " + (ctx === 'majburiy' ? 'rgba(0,212,170,0.3)' : 'rgba(123,104,238,0.3)'),
        borderRadius: 100,
        fontSize: 10,
        fontWeight: 800,
        color: ctx === 'majburiy' ? 'var(--g)' : 'var(--acc-l)',
        marginBottom: 12
    }}>
          {ctx === 'majburiy' ? '📌 Majburiy' : '⭐ Mutaxassislik'} · {standardCount} savol
        </div>

        
        {folder.stats.attemptsCount > 0 && (<div className="tilt-card glass" style={{
        padding: 14,
        borderRadius: 12,
        marginBottom: 14
    }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
              📊 BU PAPKA STATISTIKASI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <StatBox label="Urinishlar" value={folder.stats.attemptsCount} color="var(--acc-l)"/>
              <StatBox label="Eng yaxshi" value={folder.stats.bestScore + "%"} color="var(--g)"/>
              <StatBox label="O'rtacha" value={folder.stats.avgScore + "%"} color="var(--y)"/>
            </div>
          </div>)}

        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5 }}>
            📄 MATERIALLAR ({materials.length})
          </div>
        </div>

        {materials.length === 0 ? (<div style={{
        padding: 20, textAlign: 'center',
        background: 'var(--s1)', border: '1px dashed var(--f)', borderRadius: 12, marginBottom: 12
    }}>
            <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>Papkada material yo'q</div>
          </div>) : (<div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            {materials.map(function (m) { return (<div key={m._id} className="tilt-card glass" style={{
        padding: 12,
        borderRadius: 12
    }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
        fontWeight: 700, fontSize: 13, lineHeight: 1.4,
        display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden'
    }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)', background: 'var(--s2)', padding: '2px 6px', borderRadius: 4 }}>
                    {m.source === 'text' ? 'Matn' : m.source === 'ocr' ? 'Rasm' : 'Fayl'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{m.charCount.toLocaleString()} belgi</div>
                  <button onClick={function () { return navigate("/materials/" + m._id + "/edit"); }} style={{ background: 'none', border: 'none', color: 'var(--acc-l)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>✏️ Tahrir</button>
                </div>
              </div>); })}
          </div>)}

        <button onClick={function () { return navigate("/ombor/folder/" + folderId + "/add"); }} style={{
        width: '100%',
        background: 'rgba(123,104,238,0.1)',
        border: '1px solid rgba(123,104,238,0.25)',
        color: 'var(--acc-l)',
        borderRadius: 12,
        padding: '12px',
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
        marginBottom: 20
    }}>➕ Yangi material qo'shish</button>

        
        <div style={{
        padding: 14,
        background: hasTest ? 'var(--s1)' : 'rgba(255,204,68,0.08)',
        border: "1px solid " + (hasTest ? 'var(--f)' : 'rgba(255,204,68,0.25)'),
        borderRadius: 12,
        marginBottom: 12
    }}>
          {!hasTest && !isGenerating && (<>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--y)' }}>⚠️ Test hali yaratilmagan</div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 4, lineHeight: 1.5, marginBottom: 10 }}>
                AI papkadagi barcha materiallarni birlashtirib {standardCount} ta test savol yaratadi.
              </div>
            </>)}
          {hasTest && !isGenerating && (<div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5, marginBottom: 10 }}>
              Yana ko'proq savollar kerakmi? AI barcha materiallarni o'qib, yana <strong>mutlaqo yangi {standardCount} ta test savol</strong> tuza oladi!
            </div>)}
          
          {!isGenerating && (<button onClick={handleGenerateClick} disabled={generating} className="btn btn-primary btn-block">
              {generating ? '⏳ Tekshirilmoqda...' : hasTest ? '✨ Yangi test generatsiya qilish' : '🤖 AI test yaratish'}
            </button>)}
        </div>

        {isGenerating && (<div style={{
        padding: 18, textAlign: 'center',
        background: 'rgba(123,104,238,0.08)',
        border: '1px solid rgba(123,104,238,0.25)',
        borderRadius: 12,
        marginBottom: 12
    }}>
            <div className="spin" style={{ margin: '0 auto 10px' }}/>
            <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>
              AI {standardCount} ta test yaratmoqda... Bu 20-40 soniya davom etishi mumkin.
            </div>
          </div>)}

        {hasTest && (<>
            <button onClick={startTest} disabled={starting} style={{
        width: '100%',
        background: 'linear-gradient(135deg, var(--g), #00b08e)',
        color: '#0a0a14',
        border: 'none',
        borderRadius: 14,
        padding: '16px 18px',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer',
        marginBottom: 12
    }}>
              {starting ? '⏳ Boshlanmoqda...' : "\uD83D\uDD04 Aynan oxirgi testni qayta ishlash (" + standardCount + " ta savol)"}
            </button>
            <button onClick={function () { return navigate("/ombor/folder/" + folderId + "/flash"); }} className="tilt-card" style={{
        width: '100%',
        background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
        color: '#fff',
        border: 'none',
        borderRadius: 14,
        padding: '16px 18px',
        fontSize: 14,
        fontWeight: 800,
        cursor: 'pointer',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    }}>
              ⚡ FIKRA Flash (Qisqa Takrorlash)
            </button>
          </>)}

        
        {attempts.length > 0 && (<>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, margin: '14px 0 8px' }}>
              📈 URINISHLAR TARIXI ({attempts.length})
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {attempts.slice(0, 5).map(function (a, i) {
        var pct = a.scorePercent || 0;
        // Safe ID
        var attemptId = typeof a._id === 'object' ? a._id._id || String(a._id) : a._id;
        var isMini = a.testType === 'mini';
        var badgeColor = isMini ? 'var(--y)' : 'var(--acc-l)';
        var badgeBg = isMini ? 'rgba(255,204,68,0.12)' : 'rgba(123,104,238,0.12)';
        return (<button key={attemptId} onClick={function () { return navigate("/personal-tests/" + attemptId + "/result"); }} style={{
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', color: 'var(--txt)', textAlign: 'left'
        }}>
                    <span style={{
            fontSize: 9, fontWeight: 800,
            padding: '2px 6px', borderRadius: 100,
            background: badgeBg, color: badgeColor,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap'
        }}>
                      {isMini ? '🎯 MINI' : '🤖 AI'}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 700, minWidth: 24 }}>
                      #{attempts.length - i}
                    </div>
                    <div style={{ flex: 1, fontSize: 10.5, color: 'var(--txt-2)' }}>
                      {new Date(a.endTime || a.createdAt).toLocaleString('uz-UZ', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        })}
                    </div>
                    <div style={{
            fontWeight: 800, fontSize: 13,
            color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)'
        }}>{pct}%</div>
                  </button>);
    })}
            </div>
          </>)}

        
        <button onClick={function () { return setConfirmDelete(true); }} style={{
        width: '100%',
        background: 'none',
        border: '1px solid rgba(255,95,126,0.25)',
        color: 'var(--r)',
        borderRadius: 10,
        padding: '10px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: 24
    }}>
          🗑 Papkani o'chirish
        </button>

        <div style={{ height: 24 }}/>
      </div>

      
      {sufficiency && (<div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
    }}>
          <div style={{
        background: 'var(--s1)', border: '1px solid var(--f)',
        borderRadius: 18, padding: 22, maxWidth: 360, width: '100%'
    }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
              {sufficiency.isTooSmall ? 'Material juda kichik' : 'Material yetarli emas'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: 14 }}>
              Sifatli <strong>{sufficiency.standardCount} ta test</strong> uchun{' '}
              <strong>~{sufficiency.requiredChars.toLocaleString()}</strong> belgi kerak.
              <br />
              Sizda: <strong>{sufficiency.charCount.toLocaleString()}</strong> belgi.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <button onClick={function () {
        setSufficiency(null);
        navigate("/ombor/folder/" + folderId + "/add");
    }} className="btn btn-primary btn-block">➕ Yana yangi material qo'shaman</button>
              {sufficiency.canAiFill && (<button onClick={function () { return triggerGenerate('ai_fill'); }} style={{
        background: 'rgba(255,204,68,0.15)',
        border: '1.5px solid var(--y)',
        color: 'var(--y)',
        fontWeight: 700, fontSize: 13,
        padding: '11px 14px', borderRadius: 10, cursor: 'pointer'
    }}>🤖 AI o'zi yetkazib bersin (sifat biroz pasayadi)</button>)}
              <button onClick={function () { return setSufficiency(null); }} className="btn btn-ghost btn-block">
                ✗ Hozircha bekor
              </button>
            </div>
          </div>
        </div>)}

      
      {confirmDelete && (<div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
    }}>
          <div style={{
        background: 'var(--s1)', border: '1px solid var(--f)',
        borderRadius: 18, padding: 22, maxWidth: 340, width: '100%'
    }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🗑</div>
            <div style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
              Papkani o'chirasizmi?
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: 14 }}>
              Material va test o'chiriladi. Bu amal qaytarilmaydi.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={function () { return setConfirmDelete(false); }} className="btn btn-ghost btn-block">Bekor</button>
              <button onClick={deleteFolder} style={{
        flex: 1,
        background: 'rgba(255,95,126,0.15)',
        border: '1.5px solid var(--r)',
        color: 'var(--r)',
        fontWeight: 700, fontSize: 13,
        padding: '11px 14px', borderRadius: 10, cursor: 'pointer'
    }}>O'chirish</button>
            </div>
          </div>
        </div>)}
    </>);
}
function StatBox(_a) {
    var label = _a.label, value = _a.value, color = _a.color;
    return (<div style={{
        background: 'var(--s2)',
        borderRadius: 8,
        padding: '8px 6px',
        textAlign: 'center'
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: color }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 2 }}>{label}</div>
    </div>);
}
