import { useCallback, useEffect, useState } from 'react'

import { formatINRCompact, resolveTier, tierProgress, toE164, type Customer, type LoyaltyEntry } from '@kadai-os/core'

import { api } from '../lib/api'
import { useSession } from '../lib/session'

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)]'

const tierColor: Record<string, string> = { silver: '#64748B', gold: '#F59E0B', platinum: '#818CF8' }

export default function Customers() {
  const { shop, version } = useSession()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [ledger, setLedger] = useState<LoyaltyEntry[]>([])
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!shop) return
    setCustomers(await api.listCustomers(shop.id, search ? { search } : undefined).catch(() => []))
  }, [shop, search])

  useEffect(() => {
    void load()
  }, [load, version])

  useEffect(() => {
    if (selected) void api.listLedger(selected.id).then(setLedger).catch(() => setLedger([]))
  }, [selected])

  async function addCustomer() {
    if (!shop) return
    setError('')
    try {
      await api.createCustomer(shop.id, { name: newName.trim(), phone: toE164(newPhone) })
      setAdding(false)
      setNewName('')
      setNewPhone('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add member')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Members</h1>
          <p className="text-[13px] text-[var(--text-2)]">{customers.length} enrolled in loyalty</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="rounded-[10px] bg-[var(--primary)] text-white text-[13px] font-bold px-4 py-2"
        >
          + Add member
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or phone…"
        className="w-full max-w-md rounded-xl border-[1.5px] border-[var(--border-mid)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
      />

      <div className="grid gap-2 md:grid-cols-2">
        {customers.map((c) => {
          const tier = resolveTier(c.pointsBalance)
          return (
            <button key={c.id} onClick={() => setSelected(c)} className={`${card} p-4 text-left hover:border-[var(--primary)] transition-colors`}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full grid place-items-center text-[13px] font-bold"
                  style={{ background: tierColor[tier] + '22', color: tierColor[tier] }}
                >
                  {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold truncate">{c.name}</p>
                  <p className="text-[12px] text-[var(--text-2)]">
                    {c.pointsBalance.toLocaleString('en-IN')} pts · {c.phone}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-[10px] font-bold uppercase rounded px-2 py-0.5"
                    style={{ background: tierColor[tier] + '22', color: tierColor[tier] }}
                  >
                    {tier}
                  </span>
                  <p className="text-[13px] font-bold mt-1">{formatINRCompact(c.lifetimeSpendPaise)}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Add member */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setAdding(false)}>
          <div className="bg-[var(--surface)] rounded-2xl p-5 w-full max-w-sm flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold">New member</p>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" autoFocus className="rounded-[10px] border-[1.5px] border-[var(--border-mid)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" />
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone (98765 43210)" inputMode="tel" className="rounded-[10px] border-[1.5px] border-[var(--border-mid)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]" />
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            <button onClick={() => void addCustomer()} disabled={newName.trim().length < 1 || newPhone.replace(/\D/g, '').length < 10} className="rounded-[10px] bg-[var(--primary)] text-white font-bold text-sm py-2.5 disabled:opacity-50">
              Add member
            </button>
          </div>
        </div>
      )}

      {/* Profile */}
      {selected && (() => {
        const progress = tierProgress(selected.pointsBalance)
        return (
          <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-[var(--surface)] rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-2xl p-5 text-white" style={{ background: tierColor[progress.current] }}>
                <p className="text-[11px] uppercase tracking-widest font-bold opacity-70">Kadai OS · {progress.current}</p>
                <p className="text-2xl font-extrabold mt-1">{selected.name}</p>
                <p className="text-[13px] opacity-65">{selected.phone}</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[
                    { label: 'Points', value: selected.pointsBalance.toLocaleString('en-IN') },
                    { label: 'Visits', value: selected.visitCount },
                    { label: 'Lifetime', value: formatINRCompact(selected.lifetimeSpendPaise) },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/10 rounded-xl p-2.5">
                      <p className="text-[11px] opacity-60">{m.label}</p>
                      <p className="text-base font-extrabold">{m.value}</p>
                    </div>
                  ))}
                </div>
                {progress.next && (
                  <div className="mt-3">
                    <p className="text-[11px] opacity-65">{progress.remaining.toLocaleString('en-IN')} pts to {progress.next}</p>
                    <div className="h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: `${progress.fraction * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[15px] font-bold mt-4 mb-2">Loyalty ledger</p>
              <div className="flex flex-col">
                {ledger.length === 0 && <p className="text-sm text-[var(--text-2)]">No entries yet.</p>}
                {ledger.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 py-2 border-t border-[var(--border)] text-sm">
                    <span className="w-20 font-mono text-[11px] text-[var(--text-3)]">{e.createdAt.slice(0, 10)}</span>
                    <span className="flex-1 capitalize">{e.type}{e.billId ? ` · bill` : ''}</span>
                    <span className={e.points > 0 ? 'font-bold text-green-600' : 'font-bold text-red-500'}>
                      {e.points > 0 ? '+' : ''}{e.points}
                    </span>
                    <span className="w-16 text-right text-[var(--text-2)]">{e.balanceAfter}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
