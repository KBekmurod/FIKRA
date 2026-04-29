import { useEffect, useState } from 'react'
import { subApi } from '../api/endpoints'
import type { PlanData } from '../types'
import Modal from './Modal'
import { useToast } from './Toast'
import { useAppStore } from '../store'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SubscriptionModal({ open, onClose }: Props) {
  const [plans, setPlans] = useState<PlanData[]>([])
  const [payMode, setPayMode] = useState<'stars' | 'p2p'>('stars')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user, refreshUser } = useAppStore()

  useEffect(() => {
    if (open) {
      subApi.plans().then(r => setPlans(r.data)).catch(() => {})
    }
  }, [open])

  const handleBuy = async (planId: string) => {
    if (user?._demo) { toast('Telegram ichida kiring', 'err'); return }
    setLoading(true)
    try {
      if (payMode === 'stars') {
        const { data } = await subApi.createInvoice(planId)
        const tg = (window as any).Telegram?.WebApp
        if (data.invoiceUrl && tg) {
          tg.openInvoice(data.invoiceUrl, async (status: string) => {
            if (status === 'paid') {
              toast('✅ Obuna faollashtirildi!', 'ok')
              setTimeout(() => { refreshUser(); onClose() }, 1500)
            } else if (status === 'cancelled') {
              toast('To\'lov bekor qilindi')
            }
          })
        }
      } else {
        // P2P
        const { data } = await subApi.createP2POrder(planId)
        const adminUsername = (window as any).ADMIN_USERNAME || 'admin'
        const text = encodeURIComponent(
          `Salom! Men FIKRA ilovasidan ${data.order.planName} obunasini olmoqchiman.\n` +
          `Buyurtma ID: ${data.order.orderId}\n` +
          `Narx: ${data.order.priceUZS.toLocaleString()} UZS\n\n` +
          `Rekvizitlarni yuboring!`
        )
        const url = `https://t.me/${adminUsername}?text=${text}`
        const tg = (window as any).Telegram?.WebApp
        if (tg) tg.openTelegramLink(url)
        else window.open(url, '_blank')
        toast('Buyurtma yaratildi! Admin javob beradi.', 'ok')
        onClose()
      }
    } catch (e: any) {
      toast(e.response?.data?.error || 'Xatolik', 'err')
    } finally { setLoading(false) }
  }

  const tierColor: Record<string, string> = {
    basic: 'var(--y)', pro: 'var(--acc)', vip: 'var(--g)'
  }
  const tierEmoji: Record<string, string> = { basic: '⭐', pro: '✨', vip: '💎' }

  return (
    <Modal open={open} onClose={onClose} title="⭐ Obuna rejalari">
      {/* To'lov turi */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setPayMode('stars')}
          className="btn btn-block"
          style={{
            background: payMode === 'stars' ? 'rgba(123,104,238,0.15)' : 'var(--s2)',
            color: payMode === 'stars' ? 'var(--acc-l)' : 'var(--txt-2)',
            border: `1.5px solid ${payMode === 'stars' ? 'var(--acc)' : 'var(--f)'}`,
          }}
        >⭐ Telegram Stars</button>
        <button
          onClick={() => setPayMode('p2p')}
          className="btn btn-block"
          style={{
            background: payMode === 'p2p' ? 'rgba(0,212,170,0.1)' : 'var(--s2)',
            color: payMode === 'p2p' ? 'var(--g)' : 'var(--txt-2)',
            border: `1.5px solid ${payMode === 'p2p' ? 'var(--g)' : 'var(--f)'}`,
          }}
        >💳 P2P (Bank)</button>
      </div>

      <div style={{
        background: payMode === 'stars' ? 'rgba(123,104,238,0.07)' : 'rgba(0,212,170,0.07)',
        border: '1px solid var(--f)',
        borderRadius: 'var(--br2)',
        padding: '10px 12px',
        marginBottom: 14,
        fontSize: 12,
        color: 'var(--txt-2)',
      }}>
        {payMode === 'stars'
          ? 'Telegram Stars orqali to\'g\'ridan-to\'g\'ri. Darhol faollanadi.'
          : 'Karta orqali: ID olasiz → Adminga chek yuborasiz → Admin tasdiqlaydi.'}
      </div>

      {plans.map(p => (
        <div
          key={p.id}
          style={{
            background: 'var(--s2)',
            border: `1.5px solid ${p.tier === 'pro' ? 'var(--acc)' : 'var(--f)'}`,
            borderRadius: 'var(--br)',
            padding: 14,
            marginBottom: 10,
            position: 'relative',
          }}
        >
          {p.badge && (
            <div style={{
              position: 'absolute', top: -8, right: 12,
              background: tierColor[p.tier], color: '#000',
              fontSize: 10, fontWeight: 800, padding: '2px 10px', borderRadius: 100
            }}>{p.badge}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>{tierEmoji[p.tier]}</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: tierColor[p.tier] }}>{p.name}</span>
              <span style={{ fontSize: 12, color: 'var(--txt-3)' }}>{p.period}</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>
              {payMode === 'stars' ? `${p.priceStars}⭐` : `${p.priceUZS.toLocaleString()} UZS`}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {p.features.map((f, i) => (
              <div key={i} style={{
                fontSize: 11, color: 'var(--txt-2)',
                background: 'var(--s3)', borderRadius: 6, padding: '3px 8px'
              }}>{f}</div>
            ))}
          </div>
          <button
            disabled={loading}
            onClick={() => handleBuy(p.id)}
            className={`btn btn-block ${p.tier === 'pro' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Obuna olish →
          </button>
        </div>
      ))}

      <div style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', paddingTop: 8 }}>
        Telegram Stars to'lovlari qaytarilmaydi
      </div>
    </Modal>
  )
}
