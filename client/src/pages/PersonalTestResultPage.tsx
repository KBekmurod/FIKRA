import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { personalTestApi } from '../api/endpoints'
import { GRADE_META } from '../constants/subjects'
import { useToast } from '../components/Toast'
import RichText from '../components/RichText'
import '../components/RichText.css'
import './PersonalTestResultPage.css'

interface ResultState {
  testId: string
  subjectId: string
  subjectName: string
  testType: 'material' | 'mini'
  totalCorrect: number
  totalQuestions: number
  scorePercent: number
  level: {
    versionBefore: number
    versionAfter: number
    gradeBefore: string
    gradeAfter: string
    levelUp: boolean
  } | null
}

export default function PersonalTestResultPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const state = location.state as ResultState | null

  const [result, setResult] = useState<ResultState | null>(state)
  const [review, setReview] = useState<any>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [generatingMini, setGeneratingMini] = useState(false)
  const [showReview, setShowReview] = useState(false)

  // If we navigated here directly, fetch the result
  useEffect(() => {
    if (!result && id) {
      personalTestApi.review(id).then(({ data }) => {
        const t = data.test
        setResult({
          testId: t._id,
          subjectId: t.subjectId,
          subjectName: t.subjectName,
          testType: t.testType,
          totalCorrect: t.totalCorrect,
          totalQuestions: t.totalQuestions,
          scorePercent: t.scorePercent,
          level: null,
        })
      })
    }
  }, [id])

  const loadReview = async () => {
    if (!id || review) {
      setShowReview(true)
      return
    }
    setReviewLoading(true)
    try {
      const { data } = await personalTestApi.review(id)
      setReview(data.test)
      setShowReview(true)
    } catch (e) {
      toast.error("Tahlilni yuklab bo'lmadi")
    } finally {
      setReviewLoading(false)
    }
  }

  const generateMini = async () => {
    if (!review || !result) return
    setGeneratingMini(true)
    try {
      // Xato javoblar
      const wrong = review.questions
        .map((q: any, idx: number) => ({
          ...q,
          correctAnswer: q.answer,
          userAnswer: review.answers.find((a: any) => a.questionIdx === idx)?.selectedOption,
        }))
        .filter((q: any) => q.userAnswer !== undefined && q.userAnswer !== q.correctAnswer)

      if (wrong.length === 0) {
        toast.info("Xato javob yo'q - mini-test kerak emas")
        setGeneratingMini(false)
        return
      }

      const { data } = await personalTestApi.generateMini(result.subjectId, wrong)
      navigate(`/personal-tests/${data.testId}/run`, { state: data })
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Mini-test yaratishda xatolik")
    } finally {
      setGeneratingMini(false)
    }
  }

  if (!result) return <div className="loading-overlay"><div className="big-spinner" /></div>

  const score = result.scorePercent
  const scoreClass = score >= 70 ? 'excellent' : score >= 50 ? 'good' : 'low'

  return (
    <div className="result-page">
      <header className="result-header">
        <button className="btn-back" onClick={() => navigate(`/subjects/${result.subjectId}`)}>←</button>
        <h1>{result.testType === 'mini' ? '🎯 Mini-test natijasi' : '📊 Test natijasi'}</h1>
      </header>

      {/* Asosiy natija */}
      <div className={`score-card ${scoreClass}`}>
        <div className="score-icon">
          {score >= 90 ? '🏆' : score >= 70 ? '🎉' : score >= 50 ? '👍' : '💪'}
        </div>
        <div className="score-percent">{score}%</div>
        <div className="score-detail">
          {result.totalCorrect} / {result.totalQuestions} to'g'ri
        </div>
        <div className="score-message">
          {score >= 90 && "Zo'r natija! Davom et!"}
          {score >= 70 && score < 90 && "Yaxshi! Yana sa'y-harakat qil!"}
          {score >= 50 && score < 70 && "O'rtacha. Mavzularni qaytar."}
          {score < 50 && "Xato savollarni o'rganib, qaytadan urinib ko'r."}
        </div>
      </div>

      {/* Level up bayonnoma */}
      {result.level && result.level.levelUp && (
        <div className="level-up-banner">
          <span className="level-up-icon">⬆️</span>
          <div>
            <div className="level-up-title">Daraja oshdi!</div>
            <div className="level-up-text">
              v{result.level.versionBefore} → <strong>v{result.level.versionAfter}</strong>
              {' '}
              <span style={{ color: (GRADE_META as any)[result.level.gradeAfter]?.color || '#fff' }}>
                ({(GRADE_META as any)[result.level.gradeAfter]?.name || result.level.gradeAfter})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tugmalar */}
      <div className="result-actions">
        <button className="result-btn" onClick={loadReview} disabled={reviewLoading}>
          {reviewLoading ? "Yuklanmoqda..." : "🔍 Tahlil ko'rish"}
        </button>

        {result.testType !== 'mini' && (
          <button
            className="result-btn primary"
            onClick={generateMini}
            disabled={generatingMini}
          >
            {generatingMini ? "Yaratilmoqda..." : "🎯 Xato savollardan mini-test"}
          </button>
        )}

        <button
          className="result-btn"
          onClick={() => navigate(`/subjects/${result.subjectId}`)}
        >
          🏠 Fan sahifasiga qaytish
        </button>
      </div>

      {/* Tahlil oynasi */}
      {showReview && review && (
        <div className="review-section">
          <h2>📋 Savollar tahlili</h2>
          {review.questions.map((q: any, idx: number) => {
            const ua = review.answers.find((a: any) => a.questionIdx === idx)
            const isCorrect = ua?.isCorrect
            const skipped = !ua

            return (
              <div key={idx} className={`review-q ${isCorrect ? 'correct' : skipped ? 'skipped' : 'wrong'}`}>
                <div className="review-q-header">
                  <span className="review-q-num">#{idx + 1}</span>
                  {q.topic && <span className="review-q-topic">📍 {q.topic}</span>}
                  <span className={`review-q-status ${isCorrect ? 'correct' : skipped ? 'skipped' : 'wrong'}`}>
                    {isCorrect ? '✓ To\'g\'ri' : skipped ? '⊘ O\'tkazilgan' : '✗ Xato'}
                  </span>
                </div>
                <div className="review-q-text"><RichText content={q.question} /></div>

                <div className="review-options">
                  {q.options.map((opt: string, i: number) => {
                    const letter = String.fromCharCode(65 + i)
                    let cls = "review-option"
                    if (i === q.answer) cls += " correct"
                    if (ua && i === ua.selectedOption && !isCorrect) cls += " user-wrong"
                    return (
                      <div key={i} className={cls}>
                        <span className="opt-letter">{letter}</span>
                        <span><RichText content={opt} inline /></span>
                        {i === q.answer && <span className="opt-mark">✓</span>}
                      </div>
                    )
                  })}
                </div>

                {/* AI Kontekstli tushuntirish */}
                {q.explanation && !isCorrect && (
                  <div className="review-explanation">
                    <div className="exp-section">
                      <div className="exp-label">🎯 Nega to'g'ri javob?</div>
                      <div className="exp-text"><RichText content={q.explanation} /></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
