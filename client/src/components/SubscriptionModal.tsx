import { useState, useEffect, useMemo } from 'react'
import { subApi } from '../api/endpoints'
import { useAppStore } from '../store'
import { useToast } from './Toast'
import Modal from './Modal'
import type { PlanData } from '../types'

interface Props {
  open: boolean
  onClose: () => void
}

type PeriodType = '1m' | '3m' | '12m';

export default function SubscriptionModal({ open, onClose }: Props) {
  const [plans, setPlans] = useState<PlanData[]>([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<PeriodType>('1m')
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoApplied, setPromoApplied] = useState(false)

  const { user } = useAppStore()
  const toast = useToast()

  useEffect(() => {
    if (open) {
      subApi.plans().then(r => setPlans(r.data)).catch(() => {})
    }
  }, [open])

  const visiblePlans = useMemo(() => {
    return plans.filter(p => p.id.endsWith(`_${period}`))
  }, [plans, period])

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const res = await subApi.validatePromo(promoCode.trim());
      setPromoDiscount(res.data.discountPercent);
      setPromoApplied(true);
      toast.success(`Tabriklaymiz! ${res.data.discountPercent}% chegirma qo'llanildi.`);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Promokod xato yoki muddati tugagan');
      setPromoDiscount(0);
      setPromoApplied(false);
    } finally {
      setPromoLoading(false);
    }
  }

  const handleBuy = async (planId: string) => {
    if (!user) {
      toast.error('Avval tizimga kiring')
      return
    }
    setLoading(true)
    try {
      const { data } = await subApi.createP2POrder(planId, promoApplied ? promoCode.trim() : undefined)
      const adminUsername = (window as any).ADMIN_USERNAME || 'fikra_support'
      if (adminUsername) {
        const rawText = `Salom! Men FIKRA ilovasidan ${data.order.planName} obunasini olmoqchiman.\nBuyurtma ID: ${data.order.orderId}\nNarx: ${data.order.priceUZS.toLocaleString()} UZS\n\nRekvizitlarni yuboring!`
        const text = encodeURIComponent(rawText)
        
        try {
          await navigator.clipboard.writeText(rawText)
        } catch (err) {
          console.warn('Clipboard write failed', err)
        }

        // Use location.href instead of window.open to avoid popup blockers on mobile PWA
        window.location.href = `https://t.me/${adminUsername}?text=${text}&_t=${Date.now()}`
      }
      toast.success(`Telegram ochilmoqda! Agar matn eski bo'lsa, xotiradan "Pastroq/Paste" qiling.`)
      onClose()
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Xatolik')
    } finally {
      setLoading(false)
    }
  }

  const tierColor: Record<string, string> = {
    basic: 'var(--y)', pro: 'var(--acc)', vip: 'var(--g)'
  }
  const tierEmoji: Record<string, string> = { basic: '⭐', pro: '✨', vip: '💎' }

  const isFree = !user?.effectivePlan || user.effectivePlan === 'free';

  return (
    <Modal open={open} onClose={onClose} title="💎 Obuna rejalari">
      
      {/* Free Plan Limits (Og'riq nuqtasini ko'rsatish) */}
      {isFree && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--f)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🆓</span> Bepul tarifingiz cheklovlari (kunlik):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: 'var(--txt-2)' }}>
            <div>• <b>20 ta</b> AI tushuntirish</div>
            <div>• <b>30 ta</b> AI xabar</div>
            <div>• <b>3 ta</b> Hujjat tahlili (PDF)</div>
            <div>• <b>5 ta</b> Rasm (OCR)</div>
            <div>• <b>5 ta</b> AI test generatsiya</div>
            <div>• <b>5 ta</b> Material saqlash</div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--acc-l)', marginTop: 8, fontWeight: 700 }}>
            Cheklovlardan xalos bo'lish uchun obunani tanlang ↓
          </div>
        </div>
      )}

      {/* Period Toggle */}
      <div style={{
        display: 'flex',
        background: 'var(--s2)',
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
        border: '1px solid var(--f)',
      }}>
        <button
          onClick={() => setPeriod('1m')}
          style={{
            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
            background: period === '1m' ? 'var(--s1)' : 'transparent',
            color: period === '1m' ? 'var(--txt)' : 'var(--txt-3)',
            fontWeight: period === '1m' ? 800 : 600,
            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: period === '1m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          1 oy
        </button>
        <button
          onClick={() => setPeriod('3m')}
          style={{
            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
            background: period === '3m' ? 'var(--s1)' : 'transparent',
            color: period === '3m' ? 'var(--txt)' : 'var(--txt-3)',
            fontWeight: period === '3m' ? 800 : 600,
            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: period === '3m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          3 oy
        </button>
        <button
          onClick={() => setPeriod('12m')}
          style={{
            flex: 1, padding: '8px 0', border: 'none', borderRadius: 8,
            background: period === '12m' ? 'var(--s1)' : 'transparent',
            color: period === '12m' ? 'var(--txt)' : 'var(--txt-3)',
            fontWeight: period === '12m' ? 800 : 600,
            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: period === '12m' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          12 oy <span style={{ color: 'var(--g)', fontSize: 10, verticalAlign: 'top' }}>%</span>
        </button>
      </div>

      {/* To'lov uslubi banneri */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 6,
        marginBottom: 14,
      }}>
        <div style={{ padding: '8px 6px', background: 'rgba(0,212,170,0.12)', border: '1.5px solid rgba(0,212,170,0.35)', borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 16 }}>🤝</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--g)', marginTop: 2 }}>P2P</div>
          <div style={{ fontSize: 8, color: 'var(--g)' }}>Faol</div>
        </div>
        <div style={{ padding: '8px 6px', background: 'var(--s2)', border: '1px solid var(--f)', borderRadius: 10, textAlign: 'center', opacity: 0.6 }}>
          <div style={{ fontSize: 16 }}>💳</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }}>Payme</div>
          <div style={{ fontSize: 8, color: 'var(--txt-3)' }}>Tez orada</div>
        </div>
        <div style={{ padding: '8px 6px', background: 'var(--s2)', border: '1px solid var(--f)', borderRadius: 10, textAlign: 'center', opacity: 0.6 }}>
          <div style={{ fontSize: 16 }}>💳</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--txt-2)', marginTop: 2 }}>Click</div>
          <div style={{ fontSize: 8, color: 'var(--txt-3)' }}>Tez orada</div>
        </div>
      </div>

      {/* Promokod bo'limi */}
      <div style={{
        background: 'var(--s2)', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid var(--f)',
        display: 'flex', gap: 8, alignItems: 'center'
      }}>
        <div style={{ fontSize: 16 }}>🎟️</div>
        <input 
          type="text" 
          placeholder="Promokod (agar bo'lsa)" 
          value={promoCode}
          onChange={e => { setPromoCode(e.target.value); setPromoApplied(false); setPromoDiscount(0); }}
          style={{
            flex: 1, background: 'transparent', border: 'none', color: 'var(--txt)', 
            fontSize: 13, outline: 'none', textTransform: 'uppercase'
          }}
          disabled={promoApplied || promoLoading}
        />
        {promoApplied ? (
          <span style={{ color: 'var(--g)', fontSize: 12, fontWeight: 700 }}>✓ Qo'llanildi</span>
        ) : (
          <button 
            onClick={applyPromo}
            disabled={!promoCode.trim() || promoLoading}
            style={{
              background: 'var(--s3)', border: '1px solid var(--f)', color: 'var(--txt)',
              padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
              opacity: !promoCode.trim() || promoLoading ? 0.5 : 1
            }}
          >
            {promoLoading ? '...' : "Qo'llash"}
          </button>
        )}
      </div>

      {/* Plan kartalari */}
      <div style={{ display: 'grid', gap: 10 }}>
        {visiblePlans.map(plan => {
          const color = tierColor[plan.tier] || 'var(--txt-2)'
          const emoji = tierEmoji[plan.tier] || '⭐'
          const isPro = plan.tier === 'pro'
          
          const finalPrice = promoApplied 
            ? Math.max(0, Math.round(plan.priceUZS * (1 - promoDiscount / 100))) 
            : plan.priceUZS;

          return (
            <div
              key={plan.id}
              style={{
                background: 'var(--s1)',
                border: `1.5px solid ${isPro ? color : 'var(--f)'}`,
                borderRadius: 14,
                padding: 14,
                position: 'relative',
              }}
            >
              {isPro && (
                <div style={{
                  position: 'absolute', top: -10, right: 12,
                  background: color, color: '#0a0a14',
                  fontSize: 9, fontWeight: 800, padding: '3px 10px',
                  borderRadius: 100, letterSpacing: 0.5,
                }}>OMMABOP</div>
              )}
              {plan.badge && !isPro && (
                <div style={{
                  position: 'absolute', top: -10, right: 12,
                  background: 'var(--s2)', color: 'var(--txt-2)', border: '1px solid var(--f)',
                  fontSize: 9, fontWeight: 800, padding: '2px 8px',
                  borderRadius: 100,
                }}>{plan.badge}</div>
              )}
              {plan.badge && isPro && (
                <div style={{
                  position: 'absolute', top: -10, right: 90,
                  background: 'var(--s2)', color: 'var(--txt)', border: `1px solid ${color}`,
                  fontSize: 9, fontWeight: 800, padding: '2px 8px',
                  borderRadius: 100,
                }}>{plan.badge}</div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 26 }}>{emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color }}>{plan.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {promoApplied && (
                    <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--txt-3)', marginBottom: -2 }}>
                      {plan.priceUZS.toLocaleString()}
                    </div>
                  )}
                  <div style={{ fontWeight: 900, fontSize: 18, color: promoApplied ? 'var(--g)' : 'inherit' }}>
                    {finalPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>UZS / {plan.period}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--txt)', display: 'flex', gap: 8, alignItems: 'flex-start', lineHeight: 1.3 }}>
                    <span style={{ color, marginTop: 1 }}>✓</span>
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
                  color: isPro ? '#ffffff' : '#0a0a14',
                  textShadow: isPro ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontSize: 14,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  boxShadow: `0 4px 14px ${color}66`,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? '⏳ Bajarilmoqda...' : '🤝 Olish (P2P)'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Eslatma */}
      <div style={{
        marginTop: 14, padding: 12,
        background: 'rgba(123,104,238,0.06)', border: '1px solid rgba(123,104,238,0.18)',
        borderRadius: 10, fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5,
      }}>
        🤝 <strong>P2P (Peer-to-Peer)</strong> — admin bilan to'g'ridan-to'g'ri to'lov.
        Admin'ga yozib, kartani to'ldirib chek yuborasiz. Admin obunani faollashtiradi.
      </div>
    </Modal>
  )
}
