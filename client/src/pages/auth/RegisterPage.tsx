import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useToast } from '../../components/Toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { register } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const submit = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Ism kerak (kamida 2 belgi)")
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email yaroqsiz")
      return
    }
    if (!password || password.length < 8) {
      toast.error("Parol kamida 8 belgi bo'lsin")
      return
    }
    if (password !== confirmPwd) {
      toast.error("Parollar mos kelmadi")
      return
    }

    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
      toast.success("Ro'yxatdan o'tildi!")
      navigate('/', { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Ro'yxatdan o'tishda xato")
    } finally {
      setLoading(false)
    }
  }

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
        Yangi akkount yarating
      </p>

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <div>
          <label style={fieldLabel}>ISM</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ismingiz"
            autoComplete="name"
            disabled={loading}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabel}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
            disabled={loading}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={fieldLabel}>PAROL (kamida 8 belgi)</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--txt-3)',
                cursor: 'pointer', fontSize: 14, padding: 4,
              }}
            >{showPwd ? '🙈' : '👁'}</button>
          </div>
        </div>

        <div>
          <label style={fieldLabel}>PAROL TASDIQI</label>
          <input
            type={showPwd ? "text" : "password"}
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={loading}
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        style={{
          marginTop: 20,
          background: 'linear-gradient(135deg, var(--acc), var(--acc-l))',
          color: 'white',
          border: 'none',
          borderRadius: 14,
          padding: '15px 18px',
          fontSize: 14,
          fontWeight: 800,
          cursor: loading ? 'wait' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >{loading ? "⏳ Yaratilmoqda..." : "Akkount yaratish →"}</button>

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

const fieldLabel = {
  fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700,
} as const

const inputStyle = {
  width: '100%',
  background: 'var(--s1)',
  border: '1px solid var(--f)',
  color: 'var(--txt)',
  borderRadius: 12,
  padding: '13px 14px',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
} as const
