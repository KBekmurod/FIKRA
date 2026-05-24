import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useToast } from '../../components/Toast'
import { GoogleLogin } from '@react-oauth/google'

export default function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { googleLogin } = useAppStore()
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ minHeight: '100vh', padding: '24px 24px', display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => navigate('/auth/welcome')}
        style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 12,
          alignSelf: 'flex-start',
        }}
      >←</button>

      <h1 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 32, fontWeight: 800, margin: 0,
      }}>Ro'yxatdan o'tish</h1>
      <p style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 6 }}>
        Platformaga ulanish uchun Google akkauntingizni tanlang. Parol va SMS kutilmaydi!
      </p>

      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {loading && <div style={{ color: 'var(--txt-2)', fontSize: 14 }}>⏳ Yaratilmoqda...</div>}
        
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (credentialResponse.credential) {
              setLoading(true)
              try {
                await googleLogin(credentialResponse.credential)
                toast.success("Muvaffaqiyatli kirildi!")
                navigate('/', { replace: true })
              } catch (e: any) {
                toast.error(e?.response?.data?.error || "Google bilan ulanishda xato")
              } finally {
                setLoading(false)
              }
            }
          }}
          onError={() => toast.error('Google bilan ulanishda xatolik')}
          theme="filled_black"
          shape="pill"
          text="continue_with"
        />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', marginTop: 16 }}>
        Akkountingiz bormi?{' '}
        <button
          onClick={() => navigate('/auth/login')}
          style={{
            background: 'none', border: 'none', color: 'var(--acc-l)',
            fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12,
          }}
        >Kirish</button>
      </div>
    </div>
  )
}

