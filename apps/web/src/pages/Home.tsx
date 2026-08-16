import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Package, Users, Zap } from 'lucide-react'

import { formatINR, type Bill, type Product } from '@kadai-os/core'

import { api } from '../lib/api'
import { useSession } from '../lib/session'

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4'

export default function Home() {
  const { shop, version } = useSession()
  const [revenue, setRevenue] = useState(0)
  const [billCount, setBillCount] = useState(0)
  const [avgBill, setAvgBill] = useState(0)
  const [upiShare, setUpiShare] = useState(0)
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
    setAvgBill(summary?.avgBillPaise ?? 0)
    const tender = summary?.tenderSplit
    const tenderTotal = Math.max(1, tender ? tender.cash + tender.upi + tender.card : 1)
    setUpiShare(tender ? Math.round((tender.upi / tenderTotal) * 100) : 0)
    setLowStock(low)
    setRecent(bills)
  }, [shop?.id])

  useEffect(() => {
    void load()
  }, [load, version])

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting — prototype header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-[var(--text-2)]">Kadai OS · Today</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Good day at the counter</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white grid place-items-center text-[15px] font-bold shadow-[0_4px_12px_rgba(79,70,229,0.35)]">
          {(shop?.name ?? 'K').charAt(0)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {/* Revenue card — prototype: primary, decorative circles, inner stat grid */}
        <div className="md:col-span-3 rounded-[20px] bg-[var(--primary)] p-5 text-white relative overflow-hidden shadow-[0_8px_32px_rgba(79,70,229,0.3)]">
          <div className="absolute -top-8 -right-8 w-[120px] h-[120px] rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-5 right-5 w-20 h-20 rounded-full bg-white/[0.05]" />
          <p className="text-[12px] font-semibold text-white/65 uppercase tracking-wider">Today's Revenue</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-[13px] text-white/70 font-medium">₹</span>
            <span className="text-[38px] font-extrabold tracking-tight leading-none">
              {formatINR(revenue).replace('₹', '')}
            </span>
          </div>
          <p className="text-[13px] text-white/65 mt-1">{billCount} bills today</p>

          <div className="grid grid-cols-3 gap-px mt-4 bg-white/10 rounded-xl overflow-hidden">
            {[
              { label: 'Avg Bill', value: formatINR(avgBill) },
              { label: 'UPI', value: `${upiShare}%` },
              { label: 'Returns', value: '0' },
            ].map((m) => (
              <div key={m.label} className="bg-white/[0.06] px-3 py-2.5">
                <p className="text-[11px] text-white/55 font-medium">{m.label}</p>
                <p className="text-base font-bold">{m.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions — prototype 2×2 grid language */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          {[
            { to: '/bill', icon: Zap, label: 'Quick Bill', sub: 'Start billing', primary: true },
            { to: '/inventory', icon: Package, label: 'Stock', sub: `${lowStock.length} low`, primary: false },
            { to: '/customers', icon: Users, label: 'Members', sub: 'Loyalty', primary: false },
            { to: '/reports', icon: BarChart3, label: 'Reports', sub: 'Analytics', primary: false },
          ].map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className={`rounded-2xl p-3.5 flex flex-col gap-1 transition-colors ${
                q.primary
                  ? 'bg-[var(--primary)] text-white shadow-[0_4px_16px_rgba(79,70,229,0.25)]'
                  : `${card} hover:border-[var(--primary)]`
              }`}
            >
              <q.icon size={20} className={q.primary ? 'text-white' : 'text-[var(--primary)]'} />
              <p className={`text-[13px] font-bold ${q.primary ? 'text-white' : ''}`}>{q.label}</p>
              <p className={`text-[11px] ${q.primary ? 'text-white/65' : 'text-[var(--text-2)]'}`}>{q.sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {lowStock.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-bold">Low stock · reorder</h2>
          <div className={card}>
            {lowStock.slice(0, 5).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                <span className="w-2 h-2 rounded-full" style={{ background: p.stockQty === 0 ? '#EF4444' : '#F59E0B' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-[11px] font-mono text-[var(--text-3)]">{p.sku}</p>
                </div>
                <span
                  className="text-[11px] font-bold rounded-md px-2 py-0.5"
                  style={{
                    color: p.stockQty === 0 ? '#DC2626' : '#92400E',
                    background: p.stockQty === 0 ? '#FEE2E2' : '#FEF3C7',
                  }}
                >
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
                <div className="w-9 h-9 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] grid place-items-center text-[11px] font-bold">
                  #{b.number}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {b.items.map((it) => it.nameSnapshot).slice(0, 2).join(' + ')}
                    {b.items.length > 2 ? ` +${b.items.length - 2}` : ''}
                  </p>
                  <p className="text-[12px] text-[var(--text-2)]">
                    {b.tender.toUpperCase()} · {b.createdAt.slice(11, 16)}
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
