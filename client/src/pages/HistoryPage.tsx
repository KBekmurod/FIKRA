import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi, personalTestApi } from '../api/endpoints'
import { useToast } from '../components/Toast'

type Tab = 'fikra' | 'ai'

export default function HistoryPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('fikra')

  const [fikra, setFikra] = useState<any[]>([])
  const [ai, setAi] = useState<any[]>([])
  const [fikraPage, setFikraPage] = useState(1)
  const [aiPage, setAiPage] = useState(1)
  const [fikraHasMore, setFikraHasMore] = useState(false)
  const [aiHasMore, setAiHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadFikra = async (page: number, append = false) => {
    try {
      const { data }: any = await examApi.history(undefined, page)
      const items = data.sessions || data.history || []
      const total = data.total || 0
      setFikra(prev => append ? [...prev, ...items] : items)
      setFikraHasMore(page * 10 < total)
    } catch {
      toast.error("Tarix yuklanmadi")
    }
  }

  const loadAi = async (page: number, append = false) => {
    try {
      const { data } = await personalTestApi.history(undefined, undefined, page)
      setAi(prev => append ? [...prev, ...data.tests] : data.tests)
      setAiHasMore(page < data.pages)
    } catch {
      toast.error("AI tarix yuklanmadi")
    }
  }

  useEffect(() => {
    Promise.all([loadFikra(1), loadAi(1)]).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="header">
        <div className="header-logo">📚 Tarix</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <div className="seg-tabs">
          <button
            className={`seg-tab ${tab === 'fikra' ? 'active' : ''}`}
            onClick={() => setTab('fikra')}
          >🎓 FIKRA testlari</button>
          <button
            className={`seg-tab ${tab === 'ai' ? 'active' : ''}`}
            onClick={() => setTab('ai')}
          >🤖 AI testlarim</button>
        </div>

        {loading ? (
          <div style={{ padding: 30 }}>
            <div className="skel-card" />
          </div>
        ) : tab === 'fikra' ? (
          <FikraList
            items={fikra}
            hasMore={fikraHasMore}
            onLoadMore={() => {
              const nextPage = fikraPage + 1
              setFikraPage(nextPage)
              loadFikra(nextPage, true)
            }}
            onItemClick={(item) => navigate(`/test-result/${item._id}`, {
              state: {
                sessionId: item._id,
                mode: item.mode,
                totalScore: item.totalScore,
                maxTotalScore: item.maxTotalScore,
                percent: item.maxTotalScore > 0 ? Math.round((item.totalScore / item.maxTotalScore) * 100) : 0,
                subjectBreakdown: item.subjectBreakdown,
              },
            })}
          />
        ) : (
          <AiList
            items={ai}
            hasMore={aiHasMore}
            onLoadMore={() => {
              const nextPage = aiPage + 1
              setAiPage(nextPage)
              loadAi(nextPage, true)
            }}
            onItemClick={(item) => navigate(`/personal-tests/${item._id}/result`)}
          />
        )}
      </div>
    </>
  )
}

function FikraList({ items, hasMore, onLoadMore, onItemClick }: any) {
  if (items.length === 0) {
    return <EmptyState icon="📭" text="Hali test ishlanmagan" />
  }
  return (
    <>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {items.map((it: any) => {
          const pct = it.maxTotalScore > 0 ? Math.round((it.totalScore / it.maxTotalScore) * 100) : 0
          const isBlok = it.mode === 'dtm'
          return (
            <button key={it._id} onClick={() => onItemClick(it)} style={{
              background: 'var(--s1)',
              border: '1px solid var(--f)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              color: 'var(--txt)',
              textAlign: 'left',
            }}>
              <div style={{
                fontSize: 22,
                background: isBlok ? 'rgba(0,212,170,0.12)' : 'rgba(123,104,238,0.12)',
                borderRadius: 10,
                padding: '6px 10px',
              }}>{isBlok ? '🎯' : '📚'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {isBlok ? 'Maxsus blok' : 'Erkin tanlov'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                  {new Date(it.endTime || it.createdAt).toLocaleString('uz-UZ', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontWeight: 800, fontSize: 14,
                  color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                }}>{pct}%</div>
                <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                  {it.totalScore?.toFixed(1)}/{it.maxTotalScore?.toFixed(1)}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {hasMore && (
        <button onClick={onLoadMore} className="btn btn-ghost btn-block" style={{ marginTop: 12 }}>
          Yana ko'rsatish ↓
        </button>
      )}
    </>
  )
}

function AiList({ items, hasMore, onLoadMore, onItemClick }: any) {
  if (items.length === 0) {
    return <EmptyState icon="🤖" text="AI testlar hali yo'q. Omborda material qo'shing va test yarating!" />
  }
  return (
    <>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {items.map((it: any) => {
          const pct = it.scorePercent
          return (
            <button key={it._id} onClick={() => onItemClick(it)} style={{
              background: 'var(--s1)',
              border: '1px solid var(--f)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              color: 'var(--txt)',
              textAlign: 'left',
            }}>
              <div style={{
                fontSize: 22,
                background: 'rgba(123,104,238,0.12)',
                borderRadius: 10,
                padding: '6px 10px',
              }}>🤖</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {it.subjectName} {it.testType === 'mini' && '· Mini'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                  {new Date(it.endTime || it.createdAt).toLocaleString('uz-UZ', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontWeight: 800, fontSize: 14,
                  color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                }}>{pct}%</div>
                <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                  {it.totalCorrect}/{it.totalQuestions}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {hasMore && (
        <button onClick={onLoadMore} className="btn btn-ghost btn-block" style={{ marginTop: 12 }}>
          Yana ko'rsatish ↓
        </button>
      )}
    </>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center',
      background: 'var(--s1)',
      border: '1px solid var(--f)',
      borderRadius: 14,
      marginTop: 16,
    }}>
      <div style={{ fontSize: 40 }}>{icon}</div>
      <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8 }}>{text}</p>
    </div>
  )
}
