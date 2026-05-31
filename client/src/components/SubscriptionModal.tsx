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



  const handleBuy = async (planId: string) => {
    if (!user) {
      toast.error('Avval tizimga kiring')
      return
    }
    setLoading(true)
    try {
      const { data } = await subApi.createP2POrder(planId)
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
          background: 'linear-gradient(145deg, rgba(255,80,80,0.05), rgba(255,80,80,0.01))',
          border: '1px solid rgba(255,80,80,0.2)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#ff6b6b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span> Bepul tarif cheklovlari
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: 'var(--txt-2)' }}>
            <div style={{ background: 'var(--s2)', padding: '6px 10px', borderRadius: 6 }}>• <b style={{color:'var(--txt)'}}>20 ta</b> AI tushuntirish</div>
            <div style={{ background: 'var(--s2)', padding: '6px 10px', borderRadius: 6 }}>• <b style={{color:'var(--txt)'}}>30 ta</b> AI xabar / kun</div>
            <div style={{ background: 'var(--s2)', padding: '6px 10px', borderRadius: 6 }}>• <b style={{color:'var(--txt)'}}>3 ta</b> PDF / Hujjat</div>
            <div style={{ background: 'var(--s2)', padding: '6px 10px', borderRadius: 6 }}>• <b style={{color:'var(--txt)'}}>5 ta</b> Rasm (OCR)</div>
            <div style={{ background: 'var(--s2)', padding: '6px 10px', borderRadius: 6 }}>• <b style={{color:'var(--txt)'}}>5 ta</b> Test generatsiya</div>
            <div style={{ background: 'var(--s2)', padding: '6px 10px', borderRadius: 6 }}>• Reklamalar mavjud</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--acc)', marginTop: 12, fontWeight: 700, textAlign: 'center' }}>
            Cheksiz imkoniyatlarga ega bo'lish uchun obunani tanlang! 👇
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



      {/* Plan kartalari */}
      <div style={{ display: 'grid', gap: 10 }}>
        {visiblePlans.map(plan => {
          const color = tierColor[plan.tier] || 'var(--txt-2)'
          const emoji = tierEmoji[plan.tier] || '⭐'
          const isPro = plan.tier === 'pro'
          
          const finalPrice = plan.priceUZS;

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
                  <div style={{ fontWeight: 900, fontSize: 18, color: 'inherit' }}>
                    {finalPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--txt-3)' }}>UZS / {plan.period}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
                {plan.features.map((f, i) => {
                  const isUnlimited = f.toLowerCase().includes('cheksiz');
                  return (
                    <div key={i} style={{ 
                      fontSize: 13, 
                      color: isUnlimited ? 'var(--txt)' : 'var(--txt-2)', 
                      display: 'flex', 
                      gap: 10, 
                      alignItems: 'center', 
                      background: 'rgba(255,255,255,0.02)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: `${color}22`, color: color, fontSize: 10, fontWeight: 900
                      }}>✓</div>
                      <div style={{ flex: 1 }}>
                        {f.split(/(Cheksiz|\d+|\/kun)/i).map((part, idx) => {
                          if (/cheksiz/i.test(part)) return <span key={idx} style={{ color: color, fontWeight: 800, textShadow: `0 0 8px ${color}66` }}>{part}</span>;
                          if (/\d+/.test(part)) return <strong key={idx} style={{ color: 'var(--txt)' }}>{part}</strong>;
                          if (/\/kun/i.test(part)) return <span key={idx} style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>kunlik</span>;
                          return part;
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                onClick={() => handleBuy(plan.id)}
                disabled={loading}
                style={{
                  width: '100%',
                  background: isPro ? `linear-gradient(135deg, ${color}, #a78bfa)` : `linear-gradient(135deg, var(--s3), var(--s2))`,
                  color: isPro ? '#0a0a14' : 'var(--txt)',
                  border: isPro ? 'none' : `1px solid ${color}55`,
                  borderRadius: 12,
                  padding: '16px',
                  fontSize: 15,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  boxShadow: isPro ? `0 8px 24px ${color}55` : 'none',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
              >
                {loading ? '⏳ KUTING...' : isPro ? '🚀 PRO GA O\'TISH (P2P)' : '💎 SOTIB OLISH (P2P)'}
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
