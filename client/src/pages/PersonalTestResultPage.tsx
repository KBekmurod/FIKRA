import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/Toast'
import { SUBJECTS, GRADE_META, versionToGrade, versionInGrade } from '../constants/subjects'

interface ResultState {
  testId: string
  subjectId: string
  subjectName: string
  testType: 'material' | 'mini' | 'ai_blok' | 'ai_free'
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

interface SubjectBreakdown {
  subjectId: string
  subjectName: string
  total: number
  correct: number
  pct: number
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
  const [miniTestData, setMiniTestData] = useState<any>(null)
  const [breakdown, setBreakdown] = useState<SubjectBreakdown[]>([])
  const [test, setTest] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get(`/api/personal-tests/${id}`)
      .then(({ data }: any) => {
        const t = data.test
        setTest(t)
        setWrongCount(t.totalQuestions - t.totalCorrect)

        // Agar state yo'q bo'lsa (tarixdan kelgan)
        if (!state) {
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
        }

        // Folder ma'lumotini olish
        if (t.folderId) {
          api.get(`/api/folders/${t.folderId}`).then(({ data: f }) => {
            setFolderTitle(f.folder?.title || '')
            setMiniGenerated(f.folder?.miniTestGenerated || false)
            // Mini-test ma'lumotini olish (agar mavjud va asosiy test bo'lsa)
            if (f.folder?.miniTestId && t.testType !== 'mini') {
              api.get(`/api/personal-tests/${f.folder.miniTestId}`)
                .then(({ data: mt }: any) => {
                  if (mt.test && mt.test.status === 'completed') {
                    setMiniTestData(mt.test)
                  }
                })
                .catch(() => {})
            }
          }).catch(() => {})
        }

        // Fan bo'yicha breakdown (faqat ai_blok va ai_free uchun)
        if (t.testType === 'ai_blok' || t.testType === 'ai_free') {
          const map: Record<string, SubjectBreakdown> = {}
          for (const q of (t.questions || [])) {
            if (!q.subjectId) continue
            if (!map[q.subjectId]) {
              map[q.subjectId] = {
                subjectId: q.subjectId,
                subjectName: q.subjectName || q.subjectId,
                total: 0,
                correct: 0,
                pct: 0,
              }
            }
            map[q.subjectId].total++
          }
          for (const ans of (t.answers || [])) {
            const qIdx = ans.questionIdx ?? ans.qIdx
            const q = t.questions.find((qq: any) => qq.idx === qIdx)
            if (q?.subjectId && ans.isCorrect && map[q.subjectId]) {
              map[q.subjectId].correct++
            }
          }
          const bdArr = Object.values(map).map(b => ({
            ...b,
            pct: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
          }))
          setBreakdown(bdArr)
        }
      })
      .catch(() => toast.error("Natija yuklanmadi"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading || !state) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spin" style={{ margin: '0 auto' }} />
      </div>
    )
  }

  const { totalCorrect, totalQuestions, scorePercent, level, testType } = state
  const grade = scorePercent >= 90 ? "A'lo" : scorePercent >= 75 ? 'Yaxshi' : scorePercent >= 50 ? "O'rtacha" : 'Yaxshilash kerak'
  const emoji = scorePercent >= 80 ? '🏆' : scorePercent >= 60 ? '👏' : scorePercent >= 40 ? '💪' : '📖'
  const hasErrors = wrongCount > 0
  const isBlok = testType === 'ai_blok'
  const isFree = testType === 'ai_free'
  const isMini = testType === 'mini'
  const isMaterial = testType === 'material'

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
          <span style={{ fontSize: 14 }}>
            {isMini ? '🎯' : isBlok ? '📦' : isFree ? '🎯' : '🤖'}
          </span>
          <div>
            {isMini ? 'Mini-test' :
             isBlok ? 'AI Maxsus blok' :
             isFree ? 'AI Erkin tanlov' : 'AI test'}
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

        {/* Fan bo'yicha breakdown (blok va free testlar uchun) */}
        {(isBlok || isFree) && breakdown.length > 0 && (
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
              {breakdown.map(b => {
                const subj = (SUBJECTS as any)[b.subjectId]
                return (
                  <div key={b.subjectId} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 18 }}>{subj?.icon || '📚'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{b.subjectName}</div>
                      <div style={{
                        marginTop: 4, height: 5, background: 'var(--s2)',
                        borderRadius: 100, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${b.pct}%`,
                          background: b.pct >= 70 ? 'var(--g)' : b.pct >= 50 ? 'var(--y)' : 'var(--r)',
                          transition: 'width 0.5s',
                        }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div style={{
                        fontWeight: 800, fontSize: 13,
                        color: b.pct >= 70 ? 'var(--g)' : b.pct >= 50 ? 'var(--y)' : 'var(--r)',
                      }}>{b.pct}%</div>
                      <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>{b.correct}/{b.total}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Mini-test natijasi (agar yaratilgan va tugatilgan bo'lsa) */}
        {miniTestData && !isMini && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--y)', letterSpacing: 0.5, marginBottom: 8 }}>
              🎯 MINI-TEST NATIJASI (XATOLAR USTIDA ISHLANGAN)
            </div>
            <button
              onClick={() => navigate(`/personal-tests/${miniTestData._id}/result`)}
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
                    {miniTestData.totalQuestions} ta savol
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }}>
                    {new Date(miniTestData.endTime || miniTestData.createdAt).toLocaleString('uz-UZ', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 900, fontSize: 24,
                    color: miniTestData.scorePercent >= 70 ? 'var(--g)' :
                           miniTestData.scorePercent >= 50 ? 'var(--y)' : 'var(--r)',
                  }}>{miniTestData.scorePercent}%</div>
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

        {/* EC1) Natijalarni ko'rish */}
        <button
          onClick={() => navigate(`/personal-tests/${id}/review`)}
          style={cardBtn(false)}
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

        {/* EC2) Xatolar bilan rivojlanish (mini test uchun yo'q) */}
        {!isMini && (
          <button
            onClick={() => navigate(`/personal-tests/${id}/explain`)}
            disabled={!hasErrors}
            style={{
              ...cardBtn(hasErrors),
              background: hasErrors ? 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(167,139,250,0.05))' : 'var(--s2)',
              border: `1.5px solid ${hasErrors ? 'rgba(123,104,238,0.3)' : 'var(--f)'}`,
              opacity: hasErrors ? 1 : 0.5,
              cursor: hasErrors ? 'pointer' : 'default',
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
        <button onClick={() => navigate('/tarix')} style={cardBtn(false)}>
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

function cardBtn(_active: boolean) {
  return {
    background: 'var(--s1)',
    border: '1.5px solid var(--f)',
    borderRadius: 14,
    padding: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    color: 'var(--txt)',
    textAlign: 'left' as const,
  }
}
