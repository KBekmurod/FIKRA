import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { personalTestApi } from '../api/endpoints'
import type { PtQuestion } from '../types'
import { useToast } from '../components/Toast'
import RichText from '../components/RichText'
import '../components/RichText.css'
import './PersonalTestRunPage.css'

interface RunState {
  testId: string
  subjectId: string
  subjectName: string
  totalQuestions: number
  durationSeconds: number
  questions: PtQuestion[]
  testType?: 'material' | 'mini'
}

export default function PersonalTestRunPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const state = location.state as RunState | null

  const [questions, setQuestions] = useState<PtQuestion[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, { selected: number; isCorrect: boolean; correctIndex: number; explanation: string }>>({})
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [meta, setMeta] = useState<{ subjectName: string; testType: string }>({ subjectName: '', testType: 'material' })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // State'dan yoki API'dan yuklash
    if (state?.questions?.length) {
      setQuestions(state.questions)
      setTimeLeft(state.durationSeconds || state.questions.length * 60)
      setMeta({ subjectName: state.subjectName, testType: state.testType || 'material' })
    } else if (id) {
      // State yo'q — review oxiriga yuborilsin
      personalTestApi.review(id).then(({ data }) => {
        const t = data.test
        if (t.status === 'completed') {
          navigate(`/personal-tests/${id}/result`, { state: t, replace: true })
        } else {
          setQuestions(t.questions || [])
          setTimeLeft((t.questions?.length || 10) * 60)
          setMeta({ subjectName: t.subjectName, testType: t.testType })
        }
      }).catch(() => {
        toast.error("Test topilmadi")
        navigate(-1)
      })
    }
  }, [id])

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || questions.length === 0) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          onFinish(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [questions.length])

  const currentQ = questions[currentIdx]
  const currentAnswer = currentQ ? answers[currentQ.idx] : undefined

  const onAnswer = async (optionIdx: number) => {
    if (!currentQ || currentAnswer || submitting || !id) return
    setSelectedOption(optionIdx)
    setSubmitting(true)
    try {
      const { data } = await personalTestApi.answer(id, currentQ.idx, optionIdx)
      setAnswers(prev => ({
        ...prev,
        [currentQ.idx]: {
          selected: optionIdx,
          isCorrect: data.isCorrect,
          correctIndex: data.correctIndex,
          explanation: data.explanation,
        }
      }))
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Xatolik")
      setSelectedOption(null)
    } finally {
      setSubmitting(false)
    }
  }

  const onNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setSelectedOption(null)
    } else {
      onFinish()
    }
  }

  const onPrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
      setSelectedOption(null)
    }
  }

  const onFinish = async (auto = false) => {
    if (!id || finishing) return
    setFinishing(true)
    try {
      const { data } = await personalTestApi.finish(id)
      if (auto) toast.info("Vaqt tugadi!")
      navigate(`/personal-tests/${id}/result`, { state: data, replace: true })
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Yakunlashda xatolik")
      setFinishing(false)
    }
  }

  if (questions.length === 0) {
    return <div className="loading-overlay"><div className="big-spinner" /></div>
  }

  const progress = ((currentIdx + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <div className="pt-run-page">
      <div className="run-header">
        <div className="run-info">
          <div className="run-subject">{meta.subjectName}</div>
          <div className="run-progress">
            Savol {currentIdx + 1} / {questions.length}
            {meta.testType === 'mini' && <span className="badge-mini">🎯 Mini</span>}
          </div>
        </div>
        <div className="run-timer">
          ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Savol */}
      <div className="question-card">
        {currentQ.topic && <div className="question-topic">📍 {currentQ.topic}</div>}
        <div className="question-text">
          <RichText content={currentQ.question} />
        </div>

        <div className="options-list">
          {currentQ.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i) // A, B, C, D
            let cls = "option-btn"
            if (currentAnswer) {
              if (i === currentAnswer.correctIndex) cls += " correct"
              else if (i === currentAnswer.selected && !currentAnswer.isCorrect) cls += " wrong"
              else cls += " disabled"
            } else if (selectedOption === i) {
              cls += " submitting"
            }
            return (
              <button
                key={i}
                className={cls}
                disabled={!!currentAnswer || submitting}
                onClick={() => onAnswer(i)}
              >
                <span className="option-letter">{letter}</span>
                <span className="option-text"><RichText content={opt} inline /></span>
              </button>
            )
          })}
        </div>

        {currentAnswer && (
          <div className={`feedback ${currentAnswer.isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            <div className="feedback-title">
              {currentAnswer.isCorrect ? '✅ To\'g\'ri javob!' : '❌ Noto\'g\'ri'}
            </div>
            {currentAnswer.explanation && (
              <div className="feedback-text">{currentAnswer.explanation}</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="run-nav">
        <button
          className="nav-btn-secondary"
          onClick={onPrev}
          disabled={currentIdx === 0}
        >
          ← Oldingi
        </button>
        <div className="nav-counter">
          {answeredCount}/{questions.length} javob
        </div>
        {currentIdx < questions.length - 1 ? (
          <button className="nav-btn-primary" onClick={onNext}>
            Keyingi →
          </button>
        ) : (
          <button
            className="nav-btn-primary finish"
            onClick={() => onFinish()}
            disabled={finishing}
          >
            {finishing ? "..." : "Yakunlash ✓"}
          </button>
        )}
      </div>
    </div>
  )
}
