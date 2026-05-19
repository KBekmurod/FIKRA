import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi, personalTestApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { SUBJECTS } from '../constants/subjects'

type TopTab = 'fikra' | 'ai'
type FikraMode = 'blok' | 'free'
type AiMode = 'papka' | 'blok' | 'free'

interface FikraSession {
  _id: string
  testMode: 'blok' | 'free'
  blockSubject?: string
  freeSubjects?: string[]
  totalScore: number
  totalCorrect: number
  totalQuestions: number
  endTime: string
  status: string
}

interface AiTest {
  _id: string
  subjectId: string
  subjectName: string
  testType: 'material' | 'mini' | 'ai_blok' | 'ai_free'
  folderId?: string
  totalCorrect: number
  totalQuestions: number
  scorePercent: number
  endTime?: string
  createdAt: string
  status: string
  sourceTestId?: string
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

  const [topTab, setTopTab] = useState<TopTab>('fikra')
  const [fikraMode, setFikraMode] = useState<FikraMode>('blok')
  const [aiMode, setAiMode] = useState<AiMode>('papka')

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

  // FIKRA testlar bo'yicha filter
  const fikraByMode = fikra.filter(s => s.testMode === fikraMode)

  // AI testlar bo'yicha filter
  // - papka rejimi: testType === 'material' yoki 'mini' (folderId bilan)
  // - blok: testType === 'ai_blok'
  // - free: testType === 'ai_free'
  const aiByMode = ai.filter(t => {
    if (aiMode === 'papka') return t.testType === 'material' || t.testType === 'mini'
    if (aiMode === 'blok') return t.testType === 'ai_blok'
    if (aiMode === 'free') return t.testType === 'ai_free'
    return true
  })

  // Dastlabki testlar va mini-testlarni ajratish
  const primaryAi = aiByMode.filter(t => t.testType !== 'mini')
  const miniAi = aiByMode.filter(t => t.testType === 'mini')

  return (
    <>
      <div className="header">
        <div className="header-logo">📚 Tarix</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        {/* Yuqori tab: FIKRA / AI */}
        <div className="seg-tabs">
          <button
            className={`seg-tab ${topTab === 'fikra' ? 'active' : ''}`}
            onClick={() => setTopTab('fikra')}
          >🎓 FIKRA ({fikra.length})</button>
          <button
            className={`seg-tab ${topTab === 'ai' ? 'active' : ''}`}
            onClick={() => setTopTab('ai')}
          >🤖 AI ({ai.length})</button>
        </div>

        {/* Ikkinchi daraja: rejim */}
        {topTab === 'fikra' ? (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <ModeChip active={fikraMode === 'blok'} onClick={() => setFikraMode('blok')}
              icon="📦" label="Maxsus blok" count={fikra.filter(s => s.testMode === 'blok').length} />
            <ModeChip active={fikraMode === 'free'} onClick={() => setFikraMode('free')}
              icon="🎯" label="Erkin tanlov" count={fikra.filter(s => s.testMode === 'free').length} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            <ModeChip active={aiMode === 'papka'} onClick={() => setAiMode('papka')}
              icon="📁" label="Papka testlari"
              count={ai.filter(t => t.testType === 'material' || t.testType === 'mini').length} />
            <ModeChip active={aiMode === 'blok'} onClick={() => setAiMode('blok')}
              icon="📦" label="Maxsus blok"
              count={ai.filter(t => t.testType === 'ai_blok').length} />
            <ModeChip active={aiMode === 'free'} onClick={() => setAiMode('free')}
              icon="🎯" label="Erkin tanlov"
              count={ai.filter(t => t.testType === 'ai_free').length} />
          </div>
        )}

        {loading ? (
          <div className="skel-card" />
        ) : topTab === 'fikra' ? (
          <FikraHistoryList items={fikraByMode} onClick={s => navigate(`/test-result/${s._id}`)} />
        ) : (
          <AiHistoryList
            primaryItems={primaryAi}
            miniItems={miniAi}
            allTests={ai}
            onClick={t => navigate(`/personal-tests/${t._id}/result`)}
          />
        )}

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}

// ─── Rejim chip ─────────────────────────────────────────────────────────
function ModeChip({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: string; label: string; count: number
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: '0 0 auto',
        padding: '7px 12px',
        fontSize: 11, fontWeight: 700,
        borderRadius: 100,
        border: active ? '1.5px solid var(--acc)' : '1px solid var(--f)',
        background: active ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
        color: active ? 'var(--acc-l)' : 'var(--txt-2)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center', gap: 6,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span style={{
        background: active ? 'rgba(123,104,238,0.2)' : 'var(--s1)',
        color: active ? 'var(--acc-l)' : 'var(--txt-3)',
        borderRadius: 100, padding: '1px 6px',
        fontSize: 10,
      }}>{count}</span>
    </button>
  )
}

// ─── FIKRA testlar ro'yxati ───────────────────────────────────────────────
function FikraHistoryList({ items, onClick }: { items: FikraSession[]; onClick: (s: FikraSession) => void }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }}>
          Hozircha bu turdagi FIKRA testlari yo'q
        </p>
      </div>
    )
  }
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
        📋 DASTLABKI ISHLANGAN TESTLAR ({items.length})
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(s => {
          const pct = s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0
          let metaText = ''
          if (s.testMode === 'blok' && s.blockSubject) {
            const subj = (SUBJECTS as any)[s.blockSubject]
            metaText = subj ? `Yo'nalish: ${subj.icon} ${subj.name}` : s.blockSubject
          } else if (s.freeSubjects?.length) {
            metaText = 'Fanlar: ' + s.freeSubjects.map(sid => {
              const x = (SUBJECTS as any)[sid]; return x ? x.icon : sid
            }).join(' ')
          }
          return (
            <button key={s._id} onClick={() => onClick(s)} style={cardStyle()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
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
    </>
  )
}

// ─── AI testlar — dastlabki + mini ajratilgan ────────────────────────────
function AiHistoryList({ primaryItems, miniItems, allTests, onClick }: {
  primaryItems: AiTest[]; miniItems: AiTest[]; allTests: AiTest[]; onClick: (t: AiTest) => void
}) {
  if (primaryItems.length === 0 && miniItems.length === 0) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>📭</div>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }}>
          Hozircha bu turdagi AI testlari yo'q
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Dastlabki testlar */}
      {primaryItems.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
            📋 DASTLABKI ISHLANGAN TESTLAR ({primaryItems.length})
          </div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
            {primaryItems.map(t => {
              const relatedMini = allTests.find(x => x.testType === 'mini' && x.sourceTestId === t._id)
              return (
                <AiTestCard key={t._id} test={t} relatedMini={relatedMini} onClick={() => onClick(t)} />
              )
            })}
          </div>
        </>
      )}

      {/* Mini testlar */}
      {miniItems.length > 0 && (
        <>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--y)',
            letterSpacing: 0.5, marginBottom: 8,
            marginTop: primaryItems.length > 0 ? 14 : 0,
          }}>
            🎯 XATOLAR USTIDA ISHLANGAN MINI-TESTLAR ({miniItems.length})
          </div>
          <div style={{
            padding: 10, marginBottom: 8,
            background: 'rgba(255,204,68,0.05)',
            border: '1px dashed rgba(255,204,68,0.2)',
            borderRadius: 10,
            fontSize: 10.5, color: 'var(--txt-3)', lineHeight: 1.4,
          }}>
            💡 Mini-test — dastlabki testdagi xatolaringizdan AI tomonidan
            yaratilgan o'rganish testi
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {miniItems.map(t => (
              <AiTestCard key={t._id} test={t} onClick={() => onClick(t)} isMini />
            ))}
          </div>
        </>
      )}
    </>
  )
}

function AiTestCard({ test: t, relatedMini, onClick, isMini }: {
  test: AiTest; relatedMini?: AiTest; onClick: () => void; isMini?: boolean
}) {
  const subj = (SUBJECTS as any)[t.subjectId]
  const folderTitle = t.folderInfo?.title
  const isBlok = t.testType === 'ai_blok'
  const isFree = t.testType === 'ai_free'

  return (
    <button onClick={onClick} style={cardStyle()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-block',
            fontSize: 9.5, fontWeight: 800,
            padding: '2px 8px', borderRadius: 100,
            background: isMini ? 'rgba(255,204,68,0.15)' :
                        isBlok ? 'rgba(167,139,250,0.15)' :
                        isFree ? 'rgba(0,212,170,0.15)' : 'rgba(123,104,238,0.15)',
            color: isMini ? 'var(--y)' :
                   isBlok ? 'var(--acc-l)' :
                   isFree ? 'var(--g)' : 'var(--acc-l)',
            marginBottom: 4, letterSpacing: 0.3,
          }}>
            {isMini ? '🎯 MINI' : isBlok ? '📦 BLOK' : isFree ? '🎯 ERKIN' : '🤖 PAPKA'}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
            {subj?.icon || (isBlok || isFree ? '📊' : '')} {t.subjectName}
          </div>
          {folderTitle && !isBlok && !isFree && (
            <div style={{ fontSize: 10, color: 'var(--txt-2)', marginBottom: 2 }}>
              📁 "{folderTitle}"
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
            {new Date(t.endTime || t.createdAt).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            {' · '}{t.totalCorrect}/{t.totalQuestions}
          </div>
          {relatedMini && (
            <div style={{
              marginTop: 6, padding: '4px 8px',
              background: 'rgba(255,204,68,0.08)',
              border: '1px solid rgba(255,204,68,0.2)',
              borderRadius: 6,
              fontSize: 10, color: 'var(--y)',
              display: 'inline-block',
            }}>
              ✓ Mini-test ham bor ({relatedMini.totalCorrect}/{relatedMini.totalQuestions})
            </div>
          )}
        </div>
        <div style={{
          fontWeight: 800, fontSize: 16,
          color: t.scorePercent >= 70 ? 'var(--g)' : t.scorePercent >= 50 ? 'var(--y)' : 'var(--r)',
          whiteSpace: 'nowrap',
        }}>{t.scorePercent}%</div>
      </div>
    </button>
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
