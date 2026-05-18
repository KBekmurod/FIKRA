import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/Toast'
import { GRADE_META, versionToGrade, versionInGrade } from '../constants/subjects'

interface ResultState {
  testId: string
  subjectId: string
  subjectName: string
  testType: 'material' | 'mini'
  folderId: string | null
  totalCorrect: number
  totalQuestions: number
  scorePercent: number
  level?: {
    versionBefore: number
    versionAfter: number
    levelUp: boolean
  } | null
}

export default function PersonalTestResultPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const toast = useToast()
  const initial = location.state as ResultState | null

  const [state, setState] = useState<ResultState | null>(initial)
  const [loading, setLoading] = useState(!initial)
  const [folderTitle, setFolderTitle] = useState('')
  const [wrongCount, setWrongCount] = useState(0)
  const [miniGenerated, setMiniGenerated] = useState(false)
  const [miniTestId, setMiniTestId] = useState<string | null>(null)

  // Agar state yo'q bo'lsa (tarixdan kelgan), yuklash
  useEffect(() => {
    if (state && wrongCount === 0) {
      // Test review'dan wrong count va folder ni olamiz
      api.get(`/api/personal-tests/${id}`)
        .then(({ data }: any) => {
          const t = data.test
          setWrongCount(t.totalQuestions - t.totalCorrect)
          if (t.folderId) {
            api.get(`/api/folders/${t.folderId}`).then(({ data: f }) => {
              setFolderTitle(f.folder?.title || '')
              setMiniGenerated(f.folder?.miniTestGenerated || false)
              setMiniTestId(f.folder?.miniTestId || null)
            }).catch(() => {})
          }
        })
        .catch(() => {})
      return
    }

    if (!state && id) {
      setLoading(true)
      api.get(`/api/personal-tests/${id}`)
        .then(({ data }: any) => {
          const t = data.test
          setState({
            testId: t._id,
            subjectId: t.subjectId,
            subjectName: t.subjectName,
            testType: t.testType,
            folderId: t.folderId || null,
            totalCorrect: t.totalCorrect,
            totalQuestions: t.totalQuestions,
            scorePercent: t.scorePercent,
            level: null,
          })
          setWrongCount(t.totalQuestions - t.totalCorrect)
        })
        .catch(() => toast.error("Natija yuklanmadi"))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading || !state) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spin" style={{ margin: '0 auto' }} />
      </div>
    )
  }

  const { totalCorrect, totalQuestions, scorePercent, level } = state
  const grade = scorePercent >= 90 ? "A'lo" : scorePercent >= 75 ? 'Yaxshi' : scorePercent >= 50 ? "O'rtacha" : 'Yaxshilash kerak'
  const emoji = scorePercent >= 80 ? '🏆' : scorePercent >= 60 ? '👏' : scorePercent >= 40 ? '💪' : '📖'
  const hasErrors = wrongCount > 0

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
          <span style={{ fontSize: 14 }}>{state.testType === 'mini' ? '🎯' : '🤖'}</span>
          <div>
            {state.testType === 'mini' ? 'Mini-test' : 'AI test'}
            {' · '}{state.subjectName}
            {folderTitle && <> · "{folderTitle}"</>}
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
            {scorePercent}%
          </div>
          <div style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 4 }}>
            {totalCorrect} / {totalQuestions} to'g'ri
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

      {/* 3 ta karta — keyingi qadamlar (EC1, EC2, EC3) */}
      <div className="section-title">Keyingi qadam</div>
      <div style={{ padding: '0 20px', display: 'grid', gap: 10 }}>

        {/* EC1) Natijalarni ko'rish */}
        <button
          onClick={() => navigate(`/personal-tests/${id}/review`)}
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
            <div style={{ fontWeight: 700, fontSize: 14 }}>Savollarni ko'rish</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Har bir savol va javob tahlili
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>

        {/* EC2) Xatolar bilan rivojlanish (faqat asosiy test uchun) */}
        {state.testType === 'material' && (
          <button
            onClick={() => navigate(`/personal-tests/${id}/explain`)}
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
                {hasErrors
                  ? `${wrongCount} ta xato · AI tushuntirish + mini-test`
                  : 'Barcha javoblar to\'g\'ri'}
              </div>
            </div>
            <div style={{ fontSize: 18, color: hasErrors ? 'var(--acc-l)' : 'var(--txt-3)' }}>→</div>
          </button>
        )}

        {/* EC3) Tarixga saqlandi */}
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
              Tarix bo'limidan ko'rishingiz mumkin
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>
      </div>

      <div style={{ padding: '24px 20px' }}>
        <button
          onClick={() => navigate(state.folderId ? `/ombor/folder/${state.folderId}` : '/testlar')}
          className="btn btn-ghost btn-block"
        >
          {state.folderId ? '🏛 Papkaga qaytish' : "Testlar sahifasiga qaytish"}
        </button>
      </div>
    </>
  )
}
