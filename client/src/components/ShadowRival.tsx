import React, { useEffect, useState } from 'react'

interface ShadowRivalProps {
  name: string
  expectedScore: number
  accuracy: number
  duration: number
  isActive: boolean
}

export default function ShadowRival({ name, expectedScore, accuracy, duration, isActive }: ShadowRivalProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isActive || duration <= 0) return
    // Calculate how much score to add per second to reach expectedScore in 'duration' seconds
    const scorePerSecond = expectedScore / duration
    const intervalTimeMs = 1000 // update every second
    const scorePerInterval = scorePerSecond * (intervalTimeMs / 1000)

    const interval = setInterval(() => {
      setProgress(p => {
        const next = p + scorePerInterval
        return next > expectedScore ? expectedScore : next
      })
    }, intervalTimeMs)
    return () => clearInterval(interval)
  }, [isActive, expectedScore, duration])

  return (
    <div style={{
      background: 'rgba(20,20,42,0.85)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,95,126,0.3)',
      borderRadius: '12px',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
      boxShadow: '0 4px 20px rgba(255,95,126,0.1)'
    }}>
      <div style={{ fontSize: 24 }}>🥷</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt)' }}>{name}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--r)' }}>{progress.toFixed(1)}%</div>
        </div>
        <div style={{ height: 6, background: 'var(--s2)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            background: 'linear-gradient(90deg, #ff5f7e, #ff9f43)',
            transition: 'width 0.5s ease-out'
          }} />
        </div>
      </div>
    </div>
  )
}
