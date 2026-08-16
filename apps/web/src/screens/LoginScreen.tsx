import { useState } from 'react'

interface LoginScreenProps {
  onLogin: () => void
  dark: boolean
}

export default function LoginScreen({ onLogin, dark }: LoginScreenProps) {
  const [view, setView] = useState<'login' | 'pin'>('login')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleContinue = () => {
    if (phone.length < 10) { setError('Enter a valid phone number'); return }
    setError('')
    setView('pin')
  }

  const handlePinDigit = (d: string) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) {
      setLoading(true)
      setTimeout(() => { setLoading(false); onLogin() }, 900)
    }
  }

  const handlePinDel = () => setPin(p => p.slice(0, -1))

  const pinKeys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 800,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Top accent */}
      <div style={{
        height: 3, background: 'linear-gradient(90deg, #4F46E5, #7C3AED, #4F46E5)',
        backgroundSize: '200% 100%',
        animation: 'shimmer-bar 2s infinite'
      }} />

      {/* Logo area */}
      <div style={{ padding: '48px 28px 0', textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20,
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px',
          boxShadow: '0 8px 32px rgba(79,70,229,0.35)'
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="4" y="12" width="28" height="20" rx="4" stroke="white" strokeWidth="2.5" fill="none"/>
            <path d="M12 12V9C12 6.24 14.24 4 17 4H19C21.76 4 24 6.24 24 9V12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="18" cy="22" r="3.5" fill="white"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', margin: '0 0 4px', letterSpacing: -0.5 }}>
          Shop OS
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>
          {view === 'login' ? 'Sign in to your store' : `Welcome back, Ravi`}
        </p>
      </div>

      {view === 'login' ? (
        <div style={{ flex: 1, padding: '40px 28px 0', display: 'flex', flexDirection: 'column' }}>
          {/* Phone input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 7 }}>
              Mobile Number
            </label>
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--surface)',
              border: `1.5px solid ${error ? '#EF4444' : 'var(--border-mid)'}`,
              borderRadius: 14, overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color 0.15s'
            }}>
              <div style={{
                padding: '0 14px', borderRight: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 6, height: 52
              }}>
                <span style={{ fontSize: 18 }}>🇮🇳</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>+91</span>
              </div>
              <input
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g,'').slice(0,10)); setError('') }}
                placeholder="98765 43210"
                type="tel"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', padding: '0 16px',
                  fontSize: 16, color: 'var(--text)', fontFamily: 'Inter, sans-serif',
                  letterSpacing: 0.5, height: 52
                }}
              />
              {phone.length === 10 && (
                <div style={{
                  marginRight: 14, width: 22, height: 22, borderRadius: 11,
                  background: '#22C55E',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                    <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '6px 0 0', fontWeight: 500 }}>{error}</p>}
          </div>

          <button
            onClick={handleContinue}
            className="press-effect"
            style={{
              width: '100%', padding: '16px',
              background: 'var(--primary)', border: 'none', borderRadius: 14,
              fontSize: 16, fontWeight: 700, color: '#fff',
              cursor: 'pointer', marginBottom: 20,
              boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            Continue
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>or sign in with</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Social */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Google', icon: '🔵' },
              { label: 'Apple', icon: '🍎' },
            ].map(s => (
              <button
                key={s.label}
                className="press-effect"
                style={{
                  padding: '13px 16px',
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border-mid)',
                  borderRadius: 12, cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, color: 'var(--text)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          {/* Demo shortcut */}
          <button
            onClick={onLogin}
            style={{
              marginTop: 'auto', marginBottom: 32,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-3)', fontWeight: 500,
              textDecoration: 'underline', textDecorationColor: 'var(--border)',
              textUnderlineOffset: 3
            }}
          >
            Skip for demo →
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 28px 0' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center', marginBottom: 28 }}>
            Enter your 4-digit PIN
          </p>

          {/* PIN dots */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 40 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: 9,
                background: i < pin.length
                  ? (loading ? '#22C55E' : 'var(--primary)')
                  : 'var(--border-mid)',
                transition: 'background 0.2s ease, transform 0.15s ease',
                transform: i < pin.length ? 'scale(1.1)' : 'scale(1)'
              }} />
            ))}
          </div>

          {/* Numpad */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12, maxWidth: 280, margin: '0 auto', width: '100%'
          }}>
            {pinKeys.map((k, i) => (
              <button
                key={i}
                onClick={() => k === '⌫' ? handlePinDel() : k === '' ? undefined : handlePinDigit(k)}
                disabled={k === '' || loading}
                className={k !== '' ? 'press-effect' : ''}
                style={{
                  height: 68, borderRadius: 16,
                  background: k === '' ? 'transparent' : k === '⌫' ? 'var(--surface-2)' : 'var(--surface)',
                  border: k === '' ? 'none' : `1px solid var(--border)`,
                  fontSize: k === '⌫' ? 20 : 22, fontWeight: 600,
                  color: k === '⌫' ? 'var(--text-2)' : 'var(--text)',
                  cursor: k === '' ? 'default' : 'pointer',
                  boxShadow: k !== '' && k !== '⌫' ? 'var(--shadow-sm)' : 'none',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {loading && k !== '⌫' && k !== '' ? '' : k}
              </button>
            ))}
          </div>

          <button
            onClick={() => setView('login')}
            style={{
              marginTop: 'auto', marginBottom: 32,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text-3)', fontWeight: 500
            }}
          >
            ← Back
          </button>
        </div>
      )}

      <style>{`
        @keyframes shimmer-bar {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
