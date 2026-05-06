import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { examApi, aiApi, testApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import SubscriptionModal from '../components/SubscriptionModal'
import {
  buildOfflineDtmSession,
  buildOfflineSubjectSession,
  calculateOfflineResult,
  getCachedExamConfig,
  saveCachedExamConfig,
  warmOfflineQuestionBank,
  type ExamConfigCache,
  type OfflineSessionData,
} from '../utils/offlinePractice'
import { enqueueOfflineResult } from '../utils/offlineSync'

// ─── Turlar ────────────────────────────────────────────────────────────────
type Screen =
  | 'home'          // Bosh ekran (2 karta)
  | 'dtm_setup'     // DTM yo'nalish tanlash
  | 'subject_setup' // Alohida fanlar tanlash
  | 'quiz'          // Test ishlash
  | 'result'        // Natija
  | 'history'       // Tarix ro'yxati
  | 'review'        // Sessiya ichki ko'rish

interface SubjectMeta { id: string; name: string; block: string; defaultCount: number; weight: number }
interface DirectionMeta { id: string; name: string; spec1: string; spec2: string; spec1Name: string; spec2Name: string }
interface SubjectBreakdown {
  subjectId: string; subjectName: string; block: string;
  weight: number; questionCount: number; correct: number; wrong: number;
  score: number; maxScore: number;
}
interface SessionResult {
  sessionId: string; mode: string; totalScore: number; maxTotalScore: number;
  percent: number; subjectBreakdown: SubjectBreakdown[]; direction?: string; directionName?: string;
  xp?: { added: number; total: number; levelUp: boolean } | null
}

const SUBJECT_EMOJI: Record<string, string> = {
  uztil:'🔤', math:'➕', tarix:'🏛️', bio:'🧬', kimyo:'⚗️',
  fizika:'⚛️', ingliz:'🇬🇧', inform:'💻', iqtisod:'💰', rus:'🇷🇺',
  geo:'🌍', adab:'📖',
}

// ─── Asosiy komponent ──────────────────────────────────────────────────────
export default function TestPage() {
  const [screen, setScreen] = useState<Screen>('home')
  const [config, setConfig] = useState<ExamConfigCache | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)   // quiz uchun
  const [resultData, setResultData] = useState<SessionResult | null>(null)
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null)
  const [historyMode, setHistoryMode] = useState<'dtm' | 'subject'>('dtm')
  const [subOpen, setSubOpen] = useState(false)
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const drillStartedRef = useRef(false)

  useEffect(() => {
    let alive = true

    const loadConfig = async () => {
      try {
        const { data } = await examApi.config()
        if (!alive) return
        setConfig(data)
        saveCachedExamConfig(data)

        if (navigator.onLine) {
          warmOfflineQuestionBank(data, async (subject, block, limit) => {
            const { data: pack } = await testApi.offlinePack(subject, block, limit)
            return pack
          }).catch(() => {})
        }
      } catch {
        const cached = getCachedExamConfig()
        if (cached && alive) setConfig(cached)
      }
    }

    loadConfig()
  }, [])

  useEffect(() => {
    if (!config || drillStartedRef.current) return

    const params = new URLSearchParams(location.search)
    if (params.get('drill') !== '1') return

    const subject = params.get('subject')
    if (!subject) return

    const rawCount = parseInt(params.get('count') || '5', 10)
    const count = Number.isFinite(rawCount) ? Math.min(10, Math.max(1, rawCount)) : 5

    drillStartedRef.current = true
    navigate('/test', { replace: true })
    void startSubject([subject], {
      questionCounts: { [subject]: count },
      durationSeconds: Math.max(10 * 60, count * 90),
    })
  }, [config, location.search, navigate])

  // Support starting drill via location.state (from AIPage)
  useEffect(() => {
    const state: any = (location as any).state
    if (state && state.drillSession) {
      setSessionData(state.drillSession)
      setScreen('quiz')
    }
  }, [location])

  const goHome = () => {
    setScreen('home')
    setSessionData(null)
    setResultData(null)
  }

  // ─── DTM boshlash ──────────────────────────────────────────────────────
  const startDtm = async (direction: string) => {
    try {
      const { data } = await examApi.startDtm(direction)
      setSessionData(data)
      setScreen('quiz')
    } catch (e: any) {
      const offlineSession = config ? buildOfflineDtmSession(config, direction) : null
      if (offlineSession) {
        setSessionData(offlineSession)
        setScreen('quiz')
        toast('Oflayn mashq rejimi ishga tushdi', 'ok')
        return
      }
      toast(e.response?.data?.error || 'Xatolik', 'err')
    }
  }

  // ─── Subject boshlash ──────────────────────────────────────────────────
  const startSubject = async (subjects: string[], advanced?: any) => {
    try {
      const { data } = await examApi.startSubject(subjects, advanced)
      setSessionData(data)
      setScreen('quiz')
    } catch (e: any) {
      const counts = advanced?.questionCounts || undefined
      const offlineSession = config ? buildOfflineSubjectSession(config, subjects, counts) : null
      if (offlineSession) {
        setSessionData({ ...offlineSession, advanced })
        setScreen('quiz')
        toast('Oflayn mashq rejimi ishga tushdi', 'ok')
        return
      }
      toast(e.response?.data?.error || 'Xatolik', 'err')
    }
  }

  // ─── Quiz tugadi → natija ──────────────────────────────────────────────
  const onQuizFinish = (result: SessionResult) => {
    setResultData(result)
    setScreen('result')
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        onDtm={() => setScreen('dtm_setup')}
        onSubject={() => setScreen('subject_setup')}
        onHistory={() => setScreen('history')}
      />
    )
  }

  if (screen === 'dtm_setup') {
    return (
      <DtmSetup
        directions={config?.directions || []}
        onStart={startDtm}
        onBack={goHome}
      />
    )
  }

  if (screen === 'subject_setup') {
    return (
      <SubjectSetup
        subjects={config?.subjects || []}
        onStart={startSubject}
        onBack={goHome}
      />
    )
  }

  if (screen === 'quiz' && sessionData) {
    return (
      <QuizScreen
        sessionData={sessionData}
        onFinish={onQuizFinish}
        onExit={goHome}
        onSubOpen={() => setSubOpen(true)}
      />
    )
  }

  if (screen === 'result' && resultData) {
    return (
      <ResultScreen
        result={resultData}
        onBack={goHome}
        onHistory={() => setScreen('history')}
        onReview={() => { setReviewSessionId(resultData.sessionId); setScreen('review') }}
      />
    )
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        mode={historyMode}
        onModeChange={setHistoryMode}
        onBack={goHome}
        onReview={(id: string) => { setReviewSessionId(id); setScreen('review') }}
      />
    )
  }

  if (screen === 'review' && reviewSessionId) {
    return (
      <ReviewScreen
        sessionId={reviewSessionId}
        onBack={() => setScreen('history')}
        onSubOpen={() => setSubOpen(true)}
      />
    )
  }

  return (
    <>
      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HomeScreen
// ═══════════════════════════════════════════════════════════════════════════
function HomeScreen({ onDtm, onSubject, onHistory }: any) {
  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
        <button onClick={onHistory} style={{
          background: 'var(--s2)', border: '1px solid var(--f)',
          borderRadius: 10, padding: '7px 12px', fontSize: 12,
          color: 'var(--txt-2)', cursor: 'pointer', fontWeight: 600,
        }}>📁 Tarix</button>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <div style={{
          background: 'rgba(123,104,238,0.07)', border: '1px solid rgba(123,104,238,0.18)',
          borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5,
        }}>
          📋 DTM 2026 · 90 savol · 180 daqiqa · maks. 189 ball
        </div>
      </div>

      <div className="section-title" style={{ marginTop: 16 }}>Test turini tanlang</div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* DTM karta */}
        <button onClick={onDtm} style={{
          background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(123,104,238,0.06))',
          border: '1.5px solid rgba(123,104,238,0.35)',
          borderRadius: 14, padding: '18px 18px', textAlign: 'left',
          color: 'var(--txt)', cursor: 'pointer', width: '100%',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Yo'nalish bo'yicha (DTM)</div>
          <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }}>
            Yo'nalishingizni tanlang — 3 majburiy + 2 mutaxassislik fan<br/>
            <span style={{ color: 'var(--acc-l)', fontWeight: 700 }}>90 savol · 180 daqiqa · 189 ball</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            {['Majburiy 3×10', 'Mutax. 2×30'].map(t => (
              <span key={t} style={{
                background: 'rgba(123,104,238,0.15)', border: '1px solid rgba(123,104,238,0.3)',
                borderRadius: 100, padding: '3px 10px', fontSize: 10, color: 'var(--acc-l)', fontWeight: 700,
              }}>{t}</span>
            ))}
          </div>
        </button>

        {/* Alohida fanlar karta */}
        <button onClick={onSubject} style={{
          background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,212,170,0.04))',
          border: '1.5px solid rgba(0,212,170,0.28)',
          borderRadius: 14, padding: '18px 18px', textAlign: 'left',
          color: 'var(--txt)', cursor: 'pointer', width: '100%',
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📚</div>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Alohida fanlar bo'yicha</div>
          <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }}>
            Istagan fan(lar)ni o'zingiz tanlang, 1 ta ham bo'ladi<br/>
            <span style={{ color: 'var(--g)', fontWeight: 700 }}>Erkin tanlash · o'z tempingizda</span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            {['1 yoki ko\'p fan', 'Savollar soni', 'Vaqt — auto'].map(t => (
              <span key={t} style={{
                background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.25)',
                borderRadius: 100, padding: '3px 10px', fontSize: 10, color: 'var(--g)', fontWeight: 700,
              }}>{t}</span>
            ))}
          </div>
        </button>
      </div>

      {/* Tarix kartasi */}
      <div style={{ padding: '12px 20px 20px' }}>
        <button onClick={onHistory} style={{
          width: '100%', background: 'var(--s1)', border: '1px solid var(--f)',
          borderRadius: 12, padding: '14px 16px', display: 'flex',
          alignItems: 'center', gap: 12, cursor: 'pointer', color: 'var(--txt)',
        }}>
          <span style={{ fontSize: 24 }}>📁</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Testlar tarixi</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Oldingi testlarni ko'ring, xatolarni tahlil qiling
            </div>
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--txt-3)', fontSize: 18 }}>›</span>
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DtmSetup
// ═══════════════════════════════════════════════════════════════════════════
function DtmSetup({ directions, onStart, onBack }: any) {
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const dir = directions.find((d: DirectionMeta) => d.id === selected)

  const handleStart = async () => {
    if (!selected) { toast("Yo'nalishni tanlang", 'err'); return }
    setLoading(true)
    try { await onStart(selected) } finally { setLoading(false) }
  }

  return (
    <>
      <div className="header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Orqaga</button>
        <div style={{ fontWeight: 700, fontSize: 15 }}>DTM Testi</div>
        <div style={{ width: 70 }} />
      </div>

      {/* Hisoblash eslatmasi */}
      <div style={{ padding: '4px 20px 8px' }}>
        <div style={{
          background: 'rgba(123,104,238,0.07)', border: '1px solid rgba(123,104,238,0.18)',
          borderRadius: 10, padding: '10px 14px', fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.6,
        }}>
          🔢 Ball formula: (Majburiy×1.1) + (Mutax.1×3.1) + (Mutax.2×2.1) = maks. 189
        </div>
      </div>

      <div className="section-title">Yo'nalishni tanlang</div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '50vh', overflowY: 'auto' }}>
        {directions.map((d: DirectionMeta) => (
          <button
            key={d.id}
            onClick={() => setSelected(d.id)}
            style={{
              padding: '12px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
              background: selected === d.id ? 'rgba(123,104,238,0.18)' : 'var(--s1)',
              border: `1.5px solid ${selected === d.id ? 'rgba(123,104,238,0.5)' : 'var(--f)'}`,
              color: 'var(--txt)', width: '100%',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }}>
              {d.spec1Name} (3.1) · {d.spec2Name} (2.1)
            </div>
          </button>
        ))}
        {directions.length === 0 && (
          <div style={{ color: 'var(--txt-3)', fontSize: 13, textAlign: 'center', padding: 20 }}>
            Yuklanmoqda...
          </div>
        )}
      </div>

      {dir && (
        <div style={{ padding: '10px 20px 0' }}>
          <div style={{
            background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 6 }}>Tanlangan yo'nalish:</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{dir.name}</div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>
              Majburiy: Ona tili, Matematika, Tarix (10×1.1 = 33 ball)<br/>
              {dir.spec1Name} 30×3.1 = 93 ball · {dir.spec2Name} 30×2.1 = 63 ball
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 20px' }}>
        <button
          onClick={handleStart}
          disabled={!selected || loading}
          className="btn btn-primary btn-block btn-lg"
        >
          {loading ? '⏳ Yuklanmoqda...' : '🚀 Testni boshlash'}
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SubjectSetup
// ═══════════════════════════════════════════════════════════════════════════
function SubjectSetup({ subjects, onStart, onBack }: any) {
  const [selected, setSelected] = useState<string[]>([])
  const [advanced, setAdvanced] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const majburiy = subjects.filter((s: SubjectMeta) => s.block === 'majburiy')
  const mutax    = subjects.filter((s: SubjectMeta) => s.block !== 'majburiy')

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const getCount = (s: SubjectMeta) => counts[s.id] ?? s.defaultCount

  const totalQ = selected.reduce((sum, id) => {
    const s = subjects.find((x: SubjectMeta) => x.id === id)
    return sum + (s ? getCount(s) : 0)
  }, 0)

  const handleStart = async () => {
    if (selected.length === 0) { toast("Kamida 1 ta fan tanlang", 'err'); return }
    setLoading(true)
    try {
      const adv = advanced && Object.keys(counts).length > 0
        ? { questionCounts: counts }
        : undefined
      await onStart(selected, adv)
    } finally { setLoading(false) }
  }

  const SubjectChip = ({ s }: { s: SubjectMeta }) => {
    const isSelected = selected.includes(s.id)
    return (
      <button
        onClick={() => toggle(s.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
          background: isSelected ? 'rgba(0,212,170,0.14)' : 'var(--s1)',
          border: `1.5px solid ${isSelected ? 'rgba(0,212,170,0.4)' : 'var(--f)'}`,
          color: 'var(--txt)', textAlign: 'left', width: '100%',
        }}
      >
        <span style={{ fontSize: 18 }}>{SUBJECT_EMOJI[s.id] || '📘'}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
            {s.defaultCount} savol · {s.weight} ball
          </div>
        </div>
        {isSelected && (
          <span style={{ color: 'var(--g)', fontSize: 16, fontWeight: 800 }}>✓</span>
        )}
      </button>
    )
  }

  return (
    <>
      <div className="header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Orqaga</button>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Fanlar tanlash</div>
        <div style={{ fontSize: 12, color: 'var(--g)', fontWeight: 700 }}>
          {selected.length} ta
        </div>
      </div>

      <div style={{ padding: '0 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 10, paddingTop: 4 }}>
          📌 Majburiy fanlar
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {majburiy.map((s: SubjectMeta) => <SubjectChip key={s.id} s={s} />)}
        </div>

        <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 10 }}>
          🎯 Mutaxassislik fanlari
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {mutax.map((s: SubjectMeta) => <SubjectChip key={s.id} s={s} />)}
        </div>

        {/* Advanced toggle */}
        <button
          onClick={() => setAdvanced(a => !a)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            background: 'var(--s2)', border: '1px solid var(--f)',
            color: 'var(--txt-2)', fontSize: 12, cursor: 'pointer', textAlign: 'left',
          }}
        >
          ⚙️ Qo'shimcha sozlamalar {advanced ? '▲' : '▼'}
        </button>

        {advanced && selected.length > 0 && (
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--f)',
            borderRadius: 10, padding: 14, marginTop: 8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 8 }}>
              Har fan uchun savol soni (1–50):
            </div>
            {selected.map(id => {
              const s = subjects.find((x: SubjectMeta) => x.id === id)
              if (!s) return null
              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>
                    {SUBJECT_EMOJI[id]} {s.name}
                  </span>
                  <input
                    type="number" min={1} max={50}
                    value={getCount(s)}
                    onChange={e => setCounts(c => ({ ...c, [id]: Math.min(50, Math.max(1, parseInt(e.target.value) || s.defaultCount)) }))}
                    style={{
                      width: 56, padding: '5px 8px', borderRadius: 8,
                      background: 'var(--s2)', border: '1px solid var(--f)',
                      color: 'var(--txt)', fontSize: 13, textAlign: 'center',
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Preview */}
        {selected.length > 0 && (
          <div style={{
            background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 10, padding: '10px 14px', marginTop: 10,
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 4 }}>Testingiz:</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--g)' }}>
              {totalQ} ta savol · ~{Math.round(totalQ * 2)} daqiqa
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }}>
              {selected.map(id => subjects.find((x: SubjectMeta) => x.id === id)?.name).join(', ')}
            </div>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>

      <div style={{ padding: '10px 20px 16px' }}>
        <button
          onClick={handleStart}
          disabled={selected.length === 0 || loading}
          className="btn btn-primary btn-block btn-lg"
        >
          {loading ? '⏳ Yuklanmoqda...' : `🚀 Boshlash (${totalQ} savol)`}
        </button>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// QuizScreen
// ═══════════════════════════════════════════════════════════════════════════
function QuizScreen({ sessionData, onFinish, onExit, onSubOpen }: any) {
  const { sessionId, questions, durationSeconds, subjectBreakdown, mode, offline } = sessionData

  const [qIdx, setQIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { selected: number; isCorrect: boolean; correctIndex: number; explanation: string }>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<any>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [timeLeft, setTimeLeft] = useState(durationSeconds)
  const [offlineAnswers, setOfflineAnswers] = useState<Record<string, { selected: number; isCorrect: boolean }>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { user } = useAppStore()
  const { toast } = useToast()

  const handleFinish = useCallback(async () => {
    if (finishing) return
    setFinishing(true)
    if (timerRef.current) clearInterval(timerRef.current)

    if (offline) {
      const offlineResult = calculateOfflineResult(sessionData as OfflineSessionData, offlineAnswers)
      enqueueOfflineResult({
        gameType: sessionData.mode === 'dtm' ? 'dtm' : 'subject',
        subject: sessionData.mode === 'subject'
          ? (sessionData.subjectBreakdown?.map((item: any) => item.subjectId).join(',') || undefined)
          : undefined,
        direction: sessionData.direction,
        ballAmount: Math.round(offlineResult.totalScore),
        maxBall: Math.round(offlineResult.maxTotalScore),
        correctCount: Object.values(offlineAnswers).filter(item => item.isCorrect).length,
        totalQuestions: questions.length,
      })
      onFinish(offlineResult)
      return
    }

    try {
      const { data } = await examApi.finish(sessionId)
      onFinish(data)
    } catch (e: any) {
      toast(e.response?.data?.error || 'Xato', 'err')
      setFinishing(false)
    }
  }, [finishing, sessionId, onFinish, toast])

  // Taymer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t: number) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleFinish()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [handleFinish])

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const q = questions[qIdx]
  const totalQ = questions.length

  const selectAnswer = async (idx: number) => {
    if (selected !== null) return
    setSelected(idx)

    if (offline) {
      const isCorrect = idx === q.answer
      const offlineResponse = {
        isCorrect,
        correctIndex: q.answer,
        explanation: q.explanation || '',
      }
      setResult(offlineResponse)
      setAnswers(prev => ({ ...prev, [q._id]: { selected: idx, isCorrect, correctIndex: q.answer, explanation: q.explanation || '' } }))
      setOfflineAnswers(prev => ({ ...prev, [q._id]: { selected: idx, isCorrect } }))
      if (!isCorrect && q.explanation) setHint(q.explanation)
      return
    }

    try {
      const { data } = await examApi.answer(sessionId, q._id, idx)
      setResult(data)
      setAnswers(prev => ({ ...prev, [q._id]: { selected: idx, isCorrect: data.isCorrect, correctIndex: data.correctIndex, explanation: data.explanation } }))
      if (!data.isCorrect && data.explanation) setHint(data.explanation)
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
      if (e.response?.data?.code === 'DAILY_LIMIT_REACHED' || e.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        toast('Bugungi AI limit tugadi. Obuna oling!', 'err')
        onSubOpen()
      } else {
        toast(e.response?.data?.error || 'AI xato', 'err')
      }
    } finally { setHintLoading(false) }
  }

  const nextQ = () => {
    setSelected(null); setResult(null); setHint(null)
    setQIdx(i => i + 1)
  }



  // Joriy fan nomi
  const currentSubjectName = q?.subjectName
    || subjectBreakdown?.find((s: SubjectBreakdown) => s.subjectId === q?.subject)?.subjectName
    || q?.subject || ''

  const hintsUsed   = user?.aiUsage?.hints ?? 0
  const hintsLimit  = user?.aiLimits?.hints ?? 5
  const canHint     = hintsLimit === null || hintsUsed < (hintsLimit as number)

  const pct = Math.round((qIdx / totalQ) * 100)
  const timeWarning = timeLeft < 300 // 5 daqiqa

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { if (window.confirm('Testdan chiqasizmi? Natija saqlanmaydi.')) onExit() }}
        >← Chiqish</button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt-2)' }}>
            {qIdx + 1} / {totalQ}
          </span>
          {currentSubjectName && (
            <span style={{ fontSize: 10, color: 'var(--txt-3)', marginLeft: 6 }}>
              · {currentSubjectName}
            </span>
          )}
        </div>

        <div style={{
          fontSize: 12, fontWeight: 700,
          color: timeWarning ? 'var(--r)' : 'var(--txt-2)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--s2)', borderRadius: 100, marginBottom: 14 }}>
        <div style={{
          height: '100%', background: 'var(--acc)',
          width: `${pct}%`, borderRadius: 100, transition: 'width 0.3s',
        }} />
      </div>

      {/* Question card */}
      <div className="card" style={{ marginBottom: 10, flex: '0 0 auto' }}>
        <div style={{ fontSize: 13, lineHeight: 1.65, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
          {q.question}
        </div>
      </div>

      {/* Hint button */}
      {!hint && selected === null && (
        <button
          disabled={hintLoading}
          onClick={canHint ? askHint : onSubOpen}
          style={{
            padding: '9px 12px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
            background: canHint ? 'rgba(0,212,170,0.08)' : 'rgba(255,95,126,0.06)',
            border: `1px solid ${canHint ? 'rgba(0,212,170,0.25)' : 'rgba(255,95,126,0.2)'}`,
            color: canHint ? 'var(--g)' : 'var(--txt-2)',
            fontSize: 12, fontWeight: 700,
          }}
        >
          {hintLoading ? '⏳ Yuklanmoqda...' : canHint ? '💡 AI maslahat' : '💡 Limit tugadi · Obuna ↗'}
        </button>
      )}

      {/* Hint text */}
      {hint && (
        <div style={{
          background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 10, padding: 10, fontSize: 12, lineHeight: 1.6, marginBottom: 10, color: 'var(--txt)',
        }}>{hint}</div>
      )}

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
        {q.options.map((opt: string, i: number) => {
          let bg = 'var(--s2)', border = 'var(--f)'
          if (selected !== null) {
            if (i === result?.correctIndex) { bg = 'rgba(0,212,170,0.1)'; border = 'var(--g)' }
            else if (i === selected)        { bg = 'rgba(255,95,126,0.08)'; border = 'var(--r)' }
          }
          return (
            <button
              key={i}
              disabled={selected !== null}
              onClick={() => selectAnswer(i)}
              style={{
                padding: '11px 14px', background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: 10, textAlign: 'left', fontSize: 13, lineHeight: 1.5,
                color: 'var(--txt)', cursor: selected !== null ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontWeight: 800, color: 'var(--txt-3)', marginRight: 10 }}>
                {['A', 'B', 'C', 'D'][i]}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Next / Finish */}
      {selected !== null && (
        qIdx + 1 >= totalQ ? (
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: 14 }}
          >
            {finishing ? '⏳ Saqlanmoqda...' : '🏁 Natijani ko\'rish'}
          </button>
        ) : (
          <button onClick={nextQ} className="btn btn-primary btn-block btn-lg" style={{ marginTop: 14 }}>
            Keyingi savol →
          </button>
        )
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ResultScreen
// ═══════════════════════════════════════════════════════════════════════════
function ResultScreen({ result, onBack, onHistory, onReview }: any) {
  const { totalScore, maxTotalScore, percent, subjectBreakdown, mode, xp } = result
  const emoji = percent >= 80 ? '🏆' : percent >= 60 ? '👏' : percent >= 40 ? '💪' : '📖'
  const grade = percent >= 90 ? "A'lo" : percent >= 75 ? 'Yaxshi' : percent >= 50 ? "O'rtacha" : "Yana o'qing"

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
      </div>
      <div style={{ padding: '8px 20px 20px' }}>
        {/* Umumiy natija */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(0,212,170,0.08))',
          border: '1px solid rgba(123,104,238,0.25)', borderRadius: 16,
          padding: 20, textAlign: 'center', marginBottom: 16,
        }}>
          <div style={{ fontSize: 52, marginBottom: 6 }}>{emoji}</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }}>
            {totalScore.toFixed(1)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 4 }}>
            / {maxTotalScore.toFixed(1)} ball · {percent}%
          </div>
          <div style={{
            display: 'inline-block', marginTop: 8,
            background: 'rgba(123,104,238,0.15)', border: '1px solid rgba(123,104,238,0.3)',
            borderRadius: 100, padding: '4px 14px', fontSize: 12, fontWeight: 700, color: 'var(--acc-l)',
          }}>{grade}</div>

          {result.directionName && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--txt-2)', fontWeight: 600 }}>
              🎯 {result.directionName}
            </div>
          )}

          {xp && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--y)' }}>
              ⚡ +{xp.added} XP qo'shildi{xp.levelUp ? ' · 🎉 Yangi daraja!' : ''}
            </div>
          )}
        </div>

        {/* Fan bo'yicha */}
        <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 8, fontWeight: 700 }}>
          Fan bo'yicha natijalar:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {subjectBreakdown.map((s: SubjectBreakdown) => {
            const subPct = s.maxScore > 0 ? Math.round(s.score / s.maxScore * 100) : 0
            return (
              <div key={s.subjectId} style={{
                background: 'var(--s1)', border: '1px solid var(--f)',
                borderRadius: 10, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {SUBJECT_EMOJI[s.subjectId] || '📘'} {s.subjectName}
                  </span>
                </div>
                
                {/* Test count and score display */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <div style={{ padding: '8px', background: 'rgba(0,212,170,0.08)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 2 }}>Savol</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--acc-l)' }}>
                      {s.correct}/{s.questionCount}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(123,104,238,0.08)', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 2 }}>Ball</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: subPct >= 70 ? 'var(--g)' : subPct >= 50 ? 'var(--y)' : 'var(--r)' }}>
                      {s.score.toFixed(1)}/{s.maxScore.toFixed(1)}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div style={{ height: 5, background: 'var(--s3)', borderRadius: 100, marginBottom: 6 }}>
                  <div style={{
                    height: '100%', borderRadius: 100,
                    width: `${subPct}%`,
                    background: subPct >= 70 ? 'var(--g)' : subPct >= 50 ? 'var(--y)' : 'var(--r)',
                    transition: 'width 0.5s',
                  }} />
                </div>
                
                {/* Details */}
                <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                  ✓ {s.correct} to'g'ri · ✗ {s.wrong} xato · {subPct}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Tugmalar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onReview} className="btn btn-primary btn-block">
            🔍 Xatolarni ko'rish
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onHistory} className="btn btn-ghost btn-block">📁 Tarix</button>
            <button onClick={onBack} className="btn btn-ghost btn-block">🏠 Bosh sahifa</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HistoryScreen
// ═══════════════════════════════════════════════════════════════════════════
function HistoryScreen({ mode, onModeChange, onBack, onReview }: any) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    setLoading(true)
    setItems([])
    setPage(1)
    examApi.history(mode, 1)
      .then(r => { setItems(r.data.items); setPages(r.data.pages) })
      .catch(() => toast('Tarix yuklanmadi', 'err'))
      .finally(() => setLoading(false))
  }, [mode])

  const loadMore = () => {
    const next = page + 1
    examApi.history(mode, next)
      .then(r => { setItems(prev => [...prev, ...r.data.items]); setPage(next) })
      .catch(() => {})
  }

  return (
    <>
      <div className="header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Orqaga</button>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Testlar tarixi</div>
        <div style={{ width: 70 }} />
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8 }}>
        {(['dtm', 'subject'] as const).map(m => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 12,
              background: mode === m ? 'var(--acc)' : 'var(--s2)',
              color: mode === m ? 'white' : 'var(--txt-2)',
              border: `1px solid ${mode === m ? 'var(--acc)' : 'var(--f)'}`,
            }}
          >
            {m === 'dtm' ? '🎯 DTM' : '📚 Alohida fanlar'}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--txt-3)', padding: 40 }}>Yuklanmoqda...</div>
        )}

        {!loading && items.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: 'var(--s1)', borderRadius: 14, border: '1px solid var(--f)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Tarix bo'sh</div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>
              {mode === 'dtm' ? "DTM testi o'ting, natijalar bu yerda ko'rinadi" : "Alohida fanlar bo'yicha test o'ting"}
            </div>
          </div>
        )}

        {items.map((item: any) => {
          const date = new Date(item.createdAt)
          const dateStr = `${date.getDate()}.${date.getMonth()+1}.${date.getFullYear()}`
          const pct = item.maxTotalScore > 0 ? Math.round(item.totalScore / item.maxTotalScore * 100) : 0
          const subjects = item.subjectBreakdown?.map((s: SubjectBreakdown) => s.subjectName).join(', ')

          return (
            <div
              key={item._id}
              onClick={() => onReview(item._id)}
              style={{
                background: 'var(--s1)', border: '1px solid var(--f)',
                borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>{dateStr}</span>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                }}>
                  {item.totalScore.toFixed(1)} ball · {pct}%
                </span>
              </div>
              {mode === 'dtm' && item.direction && (
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                  🎯 {item.subjectBreakdown?.find((s: SubjectBreakdown) => s.block === 'mutaxassislik_1')?.subjectId
                    ? (() => {
                        const dirNames: Record<string, string> = {
                          tibbiyot: 'Tibbiyot', it: 'IT / Dasturlash', iqtisodiyot: 'Iqtisodiyot',
                          pedagogika: 'Pedagogika', arxitektura: 'Arxitektura', jurnalistika: 'Jurnalistika',
                          rus_filologiya: 'Rus filologiyasi', kimyo_fan: 'Kimyo fani',
                          fizika_fan: 'Fizika fani', ingliz_filol: 'Ingliz filologiyasi',
                          biologiya_fan: 'Biologiya fani',
                        }
                        return dirNames[item.direction] || item.direction
                      })()
                    : item.direction}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{subjects}</div>

              <div style={{ height: 4, background: 'var(--s3)', borderRadius: 100, marginTop: 8 }}>
                <div style={{
                  height: '100%', borderRadius: 100, width: `${pct}%`,
                  background: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                }} />
              </div>
            </div>
          )
        })}

        {page < pages && (
          <button
            onClick={loadMore}
            style={{
              width: '100%', padding: 12, background: 'var(--s2)',
              border: '1px solid var(--f)', borderRadius: 10, color: 'var(--txt-2)',
              fontSize: 12, cursor: 'pointer', marginTop: 4, marginBottom: 16,
            }}
          >
            Yana ko'rish ↓
          </button>
        )}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ReviewScreen — sessiya ichki ko'rish
// ═══════════════════════════════════════════════════════════════════════════
function ReviewScreen({ sessionId, onBack, onSubOpen }: any) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterCorrect, setFilterCorrect] = useState<'all' | 'correct' | 'wrong'>('all')
  const { toast } = useToast()

  useEffect(() => {
    examApi.review(sessionId)
      .then(r => setData(r.data))
      .catch(() => toast('Yuklanmadi', 'err'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <>
        <div className="header">
          <button onClick={onBack} className="btn btn-ghost btn-sm">← Orqaga</button>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Ko'rish</div>
          <div style={{ width: 70 }} />
        </div>
        <div style={{ textAlign: 'center', color: 'var(--txt-3)', padding: 40 }}>Yuklanmoqda...</div>
      </>
    )
  }

  if (!data) return null

  const { session, answers } = data
  const subjects = [...new Set(answers.map((a: any) => a.subjectId).filter(Boolean))] as string[]

  const filtered = answers.filter((a: any) => {
    if (filterSubject !== 'all' && a.subjectId !== filterSubject) return false
    if (filterCorrect === 'correct' && !a.isCorrect) return false
    if (filterCorrect === 'wrong' && a.isCorrect) return false
    return true
  })

  const subjectNames: Record<string, string> = {}
  answers.forEach((a: any) => { if (a.subjectId && a.subject) subjectNames[a.subjectId] = a.subject })

  return (
    <>
      <div className="header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Orqaga</button>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Xatolar tahlili</div>
        <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>
          {answers.filter((a: any) => a.isCorrect).length}/{answers.length}
        </div>
      </div>

      {/* Filter qatori */}
      <div style={{ padding: '0 20px 10px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {(['all', 'correct', 'wrong'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilterCorrect(f)}
            style={{
              padding: '7px 12px', borderRadius: 100, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: filterCorrect === f ? (f === 'correct' ? 'rgba(0,212,170,0.15)' : f === 'wrong' ? 'rgba(255,95,126,0.12)' : 'var(--acc)') : 'var(--s2)',
              color: filterCorrect === f ? (f === 'correct' ? 'var(--g)' : f === 'wrong' ? 'var(--r)' : 'white') : 'var(--txt-2)',
              border: `1px solid ${filterCorrect === f ? 'transparent' : 'var(--f)'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {f === 'all' ? '📋 Hammasi' : f === 'correct' ? '✓ To\'g\'ri' : '✗ Xato'}
          </button>
        ))}

        {subjects.map(sid => (
          <button
            key={sid}
            onClick={() => setFilterSubject(filterSubject === sid ? 'all' : sid)}
            style={{
              padding: '7px 12px', borderRadius: 100, cursor: 'pointer', fontSize: 11, fontWeight: 700,
              background: filterSubject === sid ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
              color: filterSubject === sid ? 'var(--acc-l)' : 'var(--txt-2)',
              border: `1px solid ${filterSubject === sid ? 'rgba(123,104,238,0.3)' : 'var(--f)'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {SUBJECT_EMOJI[sid] || '📘'} {
              answers.find((a: any) => a.subjectId === sid)?.subjectName || sid
            }
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        {filtered.map((a: any, i: number) => (
          <AnswerCard key={a.questionId || i} answer={a} onSubOpen={onSubOpen} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--txt-3)', padding: 30, fontSize: 13 }}>
            Savollar topilmadi
          </div>
        )}
        <div style={{ height: 16 }} />
      </div>
    </>
  )
}

function AnswerCard({ answer, onSubOpen }: { answer: any; onSubOpen: () => void }) {
  const [expanded, setExpanded] = useState(!answer.isCorrect)
  const [aiHint, setAiHint] = useState<string | null>(answer.explanation || null)
  const [loading, setLoading] = useState(false)
  const { user } = useAppStore()
  const { toast } = useToast()

  const askAi = async () => {
    setLoading(true)
    try {
      const { data } = await aiApi.hint(answer.question, answer.options, answer.subject || answer.subjectId, 'explain')
      setAiHint(data.hint)
    } catch (e: any) {
      if (e.response?.data?.code === 'DAILY_LIMIT_REACHED' || e.response?.data?.code === 'SUBSCRIPTION_REQUIRED') {
        toast('AI limit tugadi. Obuna oling!', 'err')
        onSubOpen()
      } else { toast('AI xato', 'err') }
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      background: answer.isCorrect ? 'rgba(0,212,170,0.05)' : 'rgba(255,95,126,0.05)',
      border: `1px solid ${answer.isCorrect ? 'rgba(0,212,170,0.2)' : 'rgba(255,95,126,0.2)'}`,
      borderRadius: 12, marginBottom: 8, overflow: 'hidden',
    }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8 }}
      >
        <span style={{
          fontSize: 16, flexShrink: 0, marginTop: 1,
          color: answer.isCorrect ? 'var(--g)' : 'var(--r)',
        }}>
          {answer.isCorrect ? '✓' : '✗'}
        </span>
        <div style={{ fontSize: 12, lineHeight: 1.5, flex: 1 }}>{answer.question}</div>
        <span style={{ color: 'var(--txt-3)', fontSize: 14 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 12px' }}>
          {answer.options?.map((opt: string, i: number) => {
            let color = 'var(--txt-3)'
            let icon = ''
            if (i === answer.correctIndex) { color = 'var(--g)'; icon = '✓ ' }
            else if (i === answer.selectedOption && !answer.isCorrect) { color = 'var(--r)'; icon = '✗ ' }
            return (
              <div key={i} style={{ fontSize: 12, color, marginBottom: 4, lineHeight: 1.5 }}>
                {icon}<span style={{ fontWeight: 700 }}>{['A','B','C','D'][i]})</span> {opt}
              </div>
            )
          })}

          {aiHint && (
            <div style={{
              background: 'rgba(123,104,238,0.08)', border: '1px solid rgba(123,104,238,0.2)',
              borderRadius: 8, padding: 10, marginTop: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--txt)',
            }}>{aiHint}</div>
          )}

          {!aiHint && !answer.isCorrect && (
            <button
              onClick={askAi}
              disabled={loading}
              style={{
                marginTop: 8, padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(123,104,238,0.1)', border: '1px solid rgba(123,104,238,0.25)',
                color: 'var(--acc-l)', fontSize: 11, fontWeight: 700,
              }}
            >
              {loading ? '⏳...' : '🤖 AI tushuntirish'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
