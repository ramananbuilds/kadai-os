import { useCallback, useEffect, useState } from 'react'

import { formatINR, rupeesToPaise, type Reward } from '@kadai-os/core'

import { api } from '../lib/api'
import { useSession } from '../lib/session'

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4'
const field =
  'rounded-[10px] border-[1.5px] border-[var(--border-mid)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]'

const emptyForm = { name: '', kind: 'flat_off' as 'flat_off' | 'percent_off', value: '', costPoints: '', minSpend: '', expiryDays: '30' }

/** Back-office loyalty editor: earn rule, tier thresholds, reward catalog. */
export default function Rewards() {
  const { shop, refresh } = useSession()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [form, setForm] = useState(emptyForm)
  const [adding, setAdding] = useState(false)
  const [earn, setEarn] = useState('1')
  const [gold, setGold] = useState('2000')
  const [platinum, setPlatinum] = useState('5000')
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!shop) return
    setRewards(await api.listRewards(shop.id).catch(() => []))
    setEarn(String(shop.loyalty.earnRule.pointsPerHundredRupees))
    setGold(String(shop.loyalty.tiers.gold))
    setPlatinum(String(shop.loyalty.tiers.platinum))
  }, [shop])

  useEffect(() => {
    void load()
  }, [load])

  async function saveRules() {
    if (!shop) return
    setError('')
    setSavedMsg('')
    try {
      await api.updateShop(shop.id, {
        loyalty: {
          earnRule: { pointsPerHundredRupees: Math.max(0, Math.floor(Number(earn) || 0)) },
          tiers: { gold: Math.max(1, Math.floor(Number(gold) || 1)), platinum: Math.max(1, Math.floor(Number(platinum) || 1)) },
        },
      })
      await refresh()
      setSavedMsg('Loyalty rules saved — every client and the RPC now use them.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save rules')
    }
  }

  async function addReward() {
    if (!shop) return
    setError('')
    try {
      await api.createReward(shop.id, {
        name: form.name.trim(),
        kind: form.kind,
        value: form.kind === 'flat_off' ? rupeesToPaise(Number(form.value)) : Math.floor(Number(form.value)),
        minSpendPaise: form.minSpend ? rupeesToPaise(Number(form.minSpend)) : null,
        costPoints: Math.max(0, Math.floor(Number(form.costPoints) || 0)),
        expiryDays: form.expiryDays ? Math.max(1, Math.floor(Number(form.expiryDays))) : null,
      })
      setAdding(false)
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add reward')
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Rewards & loyalty</h1>
        <p className="text-[13px] text-[var(--text-2)]">The flywheel: earn rule → tiers → rewards that bring customers back.</p>
      </div>

      {/* Rules */}
      <div className={`${card} flex flex-col gap-3`}>
        <p className="text-base font-bold">Earning rules</p>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--text-2)]">
            Points per ₹100
            <input value={earn} onChange={(e) => setEarn(e.target.value)} inputMode="numeric" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--text-2)]">
            Gold tier (pts)
            <input value={gold} onChange={(e) => setGold(e.target.value)} inputMode="numeric" className={field} />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-[var(--text-2)]">
            Platinum tier (pts)
            <input value={platinum} onChange={(e) => setPlatinum(e.target.value)} inputMode="numeric" className={field} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => void saveRules()} className="rounded-[10px] bg-[var(--primary)] text-white text-[13px] font-bold px-4 py-2">
            Save rules
          </button>
          {savedMsg && <span className="text-[13px] text-green-600 font-semibold">{savedMsg}</span>}
        </div>
      </div>

      {/* Catalog */}
      <div className="flex items-center justify-between">
        <p className="text-base font-bold">Reward catalog</p>
        <button onClick={() => setAdding(true)} className="rounded-[10px] bg-[var(--primary)] text-white text-[13px] font-bold px-4 py-2">
          + Add reward
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {rewards.length === 0 && <p className="text-sm text-[var(--text-2)]">No rewards yet — add the first one.</p>}
        {rewards.map((r) => (
          <div key={r.id} className={`${card} flex items-center gap-3`}>
            <span className="text-xl">🎁</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{r.name}</p>
              <p className="text-[12px] text-[var(--text-2)]">
                {r.costPoints} pts · {r.kind === 'flat_off' ? `${formatINR(r.value)} off` : `${r.value}% off`}
                {r.minSpendPaise ? ` · min ${formatINR(r.minSpendPaise)}` : ''}
                {r.expiryDays ? ` · ${r.expiryDays}d expiry` : ''}
              </p>
            </div>
            <button
              onClick={async () => {
                await api.setRewardActive(r.id, false).catch(() => undefined)
                await load()
              }}
              className="text-[12px] font-semibold text-red-500 hover:underline"
            >
              Retire
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-[13px] text-red-500">{error}</p>}

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setAdding(false)}>
          <div className="bg-[var(--surface)] rounded-2xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold">New reward</p>
            <input className={field} placeholder="Name (₹500 Off Next Purchase)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <select className={field} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as 'flat_off' | 'percent_off' })}>
                <option value="flat_off">Flat ₹ off</option>
                <option value="percent_off">Percent off</option>
              </select>
              <input className={field} placeholder={form.kind === 'flat_off' ? 'Value ₹' : 'Percent %'} inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              <input className={field} placeholder="Cost (points)" inputMode="numeric" value={form.costPoints} onChange={(e) => setForm({ ...form, costPoints: e.target.value })} />
              <input className={field} placeholder="Min spend ₹ (opt.)" inputMode="decimal" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: e.target.value })} />
              <input className={field} placeholder="Expiry days" inputMode="numeric" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} />
            </div>
            <button
              onClick={() => void addReward()}
              disabled={!form.name.trim() || !(Number(form.value) > 0)}
              className="rounded-[10px] bg-[var(--primary)] text-white font-bold text-sm py-2.5 disabled:opacity-50"
            >
              Add reward
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
