import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import RichText from '../components/RichText';
import '../components/RichText.css';
var PAGE_SIZE = 10;
export default function PersonalTestReviewPage() {
    var navigate = useNavigate();
    var id = useParams().id;
    var goBack = useGoBack("/personal-tests/" + id + "/result");
    var toast = useToast();
    var _a = useState(null), test = _a[0], setTest = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(0), page = _c[0], setPage = _c[1];
    var _d = useState('all'), filter = _d[0], setFilter = _d[1];
    useEffect(function () {
        if (!id)
            return;
        api.get("/api/personal-tests/" + id)
            .then(function (_a) {
            var data = _a.data;
            return setTest(data.test);
        })["catch"](function () { return toast.error("Yuklab bo'lmadi"); })["finally"](function () { return setLoading(false); });
    }, [id]);
    if (loading || !test) {
        return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin" style={{ margin: '0 auto' }}/></div>;
    }
    var questions = test.questions || [];
    var answers = (test.answers || []).reduce(function (acc, a) {
        // QUSUR TUZATILDI: backend 'questionIdx' qaytaradi, 'qIdx' emas
        var idx = a.questionIdx ?  ? a.qIdx
            :
            :
        ;
        if (idx !== undefined) {
            acc[idx] = {
                qIdx: idx,
                selected: a.selectedOption ?  ? a.selected :  : ,
                isCorrect: a.isCorrect
            };
        }
        return acc;
    }, {});
    // Filter
    var filtered = questions.filter(function (q) {
        if (filter === 'all')
            return true;
        var ans = answers[q.idx];
        if (filter === 'correct')
            return ans ? .isCorrect
                :
            ;
        if (filter === 'wrong')
            return !ans ? .isCorrect
                :
            ;
        return true;
    });
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    var pageQuestions = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>📊 Savollarni ko'rish</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        
        <div className="seg-tabs">
          <button className={"seg-tab " + (filter === 'all' ? 'active' : '')} onClick={function () { setFilter('all'); setPage(0); }}>Barchasi ({questions.length})</button>
          <button className={"seg-tab " + (filter === 'correct' ? 'active' : '')} onClick={function () { setFilter('correct'); setPage(0); }}>✓ To'g'ri ({test.totalCorrect})</button>
          <button className={"seg-tab " + (filter === 'wrong' ? 'active' : '')} onClick={function () { setFilter('wrong'); setPage(0); }}>✗ Xato ({test.totalQuestions - test.totalCorrect})</button>
        </div>

        
        <div style={{ display: 'grid', gap: 12 }}>
          {pageQuestions.map(function (q) {
        var ans = answers[q.idx];
        var isCorrect = ans ? .isCorrect
            :
        ;
        var userPick = ans ? .selected ?  ? null
            :
            :
            :
        ;
        var correct = q.answer;
        return (<div key={q.idx} style={{
            background: 'var(--s1)',
            border: "1.5px solid " + (isCorrect ? 'rgba(0,212,170,0.3)' : 'rgba(255,95,126,0.3)'),
            borderRadius: 12,
            padding: 14
        }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
            fontSize: 11, fontWeight: 800,
            padding: '2px 8px', borderRadius: 100,
            background: isCorrect ? 'rgba(0,212,170,0.15)' : 'rgba(255,95,126,0.15)',
            color: isCorrect ? 'var(--g)' : 'var(--r)'
        }}>{isCorrect ? '✓ To\'g\'ri' : '✗ Xato'}</span>
                  <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }}>
                    #{q.idx + 1}
                  </span>
                  {q.topic && <span style={{ fontSize: 10, color: 'var(--txt-3)' }}>· {q.topic}</span>}
                </div>

                <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                  <RichText content={q.question}/>
                </div>

                <div style={{ display: 'grid', gap: 5 }}>
                  {q.options.map(function (opt, i) {
            var isC = i === correct;
            var isU = i === userPick;
            var bg = 'var(--s2)';
            var border = '1px solid var(--f)';
            var color = 'var(--txt-2)';
            if (isC) {
                bg = 'rgba(0,212,170,0.12)';
                border = '1px solid rgba(0,212,170,0.35)';
                color = 'var(--g)';
            }
            else if (isU && !isC) {
                bg = 'rgba(255,95,126,0.12)';
                border = '1px solid rgba(255,95,126,0.35)';
                color = 'var(--r)';
            }
            return (<div key={i} style={{
                background: bg, border: border, color: color,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 12,
                display: 'flex', gap: 8
            }}>
                        <span style={{ fontWeight: 800, minWidth: 16 }}>{['A', 'B', 'C', 'D'][i]}</span>
                        <span style={{ flex: 1 }}><RichText content={opt} inline/></span>
                        {isC && <span style={{ fontSize: 11 }}>✓</span>}
                        {isU && !isC && <span style={{ fontSize: 11 }}>← siz</span>}
                      </div>);
        })}
                </div>

                {q.explanation && (<div style={{
            marginTop: 10, padding: 10,
            background: 'rgba(123,104,238,0.06)',
            borderRadius: 8,
            fontSize: 11,
            color: 'var(--txt-2)',
            lineHeight: 1.5
        }}>
                    💡 <RichText content={q.explanation} inline/>
                  </div>)}
              </div>);
    })}
        </div>

        
        {totalPages > 1 && (<div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={function () { return setPage(function (p) { return Math.max(0, p - 1); }); }} disabled={page === 0} className="btn btn-ghost" style={{ opacity: page === 0 ? 0.4 : 1 }}>← Oldingi</button>
            <div style={{
        padding: '8px 14px', background: 'var(--s2)', borderRadius: 8,
        fontSize: 11, color: 'var(--txt-2)', fontWeight: 700
    }}>{page + 1} / {totalPages}</div>
            <button onClick={function () { return setPage(function (p) { return Math.min(totalPages - 1, p + 1); }); }} disabled={page >= totalPages - 1} className="btn btn-ghost" style={{ opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Keyingi →</button>
          </div>)}

        <div style={{ height: 30 }}/>
      </div>
    </>);
}
