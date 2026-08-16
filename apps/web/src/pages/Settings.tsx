import { useEffect, useState } from 'react'

import type { ShopMember } from '@kadai-os/core'

import { api, backend } from '../lib/api'
import { useSession } from '../lib/session'

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4'
const field =
  'rounded-[10px] border-[1.5px] border-[var(--border-mid)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]'

export default function Settings() {
  const { shop, session, refresh } = useSession()
  const [members, setMembers] = useState<ShopMember[]>([])
  const [name, setName] = useState('')
  const [upiId, setUpiId] = useState('')
  const [gstin, setGstin] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (shop) {
      setName(shop.name)
      setUpiId(shop.upiId)
      setGstin(shop.gstin ?? '')
    }
  }, [shop])

  useEffect(() => {
    if (session?.shopId) void api.listMembers(session.shopId).then(setMembers).catch(() => setMembers([]))
  }, [session?.shopId])

  async function save() {
    if (!shop) return
    setError('')
    setSavedMsg('')
    try {
      await api.updateShop(shop.id, { name: name.trim(), upiId: upiId.trim(), gstin: gstin.trim() || null })
      await refresh()
      setSavedMsg('Shop profile saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-[13px] text-[var(--text-2)]">Shop profile, staff, environment.</p>
      </div>

      <div className={`${card} flex flex-col gap-3`}>
        <p className="text-base font-bold">Shop profile</p>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--text-2)]">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--text-2)]">
          UPI id (on every bill's QR)
          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--text-2)]">
          GSTIN (optional in v1)
          <input value={gstin} onChange={(e) => setGstin(e.target.value)} className={field} />
        </label>
        <div className="flex items-center gap-3">
          <button onClick={() => void save()} className="rounded-[10px] bg-[var(--primary)] text-white text-[13px] font-bold px-4 py-2">
            Save profile
          </button>
          {savedMsg && <span className="text-[13px] text-green-600 font-semibold">{savedMsg}</span>}
        </div>
        {error && <p className="text-[13px] text-red-500">{error}</p>}
      </div>

      <div className={`${card} flex flex-col gap-2`}>
        <p className="text-base font-bold">Staff</p>
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 py-2 border-t border-[var(--border)]">
            <span className="flex-1 text-sm font-medium">{m.role === 'owner' ? 'Owner' : 'Staff'}</span>
            <span className="text-[12px] font-mono text-[var(--text-3)]">{m.userId.slice(0, 8)}…</span>
            {m.pin && <span className="text-[12px] font-bold text-[var(--text-2)]">PIN ••{m.pin.slice(-2)}</span>}
          </div>
        ))}
        <p className="text-[12px] text-[var(--text-3)]">
          Staff join by installing the app and signing in once; invite them from the owner device (addStaffMember).
        </p>
      </div>

      <div className={`${card} flex flex-col gap-1`}>
        <p className="text-base font-bold">Environment</p>
        <p className="text-[13px] text-[var(--text-2)]">
          Backend: <span className="font-bold">{backend}</span>
          {backend === 'memory' && <> — demo data. Set <code>VITE_SUPABASE_URL</code>/<code>VITE_SUPABASE_ANON_KEY</code> in <code>apps/web/.env.local</code> to go live (see supabase/SETUP.md).</>}
        </p>
      </div>
    </div>
  )
}
