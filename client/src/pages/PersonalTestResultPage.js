var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { SUBJECTS, GRADE_META, versionToGrade, versionInGrade } from '../constants/subjects';
export default function PersonalTestResultPage() {
    var navigate = useNavigate();
    var id = useParams().id;
    var location = useLocation();
    var toast = useToast();
    var initial = location.state;
    var _a = useState(initial), state = _a[0], setState = _a[1];
    var _b = useState(!initial), loading = _b[0], setLoading = _b[1];
    var _c = useState(''), folderTitle = _c[0], setFolderTitle = _c[1];
    var _d = useState(0), wrongCount = _d[0], setWrongCount = _d[1];
    var _e = useState(false), miniGenerated = _e[0], setMiniGenerated = _e[1];
    var _f = useState(null), miniTestData = _f[0], setMiniTestData = _f[1];
    var _g = useState([]), breakdown = _g[0], setBreakdown = _g[1];
    var _h = useState(null), test = _h[0], setTest = _h[1];
    useEffect(function () {
        if (!id)
            return;
        setLoading(true);
        api.get("/api/personal-tests/" + id)
            .then(function (_a) {
            var data = _a.data;
            var t = data.test;
            setTest(t);
            setWrongCount(t.totalQuestions - t.totalCorrect);
            // Agar state yo'q bo'lsa (tarixdan kelgan)
            if (!state) {
                setState({
                    testId: t._id,
                    subjectId: t.subjectId,
                    subjectName: t.subjectName,
                    testType: t.testType,
                    folderId: t.folderId || null,
                    totalCorrect: t.totalCorrect,
                    totalQuestions: t.totalQuestions,
                    scorePercent: t.scorePercent,
                    level: null
                });
            }
            // Helper: id'ni xavfsiz string'ga aylantirish
            var safeId = function (id) {
                if (!id)
                    return null;
                if (typeof id === 'string')
                    return id;
                if (typeof id === 'object') {
                    return id._id ? String(id._id) : (id.toString ? id.toString() : null);
                }
                return String(id);
            };
            // Folder ma'lumotini olish
            var folderIdSafe = safeId(t.folderId);
            if (folderIdSafe) {
                api.get("/api/folders/" + folderIdSafe).then(function (_a) {
                    var f = _a.data;
                    setFolderTitle(f.folder ? .title || '' : );
                    setMiniGenerated(f.folder ? .miniTestGenerated || false : );
                    // Mini-test ma'lumotini olish (agar mavjud va asosiy test bo'lsa)
                    var miniIdSafe = safeId(f.folder ? .miniTestId : );
                    if (miniIdSafe && t.testType !== 'mini') {
                        api.get("/api/personal-tests/" + miniIdSafe)
                            .then(function (_a) {
                            var mt = _a.data;
                            if (mt.test && mt.test.status === 'completed') {
                                setMiniTestData(mt.test);
                            }
                        })["catch"](function () { });
                    }
                })["catch"](function () { });
            }
            // Test'ning o'zida miniTestId bo'lsa (ai_blok/ai_free uchun)
            var testMiniIdSafe = safeId(t.miniTestId);
            if (testMiniIdSafe && t.testType !== 'mini' && !folderIdSafe) {
                api.get("/api/personal-tests/" + testMiniIdSafe)
                    .then(function (_a) {
                    var mt = _a.data;
                    if (mt.test && mt.test.status === 'completed') {
                        setMiniTestData(mt.test);
                    }
                })["catch"](function () { });
            }
            // Fan bo'yicha breakdown (faqat ai_blok va ai_free uchun)
            if (t.testType === 'ai_blok' || t.testType === 'ai_free') {
                var map = {};
                for (var _i = 0, _b = (t.questions || []); _i < _b.length; _i++) {
                    var q = _b[_i];
                    if (!q.subjectId)
                        continue;
                    if (!map[q.subjectId]) {
                        map[q.subjectId] = {
                            subjectId: q.subjectId,
                            subjectName: q.subjectName || q.subjectId,
                            total: 0,
                            correct: 0,
                            pct: 0
                        };
                    }
                    map[q.subjectId].total++;
                }
                var _loop_1 = function (ans) {
                    var qIdx = ans.questionIdx ?  ? ans.qIdx
                        :
                        :
                    ;
                    var q = t.questions.find(function (qq) { return qq.idx === qIdx; });
                    if (q ? .subjectId && ans.isCorrect && map[q.subjectId] : ) {
                        map[q.subjectId].correct++;
                    }
                };
                for (var _c = 0, _d = (t.answers || []); _c < _d.length; _c++) {
                    var ans = _d[_c];
                    _loop_1(ans);
                }
                var bdArr = Object.values(map).map(function (b) { return (__assign({}, b, { pct: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0 })); });
                setBreakdown(bdArr);
            }
        })["catch"](function () { return toast.error("Natija yuklanmadi"); })["finally"](function () { return setLoading(false); });
    }, [id]);
    if (loading || !state) {
        return (<div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spin" style={{ margin: '0 auto' }}/>
      </div>);
    }
    var totalCorrect = state.totalCorrect, totalQuestions = state.totalQuestions, scorePercent = state.scorePercent, level = state.level, testType = state.testType;
    var grade = scorePercent >= 90 ? "A'lo" : scorePercent >= 75 ? 'Yaxshi' : scorePercent >= 50 ? "O'rtacha" : 'Yaxshilash kerak';
    var emoji = scorePercent >= 80 ? '🏆' : scorePercent >= 60 ? '👏' : scorePercent >= 40 ? '💪' : '📖';
    var hasErrors = wrongCount > 0;
    var isBlok = testType === 'ai_blok';
    var isFree = testType === 'ai_free';
    var isMini = testType === 'mini';
    var isMaterial = testType === 'material';
    return (<>
      <div className="header">
        <div className="header-logo" style={{ fontSize: 16 }}>🏁 Yakunlandi</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        
        <div style={{
        padding: 10,
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 10,
        marginBottom: 12,
        fontSize: 11,
        color: 'var(--txt-2)',
        display: 'flex', alignItems: 'center', gap: 8
    }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>
            {isMini ? '🎯' : isBlok ? '📦' : isFree ? '🎯' : '🤖'}
          </span>
          <div style={{
        flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    }}>
            {isMini ? 'Mini-test' :
        isBlok ? 'AI Maxsus blok' :
            isFree ? 'AI Erkin tanlov' : 'AI test'}
            {' · '}{state.subjectName}
            {folderTitle && <> · "{folderTitle}"</>}
          </div>
        </div>

        
        <div style={{
        background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(0,212,170,0.08))',
        border: '1px solid rgba(123,104,238,0.3)',
        borderRadius: 18,
        padding: 24,
        textAlign: 'center'
    }}>
          <div style={{ fontSize: 56, marginBottom: 4 }}>{emoji}</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }}>
            {scorePercent}%
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 4 }}>
            {totalCorrect} / {totalQuestions} to'g'ri
          </div>
          <div style={{
        display: 'inline-block', marginTop: 10,
        background: 'rgba(123,104,238,0.15)',
        border: '1px solid rgba(123,104,238,0.3)',
        borderRadius: 100,
        padding: '5px 16px',
        fontSize: 12, fontWeight: 700, color: 'var(--acc-l)'
    }}>{grade}</div>

          {level && level.levelUp && (<div style={{
        marginTop: 12, padding: '8px 14px',
        background: 'rgba(251,191,36,0.12)',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 100,
        fontSize: 12, fontWeight: 700, color: 'var(--y)',
        display: 'inline-block'
    }}>
              🎉 Yangi daraja: {GRADE_META[versionToGrade(level.versionAfter)].name} {versionInGrade(level.versionAfter)}!
            </div>)}
        </div>

        
        {(isBlok || isFree) && breakdown.length > 0 && (<div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
              📊 FAN BO'YICHA NATIJA
            </div>
            <div style={{
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 12,
        padding: 12,
        display: 'grid', gap: 8
    }}>
              {breakdown.map(function (b) {
        var subj = SUBJECTS[b.subjectId];
        return (<div key={b.subjectId} style={{
            display: 'flex', alignItems: 'center', gap: 10
        }}>
                    <span style={{ fontSize: 18 }}>{subj ? .icon || '📚' : }</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{b.subjectName}</div>
                      <div style={{
            marginTop: 4, height: 5, background: 'var(--s2)',
            borderRadius: 100, overflow: 'hidden'
        }}>
                        <div style={{
            height: '100%',
            width: b.pct + "%",
            background: b.pct >= 70 ? 'var(--g)' : b.pct >= 50 ? 'var(--y)' : 'var(--r)',
            transition: 'width 0.5s'
        }}/>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div style={{
            fontWeight: 800, fontSize: 13,
            color: b.pct >= 70 ? 'var(--g)' : b.pct >= 50 ? 'var(--y)' : 'var(--r)'
        }}>{b.pct}%</div>
                      <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>{b.correct}/{b.total}</div>
                    </div>
                  </div>);
    })}
            </div>
          </div>)}

        
        {miniTestData && !isMini && (<div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--y)', letterSpacing: 0.5, marginBottom: 8 }}>
              🎯 MINI-TEST NATIJASI (XATOLAR USTIDA ISHLANGAN)
            </div>
            <button onClick={function () { return navigate("/personal-tests/" + miniTestData._id + "/result"); }} style={{
        width: '100%',
        background: 'linear-gradient(135deg, rgba(255,204,68,0.12), rgba(255,204,68,0.04))',
        border: '1px solid rgba(255,204,68,0.3)',
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--txt)'
    }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32 }}>🎯</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--y)' }}>
                    Mini-test tugatilgan
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                    {miniTestData.totalCorrect}/{miniTestData.totalQuestions} to'g'ri ·{' '}
                    {miniTestData.totalQuestions} ta savol
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }}>
                    {new Date(miniTestData.endTime || miniTestData.createdAt).toLocaleString('uz-UZ', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
        fontWeight: 900, fontSize: 24,
        color: miniTestData.scorePercent >= 70 ? 'var(--g)' :
            miniTestData.scorePercent >= 50 ? 'var(--y)' : 'var(--r)'
    }}>{miniTestData.scorePercent}%</div>
                  <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>natija →</div>
                </div>
              </div>
            </button>
          </div>)}
      </div>

      
      <div className="section-title">Keyingi qadam</div>
      <div style={{ padding: '0 20px', display: 'grid', gap: 10 }}>

        
        <button onClick={function () { return navigate("/personal-tests/" + id + "/review"); }} style={cardBtn(false)}>
          <div style={{ fontSize: 32 }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Savollarni ko'rish</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Har bir savol va javob tahlili
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>

        
        <button onClick={function () { return navigate("/personal-tests/" + id + "/explain"); }} disabled={!hasErrors} style={__assign({}, cardBtn(hasErrors), { background: hasErrors ? 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(167,139,250,0.05))' : 'var(--s2)', border: "1.5px solid " + (hasErrors ? 'rgba(123,104,238,0.3)' : 'var(--f)'), opacity: hasErrors ? 1 : 0.5, cursor: hasErrors ? 'pointer' : 'default' })}>
          <div style={{ fontSize: 32 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {hasErrors ? "Xatolar bilan rivojlanish" : "Xatosiz a'lo natija!"}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              {hasErrors
        ? wrongCount + " ta xato \u00B7 AI tushuntirish" + (!isMini ? ' + mini-test' : '')
        : 'Barcha javoblar to\'g\'ri'}
            </div>
          </div>
          <div style={{ fontSize: 18, color: hasErrors ? 'var(--acc-l)' : 'var(--txt-3)' }}>→</div>
        </button>

        
        <button onClick={function () { return navigate('/tarix'); }} style={cardBtn(false)}>
          <div style={{ fontSize: 32 }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--g)' }}>
              ✓ Tarixga saqlandi
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Tarix bo'limidan ko'rishingiz mumkin
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>
      </div>

      <div style={{ padding: '24px 20px' }}>
        <button onClick={function () { return navigate(state.folderId ? "/ombor/folder/" + state.folderId : '/testlar'); }} className="btn btn-ghost btn-block">
          {state.folderId ? '🏛 Papkaga qaytish' : "Testlar sahifasiga qaytish"}
        </button>
      </div>
    </>);
}
function cardBtn(_active) {
    return {
        background: 'var(--s1)',
        border: '1.5px solid var(--f)',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'left'
    };
}
