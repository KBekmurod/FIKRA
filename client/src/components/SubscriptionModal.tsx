import { useState, useEffect } from 'react'
import { subApi } from '../api/endpoints'
import { useAppStore } from '../store'
import { useToast } from './Toast'
import Modal from './Modal'
import type { PlanData } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SubscriptionModal({ open, onClose }: Props) {
  const [plans, setPlans] = useState<PlanData[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAppStore()
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      subApi.plans().then(r => setPlans(r.data)).catch(() => {})
    }
  }, [open])

  // P2P faqat — Payme/Click kelajakda
  const handleBuy = async (planId: string) => {
    if (!user) {
      toast('Avval tizimga kiring', 'err')
      return
    }
    setLoading(true)
    try {
      const { data } = await subApi.createP2POrder(planId)
      const adminUsername = (window as any).ADMIN_USERNAME || ''
      if (adminUsername) {
        const text = encodeURIComponent(
          `Salom! Men FIKRA ilovasidan ${data.order.planName} obunasini olmoqchiman.\n` +
          `Buyurtma ID: ${data.order.orderId}\n` +
          `Narx: ${data.order.priceUZS.toLocaleString()} UZS\n\n` +
          `Rekvizitlarni yuboring!`
        )
        window.open(`https://t.me/${adminUsername}?text=${text}`, '_blank')
      }
      toast(`Buyurtma yaratildi (${data.order.orderId})! Admin javob beradi.`, 'ok')
      onClose()
    } catch (e: any) {
      toast(e.response?.data?.error || 'Xatolik', 'err')
    } finally {
      setLoading(false)
    }
  }

  const tierColor: Record<string, string> = {
    basic: 'var(--y)', pro: 'var(--acc)', vip: 'var(--g)'
  }
  const tierEmoji: Record<string, string> = { basic: '⭐', pro: '✨', vip: '💎' }

  return (
    <Modal open={open} onClose={onClose} title="⭐ Obuna rejalari">
      {/* To'lov uslubi banneri */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        marginBottom: 14,
      }}>
        <div style={{
          padding: '8px 6px',
          background: 'rgba(0,212,170,0.12)',
          border: '1.5px solid rgba(0,212,170,0.35)',
          borderRadius: 10,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 16 }}>🤝</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--g)', marginTop: 2 }}>P2P</div>
          <div style={{ fontSize: 8, color: 'var(--g)' }}>Faol</div>
        </div>
        <div style={{
          padding: '8px 6px',
          background: 'var(--s2)',
          border: '1px solid var(--f)',
          borderRadius: 10,
          textAlign: 'center',
          opacity: 0.6,
        }}>
          <div style={{ fontSize: 16 }}>💳</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }}>Payme</div>
          <div style={{ fontSize: 8, color: 'var(--txt-3)' }}>Tez orada</div>
        </div>
        <div style={{
          padding: '8px 6px',
          background: 'var(--s2)',
          border: '1px solid var(--f)',
          borderRadius: 10,
          textAlign: 'center',
          opacity: 0.6,
        }}>
          <div style={{ fontSize: 16 }}>💳</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }}>Click</div>
          <div style={{ fontSize: 8, color: 'var(--txt-3)' }}>Tez orada</div>
        </div>
      </div>

      {/* Plan kartalari */}
      <div style={{ display: 'grid', gap: 10 }}>
        {plans.map(plan => {
          const color = tierColor[plan.tier] || 'var(--txt-2)'
          const emoji = tierEmoji[plan.tier] || '⭐'
          const isMostPopular = plan.tier === 'pro' && plan.durationDays >= 30 && plan.durationDays < 90

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--s1)',
                border: `1.5px solid ${isMostPopular ? color : 'var(--f)'}`,
                borderRadius: 14,
                padding: 14,
                position: 'relative',
              }}
            >
              {isMostPopular && (
                <div style={{
                  position: 'absolute',
                  top: -10,
                  right: 12,
                  background: color,
                  color: '#0a0a14',
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 100,
                  letterSpacing: 0.5,
                }}>OMMABOP</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 26 }}>{emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color }}>{plan.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                    {plan.period}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>
                    {plan.priceUZS.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>UZS</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 4, marginBottom: 10 }}>
                {plan.features.slice(0, 4).map((f, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--txt-2)', display: 'flex', gap: 6 }}>
                    <span style={{ color }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleBuy(plan.id)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                  color: 'var(--txt)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '⏳ ...' : '🤝 P2P orqali olish'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Eslatma */}
      <div style={{
        marginTop: 14,
        padding: 12,
        background: 'rgba(123,104,238,0.06)',
        border: '1px solid rgba(123,104,238,0.18)',
        borderRadius: 10,
        fontSize: 11,
        color: 'var(--txt-2)',
        lineHeight: 1.5,
      }}>
        🤝 <strong>P2P (Peer-to-Peer)</strong> — admin bilan to'g'ridan-to'g'ri to'lov.
        Admin'ga yozib, kartani to'ldirib chek yuborasiz. Admin obunani faollashtiradi.
        <br /><br />
        💳 <strong>Payme va Click</strong> tez orada qo'shiladi.
      </div>
    </Modal>
  )
}
