import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { examApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'
import RichText from '../components/RichText'
import '../components/RichText.css'

interface WrongBySubject {
  subjectId: string
  subjectName: string
  block: string
  count: number
  answers: any[]
}

export default function TestExplainPage() {
  const navigate = useNavigate()
  const { sessionId, subjectId } = useParams<{ sessionId: string; subjectId: string }>()
  const goBack = useGoBack(sessionId ? `/test-result/${sessionId}` : '/tarix')
  const toast = useToast()
  const location = useLocation()

  const [overview, setOverview] = useState<WrongBySubject[]>([])
  const [loading, setLoading] = useState(true)
  const [miniGenerating, setMiniGenerating] = useState(false)

  // Bitta fan tushuntirilayotgan bo'lsa
  const [currentAnswer, setCurrentAnswer] = useState<any>(null)
  const [explanation, setExplanation] = useState<any>(null)
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [explainUsed, setExplainUsed] = useState(false)

  const isOverview = subjectId === '_overview'

  useEffect(() => {
    if (!sessionId) return
    if (isOverview) {
      // Sessiya javoblarini olib, xato bo'lganlarini fan bo'yicha guruhlash
      examApi.review(sessionId)
        .then(({ data }: any) => {
          const wrongs = (data.answers || []).filter((a: any) => !a.isCorrect && a.selectedOption !== null)
          const grouped: Record<string, WrongBySubject> = {}
          for (const a of wrongs) {
            const sid = a.subject || a.subjectId
            if (!grouped[sid]) {
              grouped[sid] = {
                subjectId: sid,
                subjectName: a.subjectName || sid,
                block: a.block || 'mutaxassislik',
                count: 0,
                answers: [],
              }
            }
            grouped[sid].count++
            grouped[sid].answers.push(a)
          }
          setOverview(Object.values(grouped))
        })
        .catch(() => toast.error("Yuklanmadi"))
        .finally(() => setLoading(false))
    } else {
      // Aniq fan uchun tushuntirish — sessiyadagi xato javoblardan birinchisini ochish
      examApi.review(sessionId)
        .then(({ data }: any) => {
          const wrongs = (data.answers || [])
            .filter((a: any) => !a.isCorrect && (a.subject === subjectId || a.subjectId === subjectId))
          if (wrongs.length > 0) {
            setCurrentAnswer(wrongs[0])
            triggerExplain(wrongs[0]._id)
          }
        })
        .catch(() => toast.error("Yuklanmadi"))
        .finally(() => setLoading(false))
    }
  }, [sessionId, subjectId])

  const triggerExplain = async (answerId: string) => {
    setLoadingExplain(true)
    try {
      const { data } = await examApi.cabinetExplain(answerId)
      setExplanation(data)
    } catch (e: any) {
      if (e?.response?.data?.code === 'EXPLAIN_ALREADY_USED') {
        setExplainUsed(true)
        toast.info('Bu fan uchun AI tushuntirish allaqachon olingan')
      } else {
        toast.error("AI tushuntirish olishda xatolik")
      }
    } finally {
      setLoadingExplain(false)
    }
  }

  const generateMiniTest = async () => {
    if (!sessionId) return
    setMiniGenerating(true)
    try {
      const { data }: any = await examApi.cabinetMiniTest(undefined, 30, sessionId)
      // Mini-test sessiyasiga o'tish
      navigate(`/test-run/${data.sessionId}`, { state: { ...data, isMini: true } })
    } catch (e: any) {
      if (e?.response?.data?.code === 'MINI_TEST_ALREADY_USED') {
        toast.info('Mini-test allaqachon yaratilgan')
      } else {
        toast.error(e?.response?.data?.error || "Mini-test yaratishda xatolik")
      }
    } finally {
      setMiniGenerating(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin" /></div>
  }

  // ─── OVERVIEW — Fanlar ro'yxati ─────────────────────────────────────────
  if (isOverview) {
    const majburiy = overview.filter(o => o.block === 'majburiy')
    const mutaxassislik = overview.filter(o => o.block !== 'majburiy')

    return (
      <>
        <div className="header">
          <button onClick={goBack} style={{
            background: 'none', border: 'none', color: 'var(--txt-2)',
            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
          }}>←</button>
          <div className="header-logo" style={{ fontSize: 16 }}>🎯 Xatolar tahlili</div>
        </div>

        <div style={{ padding: '8px 20px 0' }}>
          <p style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.5 }}>
            Tushuntirishni ko'rmoqchi bo'lgan fanni bosing. AI batafsil tahlil qiladi (har fan uchun <strong>1 marta</strong>).
          </p>

          {majburiy.length > 0 && (
            <>
              <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--g)', letterSpacing: 0.5, margin: '14px 0 8px' }}>
                📌 MAJBURIY FANLARDAGI XATOLAR
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {majburiy.map(s => (
                  <SubjectCard key={s.subjectId} subj={s} onClick={() => navigate(`/test-explain/${sessionId}/${s.subjectId}`)} />
                ))}
              </div>
            </>
          )}

          {mutaxassislik.length > 0 && (
            <>
              <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--acc-l)', letterSpacing: 0.5, margin: '18px 0 8px' }}>
                ⭐ MUTAXASSISLIK FANLARIDAGI XATOLAR
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {mutaxassislik.map(s => (
                  <SubjectCard key={s.subjectId} subj={s} onClick={() => navigate(`/test-explain/${sessionId}/${s.subjectId}`)} />
                ))}
              </div>
            </>
          )}

          {/* Mini-test tugmasi */}
          <div style={{ marginTop: 24, marginBottom: 20 }}>
            <button
              onClick={generateMiniTest}
              disabled={miniGenerating}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--y), #fbbf24)',
                color: '#0a0a14',
                border: 'none',
                borderRadius: 14,
                padding: '14px 16px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {miniGenerating ? '⏳ Mini-test yaratilmoqda...' : '🔄 Mini-test yaratish (xatolardan)'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 6, textAlign: 'center' }}>
              Majburiy fan: 5 ta, mutaxassislik: 15 ta · <strong>1 marta</strong>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── BITTA FAN UCHUN TUSHUNTIRISH ─────────────────────────────────────
  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>
          🎯 {currentAnswer?.subjectName || 'Tushuntirish'}
        </div>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        {!currentAnswer && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40 }}>✓</div>
            <p>Bu fanda xato yo'q</p>
          </div>
        )}

        {currentAnswer && (
          <>
            {/* Savol */}
            <div style={{
              background: 'var(--s1)',
              border: '1px solid var(--f)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>
                SAVOL {currentAnswer.topic ? `· ${currentAnswer.topic}` : ''}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <RichText content={currentAnswer.questionText || currentAnswer.question} />
              </div>
            </div>

            {/* Variantlar - xato va to'g'ri */}
            <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
              {(currentAnswer.questionOptions || currentAnswer.options || []).map((opt: string, i: number) => {
                const correctIdx = currentAnswer.correctAnswer ?? currentAnswer.correctIndex
                const isCorrect = i === correctIdx
                const isUser = i === currentAnswer.selectedOption
                let bg = 'var(--s2)', border = 'var(--f)', label = ''
                if (isCorrect) { bg = 'rgba(0,212,170,0.12)'; border = 'var(--g)'; label = "✓ TO'G'RI" }
                else if (isUser) { bg = 'rgba(255,95,126,0.1)'; border = 'var(--r)'; label = '✗ Siz tanladingiz' }
                return (
                  <div key={i} style={{
                    padding: '10px 12px', background: bg,
                    border: `1.5px solid ${border}`,
                    borderRadius: 10, fontSize: 12, lineHeight: 1.5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontWeight: 800, color: 'var(--txt-3)', flexShrink: 0 }}>
                        {['A','B','C','D'][i]}
                      </span>
                      <span style={{ flex: 1 }}><RichText content={opt} inline /></span>
                      {label && (
                        <span style={{
                          fontSize: 9, fontWeight: 800,
                          color: isCorrect ? 'var(--g)' : 'var(--r)',
                          whiteSpace: 'nowrap',
                        }}>{label}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI tushuntirish — Loading */}
            {loadingExplain && (
              <div style={{
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                borderRadius: 12,
                padding: 20,
                textAlign: 'center',
              }}>
                <div className="spin" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>
                  AI tahlil qilmoqda...
                </div>
              </div>
            )}

            {/* Allaqachon ishlatilgan */}
            {explainUsed && !explanation && (
              <div style={{
                background: 'rgba(255,204,68,0.08)',
                border: '1px solid rgba(255,204,68,0.25)',
                borderRadius: 12,
                padding: 14,
                fontSize: 12,
                color: 'var(--txt-2)',
              }}>
                ⚠️ Bu test va fan uchun AI tushuntirish allaqachon olingan.
                Boshqa test ishlab keyingisidan foydalanishingiz mumkin.
              </div>
            )}

            {/* AI tushuntirish — 4 ta kontekstli karta */}
            {explanation && (
              <div style={{ display: 'grid', gap: 10 }}>
                <ContextCard
                  icon="📍"
                  title="MAVZU"
                  color="#3b82f6"
                  bgColor="rgba(59, 130, 246, 0.08)"
                  content={currentAnswer.topic || explanation.subjectName}
                />
                <ContextCard
                  icon="🧠"
                  title="NEGA TO'G'RI?"
                  color="#10b981"
                  bgColor="rgba(16, 185, 129, 0.08)"
                  content={extractSection(explanation.explanation, 'nega') || explanation.explanation}
                />
                <ContextCard
                  icon="⚠️"
                  title="CHALG'ITUVCHI USULLAR"
                  color="#f59e0b"
                  bgColor="rgba(245, 158, 11, 0.08)"
                  content={extractSection(explanation.explanation, 'chalg') || "Bu turdagi savollarda noto'g'ri javoblar haqqoniy ko'rinadi. Mavzuni chuqurroq o'rganib, asosiy formulalarga e'tibor bering."}
                />
                <ContextCard
                  icon="💡"
                  title="XULOSA"
                  color="#a78bfa"
                  bgColor="rgba(167, 139, 250, 0.08)"
                  content={extractSection(explanation.explanation, 'xulosa') || "Bu savol orqali o'rgangan asosiy g'oyani eslab qoling — kelajakdagi testlarda yordam beradi."}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── Subject Card (overview uchun) ──────────────────────────────────────
function SubjectCard({ subj, onClick }: { subj: WrongBySubject; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--s1)',
      border: '1px solid var(--f)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      cursor: 'pointer',
      color: 'var(--txt)',
      textAlign: 'left',
    }}>
      <div style={{
        background: 'rgba(255,95,126,0.12)',
        border: '1px solid rgba(255,95,126,0.25)',
        borderRadius: 100,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 800,
        color: 'var(--r)',
      }}>
        {subj.count}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{subj.subjectName}</div>
        <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }}>
          {subj.count} ta xato · AI tushuntirish uchun bosing
        </div>
      </div>
      <div style={{ fontSize: 18, color: 'var(--acc-l)' }}>→</div>
    </button>
  )
}

// ─── Kontekstli karta (rangli) ──────────────────────────────────────────
function ContextCard({ icon, title, color, bgColor, content }: {
  icon: string; title: string; color: string; bgColor: string; content: string
}) {
  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${color}40`,
      borderRadius: 12,
      padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 0.5 }}>
          {title}
        </span>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--txt)' }}>
        <RichText content={content || ''} />
      </div>
    </div>
  )
}

// AI matnidan bo'lim ajratish (oddiy heuristic)
function extractSection(text: string, keyword: string): string | null {
  if (!text) return null
  const lines = text.split('\n')
  const idx = lines.findIndex(l => l.toLowerCase().includes(keyword))
  if (idx === -1) return null
  // Keyingi 1-3 qatorni olish
  return lines.slice(idx, idx + 3).join('\n').trim() || null
}
