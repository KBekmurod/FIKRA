import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi, personalTestApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { SUBJECTS } from '../constants/subjects'

type Tab = 'fikra' | 'ai'

interface FikraSession {
  _id: string
  testMode: 'blok' | 'free'
  blockSubject?: string
  freeSubjects?: string[]
  totalScore: number
  totalCorrect: number
  totalQuestions: number
  endTime: string
  durationSeconds?: number
  status: string
}

interface AiTest {
  _id: string
  subjectId: string
  subjectName: string
  testType: 'material' | 'mini'
  folderId?: string
  totalCorrect: number
  totalQuestions: number
  scorePercent: number
  endTime?: string
  createdAt: string
  status: string
  // Backend'dan papka ma'lumotini ko'rsatish uchun (populate qilingan)
  folderInfo?: {
    title: string
    context: 'majburiy' | 'mutaxassislik'
    materialTitle?: string
    miniTestId?: string
  }
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('fikra')
  const [filterSubject, setFilterSubject] = useState<string>('all')

  const [fikra, setFikra] = useState<FikraSession[]>([])
  const [ai, setAi] = useState<AiTest[]>([])
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [f, a] = await Promise.all([
        examApi.history(undefined, 1).catch(() => ({ data: { sessions: [] } })),
        personalTestApi.history(undefined, undefined, 1).catch(() => ({ data: { tests: [] } })),
      ])
      setFikra(((f as any).data?.sessions || (f as any).data?.history || []) as FikraSession[])
      setAi(((a as any).data?.tests || []) as AiTest[])
    } catch {
      toast.error("Tarix yuklanmadi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // Filter
  const filteredAi = ai.filter(t => filterSubject === 'all' || t.subjectId === filterSubject)
  const filteredFikra = fikra.filter(s => {
    if (filterSubject === 'all') return true
    if (s.blockSubject === filterSubject) return true
    if (s.freeSubjects?.includes(filterSubject)) return true
    return false
  })

  // Mavjud fan ID'lari
  const usedSubjects = new Set<string>()
  ai.forEach(t => usedSubjects.add(t.subjectId))
  fikra.forEach(s => {
    if (s.blockSubject) usedSubjects.add(s.blockSubject)
    s.freeSubjects?.forEach(x => usedSubjects.add(x))
  })

  return (
    <>
      <div className="header">
        <div className="header-logo">📚 Tarix</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        {/* Tab */}
        <div className="seg-tabs">
          <button
            className={`seg-tab ${tab === 'fikra' ? 'active' : ''}`}
            onClick={() => setTab('fikra')}
          >🎓 FIKRA ({fikra.length})</button>
          <button
            className={`seg-tab ${tab === 'ai' ? 'active' : ''}`}
            onClick={() => setTab('ai')}
          >🤖 AI testlar ({ai.length})</button>
        </div>

        {/* Subject filter */}
        {usedSubjects.size > 0 && (
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto',
            marginBottom: 12, paddingBottom: 4,
          }}>
            <button
              onClick={() => setFilterSubject('all')}
              style={chipStyle(filterSubject === 'all')}
            >Barchasi</button>
            {Array.from(usedSubjects).map(sid => {
              const subj = (SUBJECTS as any)[sid]
              if (!subj) return null
              return (
                <button
                  key={sid}
                  onClick={() => setFilterSubject(sid)}
                  style={chipStyle(filterSubject === sid)}
                >{subj.icon} {subj.name}</button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="skel-card" />
        ) : tab === 'fikra' ? (
          <FikraHistoryList items={filteredFikra} onClick={s => navigate(`/test-result/${s._id}`)} />
        ) : (
          <AiHistoryList items={filteredAi} onClick={t => navigate(`/personal-tests/${t._id}/result`)} />
        )}

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}

function chipStyle(active: boolean) {
  return {
    flex: '0 0 auto',
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 100,
    border: active ? '1px solid var(--acc)' : '1px solid var(--f)',
    background: active ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
    color: active ? 'var(--acc-l)' : 'var(--txt-2)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  }
}

function FikraHistoryList({ items, onClick }: { items: FikraSession[]; onClick: (s: FikraSession) => void }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }}>
          Hozircha FIKRA testlari yo'q
        </p>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map(s => {
        const pct = s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0
        const modeLabel = s.testMode === 'blok' ? '📦 Maxsus blok' : '🎯 Erkin tanlov'

        let metaText = ''
        if (s.testMode === 'blok' && s.blockSubject) {
          const subj = (SUBJECTS as any)[s.blockSubject]
          metaText = subj ? `Yo'nalish: ${subj.icon} ${subj.name}` : s.blockSubject
        } else if (s.freeSubjects && s.freeSubjects.length > 0) {
          metaText = 'Fanlar: ' + s.freeSubjects.map(sid => {
            const x = (SUBJECTS as any)[sid]
            return x ? `${x.icon}` : sid
          }).join(' ')
        }

        return (
          <button
            key={s._id}
            onClick={() => onClick(s)}
            style={cardStyle()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, marginBottom: 4, letterSpacing: 0.3 }}>
                  {modeLabel}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
                  {metaText}
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                  {new Date(s.endTime).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{s.totalCorrect}/{s.totalQuestions}
                </div>
              </div>
              <div style={{
                fontWeight: 800, fontSize: 16,
                color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                whiteSpace: 'nowrap',
              }}>{pct}%</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function AiHistoryList({ items, onClick }: { items: AiTest[]; onClick: (t: AiTest) => void }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }}>
          Hozircha AI testlari yo'q
        </p>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {items.map(t => {
        const subj = (SUBJECTS as any)[t.subjectId]
        const isMini = t.testType === 'mini'
        const folderTitle = t.folderInfo?.title

        return (
          <button
            key={t._id}
            onClick={() => onClick(t)}
            style={cardStyle()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'inline-block',
                  fontSize: 9.5, fontWeight: 800,
                  padding: '2px 8px', borderRadius: 100,
                  background: isMini ? 'rgba(255,204,68,0.15)' : 'rgba(123,104,238,0.15)',
                  color: isMini ? 'var(--y)' : 'var(--acc-l)',
                  marginBottom: 4, letterSpacing: 0.3,
                }}>
                  {isMini ? '🎯 MINI-TEST (xatolardan)' : '🤖 AI TEST'}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
                  {subj?.icon} {t.subjectName}
                  {t.folderInfo?.context && (
                    <span style={{ fontSize: 10, color: t.folderInfo.context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)', marginLeft: 6 }}>
                      · {t.folderInfo.context === 'majburiy' ? 'majburiy' : 'mutaxassislik'}
                    </span>
                  )}
                </div>
                {folderTitle && (
                  <div style={{ fontSize: 10, color: 'var(--txt-2)', marginBottom: 2 }}>
                    📁 "{folderTitle}"
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                  {new Date(t.endTime || t.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {' · '}{t.totalCorrect}/{t.totalQuestions}
                </div>
              </div>
              <div style={{
                fontWeight: 800, fontSize: 16,
                color: t.scorePercent >= 70 ? 'var(--g)' : t.scorePercent >= 50 ? 'var(--y)' : 'var(--r)',
                whiteSpace: 'nowrap',
              }}>{t.scorePercent}%</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function cardStyle() {
  return {
    background: 'var(--s1)',
    border: '1px solid var(--f)',
    borderRadius: 12,
    padding: '12px 14px',
    cursor: 'pointer',
    color: 'var(--txt)',
    textAlign: 'left' as const,
    width: '100%',
  }
}
