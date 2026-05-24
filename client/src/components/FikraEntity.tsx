import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { triggerHaptic } from '../utils/haptics'
import { api } from '../api/client'
import ReactMarkdown from 'react-markdown'
import { useEntityStore } from '../store/entityStore'
import { useAppStore } from '../store'
import './FikraEntity.css'

interface Message {
  role: 'user' | 'entity'
  content: string
}

export const FikraEntity: React.FC = () => {
  const { mode, isVisible, isPrankingLevel, isMatrixMode, isScreenWiped, isThiefActive, isSleepingOnLogo, isPassingBy, prankMessage, setMode, triggerHammerPrank, triggerMatrixHack, triggerScreenWipe, triggerLogoSleep } = useEntityStore()
  const { user } = useAppStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  const [logoPos, setLogoPos] = useState({ x: 0, y: 0 })
  
  const blobRef = useRef<HTMLImageElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const location = useLocation()

  // DND Mode (Chalg'itmaslik qoidasi)
  useEffect(() => {
    if (location.pathname.includes('/test-run') || location.pathname.includes('/personal-tests/')) {
      setMode('hidden')
      setIsOpen(false)
    }
  }, [location.pathname])

  // Tasodifiy Prank Taymer (Faqat Bosh sahifada, va Streak/Level baland bo'lsa)
  useEffect(() => {
    if (location.pathname !== '/') return
    if (!user || user.plan === 'free') return
    
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && mode === 'hidden') {
        const rng = Math.random()
        if (rng < 0.33) {
          triggerHammerPrank()
          triggerHaptic('wrong')
        } else if (rng < 0.66) {
          triggerMatrixHack()
          triggerHaptic('correct')
        }
      }
    }, 45000)
    
    // Idle timer logic (Optimized with interval polling instead of spamming clear/set timeout)
    let lastActivity = Date.now()
    const updateActivity = () => { lastActivity = Date.now() }
    
    const idleInterval = setInterval(() => {
      if (Date.now() - lastActivity > 60000) {
        if (mode === 'hidden' || mode === 'idle_logo' || mode === 'prank_wipe') {
          const rng = Math.random()
          if (rng > 0.5) {
            triggerLogoSleep()
          } else {
            triggerScreenWipe()
            triggerHaptic('swipe')
          }
          lastActivity = Date.now() // Prevent immediate re-trigger
        }
      }
    }, 5000)

    window.addEventListener('mousemove', updateActivity, { passive: true })
    window.addEventListener('keypress', updateActivity, { passive: true })
    window.addEventListener('touchstart', updateActivity, { passive: true })

    return () => {
      clearInterval(interval)
      clearInterval(idleInterval)
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keypress', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
    }
  }, [location.pathname, user, mode])

  // Auto scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Body CSS effect triggers
  useEffect(() => {
    if (isMatrixMode) document.body.classList.add('matrix-mode')
    else document.body.classList.remove('matrix-mode')

    const appContent = document.querySelector('.app-content')
    if (appContent) {
      if (isScreenWiped) appContent.classList.add('screen-blur')
      else appContent.classList.remove('screen-blur')
    }
  }, [isMatrixMode, isScreenWiped])

  // Get Logo Position for Sleeping Prank
  useEffect(() => {
    if (isSleepingOnLogo) {
      const logo = document.querySelector('.header-logo')
      if (logo) {
        const rect = logo.getBoundingClientRect()
        // We calculate distance from bottom right (where Fikr-A usually is)
        // Fikr-A is typically at bottom: 20px, right: 20px
        const fikraWidth = 100
        const fikraHeight = 100
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        
        const targetX = rect.left + rect.width / 2 - (windowWidth - 20 - fikraWidth / 2)
        const targetY = rect.top - (windowHeight - 20 - fikraHeight / 2) - 30 // above logo
        setLogoPos({ x: targetX, y: targetY })
      }
    }
  }, [isSleepingOnLogo])

  const toggleChat = () => {
    triggerHaptic('click')
    setIsOpen(!isOpen)
    if (!isOpen && messages.length === 0) {
      // Birinchi marta ochilganda o'zi salom beradi
      sendInitialGreeting()
    }
  }

  const sendInitialGreeting = async () => {
    setIsTyping(true)
    try {
      const response = await fetch(`${api.defaults.baseURL}/entity/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          message: "O'zingni tanishtir va qayerdaligimni ayt.", 
          contextUrl: window.location.pathname,
          pageContext: getPageContext(window.location.pathname)
        })
      })

      if (!response.body) return
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      setMessages([{ role: 'entity', content: '' }])
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const data = JSON.parse(line.replace('data: ', ''))
            if (data.content) {
              setMessages(prev => {
                const newMsgs = [...prev]
                newMsgs[newMsgs.length - 1].content += data.content
                return newMsgs
              })
              // Har bir so'zda kichik titrash
              if (Math.random() > 0.8) triggerHaptic('click')
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    triggerHaptic('click')
    
    setIsTyping(true)
    try {
      const response = await fetch(`${api.defaults.baseURL}/entity/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          message: userMsg, 
          contextUrl: window.location.pathname,
          pageContext: getPageContext(window.location.pathname)
        })
      })

      if (!response.body) return
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      setMessages(prev => [...prev, { role: 'entity', content: '' }])
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const data = JSON.parse(line.replace('data: ', ''))
            if (data.content) {
              setMessages(prev => {
                const newMsgs = [...prev]
                newMsgs[newMsgs.length - 1].content += data.content
                return newMsgs
              })
            }
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Yordamchi: URL ga qarab kontekst so'zini beradi
  const getPageContext = (path: string) => {
    if (path === '/') return "Bosh sahifada statistikani ko'ryapti"
    if (path.includes('test')) return "Imtihon yoki test yechish bilan band"
    if (path.includes('materials')) return "Ombordan nimalarnidir o'qiyapti"
    if (path.includes('ai')) return "AI Yordamchi bilan gaplashmoqda (meni o'rnimga!)"
    return "Noma'lum sahifada adashib yuribdi"
  }

  // Agar DND rejimida yashiringan bo'lsa, umuman render qilinmaydi (Prank bo'lmasa)
  if (mode === 'hidden' && !isVisible) return null

  const isAnyPrankActive = mode.startsWith('prank_')

  return (
    <div className={`fikra-entity-container ${isAnyPrankActive ? 'prank-mode' : ''}`}>
      {/* Prank vaqtidagi maxsus dialog */}
      <AnimatePresence>
        {(isPrankingLevel || isMatrixMode || isScreenWiped || isThiefActive) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            className="fikra-prank-bubble"
          >
            {prankMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && !isAnyPrankActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fikra-chat-window"
          >
            <div className="fikra-chat-header">
              <span className="fikra-chat-title">FIKR-A MAVJUDOTI</span>
              <button className="fikra-close-btn" onClick={toggleChat}>×</button>
            </div>
            
            <div className="fikra-chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`fikra-msg ${m.role}`}>
                  {m.role === 'entity' ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="fikra-typing">Fikr-A yozmoqda...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="fikra-chat-input-area">
              <input 
                type="text" 
                className="fikra-chat-input" 
                placeholder="Mavjudotga gapir..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />
              <button className="fikra-chat-send" onClick={handleSend} disabled={isTyping || !input.trim()}>
                <i className="fi fi-rr-paper-plane"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className={`fikra-avatar-container ${isPassingBy ? 'pass-by-fast' : ''}`}
        onClick={!isAnyPrankActive ? toggleChat : undefined} 
        title="Fikr-A"
        animate={
          isSleepingOnLogo ? {
            x: logoPos.x,
            y: logoPos.y,
            rotate: 90, // lie down
            scale: 0.8
          } : isThiefActive ? {
            x: -window.innerWidth / 2 + 50, // fly to the left middle
            y: -window.innerHeight / 2 + 100,
            scale: 1.5,
            rotate: [0, -20, 20, 0]
          } : isAnyPrankActive ? {
            y: -window.innerHeight * 0.4, 
            scale: 1.5,
          } : { 
            x: 0,
            y: isOpen ? [0, -10, 0] : [0, -5, 0],
            scale: isOpen ? 1.2 : 1,
            rotate: isPrankingLevel ? [-10, 10, -10, 0] : 0
          }
        }
        transition={{ type: 'spring', damping: 20 }}
        style={{ position: 'relative', cursor: 'pointer' }}
      >
        {/* Avatar rasm */}
        <img 
          ref={blobRef}
          src="/assets/fikra_avatar.png" 
          alt="Fikr-A" 
          className="fikra-avatar-img"
        />
        {/* Zzz effekti (Sleeping on Logo) */}
        <AnimatePresence>
          {isSleepingOnLogo && (
            <motion.div 
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -30, x: 20 }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ position: 'absolute', top: -20, right: -20, fontSize: 24, fontWeight: 'bold', color: 'var(--acc)', zIndex: 100 }}
            >
              Zzz...
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Kristall nur (Glow) */}
        <div className="fikra-crystal-glow"></div>

        {/* Prank vaqtida bolg'a chiqishi */}
        <AnimatePresence>
          {mode === 'prank_hammer' && (
            <motion.div 
              className="fikra-hammer"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: -45, opacity: 1 }}
              transition={{ delay: 1, type: 'spring', stiffness: 500 }}
              onAnimationComplete={() => {
                // Urish payti keldi
                document.body.classList.add('screen-shake')
                triggerHaptic('wrong')
                setTimeout(() => document.body.classList.remove('screen-shake'), 500)
              }}
            >
              🔨
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
