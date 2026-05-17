import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { examApi } from '../api/endpoints'
import { useToast } from '../components/Toast'

// PDF mind-mapdagi tayyor yo'nalish bloklari
const DIRECTION_BLOCKS = [
  {
    id: 'engineering',
    name: 'Muhandislik · Texnologiya',
    icon: '⚙️',
    subjects: [
      { id: 'math', name: 'Matematika' },
      { id: 'fizika', name: 'Fizika' },
    ],
  },
  {
    id: 'medicine',
    name: 'Tibbiyot · Q-xo\'jaligi',
    icon: '🏥',
    subjects: [
      { id: 'bio', name: 'Biologiya' },
      { id: 'kimyo', name: 'Kimyo' },
    ],
  },
  {
    id: 'international',
    name: 'Xalqaro · Turizm',
    icon: '🌍',
    subjects: [
      { id: 'tarix', name: 'Tarix' },
      { id: 'ingliz', name: 'Chet tili' },
    ],
  },
  {
    id: 'philology',
    name: 'Filologiya',
    icon: '📖',
    subjects: [
      { id: 'adab', name: 'Ona tili va adabiyot' },
      { id: 'ingliz', name: 'Chet tili' },
    ],
  },
  {
    id: 'economy',
    name: "Iqtisod · IT",
    icon: '💰',
    subjects: [
      { id: 'math', name: 'Matematika' },
      { id: 'ingliz', name: 'Chet tili' },
    ],
  },
  {
    id: 'geodesy',
    name: 'Geodeziya · Kadastr',
    icon: '🗺',
    subjects: [
      { id: 'tarix', name: 'Tarix' },
      { id: 'geo', name: 'Geografiya' },
    ],
  },
]

// Alohida tanlov uchun barcha mutaxassislik fanlari
const SPEC_SUBJECTS = [
  { id: 'math',    name: 'Matematika',   icon: '🔢' },
  { id: 'fizika',  name: 'Fizika',       icon: '⚛' },
  { id: 'kimyo',   name: 'Kimyo',        icon: '⚗' },
  { id: 'bio',     name: 'Biologiya',    icon: '🧬' },
  { id: 'geo',     name: 'Geografiya',   icon: '🌍' },
  { id: 'tarix',   name: 'Tarix',        icon: '🏛' },
  { id: 'adab',    name: 'Adabiyot',     icon: '📖' },
  { id: 'ingliz',  name: 'Ingliz tili',  icon: '🇬🇧' },
  { id: 'rus',     name: 'Rus tili',     icon: '🇷🇺' },
  { id: 'inform',  name: 'Informatika',  icon: '💻' },
  { id: 'iqtisod', name: 'Iqtisodiyot',  icon: '💰' },
]

type Mode = 'block' | 'custom'

export default function BlokTestSetupPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('block')
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [customSubjects, setCustomSubjects] = useState<string[]>([])
  const [starting, setStarting] = useState(false)

  const toggleCustom = (id: string) => {
    setCustomSubjects(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 2) {
        toast.info('Faqat 2 ta fan tanlash mumkin')
        return prev
      }
      return [...prev, id]
    })
  }

  const startTest = async () => {
    setStarting(true)
    try {
      // Maxsus blok testida majburiy 3 fan + 2 mutaxassislik
      // Backend `/api/exams/start-dtm` endpointi shuni ta'minlaydi
      let direction: string
      let selectedIds: string[]

      if (mode === 'block') {
        if (!selectedBlock) {
          toast.error('Yo\'nalish tanlang')
          setStarting(false)
          return
        }
        const blk = DIRECTION_BLOCKS.find(b => b.id === selectedBlock)!
        selectedIds = blk.subjects.map(s => s.id)
        direction = selectedBlock
      } else {
        if (customSubjects.length !== 2) {
          toast.error('Aniq 2 ta mutaxassislik tanlang')
          setStarting(false)
          return
        }
        selectedIds = customSubjects
        direction = `custom_${customSubjects.join('_')}`
      }

      const { data } = await examApi.startDtm(direction)
      navigate(`/test-run/${data.sessionId}`, {
        state: { mode: 'blok', ...data },
      })
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Test boshlashda xatolik')
    } finally {
      setStarting(false)
    }
  }

  const canStart = mode === 'block' ? !!selectedBlock : customSubjects.length === 2

  return (
    <>
      <div className="header">
        <button onClick={() => navigate('/testlar/fikra')} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>🎯 Maxsus blok</div>
      </div>

      <div style={{ padding: '8px 20px 24px' }}>
        {/* Majburiy blok info */}
        <div style={{
          background: 'rgba(0,212,170,0.08)',
          border: '1px solid rgba(0,212,170,0.25)',
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: 'var(--g)', fontWeight: 800, marginBottom: 8, letterSpacing: 0.5 }}>
            📌 MAJBURIY BLOK (avtomatik)
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--txt-2)' }}>
            • Ona tili (10 savol · 1.1 ball){' '}<br />
            • Matematika (10 savol · 1.1 ball)<br />
            • O'zbekiston tarixi (10 savol · 1.1 ball)
          </div>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--g)' }}>
            Jami: 33 ball
          </div>
        </div>

        {/* Mutaxassislik tanlash */}
        <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--txt-2)', letterSpacing: 0.5, marginBottom: 10 }}>
          ⭐ MUTAXASSISLIKNI TANLANG (2 ta)
        </div>

        {/* Mode tanlash */}
        <div className="seg-tabs" style={{ marginBottom: 12 }}>
          <button
            className={`seg-tab ${mode === 'block' ? 'active' : ''}`}
            onClick={() => setMode('block')}
          >Tayyor yo'nalish</button>
          <button
            className={`seg-tab ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => setMode('custom')}
          >Alohida 2 fan</button>
        </div>

        {mode === 'block' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {DIRECTION_BLOCKS.map(b => {
              const active = selectedBlock === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBlock(b.id)}
                  style={{
                    background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
                    border: `1.5px solid ${active ? 'var(--acc-l)' : 'var(--f)'}`,
                    borderRadius: 12,
                    padding: '14px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    color: 'var(--txt)',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 22 }}>{b.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>
                      {b.subjects.map(s => s.name).join(' + ')}
                    </div>
                  </div>
                  {active && <div style={{ color: 'var(--acc-l)', fontSize: 18 }}>✓</div>}
                </button>
              )
            })}
          </div>
        )}

        {mode === 'custom' && (
          <>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 8 }}>
              Tanlangan: {customSubjects.length}/2
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SPEC_SUBJECTS.map(s => {
                const active = customSubjects.includes(s.id)
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleCustom(s.id)}
                    style={{
                      background: active ? 'rgba(123,104,238,0.15)' : 'var(--s1)',
                      border: `1.5px solid ${active ? 'var(--acc-l)' : 'var(--f)'}`,
                      borderRadius: 12,
                      padding: '12px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      color: 'var(--txt)',
                    }}
                  >
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{s.name}</div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Ball hisoblash */}
        <div style={{
          marginTop: 14,
          padding: 12,
          background: 'var(--s1)',
          border: '1px solid var(--f)',
          borderRadius: 10,
          fontSize: 11,
          color: 'var(--txt-2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span>1-mutaxassislik (30 savol)</span>
            <span style={{ fontWeight: 700 }}>3.1 × 30 = 93 ball</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>2-mutaxassislik (30 savol)</span>
            <span style={{ fontWeight: 700 }}>2.1 × 30 = 63 ball</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 6,
            borderTop: '1px solid var(--f)',
            fontWeight: 800,
            color: 'var(--txt)',
            fontSize: 13,
          }}>
            <span>JAMI</span>
            <span style={{ color: 'var(--g)' }}>189 ball</span>
          </div>
        </div>

        {/* Start tugma */}
        <button
          onClick={startTest}
          disabled={!canStart || starting}
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 16, opacity: canStart ? 1 : 0.5 }}
        >
          {starting ? '⏳ Boshlanmoqda...' : 'TESTNI BOSHLASH →'}
        </button>
      </div>
    </>
  )
}
