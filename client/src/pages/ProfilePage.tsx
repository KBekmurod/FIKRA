import { useState } from 'react'
import { useAppStore } from '../store'
import SubscriptionModal from '../components/SubscriptionModal'
import InstallPWA from '../components/InstallPWA'
import { useToast } from '../components/Toast'

export default function ProfilePage() {
  const { user } = useAppStore()
  const [subOpen, setSubOpen] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const { toast } = useToast()

  const isSub = user?.effectivePlan && user.effectivePlan !== 'free'
  const planLabel: Record<string, { name: string; emoji: string; color: string }> = {
    free:  { name: 'Bepul',  emoji: '🆓', color: 'var(--txt-3)' },
    basic: { name: 'Basic',  emoji: '⭐', color: 'var(--y)' },
    pro:   { name: 'Pro',    emoji: '✨', color: 'var(--acc-l)' },
    vip:   { name: 'VIP',    emoji: '💎', color: 'var(--g)' },
  }
  const plan = planLabel[user?.effectivePlan || 'free']

  const initials = (user?.firstName || 'F').slice(0, 2).toUpperCase()

  const daysLeft = user?.planExpiresAt
    ? Math.max(0, Math.ceil((new Date(user.planExpiresAt).getTime() - Date.now()) / 86400000))
    : 0

  const refLink = user?.telegramId
    ? `https://t.me/${(window as any).BOT_USERNAME || 'fikraai_bot'}?start=ref_${user.telegramId}`
    : ''

  const copyRef = () => {
    if (!refLink) return
    navigator.clipboard.writeText(refLink).then(() => toast('Havola nusxalandi!', 'ok'))
  }

  const shareRef = () => {
    if (!refLink) return
    const text = `FIKRA — DTM testlarga AI bilan tayyorlanish!\n${refLink}`
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`)
    } else if (navigator.share) {
      navigator.share({ text, url: refLink }).catch(() => {})
    }
  }

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
      </div>

      <div style={{ height: 6 }} />

      {/* Profile card */}
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg, var(--acc), var(--r))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 22,
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {user?.firstName || user?.username || 'Foydalanuvchi'}
            </div>
            {user?.username && (
              <div style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 2 }}>
                @{user.username}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--y)', marginTop: 4, fontWeight: 700 }}>
              ⚡ {(user?.xp || 0).toLocaleString()} XP
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="card" style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--acc-l)' }}>
            {user?.streakDays || 0}
          </div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>🔥 Streak</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--g)' }}>
            {user?.totalGamesPlayed || 0}
          </div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>📚 Test</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--y)' }}>
            {user?.totalAiRequests || 0}
          </div>
          <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>🤖 AI</div>
        </div>
      </div>

      {/* Plan card */}
      <div className="section-title">Obuna</div>
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={() => setSubOpen(true)}
          style={{
            width: '100%',
            background: 'var(--s1)',
            border: `1.5px solid ${isSub ? 'rgba(0,212,170,0.3)' : 'rgba(123,104,238,0.25)'}`,
            borderRadius: 'var(--br)',
            padding: 16,
            cursor: 'pointer',
            color: 'var(--txt)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>{plan.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: plan.color }}>
                {plan.name} {isSub ? 'faol' : 'rejim'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 3 }}>
                {isSub
                  ? `${daysLeft} kun qoldi`
                  : 'AI imkoniyatlarni cheksiz oching'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }}>
              {isSub ? 'Uzaytirish ↗' : 'Obuna ↗'}
            </div>
          </div>
        </button>
      </div>

      {/* Install App Button */}
      <div className="section-title">🚀 Ilovani boshqaruvi</div>
      <div style={{ padding: '0 20px' }}>
        <button
          onClick={() => setInstallOpen(true)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
            border: 'none',
            borderRadius: 'var(--br)',
            padding: 16,
            cursor: 'pointer',
            color: 'white',
            textAlign: 'left',
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          📱 Ilovani o'rnating / Yangilash
          <span style={{ marginLeft: 'auto' }}>↗</span>
        </button>
      </div>

      {/* Install Modal */}
      {installOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 2000
          }}
          onClick={() => setInstallOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'var(--bg)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px' }}>📱 Ilovani o'rnating</h2>
              <button
                onClick={() => setInstallOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--txt-2)'
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: 'var(--s2)',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '15px'
              }}
            >
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '12px' }}>
                📌 Ilovaning URL manzili:
              </p>
              <div
                style={{
                  background: 'var(--bg)',
                  padding: '10px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  borderLeft: '3px solid var(--acc)'
                }}
              >
                <code
                  style={{
                    fontSize: '11px',
                    color: 'var(--acc)',
                    flex: 1,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace'
                  }}
                >
                  {window.location.origin}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin)
                    toast('✓ URL nusxalandi!', 'ok')
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--acc)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  📋 Nusxa
                </button>
              </div>
            </div>

            <div
              style={{
                background: 'var(--s2)',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '15px'
              }}
            >
              <p
                style={{
                  margin: '0 0 12px 0',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                📱 Bosqichma-bosqich (Telegram ichidan):
              </p>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '13px',
                  lineHeight: '1.8',
                  color: 'var(--txt-2)'
                }}
              >
                <li>
                  <strong>Chrome brauzerini oching</strong> (Telegram brauzer emas)
                </li>
                <li>
                  URL nusxasini <strong>manzil sariyasiga paste qiling</strong>
                </li>
                <li>
                  <strong>3 nuqta tugmasini bosing</strong> (⋮) oʻng burchakda
                </li>
                <li>
                  <strong>"Ekranga qoʻshish"</strong> yoki <strong>"O'rnatish"</strong> bosing
                </li>
                <li>
                  <strong>✅ Tayyor!</strong> Ilovasi smartfonyungizda paydo boʻladi
                </li>
              </ol>
            </div>

            <button
              onClick={() => {
                window.open(window.location.origin, '_blank')
                setInstallOpen(false)
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--acc)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '8px'
              }}
            >
              🌐 Chrome-da ochish
            </button>

            <button
              onClick={() => setInstallOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--s2)',
                color: 'var(--txt-2)',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      {/* Limit indikator */}
      <div style={{ padding: '12px 20px 0' }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }}>
            Bugungi AI limit
          </div>
          {[
            { key: 'hints',  name: '💡 AI Tushuntirish', limit: user?.aiLimits?.hints, used: user?.aiUsage?.hints },
            { key: 'chats',  name: '💬 AI Chat',         limit: user?.aiLimits?.chats, used: user?.aiUsage?.chats },
            { key: 'docs',   name: '📄 Hujjat',           limit: user?.aiLimits?.docs,  used: user?.aiUsage?.docs  },
            { key: 'images', name: '🎨 Rasm',             limit: user?.aiLimits?.images, used: user?.aiUsage?.images },
          ].map(item => {
            const used = item.used ?? 0
            const limit = item.limit
            const isUnlimited = limit === null
            const isLocked = limit === 0
            const pct = isUnlimited ? 0 : isLocked ? 0 : Math.min(100, (used / (limit as number)) * 100)
            return (
              <div key={item.key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>{item.name}</span>
                  <span style={{ color: isLocked ? 'var(--r)' : 'var(--txt-2)', fontWeight: 700 }}>
                    {isLocked ? 'Yopiq' : isUnlimited ? '∞ Cheksiz' : `${used}/${limit}`}
                  </span>
                </div>
                {!isLocked && !isUnlimited && (
                  <div style={{ height: 4, background: 'var(--s2)', borderRadius: 100 }}>
                    <div style={{
                      height: '100%',
                      background: pct >= 100 ? 'var(--r)' : 'var(--acc)',
                      width: `${pct}%`,
                      borderRadius: 100,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Referral */}
      <div className="section-title">Do'stni taklif qiling</div>
      <div style={{ padding: '0 20px 24px' }}>
        <div className="card">
          <div style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 8 }}>
            Sizning havolangiz
          </div>
          <div style={{
            background: 'var(--s2)',
            border: '1px solid var(--f)',
            borderRadius: 'var(--br2)',
            padding: '10px 12px',
            fontSize: 11,
            fontFamily: 'monospace',
            color: 'var(--txt-2)',
            wordBreak: 'break-all',
            marginBottom: 10,
          }}>{refLink}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyRef} className="btn btn-ghost btn-block">📋 Nusxa</button>
            <button onClick={shareRef} className="btn btn-success btn-block">📤 Ulashish</button>
          </div>
        </div>
      </div>

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}
