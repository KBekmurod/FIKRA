import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string
}

/**
 * Error Boundary — agar React komponentlarida xato bo'lsa,
 * "Aw, Snap!" o'rniga yumshoq ko'rinishda xato sahifasini ko'rsatadi.
 *
 * Bu Android WebView'da memory yoki render xatolari bo'lganda foydali.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: '' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FIKRA ErrorBoundary caught:', error, info)
    this.setState({ errorInfo: info.componentStack || '' })

    // Anonim error reporting (optional)
    try {
      const errorPayload = {
        message: error.message,
        stack: (error.stack || '').slice(0, 1000),
        component: (info.componentStack || '').slice(0, 500),
        url: window.location.href,
        userAgent: navigator.userAgent.slice(0, 200),
        timestamp: new Date().toISOString(),
      }
      // Beacon — javob kutmaymiz
      navigator.sendBeacon?.('/api/log/client-error',
        new Blob([JSON.stringify(errorPayload)], { type: 'application/json' })
      )
    } catch {}
  }

  handleReload = () => {
    // ServiceWorker cache'ni tozalash va qaytadan yuklash
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister())
        })
      }
      if ('caches' in window) {
        caches.keys().then(names => names.forEach(n => caches.delete(n)))
      }
    } catch {}
    window.location.href = '/'
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a14',
          color: '#f0eeff',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 24, fontWeight: 800,
            margin: 0, marginBottom: 12,
          }}>
            Texnik nosozlik yuz berdi
          </h2>
          <p style={{
            fontSize: 14,
            color: 'rgba(240,238,255,0.7)',
            lineHeight: 1.5,
            maxWidth: 320,
            margin: '0 0 24px',
          }}>
            Ilova ishida kutilmagan xato bo'ldi. Bu vaqtinchalik —
            qayta yuklashda hammasi yana ishlaydi.
          </p>

          <div style={{
            display: 'grid',
            gap: 10,
            width: '100%',
            maxWidth: 280,
          }}>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #7b68ee, #9d8fff)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >🔄 Ilovani qaytadan yuklash</button>

            <button
              onClick={this.handleGoHome}
              style={{
                background: 'rgba(240,238,255,0.05)',
                color: '#f0eeff',
                border: '1px solid rgba(240,238,255,0.1)',
                borderRadius: 12,
                padding: '14px 18px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >🏠 Asosiy sahifaga</button>
          </div>

          {/* Dev rejimda xato ma'lumotini ko'rsatish */}
          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginTop: 24,
              padding: 12,
              background: 'rgba(255,95,126,0.08)',
              border: '1px solid rgba(255,95,126,0.2)',
              borderRadius: 10,
              fontSize: 11,
              maxWidth: 400,
              textAlign: 'left',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#ff5f7e' }}>
                Dev: xato ma'lumoti
              </summary>
              <pre style={{
                marginTop: 8,
                fontSize: 10,
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
