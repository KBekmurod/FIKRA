import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { folderApi } from '../api/endpoints'
import { useToast } from '../components/Toast'
import { triggerHaptic } from '../utils/haptics'

export default function FlashcardPage() {
  const { folderId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [deck, setDeck] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const fetchDeck = async () => {
    if (!folderId) return
    try {
      const { data } = await folderApi.getFlashcards(folderId)
      if (data.status === 'not_found') {
        setDeck(null)
      } else {
        setDeck(data)
      }
    } catch (e) {
      toast.error('Flashcardlarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeck()
  }, [folderId])

  useEffect(() => {
    if (deck?.status === 'generating') {
      const interval = setInterval(fetchDeck, 3000)
      return () => clearInterval(interval)
    }
  }, [deck])

  const handleGenerate = async () => {
    if (!folderId) return
    setGenerating(true)
    try {
      const { data } = await folderApi.generateFlashcards(folderId)
      setDeck(data)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Generatsiyada xatolik')
    } finally {
      setGenerating(false)
    }
  }

  const goBack = () => navigate(-1)

  if (loading) {
    return (
      <div className="full-loader">
        <div className="spin" />
      </div>
    )
  }

  if (!deck || deck.status === 'failed') {
    return (
      <div style={{ padding: 20, textAlign: 'center', marginTop: 100 }}>
        <h2>FIKRA Flash ⚡</h2>
        <p style={{ color: 'var(--txt-2)', margin: '20px 0' }}>
          Mavzuni tezkor takrorlash uchun AI tomonidan Flashcardlar yaratamiz.
        </p>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? <><div className="spin" /> Yaratilmoqda...</> : 'Flashcard Yaratish'}
        </button>
      </div>
    )
  }

  if (deck.status === 'generating') {
    return (
      <div className="full-loader">
        <div className="spin" style={{ width: 40, height: 40 }} />
        <div className="full-loader-text">FIKRA <span>Flash</span></div>
        <div style={{ color: 'var(--txt-2)' }}>Kartochkalar yaratilmoqda...</div>
      </div>
    )
  }

  const cards = deck.cards || []
  if (currentIndex >= cards.length) {
    return (
      <div style={{ padding: 20, textAlign: 'center', marginTop: 100 }}>
        <h2>Ajoyib! 🎉</h2>
        <p style={{ color: 'var(--txt-2)', margin: '20px 0' }}>Barcha kartochkalarni takrorladingiz.</p>
        <button className="btn btn-primary" onClick={() => setCurrentIndex(0)}>
          Qaytadan boshlash
        </button>
        <button className="btn btn-ghost" onClick={goBack} style={{ marginLeft: 10 }}>
          Ortga
        </button>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg)'
    }}>
      <div className="header">
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--txt-2)',
          fontSize: 22, cursor: 'pointer', padding: 0, marginRight: 8,
        }}>←</button>
        <div className="header-logo">FIKRA <span>Flash</span> ⚡</div>
        <div style={{ fontWeight: 700, color: 'var(--txt-2)' }}>
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: 1200
      }}>
        <AnimatePresence>
          <SwipeCard
            key={currentIndex}
            card={cards[currentIndex]}
            onSwipe={() => {
              triggerHaptic('swipe')
              setCurrentIndex(c => c + 1)
            }}
          />
        </AnimatePresence>
      </div>
    </div>
  )
}

function SwipeCard({ card, onSwipe }: { card: any, onSwipe: () => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const [flipped, setFlipped] = useState(false)

  const handleDragEnd = (e: any, info: any) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe()
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{
        x,
        rotate,
        opacity,
        position: 'absolute',
        width: '320px',
        height: '420px',
        cursor: 'grab',
      }}
      whileTap={{ cursor: 'grabbing', scale: 0.95 }}
      onClick={() => {
        triggerHaptic('click')
        setFlipped(!flipped)
      }}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
      >
        {/* Front */}
        <div className="glass" style={{
          position: 'absolute',
          backfaceVisibility: 'hidden',
          width: '100%',
          height: '100%',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          background: 'linear-gradient(135deg, rgba(20,20,42,0.8), rgba(10,10,20,0.9))'
        }}>
          <div style={{ color: 'var(--acc-l)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            {card.topic || 'SAVOL'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.4 }}>
            {card.front}
          </div>
          <div style={{ position: 'absolute', bottom: 20, color: 'var(--txt-3)', fontSize: 12 }}>
            Javobni ko'rish uchun bosing
          </div>
        </div>

        {/* Back */}
        <div className="glass" style={{
          position: 'absolute',
          backfaceVisibility: 'hidden',
          width: '100%',
          height: '100%',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          transform: 'rotateY(180deg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          background: 'linear-gradient(135deg, rgba(123,104,238,0.2), rgba(20,20,42,0.9))'
        }}>
          <div style={{ color: 'var(--g)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            JAVOB
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.5 }}>
            {card.back}
          </div>
          <div style={{ position: 'absolute', bottom: 20, color: 'var(--txt-3)', fontSize: 12 }}>
            Keyingisiga o'tish uchun o'ngga yoki chapga suring
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
