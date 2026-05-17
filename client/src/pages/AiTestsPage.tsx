import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { personalTestApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import type { PersonalTest } from '../types'

export default function AiTestsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tests, setTests] = useState<PersonalTest[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async (p: number, append = false) => {
    try {
      const { data } = await personalTestApi.history(undefined, undefined, p)
      setTests(prev => append ? [...prev, ...data.tests] : data.tests)
      setHasMore(p < data.pages)
    } catch {
      toast.error("Yuklanmadi")
    }
  }

  useEffect(() => {
    load(1).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="header">
        <button onClick={() => navigate('/testlar')} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>🤖 AI testlarim</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 16 }}>
          Ombordagi materiallaringizdan AI yaratgan testlar
        </p>

        {/* Ombor ga o'tish tugmasi */}
        <button
          onClick={() => navigate('/ombor')}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(167,139,250,0.05))',
            border: '1.5px solid rgba(123,104,238,0.3)',
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--txt)',
            cursor: 'pointer',
            textAlign: 'left',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 26 }}>🏛</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Omborga o'tish</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Material qo'shing va yangi AI test yarating
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--acc-l)' }}>→</div>
        </button>

        {loading ? (
          <div className="skel-card" />
        ) : tests.length === 0 ? (
          <div style={{
            padding: 40, textAlign: 'center',
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 14,
          }}>
            <div style={{ fontSize: 40 }}>🤖</div>
            <p style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>
              Hozircha AI testlar yo'q
            </p>
            <p style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 4, lineHeight: 1.5 }}>
              Omborda fan tanlang → material qo'shing →<br />
              AI sizning materialingizdan test yaratadi
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 8 }}>
              {tests.map(t => {
                const pct = t.scorePercent
                const isInProgress = t.status === 'in_progress'
                return (
                  <button
                    key={t._id}
                    onClick={() => {
                      if (isInProgress) {
                        // To'liq tugatilmagan — qaytish imkonsiz, abandon (best practice)
                        toast.info("Bu test tugatilmagan")
                      } else {
                        navigate(`/personal-tests/${t._id}/result`)
                      }
                    }}
                    style={{
                      background: 'var(--s1)',
                      border: '1px solid var(--f)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      color: 'var(--txt)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{
                      fontSize: 22,
                      background: t.testType === 'mini' ? 'rgba(255,204,68,0.12)' : 'rgba(123,104,238,0.12)',
                      borderRadius: 10,
                      padding: '6px 10px',
                    }}>{t.testType === 'mini' ? '🎯' : '🤖'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {t.subjectName}
                        {t.testType === 'mini' && <span style={{ fontSize: 10, color: 'var(--y)', marginLeft: 6 }}>· Mini</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                        {new Date(t.endTime || t.createdAt).toLocaleString('uz-UZ', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {isInProgress ? (
                      <div style={{
                        fontSize: 10, color: 'var(--y)', fontWeight: 700,
                        padding: '3px 8px', borderRadius: 100,
                        background: 'rgba(255,204,68,0.1)',
                      }}>Davom etmoqda</div>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontWeight: 800, fontSize: 14,
                          color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                        }}>{pct}%</div>
                        <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>
                          {t.totalCorrect}/{t.totalQuestions}
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {hasMore && (
              <button
                onClick={() => {
                  const np = page + 1
                  setPage(np)
                  load(np, true)
                }}
                className="btn btn-ghost btn-block"
                style={{ marginTop: 12 }}
              >Yana ko'rsatish ↓</button>
            )}
          </>
        )}
      </div>
    </>
  )
}
