import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api } from '../lib/api'
import { useSession } from '../lib/session'

export default function NewShop() {
  const navigate = useNavigate()
  const { refresh } = useSession()
  const [name, setName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    setError('')
    try {
      setBusy(true)
      await api.createShopForOwner({ name: name.trim(), upiId: upiId.trim() })
      await refresh()
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the shop')
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-[10px] border-[1.5px] border-[var(--border-mid)] bg-[var(--surface)] px-4 py-3 text-[15px] text-[var(--text)] outline-none focus:border-[var(--primary)] transition-colors'

  return (
    <div className="min-h-screen bg-[var(--bg)] grid place-items-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold text-[var(--text)]">Set up your shop</h1>
        <p className="text-sm text-[var(--text-2)] -mt-2">
          Your UPI id goes on every bill's QR — customers pay you directly.
        </p>

        <label className="text-[13px] font-semibold text-[var(--text-2)]">Shop name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ravi's Boutique" autoFocus className={input} />

        <label className="text-[13px] font-semibold text-[var(--text-2)]">UPI id</label>
        <input
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="yourname@okhdfcbank"
          className={input}
        />

        <button
          onClick={() => void create()}
          disabled={busy || name.trim().length < 1 || upiId.trim().length < 3}
          className="rounded-[10px] bg-[var(--primary)] text-white font-bold text-[15px] py-3 disabled:opacity-50 mt-2"
        >
          {busy ? 'Creating…' : 'Open my shop'}
        </button>
        {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}
      </div>
    </div>
  )
}
