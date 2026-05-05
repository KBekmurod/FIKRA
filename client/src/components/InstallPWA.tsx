import React, { useEffect, useState } from 'react'

type Tab = 'native' | 'manual'

const NOTIFICATION_VIEW_KEY = 'fikra_install_notification_views'
const MAX_NOTIFICATION_VIEWS = 3
const AUTO_CLOSE_DELAY_MS = 5000

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false)
  const [promptInstall, setPromptInstall] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showFloating, setShowFloating] = useState(false)
  const [viewCount, setViewCount] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('native')
  const [copied, setCopied] = useState(false)

  const appUrl = window.location.origin

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setSupportsPWA(true)
      setPromptInstall(e)
    }

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    if (!isInstalled) {
      const savedViewCount = parseInt(localStorage.getItem(NOTIFICATION_VIEW_KEY) || '0', 10)
      setViewCount(savedViewCount)

      // Show floating notification only if under the view limit
      if (savedViewCount < MAX_NOTIFICATION_VIEWS) {
        setShowFloating(true)
        // Auto-close after 5 seconds
        const timer = setTimeout(() => {
          setShowFloating(false)
        }, AUTO_CLOSE_DELAY_MS)
        return () => clearTimeout(timer)
      }
    }
  }, [isInstalled])

  useEffect(() => {
    if (!isInstalled && showFloating && viewCount < MAX_NOTIFICATION_VIEWS) {
      // Increment view count when floating notification is shown
      const newCount = viewCount + 1
      setViewCount(newCount)
      localStorage.setItem(NOTIFICATION_VIEW_KEY, String(newCount))
    }
  }, [showFloating, isInstalled, viewCount])

  const handleNativeInstall = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault()
    if (!promptInstall) {
      setActiveTab('manual')
      return
    }
    promptInstall.prompt()
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true)
        setShowModal(false)
        setShowFloating(false)
      }
    })
  }

  const closeFloatingNotification = () => {
    setShowFloating(false)
  }

  const openModalFromFloating = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowModal(true)
    setShowFloating(false)
    setActiveTab(supportsPWA ? 'native' : 'manual')
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const openInChrome = () => {
    window.open(appUrl, '_blank')
  }

  if (isInstalled) return null

  return (
    <>
      {/* Floating prompt: visible for first 3 app opens, auto-closes after 5 seconds */}
      {showFloating && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '20px',
            right: '20px',
            background: 'var(--acc)',
            color: 'white',
            padding: '15px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'slideUp 0.5s ease-out',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ flex: 1, cursor: 'pointer' }} onClick={openModalFromFloating}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              📱 Ilovani o'rnating
            </h4>
            <p style={{ margin: '5px 0 0', fontSize: '13px', opacity: 0.9 }}>
              Ilovani telefonga qo'shing, keyin tez ochiladi
            </p>
          </div>
          <button
            onClick={closeFloatingNotification}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              marginLeft: '10px',
              minWidth: '40px'
            }}
            title="Yopish"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 2000,
            animation: 'fadeIn 0.3s'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'var(--bg)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px',
              maxHeight: '80vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px' }}>📱 Ilovani o'rnating</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: 'var(--txt-2)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => setActiveTab('native')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background:
                    activeTab === 'native' ? 'var(--acc)' : 'var(--s2)',
                  color: activeTab === 'native' ? 'white' : 'var(--txt-2)',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ⚡ Tez
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                style={{
                  flex: 1,
                  padding: '10px',
                  background:
                    activeTab === 'manual' ? 'var(--acc)' : 'var(--s2)',
                  color: activeTab === 'manual' ? 'white' : 'var(--txt-2)',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📖 Qo'lda
              </button>
            </div>

            {/* Native Tab */}
            {activeTab === 'native' && (
              <div>
                <p style={{ margin: '0 0 15px', color: 'var(--txt-2)', fontSize: '14px', lineHeight: 1.6 }}>
                  Brauzer o'rnatishga ruxsat bersa, quyidagi tugma bilan ilovani qo'shasiz.
                  Agar Telegram ichida bo'lsangiz yoki tugma chiqmasa, Qo'lda bo'limiga o'ting.
                </p>
                <button
                  onClick={handleNativeInstall}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'var(--acc)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginBottom: '15px'
                  }}
                >
                  ⬇️ Ilovani o'rnating
                </button>
                {!promptInstall && (
                  <p
                    style={{
                      margin: '10px 0 0',
                      padding: '10px',
                      background: 'var(--s2)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'var(--txt-3)'
                    }}
                  >
                    ℹ️ Telegram ichidan o'tgansiz? Qo'lda yo'nalishdan foydalaning.
                  </p>
                )}
              </div>
            )}

            {/* Manual Tab */}
            {activeTab === 'manual' && (
              <div>
                <div
                  style={{
                    background: 'var(--s2)',
                    padding: '15px',
                    borderRadius: '10px',
                    marginBottom: '15px'
                  }}
                >
                  <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '12px' }}>
                    📌 Ilovaning URL manzili:
                  </p>
                  <div
                    style={{
                      background: 'var(--bg)',
                      padding: '10px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginBottom: '10px',
                      borderLeft: '3px solid var(--acc)'
                    }}
                  >
                    <code
                      style={{
                        fontSize: '11px',
                        color: 'var(--acc)',
                        flex: 1,
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}
                    >
                      {appUrl}
                    </code>
                    <button
                      onClick={copyUrl}
                      style={{
                        padding: '8px 12px',
                        background: copied ? 'var(--g)' : 'var(--acc)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s'
                      }}
                    >
                      {copied ? '✓ Nusxalandi' : 'Nusxalash'}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--s2)',
                    padding: '15px',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{
                    marginBottom: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(123,104,238,0.08)',
                    color: 'var(--txt-2)',
                    fontSize: '12px',
                    lineHeight: 1.6,
                    border: '1px solid rgba(123,104,238,0.18)'
                  }}>
                    Bu usul Telegram ichida ham ishlaydi. Avval URL ni nusxalang, Chrome’da oching, so‘ng menyudan
                    <strong> “Ekranga qo‘shish”</strong> yoki <strong> “Ilovani o‘rnatish”</strong> ni bosing.
                  </div>
                  <p
                    style={{
                      margin: '0 0 12px 0',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}
                  >
                    📱 Bosqichma-bosqich:
                  </p>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '20px',
                      fontSize: '13px',
                      lineHeight: '1.8',
                      color: 'var(--txt-2)'
                    }}
                  >
                    <li>
                      <strong>Chrome ochib</strong> qo'shimcha browser orqali
                    </li>
                    <li>
                      <strong>URL nusxasini paste</strong> qilib manzil sariyasiga kiriting
                    </li>
                    <li>
                      <strong>3 nuqta tugmasini bosing</strong> (⋮) oʻng burchakda
                    </li>
                    <li>
                      <strong>"Ekranga qoʻshish"</strong> yoki <strong>"O'rnatish"</strong> bosing
                    </li>
                    <li>
                      <strong>Tayyor!</strong> Ilovasi smartfonyungizda paydo boʻladi
                    </li>
                  </ol>
                </div>

                <button
                  onClick={openInChrome}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--acc)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginTop: '15px'
                  }}
                >
                  🌐 Chrome-da ochish
                </button>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--s2)',
                color: 'var(--txt-2)',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </>
  )
}
