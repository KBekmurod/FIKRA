import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { streamJsonFetch } from '../api/endpoints'
import { SUBJECTS } from '../constants/subjects'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'

interface FolderDetails {
  folder: any
  attempts: any[]
}

interface SufficiencyCheck {
  isSufficient: boolean
  canAiFill: boolean
  isTooSmall: boolean
  charCount: number
  requiredChars: number
  standardCount: number
  context: string
  hasGeneratedTest: boolean
  folderTestStatus: string
  title: string
}

export default function OmborFolderPage() {
  const navigate = useNavigate()
  const { folderId } = useParams<{ folderId: string }>()
  const [searchParams] = useSearchParams()
  const isFresh = searchParams.get('fresh') === '1'
  const toast = useToast()

  const [data, setData] = useState<FolderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [starting, setStarting] = useState(false)

  // Modal: yetarlilik tekshirish (3 ta tanlov)
  const [sufficiency, setSufficiency] = useState<SufficiencyCheck | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const goBack = useGoBack(
    data?.folder?.subjectId
      ? `/ombor/${data.folder.subjectId}?context=${data.folder.context || 'majburiy'}`
      : '/ombor'
  )

  const load = () => {
    if (!folderId) return
    setLoading(true)
    api.get(`/api/folders/${folderId}`)
      .then(({ data }) => setData(data))
      .catch(() => toast.error("Yuklab bo'lmadi"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [folderId])

  // Sahifa ochilgan zahoti, agar yangi (fresh) va test yo'q bo'lsa — yetarlilikni tekshiramiz
  useEffect(() => {
    if (!isFresh || !data || !folderId) return
    if (data.folder.testStatus === 'has_test') return
    api.post(`/api/folders/${folderId}/check-sufficiency`)
      .then(({ data: chk }) => {
        if (chk.isSufficient) {
          // Avtomatik generatsiya
          triggerGenerate('standard')
        } else if (chk.canAiFill) {
          // Modal so'rov
          setSufficiency(chk)
        } else if (chk.isTooSmall) {
          setSufficiency(chk)
        }
      })
      .catch(() => {})
  }, [isFresh, data])

  const triggerGenerate = async (opt: 'standard' | 'ai_fill') => {
    if (!folderId) return
    setSufficiency(null)
    setGenerating(true)
    try {
      const { data: r } = await streamJsonFetch<any>(`/api/folders/${folderId}/generate`, { opt })
      toast.success('Test yaratildi!')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Test yaratishda xato')
    } finally {
      setGenerating(false)
    }
  }

  // ─── BEST PRACTICE: tugmani bosganda avval yetarlilikni tekshiramiz ─────
  // Yetarli bo'lsa darrov generate, yetarli emas bo'lsa modal so'rov chiqaramiz
  // (xato emas — chunki foydalanuvchi tanlash imkoniga ega bo'lishi kerak)
  const handleGenerateClick = async () => {
    if (!folderId || generating) return
    setGenerating(true)
    try {
      const { data: chk } = await api.post(`/api/folders/${folderId}/check-sufficiency`)
      setGenerating(false)

      if (chk.isSufficient) {
        // Yetarli — darrov generatsiya
        triggerGenerate('standard')
      } else if (chk.canAiFill || chk.isTooSmall) {
        // Yetarli emas — modal so'rov ko'rsatamiz (xato emas!)
        setSufficiency(chk)
      } else {
        toast.error("Yetarlilik tekshiruvi muvaffaqiyatsiz")
      }
    } catch (e: any) {
      setGenerating(false)
      toast.error(e.response?.data?.error || "Tekshirishda xato")
    }
  }

  const startTest = async () => {
    if (!folderId) return
    setStarting(true)
    try {
      // Yangi urinish yaratamiz (asosiy test savollari aralashtirilgan)
      const { data: r } = await api.post(`/api/folders/${folderId}/retry`)
      navigate(`/personal-tests/${r.testId}/run`, {
        state: {
          testId: r.testId,
          subjectId: r.subjectId,
          subjectName: r.subjectName,
          totalQuestions: r.totalQuestions,
          durationSeconds: r.durationSeconds,
          questions: r.questions,
          folderId: r.folderId,
        },
      })
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Test boshlashda xato')
    } finally {
      setStarting(false)
    }
  }

  const deleteFolder = async () => {
    if (!folderId) return
    try {
      await api.delete(`/api/folders/${folderId}`)
      toast.success("Papka o'chirildi")
      navigate(`/ombor/${data?.folder.subjectId}?context=${data?.folder.context}`)
    } catch {
      toast.error("O'chirishda xato")
    }
  }

  if (loading || !data) {
    return (
      <div style={{ padding: 30 }}>
        <div className="skel-card" />
      </div>
    )
  }

  const { folder, attempts } = data
  const subj = SUBJECTS[folder.subjectId as keyof typeof SUBJECTS]
  const materials = folder.materials || []
  const hasTest = folder.testStatus === 'has_test'
  const isGenerating = folder.testStatus === 'generating' || generating
  const standardCount = folder.testStandardCount
  const ctx = folder.context

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{
          fontSize: 13,
          flex: 1,
          minWidth: 0,
          lineHeight: 1.3,
          // 2 qatorga sig'dirish — uzun nomlar yo'qolmaydi
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical' as any,
          WebkitLineClamp: 2,
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}>
          {subj?.icon} {folder.title}
        </div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        {/* Kontekst rozetkasi */}
        <div style={{
          display: 'inline-block',
          padding: '4px 12px',
          background: ctx === 'majburiy' ? 'rgba(0,212,170,0.12)' : 'rgba(123,104,238,0.12)',
          border: `1px solid ${ctx === 'majburiy' ? 'rgba(0,212,170,0.3)' : 'rgba(123,104,238,0.3)'}`,
          borderRadius: 100,
          fontSize: 10,
          fontWeight: 800,
          color: ctx === 'majburiy' ? 'var(--g)' : 'var(--acc-l)',
          marginBottom: 12,
        }}>
          {ctx === 'majburiy' ? '📌 Majburiy' : '⭐ Mutaxassislik'} · {standardCount} savol
        </div>

        {/* Statistika kartasi */}
        {folder.stats.attemptsCount > 0 && (
          <div style={{
            padding: 14,
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 12,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, marginBottom: 8 }}>
              📊 BU PAPKA STATISTIKASI
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <StatBox label="Urinishlar" value={folder.stats.attemptsCount} color="var(--acc-l)" />
              <StatBox label="Eng yaxshi" value={`${folder.stats.bestScore}%`} color="var(--g)" />
              <StatBox label="O'rtacha" value={`${folder.stats.avgScore}%`} color="var(--y)" />
            </div>
          </div>
        )}

        {/* Materiallar ro'yxati */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5 }}>
            📄 MATERIALLAR ({materials.length})
          </div>
        </div>

        {materials.length === 0 ? (
          <div style={{
            padding: 20, textAlign: 'center',
            background: 'var(--s1)', border: '1px dashed var(--f)', borderRadius: 12, marginBottom: 12
          }}>
            <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>Papkada material yo'q</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            {materials.map((m: any) => (
              <div key={m._id} style={{
                padding: 12,
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                borderRadius: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13, lineHeight: 1.4,
                    display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                  }}>{m.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)', background: 'var(--s2)', padding: '2px 6px', borderRadius: 4 }}>
                    {m.source === 'text' ? 'Matn' : m.source === 'ocr' ? 'Rasm' : 'Fayl'}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>{m.charCount.toLocaleString()} belgi</div>
                  <button
                    onClick={() => navigate(`/materials/${m._id}/edit`)}
                    style={{ background: 'none', border: 'none', color: 'var(--acc-l)', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}
                  >✏️ Tahrir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(`/ombor/folder/${folderId}/add`)}
          style={{
            width: '100%',
            background: 'rgba(123,104,238,0.1)',
            border: '1px solid rgba(123,104,238,0.25)',
            color: 'var(--acc-l)',
            borderRadius: 12,
            padding: '12px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            marginBottom: 20,
          }}
        >➕ Yangi material qo'shish</button>

        {/* Test yaratish moduli */}
        <div style={{
          padding: 14,
          background: hasTest ? 'var(--s1)' : 'rgba(255,204,68,0.08)',
          border: `1px solid ${hasTest ? 'var(--f)' : 'rgba(255,204,68,0.25)'}`,
          borderRadius: 12,
          marginBottom: 12,
        }}>
          {!hasTest && !isGenerating && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--y)' }}>⚠️ Test hali yaratilmagan</div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 4, lineHeight: 1.5, marginBottom: 10 }}>
                AI papkadagi barcha materiallarni birlashtirib {standardCount} ta test savol yaratadi.
              </div>
            </>
          )}
          {hasTest && !isGenerating && (
            <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5, marginBottom: 10 }}>
              Yana ko'proq savollar kerakmi? AI barcha materiallarni o'qib, yana <strong>mutlaqo yangi {standardCount} ta test savol</strong> tuza oladi!
            </div>
          )}
          
          {!isGenerating && (
            <button
              onClick={handleGenerateClick}
              disabled={generating}
              className="btn btn-primary btn-block"
            >
              {generating ? '⏳ Tekshirilmoqda...' : hasTest ? '✨ Yangi test generatsiya qilish' : '🤖 AI test yaratish'}
            </button>
          )}
        </div>

        {isGenerating && (
          <div style={{
            padding: 18, textAlign: 'center',
            background: 'rgba(123,104,238,0.08)',
            border: '1px solid rgba(123,104,238,0.25)',
            borderRadius: 12,
            marginBottom: 12,
          }}>
            <div className="spin" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 12, color: 'var(--txt-2)' }}>
              AI {standardCount} ta test yaratmoqda... Bu 20-40 soniya davom etishi mumkin.
            </div>
          </div>
        )}

        {hasTest && (
          <button
            onClick={startTest}
            disabled={starting}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, var(--g), #00b08e)',
              color: '#0a0a14',
              border: 'none',
              borderRadius: 14,
              padding: '16px 18px',
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            {starting ? '⏳ Boshlanmoqda...' : `🔄 Aynan oxirgi testni qayta ishlash (${standardCount} ta savol)`}
          </button>
        )}

        {/* Urinishlar tarixi */}
        {attempts.length > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5, margin: '14px 0 8px' }}>
              📈 URINISHLAR TARIXI ({attempts.length})
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {attempts.slice(0, 5).map((a, i) => {
                const pct = a.scorePercent || 0
                // Safe ID
                const attemptId = typeof a._id === 'object' ? (a._id as any)._id || String(a._id) : a._id
                const isMini = a.testType === 'mini'
                const badgeColor = isMini ? 'var(--y)' : 'var(--acc-l)'
                const badgeBg = isMini ? 'rgba(255,204,68,0.12)' : 'rgba(123,104,238,0.12)'
                return (
                  <button
                    key={attemptId}
                    onClick={() => navigate(`/personal-tests/${attemptId}/result`)}
                    style={{
                      background: 'var(--s1)',
                      border: '1px solid var(--f)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex', alignItems: 'center', gap: 8,
                      cursor: 'pointer', color: 'var(--txt)', textAlign: 'left',
                    }}
                  >
                    <span style={{
                      fontSize: 9, fontWeight: 800,
                      padding: '2px 6px', borderRadius: 100,
                      background: badgeBg, color: badgeColor,
                      letterSpacing: 0.3,
                      whiteSpace: 'nowrap',
                    }}>
                      {isMini ? '🎯 MINI' : '🤖 AI'}
                    </span>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 700, minWidth: 24 }}>
                      #{attempts.length - i}
                    </div>
                    <div style={{ flex: 1, fontSize: 10.5, color: 'var(--txt-2)' }}>
                      {new Date(a.endTime || a.createdAt).toLocaleString('uz-UZ', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <div style={{
                      fontWeight: 800, fontSize: 13,
                      color: pct >= 70 ? 'var(--g)' : pct >= 50 ? 'var(--y)' : 'var(--r)',
                    }}>{pct}%</div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* O'chirish */}
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            width: '100%',
            background: 'none',
            border: '1px solid rgba(255,95,126,0.25)',
            color: 'var(--r)',
            borderRadius: 10,
            padding: '10px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 24,
          }}
        >
          🗑 Papkani o'chirish
        </button>

        <div style={{ height: 24 }} />
      </div>

      {/* Yetarlilik modal so'rovi */}
      {sufficiency && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--f)',
            borderRadius: 18, padding: 22, maxWidth: 360, width: '100%',
          }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
              {sufficiency.isTooSmall ? 'Material juda kichik' : 'Material yetarli emas'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: 14 }}>
              Sifatli <strong>{sufficiency.standardCount} ta test</strong> uchun{' '}
              <strong>~{sufficiency.requiredChars.toLocaleString()}</strong> belgi kerak.
              <br />
              Sizda: <strong>{sufficiency.charCount.toLocaleString()}</strong> belgi.
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <button
                onClick={() => {
                  setSufficiency(null)
                  navigate(`/ombor/folder/${folderId}/add`)
                }}
                className="btn btn-primary btn-block"
              >➕ Yana yangi material qo'shaman</button>
              {sufficiency.canAiFill && (
                <button
                  onClick={() => triggerGenerate('ai_fill')}
                  style={{
                    background: 'rgba(255,204,68,0.15)',
                    border: '1.5px solid var(--y)',
                    color: 'var(--y)',
                    fontWeight: 700, fontSize: 13,
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  }}
                >🤖 AI o'zi yetkazib bersin (sifat biroz pasayadi)</button>
              )}
              <button onClick={() => setSufficiency(null)} className="btn btn-ghost btn-block">
                ✗ Hozircha bekor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* O'chirish tasdiq modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--f)',
            borderRadius: 18, padding: 22, maxWidth: 340, width: '100%',
          }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🗑</div>
            <div style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
              Papkani o'chirasizmi?
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: 14 }}>
              Material va test o'chiriladi. Bu amal qaytarilmaydi.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-block">Bekor</button>
              <button
                onClick={deleteFolder}
                style={{
                  flex: 1,
                  background: 'rgba(255,95,126,0.15)',
                  border: '1.5px solid var(--r)',
                  color: 'var(--r)',
                  fontWeight: 700, fontSize: 13,
                  padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                }}
              >O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatBox({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div style={{
      background: 'var(--s2)',
      borderRadius: 8,
      padding: '8px 6px',
      textAlign: 'center',
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, color }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 2 }}>{label}</div>
    </div>
  )
}
