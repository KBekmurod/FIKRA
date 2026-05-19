import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useToast } from '../../components/Toast'

export default function WelcomePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { loginWithGoogle, loginWithTelegram } = useAppStore()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [tgLoading, setTgLoading] = useState(false)
  const [googleSdkReady, setGoogleSdkReady] = useState(false)

  // Telegram WebApp mavjudligini aniqlash
  const isTelegram = !!(window as any).Telegram?.WebApp?.initData
  const googleClientId = (window as any).GOOGLE_CLIENT_ID || ''

  useEffect(() => {
    if (!googleClientId) return
    // Google Identity Services skriptini yuklash
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => setGoogleSdkReady(true)
      document.head.appendChild(s)
    } else {
      setGoogleSdkReady(true)
    }
  }, [googleClientId])

  // Google Sign-In tugmasi
  const handleGoogleClick = () => {
    if (!googleClientId) {
      toast.error('Google kirish hozircha sozlanmagan')
      return
    }
    if (!googleSdkReady || !(window as any).google) {
      toast.error('Google SDK yuklanmoqda...')
      return
    }
    setGoogleLoading(true)
    try {
      const goog = (window as any).google
      goog.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          try {
            await loginWithGoogle(response.credential)
            navigate('/', { replace: true })
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Google kirish xato')
          } finally {
            setGoogleLoading(false)
          }
        },
      })
      goog.accounts.id.prompt()
    } catch (e) {
      toast.error('Google kirish xato')
      setGoogleLoading(false)
    }
  }

  const handleTelegramLogin = async () => {
    setTgLoading(true)
    try {
      await loginWithTelegram()
      navigate('/', { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Telegram kirish xato')
    } finally {
      setTgLoading(false)
    }
  }

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

      <div style={{ flex: 1 }} />

      {/* Auth tugmalari */}
      <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
        {/* Telegram'da bo'lsa, eng yuqorida darrov ko'rsatamiz (qulay) */}
        {isTelegram && (
          <>
            <button
              onClick={handleTelegramLogin}
              disabled={tgLoading}
              style={{
                background: 'linear-gradient(135deg, #5fb3ec, #4a9dde)',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                padding: '15px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                opacity: tgLoading ? 0.6 : 1,
              }}
            >
              {tgLoading ? '⏳ Kirilmoqda...' : '✈️ Telegram bilan davom etish'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--f)' }} />
              <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5 }}>YOKI</span>
              <div style={{ flex: 1, height: 1, background: 'var(--f)' }} />
            </div>
          </>
        )}

        <button
          onClick={() => navigate('/auth/register')}
          style={{
            background: isTelegram
              ? 'var(--s1)'
              : 'linear-gradient(135deg, var(--acc), var(--acc-l))',
            color: isTelegram ? 'var(--txt)' : 'white',
            border: isTelegram ? '1px solid var(--f)' : 'none',
            borderRadius: 14,
            padding: '15px 18px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >📧 Email bilan ro'yxatdan o'tish</button>

        <button
          onClick={() => navigate('/auth/login')}
          style={{
            background: 'var(--s1)',
            color: 'var(--txt)',
            border: '1px solid var(--f)',
            borderRadius: 14,
            padding: '15px 18px',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >Mavjud akkountga kirish</button>

        {/* Google va Telegram (pastki qism — agar Telegram'da emas bo'lsa) */}
        {googleClientId && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--f)' }} />
              <span style={{ fontSize: 10, color: 'var(--txt-3)', fontWeight: 700, letterSpacing: 0.5 }}>YOKI</span>
              <div style={{ flex: 1, height: 1, background: 'var(--f)' }} />
            </div>

            <button
              onClick={handleGoogleClick}
              disabled={googleLoading}
              style={{
              background: 'white',
              color: '#1f1f1f',
              border: '1px solid #dadce0',
              borderRadius: 14,
              padding: '13px 18px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: googleLoading ? 0.6 : 1,
            }}
          >
            <GoogleIcon />
            {googleLoading ? "Kirilmoqda..." : "Google bilan davom etish"}
          </button>
          </>
        )}
      </div>

      <div style={{
        marginTop: 14, marginBottom: 8,
        fontSize: 10, color: 'var(--txt-3)', textAlign: 'center',
        lineHeight: 1.5,
      }}>
        Ro'yxatdan o'tib siz <strong>Foydalanish shartlari</strong>{' '}
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
