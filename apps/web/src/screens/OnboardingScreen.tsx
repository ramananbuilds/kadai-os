import { useState } from 'react'

interface OnboardingScreenProps {
  onDone: () => void
}

const slides = [
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect x="8" y="18" width="40" height="30" rx="5" stroke="white" strokeWidth="2.5" fill="none"/>
        <path d="M19 18V14C19 10.69 21.69 8 25 8H31C34.31 8 37 10.69 37 14V18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="28" cy="33" r="5" fill="white" opacity="0.9"/>
        <path d="M28 38V43" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M18 28H38" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
    accent: '#4F46E5',
    title: 'Your entire store,\nin one place',
    sub: 'Billing, inventory, customers, and insights — all connected, always in sync.',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect x="8" y="8" width="40" height="40" rx="8" stroke="white" strokeWidth="2.5" fill="none"/>
        <path d="M8 20H48" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        <circle cx="20" cy="34" r="4" fill="white"/>
        <circle cx="36" cy="34" r="4" fill="white" opacity="0.5"/>
        <path d="M24 34H32" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        <path d="M28 14H36" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="14" r="2" fill="white"/>
      </svg>
    ),
    accent: '#7C3AED',
    title: 'Bill faster than\never before',
    sub: 'Scan barcodes, search products, apply discounts, and collect payment in seconds.',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="22" r="10" stroke="white" strokeWidth="2.5" fill="none"/>
        <path d="M14 46C14 38.27 20.27 32 28 32C35.73 32 42 38.27 42 46" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M36 14L40 10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        <path d="M20 14L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        <circle cx="44" cy="18" r="6" fill="#22C55E"/>
        <path d="M41.5 18L43.5 20L47 16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    accent: '#059669',
    title: 'Customers love\nloyalty rewards',
    sub: 'Build lasting relationships with tiers, points, and personalized rewards that bring them back.',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path d="M8 42L8 30" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <path d="M18 42L18 22" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
        <path d="M28 42L28 14" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <path d="M38 42L38 20" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
        <path d="M48 42L48 28" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
        <path d="M8 30L18 22L28 14L38 20L48 28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" strokeDasharray="2 3"/>
        <circle cx="8" cy="30" r="3" fill="white" opacity="0.5"/>
        <circle cx="18" cy="22" r="3" fill="white" opacity="0.7"/>
        <circle cx="28" cy="14" r="3" fill="white"/>
        <circle cx="38" cy="20" r="3" fill="white" opacity="0.7"/>
        <circle cx="48" cy="28" r="3" fill="white" opacity="0.5"/>
      </svg>
    ),
    accent: '#0EA5E9',
    title: 'Know your store\ninside out',
    sub: 'AI-powered insights, real-time analytics, and smart alerts to keep you ahead.',
  },
]

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [idx, setIdx] = useState(0)
  const slide = slides[idx]
  const isLast = idx === slides.length - 1

  const next = () => {
    if (isLast) onDone()
    else setIdx(i => i + 1)
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 900,
      background: slide.accent,
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.5s ease',
      overflow: 'hidden'
    }}>
      {/* Skip */}
      {!isLast && (
        <button
          onClick={onDone}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: 20,
            padding: '6px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
            zIndex: 10
          }}
        >Skip</button>
      )}

      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -80, right: -80,
        width: 320, height: 320, borderRadius: 160,
        background: 'rgba(255,255,255,0.06)'
      }} />
      <div style={{
        position: 'absolute', bottom: 120, left: -60,
        width: 200, height: 200, borderRadius: 100,
        background: 'rgba(0,0,0,0.08)'
      }} />

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 36px 0',
        textAlign: 'center'
      }}>
        <div
          key={idx}
          style={{ animation: 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          {/* Illustration */}
          <div style={{
            width: 120, height: 120, borderRadius: 36,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 36px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.2)'
          }}>
            {slide.icon}
          </div>

          <h2 style={{
            fontSize: 30, fontWeight: 800, color: '#fff',
            margin: '0 0 14px', letterSpacing: -0.8, lineHeight: 1.2,
            whiteSpace: 'pre-line', fontFamily: 'Inter, sans-serif'
          }}>{slide.title}</h2>

          <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.7)',
            margin: 0, lineHeight: 1.6, fontWeight: 400
          }}>{slide.sub}</p>
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding: '32px 28px 44px' }}>
        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 24 : 6, height: 6, borderRadius: 3,
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'width 0.25s ease, background 0.25s ease'
              }}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="press-effect"
          style={{
            width: '100%', padding: '17px',
            background: '#fff',
            border: 'none', borderRadius: 16,
            fontSize: 16, fontWeight: 700,
            color: slide.accent,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            transition: 'color 0.4s ease',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {isLast ? 'Get Started' : 'Continue'}
        </button>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
