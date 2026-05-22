import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useToast } from '../../components/Toast'

// Identifier turini aniqlash (UI uchun)
function detectIdentifierType(s: string): 'email' | 'phone' | 'unknown' {
  const t = s.trim()
  if (!t) return 'unknown'
  if (t.includes('@')) return 'email'
  if (/^[+\d\s()-]+$/.test(t)) return 'phone'
  return 'unknown'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { login } = useAppStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const idType = detectIdentifierType(identifier)

  const submit = async () => {
    if (!identifier.trim() || !password) {
      toast.error("Email/telefon va parol kerak")
      return
    }
    setLoading(true)
    try {
      await login(identifier.trim(), password)
      navigate('/', { replace: true })
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Kirish xato")
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
      }}>Kirish</h1>
      <p style={{ fontSize: 13, color: 'var(--txt-2)', marginTop: 6 }}>
        Akkountingizga kiring
      </p>

      <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700 }}>
            EMAIL YOKI TELEFON NOMER
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="email@example.com  yoki  +998 90 123 45 67"
              autoComplete="username"
              disabled={loading}
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && submit()}
              inputMode={idType === 'phone' ? 'tel' : 'email'}
            />
            {identifier && (
              <div style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: 'var(--txt-3)', pointerEvents: 'none',
              }}>
                {idType === 'email' ? '📧' : idType === 'phone' ? '📱' : ''}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={{ fontSize: 11, color: 'var(--txt-2)', marginBottom: 4, display: 'block', fontWeight: 700 }}>
            PAROL
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              style={{ ...inputStyle, paddingRight: 44 }}
              onKeyDown={e => e.key === 'Enter' && submit()}
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
      >{loading ? '⏳ Kirilmoqda...' : 'Kirish →'}</button>

      {/* Parolni unutdim */}
      <button
        onClick={() => {
          const adminUser = (window as any).ADMIN_USERNAME || ''
          if (adminUser) {
            const url = `https://t.me/${adminUser}?text=${encodeURIComponent('Salom! Men FIKRA akkountimga kira olmayman, parolni unutdim. Yordam bering iltimos.')}`
            window.open(url, '_blank')
          } else {
            toast.info("Adminga murojaat qiling")
          }
        }}
        style={{
          marginTop: 12,
          background: 'none',
          border: 'none',
          color: 'var(--txt-3)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 8,
          textAlign: 'center',
        }}
      >Parolni unutdingizmi? Adminga murojaat</button>

      <div style={{ flex: 1 }} />

      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--txt-2)', marginTop: 16 }}>
        Hali akkountingiz yo'qmi?{' '}
        <button
          onClick={() => navigate('/auth/register')}
          style={{
            background: 'none', border: 'none', color: 'var(--acc-l)',
            fontWeight: 700, cursor: 'pointer', padding: 0, fontSize: 12,
          }}
        >Ro'yxatdan o'tish</button>
      </div>
    </div>
  )
}

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
