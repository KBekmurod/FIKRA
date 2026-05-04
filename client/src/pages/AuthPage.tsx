import React, { useState } from 'react'
import { authApi } from '../api/endpoints'
import { setAuth } from '../api/client'
import { useAppStore } from '../store'
import { useToast } from '../components/Toast'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)

  const { refreshUser } = useAppStore()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        const { data } = await authApi.loginStandard(phone, password)
        setAuth(data.accessToken, data.refreshToken, data.user.telegramId || 0)
        await refreshUser()
      } else {
        const { data } = await authApi.register(phone, password, firstName, lastName)
        setAuth(data.accessToken, data.refreshToken, data.user.telegramId || 0)
        toast('Muvaffaqiyatli ro\'yxatdan o\'tingiz', 'ok')
        await refreshUser()
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Xatolik yuz berdi', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center' }}>
      <div className="card shadow-md">
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
          {isLogin ? 'Tizimga kirish' : 'Ro\'yxatdan o\'tish'}
        </h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <>
              <input 
                className="input" 
                placeholder="Ism" 
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
              <input 
                className="input" 
                placeholder="Familiya" 
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </>
          )}

          <input 
            className="input" 
            placeholder="Telefon raqam" 
            value={phone}
            onChange={e => setPhone(e.target.value)}
            type="tel"
            required
          />

          <input 
            className="input" 
            type="password"
            placeholder="Parol" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? 'Kutib turing...' : (isLogin ? 'Kirish' : 'Ro\'yxatdan o\'tish')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? 'Akkauntingiz yo\'qmi?' : 'Akkauntingiz bormi?'}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            style={{ background: 'none', border: 'none', color: 'var(--primary)', marginLeft: '5px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isLogin ? 'Ro\'yxatdan o\'tish' : 'Kirish'}
          </button>
        </p>
      </div>
    </div>
  )
}
