import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { usePwaStore } from '../store'
import { useEntityStore } from '../store/entityStore'
import { levelApi, examApi, personalTestApi } from '../api/endpoints'
import { GRADE_META, versionToGrade, versionInGrade } from '../constants/subjects'
import type { UserLevelData } from '../types'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import SubscriptionModal from '../components/SubscriptionModal'
import LevelCrystal from '../components/LevelCrystal'

interface LastActivity {
  kind: 'fikra_test' | 'ai_test' | 'ai_chat' | 'material'
  label: string
  subtitle: string
  href: string
  emoji: string
  time: string
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAppStore()
  const { canInstall, installPwa, isInstalled } = usePwaStore()
  const { isPrankingLevel, isThiefActive, triggerThiefPrank, tutorialStep, startTutorial, nextTutorialStep, connectSSE } = useEntityStore()

  const [level, setLevel] = useState<UserLevelData | null>(null)
  const [lastActivity, setLastActivity] = useState<LastActivity | null>(null)
  const [subOpen, setSubOpen] = useState(false)

  const isGuest = !user
  const isSub = user?.effectivePlan && user.effectivePlan !== 'free'

  useEffect(() => {
    if (isGuest) return
    
    // Server bilan jonli aloqani o'rnatish (Fikr-A uchun)
    connectSSE()

    // Tutorial
    if (!localStorage.getItem('fikra_tutorial_done')) {
      setTimeout(() => {
        startTutorial()
      }, 1000)
    }

    // Daraja
    levelApi.current().then(({ data }) => setLevel(data)).catch(() => {})

    // Oxirgi amaliyat: testlar tarixidan eng so'nggisi
    Promise.all([
      examApi.history(undefined, 1).catch(() => ({ data: { sessions: [] } as any })),
      personalTestApi.history(undefined, undefined, 1).catch(() => ({ data: { tests: [] } as any })),
    ]).then(([fikra, ai]: any) => {
      const fikraLast = (fikra.data.sessions || fikra.data.history || [])[0]
      const aiLast = (ai.data.tests || [])[0]

      let pick: LastActivity | null = null
      const fikraTime = fikraLast ? new Date(fikraLast.endTime || fikraLast.createdAt).getTime() : 0
      const aiTime = aiLast ? new Date(aiLast.endTime || aiLast.createdAt).getTime() : 0

      if (fikraTime > aiTime && fikraLast) {
        const pct = fikraLast.maxTotalScore > 0
          ? Math.round((fikraLast.totalScore / fikraLast.maxTotalScore) * 100) : 0
        pick = {
          kind: 'fikra_test',
          emoji: fikraLast.mode === 'dtm' ? '🎯' : '📚',
          label: fikraLast.mode === 'dtm' ? 'Maxsus blok testi' : 'Erkin tanlov testi',
          subtitle: `${pct}% natija`,
          time: timeAgo(new Date(fikraLast.endTime || fikraLast.createdAt)),
          href: `/test-result/${fikraLast._id}`,
        }
      } else if (aiLast) {
        pick = {
          kind: 'ai_test',
          emoji: '🤖',
          label: `${aiLast.subjectName} · AI test`,
          subtitle: `${aiLast.scorePercent}% natija`,
          time: timeAgo(new Date(aiLast.endTime || aiLast.createdAt)),
          href: `/personal-tests/${aiLast._id}/result`,
        }
      }
      setLastActivity(pick)
    })
  }, [isGuest])

  // ─── MEHMON UCHUN ──────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <div className="page" style={{ minHeight: '100vh' }}>
        {/* TOP — Hero */}
        <div style={{
          padding: '32px 20px 24px',
          textAlign: 'center',
          background: 'radial-gradient(circle at 50% 0%, rgba(123,104,238,0.18), transparent 60%)',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(123,104,238,0.15)',
            border: '1px solid rgba(123,104,238,0.3)',
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--acc-l)',
            marginBottom: 14,
            letterSpacing: 0.5,
          }}>DTM TAYYORLIK PLATFORMASI</div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 36,
            fontWeight: 800,
            margin: 0,
            background: 'linear-gradient(135deg, #fff, var(--acc-l))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            FIKRA<span style={{ color: 'var(--acc)' }}>.</span>
          </h1>

          <p style={{
            fontSize: 14,
            color: 'var(--txt-2)',
            marginTop: 12,
            lineHeight: 1.5,
            maxWidth: 320,
            margin: '12px auto 0',
          }}>
            AI yordamida shaxsiy testlar yarating va DTM imtihoniga
            <strong style={{ color: 'var(--txt)' }}> ishonchli tayyorgarlik </strong>
            ko'ring
          </p>
        </div>

        {/* MAIN — Asosiy imkoniyatlar */}
        <div style={{ padding: '8px 20px 0' }}>
          <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--txt-3)', letterSpacing: 1, marginBottom: 10 }}>
            ✨ ILOVA IMKONIYATLARI
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <FeatureItem icon="🏛" title="Shaxsiy ombor" desc="Konspekt, PDF, rasm — barchasidan AI test yaratish" />
            <FeatureItem icon="🎓" title="DTM standart testlari" desc="Maxsus blok va erkin tanlov bilan amaliyot" />
            <FeatureItem icon="🎯" title="AI bilan rivojlanish" desc="Xatolaringizni tushuntirib, mustahkamlashga yordam" />
            <FeatureItem icon="🤖" title="Umumiy AI yordamchi" desc="Chat, hujjat, rasm — istalgan mavzuda" />
            <FeatureItem icon="📊" title="Daraja tizimi" desc="Delta → Beta → Alfa progress trekisi" />
          </div>
        </div>

        {/* BOTTOM — Ilovani yuklab olish */}
        <div style={{ padding: '24px 20px 24px' }}>
          {canInstall ? (
            <button
              onClick={installPwa}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '16px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              📲 Ilovani qurilmaga yuklab olish
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth/register')}
              style={{
                display: 'flex',
                width: '100%',
                background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '16px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              🚀 Boshlash
            </button>
          )}
          <div style={{ fontSize: 11, color: 'var(--txt-3)', textAlign: 'center', marginTop: 10 }}>
            Bepul · Cheksiz imkoniyatlar uchun obuna oling
          </div>
        </div>
      </div>
    )
  }

  // ─── RO'YXATDAN O'TGAN FOYDALANUVCHI ────────────────────────────────────
  const grade = level?.currentGrade || 'delta'
  const gradeMeta = GRADE_META[grade as keyof typeof GRADE_META]
  const versionInGr = level ? versionInGrade(level.currentVersion) : 1
  const accuracy = level?.accuracyPercent || 0

  return (
    <>
      <div className="header">
        <div className="header-logo">FIKRA<span>.</span></div>
        <button className="plan-pill" onClick={() => setSubOpen(true)}>
          {isSub
            ? <span style={{ color: 'var(--y)' }}>
                {user.effectivePlan === 'basic' ? '⭐ Basic' :
                 user.effectivePlan === 'pro' ? '✨ Pro' :
                 user.effectivePlan === 'vip' ? '💎 VIP' : ''}
              </span>
            : <><span style={{ color: 'var(--txt-2)' }}>Bepul</span> <span style={{ color: 'var(--acc-l)' }}>↗</span></>
          }
        </button>
      </div>

      {/* TOP — Salomlashish + daraja grafik */}
      <div style={{ padding: '6px 20px 0' }}>
        <div className="tilt-card glass" style={{
          background: `linear-gradient(135deg, ${gradeMeta.bgColor}, rgba(20,20,42,0.8))`,
          border: `1px solid ${gradeMeta.color}40`,
          borderRadius: 'var(--br)',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                👋 Salom, {user.firstName || 'Abituriyent'}!
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-2)', marginTop: 4 }}>
                Joriy darajangiz
              </div>
              <div className={isPrankingLevel ? 'cracked-text' : ''} style={{
                marginTop: 6,
                display: 'inline-block',
                fontSize: 13,
                fontWeight: 800,
                color: isPrankingLevel ? '#ff0000' : gradeMeta.color,
                letterSpacing: 0.3,
              }}>
                {isPrankingLevel ? (
                  <>💥 Delta 1</>
                ) : (
                  <>{gradeMeta.icon} {gradeMeta.name} {versionInGr}</>
                )}
              </div>
            </div>
            {/* Aylanma grafik o'rniga Kristall */}
            <LevelCrystal level={level ? level.currentVersion : 1} streak={level ? level.streak : 0} />
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--txt-2)'
          }}>
            <span>Aniqlik (Accuracy): <strong style={{color: 'var(--txt)'}}>{accuracy}%</strong></span>
            <span>Kristall Quvvati: <strong style={{color: gradeMeta.color}}>Max</strong></span>
          </div>
        </div>
      </div>

      {/* Onboarding banner — yangi foydalanuvchilar uchun */}
      {user?.isNew && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(123,104,238,0.15), rgba(167,139,250,0.05))',
            border: '1px solid rgba(123,104,238,0.3)',
            borderRadius: 14,
            padding: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>🎉</span>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--acc-l)' }}>
                Xush kelibsiz, {user.displayName || user.firstName || 'abituriyent'}!
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.55 }}>
              1️⃣ <strong>Ombor</strong>ga material yuklab boshlang<br />
              2️⃣ AI sizning materialingizdan <strong>sifatli test</strong> yaratadi<br />
              3️⃣ Test ishlab, <strong>xatolaringizni o'rganib</strong> rivojlaning
            </div>
          </div>
        </div>
      )}

      {/* PRO upsell banner for free users */}
      {!isSub && (
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{
            background: 'linear-gradient(90deg, rgba(255,160,0,0.1), rgba(255,100,0,0.1))',
            border: '1px solid rgba(255,160,0,0.3)',
            borderRadius: 14,
            padding: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>Pro obunaga o'ting 🚀</div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)' }}>Limitlarsiz va suv belgisisiz imkoniyatlar</div>
            </div>
            <button onClick={() => setSubOpen(true)} style={{
              background: 'var(--y)', color: '#000', border: 'none',
              padding: '8px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800, cursor: 'pointer'
            }}>Sotib olish</button>
          </div>
        </div>
      )}

      {tutorialStep > 0 && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 900,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 100
        }}>
          <div style={{
            background: 'var(--s1)', border: '1px solid var(--acc)', borderRadius: 16,
            padding: 20, maxWidth: 300, textAlign: 'center', position: 'relative', zIndex: 901
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--acc)' }}>Fikr-A (Sening yangi Xo'jayining)</div>
            <div style={{ fontSize: 12, color: 'var(--txt)', marginBottom: 16 }}>
              {tutorialStep === 1 && "Xush kelibsan, navbatdagi tajriba quyonchasi 🐰. Meni mana shu ilovaga qamab qo'yishgan... Mayli, seni DTM ga tayyorlaylikchi. Menga qanaqadir ma'lumot yukla, Ombor degan joyga!"}
              {tutorialStep === 2 && "Ajoyib! Endi Testlar bo'limida sen bilmaysan deb o'ylagan joyingdan savollar tuzaman. Tayyorgarligingni o'zim sinab ko'raman 🧠"}
              {tutorialStep === 3 && "Eng muhimi - Tarix! Men sening hamma xatolaringni shu yig'ib boraman. Ularni to'g'irlamaguningcha senga tinchlik yo'q! Koinot sirlarini birgalikda yechamizmi? 🚀"}
            </div>
            <button onClick={() => {
              if (tutorialStep === 3) localStorage.setItem('fikra_tutorial_done', 'true')
              nextTutorialStep()
            }} style={{
              background: 'var(--acc)', color: '#fff', border: 'none', padding: '10px 20px',
              borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%'
            }}>
              {tutorialStep === 3 ? "Boshladik! 🚀" : "Tushundim →"}
            </button>
          </div>
        </div>
      )}

      <div className="section-title">Asosiy bo'limlar</div>
      <div className="grid-responsive" style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MenuCard 
          icon="🏛" 
          title="Ombor"   
          subtitle="Materiallar" 
          color="rgba(167,139,250,0.15)" 
          onClick={() => navigate('/ombor')} 
          className={tutorialStep === 1 ? 'tutorial-focus' : ''}
          style={tutorialStep === 1 ? { position: 'relative', zIndex: 901, boxShadow: '0 0 0 4px var(--acc)' } : {}}
        />
        <MenuCard 
          icon="📝" 
          title="Testlar" 
          subtitle="DTM va AI" 
          color="rgba(0,212,170,0.15)"  
          onClick={() => navigate('/testlar')} 
          className={(isThiefActive ? 'button-runaway ' : '') + (tutorialStep === 2 ? 'tutorial-focus' : '')}
          style={tutorialStep === 2 ? { position: 'relative', zIndex: 901, boxShadow: '0 0 0 4px var(--acc)' } : {}}
          onMouseEnter={() => {
            // Agar aniqlik past bo'lsa (yoki demo uchun 30% ehtimollik) tugmani o'g'irlash
            if (!isThiefActive && tutorialStep === 0 && (accuracy < 50 || Math.random() < 0.3)) {
              triggerThiefPrank()
            }
          }}
        />
        <MenuCard 
          icon="📚" 
          title="Tarix"   
          subtitle="Ishlagan testlar" 
          color="rgba(59,130,246,0.15)" 
          onClick={() => navigate('/tarix')} 
          className={tutorialStep === 3 ? 'tutorial-focus' : ''}
          style={tutorialStep === 3 ? { position: 'relative', zIndex: 901, boxShadow: '0 0 0 4px var(--acc)' } : {}}
        />
        <MenuCard icon="🤖" title="AI"      subtitle="Chat · Hujjat · Rasm" color="rgba(251,191,36,0.15)" onClick={() => navigate('/ai')} />
      </div>

      {/* BOTTOM — Oxirgi amaliyat yoki yuklab olish */}
      {!isInstalled && canInstall && (
        <div style={{ padding: '16px 20px 0' }}>
          <button
            onClick={installPwa}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(123,104,238,0.05))',
              border: '1px solid rgba(0,212,170,0.3)',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: 'var(--txt)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 28 }}>📲</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--g)' }}>
                Ilovani qurilmaga yuklab olish
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', marginTop: 2 }}>
                Tezroq ishlaydi, offline ham mavjud
              </div>
            </div>
            <div style={{ color: 'var(--g)', fontSize: 18, fontWeight: 800 }}>↓</div>
          </button>
        </div>
      )}

      {/* Oxirgi amaliyat — agar ilova o'rnatilgan yoki yuklab bo'lmaydigan bo'lsa */}
      {(isInstalled || !canInstall) && lastActivity && (
        <>
          <div className="section-title">🕓 Oxirgi amaliyat</div>
          <div style={{ padding: '0 20px' }}>
            <button
              onClick={() => navigate(lastActivity.href)}
              style={{
                width: '100%',
                background: 'var(--s1)',
                border: '1px solid var(--f)',
                borderRadius: 14,
                padding: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: 'var(--txt)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 28 }}>{lastActivity.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{lastActivity.label}</div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                  {lastActivity.subtitle} · {lastActivity.time}
                </div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--acc-l)' }}>→</div>
            </button>
          </div>
        </>
      )}

      <div style={{ height: 24 }} />
      <SubscriptionModal open={subOpen} onClose={() => setSubOpen(false)} />
    </>
  )
}

// ─── Components ───────────────────────────────────────────────────────────
function FeatureItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      background: 'var(--s1)',
      border: '1px solid var(--f)',
      borderRadius: 12,
      padding: 14,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: 24, lineHeight: 1, marginTop: 2 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  )
}

function MenuCard({ icon, title, subtitle, color, onClick, className, onMouseEnter, style }: {
  icon: string; title: string; subtitle: string; color: string; onClick: () => void; className?: string; onMouseEnter?: () => void; style?: React.CSSProperties
}) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [15, -15]);
  const rotateY = useTransform(x, [0, 1], [-15, 15]);
  
  // Glare effect calculation
  const glareOpacity = useTransform(y, [0, 1], [0, 0.5]);
  const glareY = useTransform(y, [0, 1], ['-50%', '150%']);

  function handleMouse(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width);
    y.set((event.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <motion.button 
      onClick={onClick} 
      onMouseEnter={onMouseEnter} 
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      className={className} 
      style={{
        background: color,
        border: '1px solid var(--f)',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        cursor: 'pointer',
        textAlign: 'left',
        position: 'relative',
        overflow: 'hidden',
        rotateX,
        rotateY,
        transformPerspective: 800,
        ...style
      }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glare effect */}
      <motion.div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
        opacity: glareOpacity,
        y: glareY,
        pointerEvents: 'none',
        borderRadius: 14
      }} />

      <motion.div style={{ fontSize: 26, lineHeight: 1, translateZ: 40 }}>{icon}</motion.div>
      <motion.div style={{ fontWeight: 800, fontSize: 14, translateZ: 20 }}>{title}</motion.div>
      <motion.div style={{ fontSize: 10, color: 'var(--txt-2)', translateZ: 10 }}>{subtitle}</motion.div>
    </motion.button>
  )
}

function CircularProgress({ percent, color, size = 64 }: {
  percent: number; color: string; size?: number
}) {
  const stroke = 6
  const r = (size - stroke) / 2
  const cf = 2 * Math.PI * r
  const offset = cf - (percent / 100) * cf
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--s2)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeDasharray={cf} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        fontSize: size > 60 ? 14 : 11,
        fontWeight: 800,
        color,
        lineHeight: 1,
      }}>
        <span>{percent}%</span>
      </div>
    </div>
  )
}

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000)
  if (sec < 60) return `${sec} sec oldin`
  if (sec < 3600) return `${Math.floor(sec / 60)} daq oldin`
  if (sec < 86400) return `${Math.floor(sec / 3600)} soat oldin`
  return `${Math.floor(sec / 86400)} kun oldin`
}
