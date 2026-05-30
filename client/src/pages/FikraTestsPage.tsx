import { useNavigate } from 'react-router-dom'
import { useGoBack } from '../hooks/useGoBack'

export default function FikraTestsPage() {
  const navigate = useNavigate()
  const goBack = useGoBack('/testlar')

  return (
    <>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo" style={{ fontSize: 18 }}>🎓 FIKRA testlari</div>
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--txt-2)', margin: '4px 0 16px' }}>
          DTM standartiga ko'ra ikki xil rejim
        </p>

        <div className="tests-list">
          {/* B1) Maxsus blok testlar */}
          <button
            onClick={() => navigate('/testlar/fikra/blok')}
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.14), rgba(74,222,128,0.06))',
              border: '1.5px solid rgba(0,212,170,0.3)',
              borderRadius: 16,
              padding: '20px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              color: 'var(--txt)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 36 }}>🎯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--g)', marginBottom: 4 }}>
                Maxsus blok testlar
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5 }}>
                Majburiy 3 fan + Mutaxassislik 2 fan · Yo'nalish bo'yicha tayyor bloklar yoki alohida tanlov · <strong>189 ball</strong>
              </div>
            </div>
            <div style={{ fontSize: 20, color: 'var(--g)' }}>→</div>
          </button>

          {/* B2) Erkin tanlov */}
          <button
            onClick={() => navigate('/testlar/fikra/free')}
            style={{
              background: 'linear-gradient(135deg, rgba(123,104,238,0.14), rgba(167,139,250,0.06))',
              border: '1.5px solid rgba(123,104,238,0.3)',
              borderRadius: 16,
              padding: '20px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              cursor: 'pointer',
              color: 'var(--txt)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 36 }}>📚</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--acc-l)', marginBottom: 4 }}>
                Erkin tanlov
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.5 }}>
                Fanlarni o'zingiz tanlang — bittadan barchasigacha · Hohlagan kombinatsiya bilan test ishlang
              </div>
            </div>
            <div style={{ fontSize: 20, color: 'var(--acc-l)' }}>→</div>
          </button>
        </div>

        {/* Eslatma */}
        <div style={{
          marginTop: 18,
          padding: 12,
          background: 'rgba(255,204,68,0.08)',
          border: '1px solid rgba(255,204,68,0.2)',
          borderRadius: 12,
          fontSize: 11,
          color: 'var(--txt-2)',
          lineHeight: 1.5,
        }}>
          ⚠️ <strong>Diqqat:</strong> Test boshlangach to'liq tugatmasangiz, natija saqlanmaydi. Test ichidan chiqsangiz tarixga yozilmaydi.
        </div>
      </div>
    </>
  )
}
