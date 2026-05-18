import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { examApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'
import RichText from '../components/RichText'
import '../components/RichText.css'

const PAGE_SIZE = 10

export default function TestReviewPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/tarix')
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const toast = useToast()
  const initial = location.state as any

  const [data, setData] = useState<any>(initial || null)
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState<string | 'all'>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!sessionId) return
    examApi.review(sessionId)
      .then(({ data }: any) => {
        setData(prev => ({ ...prev, ...(data.session || data) }))
        setAnswers(data.answers || [])
      })
      .catch(() => toast.error("Ma'lumotlar yuklanmadi"))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading || !data) {
    return (
      <div style={{ padding: 20 }}>
        <div className="skel-card" />
      </div>
    )
  }

  const breakdown = data.subjectBreakdown || []
  const filtered = subjectFilter === 'all'
    ? answers
    : answers.filter((a: any) => a.subject === subjectFilter || a.subjectId === subjectFilter)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>📊 Natijalar</div>
      </div>

      {/* Fan bo'yicha breakdown */}
      <div style={{ padding: '8px 20px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
          FAN BO'YICHA
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {breakdown.map((b: any, i: number) => {
            const acc = b.questionCount > 0 ? Math.round((b.correct / b.questionCount) * 100) : 0
            return (
              <div key={i} style={{
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                borderRadius: 10,
                padding: '11px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{b.subjectName}</span>
                  <span style={{ fontSize: 12, color: acc >= 70 ? 'var(--g)' : acc >= 50 ? 'var(--y)' : 'var(--r)', fontWeight: 700 }}>
                    {b.correct}/{b.questionCount} · {acc}%
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--s2)', borderRadius: 100 }}>
                  <div style={{
                    height: '100%',
                    width: `${acc}%`,
                    background: acc >= 70 ? 'var(--g)' : acc >= 50 ? 'var(--y)' : 'var(--r)',
                    borderRadius: 100,
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 4 }}>
                  {b.score.toFixed(1)} / {b.maxScore.toFixed(1)} ball
                </div>
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: 12, padding: 12,
          background: 'rgba(123,104,238,0.08)',
          border: '1px solid rgba(123,104,238,0.2)',
          borderRadius: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>UMUMIY</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--acc-l)' }}>
            {data.totalScore?.toFixed(1) || 0} / {data.maxTotalScore?.toFixed(1) || 0} · {data.percent || 0}%
          </span>
        </div>
      </div>

      {/* Filter — savollar bo'yicha */}
      {answers.length > 0 && (
        <>
          <div className="section-title">Barcha savollar ({filtered.length})</div>

          {/* Fan filtri */}
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setSubjectFilter('all'); setPage(1) }}
              style={{
                background: subjectFilter === 'all' ? 'var(--acc)' : 'var(--s1)',
                border: '1px solid var(--f)',
                color: subjectFilter === 'all' ? 'white' : 'var(--txt-2)',
                fontSize: 11, fontWeight: 700,
                padding: '6px 12px', borderRadius: 100,
                cursor: 'pointer',
              }}
            >Hammasi</button>
            {breakdown.map((b: any) => (
              <button
                key={b.subjectId}
                onClick={() => { setSubjectFilter(b.subjectId); setPage(1) }}
                style={{
                  background: subjectFilter === b.subjectId ? 'var(--acc)' : 'var(--s1)',
                  border: '1px solid var(--f)',
                  color: subjectFilter === b.subjectId ? 'white' : 'var(--txt-2)',
                  fontSize: 11, fontWeight: 700,
                  padding: '6px 12px', borderRadius: 100,
                  cursor: 'pointer',
                }}
              >{b.subjectName}</button>
            ))}
          </div>

          {/* Savollar ro'yxati */}
          <div style={{ padding: '0 20px', display: 'grid', gap: 8 }}>
            {pageItems.map((a: any, i: number) => (
              <AnswerCard key={a._id || i} answer={a} index={(page - 1) * PAGE_SIZE + i} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="btn btn-ghost"
                style={{ opacity: page === 1 ? 0.4 : 1 }}
              >← Oldingi</button>
              <span style={{
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--txt-2)',
              }}>{page}/{totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="btn btn-ghost"
                style={{ opacity: page === totalPages ? 0.4 : 1 }}
              >Keyingi →</button>
            </div>
          )}
        </>
      )}

      <div style={{ height: 20 }} />
    </>
  )
}

function AnswerCard({ answer, index }: { answer: any; index: number }) {
  const [open, setOpen] = useState(false)
  const correct = answer.isCorrect
  const skipped = answer.selectedOption === null || answer.selectedOption === undefined

  return (
    <div style={{
      background: 'var(--s1)',
      border: `1px solid ${correct ? 'rgba(0,212,170,0.25)' : skipped ? 'var(--f)' : 'rgba(255,95,126,0.25)'}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 14px',
          background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', gap: 10,
          color: 'var(--txt)', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          width: 24, height: 24, borderRadius: 6,
          background: correct ? 'rgba(0,212,170,0.15)' : skipped ? 'var(--s2)' : 'rgba(255,95,126,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: correct ? 'var(--g)' : skipped ? 'var(--txt-3)' : 'var(--r)',
          fontWeight: 800, fontSize: 12,
        }}>{correct ? '✓' : skipped ? '−' : '✗'}</span>
        <span style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 700, minWidth: 30 }}>
          #{index + 1}
        </span>
        <span style={{ flex: 1, fontSize: 12, lineHeight: 1.5, color: 'var(--txt-2)' }}>
          <RichText content={(answer.questionText || answer.question || '').slice(0, 80)} inline />
          {(answer.questionText || answer.question || '').length > 80 && '...'}
        </span>
        <span style={{ color: 'var(--txt-3)', fontSize: 13 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ padding: '0 14px 12px' }}>
          <div style={{ fontSize: 12, color: 'var(--txt)', marginBottom: 8, lineHeight: 1.5 }}>
            <RichText content={answer.questionText || answer.question} />
          </div>
          {(answer.questionOptions || answer.options || []).map((opt: string, i: number) => {
            let color = 'var(--txt-3)', icon = ''
            const correctIdx = answer.correctAnswer !== undefined ? answer.correctAnswer : answer.correctIndex
            if (i === correctIdx) { color = 'var(--g)'; icon = '✓ ' }
            else if (i === answer.selectedOption && !correct) { color = 'var(--r)'; icon = '✗ ' }
            return (
              <div key={i} style={{ fontSize: 11, color, marginBottom: 4, lineHeight: 1.5 }}>
                {icon}<span style={{ fontWeight: 700 }}>{['A','B','C','D'][i]})</span> <RichText content={opt} inline />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
