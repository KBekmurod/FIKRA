import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useToast } from '../../components/Toast'
import { GoogleLogin } from '@react-oauth/google'

export default function WelcomePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { googleLogin } = useAppStore()
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ minHeight: '100vh', padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 56,
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(135deg, #fff, var(--acc-l))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}>FIKRA<span style={{ color: 'var(--acc)' }}>.</span></h1>

        <div style={{
          display: 'inline-block',
          padding: '5px 14px',
          background: 'rgba(123,104,238,0.15)',
          border: '1px solid rgba(123,104,238,0.3)',
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--acc-l)',
          marginTop: 14,
          letterSpacing: 0.5,
        }}>DTM TAYYORLIK PLATFORMASI</div>

        <p style={{
          fontSize: 14,
          color: 'var(--txt-2)',
          marginTop: 16,
          lineHeight: 1.55,
          maxWidth: 320,
          margin: '16px auto 0',
        }}>
          AI yordamida shaxsiy testlar yarating va DTM'ga
          <strong style={{ color: 'var(--txt)' }}> ishonchli tayyorgarlik </strong>
          ko'ring
        </p>
      </div>

      {/* Imkoniyatlar */}
      <div style={{ marginTop: 28, display: 'grid', gap: 8 }}>
        <FeatureItem icon="🏛" text="Konspekt, PDF, rasm — har biridan AI test" />
        <FeatureItem icon="🎓" text="DTM standart bloklarini ishlash" />
        <FeatureItem icon="🎯" text="Xatolaringizni AI tushuntiradi" />
        <FeatureItem icon="📊" text="Delta → Beta → Alfa darajalar" />
      </div>

      {/* Google bilan kirish */}
      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--txt-2)', fontSize: 14 }}>
            ⏳ Kirilmoqda...
          </div>
        ) : (
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              if (credentialResponse.credential) {
                setLoading(true)
                try {
                  await googleLogin(credentialResponse.credential)
                  navigate('/', { replace: true })
                } catch (e: any) {
                  toast.error(e?.response?.data?.error || "Google autentifikatsiyasida xatolik")
                } finally {
                  setLoading(false)
                }
              }
            }}
            onError={() => toast.error('Google bilan ulanishda xatolik')}
            theme="filled_black"
            shape="pill"
            text="continue_with"
            size="large"
          />
        )}
      </div>

      <div style={{
        marginTop: 14, marginBottom: 8,
        fontSize: 10, color: 'var(--txt-3)', textAlign: 'center',
        lineHeight: 1.5,
      }}>
        Davom etish orqali siz <strong>Foydalanish shartlari</strong>{' '}
        va <strong>Maxfiylik</strong> bilan rozisiz
      </div>
    </div>
  )
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      background: 'var(--s1)',
      border: '1px solid var(--f)',
      borderRadius: 12,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--txt-2)', lineHeight: 1.4 }}>{text}</span>
    </div>
  )
}
