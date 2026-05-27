import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { GRADE_META, versionToGrade, versionInGrade, SUBJECTS } from '../constants/subjects'
import { examApi } from '../api/endpoints'
import api from '../api/client'

interface ResultState {
  sessionId: string
  mode: string
  totalScore: number
  maxTotalScore: number
  percent: number
  subjectBreakdown: any[]
  isMini?: boolean
  miniTestId?: string | null
  level?: {
    versionBefore: number
    versionAfter: number
    levelUp: boolean
    gradeBefore: string
    gradeAfter: string
  } | null
}

export default function TestResultPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const location = useLocation()
  const initial = location.state as ResultState | null
  const [state, setState] = useState<ResultState | null>(initial)
  const [loading, setLoading] = useState(!initial)
  const [showConfetti, setShowConfetti] = useState(false)
  const [miniTestData, setMiniTestData] = useState<any>(null)

  useEffect(() => {
    if (state) {
      if (state.totalScore === state.maxTotalScore && state.maxTotalScore > 0) {
        setShowConfetti(true)
      }
      
      // Agar mini test allaqachon bog'langan bo'lsa
      if (state.miniTestId) {
        api.get(`/api/history/exams`).then(({ data }: any) => {
          const mini = data.sessions?.find((s: any) => String(s._id) === String(state.miniTestId))
          if (mini && mini.status === 'completed') {
            setMiniTestData(mini)
          }
        }).catch(() => {})
      }

    } else if (sessionId) {
      examApi.review(sessionId).then(({ data }: any) => {
        const s = data.session || data
        setState({
          sessionId: s._id || sessionId,
          mode: s.mode,
          totalScore: s.totalScore || 0,
          maxTotalScore: s.maxTotalScore || 0,
          percent: s.maxTotalScore ? Math.round((s.totalScore / s.maxTotalScore) * 100) : 0,
          subjectBreakdown: s.subjectBreakdown || [],
          level: null,
          isMini: s.isMini,
          miniTestId: s.miniTestId,
        })
        
        if (s.miniTestId) {
          api.get(`/api/history/exams`).then(({ data: hist }: any) => {
            const mini = hist.sessions?.find((ss: any) => String(ss._id) === String(s.miniTestId))
            if (mini && mini.status === 'completed') {
              setMiniTestData(mini)
            }
          }).catch(() => {})
        }
      }).finally(() => setLoading(false))
    }
  }, [sessionId, state])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><div className="spin" style={{ margin: '0 auto' }} /></div>
  }

  if (!state || !sessionId) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 28 }}>⚠️</div>
        <p>Natija topilmadi</p>
        <button onClick={() => navigate('/testlar')} className="btn btn-primary">
          Testlarga qaytish
        </button>
      </div>
    )
  }

  const { totalScore, maxTotalScore, percent, level, mode, isMini } = state
  const grade = percent >= 90 ? 'A\'lo' : percent >= 75 ? 'Yaxshi' : percent >= 50 ? "O'rtacha" : 'Yaxshilash kerak'
  const emoji = percent >= 80 ? '🏆' : percent >= 60 ? '👏' : percent >= 40 ? '💪' : '📖'

  const hasErrors = state.subjectBreakdown.some(b => b.wrong > 0)
  const totalCorrect = state.subjectBreakdown.reduce((sum, b) => sum + (b.correct || 0), 0)
  const totalQuestions = state.subjectBreakdown.reduce((sum, b) => sum + (b.questionCount || 0), 0)

  const cardBtn = (active: boolean) => ({
    background: active ? 'var(--s1)' : 'var(--s2)',
    border: `1.5px solid ${active ? 'var(--f)' : 'transparent'}`,
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: active ? 'pointer' : 'default',
    color: 'var(--txt)',
    textAlign: 'left' as const,
    opacity: active ? 1 : 0.5,
  })

  return (
    <>
      <div className="header">
        <div className="header-logo" style={{ fontSize: 16 }}>🏁 Yakunlandi</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        {/* Test metadata */}
        <div style={{
          padding: 10,
          background: 'var(--s1)',
          border: '1px solid var(--f)',
          borderRadius: 10,
          marginBottom: 12,
          fontSize: 11,
          color: 'var(--txt-2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>
            {isMini ? '🎯' : '🎓'}
          </span>
          <div style={{
            flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {isMini ? 'Fikra Mini-test' : mode === 'dtm' ? 'Fikra DTM test' : 'Fikra Fan test'}
            {' · '}
            {state.subjectBreakdown.map(b => b.subjectName || b.subjectId).join(', ')}
          </div>
        </div>

        {/* Asosiy ball karta */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(123,104,238,0.18), rgba(0,212,170,0.08))',
          border: '1px solid rgba(123,104,238,0.3)',
          borderRadius: 18,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 56, marginBottom: 4 }}>{emoji}</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--acc-l)', lineHeight: 1 }}>
            {totalScore.toFixed(1)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 4 }}>
            / {maxTotalScore.toFixed(1)} ball · {percent}%
          </div>
          <div style={{
            display: 'inline-block', marginTop: 10,
            background: 'rgba(123,104,238,0.15)',
            border: '1px solid rgba(123,104,238,0.3)',
            borderRadius: 100,
            padding: '5px 16px',
            fontSize: 12, fontWeight: 700, color: 'var(--acc-l)',
          }}>{grade}</div>

          {level && level.levelUp && (
            <div style={{
              marginTop: 12, padding: '8px 14px',
              background: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 100,
              fontSize: 12, fontWeight: 700, color: 'var(--y)',
              display: 'inline-block',
            }}>
              🎉 Yangi daraja: {GRADE_META[versionToGrade(level.versionAfter)]?.name || ''} {versionInGrade(level.versionAfter)}!
            </div>
          )}
        </div>

        {/* Fan bo'yicha breakdown */}
        {state.subjectBreakdown.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
              📊 FAN BO'YICHA NATIJA
            </div>
            <div style={{
              background: 'var(--s1)',
              border: '1px solid var(--f)',
              borderRadius: 12,
              padding: 12,
              display: 'grid', gap: 8,
            }}>
              {state.subjectBreakdown.map(b => {
                const subj = (SUBJECTS as any)[b.subjectId]
                const bPct = b.questionCount > 0 ? Math.round((b.correct / b.questionCount) * 100) : 0
                return (
                  <div key={b.subjectId} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{subj?.icon || '📚'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{b.subjectName || b.subjectId}</div>
                      <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 2 }}>
                        {b.score.toFixed(1)} / {b.maxScore.toFixed(1)} ball
                      </div>
                      <div style={{
                        marginTop: 4, height: 5, background: 'var(--s2)',
                        borderRadius: 100, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${bPct}%`,
                          background: bPct >= 70 ? 'var(--g)' : bPct >= 50 ? 'var(--y)' : 'var(--r)',
                          transition: 'width 0.5s',
                        }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div style={{
                        fontWeight: 800, fontSize: 13,
                        color: bPct >= 70 ? 'var(--g)' : bPct >= 50 ? 'var(--y)' : 'var(--r)',
                      }}>{bPct}%</div>
                      <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>{b.correct}/{b.questionCount}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mini-test natijasi */}
        {miniTestData && !isMini && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--y)', letterSpacing: 0.5, marginBottom: 8 }}>
              🎯 MINI-TEST NATIJASI (XATOLAR USTIDA ISHLANGAN)
            </div>
            <button
              onClick={() => navigate(`/test-result/${miniTestData._id}`)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, rgba(255,204,68,0.12), rgba(255,204,68,0.04))',
                border: '1px solid rgba(255,204,68,0.3)',
                borderRadius: 12,
                padding: 14,
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--txt)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32 }}>🎯</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--y)' }}>
                    Mini-test tugatilgan
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                    {miniTestData.totalCorrect}/{miniTestData.totalQuestions} to'g'ri ·{' '}
                    {miniTestData.totalScore?.toFixed(1)} ball
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 900, fontSize: 24,
                    color: (miniTestData.totalScore / miniTestData.maxTotalScore) >= 0.7 ? 'var(--g)' :
                           (miniTestData.totalScore / miniTestData.maxTotalScore) >= 0.5 ? 'var(--y)' : 'var(--r)',
                  }}>{Math.round((miniTestData.totalScore / miniTestData.maxTotalScore) * 100)}%</div>
                  <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>natija →</div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 3 ta karta — keyingi qadamlar */}
      <div className="section-title">Keyingi qadam</div>
      <div style={{ padding: '0 20px', display: 'grid', gap: 10 }}>

        {/* C1) Natijalarni ko'rish */}
        <button
          onClick={() => navigate(`/test-review/${sessionId}`, { state })}
          style={cardBtn(true)}
        >
          <div style={{ fontSize: 32 }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Savollarni ko'rish</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Har bir savol va javob tahlili
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>

        {/* C2) Xatolar bilan rivojlanish */}
        <button
          onClick={() => navigate(`/test-explain/${sessionId}/_overview`, { state })}
          disabled={!hasErrors}
          style={{
            ...cardBtn(hasErrors),
            background: hasErrors ? 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(167,139,250,0.05))' : 'var(--s2)',
            border: `1.5px solid ${hasErrors ? 'rgba(123,104,238,0.3)' : 'var(--f)'}`,
          }}
        >
          <div style={{ fontSize: 32 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {hasErrors ? "Xatolar bilan rivojlanish" : "Xatosiz a'lo natija!"}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              {hasErrors ? `AI tushuntirish` + (!isMini ? ' + mini-test' : '') : 'Hammasi to\'g\'ri'}
            </div>
          </div>
          <div style={{ fontSize: 18, color: hasErrors ? 'var(--acc-l)' : 'var(--txt-3)' }}>→</div>
        </button>

        {/* C3) Tarixga saqlandi */}
        <button
          onClick={() => navigate('/tarix')}
          style={cardBtn(true)}
        >
          <div style={{ fontSize: 32 }}>📚</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--g)' }}>
              ✓ Tarixga saqlandi
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Tarix bo'limidan keyin ko'rishingiz mumkin
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>
      </div>

      <div style={{ padding: '24px 20px' }}>
        <button
          onClick={() => navigate('/testlar')}
          className="btn btn-ghost btn-block"
        >Testlar sahifasiga qaytish</button>
      </div>
    </>
  )
}
