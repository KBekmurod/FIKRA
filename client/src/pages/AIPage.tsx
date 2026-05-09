import { useState, useRef, useEffect } from 'react'
import { useAppStore } from '../store'
import { aiApi, streamChat } from '../api/endpoints'
import { useToast } from '../components/Toast'
import SubscriptionModal from '../components/SubscriptionModal'

type Tab = 'chat' | 'doc' | 'image'

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
      </div>

      {tab === 'chat' && <ChatTab onSubOpen={() => setSubOpen(true)} />}
      {tab === 'doc' && <DocTab onSubOpen={() => setSubOpen(true)} />}
      {tab === 'image' && <ImageTab onSubOpen={() => setSubOpen(true)} />}

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

  // Keyboard ochilganda scroll oxiriga — requestAnimationFrame bilan (DOM ready)
  useEffect(() => {
    if (!msgsRef.current) return
    const el = msgsRef.current
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [messages])

  return (
    <div className="chat-wrap">
      <div style={{ padding: '4px 20px 6px', fontSize: 11, color: 'var(--txt-3)', flexShrink: 0 }}>
        {chatsLimit === null ? 'Cheksiz' : `${chatsUsed}/${chatsLimit} bugun ishlatildi`}
      </div>

      <div ref={msgsRef} className="chat-messages">
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
        <div className="chat-input-bar">
          <button onClick={onSubOpen} className="btn btn-primary btn-block">
            Limit tugadi · Obuna olish ↗
          </button>
        </div>
      ) : (
        <div className="chat-input-bar">
          <textarea
            className="textarea"
            placeholder="Savol yozing..."
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={2}
            style={{ flex: 1, minHeight: 44, maxHeight: 120, fontSize: 14 }}
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
            style={{ width: 44, height: 44, padding: 0, flexShrink: 0 }}
          >
            {sending ? <span className="spin" style={{ width: 16, height: 16, borderWidth: 2 }} /> : '→'}
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
