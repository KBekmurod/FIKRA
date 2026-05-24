import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS, COMPULSORY_IDS, DUAL_CONTEXT_SUBJECTS, SPEC_BY_CATEGORY, SPEC_CATEGORY_NAMES, } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store';
export default function OmborPage() {
    var navigate = useNavigate();
    var toast = useToast();
    var _a = useState('majburiy'), tab = _a[0], setTab = _a[1];
    var _b = useState({}), summary = _b[0], setSummary = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useAppStore(), user = _d.user, setAuthModalOpen = _d.setAuthModalOpen;
    useEffect(function () {
        if (!user) {
            setLoading(false);
            return;
        }
        api.get('/api/folders/subjects-summary')
            .then(function (_a) {
            var data = _a.data;
            return setSummary(data.summary || {});
        })["catch"](function () { return toast.error("Yuklab bo'lmadi"); })["finally"](function () { return setLoading(false); });
    }, [user]);
    // Tab bo'yicha ko'rsatadigan fanlar
    // Majburiy: uztil, math, tarix
    // Mutaxassislik: hammasi (math/tarix dual, qolganlari fakat speciality)
    var compulsoryList = COMPULSORY_IDS;
    // Mutaxassislikda: math, tarix (dual) + 13 ta faqat-mutaxassislik fani = 15 ta
    var specialtyList = [
        'math', 'tarix',
        'fizika', 'kimyo', 'bio', 'geo',
        'adab', 'huquq',
        'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
    ];
    var getSummaryFor = function (subjectId, context) {
        // Dual subjects: key = subjectId__context
        if (DUAL_CONTEXT_SUBJECTS.has(subjectId)) {
            return summary[subjectId + "__" + context] || null;
        }
        return summary[subjectId] || null;
    };
    var renderSubjectCard = function (subjectId, context) {
        var subj = SUBJECTS[subjectId];
        if (!subj)
            return null;
        var stats = getSummaryFor(subjectId, context);
        var isEmpty = !stats || stats.folderCount === 0;
        var standardCount = context === 'majburiy' ? 10 : 30;
        return (<button key={subjectId + "_" + context} className={"tilt-card " + (!isEmpty ? 'glass' : '')} onClick={function () {
            if (!user)
                return setAuthModalOpen(true);
            navigate("/ombor/" + subjectId + "?context=" + context);
        }} style={{
            width: '100%',
            background: 'var(--s1)',
            border: "1px solid " + (isEmpty ? 'var(--f)' : 'rgba(123,104,238,0.25)'),
            borderRadius: 14,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left'
        }}>
        <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: context === 'majburiy' ? 'rgba(0,212,170,0.12)' : 'rgba(123,104,238,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0
        }}>{subj.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{subj.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--txt-3)', marginTop: 2 }}>
            {isEmpty
            ? <span style={{ fontStyle: 'italic' }}>Bo'sh — papka yaratish uchun bosing</span>
            : (<span>
                  {stats.folderCount} ta papka
                  {stats.testsCompleted > 0 && (<> · {stats.testsCompleted} test · <strong style={{ color: stats.avgScore >= 70 ? 'var(--g)' : stats.avgScore >= 50 ? 'var(--y)' : 'var(--r)' }}>{stats.avgScore}%</strong></>)}
                </span>)}
          </div>
        </div>
        <div style={{
            fontSize: 10, color: 'var(--txt-3)', fontWeight: 700,
            padding: '2px 8px', borderRadius: 100,
            background: 'var(--s2)',
            whiteSpace: 'nowrap'
        }}>{standardCount} ta</div>
        <div style={{ color: 'var(--txt-3)', fontSize: 18 }}>→</div>
      </button>);
    };
    return (<>
      <div className="header">
        <div className="header-logo">🏛 Ombor</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }}>
          Materiallaringizni saqlang, AI testlar yarating
        </p>

        <div className="seg-tabs">
          <button className={"seg-tab " + (tab === 'majburiy' ? 'active' : '')} onClick={function () { return setTab('majburiy'); }}>Majburiy</button>
          <button className={"seg-tab " + (tab === 'mutaxassislik' ? 'active' : '')} onClick={function () { return setTab('mutaxassislik'); }}>Mutaxassislik</button>
        </div>

        {loading ? (<div className="skel-card"/>) : tab === 'majburiy' ? (<>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }}>
              📌 MAJBURIY 3 FAN · har birida 10 ta savol · 1.1 ball
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {compulsoryList.map(function (id) { return renderSubjectCard(id, 'majburiy'); })}
            </div>
          </>) : (<>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--acc-l)', letterSpacing: 0.5, marginBottom: 8 }}>
              ⭐ MUTAXASSISLIK · har biri 30 ta savol · 2.1–3.1 ball
            </div>

            
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--y)', letterSpacing: 0.5, margin: '8px 0 6px' }}>
              🔁 IKKALA KONTEKSTDA HAM (chuqurroq)
            </div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
              {['math', 'tarix'].map(function (id) { return renderSubjectCard(id, 'mutaxassislik'); })}
            </div>

            {Object.entries(SPEC_BY_CATEGORY).map(function (_a) {
        var cat = _a[0], ids = _a[1];
        return (<div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 6 }}>
                  {SPEC_CATEGORY_NAMES[cat] ? .toUpperCase() : }
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {ids.map(function (id) { return renderSubjectCard(id, 'mutaxassislik'); })}
                </div>
              </div>);
    })}
          </>)}

        <div style={{
        marginTop: 14, marginBottom: 16,
        padding: 12,
        background: 'rgba(255,204,68,0.08)',
        border: '1px solid rgba(255,204,68,0.2)',
        borderRadius: 10,
        fontSize: 10.5,
        color: 'var(--txt-2)',
        lineHeight: 1.55
    }}>
          💡 <strong>Qoida:</strong> Bitta fan ichida mavzular bo'yicha papkalar oching. Har bir papkaga istagancha konspekt, rasm yoki PDF yuklashingiz mumkin.
          {' '}AI shu papkadagi barcha ma'lumotlarni o'qib, mutlaqo yangi test yaratib beradi.
        </div>
      </div>
    </>);
}
