import { useCallback, useEffect, useState } from 'react'

import { formatINR, type Bill } from '@kadai-os/core'

import { api } from '../lib/api'
import { useSession } from '../lib/session'

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4'

/** Weekly report from recent bills; SQL views serve the same shape live. */
export default function Reports() {
  const { shop, version } = useSession()
  const [bills, setBills] = useState<Bill[]>([])

  const load = useCallback(async () => {
    if (!shop) return
    setBills(await api.listRecentBills(shop.id, 200).catch(() => []))
  }, [shop?.id])

  useEffect(() => {
    void load()
  }, [load, version])

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const byDay = new Map<string, { revenue: number; count: number }>()
  const byTender = { cash: 0, upi: 0, card: 0 }
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>()

  for (const b of bills) {
    const key = b.createdAt.slice(0, 10)
    const day = byDay.get(key) ?? { revenue: 0, count: 0 }
    day.revenue += b.totalPaise
    day.count += 1
    byDay.set(key, day)
    byTender[b.tender] += b.totalPaise
    for (const it of b.items) {
      const p = byProduct.get(it.productId) ?? { name: it.nameSnapshot, qty: 0, revenue: 0 }
      p.qty += it.qty
      p.revenue += it.lineTotalPaise
      byProduct.set(it.productId, p)
    }
  }

  const week = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-7)
  const maxRevenue = Math.max(1, ...week.map(([, d]) => d.revenue))
  const weekTotal = week.reduce((s, [, d]) => s + d.revenue, 0)
  const weekBills = week.reduce((s, [, d]) => s + d.count, 0)
  const tenderTotal = Math.max(1, byTender.cash + byTender.upi + byTender.card)
  const top = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Reports</h1>
        <p className="text-[13px] text-[var(--text-2)]">Aggregated from {bills.length} bills · SQL views on live backend</p>
      </div>

      <div className={`${card} flex flex-col gap-4`}>
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-2)]">Last 7 active days</p>
          <p className="text-3xl font-extrabold tracking-tight">{formatINR(weekTotal)}</p>
          <p className="text-[13px] text-[var(--text-2)]">{weekBills} bills</p>
        </div>
        <div className="flex items-end gap-2 h-28">
          {week.map(([date, d]) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t bg-[var(--primary)] min-h-1"
                style={{ height: `${(d.revenue / maxRevenue) * 85}px`, opacity: 0.85 }}
                title={`${date}: ${formatINR(d.revenue)}`}
              />
              <span className="text-[10px] text-[var(--text-3)]">{days[new Date(date).getDay()]}</span>
            </div>
          ))}
          {week.length === 0 && <p className="text-sm text-[var(--text-2)]">No bills yet — make the first sale.</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className={`${card} flex flex-col gap-3`}>
          <p className="text-base font-bold">Tender split</p>
          {(['upi', 'cash', 'card'] as const).map((t) => (
            <div key={t} className="flex flex-col gap-1">
              <div className="flex justify-between text-[13px]">
                <span className="uppercase font-bold text-[var(--text-2)]">{t}</span>
                <span className="font-bold">{formatINR(byTender[t])}</span>
              </div>
              <div className="h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: `${(byTender[t] / tenderTotal) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className={`${card} flex flex-col gap-2`}>
          <p className="text-base font-bold">Top products</p>
          {top.length === 0 && <p className="text-sm text-[var(--text-2)]">No sales yet.</p>}
          {top.map((p, i) => (
            <div key={p.name} className="flex items-center gap-3 py-1.5 border-t border-[var(--border)]">
              <span className="text-[13px] font-bold text-[var(--text-3)] w-4">{i + 1}</span>
              <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
              <span className="text-[12px] text-[var(--text-2)]">×{p.qty}</span>
              <span className="text-[13px] font-bold">{formatINR(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
