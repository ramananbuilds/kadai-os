import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { formatINR, type Bill, type Product } from '@kadai-os/core'

import { api } from '../lib/api'
import { useSession } from '../lib/session'

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4'

export default function Home() {
  const { shop } = useSession()
  const [revenue, setRevenue] = useState(0)
  const [billCount, setBillCount] = useState(0)
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [recent, setRecent] = useState<Bill[]>([])

  const load = useCallback(async () => {
    if (!shop) return
    const today = new Date().toISOString().slice(0, 10)
    const [summary, low, bills] = await Promise.all([
      api.dailySummary(shop.id, today).catch(() => null),
      api.listProducts(shop.id, { lowStockOnly: true }).catch(() => []),
      api.listRecentBills(shop.id, 6).catch(() => []),
    ])
    setRevenue(summary?.revenuePaise ?? 0)
    setBillCount(summary?.billCount ?? 0)
    setLowStock(low)
    setRecent(bills)
  }, [shop?.id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[13px] font-medium text-[var(--text-2)]">Today</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Good day at the counter 👋</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl bg-[var(--primary)] p-5 text-white relative overflow-hidden">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-white/60">Today's revenue</p>
          <p className="text-4xl font-extrabold tracking-tight mt-1">{formatINR(revenue)}</p>
          <p className="text-[13px] text-white/65 mt-1">{billCount} bills</p>
          <Link
            to="/bill"
            className="inline-block mt-4 rounded-xl bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 text-sm font-bold"
          >
            ⚡ New bill
          </Link>
        </div>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Low stock', value: lowStock.length, to: '/inventory' },
            { label: 'Members', value: '', to: '/customers' },
          ].map((q) => (
            <Link key={q.label} to={q.to} className={`${card} flex-1 hover:border-[var(--primary)] transition-colors`}>
              <p className="text-[11px] text-[var(--text-2)] font-medium">{q.label}</p>
              <p className="text-2xl font-extrabold mt-1">{q.value === '' ? '→' : q.value}</p>
            </Link>
          ))}
        </div>
      </div>

      {lowStock.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Low stock · reorder</h2>
          <div className={card}>
            {lowStock.slice(0, 5).map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: p.stockQty === 0 ? '#EF4444' : '#F59E0B' }}
                />
                <p className="flex-1 text-sm font-medium">{p.name}</p>
                <span className="text-[12px] font-bold" style={{ color: p.stockQty === 0 ? '#DC2626' : '#92400E' }}>
                  {p.stockQty} left
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Recent bills</h2>
          <div className={card}>
            {recent.map((b, i) => (
              <div key={b.id} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Bill #{b.number}</p>
                  <p className="text-[12px] text-[var(--text-2)] truncate">
                    {b.items.reduce((s, it) => s + it.qty, 0)} items · {b.tender.toUpperCase()} ·{' '}
                    {b.createdAt.slice(11, 16)}
                  </p>
                </div>
                <p className="text-sm font-bold">{formatINR(b.totalPaise)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
