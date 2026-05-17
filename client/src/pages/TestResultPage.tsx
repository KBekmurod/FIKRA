import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { GRADE_META, versionToGrade, versionInGrade } from '../constants/subjects'

interface ResultState {
  sessionId: string
  mode: string
  totalScore: number
  maxTotalScore: number
  percent: number
  subjectBreakdown: any[]
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
  const state = location.state as ResultState | null

  useEffect(() => {
    // Browser back ga ruxsat berib, history ga test-result qoldirmaymiz
  }, [])

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

  const { totalScore, maxTotalScore, percent, level } = state
  const grade = percent >= 90 ? 'A\'lo' : percent >= 75 ? 'Yaxshi' : percent >= 50 ? "O'rtacha" : 'Yaxshilash kerak'
  const emoji = percent >= 80 ? '🏆' : percent >= 60 ? '👏' : percent >= 40 ? '💪' : '📖'

  // Xatolar bormi (tahlil tugmasini aktivlashtirish uchun)
  const hasErrors = state.subjectBreakdown.some(b => b.wrong > 0)

  return (
    <>
      <div className="header">
        <div className="header-logo">🏁 Yakunlandi</div>
      </div>

      {/* Asosiy ball karta */}
      <div style={{ padding: '8px 20px 0' }}>
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
              🎉 Yangi daraja: {GRADE_META[versionToGrade(level.versionAfter)].name} {versionInGrade(level.versionAfter)}!
            </div>
          )}
        </div>
      </div>

      {/* 3 ta karta — keyingi qadamlar */}
      <div className="section-title">Keyingi qadam</div>
      <div style={{ padding: '0 20px', display: 'grid', gap: 10 }}>

        {/* C1) Natijalarni ko'rish */}
        <button
          onClick={() => navigate(`/test-review/${sessionId}`, { state })}
          style={{
            background: 'var(--s1)',
            border: '1.5px solid var(--f)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: 32 }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Natijalarni ko'rish</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Fan bo'yicha alohida tahlil
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>

        {/* C2) Xatolar bilan rivojlanish */}
        <button
          onClick={() => navigate(`/test-explain/${sessionId}/_overview`, { state })}
          disabled={!hasErrors}
          style={{
            background: hasErrors ? 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(167,139,250,0.05))' : 'var(--s2)',
            border: `1.5px solid ${hasErrors ? 'rgba(123,104,238,0.3)' : 'var(--f)'}`,
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: hasErrors ? 'pointer' : 'default',
            color: 'var(--txt)',
            textAlign: 'left',
            opacity: hasErrors ? 1 : 0.5,
          }}
        >
          <div style={{ fontSize: 32 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {hasErrors ? "Xatolar bilan rivojlanish" : "Xatosiz a'lo natija!"}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              {hasErrors ? 'AI tushuntirish + mini-test' : 'Hammasi to\'g\'ri'}
            </div>
          </div>
          <div style={{ fontSize: 18, color: hasErrors ? 'var(--acc-l)' : 'var(--txt-3)' }}>→</div>
        </button>

        {/* C3) Tarixga saqlandi */}
        <button
          onClick={() => navigate('/tarix')}
          style={{
            background: 'var(--s1)',
            border: '1.5px solid var(--f)',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left',
          }}
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
