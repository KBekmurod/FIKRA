import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, usePwaStore } from '../store'
import { materialApi, levelApi } from '../api/endpoints'
import { GRADE_META } from '../constants/subjects'
import type { MaterialLimits, UserLevelData } from '../types'
import SubscriptionModal from '../components/SubscriptionModal'
import { useToast } from '../components/Toast'

export default function ProfilePage() {
  const { user, logout } = useAppStore()
  const navigate = useNavigate()
  const handleLogout = () => {
    if (confirm("Akkountdan chiqasizmi?")) {
      logout()
      navigate('/auth/welcome', { replace: true })
    }
  }
  const [subOpen, setSubOpen] = useState(false)
  const toast = useToast()
  const { canInstall, installPwa, isInstalled } = usePwaStore()

  const [matLimits, setMatLimits] = useState<MaterialLimits | null>(null)
  const [level, setLevel] = useState<UserLevelData | null>(null)



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

  useEffect(() => {
    materialApi.limits().then(({ data }) => setMatLimits(data)).catch(() => {})
    levelApi.current().then(({ data }) => setLevel(data)).catch(() => {})
  }, [])

  const grade = level?.currentGrade || 'delta'
  const gradeMeta = GRADE_META[grade as keyof typeof GRADE_META]
  const versionInGrade = level ? (
    grade === 'delta' ? level.currentVersion
    : grade === 'beta' ? level.currentVersion - 3
    : level.currentVersion - 7
  ) : 1

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
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--acc), var(--r))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 22, flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {user?.firstName || user?.displayName || 'Foydalanuvchi'}
            </div>
            {(user?.email || user?.phone) && (
              <div style={{
                fontSize: 12, color: 'var(--txt-3)', marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.email || user.phone}
              </div>
            )}
            {level && (
              <div style={{
                marginTop: 6,
                display: 'inline-block',
                padding: '3px 9px',
                background: gradeMeta.bgColor,
                border: `1px solid ${gradeMeta.color}40`,
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                color: gradeMeta.color,
              }}>
                {gradeMeta.icon} {gradeMeta.name} {versionInGrade}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ilovani yuklab olish (Doimiy) */}
      <div style={{ padding: '12px 20px 0' }}>
        <button
          onClick={isInstalled ? undefined : installPwa}
          disabled={isInstalled || (!canInstall && !isInstalled)}
          style={{
            width: '100%',
            background: isInstalled
              ? 'rgba(0,212,170,0.1)'
              : 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(123,104,238,0.08))',
            border: isInstalled
              ? '1px solid rgba(0,212,170,0.15)'
              : '1px solid rgba(0,212,170,0.3)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            color: 'var(--txt)', cursor: isInstalled || !canInstall ? 'default' : 'pointer', textAlign: 'left',
            opacity: (!isInstalled && !canInstall) ? 0.6 : 1,
          }}
        >
          <div style={{ fontSize: 28 }}>{isInstalled ? '✅' : '📲'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--g)' }}>
              {isInstalled ? 'Ilova o\'rnatilgan' : 'Ilovani o\'rnatish'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
              {isInstalled
                ? 'Siz PWA ilovadan foydalanyapsiz'
                : 'Telefonga yuklab oling — tezroq ishlaydi'}
            </div>
          </div>
          {!isInstalled && canInstall && <div style={{ color: 'var(--g)', fontSize: 18, fontWeight: 800 }}>↓</div>}
        </button>
      </div>

      {/* Daraja statistikasi */}
      {level && (
        <>
          <div className="section-title">📊 Daraja statistikasi</div>
          <div style={{ padding: '0 20px' }}>
            <div style={{
              background: `linear-gradient(135deg, ${gradeMeta.bgColor}, transparent)`,
              border: `1px solid ${gradeMeta.color}40`,
              borderRadius: 14,
              padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: gradeMeta.bgColor,
                  border: `1px solid ${gradeMeta.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 28, color: gradeMeta.color,
                  flexShrink: 0,
                }}>{gradeMeta.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 18, color: gradeMeta.color }}>
                    {gradeMeta.name} {versionInGrade}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                    Versiya {level.currentVersion}/10 · Joriy oy
                  </div>
                </div>
              </div>

              {/* Keyingi daraja progress */}
              {!level.nextVersionInfo?.isMax && level.nextVersionInfo && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--txt-3)', marginBottom: 4 }}>
                    <span>Keyingi darajaga</span>
                    <span style={{ fontWeight: 700 }}>
                      {level.nextVersionInfo.currentAccuracy || 0}% / {level.nextVersionInfo.requiredAccuracy || 0}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--s2)', borderRadius: 100, marginBottom: 12 }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, ((level.nextVersionInfo.currentAccuracy || 0) / (level.nextVersionInfo.requiredAccuracy || 1)) * 100)}%`,
                      background: gradeMeta.color,
                      borderRadius: 100,
                    }} />
                  </div>
                </>
              )}

              {/* 3 ta ko'rsatkich */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <StatBox
                  label="Standart"
                  value={level.standardTests.total}
                  sub={level.standardTests.total > 0 ? `${Math.round(level.standardTests.correct / level.standardTests.total * 100)}%` : '—'}
                  color="#10b981"
                />
                <StatBox
                  label="AI testlar"
                  value={level.personalTests.total}
                  sub={level.personalTests.total > 0 ? `${Math.round(level.personalTests.correct / level.personalTests.total * 100)}%` : '—'}
                  color="#a78bfa"
                />
                <StatBox
                  label="Mini-test"
                  value={level.miniTests.total}
                  sub={level.miniTests.total > 0 ? `${Math.round(level.miniTests.correct / level.miniTests.total * 100)}%` : '—'}
                  color="#f59e0b"
                />
              </div>

              {/* Eslatma */}
              <div style={{
                marginTop: 12,
                padding: 10,
                background: 'rgba(123,104,238,0.06)',
                borderRadius: 8,
                fontSize: 10,
                color: 'var(--txt-3)',
                lineHeight: 1.5,
              }}>
                💡 Daraja har oy boshida nolga tushadi. Joriy oy: {level.currentMonth}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Obuna */}
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
                {isSub ? `${daysLeft} kun qoldi` : 'Imkoniyatlarni cheksiz oching'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--acc-l)', fontWeight: 700 }}>
              {isSub ? 'Uzaytirish ↗' : 'Obuna ↗'}
            </div>
          </div>
        </button>
      </div>

      {/* AI limitlar */}
      <div style={{ padding: '12px 20px 0' }}>
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }}>
            Bugungi AI limit
          </div>
          {[
            { key: 'hints',  name: '💡 Tushuntirish', limit: user?.aiLimits?.hints, used: user?.aiUsage?.hints },
            { key: 'chats',  name: '💬 Chat',         limit: user?.aiLimits?.chats, used: user?.aiUsage?.chats },
            { key: 'docs',   name: '📄 Hujjat',       limit: user?.aiLimits?.docs,  used: user?.aiUsage?.docs  },
            { key: 'images', name: '🎨 Rasm',         limit: user?.aiLimits?.images, used: user?.aiUsage?.images },
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

      {/* Material limitlar */}
      {matLimits && (
        <div style={{ padding: '12px 20px 0' }}>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: 'var(--txt-2)' }}>
              📚 Material limitlari (bugun)
            </div>
            {[
              { key: 'ocrUploads',  name: '📷 OCR rasm',  obj: matLimits.ocrUploads },
              { key: 'fileUploads', name: '📁 Fayl',      obj: matLimits.fileUploads },
              { key: 'testsGen',    name: '🤖 AI Test',   obj: matLimits.testsGen },
            ].map(item => {
              const limit = item.obj.limit
              const used = item.obj.used
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
                        background: pct >= 100 ? 'var(--r)' : 'var(--g)',
                        width: `${pct}%`,
                        borderRadius: 100,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  )}
                </div>
              )
            })}
            {matLimits.plan === 'free' && (
              <div style={{
                marginTop: 6,
                padding: 10,
                background: 'rgba(255,204,68,0.08)',
                border: '1px solid rgba(255,204,68,0.2)',
                borderRadius: 10,
                fontSize: 11,
                color: 'var(--txt-2)',
              }}>
                💡 Pro tarifda har fanga 20 ta material, kuniga 15 OCR va 12 fayl yuklash
              </div>
            )}
          </div>
        </div>
      )}

      {/* Akkount ma'lumotlari */}
      <div className="section-title">Akkount</div>
      <div style={{ padding: '0 20px 24px' }}>
        <div className="card">
          {user?.email && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
              borderBottom: user?.phone ? '1px solid var(--f)' : 'none',
            }}>
              <span style={{ fontSize: 18 }}>📧</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.3 }}>EMAIL</div>
                <div style={{ fontSize: 13, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
          {user?.phone && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0',
            }}>
              <span style={{ fontSize: 18 }}>📱</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.3 }}>TELEFON</div>
                <div style={{ fontSize: 13, color: 'var(--txt)' }}>{user.phone}</div>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            background: 'rgba(255,95,126,0.1)',
            border: '1px solid rgba(255,95,126,0.3)',
            color: 'var(--r)',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 18,
          }}
        >🚪 Chiqish</button>

        <div style={{ height: 30 }} />
      </div>

      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}

function StatBox({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  return (
    <div style={{
      background: 'var(--s2)',
      borderRadius: 10,
      padding: '10px 8px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--txt-3)', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 9, color: 'var(--txt-3)', marginTop: 1 }}>{sub}</div>
    </div>
  )
}
