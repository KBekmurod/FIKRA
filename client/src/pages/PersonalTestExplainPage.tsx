import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'
import RichText from '../components/RichText'
import '../components/RichText.css'

interface WrongQuestion {
  qIdx: number
  question: string
  options: string[]
  selected: number
  correct: number
  topic?: string
  aiExplanation?: string
  loadingAi?: boolean
}

export default function PersonalTestExplainPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const goBack = useGoBack(`/personal-tests/${id}/result`)
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [wrongs, setWrongs] = useState<WrongQuestion[]>([])
  const [test, setTest] = useState<any>(null)
  const [generatingMini, setGeneratingMini] = useState(false)
  const [folderInfo, setFolderInfo] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    api.get(`/api/personal-tests/${id}`)
      .then(({ data }: any) => {
        const t = data.test
        setTest(t)
        // Xato javoblarni yig'amiz
        const ws: WrongQuestion[] = []
        for (const ans of (t.answers || [])) {
          if (!ans.isCorrect) {
            const q = t.questions.find((qq: any) => qq.idx === ans.qIdx)
            if (q) {
              ws.push({
                qIdx: q.idx,
                question: q.question,
                options: q.options,
                selected: ans.selected,
                correct: q.answer,
                topic: q.topic,
                aiExplanation: q.explanation,
              })
            }
          }
        }
        setWrongs(ws)

        if (t.folderId) {
          api.get(`/api/folders/${t.folderId}`).then(({ data: f }) => {
            setFolderInfo(f.folder)
          }).catch(() => {})
        }
      })
      .catch(() => toast.error("Yuklab bo'lmadi"))
      .finally(() => setLoading(false))
  }, [id])

  // AI batafsil tushuntirish
  const requestAiExplain = async (idx: number) => {
    setWrongs(prev => prev.map(w => w.qIdx === idx ? { ...w, loadingAi: true } : w))
    try {
      const { data } = await api.post(`/api/personal-tests/${id}/explain`, {
        qIdx: idx,
      })
      setWrongs(prev => prev.map(w =>
        w.qIdx === idx
          ? { ...w, aiExplanation: data.explanation, loadingAi: false }
          : w
      ))
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "AI tushuntirish xato")
      setWrongs(prev => prev.map(w => w.qIdx === idx ? { ...w, loadingAi: false } : w))
    }
  }

  // Mini-test yaratish (1 marta — folder.miniTestGenerated bo'lsa qayta yaratmaymiz)
  const startMiniTest = async () => {
    if (!id || !test) return
    setGeneratingMini(true)
    try {
      // Mavjud mini-test bormi?
      if (folderInfo?.miniTestId && folderInfo?.miniTestGenerated) {
        // Tarixdan ko'rish — lekin to'g'ridan-to'g'ri yangi sessiya emas
        toast.info("Mini-test allaqachon yaratilgan. Tarixdan ko'rishingiz mumkin.")
        navigate('/tarix')
        return
      }

      // Yangi mini-test yaratish
      const wrongAnswers = wrongs.map(w => ({
        question: w.question,
        options: w.options,
        userAnswer: w.selected,
        correctAnswer: w.correct,
        topic: w.topic,
      }))

      const { data } = await api.post('/api/personal-tests/mini', {
        sourceTestId: id,
        subjectId: test.subjectId,
        wrongAnswers,
      })

      navigate(`/personal-tests/${data.testId}/run`, {
        state: {
          testId: data.testId,
          subjectId: data.subjectId,
          subjectName: data.subjectName,
          totalQuestions: data.totalQuestions,
          durationSeconds: data.durationSeconds || data.totalQuestions * 60,
          questions: data.questions,
          folderId: test.folderId,
        },
      })
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Mini-test yaratishda xato")
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

  const miniAlreadyGenerated = folderInfo?.miniTestGenerated

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
          AI har biri uchun tushuntirish berishi mumkin, so'ngra
          <strong> mini-test </strong> ishlasangiz xatolaringizni mustahkamlaysiz.
        </div>

        {/* Xato savollar ro'yxati */}
        <div style={{ display: 'grid', gap: 12 }}>
          {wrongs.map(w => (
            <div key={w.qIdx} style={{
              background: 'var(--s1)',
              border: '1px solid rgba(255,95,126,0.25)',
              borderRadius: 12,
              padding: 14,
            }}>
              <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, marginBottom: 6 }}>
                SAVOL #{w.qIdx + 1}{w.topic ? ` · ${w.topic}` : ''}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>
                <RichText content={w.question} />
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
                      <span style={{ flex: 1 }}><RichText content={opt} inline /></span>
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
                  onClick={() => requestAiExplain(w.qIdx)}
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

        {/* Mini-test tugmasi */}
        <div style={{
          marginTop: 18,
          padding: 14,
          background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(0,212,170,0.05))',
          border: '1px solid rgba(123,104,238,0.3)',
          borderRadius: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            🎯 Mini-test orqali mustahkamlash
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 10, lineHeight: 1.5 }}>
            AI sizning xatolaringizdan o'xshash savollar yaratadi va siz ishlaysiz.
            {miniAlreadyGenerated && <> <strong style={{ color: 'var(--y)' }}>Allaqachon yaratilgan</strong> — qayta yaratib bo'lmaydi.</>}
          </div>
          <button
            onClick={startMiniTest}
            disabled={generatingMini || miniAlreadyGenerated}
            style={{
              width: '100%',
              background: miniAlreadyGenerated ? 'var(--s2)' : 'linear-gradient(135deg, var(--acc), var(--acc-l))',
              color: miniAlreadyGenerated ? 'var(--txt-3)' : 'white',
              border: 'none',
              borderRadius: 10,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: (generatingMini || miniAlreadyGenerated) ? 'default' : 'pointer',
              opacity: generatingMini ? 0.6 : 1,
            }}
          >
            {generatingMini
              ? '⏳ Yaratilmoqda...'
              : miniAlreadyGenerated
                ? '✓ Allaqachon yaratilgan'
                : '🚀 Mini-test boshlash'}
          </button>
        </div>

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}
