import { useNavigate } from 'react-router-dom'
import { useGoBack } from '../hooks/useGoBack'

export default function AiTestsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/testlar')

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 16 }}>🤖 AI testlarim</div>
      </div>

      <div style={{ padding: '6px 20px 0' }}>
        <p style={{ fontSize: 12, color: 'var(--txt-2)', marginBottom: 16 }}>
          O'z materiallaringizdan DTM standart bo'yicha test yarating
        </p>

        {/* 3 ta rejim */}
        <div style={{ display: 'grid', gap: 12 }}>

          {/* 1. Papka testlari (1 papka = 1 test) */}
          <button
            onClick={() => navigate('/testlar/ai/papkalar')}
            style={cardStyle('rgba(0,212,170,0.25)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={iconCircle('rgba(0,212,170,0.15)')}>📁</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={titleStyle('var(--g)')}>Papka testlari</div>
                <div style={descStyle()}>
                  Har papka uchun alohida test (10 yoki 30 savol)
                </div>
              </div>
              <div style={arrowStyle()}>→</div>
            </div>
          </button>

          {/* 2. Maxsus blok (DTM standart) */}
          <button
            onClick={() => navigate('/testlar/ai/blok')}
            style={cardStyle('rgba(123,104,238,0.3)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={iconCircle('rgba(123,104,238,0.15)')}>📦</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={titleStyle('var(--acc-l)')}>Maxsus blok testi</div>
                <div style={descStyle()}>
                  DTM yo'nalish bo'yicha · 90 savol · 189 ball
                </div>
              </div>
              <div style={arrowStyle()}>→</div>
            </div>
          </button>

          {/* 3. Erkin tanlov */}
          <button
            onClick={() => navigate('/testlar/ai/erkin')}
            style={cardStyle('rgba(255,204,68,0.3)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={iconCircle('rgba(255,204,68,0.15)')}>🎯</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={titleStyle('var(--y)')}>Erkin tanlov</div>
                <div style={descStyle()}>
                  2-5 fan va papkalar tanlang · har biri uchun savol soni
                </div>
              </div>
              <div style={arrowStyle()}>→</div>
            </div>
          </button>
        </div>

        {/* Ko'rsatma */}
        <div style={{
          marginTop: 18,
          padding: 12,
          background: 'rgba(123,104,238,0.06)',
          border: '1px solid rgba(123,104,238,0.18)',
          borderRadius: 10,
          fontSize: 11,
          color: 'var(--txt-2)',
          lineHeight: 1.55,
        }}>
          💡 <strong>Eslatma:</strong> Test yaratish uchun avval{' '}
          <strong>🏛 Ombor</strong>ga material yuklang. Yetarli material bo'lsa,
          AI sizning materialingizdan sifatli test savol yaratadi.
        </div>

        <div style={{ height: 30 }} />
      </div>
    </>
  )
}

function cardStyle(borderColor: string) {
  return {
    background: 'var(--s1)',
    border: `1.5px solid ${borderColor}`,
    borderRadius: 14,
    padding: 16,
    cursor: 'pointer',
    color: 'var(--txt)',
    width: '100%',
  }
}

function iconCircle(bg: string) {
  return {
    width: 48, height: 48, borderRadius: 14,
    background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, flexShrink: 0,
  } as const
}

function titleStyle(color: string) {
  return { fontWeight: 800, fontSize: 14, color, marginBottom: 3 } as const
}

function descStyle() {
  return { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.4 } as const
}

function arrowStyle() {
  return { color: 'var(--txt-3)', fontSize: 18, flexShrink: 0 } as const
}
