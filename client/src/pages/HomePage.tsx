import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { levelApi } from '../api/endpoints'
import { GRADE_META } from '../constants/subjects'
import type { UserLevelData } from '../types'
import SubscriptionModal from '../components/SubscriptionModal'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const [subOpen, setSubOpen] = useState(false)
  const [level, setLevel] = useState<UserLevelData | null>(null)

  const isSub = user?.effectivePlan && user.effectivePlan !== 'free'
  const planLabel: Record<string, string> = {
    free: '', basic: '⭐ Basic', pro: '✨ Pro', vip: '💎 VIP'
  }

  useEffect(() => {
    levelApi.current()
      .then(({ data }) => setLevel(data))
      .catch(() => {})
  }, [])

  const grade = level?.currentGrade || 'beta'
  const gradeMeta = GRADE_META[grade as keyof typeof GRADE_META]
  const versionInGrade = level ? (
    grade === 'beta' ? level.currentVersion
    : grade === 'delta' ? level.currentVersion - 3
    : level.currentVersion - 7
  ) : 1

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

      {/* Salomlashish + Daraja */}
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
                  ? `${planLabel[user.effectivePlan || 'free']} · cheksiz AI`
                  : "DTM tayyorlik platformasi"}
              </div>
            </div>
            {level && (
              <button
                onClick={() => navigate('/level')}
                style={{
                  background: gradeMeta.bgColor,
                  border: `1px solid ${gradeMeta.color}40`,
                  borderRadius: 12,
                  padding: '8px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: 'var(--txt)',
                }}
              >
                <div style={{ fontSize: 18, color: gradeMeta.color, fontWeight: 800 }}>
                  {gradeMeta.icon}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: gradeMeta.color }}>
                  {gradeMeta.name} {versionInGrade}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Asosiy harakatlar */}
      <div className="section-title">Asosiy</div>
      <div style={{ padding: '0 20px', display: 'grid', gap: 10 }}>
        <button
          onClick={() => navigate('/subjects')}
          style={{
            background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
            border: 'none',
            borderRadius: 'var(--br)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: 'white',
            cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 36 }}>📚</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 2 }}>Fanlar</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Material qo'shing · AI test yarating
            </div>
          </div>
          <div style={{ fontSize: 22 }}>→</div>
        </button>

        <button
          onClick={() => navigate('/test')}
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
          <div style={{ fontSize: 28 }}>📝</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Fikra standart DTM test</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              Yo'nalish bo'yicha to'liq imtihon
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
        </button>

        <button
          onClick={() => navigate('/cabinet')}
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
          <div style={{ fontSize: 28 }}>🎯</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Xatolar tahlili</div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              AI bilan zaif joylarni o'rganing
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
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
              Chat · Hujjat · Rasm
            </div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--txt-3)' }}>→</div>
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
                Imkoniyatlarni cheksiz oching
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>
                Basic 149⭐ · ko'proq material, AI test, fayl yuklash
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }}>↗</div>
          </button>
        </div>
      )}

      {/* Joriy oy statistikasi */}
      {level && (
        <>
          <div className="section-title">Joriy oy statistikasi</div>
          <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="card" style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--acc-l)' }}>
                {level.standardTests.total}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>Standart</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--g)' }}>
                {level.personalTests.total}
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>Shaxsiy</div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--y)' }}>
                {level.accuracyPercent}%
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>Aniqlik</div>
            </div>
          </div>
        </>
      )}

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}
