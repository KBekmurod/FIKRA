import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import SubscriptionModal from '../components/SubscriptionModal'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [subOpen, setSubOpen] = useState(false)

  const isSub = user?.effectivePlan && user.effectivePlan !== 'free'
  const planLabel: Record<string, string> = {
    free: '', basic: '⭐ Basic', pro: '✨ Pro', vip: '💎 VIP'
  }

  const hintsLimit = user?.aiLimits?.hints ?? 5
  const hintsUsed = user?.aiUsage?.hints ?? 0
  const hintsLeft = hintsLimit === null ? '∞' : Math.max(0, (hintsLimit as number) - hintsUsed)

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
        <button className="plan-pill" onClick={() => setSubOpen(true)}>
          {isSub
            ? <span style={{ color: 'var(--y)' }}>{planLabel[user.effectivePlan || 'free']}</span>
            : <><span style={{ color: 'var(--txt-2)' }}>Bepul</span> <span style={{ color: 'var(--acc-l)' }}>↗</span></>
          }
        </button>
      </div>

      {/* Salomlashish */}
      <div style={{ padding: '6px 20px 0' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(0,212,170,0.08))',
          border: '1px solid rgba(123,104,238,0.25)',
          borderRadius: 'var(--br)',
          padding: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 36 }}>🎓</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                Salom, {user?.firstName || 'Abituriyent'}!
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 2 }}>
                {isSub
                  ? `${planLabel[user.effectivePlan || 'free']} · AI cheksiz`
                  : `Bugun ${hintsLeft}/${hintsLimit} AI tushuntirish qoldi`}
              </div>
            </div>
            {(user?.streakDays || 0) > 0 && (
              <div style={{
                background: 'rgba(255,204,68,0.15)',
                border: '1px solid rgba(255,204,68,0.3)',
                borderRadius: 12,
                padding: '8px 12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 16 }}>🔥</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--y)' }}>
                  {user!.streakDays} kun
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asosiy harakatlar */}
      <div className="section-title">Asosiy</div>
      <div style={{ padding: '0 20px', display: 'grid', gap: 10 }}>
        <button
          onClick={() => navigate('/test')}
          style={{
            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
            border: 'none',
            borderRadius: 'var(--br)',
            padding: '20px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: 'white',
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
        >
          <div style={{ fontSize: 36 }}>📚</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>DTM Test yechish</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>9 fan · AI yordam bilan</div>
          </div>
          <div style={{ fontSize: 22 }}>→</div>
        </button>

        <button
          onClick={() => navigate('/ai')}
          style={{
            background: 'var(--s1)',
            border: '1px solid var(--f)',
            borderRadius: 'var(--br)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--txt)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 28 }}>🤖</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>AI yordamchi</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Chat · Hujjat yaratish · Rasm
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>

        {/* PWA O'rnatish (Install App) tugmasi - agar Service Worker ishlayotgan va hali o'rnatilmagan bo'lsa */}
        <button
          onClick={() => {
             // Odatda Service Worker ulanishida bu trigger bo'ladi
             // (Xozircha UI uchun asos)
             alert("Ilovani browser menyusidan 'Add to Home Screen' orqali o'rnating!");
          }}
          style={{
            background: 'var(--s2)',
            border: '1px dashed var(--acc-l)',
            borderRadius: 'var(--br)',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: 'var(--txt)',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 28 }}>📲</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--acc-l)' }}>Ilovani o'rnatib olish</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Telefon ekranidan Internetsiz va tezgina kiring
            </div>
          </div>
        </button>
      </div>

      {/* Obuna chaqiruv */}
      {!isSub && (
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={() => setSubOpen(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(123,104,238,0.12), rgba(255,204,68,0.08))',
              border: '1px solid rgba(123,104,238,0.25)',
              borderRadius: 'var(--br)',
              padding: 16,
              cursor: 'pointer',
              color: 'var(--txt)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 28 }}>⭐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                AI imkoniyatlarni cheksiz oching
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>
                Basic 149⭐ · cheksiz tushuntirish, ko'proq AI
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }}>↗</div>
          </button>
        </div>
      )}

      {/* Statistika */}
      <div className="section-title">Sizning statistikangiz</div>
      <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div className="card" style={{ textAlign: 'center', padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--acc-l)' }}>
            {user?.xp || 0}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>XP</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--g)' }}>
            {user?.totalGamesPlayed || 0}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>Test</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--y)' }}>
            {user?.totalAiRequests || 0}
          </div>
          <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>AI</div>
        </div>
      </div>

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}
