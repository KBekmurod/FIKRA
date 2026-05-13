import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ToastContext {
  toast: (msg: string, type?: 'info' | 'ok' | 'err') => void
  success: (msg: string) => void
  error: (msg: string) => void
  info: (msg: string) => void
}

const Ctx = createContext<ToastContext>({
  toast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; type: string } | null>(null)

  const toast = useCallback((text: string, type: 'info' | 'ok' | 'err' = 'info') => {
    setMsg({ text, type })
    try {
      const tg = (window as any).Telegram?.WebApp
      if (type === 'ok') tg?.HapticFeedback?.notificationOccurred('success')
      else if (type === 'err') tg?.HapticFeedback?.notificationOccurred('error')
    } catch {}
    setTimeout(() => setMsg(null), 3000)
  }, [])

  const success = useCallback((text: string) => toast(text, 'ok'),  [toast])
  const error   = useCallback((text: string) => toast(text, 'err'), [toast])
  const info    = useCallback((text: string) => toast(text, 'info'),[toast])

  return (
    <Ctx.Provider value={{ toast, success, error, info }}>
      {children}
      {msg && (
        <div
          className="toast"
          style={{
            borderColor:
              msg.type === 'ok' ? 'var(--g)' : msg.type === 'err' ? 'var(--r)' : 'var(--f)'
          }}
        >
          {msg.text}
        </div>
      )}
    </Ctx.Provider>
  )
}

export const useToast = () => useContext(Ctx)
