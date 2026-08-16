import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onDone: () => void
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400)
    const t2 = setTimeout(() => setPhase('exit'), 1800)
    const t3 = setTimeout(() => onDone(), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1000,
      background: '#4F46E5',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'exit' ? 0 : 1,
      transition: phase === 'exit' ? 'opacity 0.4s ease' : 'none',
      overflow: 'hidden'
    }}>
      {/* Background rings */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.6s ease'
      }}>
        {[280, 380, 480].map((size, i) => (
          <div key={size} style={{
            position: 'absolute',
            width: size, height: size, borderRadius: size / 2,
            border: '1px solid rgba(255,255,255,0.08)',
            animation: `pulse-ring ${2 + i * 0.4}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Logo mark */}
      <div style={{
        transform: phase === 'enter' ? 'scale(0.7)' : phase === 'exit' ? 'scale(1.05)' : 'scale(1)',
        opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
        transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <rect x="6" y="14" width="32" height="24" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
            <path d="M15 14V11C15 8.24 17.24 6 20 6H24C26.76 6 29 8.24 29 11V14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="22" cy="26" r="3.5" fill="white"/>
            <path d="M22 29.5V33" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 32, fontWeight: 800, color: '#fff',
            margin: '0 0 4px', letterSpacing: -1,
            fontFamily: 'Inter, sans-serif'
          }}>Shop OS</h1>
          <p style={{
            fontSize: 14, color: 'rgba(255,255,255,0.65)',
            margin: 0, fontWeight: 500, letterSpacing: 0.2
          }}>Retail. Simplified.</p>
        </div>
      </div>

      {/* Loading bar */}
      <div style={{
        position: 'absolute', bottom: 60,
        width: 120, height: 3, borderRadius: 2,
        background: 'rgba(255,255,255,0.15)',
        overflow: 'hidden',
        opacity: phase === 'hold' ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          background: 'rgba(255,255,255,0.8)',
          animation: 'loading-bar 1.4s ease forwards'
        }} />
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.04); opacity: 1; }
        }
        @keyframes loading-bar {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  )
}
