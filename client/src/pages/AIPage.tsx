import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { aiApi, examApi, streamChat } from '../api/endpoints'
import { useToast } from '../components/Toast'
import SubscriptionModal from '../components/SubscriptionModal'

type Tab = 'chat' | 'doc' | 'image' | 'analysis'

interface WeakSubject {
  subject: string
  subjectName: string
  accuracy: number
  totalAnswered: number
  correctAnswers: number
  level: 'strong' | 'medium' | 'weak' | 'veryWeak'
}

interface RecommendationData {
  summary: string
  weakAreas: WeakSubject[]
  drillTargets: Array<{ subject: string; subjectName: string; questionCount: number; accuracy: number; level: string }>
  recommendations: string[]
  progress?: { overallAvg: number; recentAvg: number; previousAvg: number; growthTrend: number }
}

export default function AIPage() {
  const [tab, setTab] = useState<Tab>('chat')
  const [subOpen, setSubOpen] = useState(false)

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
      </div>

      <div className="section-title">🤖 AI yordamchi</div>

      {/* Tabs */}
      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 6 }}>
        <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} icon="💬" label="Chat" />
        <TabButton active={tab === 'doc'} onClick={() => setTab('doc')} icon="📄" label="Hujjat" />
        <TabButton active={tab === 'image'} onClick={() => setTab('image')} icon="🎨" label="Rasm" />
        <TabButton active={tab === 'analysis'} onClick={() => setTab('analysis')} icon="📊" label="Tahlil" />
      </div>

      {tab === 'chat' && <ChatTab onSubOpen={() => setSubOpen(true)} />}
      {tab === 'doc' && <DocTab onSubOpen={() => setSubOpen(true)} />}
      {tab === 'image' && <ImageTab onSubOpen={() => setSubOpen(true)} />}
      {tab === 'analysis' && <AnalysisTab onSubOpen={() => setSubOpen(true)} />}

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 8px',
        background: active ? 'var(--acc)' : 'var(--s2)',
        color: active ? 'white' : 'var(--txt-2)',
        border: '1px solid ' + (active ? 'var(--acc)' : 'var(--f)'),
        borderRadius: 'var(--br2)',
        fontWeight: 700,
        fontSize: 12,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {icon} {label}
    </button>
  )
}

// ─── CHAT TAB ─────────────────────────────────────────────────────────
function ChatTab({ onSubOpen }: { onSubOpen: () => void }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const { user, refreshUser } = useAppStore()
  const { toast } = useToast()
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMessages(m => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }])
    setSending(true)

    let full = ''
    await streamChat(
      text,
      messages.slice(-10),
      (chunk) => {
        full += chunk
        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'assistant', content: full }
          return copy
        })
      },
      () => {
        setSending(false)
        refreshUser()
      },
      (err) => {
        setSending(false)
        if (err?.code === 'DAILY_LIMIT_REACHED') {
          toast('Bugungi limit tugadi', 'err'); onSubOpen()
        } else if (err?.code === 'SUBSCRIPTION_REQUIRED') {
          onSubOpen()
        } else {
          toast(err?.error || 'Xatolik', 'err')
        }
        setMessages(m => m.slice(0, -1)) // bo'sh javobni o'chirish
      }
    )
  }

  const chatsUsed = user?.aiUsage?.chats ?? 0
  const chatsLimit = user?.aiLimits?.chats
  const canChat = chatsLimit === null || chatsUsed < (chatsLimit as number)

  return (
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', minHeight: '60vh' }}>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }}>
        {chatsLimit === null ? 'Cheksiz' : `${chatsUsed}/${chatsLimit} bugun`}
      </div>

      <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12, maxHeight: 'calc(100vh - 280px)' }}>
        {!messages.length && (
          <div className="empty">
            🤖 AI bilan suhbatni boshlang.<br />
            DTM mavzularini so'rashingiz mumkin.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            padding: '10px 14px',
            borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: m.role === 'user' ? 'var(--acc)' : 'var(--s2)',
            color: m.role === 'user' ? 'white' : 'var(--txt)',
            fontSize: 13,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {m.content || (sending && m.role === 'assistant' ? '...' : '')}
          </div>
        ))}
      </div>

      {!canChat ? (
        <button onClick={onSubOpen} className="btn btn-primary btn-block btn-lg">
          Limit tugadi · Obuna olish ↗
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea
            className="textarea"
            placeholder="Savol yozing..."
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={2}
            style={{ flex: 1, minHeight: 44 }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
          />
          <button
            disabled={sending || !input.trim()}
            onClick={send}
            className="btn btn-primary"
            style={{ width: 44, padding: 0 }}
          >
            {sending ? '⏳' : '→'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── DOC TAB ──────────────────────────────────────────────────────────
function DocTab({ onSubOpen }: { onSubOpen: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [format, setFormat] = useState<'DOCX' | 'PDF' | 'PPTX'>('DOCX')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { user, refreshUser } = useAppStore()
  const { toast } = useToast()

  const generate = async () => {
    const p = prompt.trim()
    if (!p || loading) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await aiApi.document(p, format)
      setResult(data)
      refreshUser()
    } catch (e: any) {
      const code = e.response?.data?.code
      if (code === 'DAILY_LIMIT_REACHED' || code === 'SUBSCRIPTION_REQUIRED') {
        onSubOpen()
      } else {
        toast(e.response?.data?.error || 'Xatolik', 'err')
      }
    } finally { setLoading(false) }
  }

  const download = () => {
    if (!result?.downloadUrl) return
    const auth = JSON.parse(localStorage.getItem('fikra_auth') || '{}')
    // To'g'ridan-to'g'ri server URL'iga link
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000'
    const url = `${API_BASE}${result.downloadUrl}`

    // Telegram WebApp'da openLink ishlatamiz
    const tg = (window as any).Telegram?.WebApp
    if (tg && tg.openLink) {
      tg.openLink(url, { try_instant_view: false })
    } else {
      // Brauzerda: oddiy link
      window.open(url, '_blank')
    }
    toast('Yuklab olish boshlandi', 'ok')
  }

  const docsUsed = user?.aiUsage?.docs ?? 0
  const docsLimit = user?.aiLimits?.docs
  const canDoc = docsLimit === null || docsUsed < (docsLimit as number)

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }}>
        {docsLimit === null ? 'Cheksiz' : `${docsUsed}/${docsLimit} bugun`}
      </div>

      {/* Format tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['DOCX', 'PDF', 'PPTX'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            style={{
              flex: 1,
              padding: 8,
              background: format === f ? 'var(--g)' : 'var(--s2)',
              color: format === f ? '#00271e' : 'var(--txt-2)',
              border: '1px solid ' + (format === f ? 'var(--g)' : 'var(--f)'),
              borderRadius: 'var(--br2)',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <textarea
        className="textarea"
        placeholder="Hujjat mavzusini yozing... Masalan: 'Mendeleyev davriy jadvali haqida 2 sahifalik referat'"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={4}
        style={{ marginBottom: 10 }}
      />

      {!canDoc ? (
        <button onClick={onSubOpen} className="btn btn-primary btn-block btn-lg">
          Limit tugadi · Obuna olish ↗
        </button>
      ) : (
        <button
          disabled={loading || !prompt.trim()}
          onClick={generate}
          className="btn btn-primary btn-block btn-lg"
        >
          {loading ? '⏳ Yaratilmoqda...' : '✨ Yaratish'}
        </button>
      )}

      {result && (
        <div style={{
          marginTop: 16,
          background: 'rgba(0,212,170,0.07)',
          border: '1px solid rgba(0,212,170,0.25)',
          borderRadius: 'var(--br)',
          padding: 14,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            ✅ {result.fileName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }}>
            {result.sizeKb} KB · {result.format}
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 12, lineHeight: 1.5 }}>
            {result.preview.slice(0, 200)}...
          </div>
          <button onClick={download} className="btn btn-success btn-block">
            ⬇ Yuklab olish
          </button>
        </div>
      )}
    </div>
  )
}

// ─── IMAGE TAB ────────────────────────────────────────────────────────
function ImageTab({ onSubOpen }: { onSubOpen: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { user, refreshUser } = useAppStore()
  const { toast } = useToast()

  const generate = async () => {
    const p = prompt.trim()
    if (p.length < 3 || loading) return
    setLoading(true)
    setResult(null)
    try {
      const { data } = await aiApi.image(p)
      setResult(data)
      refreshUser()
    } catch (e: any) {
      const code = e.response?.data?.code
      if (code === 'DAILY_LIMIT_REACHED' || code === 'SUBSCRIPTION_REQUIRED') {
        onSubOpen()
      } else {
        toast(e.response?.data?.error || 'Xatolik', 'err')
      }
    } finally { setLoading(false) }
  }

  const download = () => {
    if (!result?.downloadUrl) return
    const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000'
    const tg = (window as any).Telegram?.WebApp
    const url = `${API_BASE}${result.downloadUrl}`
    if (tg?.openLink) tg.openLink(url)
    else window.open(url, '_blank')
    toast('Yuklab olish boshlandi', 'ok')
  }

  const imagesUsed = user?.aiUsage?.images ?? 0
  const imagesLimit = user?.aiLimits?.images
  const canImage = imagesLimit !== 0 && (imagesLimit === null || imagesUsed < (imagesLimit as number))

  if (imagesLimit === 0) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="empty">
          🎨 AI Rasm yaratish<br />
          <span style={{ color: 'var(--acc-l)' }}>Basic+ obunada ochiladi</span>
        </div>
        <button onClick={onSubOpen} className="btn btn-primary btn-block btn-lg">
          Obuna ko'rish ⭐
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }}>
        {imagesLimit === null ? 'Cheksiz' : `${imagesUsed}/${imagesLimit} bugun`}
      </div>

      <input
        className="input"
        placeholder="Rasm tavsifi (ingliz tilida yaxshiroq)..."
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        style={{ marginBottom: 10 }}
      />

      {!canImage ? (
        <button onClick={onSubOpen} className="btn btn-primary btn-block btn-lg">
          Limit tugadi · Obuna ↗
        </button>
      ) : (
        <button
          disabled={loading || prompt.length < 3}
          onClick={generate}
          className="btn btn-primary btn-block btn-lg"
        >
          {loading ? '🎨 Yaratilmoqda...' : '🎨 Yaratish'}
        </button>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <img
            src={`data:${result.mimeType};base64,${result.base64}`}
            style={{ width: '100%', borderRadius: 'var(--br)' }}
            alt="AI generated"
          />
          <button onClick={download} className="btn btn-success btn-block" style={{ marginTop: 10 }}>
            ⬇ Yuklab olish
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ANALYSIS TAB ───────────────────────────────────────────────────────────
function AnalysisTab({ onSubOpen }: { onSubOpen: () => void }) {
  const [data, setData] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    setLoading(true)
    examApi.recommendations()
      .then(({ data }) => {
        if (!alive) return
        setData(data)
      })
      .catch(() => {
        if (alive) toast('Tahlil yuklanmadi', 'err')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => { alive = false }
  }, [toast])

  const startDrill = (subject: string, count: number) => {
    navigate(`/test?drill=1&subject=${encodeURIComponent(subject)}&count=${count}`)
  }

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>📈 Tarixdan tavsiyalar</div>
        {loading ? (
          <div style={{ color: 'var(--txt-3)', fontSize: 12 }}>Tahlil tayyorlanmoqda...</div>
        ) : data ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }}>{data.summary}</div>
            {data.progress && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--txt-3)' }}>
                O'rtacha ball: {data.progress.overallAvg.toFixed(2)} · So'nggi trend: {data.progress.growthTrend >= 0 ? '+' : ''}{data.progress.growthTrend}%
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--txt-3)', fontSize: 12 }}>Hozircha ma'lumot yo'q.</div>
        )}
      </div>

      {!loading && data && data.recommendations.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>💡 AI tavsiyalar</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.recommendations.map((item, idx) => (
              <div key={idx} style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.6 }}>• {item}</div>
            ))}
          </div>
        </div>
      )}

      {!loading && data && data.drillTargets.length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>⚡ Drill rejimi</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.drillTargets.map(target => (
              <div key={target.subject} style={{ paddingBottom: 10, borderBottom: '1px solid var(--f)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{target.subjectName}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                      {target.accuracy}% to'g'rilik · {target.questionCount} savol
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => startDrill(target.subject, target.questionCount)}
                  >
                    Mashq
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && data && data.weakAreas.length === 0 && (
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.7 }}>
            Hali sezilarli zaif fan topilmadi. Istasangiz, kengaytirilgan testlar ishlang.
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={onSubOpen} style={{ marginTop: 10 }}>
            Obuna yoki AI limit
          </button>
        </div>
      )}
    </div>
  )
}
