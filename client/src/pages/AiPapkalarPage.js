import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { folderApi } from '../api/endpoints';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
import { SUBJECTS, DUAL_CONTEXT_SUBJECTS, SPEC_BY_CATEGORY, SPEC_CATEGORY_NAMES, COMPULSORY_IDS } from '../constants/subjects';
export default function AiPapkalarPage() {
    var navigate = useNavigate();
    var goBack = useGoBack('/testlar/ai');
    var toast = useToast();
    var _a = useState('mutaxassislik'), tab = _a[0], setTab = _a[1];
    var _b = useState({}), summary = _b[0], setSummary = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    useEffect(function () {
        folderApi.subjectsSummary()
            .then(function (_a) {
            var data = _a.data;
            return setSummary(data.summary || {});
        })["catch"](function () { return toast.error("Yuklab bo'lmadi"); })["finally"](function () { return setLoading(false); });
    }, []);
    var getSummaryFor = function (subjectId, context) {
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
        var hasFolders = stats && stats.folderCount > 0;
        return (<button key={subjectId + "_" + context} onClick={function () { return navigate("/ombor/" + subjectId + "?context=" + context); }} style={{
            width: '100%',
            background: 'var(--s1)',
            border: "1px solid " + (hasFolders ? 'rgba(123,104,238,0.25)' : 'var(--f)'),
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', color: 'var(--txt)', textAlign: 'left'
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
            {!hasFolders
            ? <span style={{ fontStyle: 'italic' }}>Material yo'q — Omborga yuklang</span>
            : <span>
                  {stats.folderCount} ta papka · {stats.testsCompleted} test
                  {stats.avgScore > 0 && (<> · <strong style={{ color: stats.avgScore >= 70 ? 'var(--g)' : stats.avgScore >= 50 ? 'var(--y)' : 'var(--r)' }}>{stats.avgScore}%</strong></>)}
                </span>}
          </div>
        </div>
        <div style={{ color: 'var(--txt-3)', fontSize: 18 }}>→</div>
      </button>);
    };
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>📁 Papka testlari</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }}>
          Har papka uchun alohida test · majburiy 10, mutaxassislik 30 savol
        </p>

        <div className="seg-tabs">
          <button className={"seg-tab " + (tab === 'majburiy' ? 'active' : '')} onClick={function () { return setTab('majburiy'); }}>Majburiy</button>
          <button className={"seg-tab " + (tab === 'mutaxassislik' ? 'active' : '')} onClick={function () { return setTab('mutaxassislik'); }}>Mutaxassislik</button>
        </div>

        {loading ? <div className="skel-card"/> : tab === 'majburiy' ? (<>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }}>
              📌 MAJBURIY · 10 ta savol
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {COMPULSORY_IDS.map(function (id) { return renderSubjectCard(id, 'majburiy'); })}
            </div>
          </>) : (<>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--acc-l)', letterSpacing: 0.5, marginBottom: 8 }}>
              ⭐ MUTAXASSISLIK · 30 ta savol
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--y)', letterSpacing: 0.5, margin: '8px 0 6px' }}>
              🔁 DUAL-CONTEXT FANLAR
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

        <div style={{ height: 30 }}/>
      </div>
    </>);
}
