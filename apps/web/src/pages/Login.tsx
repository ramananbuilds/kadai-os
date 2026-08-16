import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { toE164 } from '@kadai-os/core'

import { api, backend } from '../lib/api'
import { useSession } from '../lib/session'

export default function Login() {
  const navigate = useNavigate()
  const { refresh } = useSession()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendOtp() {
    setError('')
    try {
      setBusy(true)
      await api.sendOtp(toE164(phone))
      setStep('otp')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setError('')
    try {
      setBusy(true)
      const session = await api.verifyOtp(toE164(phone), otp)
      await refresh()
      navigate(session.shopId ? '/' : '/new-shop', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-[10px] border-[1.5px] border-[var(--border-mid)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors'

  return (
    <div className="min-h-screen bg-[var(--bg)] grid place-items-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center flex flex-col gap-3 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] text-white grid place-items-center text-3xl mx-auto shadow-lg">
            🛍️
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Shop OS</h1>
          <p className="text-sm text-[var(--text-2)]">
            {step === 'phone' ? 'Sign in to your store' : `Code sent to ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <>
            <label className="text-[13px] font-semibold text-[var(--text-2)]">Mobile number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && phone.replace(/\D/g, '').length >= 10 && void sendOtp()}
              placeholder="98765 43210"
              inputMode="tel"
              autoFocus
              className={input}
            />
            <button
              onClick={() => void sendOtp()}
              disabled={busy || phone.replace(/\D/g, '').length < 10}
              className="rounded-[10px] bg-[var(--primary)] text-white font-bold text-[15px] py-3 disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send code'}
            </button>
          </>
        ) : (
          <>
            <label className="text-[13px] font-semibold text-[var(--text-2)]">6-digit code</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && otp.length >= 4 && void verify()}
              placeholder="••••••"
              inputMode="numeric"
              autoFocus
              className={`${input} text-center tracking-[0.4em] text-xl`}
            />
            <button
              onClick={() => void verify()}
              disabled={busy || otp.length < 4}
              className="rounded-[10px] bg-[var(--primary)] text-white font-bold text-[15px] py-3 disabled:opacity-50"
            >
              {busy ? 'Verifying…' : 'Verify & continue'}
            </button>
            <button onClick={() => setStep('phone')} className="text-[13px] font-semibold text-[var(--primary)] py-1">
              Change number
            </button>
          </>
        )}

        {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}
        {backend === 'memory' && (
          <p className="text-[11px] text-[var(--text-3)] text-center mt-2">
            Demo backend — any number works, code is 123456
          </p>
        )}
      </div>
    </div>
  )
}
