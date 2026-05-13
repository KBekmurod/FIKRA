import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import SubscriptionModal from '../components/SubscriptionModal'
import RichText from '../components/RichText'
import '../components/RichText.css'

// ─── Tiplar ─────────────────────────────────────────────────────────────────
type Screen = 'home' | 'subject_view' | 'wrong_detail' | 'mini_test' | 'analysis'

interface SubjectStat {
  subjectId: string
  subjectName: string
  correct: number
  wrong: number
  total: number
  accuracy: number
}

interface BlockStat {
  correct: number
  wrong: number
  total: number
  accuracy: number
}

interface WrongAnswer {
  _id: string
  questionText: string
  questionOptions: string[]
  correctAnswer: number
  selectedOption: number
  subjectId: string
  topic: string
  explanation: string
  createdAt: string
}

interface CabinetData {
  empty: boolean
  message?: string
  sessionCount?: number
  wrongCount?: number
  totalAnswered?: number
  wrongAnswers?: WrongAnswer[]
  stats?: {
    bySubject: SubjectStat[]
    byBlock: { majburiy: BlockStat; mutaxassislik_1: BlockStat; mutaxassislik_2: BlockStat }
    weakestSubject: SubjectStat | null
    overallAccuracy: number
  }
}

const SUBJECT_EMOJI: Record<string, string> = {
  uztil:'🔤', math:'➕', tarix:'🏛️', bio:'🧬', kimyo:'⚗️',
  fizika:'⚛️', ingliz:'🇬🇧', inform:'💻', iqtisod:'💰', rus:'🇷🇺',
  geo:'🌍', adab:'📖',
}

// ─── Asosiy komponent ──────────────────────────────────────────────────────
export default function CabinetPage() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<Screen>('home')
  const [data, setData] = useState<CabinetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterSubject, setFilterSubject] = useState<string | null>(null)
  const [activeAnswer, setActiveAnswer] = useState<WrongAnswer | null>(null)
  const [subOpen, setSubOpen] = useState(false)
  const { toast } = useToast()

  const loadCabinet = useCallback(async (subject?: string | null) => {
    setLoading(true)
    try {
      const { data } = await examApi.cabinet(subject || undefined)
      setData(data)
    } catch (e: any) {
      toast(e.response?.data?.error || 'Yuklanmadi', 'err')
    } finally { setLoading(false) }
  }, [toast])

  useEffect(() => {
    loadCabinet(filterSubject)
  }, [filterSubject, loadCabinet])

  // ─── Mini-test boshlash ──────────────────────────────────────────────
  const startMiniTest = async (subject?: string | null) => {
    try {
      const { data } = await examApi.cabinetMiniTest(subject || undefined, 10)
      // Test sahifasiga sessionData bilan navigate
      // localStorage orqali sessiyani yuborish (router state alternativasi)
      localStorage.setItem('fikra_cabinet_session', JSON.stringify(data))
      navigate('/test/cabinet-quiz')
    } catch (e: any) {
      toast(e.response?.data?.error || 'Mini-test yaratib bo\'lmadi', 'err')
    }
  }

  if (loading) {
    return (
      <>
        <div className="header">
          <div className="header-logo">FIKRA<span>.</span></div>
          <div style={{ fontSize: 13, color: 'var(--txt-2)' }}>Kabinet</div>
        </div>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spin" style={{ margin: '0 auto' }} />
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--txt-3)' }}>Tahlil qilinmoqda...</div>
        </div>
      </>
    )
  }

  if (!data || data.empty) {
    return (
      <>
        <div className="header">
          <div className="header-logo">FIKRA<span>.</span></div>
          <div style={{ fontSize: 13, color: 'var(--txt-2)' }}>AI Kabinet</div>
        </div>
        <div style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Kabinet hali bo'sh</div>
          <div style={{ fontSize: 13, color: 'var(--txt-2)', lineHeight: 1.6, marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
            Bu yerda DTM testlaridagi xato qilgan savollaringiz to'planadi va AI orqali tahlil qilinadi.
            Birinchi DTM testini o'tib ko'ring!
          </div>
          <button
            onClick={() => navigate('/test')}
            className="btn btn-primary btn-lg"
          >
            🎯 DTM testini boshlash →
          </button>
        </div>
      </>
    )
  }

  // ─── Wrong answer detail ─────────────────────────────────────────────
  if (screen === 'wrong_detail' && activeAnswer) {
    return (
      <WrongAnswerDetail
        answer={activeAnswer}
        onBack={() => { setActiveAnswer(null); setScreen(filterSubject ? 'subject_view' : 'home') }}
        onSubOpen={() => setSubOpen(true)}
      />
    )
  }

  if (screen === 'analysis') {
    return (
      <>
        <AnalysisScreen
          stats={data.stats!}
          onBack={() => setScreen('home')}
          onMiniTest={() => startMiniTest()}
        />
        <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
      </>
    )
  }

  if (screen === 'subject_view' && filterSubject) {
    const subjectName = data.stats!.bySubject.find(s => s.subjectId === filterSubject)?.subjectName || filterSubject
    const wrongs = data.wrongAnswers || []
    return (
      <>
        <div className="header">
          <button onClick={() => { setFilterSubject(null); setScreen('home') }} className="btn btn-ghost btn-sm">← Orqaga</button>
          <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{SUBJECT_EMOJI[filterSubject] || '📘'}</span>
            <span>{subjectName}</span>
          </div>
          <div style={{ width: 70 }} />
        </div>

        <div style={{ padding: '8px 16px 12px' }}>
          <div style={{
            background: 'rgba(255,95,126,0.08)', border: '1px solid rgba(255,95,126,0.2)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 4 }}>
              Bu fanda xato qilingan savollar:
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--r)' }}>
              {wrongs.length} ta
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 4 }}>
              Har biriga bosib AI tushuntirish oling
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }}>
          {wrongs.length === 0 ? (
            <div className="empty">
              ✨ Bu fanda xato qilingan savollar yo'q. Ajoyib!
            </div>
          ) : (
            wrongs.map((w, i) => (
              <button
                key={w._id}
                onClick={() => { setActiveAnswer(w); setScreen('wrong_detail') }}
                style={{
                  background: 'var(--s1)', border: '1px solid var(--f)',
                  borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                  color: 'var(--txt)', cursor: 'pointer', display: 'flex', gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: 6, background: 'rgba(255,95,126,0.15)',
                  color: 'var(--r)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, lineHeight: 1.5, color: 'var(--txt)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {w.questionText}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--r)', fontWeight: 700 }}>
                      ✗ Siz: {['A','B','C','D'][w.selectedOption]}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--g)', fontWeight: 700 }}>
                      ✓ To'g'ri: {['A','B','C','D'][w.correctAnswer]}
                    </span>
                    {w.topic && (
                      <span style={{ fontSize: 9, color: 'var(--txt-3)', marginLeft: 'auto' }}>
                        {w.topic}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ color: 'var(--txt-3)', fontSize: 18, alignSelf: 'center' }}>›</span>
              </button>
            ))
          )}
        </div>

        {wrongs.length > 0 && (
          <div style={{
            position: 'fixed', bottom: 76, left: 0, right: 0, padding: '10px 16px',
            background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
            maxWidth: 480, margin: '0 auto',
          }}>
            <button
              onClick={() => startMiniTest(filterSubject)}
              className="btn btn-primary btn-block btn-lg"
            >
              🎯 Faqat shu xatolarni qayta ishlash ({Math.min(wrongs.length, 10)} ta)
            </button>
          </div>
        )}

        <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
      </>
    )
  }

  // ─── Home — kabinet bosh sahifasi ────────────────────────────────────
  const stats = data.stats!
  const totalCorrect = (data.totalAnswered || 0) - (data.wrongCount || 0)

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
        <div style={{ fontSize: 12, color: 'var(--txt-2)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>🎓</span> Kabinet
        </div>
      </div>

      {/* Top banner — umumiy statistika */}
      <div style={{ padding: '4px 16px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(0,212,170,0.08))',
          border: '1px solid rgba(123,104,238,0.3)',
          borderRadius: 16, padding: 18,
        }}>
          <div style={{ fontSize: 11, color: 'var(--txt-2)', fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>
            📊 SHAXSIY KABINET — {data.sessionCount} ta DTM testi
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }}>
                {stats.overallAccuracy}<span style={{ fontSize: 18 }}>%</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 4 }}>aniqlik</div>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--g)' }}>{totalCorrect}</div>
                <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>To'g'ri</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--r)' }}>{data.wrongCount || 0}</div>
                <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>Xato</div>
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 100 }}>
            <div style={{
              height: '100%',
              width: `${stats.overallAccuracy}%`,
              background: stats.overallAccuracy >= 70 ? 'var(--g)' : stats.overallAccuracy >= 50 ? 'var(--y)' : 'var(--r)',
              borderRadius: 100, transition: 'width 0.6s',
            }} />
          </div>
        </div>
      </div>

      {/* AI tahlil tugmasi */}
      {(data.wrongCount || 0) > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            onClick={() => setScreen('analysis')}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(255,204,68,0.08))',
              border: '1px solid rgba(123,104,238,0.3)',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              color: 'var(--txt)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 28 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>AI Tahlil olish</div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                Zaif sohalaringizni va keyingi qadamlarni AI tushuntirib beradi
              </div>
            </div>
            <div style={{ color: 'var(--acc-l)', fontSize: 18 }}>→</div>
          </button>
        </div>
      )}

      {/* Bloklar */}
      <div className="section-title">Bloklar bo'yicha</div>
      <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { id: 'majburiy', label: 'Majburiy', emoji: '📌', color: 'var(--acc-l)' },
          { id: 'mutaxassislik_1', label: 'Mutax. 1', emoji: '🎯', color: 'var(--g)' },
          { id: 'mutaxassislik_2', label: 'Mutax. 2', emoji: '🎯', color: 'var(--y)' },
        ].map(b => {
          const bs = (stats.byBlock as any)[b.id] as BlockStat
          if (!bs.total) return (
            <div key={b.id} className="card" style={{ textAlign: 'center', padding: 12, opacity: 0.5 }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{b.emoji}</div>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }}>{b.label}</div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }}>—</div>
            </div>
          )
          return (
            <div key={b.id} className="card" style={{ textAlign: 'center', padding: 12 }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{b.emoji}</div>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700 }}>{b.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: b.color, marginTop: 3 }}>
                {bs.accuracy}%
              </div>
              <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 2 }}>
                {bs.correct}/{bs.total}
              </div>
            </div>
          )
        })}
      </div>

      {/* Fanlar bo'yicha — ranjirovka */}
      <div className="section-title">Fanlar bo'yicha — bos va ko'r</div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 80 }}>
        {stats.bySubject.length === 0 ? (
          <div className="empty">Hech qanday fan ma'lumoti yo'q</div>
        ) : (
          stats.bySubject.map(s => {
            const isWeak = s.accuracy < 50
            const color = s.accuracy >= 70 ? 'var(--g)' : s.accuracy >= 50 ? 'var(--y)' : 'var(--r)'
            return (
              <button
                key={s.subjectId}
                onClick={() => { setFilterSubject(s.subjectId); setScreen('subject_view') }}
                style={{
                  background: isWeak ? 'rgba(255,95,126,0.06)' : 'var(--s1)',
                  border: `1px solid ${isWeak ? 'rgba(255,95,126,0.2)' : 'var(--f)'}`,
                  borderRadius: 12, padding: '12px 14px', textAlign: 'left',
                  color: 'var(--txt)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <span style={{ fontSize: 22 }}>{SUBJECT_EMOJI[s.subjectId] || '📘'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{s.subjectName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 4, background: 'var(--s3)', borderRadius: 100 }}>
                      <div style={{
                        height: '100%', width: `${s.accuracy}%`,
                        background: color, borderRadius: 100, transition: 'width 0.5s',
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                      {s.correct}/{s.total}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color }}>{s.accuracy}%</div>
                  {s.wrong > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--r)' }}>✗ {s.wrong} xato</div>
                  )}
                </div>
                <span style={{ color: 'var(--txt-3)', fontSize: 18 }}>›</span>
              </button>
            )
          })
        )}
      </div>

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Wrong Answer Detail — bitta xato uchun AI tushuntirish
// ═══════════════════════════════════════════════════════════════════════════
function WrongAnswerDetail({ answer, onBack, onSubOpen }: { answer: WrongAnswer; onBack: () => void; onSubOpen: () => void }) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const [originalExp, setOriginalExp] = useState<string>('')
  const { toast } = useToast()

  const askAi = async () => {
    setLoadingAi(true)
    try {
      const { data } = await examApi.cabinetExplain(answer._id)
      setAiExplanation(data.explanation)
      setOriginalExp(data.originalExplanation || '')
    } catch (e: any) {
      const code = e.response?.data?.code
      if (code === 'DAILY_LIMIT_REACHED' || code === 'SUBSCRIPTION_REQUIRED') {
        toast('Bugungi AI limit tugadi', 'err')
        onSubOpen()
      } else {
        toast(e.response?.data?.error || 'AI tahlil qilolmadi', 'err')
      }
    } finally { setLoadingAi(false) }
  }

  return (
    <>
      <div className="header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Orqaga</button>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {SUBJECT_EMOJI[answer.subjectId] || '📘'} Xato tahlili
        </div>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ padding: '4px 16px 24px' }}>
        {/* Savol */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>
            SAVOL{answer.topic ? ` · ${answer.topic}` : ''}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, fontWeight: 500, whiteSpace: 'pre-wrap' }}>
            <RichText content={answer.questionText} />
          </div>
        </div>

        {/* Variantlar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {answer.questionOptions.map((opt, i) => {
            let bg = 'var(--s2)', border = 'var(--f)', label = ''
            if (i === answer.correctAnswer) {
              bg = 'rgba(0,212,170,0.12)'; border = 'var(--g)'; label = '✓ TO\'G\'RI'
            } else if (i === answer.selectedOption) {
              bg = 'rgba(255,95,126,0.1)'; border = 'var(--r)'; label = '✗ Siz tanladingiz'
            }
            return (
              <div
                key={i}
                style={{
                  padding: '12px 14px', background: bg,
                  border: `1.5px solid ${border}`,
                  borderRadius: 10, fontSize: 13, lineHeight: 1.5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontWeight: 800, color: 'var(--txt-3)', flexShrink: 0 }}>
                    {['A','B','C','D'][i]}
                  </span>
                  <span style={{ flex: 1 }}><RichText content={opt} inline /></span>
                  {label && (
                    <span style={{ fontSize: 9, fontWeight: 800,
                      color: i === answer.correctAnswer ? 'var(--g)' : 'var(--r)',
                      whiteSpace: 'nowrap',
                    }}>{label}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Asl tushuntirish (admin yozgan) */}
        {answer.explanation && (
          <div style={{
            background: 'rgba(0,212,170,0.07)', border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 10, padding: 12, marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, color: 'var(--g)', fontWeight: 800, marginBottom: 5, letterSpacing: 0.5 }}>
              💡 ASOSIY TUSHUNTIRISH
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--txt)' }}>
              <RichText content={answer.explanation} />
            </div>
          </div>
        )}

        {/* AI tushuntirish */}
        {!aiExplanation && !loadingAi && (
          <button
            onClick={askAi}
            style={{
              width: '100%', padding: 14, borderRadius: 12, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(0,212,170,0.08))',
              border: '1px solid rgba(123,104,238,0.3)',
              color: 'var(--txt)', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            🤖 AI orqali batafsil tushuntirish olish
          </button>
        )}

        {loadingAi && (
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--f)',
            borderRadius: 12, padding: 20, textAlign: 'center',
          }}>
            <div className="spin" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>AI tahlil qilmoqda...</div>
          </div>
        )}

        {aiExplanation && (
          <div style={{
            background: 'rgba(123,104,238,0.07)', border: '1px solid rgba(123,104,238,0.25)',
            borderRadius: 12, padding: 14,
          }}>
            <div style={{ fontSize: 10, color: 'var(--acc-l)', fontWeight: 800, marginBottom: 8, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>🤖</span> FIKRA AI TUSHUNTIRISHI
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--txt)', whiteSpace: 'pre-wrap' }}>
              <RichText content={aiExplanation} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Analysis Screen — umumiy AI tahlil
// ═══════════════════════════════════════════════════════════════════════════
function AnalysisScreen({ stats, onBack, onMiniTest }: { stats: any; onBack: () => void; onMiniTest: () => void }) {
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let mounted = true
    examApi.cabinetAnalysis()
      .then(({ data }) => {
        if (mounted && data.success) setAnalysis(data.analysis)
        else if (mounted) toast(data.message || 'Tahlil qilolmadi', 'err')
      })
      .catch((e) => {
        if (mounted) toast(e.response?.data?.error || 'Xatolik', 'err')
      })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  return (
    <>
      <div className="header">
        <button onClick={onBack} className="btn btn-ghost btn-sm">← Orqaga</button>
        <div style={{ fontWeight: 700, fontSize: 14 }}>🤖 AI Tahlil</div>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ padding: '4px 16px 24px' }}>
        {loading ? (
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--f)',
            borderRadius: 14, padding: 30, textAlign: 'center',
          }}>
            <div className="spin" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>
              FIKRA AI sizning natijalaringizni tahlil qilmoqda...
            </div>
          </div>
        ) : analysis ? (
          <>
            <div style={{
              background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(0,212,170,0.06))',
              border: '1px solid rgba(123,104,238,0.25)',
              borderRadius: 14, padding: 16, marginBottom: 14,
            }}>
              <div style={{ fontSize: 10, color: 'var(--acc-l)', fontWeight: 800, marginBottom: 10, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎓</span> SHAXSIY MASLAHATCHI
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--txt)', whiteSpace: 'pre-wrap' }}>
                {analysis}
              </div>
            </div>

            {/* Eng zaif fan kartasi */}
            {stats.weakestSubject && (
              <div style={{
                background: 'rgba(255,95,126,0.06)', border: '1px solid rgba(255,95,126,0.2)',
                borderRadius: 12, padding: 14, marginBottom: 14,
              }}>
                <div style={{ fontSize: 10, color: 'var(--r)', fontWeight: 800, marginBottom: 6, letterSpacing: 0.5 }}>
                  ⚠️ ENG ZAIF FAN
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 26 }}>{SUBJECT_EMOJI[stats.weakestSubject.subjectId] || '📘'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{stats.weakestSubject.subjectName}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                      {stats.weakestSubject.accuracy}% aniqlik · {stats.weakestSubject.wrong} ta xato
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button onClick={onMiniTest} className="btn btn-primary btn-block btn-lg">
              🎯 Xato qilingan savollar bo'yicha mini-test
            </button>
          </>
        ) : (
          <div className="empty">Tahlil yuklanmadi. Qayta urining.</div>
        )}
      </div>
    </>
  )
}
