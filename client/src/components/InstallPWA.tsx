import React, { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false)
  const [promptInstall, setPromptInstall] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      console.log('we are being triggered :D')
      setSupportsPWA(true)
      setPromptInstall(e)
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('transitionend', handler)
  }, [])

  const onClick = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault()
    if (!promptInstall) return
    promptInstall.prompt()
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
        setIsInstalled(true)
      } else {
        console.log('User dismissed the install prompt')
      }
    })
  }

  if (!supportsPWA || isInstalled) return null

  return (
    <div style={{
      position: 'fixed', bottom: '80px', left: '20px', right: '20px',
      background: 'var(--acc)', color: 'white', padding: '15px', borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      animation: 'slideUp 0.5s ease-out'
    }}>
      <div>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Ilovani o'rnating</h4>
        <p style={{ margin: '5px 0 0', fontSize: '13px', opacity: 0.9 }}>
          Tez kirish va oflayn ishlash uchun ekranga qo'shing
        </p>
      </div>
      <button onClick={onClick} style={{
        background: 'white', color: 'var(--acc)', border: 'none', padding: '8px 15px',
        borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
      }}>
        O'rnatish
      </button>
    </div>
  )
}
