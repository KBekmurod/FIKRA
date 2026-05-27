import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { examApi } from '../api/endpoints'
import api from '../api/client'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'
import SubscriptionModal from '../components/SubscriptionModal'
import { useAppStore } from '../store'
import RichText from '../components/RichText'
import '../components/RichText.css'

interface WrongQuestion {
  _id: string
  qIdx: number
  question: string
  options: string[]
  selected: number
  correct: number
  topic?: string
  aiExplanation?: string
  loadingAi?: boolean
  images?: string[]
}

export default function TestExplainPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const goBack = useGoBack(`/test-result/${sessionId}`)
  const toast = useToast()

  const { user } = useAppStore()
  const [subOpen, setSubOpen] = useState(false)
  const isFree = !user?.effectivePlan || user.effectivePlan === 'free'

  const [loading, setLoading] = useState(true)
  const [wrongs, setWrongs] = useState<WrongQuestion[]>([])
  const [test, setTest] = useState<any>(null)
  const [generatingMini, setGeneratingMini] = useState(false)
  const [miniPrompt, setMiniPrompt] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    examApi.review(sessionId)
      .then(({ data }: any) => {
        const s = data.session || data
        setTest(s)
        
        const ws: WrongQuestion[] = []
        let idx = 0
        for (const ans of (data.answers || [])) {
          if (!ans.isCorrect && ans.selectedOption !== null && ans.selectedOption !== undefined) {
            ws.push({
              _id: ans._id,
              qIdx: idx,
              question: ans.questionText || ans.question,
              options: ans.questionOptions || ans.options,
              selected: ans.selectedOption,
              correct: ans.correctAnswer,
              topic: ans.topic,
              aiExplanation: ans.explanation,
            })
          }
          idx++
        }
        setWrongs(ws)
      })
      .catch(() => toast.error("Yuklab bo'lmadi"))
      .finally(() => setLoading(false))
  }, [sessionId])

  // AI batafsil tushuntirish
  const requestAiExplain = async (answerId: string) => {
    setWrongs(prev => prev.map(w => w._id === answerId ? { ...w, loadingAi: true } : w))
    try {
      const { data } = await examApi.cabinetExplain(answerId)
      setWrongs(prev => prev.map(w =>
        w._id === answerId
          ? { ...w, aiExplanation: data.explanation, loadingAi: false }
          : w
      ))
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "AI tushuntirish xato")
      setWrongs(prev => prev.map(w => w._id === answerId ? { ...w, loadingAi: false } : w))
    }
  }

  // Mini-test yaratish
  const startMiniTest = async () => {
    if (!sessionId || !test) return
    setMiniPrompt(false)
    setGeneratingMini(true)
    try {
      if (test.miniTestGenerated || test.miniTestId) {
        toast.info("Mini-test allaqachon yaratilgan")
        navigate(`/test-result/${test.miniTestId || sessionId}`)
        return
      }

      const { data }: any = await examApi.cabinetMiniTest(undefined, 30, sessionId)
      
      const newSessionId = typeof data.sessionId === 'object'
        ? (data.sessionId as any)?._id || String(data.sessionId)
        : data.sessionId

      navigate(`/test-run/${newSessionId}`, {
        state: { ...data, isMini: true }
      })
    } catch (e: any) {
      const errData = e?.response?.data
      const status = e?.response?.status

      if (status === 429 && errData?.code === 'MINI_TEST_ALREADY_USED') {
        toast.info("Mini-test allaqachon yaratilgan")
        // Ideal holda test.miniTestId bo'lsa o'tish
        if (test.miniTestId) {
          navigate(`/test-result/${test.miniTestId}`, { replace: true })
        }
        return
      }

      if (e?.code === 'ECONNABORTED' || e?.message?.includes('timeout')) {
        toast.error("AI hozir sekin javob bermoqda. Iltimos 30 soniyadan keyin tarixdan tekshiring.")
      } else {
        toast.error(errData?.error || "Mini-test yaratishda xato")
      }
    } finally {
      setGeneratingMini(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin" style={{ margin: '0 auto' }} /></div>
  }

  if (wrongs.length === 0) {
    return (
      <>
        <div className="header">
          <button onClick={goBack} style={{
            background: 'none', border: 'none', color: 'var(--txt-2)',
            fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
          }}>←</button>
          <div className="header-logo" style={{ fontSize: 15 }}>🎯 Xatolar bilan rivojlanish</div>
        </div>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🎉</div>
          <p style={{ marginTop: 12, fontSize: 14, color: 'var(--txt-2)' }}>
            A'lo! Sizda xato javob yo'q.
          </p>
        </div>
      </>
    )
  }

  const miniAlreadyGenerated = !!test?.miniTestGenerated || !!test?.miniTestId

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 15 }}>🎯 Xatolar bilan rivojlanish</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <div style={{
          padding: 12,
          background: 'rgba(255,95,126,0.08)',
          border: '1px solid rgba(255,95,126,0.25)',
          borderRadius: 10,
          fontSize: 11.5,
          color: 'var(--txt-2)',
          marginBottom: 14,
          lineHeight: 1.5,
        }}>
          📋 Quyida <strong>{wrongs.length} ta xato</strong> javob.
          AI har biri uchun tushuntirish berishi mumkin{test?.isMini !== true && ", so'ngra mini-test ishlasangiz xatolaringizni mustahkamlaysiz"}.
        </div>

        {isFree && (
          <div style={{
            background: 'linear-gradient(90deg, rgba(255,160,0,0.1), rgba(255,100,0,0.1))',
            border: '1px solid rgba(255,160,0,0.3)',
            borderRadius: 10, padding: 12, marginBottom: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>Tushuntirishlarni cheksiz ko'ring 🚀</div>
              <div style={{ fontSize: 10.5, color: 'var(--txt-2)' }}>Pro obunaga o'ting va limitlarsiz tahlil qiling</div>
            </div>
            <button onClick={() => setSubOpen(true)} style={{
              background: 'var(--y)', color: '#000', border: 'none',
              padding: '6px 10px', borderRadius: 100, fontSize: 10, fontWeight: 800, cursor: 'pointer'
            }}>Sotib olish</button>
          </div>
        )}

        {/* Xato savollar ro'yxati */}
        <div style={{ display: 'grid', gap: 12 }}>
          {wrongs.map((w, idx) => (
            <div key={w._id} style={{
              background: 'var(--s1)',
              border: '1px solid rgba(255,95,126,0.25)',
              borderRadius: 12,
              padding: 14,
            }}>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, marginBottom: 6 }}>
                SAVOL #{idx + 1}{w.topic ? ` · ${w.topic}` : ''}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                <RichText content={w.question} images={w.images} />
              </div>

              <div style={{ display: 'grid', gap: 5, marginBottom: 10 }}>
                {w.options.map((opt, i) => {
                  const isC = i === w.correct
                  const isU = i === w.selected
                  let bg = 'var(--s2)'
                  let border = '1px solid var(--f)'
                  let color = 'var(--txt-2)'
                  if (isC) { bg = 'rgba(0,212,170,0.12)'; border = '1px solid rgba(0,212,170,0.35)'; color = 'var(--g)' }
                  else if (isU) { bg = 'rgba(255,95,126,0.12)'; border = '1px solid rgba(255,95,126,0.35)'; color = 'var(--r)' }
                  return (
                    <div key={i} style={{
                      background: bg, border, color,
                      borderRadius: 8, padding: '7px 10px',
                      fontSize: 12, display: 'flex', gap: 8,
                    }}>
                      <span style={{ fontWeight: 800, minWidth: 16 }}>{['A','B','C','D'][i]}</span>
                      <span style={{ flex: 1 }}><RichText content={opt.replace(/^[A-D][).]\s*/i, '')} inline /></span>
                      {isC && <span style={{ fontSize: 11 }}>✓ to'g'ri</span>}
                      {isU && !isC && <span style={{ fontSize: 11 }}>← siz</span>}
                    </div>
                  )
                })}
              </div>

              {w.aiExplanation ? (
                <div style={{
                  background: 'rgba(123,104,238,0.08)',
                  border: '1px solid rgba(123,104,238,0.2)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 11.5,
                  color: 'var(--txt-2)',
                  lineHeight: 1.55,
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--acc-l)', marginBottom: 4, letterSpacing: 0.5 }}>
                    🤖 AI TUSHUNTIRISHI
                  </div>
                  <RichText content={w.aiExplanation} inline />
                </div>
              ) : (
                <button
                  onClick={() => requestAiExplain(w._id)}
                  disabled={w.loadingAi}
                  style={{
                    background: 'rgba(123,104,238,0.08)',
                    border: '1px solid rgba(123,104,238,0.2)',
                    color: 'var(--acc-l)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  {w.loadingAi ? '⏳ AI yozmoqda...' : '🤖 AI batafsil tushuntirsin'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Mini-test tugmasi (Faqat Asosiy testlar uchun) */}
        {test?.isMini !== true && (
          <div style={{
            marginTop: 18,
            padding: 14,
            background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(0,212,170,0.05))',
            border: '1px solid rgba(123,104,238,0.3)',
            borderRadius: 14,
          }}>
            {/* Mini-test yaratish tugmasi */}
            <div style={{ marginTop: 4 }}>
              <button
                onClick={() => setMiniPrompt(true)}
                disabled={generatingMini || miniAlreadyGenerated}
                style={{
                  width: '100%',
                  background: miniAlreadyGenerated ? 'var(--s1)' : 'linear-gradient(135deg, var(--y), #fbbf24)',
                  color: miniAlreadyGenerated ? 'var(--txt-3)' : '#0a0a14',
                  border: miniAlreadyGenerated ? '1px solid var(--f)' : 'none',
                  borderRadius: 14,
                  padding: '14px 16px',
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: miniAlreadyGenerated ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: (generatingMini || miniAlreadyGenerated) ? 0.6 : 1,
                }}
              >
                {generatingMini ? '⏳ Yaratilmoqda...' : miniAlreadyGenerated ? '✓ Mini-test allaqachon yaratilgan' : '🔄 Xatolardan Mini-test yaratish'}
              </button>
              {!miniAlreadyGenerated && (
                <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 6, textAlign: 'center' }}>
                  Xato javoblar asosida yangi savollar (faol test uchun 1 marta yaratiladi)
                </div>
              )}
            </div>
          </div>
        )}
        
        <div style={{ height: 30 }} />
      </div>

      <SubscriptionModal
        open={subOpen}
        onClose={() => setSubOpen(false)}
      />

      {/* Mini-test Tasdiqlash Modali */}
      {miniPrompt && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: 20,
        }}>
          <div style={{
            background: 'var(--bg)',
            border: '1.5px solid var(--f)',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 340,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Mini-test yaratish</div>
            <div style={{ fontSize: 14, color: 'var(--txt-2)', marginBottom: 20, lineHeight: 1.5 }}>
              Siz ushbu Fikra testidan <strong>faqat 1 marta</strong> xatolar bo'yicha mini-test yarata olasiz. Hozir yaratishni xohlaysizmi?
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <button
                onClick={startMiniTest}
                className="btn btn-primary btn-block"
              >
                Ha, yaratish
              </button>
              <button
                onClick={() => setMiniPrompt(false)}
                className="btn btn-ghost btn-block"
              >
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
