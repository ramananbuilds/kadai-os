import { useCallback, useEffect, useMemo, useState } from 'react'

import { formatINR, formatINRCompact, rupeesToPaise, type Product } from '@kadai-os/core'

import { api } from '../lib/api'
import { useSession } from '../lib/session'

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)]'

const status = (p: Product) =>
  p.stockQty === 0
    ? { label: 'Out', color: '#DC2626', bg: '#FEE2E2' }
    : p.stockQty <= p.reorderLevel
      ? { label: 'Low', color: '#92400E', bg: '#FEF3C7' }
      : { label: 'OK', color: '#166534', bg: '#DCFCE7' }

const emptyForm = { name: '', sku: '', price: '', cost: '', stock: '', reorder: '5', category: 'General' }

export default function Inventory() {
  const { shop } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!shop) return
    setProducts(await api.listProducts(shop.id, { search: search || undefined }).catch(() => []))
  }, [shop, search])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => (lowOnly ? products.filter((p) => p.stockQty <= p.reorderLevel) : products), [products, lowOnly])
  const stockValue = products.reduce((s, p) => s + p.stockQty * p.costPaise, 0)
  const totalUnits = products.reduce((s, p) => s + p.stockQty, 0)
  const lowCount = products.filter((p) => p.stockQty <= p.reorderLevel).length

  async function addProduct() {
    if (!shop) return
    setError('')
    try {
      await api.createProduct(shop.id, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: null,
        category: form.category.trim() || 'General',
        pricePaise: rupeesToPaise(Number(form.price)),
        costPaise: form.cost ? rupeesToPaise(Number(form.cost)) : 0,
        stockQty: form.stock ? Math.max(0, Math.floor(Number(form.stock))) : 0,
        reorderLevel: Math.max(0, Math.floor(Number(form.reorder) || 0)),
      })
      setAdding(false)
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add product')
    }
  }

  async function adjust(p: Product, delta: number) {
    setBusyId(p.id)
    try {
      await api.adjustStock(p.id, delta, delta > 0 ? 'restock' : 'adjustment', 'back-office')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  const field = 'rounded-[10px] border-[1.5px] border-[var(--border-mid)] bg-[var(--bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Stock</h1>
          <p className="text-[13px] text-[var(--text-2)]">{products.length} products · {totalUnits} units</p>
        </div>
        <button onClick={() => setAdding(true)} className="rounded-[10px] bg-[var(--primary)] text-white text-[13px] font-bold px-4 py-2">
          + Add product
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        {[
          { label: 'Stock value', value: formatINRCompact(stockValue) },
          { label: 'Units', value: String(totalUnits) },
          { label: 'Low stock', value: String(lowCount), warn: lowCount > 0 },
        ].map((s) => (
          <div key={s.label} className={`${card} p-3 ${s.warn ? 'border-[#FDE68A]' : ''}`}>
            <p className="text-[11px] text-[var(--text-2)]">{s.label}</p>
            <p className={`text-lg font-extrabold ${s.warn ? 'text-[#92400E]' : ''}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products or SKU…"
          className={`flex-1 ${field} bg-[var(--surface)]`}
        />
        <button
          onClick={() => setLowOnly(!lowOnly)}
          className={`px-4 rounded-xl text-[13px] font-semibold ${lowOnly ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}
        >
          Low only
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {filtered.map((p) => {
          const st = status(p)
          const margin = Math.round(((p.pricePaise - p.costPaise) / p.pricePaise) * 100)
          return (
            <div key={p.id} className={`${card} p-4 flex flex-col gap-2`}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold flex-1 min-w-0 truncate">{p.name}</p>
                <span className="text-[10px] font-bold rounded px-2 py-0.5" style={{ color: st.color, background: st.bg }}>
                  {st.label}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[var(--text-3)]">{p.sku} · {p.category}</p>
              <div className="flex items-center gap-3">
                <p className="text-[13px] flex-1">
                  {formatINR(p.pricePaise)} · <span className="font-bold text-green-600">{margin}% margin</span>
                </p>
                <p className="text-[13px] font-bold" style={{ color: st.color }}>{p.stockQty} units</p>
                <button disabled={busyId === p.id} onClick={() => void adjust(p, -1)} className="w-7 h-7 rounded-lg border border-[var(--border)] text-sm disabled:opacity-40">−</button>
                <button disabled={busyId === p.id} onClick={() => void adjust(p, 1)} className="w-7 h-7 rounded-lg bg-[var(--primary)] text-white text-sm disabled:opacity-40">+</button>
              </div>
            </div>
          )
        })}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={() => setAdding(false)}>
          <div className="bg-[var(--surface)] rounded-2xl p-5 w-full max-w-md flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="text-base font-bold">New product</p>
            <div className="grid grid-cols-2 gap-3">
              <input className={field} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
              <input className={field} placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <input className={field} placeholder="Price ₹" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <input className={field} placeholder="Cost ₹" inputMode="decimal" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              <input className={field} placeholder="Opening stock" inputMode="numeric" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              <input className={field} placeholder="Reorder level" inputMode="numeric" value={form.reorder} onChange={(e) => setForm({ ...form, reorder: e.target.value })} />
            </div>
            {error && <p className="text-[13px] text-red-500">{error}</p>}
            <button
              onClick={() => void addProduct()}
              disabled={!form.name.trim() || !form.sku.trim() || !(Number(form.price) > 0)}
              className="rounded-[10px] bg-[var(--primary)] text-white font-bold text-sm py-2.5 disabled:opacity-50"
            >
              Add product
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
