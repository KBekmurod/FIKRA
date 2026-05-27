import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { SUBJECTS, getAllowedContexts } from '../constants/subjects';
import { useToast } from '../components/Toast';
import { useGoBack } from '../hooks/useGoBack';
export default function OmborSubjectPage() {
    var navigate = useNavigate();
    var goBack = useGoBack('/ombor');
    var subjectId = useParams().subjectId;
    var searchParams = useSearchParams()[0];
    var initialContext = searchParams.get('context') || 'mutaxassislik';
    var toast = useToast();
    var _a = useState([]), folders = _a[0], setFolders = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(initialContext), context = _c[0], setContext = _c[1];
    var subj = subjectId ? SUBJECTS[subjectId] : null;
    var allowed = subjectId ? getAllowedContexts(subjectId) : ['mutaxassislik'];
    var showContextSwitch = allowed.length > 1;
    var standardCount = context === 'majburiy' ? 10 : 30;
    useEffect(function () {
        if (!subjectId)
            return;
        setLoading(true);
        api.get("/api/folders/by-subject/" + subjectId, { params: { context: context } })
            .then(function (_a) {
            var data = _a.data;
            return setFolders(data.folders || []);
        })["catch"](function () { return toast.error("Yuklab bo'lmadi"); })["finally"](function () { return setLoading(false); });
    }, [subjectId, context]);
    if (!subj) {
        return (<>
        <div className="header">
          <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--txt-2)', fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8 }}>←</button>
          <div className="header-logo" style={{ fontSize: 16 }}>Fan topilmadi</div>
        </div>
      </>);
    }
    var masteryEmoji = function (m) {
        return m === 'strong' ? '💪' : m === 'medium' ? '👍' : m === 'weak' ? '📖' : '🆕';
    };
    return (<>
      <div className="header">
        <button onClick={goBack} style={{
        background: 'none', border: 'none', color: 'var(--txt-2)',
        fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8
    }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>{subj.icon} {subj.name}</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        
        {showContextSwitch && (<div className="seg-tabs">
            <button className={"seg-tab " + (context === 'majburiy' ? 'active' : '')} onClick={function () { return setContext('majburiy'); }}>Majburiy (10)</button>
            <button className={"seg-tab " + (context === 'mutaxassislik' ? 'active' : '')} onClick={function () { return setContext('mutaxassislik'); }}>Mutaxassislik (30)</button>
          </div>)}

        
        <div style={{
        padding: 12,
        background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
        border: "1px solid " + (context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'),
        borderRadius: 12,
        fontSize: 11,
        color: 'var(--txt-2)',
        lineHeight: 1.5,
        marginBottom: 14
    }}>
          <strong style={{ color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }}>
            {context === 'majburiy' ? 'Majburiy kontekst' : 'Mutaxassislik kontekst'}
          </strong>
          <br />
          Har papkadan AI <strong>{standardCount} ta test savol</strong> yaratadi
          ({context === 'majburiy' ? '1.1 ball' : '2.1–3.1 ball'}).
        </div>

        
        <button onClick={function () { return navigate("/ombor/" + subjectId + "/add-folder?context=" + context); }} style={{
        width: '100%',
        background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
        color: 'white',
        border: 'none',
        borderRadius: 14,
        padding: '14px 16px',
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16
    }}>
          ⊕ Yangi material papkasi yaratish
        </button>

        
        {loading ? (<div className="skel-card"/>) : folders.length === 0 ? (<div style={{
        padding: 30, textAlign: 'center',
        background: 'var(--s1)',
        border: '1px solid var(--f)',
        borderRadius: 14
    }}>
            <div style={{ fontSize: 40 }}>📁</div>
            <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8, lineHeight: 1.5 }}>
              Hozircha papkalar yo'q
              <br />
              <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>
                Yuqoridagi tugma orqali yangi material va test yarating
              </span>
            </p>
          </div>) : (<div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5 }}>
              📁 PAPKALAR ({folders.length})
            </div>
            {folders.map(function (f) { return (<FolderCard key={f._id} folder={f} masteryEmoji={masteryEmoji} onClick={function () { return navigate("/ombor/folder/" + f._id); }}/>); })}
          </div>)}

        <div style={{ height: 24 }}/>
      </div>
    </>);
}
function FolderCard(_a) {
    var folder = _a.folder, masteryEmoji = _a.masteryEmoji, onClick = _a.onClick;
    var hasTest = folder.testStatus === 'has_test';
    var isGenerating = folder.testStatus === 'generating';
    var isFailed = folder.testStatus === 'generation_failed';
    var isNoTest = folder.testStatus === 'no_test';
    return (<button onClick={onClick} style={{
        background: 'var(--s1)',
        border: "1px solid " + (hasTest ? 'rgba(0,212,170,0.25)' : isFailed ? 'rgba(255,95,126,0.25)' : 'var(--f)'),
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'left'
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{masteryEmoji(folder.stats ? .masteryLevel || 'unknown' : )}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1.35,
        // BEST PRACTICE: 2 qatorga sig'dirish + ellipsis
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        wordBreak: 'break-word'
    }}>
            {folder.title}
          </div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 1 }}>
            {folder.materials && folder.materials.length > 0
        ? <>{folder.materials.reduce(function (s, m) { return s + m.charCount; }, 0).toLocaleString()} belgi · {folder.materials.length} ta material · {folder.testStandardCount} savol</>
        : <>{folder.testStandardCount} savol</>}
          </div>
        </div>
        {hasTest && folder.stats.attemptsCount > 0 && (<div style={{ textAlign: 'right' }}>
            <div style={{
        fontWeight: 800, fontSize: 14,
        color: folder.stats.bestScore >= 70 ? 'var(--g)' : folder.stats.bestScore >= 50 ? 'var(--y)' : 'var(--r)'
    }}>{folder.stats.bestScore}%</div>
            <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>eng yaxshi</div>
          </div>)}
      </div>

      
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
        {isNoTest && (<span style={{ color: 'var(--y)', fontWeight: 700 }}>
            ⚠️ Test yaratilmagan — kirib yarating
          </span>)}
        {isGenerating && (<span style={{ color: 'var(--acc-l)', fontWeight: 700 }}>
            ⏳ Test yaratilmoqda...
          </span>)}
        {isFailed && (<span style={{ color: 'var(--r)', fontWeight: 700 }}>
            ❌ Test yaratishda xato — qaytadan urinib ko'ring
          </span>)}
        {hasTest && folder.stats.attemptsCount === 0 && (<span style={{ color: 'var(--g)', fontWeight: 700 }}>
            ✓ Test tayyor — ishlashga tayyor
          </span>)}
        {hasTest && folder.stats.attemptsCount > 0 && (<span style={{ color: 'var(--txt-3)' }}>
            {folder.stats.attemptsCount} marta ishlangan · o'rtacha {folder.stats.avgScore}%
          </span>)}
      </div>
    </button>);
}
