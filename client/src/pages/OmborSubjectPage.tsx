import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import { SUBJECTS, type Context, getAllowedContexts } from '../constants/subjects'
import { useToast } from '../components/Toast'
import { useGoBack } from '../hooks/useGoBack'

interface Folder {
  _id: string
  title: string
  context: Context
  testStatus: 'no_test' | 'generating' | 'has_test' | 'generation_failed'
  testStandardCount: number
  stats: {
    attemptsCount: number
    bestScore: number
    avgScore: number
    masteryLevel: 'weak' | 'medium' | 'strong' | 'unknown'
    lastAttemptDate: string | null
  }
  materials?: Array<{ title: string; charCount: number; source: string; createdAt: string }>
  createdAt: string
}

export default function OmborSubjectPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/ombor')
  const { subjectId } = useParams<{ subjectId: string }>()
  const [searchParams] = useSearchParams()
  const initialContext = (searchParams.get('context') as Context) || 'mutaxassislik'
  const toast = useToast()

  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(true)
  const [context, setContext] = useState<Context>(initialContext)

  const subj = subjectId ? SUBJECTS[subjectId as keyof typeof SUBJECTS] : null
  const allowed = subjectId ? getAllowedContexts(subjectId) : ['mutaxassislik']
  const showContextSwitch = allowed.length > 1

  const standardCount = context === 'majburiy' ? 10 : 30

  useEffect(() => {
    if (!subjectId) return
    setLoading(true)
    api.get(`/api/folders/by-subject/${subjectId}`, { params: { context } })
      .then(({ data }) => setFolders(data.folders || []))
      .catch(() => toast.error("Yuklab bo'lmadi"))
      .finally(() => setLoading(false))
  }, [subjectId, context])

  if (!subj) {
    return (
      <>
        <div className="header">
          <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--txt-2)', fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8 }}>←</button>
          <div className="header-logo" style={{ fontSize: 16 }}>Fan topilmadi</div>
        </div>
      </>
    )
  }

  const masteryEmoji = (m: string) =>
    m === 'strong' ? '💪' : m === 'medium' ? '👍' : m === 'weak' ? '📖' : '🆕'

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>{subj.icon} {subj.name}</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        {/* Kontekst tanlash (dual-context fanlar uchun) */}
        {showContextSwitch && (
          <div className="seg-tabs">
            <button
              className={`seg-tab ${context === 'majburiy' ? 'active' : ''}`}
              onClick={() => setContext('majburiy')}
            >Majburiy (10)</button>
            <button
              className={`seg-tab ${context === 'mutaxassislik' ? 'active' : ''}`}
              onClick={() => setContext('mutaxassislik')}
            >Mutaxassislik (30)</button>
          </div>
        )}

        {/* Ko'rsatma */}
        <div style={{
          padding: 12,
          background: context === 'majburiy' ? 'rgba(0,212,170,0.08)' : 'rgba(123,104,238,0.08)',
          border: `1px solid ${context === 'majburiy' ? 'rgba(0,212,170,0.25)' : 'rgba(123,104,238,0.25)'}`,
          borderRadius: 12,
          fontSize: 11,
          color: 'var(--txt-2)',
          lineHeight: 1.5,
          marginBottom: 14,
        }}>
          <strong style={{ color: context === 'majburiy' ? 'var(--g)' : 'var(--acc-l)' }}>
            {context === 'majburiy' ? 'Majburiy kontekst' : 'Mutaxassislik kontekst'}
          </strong>
          <br />
          Har papkadan AI <strong>{standardCount} ta test savol</strong> yaratadi
          ({context === 'majburiy' ? '1.1 ball' : '2.1–3.1 ball'}).
        </div>

        {/* + Yangi papka tugmasi */}
        <button
          onClick={() => navigate(`/ombor/${subjectId}/add-folder?context=${context}`)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            padding: '14px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          ⊕ Yangi material papkasi yaratish
        </button>

        {/* Papkalar ro'yxati */}
        {loading ? (
          <div className="skel-card" />
        ) : folders.length === 0 ? (
          <div style={{
            padding: 30, textAlign: 'center',
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 14,
          }}>
            <div style={{ fontSize: 40 }}>📁</div>
            <p style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 8, lineHeight: 1.5 }}>
              Hozircha papkalar yo'q
              <br />
              <span style={{ fontSize: 11, color: 'var(--txt-3)' }}>
                Yuqoridagi tugma orqali yangi material va test yarating
              </span>
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--txt-3)', letterSpacing: 0.5 }}>
              📁 PAPKALAR ({folders.length})
            </div>
            {folders.map(f => (
              <FolderCard key={f._id} folder={f} masteryEmoji={masteryEmoji} onClick={() => navigate(`/ombor/folder/${f._id}`)} />
            ))}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </>
  )
}

function FolderCard({ folder, masteryEmoji, onClick }: { folder: Folder; masteryEmoji: (m: string) => string; onClick: () => void }) {
  const hasTest = folder.testStatus === 'has_test'
  const isGenerating = folder.testStatus === 'generating'
  const isFailed = folder.testStatus === 'generation_failed'
  const isNoTest = folder.testStatus === 'no_test'

  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--s1)',
        border: `1px solid ${hasTest ? 'rgba(0,212,170,0.25)' : isFailed ? 'rgba(255,95,126,0.25)' : 'var(--f)'}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        color: 'var(--txt)',
        textAlign: 'left',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>{masteryEmoji(folder.stats?.masteryLevel || 'unknown')}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: 13,
            lineHeight: 1.35,
            // BEST PRACTICE: 2 qatorga sig'dirish + ellipsis
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
          }}>
            {folder.title}
          </div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 1 }}>
            {folder.materials && folder.materials.length > 0
              ? <>{folder.materials.reduce((s, m) => s + m.charCount, 0).toLocaleString()} belgi · {folder.materials.length} ta material · {folder.testStandardCount} savol</>
              : <>{folder.testStandardCount} savol</>
            }
          </div>
        </div>
        {hasTest && folder.stats.attemptsCount > 0 && (
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontWeight: 800, fontSize: 14,
              color: folder.stats.bestScore >= 70 ? 'var(--g)' : folder.stats.bestScore >= 50 ? 'var(--y)' : 'var(--r)',
            }}>{folder.stats.bestScore}%</div>
            <div style={{ fontSize: 9, color: 'var(--txt-3)' }}>eng yaxshi</div>
          </div>
        )}
      </div>

      {/* Bottom row — status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
        {isNoTest && (
          <span style={{ color: 'var(--y)', fontWeight: 700 }}>
            ⚠️ Test yaratilmagan — kirib yarating
          </span>
        )}
        {isGenerating && (
          <span style={{ color: 'var(--acc-l)', fontWeight: 700 }}>
            ⏳ Test yaratilmoqda...
          </span>
        )}
        {isFailed && (
          <span style={{ color: 'var(--r)', fontWeight: 700 }}>
            ❌ Test yaratishda xato — qaytadan urinib ko'ring
          </span>
        )}
        {hasTest && folder.stats.attemptsCount === 0 && (
          <span style={{ color: 'var(--g)', fontWeight: 700 }}>
            ✓ Test tayyor — ishlashga tayyor
          </span>
        )}
        {hasTest && folder.stats.attemptsCount > 0 && (
          <span style={{ color: 'var(--txt-3)' }}>
            {folder.stats.attemptsCount} marta ishlangan · o'rtacha {folder.stats.avgScore}%
          </span>
        )}
      </div>
    </button>
  )
}
