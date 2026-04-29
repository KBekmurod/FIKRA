import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface ToastContext {
  toast: (msg: string, type?: 'info' | 'ok' | 'err') => void
}

const Ctx = createContext<ToastContext>({ toast: () => {} })

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

  return (
    <Ctx.Provider value={{ toast }}>
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
