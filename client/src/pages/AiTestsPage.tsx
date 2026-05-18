import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { folderApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'
import { SUBJECTS, DUAL_CONTEXT_SUBJECTS, SPEC_BY_CATEGORY, SPEC_CATEGORY_NAMES, COMPULSORY_IDS, type SubjectId, type Context } from '../constants/subjects'

interface SummaryEntry {
  subjectId: string
  context: Context
  folderCount: number
  testsCompleted: number
  avgScore: number
}

type Tab = 'majburiy' | 'mutaxassislik'

export default function AiTestsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/testlar')
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('mutaxassislik')
  const [summary, setSummary] = useState<Record<string, SummaryEntry>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    folderApi.subjectsSummary()
      .then(({ data }) => setSummary((data.summary as any) || {}))
      .catch(() => toast.error("Yuklab bo'lmadi"))
      .finally(() => setLoading(false))
  }, [])

  const getSummaryFor = (subjectId: string, context: Context): SummaryEntry | null => {
    if (DUAL_CONTEXT_SUBJECTS.has(subjectId)) {
      return summary[`${subjectId}__${context}`] || null
    }
    return summary[subjectId] || null
  }

  const renderSubjectCard = (subjectId: SubjectId, context: Context) => {
    const subj = SUBJECTS[subjectId]
    if (!subj) return null
    const stats = getSummaryFor(subjectId, context)
    const hasFolders = stats && stats.folderCount > 0

    return (
      <button
        key={`${subjectId}_${context}`}
        onClick={() => navigate(`/ombor/${subjectId}?context=${context}`)}
        style={{
          width: '100%',
          background: 'var(--s1)',
          border: `1px solid ${hasFolders ? 'rgba(123,104,238,0.25)' : 'var(--f)'}`,
          borderRadius: 14,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          color: 'var(--txt)',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: context === 'majburiy' ? 'rgba(0,212,170,0.12)' : 'rgba(123,104,238,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>{subj.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{subj.name}</div>
          <div style={{ fontSize: 10.5, color: 'var(--txt-3)', marginTop: 2 }}>
            {!hasFolders
              ? <span style={{ fontStyle: 'italic' }}>Material yuklab papka yarating</span>
              : <span>
                  {stats!.folderCount} ta papka · {stats!.testsCompleted} test ishlangan
                  {stats!.avgScore > 0 && (
                    <> · o'rtacha <strong style={{ color: stats!.avgScore >= 70 ? 'var(--g)' : stats!.avgScore >= 50 ? 'var(--y)' : 'var(--r)' }}>{stats!.avgScore}%</strong></>
                  )}
                </span>
            }
          </div>
        </div>
        <div style={{ color: 'var(--txt-3)', fontSize: 18 }}>→</div>
      </button>
    )
  }

  const specialtyList: SubjectId[] = [
    'math', 'tarix',
    'fizika', 'kimyo', 'bio', 'geo',
    'adab', 'huquq',
    'ingliz', 'nemis', 'fransuz', 'arab', 'fors', 'turk',
  ]

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>🤖 AI testlarim</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 14 }}>
          Materiallaringizdan yaratilgan testlar — fan + kontekst bo'yicha tartibda
        </p>

        <div className="seg-tabs">
          <button
            className={`seg-tab ${tab === 'majburiy' ? 'active' : ''}`}
            onClick={() => setTab('majburiy')}
          >Majburiy</button>
          <button
            className={`seg-tab ${tab === 'mutaxassislik' ? 'active' : ''}`}
            onClick={() => setTab('mutaxassislik')}
          >Mutaxassislik</button>
        </div>

        {loading ? (
          <div className="skel-card" />
        ) : tab === 'majburiy' ? (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--g)', letterSpacing: 0.5, marginBottom: 8 }}>
              📌 MAJBURIY · 10 ta savol · 1.1 ball
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {COMPULSORY_IDS.map(id => renderSubjectCard(id, 'majburiy'))}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--acc-l)', letterSpacing: 0.5, marginBottom: 8 }}>
              ⭐ MUTAXASSISLIK · 30 ta savol · 2.1–3.1 ball
            </div>

            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--y)', letterSpacing: 0.5, margin: '8px 0 6px' }}>
              🔁 DUAL-CONTEXT FANLAR
            </div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
              {(['math', 'tarix'] as SubjectId[]).map(id => renderSubjectCard(id, 'mutaxassislik'))}
            </div>

            {Object.entries(SPEC_BY_CATEGORY).map(([cat, ids]) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 6 }}>
                  {SPEC_CATEGORY_NAMES[cat]?.toUpperCase()}
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {ids.map(id => renderSubjectCard(id, 'mutaxassislik'))}
                </div>
              </div>
            ))}
          </>
        )}

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}
