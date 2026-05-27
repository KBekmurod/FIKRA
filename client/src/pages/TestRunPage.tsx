import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { examApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { triggerHaptic } from '../utils/haptics'
import RichText from '../components/RichText'
import { SUBJECTS } from '../constants/subjects'
import './TestRun.css' // Import premium styles

interface Question {
  _id: string
  subject: string
  subjectName?: string
  question: string
  options: string[]
}

interface RunState {
  mode?: string
  questions: Question[]
  durationSeconds: number
  subjectBreakdown?: any[]
}

export default function TestRunPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const toast = useToast()
  const state = location.state as RunState | null

  const [questions, setQuestions] = useState<Question[]>(state?.questions || [])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(state?.durationSeconds || 10800)
  const [finishing, setFinishing] = useState(false)
  const [exitTarget, setExitTarget] = useState<string | null>(null)
  const [showGrid, setShowGrid] = useState(false)
  const [finishPrompt, setFinishPrompt] = useState(false)
  const [loading, setLoading] = useState(!state?.questions?.length)
  
  const [animKey, setAnimKey] = useState(0)
  const finishedRef = useRef(false)

  // Resume session
  useEffect(() => {
    if (questions.length > 0 || !sessionId) return
    const restoreSession = async () => {
      try {
        const { data } = await examApi.resume(sessionId)
        setQuestions(data.questions)
        setTimeLeft(data.durationSeconds)
        
        const restoredSelected: Record<number, number> = {}
        data.questions.forEach((q: any, i: number) => {
          if (q.selectedOption !== null && q.selectedOption !== undefined) {
            restoredSelected[i] = q.selectedOption
          }
        })
        setSelected(restoredSelected)
        setLoading(false)
      } catch (err) {
        setLoading(false)
      }
    }
    restoreSession()
  }, [sessionId, questions.length])

  // Beacon abandon
  useEffect(() => {
    if (!sessionId) return
    const onUnload = () => {
      if (finishedRef.current) return
      try {
        const data = new Blob([JSON.stringify({})], { type: 'application/json' })
        const url = `/api/exams/sessions/${sessionId}/abandon`
        navigator.sendBeacon?.(url, data)
      } catch {}
    }
    window.addEventListener('beforeunload', onUnload)
    window.addEventListener('pagehide', onUnload)
    return () => {
      window.removeEventListener('beforeunload', onUnload)
      window.removeEventListener('pagehide', onUnload)
    }
  }, [sessionId])

  useEffect(() => {
    const onNavAttempt = (e: any) => {
      e.preventDefault()
      setExitTarget(e.detail.target)
    }
    window.addEventListener('fikra:nav-attempt', onNavAttempt)
    return () => window.removeEventListener('fikra:nav-attempt', onNavAttempt)
  }, [])

  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const onPopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href)
      setExitTarget('/testlar')
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Timer
  useEffect(() => {
    if (finishedRef.current) return
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id)
          handleFinish(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
      : `${m}:${String(ss).padStart(2, '0')}`
  }

  const pickAnswer = async (i: number) => {
    if (selected[qIdx] !== undefined) return
    triggerHaptic('click')
    setSelected(prev => ({ ...prev, [qIdx]: i }))
    try {
      await examApi.answer(sessionId!, questions[qIdx]._id, i)
    } catch {}
  }

  const handleFinish = useCallback(async (auto = false) => {
    if (finishing || finishedRef.current) return
    setFinishing(true)
    finishedRef.current = true
    try {
      const { data } = await examApi.finish(sessionId!)
      navigate(`/test-result/${sessionId}`, { state: data, replace: true })
    } catch (e: any) {
      if (!auto) toast.error('Yakunlashda xatolik')
      setFinishing(false)
      finishedRef.current = false
    }
  }, [sessionId, finishing, navigate, toast])

  const confirmExit = async () => {
    finishedRef.current = true
    try { await examApi.abandon(sessionId!) } catch {}
    const target = exitTarget || '/testlar'
    setExitTarget(null)
    navigate(target)
  }

  const navigateTo = (index: number) => {
    if (index >= 0 && index < questions.length && index !== qIdx) {
      setQIdx(index)
      setAnimKey(k => k + 1)
      triggerHaptic('click')
      setShowGrid(false)
    }
  }

  if (loading) {
    return (
      <div className="test-run-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12, animation: 'pulse 1s infinite' }}>⏳</div>
        <div style={{ fontWeight: 600, color: 'var(--txt-2)' }}>Test holati tiklanmoqda...</div>
      </div>
    )
  }

  if (!sessionId || !questions.length) {
    return (
      <div className="test-run-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 24 }}>Test ma'lumotlari topilmadi</div>
        <button className="btn btn-primary" onClick={() => navigate('/testlar')}>Testlarga qaytish</button>
      </div>
    )
  }

  const q = questions[qIdx]
  const total = questions.length
  const isLast = qIdx === total - 1
  const answered = Object.keys(selected).length
  const progressPercent = (answered / total) * 100

  return (
    <div className="test-run-layout">
      {/* 1. Header & Progress */}
      <div className="test-top-bar">
        <button onClick={() => setExitTarget('/testlar')} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
          fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0,
        }}>⨉ Chiqish</button>
        
        <div style={{
          background: timeLeft < 300 ? 'rgba(255,95,126,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${timeLeft < 300 ? 'var(--r)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 100, padding: '6px 16px', fontFamily: 'monospace', fontWeight: 800,
          fontSize: 15, color: timeLeft < 300 ? 'var(--r)' : '#fff',
          boxShadow: timeLeft < 300 ? '0 0 10px rgba(255,95,126,0.3)' : 'none',
        }}>
          {fmt(timeLeft)}
        </div>

        <button onClick={() => setShowGrid(true)} style={{ 
          background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0 
        }}>
          {qIdx + 1}/{total} ☰
        </button>
      </div>
      
      <div className="test-progress-container">
        <div className="test-progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* 2. Main Question Area */}
      <div className="test-slide-container">
        <div key={animKey} className="test-slide-enter">
          
          <div className="test-topic-label">
            {q.subjectName || (SUBJECTS as any)[q.subject]?.name || q.subject}
          </div>

          <div className="test-question-card">
            <RichText content={q.question} images={(q as any).images} />
          </div>

          <div className="test-options-grid">
            {q.options.map((opt, i) => {
              const isSel = selected[qIdx] === i
              return (
                <button
                  key={i}
                  onClick={() => pickAnswer(i)}
                  disabled={selected[qIdx] !== undefined}
                  className={`test-option-btn ${isSel ? 'selected' : ''}`}
                >
                  <div className="test-radio">
                    <div className="test-radio-inner" />
                  </div>
                  <div style={{ flex: 1, paddingTop: 1 }}>
                    <RichText content={opt.replace(/^[A-D][).]\s*/i, '')} inline />
                  </div>
                </button>
              )
            })}
          </div>

        </div>
      </div>

      {/* 3. Bottom Navigation */}
      <div className="test-bottom-nav">
        <button 
          className="test-nav-btn prev" 
          onClick={() => navigateTo(qIdx - 1)} 
          disabled={qIdx === 0}
        >← Oldingi</button>
        
        {!isLast ? (
          <button 
            className="test-nav-btn next" 
            onClick={() => navigateTo(qIdx + 1)}
          >Keyingi →</button>
        ) : (
          <button 
            className="test-nav-btn finish" 
            onClick={() => setFinishPrompt(true)}
            disabled={finishing}
          >Yakunlash 🏁</button>
        )}
      </div>

      {/* 4. Mini-map (Grid) Overlay */}
      {showGrid && (
        <div className="test-grid-overlay" onClick={() => setShowGrid(false)}>
          <div className="test-grid-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>Savollar xaritasi</div>
              <button onClick={() => setShowGrid(false)} style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 50,
                width: 30, height: 30, color: '#fff', fontWeight: 800, cursor: 'pointer'
              }}>⨉</button>
            </div>
            
            <div className="test-grid-scroll">
              <div className="test-grid-bubbles">
                {questions.map((_, i) => {
                  const isAns = selected[i] !== undefined
                  const isCur = i === qIdx
                  let cls = 'test-bubble'
                  if (isCur) cls += ' current'
                  else if (isAns) cls += ' answered'
                  return (
                    <div key={i} className={cls} onClick={() => navigateTo(i)}>
                      {i + 1}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modals */}
      {exitTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--f)', borderRadius: 24, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚪</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Testdan chiqasizmi?</div>
            <p style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 24 }}>Jarayon arxivlanadi, keyinroq qaytib davom ettirishingiz mumkin.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setExitTarget(null)} style={{ flex: 1 }}>Qolish</button>
              <button className="btn btn-danger" onClick={confirmExit} style={{ flex: 1 }}>Chiqish</button>
            </div>
          </div>
        </div>
      )}

      {finishPrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--s1)', border: '1px solid var(--f)', borderRadius: 24, padding: 24, maxWidth: 340, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Testni yakunlaysizmi?</div>
            <p style={{ fontSize: 13, color: 'var(--txt-2)', marginBottom: 24 }}>
              {answered < total ? `Hali ${total - answered} ta savolga javob bermadingiz.` : 'Barcha savollarga javob berdingiz!'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setFinishPrompt(false)} style={{ flex: 1 }}>Orqaga</button>
              <button className="btn btn-success" onClick={() => handleFinish(false)} disabled={finishing} style={{ flex: 1 }}>
                {finishing ? '...' : 'Yakunlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
