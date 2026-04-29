import { useState } from 'react'
import { useAppStore } from '../store'
import { testApi, aiApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import type { Question } from '../types'
import SubscriptionModal from '../components/SubscriptionModal'

const SUBJECTS = [
  // Majburiy
  { id: 'uztil',  name: 'Ona tili',     emoji: '🔤', block: 'majburiy' },
  { id: 'math',   name: 'Matematika',   emoji: '➕', block: 'majburiy' },
  { id: 'tarix',  name: 'Tarix',        emoji: '🏛️', block: 'majburiy' },
  // Mutaxassislik
  { id: 'bio',    name: 'Biologiya',    emoji: '🧬', block: 'mutaxassislik' },
  { id: 'kimyo',  name: 'Kimyo',        emoji: '⚗️', block: 'mutaxassislik' },
  { id: 'fizika', name: 'Fizika',       emoji: '⚛️', block: 'mutaxassislik' },
  { id: 'ingliz', name: 'Ingliz tili',  emoji: '🇬🇧', block: 'mutaxassislik' },
  { id: 'inform', name: 'Informatika',  emoji: '💻', block: 'mutaxassislik' },
  { id: 'iqtisod',name: 'Iqtisodiyot',  emoji: '💰', block: 'mutaxassislik' },
]

type ViewState = 'list' | 'quiz' | 'result'

export default function TestPage() {
  const [view, setView] = useState<ViewState>('list')
  const [subject, setSubject] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [stats, setStats] = useState({ correct: 0, wrong: 0, ball: 0 })
  const [loading, setLoading] = useState(false)
  const [subOpen, setSubOpen] = useState(false)
  const { user, refreshUser } = useAppStore()
  const { toast } = useToast()

  const startTest = async (subj: string, block: string) => {
    setLoading(true)
    try {
      const { data } = await testApi.questions(subj, block, 10)
      if (!data.length) {
        toast('Bu fan bo\'yicha savollar yo\'q', 'err')
        setLoading(false)
        return
      }
      setSubject(subj)
      setQuestions(data)
      setQIdx(0)
      setStats({ correct: 0, wrong: 0, ball: 0 })
      setView('quiz')
    } catch (e: any) {
      toast(e.response?.data?.error || 'Xatolik', 'err')
    } finally { setLoading(false) }
  }

  const finishTest = async () => {
    try {
      await testApi.result({
        gameType: 'test',
        subject,
        ballAmount: stats.ball,
        maxBall: questions.length * 1.1,
        correctCount: stats.correct,
        totalQuestions: questions.length,
      })
      refreshUser()
    } catch {}
    setView('result')
  }

  if (view === 'list') {
    return <SubjectList onStart={startTest} loading={loading} />
  }

  if (view === 'quiz') {
    return (
      <Quiz
        questions={questions}
        qIdx={qIdx}
        subject={subject}
        stats={stats}
        onAnswer={(isCorrect: boolean, ball: number) => {
          setStats(s => ({
            correct: s.correct + (isCorrect ? 1 : 0),
            wrong: s.wrong + (isCorrect ? 0 : 1),
            ball: s.ball + ball,
          }))
        }}
        onNext={() => {
          if (qIdx + 1 >= questions.length) finishTest()
          else setQIdx(qIdx + 1)
        }}
        onExit={() => setView('list')}
        onSubOpen={() => setSubOpen(true)}
      />
    )
  }

  // Result
  const pct = Math.round((stats.correct / questions.length) * 100)
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👏' : pct >= 40 ? '💪' : '📖'
  const subjectName = SUBJECTS.find(s => s.id === subject)?.name || subject

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
      </div>
      <div style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>{emoji}</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--acc-l)' }}>
          {stats.ball.toFixed(1)}
        </div>
        <div style={{ fontSize: 14, color: 'var(--txt-2)', marginBottom: 6 }}>
          ball ({pct}%)
        </div>
        <div style={{ fontSize: 13, color: 'var(--txt-3)', marginBottom: 24 }}>
          {subjectName} · {stats.correct} ta to'g'ri / {stats.wrong} ta xato
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-block" onClick={() => setView('list')}>
            ← Orqaga
          </button>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              const subj = SUBJECTS.find(s => s.id === subject)
              if (subj) startTest(subject, subj.block)
            }}
          >
            🔄 Qayta
          </button>
        </div>
      </div>
      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}

function SubjectList({ onStart, loading }: { onStart: (s: string, b: string) => void; loading: boolean }) {
  const majburiy = SUBJECTS.filter(s => s.block === 'majburiy')
  const mutaxassislik = SUBJECTS.filter(s => s.block === 'mutaxassislik')

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <div style={{
          background: 'rgba(123,104,238,0.07)',
          border: '1px solid rgba(123,104,238,0.2)',
          borderRadius: 'var(--br2)',
          padding: '10px 14px',
          fontSize: 12,
          color: 'var(--txt-2)',
        }}>
          📚 DTM 2025 standardidagi savollar · har savol yonida AI tushuntirish 💡
        </div>
      </div>

      <div className="section-title">📌 Majburiy fanlar</div>
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {majburiy.map(s => (
          <button
            key={s.id}
            disabled={loading}
            onClick={() => onStart(s.id, s.block)}
            style={{
              background: 'var(--s1)',
              border: '1px solid var(--f)',
              borderRadius: 'var(--br2)',
              padding: '14px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              color: 'var(--txt)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 26 }}>{s.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{s.name}</div>
          </button>
        ))}
      </div>

      <div className="section-title">🎯 Mutaxassislik fanlari</div>
      <div style={{ padding: '0 20px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {mutaxassislik.map(s => (
          <button
            key={s.id}
            disabled={loading}
            onClick={() => onStart(s.id, s.block)}
            style={{
              background: 'var(--s1)',
              border: '1px solid var(--f)',
              borderRadius: 'var(--br2)',
              padding: '14px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              color: 'var(--txt)',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 26 }}>{s.emoji}</div>
            <div style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{s.name}</div>
          </button>
        ))}
      </div>
    </>
  )
}

function Quiz({
  questions, qIdx, subject, stats,
  onAnswer, onNext, onExit, onSubOpen
}: any) {
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const { user } = useAppStore()
  const { toast } = useToast()

  const q = questions[qIdx]

  const select = async (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    try {
      const { data } = await testApi.checkAnswer(q._id, idx)
      setResult(data)
      onAnswer(data.isCorrect, data.isCorrect ? 1.1 : 0)
      // Xato bo'lsa va explanation bor — avtomatik ko'rsatamiz
      if (!data.isCorrect && data.explanation) {
        setHint(data.explanation)
      }
    } catch (e: any) {
      toast(e.response?.data?.error || 'Xato', 'err')
    }
  }

  const askHint = async () => {
    setHintLoading(true)
    try {
      const { data } = await aiApi.hint(q.question, q.options, q.subject, 'hint')
      setHint(data.hint)
    } catch (e: any) {
      if (e.response?.data?.code === 'DAILY_LIMIT_REACHED') {
        toast('Bugungi AI limit tugadi. Obuna oling!', 'err')
        onSubOpen()
      } else if (e.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        onSubOpen()
      } else {
        toast(e.response?.data?.error || 'Xato', 'err')
      }
    } finally { setHintLoading(false) }
  }

  const nextQ = () => {
    setSelected(null)
    setResult(null)
    setHint(null)
    onNext()
  }

  const hintsUsed = user?.aiUsage?.hints ?? 0
  const hintsLimit = user?.aiLimits?.hints ?? 5
  const canHint = hintsLimit === null || hintsUsed < (hintsLimit as number)

  return (
    <div style={{ padding: '12px 16px', minHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onExit}>← Orqaga</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', fontWeight: 600 }}>
          {qIdx + 1} / {questions.length}
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
          {hintsLimit === null ? '∞' : `${hintsUsed}/${hintsLimit}`} 💡
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 4, background: 'var(--s2)', borderRadius: 100, marginBottom: 16 }}>
        <div style={{
          height: '100%',
          background: 'var(--acc)',
          width: `${(qIdx / questions.length) * 100}%`,
          borderRadius: 100,
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Question */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
          {q.question}
        </div>
      </div>

      {/* Hint button */}
      {!hint && selected === null && (
        <button
          disabled={hintLoading}
          onClick={canHint ? askHint : onSubOpen}
          style={{
            width: '100%',
            padding: 10,
            background: canHint ? 'rgba(0,212,170,0.1)' : 'rgba(255,95,126,0.07)',
            border: `1px solid ${canHint ? 'rgba(0,212,170,0.3)' : 'rgba(255,95,126,0.25)'}`,
            borderRadius: 'var(--br2)',
            color: canHint ? 'var(--g)' : 'var(--txt-2)',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 10,
            cursor: 'pointer',
          }}
        >
          {hintLoading ? '⏳ Yuklanmoqda...' : canHint ? '💡 AI maslahat' : '💡 Limit tugadi · Obuna ↗'}
        </button>
      )}

      {/* Hint text */}
      {hint && (
        <div style={{
          background: 'rgba(0,212,170,0.07)',
          border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 'var(--br2)',
          padding: 12,
          fontSize: 12,
          lineHeight: 1.6,
          marginBottom: 12,
          color: 'var(--txt)',
        }}>{hint}</div>
      )}

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {q.options.map((opt: string, i: number) => {
          let bg = 'var(--s2)', borderColor = 'var(--f)'
          if (selected !== null) {
            if (i === result?.correctIndex) {
              bg = 'rgba(0,212,170,0.1)'
              borderColor = 'var(--g)'
            } else if (i === selected) {
              bg = 'rgba(255,95,126,0.08)'
              borderColor = 'var(--r)'
            }
          }
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => select(i)}
              style={{
                padding: '12px 16px',
                background: bg,
                border: `1.5px solid ${borderColor}`,
                borderRadius: 'var(--br2)',
                textAlign: 'left',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--txt)',
                cursor: selected !== null ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--txt-3)', marginRight: 10 }}>
                {['A', 'B', 'C', 'D'][i]}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Next button */}
      {selected !== null && (
        <button
          onClick={nextQ}
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 16 }}
        >
          {qIdx + 1 >= questions.length ? 'Natijani ko\'rish' : 'Keyingi savol →'}
        </button>
      )}
    </div>
  )
}
