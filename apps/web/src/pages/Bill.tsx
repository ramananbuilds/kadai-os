import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  discountPaise,
  formatINR,
  lineTotalPaise,
  newId,
  subtotalPaise,
  type Bill,
  type Customer,
  type Product,
  type Tender,
} from '@kadai-os/core'

import { api } from '../lib/api'
import { useSession } from '../lib/session'
import Receipt from '../components/Receipt'

interface CartLine {
  product: Product
  qty: number
}

const card = 'rounded-2xl border border-[var(--border)] bg-[var(--surface)]'

/** The counter, keyboard-first: autofocus search, ↑↓ picks, Enter adds. */
export default function BillPage() {
  const { shop } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState(0)
  const [cart, setCart] = useState<CartLine[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [tender, setTender] = useState<Tender>('upi')
  const [receipt, setReceipt] = useState<Bill | null>(null)
  const [error, setError] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!shop) return
    const [prods, custs] = await Promise.all([
      api.listProducts(shop.id).catch(() => []),
      api.listCustomers(shop.id).catch(() => []),
    ])
    setProducts(prods)
    setCustomers(custs)
  }, [shop])

  useEffect(() => {
    void load()
    searchRef.current?.focus()
  }, [load])

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? '').includes(search),
    )
  }, [products, search])

  const subtotal = subtotalPaise(cart.map((l) => ({ lineTotalPaise: lineTotalPaise(l.product.pricePaise, l.qty) })))
  const discountAmt = discountPaise(subtotal, discount)
  const total = subtotal - discountAmt
  const itemCount = cart.reduce((s, l) => s + l.qty, 0)

  function add(p: Product) {
    setCart((prev) => {
      const found = prev.find((l) => l.product.id === p.id)
      if (found) return prev.map((l) => (l.product.id === p.id ? { ...l, qty: l.qty + 1 } : l))
      return [...prev, { product: p, qty: 1 }]
    })
  }

  function bump(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    )
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter' && filtered[cursor]) {
      e.preventDefault()
      add(filtered[cursor])
      setSearch('')
      setCursor(0)
    } else if (e.key === 'Escape') {
      setSearch('')
    }
  }

  /** Web is online-first: straight to create_bill (the RPC re-prices). */
  async function checkout() {
    if (!shop || cart.length === 0) return
    setError('')
    try {
      const bill = await api.createBill(shop.id, {
        id: newId(),
        customerId,
        items: cart.map((l) => ({ productId: l.product.id, qty: l.qty })),
        discountPercent: discount,
        redeemedPoints: 0,
        redeemedRewardId: null,
        tender,
        createdAt: new Date().toISOString(),
      })
      setReceipt(bill)
      setCart([])
      setDiscount(0)
      setCustomerId(null)
      void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed')
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
      {/* Catalog */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">New bill</h1>
          <p className="text-[13px] text-[var(--text-2)]">
            Keyboard-first: type, ↑↓ to pick, Enter to add · {itemCount} in cart
          </p>
        </div>
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCursor(0)
          }}
          onKeyDown={onKey}
          placeholder="Search products, SKU, or scan barcode…"
          className="w-full rounded-xl border-[1.5px] border-[var(--border-mid)] bg-[var(--surface)] px-4 py-3 text-[15px] outline-none focus:border-[var(--primary)] transition-colors"
        />
        <div className="flex flex-col gap-2">
          {filtered.map((p, i) => {
            const line = cart.find((l) => l.product.id === p.id)
            const low = p.stockQty <= p.reorderLevel
            return (
              <div
                key={p.id}
                onClick={() => add(p)}
                className={`${card} p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                  i === cursor ? 'border-[var(--primary)]' : 'hover:border-[var(--border-mid)]'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-[11px] font-mono text-[var(--text-3)]">
                    {p.sku}
                    {low && <span className="ml-2 font-sans font-bold text-[#92400E]">LOW</span>}
                  </p>
                </div>
                <p className="text-sm font-bold">{formatINR(p.pricePaise)}</p>
                {line && (
                  <span className="text-[13px] font-bold text-[var(--primary)] bg-[var(--primary-soft)] rounded-md px-2 py-0.5">
                    ×{line.qty}
                  </span>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--text-2)] py-8 text-center">No products match.</p>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className={`${card} p-4 flex flex-col gap-3 lg:sticky lg:top-[73px]`}>
        <p className="text-base font-bold">Cart · {itemCount} items</p>
        {cart.length === 0 && <p className="text-sm text-[var(--text-2)] py-4 text-center">Search and add products.</p>}
        {cart.map((l) => (
          <div key={l.product.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{l.product.name}</p>
              <p className="text-[11px] text-[var(--text-2)]">
                {formatINR(l.product.pricePaise)} × {l.qty}
              </p>
            </div>
            <button onClick={() => bump(l.product.id, -1)} className="w-6 h-6 rounded-md border border-[var(--border)] text-sm">
              −
            </button>
            <span className="w-5 text-center text-[13px] font-bold text-[var(--primary)]">{l.qty}</span>
            <button onClick={() => bump(l.product.id, 1)} className="w-6 h-6 rounded-md bg-[var(--primary)] text-white text-sm">
              +
            </button>
            <p className="w-16 text-right text-[13px] font-bold">{formatINR(lineTotalPaise(l.product.pricePaise, l.qty))}</p>
          </div>
        ))}

        <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-3">
          <button
            onClick={() => setCustomerId(null)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${customerId === null ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}
          >
            Walk-in
          </button>
          {customers.slice(0, 8).map((c) => (
            <button
              key={c.id}
              onClick={() => setCustomerId(c.id)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${customerId === c.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {[0, 5, 10, 15].map((d) => (
            <button
              key={d}
              onClick={() => setDiscount(d)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${discount === d ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}
            >
              {d === 0 ? 'None' : `${d}%`}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {(['cash', 'upi', 'card'] as Tender[]).map((td) => (
            <button
              key={td}
              onClick={() => setTender(td)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase ${tender === td ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}
            >
              {td}
            </button>
          ))}
        </div>

        <div className="border-t border-[var(--border)] pt-3 flex flex-col gap-1 text-[13px]">
          <div className="flex justify-between text-[var(--text-2)]">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          {discountAmt > 0 && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Discount {discount}%</span>
              <span>−{formatINR(discountAmt)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
        </div>

        {error && <p className="text-[13px] text-red-500">{error}</p>}

        <button
          onClick={() => void checkout()}
          disabled={cart.length === 0}
          className="rounded-xl bg-[var(--primary)] text-white font-bold text-[15px] py-3 disabled:opacity-40"
        >
          Checkout · {formatINR(total)}
        </button>
      </div>

      {receipt && shop && (
        <Receipt
          bill={receipt}
          shop={shop}
          customerName={customers.find((c) => c.id === receipt.customerId)?.name}
          onDone={() => {
            setReceipt(null)
            searchRef.current?.focus()
          }}
        />
      )}
    </div>
  )
}
