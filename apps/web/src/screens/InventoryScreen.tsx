import { useState } from 'react'

const products = [
  { id: 1, name: 'Blue Denim Jacket', sku: 'BDJ-001', category: 'Jackets', price: 2499, cost: 1400, stock: 8, reorder: 5, emoji: '🧥' },
  { id: 2, name: 'White Linen Shirt', sku: 'WLS-001', category: 'Shirts', price: 899, cost: 420, stock: 2, reorder: 10, emoji: '👕' },
  { id: 3, name: 'Nike Air Max 270', sku: 'NAM-270', category: 'Footwear', price: 8999, cost: 5800, stock: 5, reorder: 3, emoji: '👟' },
  { id: 4, name: 'Floral Summer Dress', sku: 'FSD-022', category: 'Dresses', price: 1850, cost: 900, stock: 11, reorder: 8, emoji: '👗' },
  { id: 5, name: 'Black Slim Joggers', sku: 'BSJ-044', category: 'Bottoms', price: 1299, cost: 620, stock: 1, reorder: 10, emoji: '👖' },
  { id: 6, name: 'Canvas Tote Bag', sku: 'CTB-012', category: 'Accessories', price: 599, cost: 220, stock: 3, reorder: 15, emoji: '👜' },
  { id: 7, name: 'Oversized Hoodie', sku: 'OVH-009', category: 'Tops', price: 1999, cost: 980, stock: 14, reorder: 5, emoji: '🧥' },
  { id: 8, name: 'Leather Belt Brown', sku: 'LBB-003', category: 'Accessories', price: 549, cost: 200, stock: 7, reorder: 8, emoji: '⌚' },
]

export default function InventoryScreen() {
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [search, setSearch] = useState('')

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    if (filter === 'low') return matchSearch && p.stock > 0 && p.stock <= p.reorder
    if (filter === 'out') return matchSearch && p.stock === 0
    return matchSearch
  })

  const totalItems = products.reduce((s, p) => s + p.stock, 0)
  const totalValue = products.reduce((s, p) => s + p.stock * p.cost, 0)
  const lowCount = products.filter(p => p.stock > 0 && p.stock <= p.reorder).length

  const stockStatus = (p: typeof products[0]) => {
    if (p.stock === 0) return { label: 'Out', color: '#DC2626', bg: '#FEE2E2' }
    if (p.stock <= p.reorder) return { label: 'Low', color: '#92400E', bg: '#FEF3C7' }
    return { label: 'OK', color: '#166534', bg: '#DCFCE7' }
  }

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: -0.5 }}>Inventory</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '2px 0 0' }}>{products.length} products · {totalItems} units</p>
          </div>
          <button className="press-effect" style={{
            padding: '8px 14px', borderRadius: 10,
            background: 'var(--primary)', border: 'none',
            fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer'
          }}>+ Add</button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Stock Value', value: `₹${(totalValue / 1000).toFixed(0)}K` },
            { label: 'Total Units', value: totalItems },
            { label: 'Low Stock', value: lowCount, warn: lowCount > 0 },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface)',
              border: `1px solid ${(s as any).warn ? '#FDE68A' : 'var(--border)'}`,
              borderRadius: 12, padding: '10px 12px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '0 0 3px', fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: (s as any).warn ? '#92400E' : 'var(--text)', margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)',
          border: '1.5px solid var(--border-mid)',
          borderRadius: 14, padding: '0 14px',
          boxShadow: 'var(--shadow-sm)', marginBottom: 12
        }}>
          <span style={{ fontSize: 16, color: 'var(--text-3)' }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products or SKU…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, color: 'var(--text)', padding: '12px 0',
              fontFamily: 'Inter, sans-serif'
            }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['all', 'low', 'out'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: filter === f ? 'var(--primary)' : 'var(--surface)',
                color: filter === f ? '#fff' : 'var(--text-2)',
                border: `1px solid ${filter === f ? 'transparent' : 'var(--border)'}`,
                cursor: 'pointer'
              }}
            >
              {f === 'all' ? 'All' : f === 'low' ? `Low Stock (${lowCount})` : 'Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(p => {
          const status = stockStatus(p)
          const margin = Math.round(((p.price - p.cost) / p.price) * 100)
          return (
            <div key={p.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 14, padding: '14px 16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0
                }}>{p.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{p.name}</p>
                    <span style={{
                      fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 6px',
                      background: status.bg, color: status.color
                    }}>{status.label}</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '0 0 8px', fontFamily: 'monospace' }}>{p.sku}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: 0.3 }}>Price</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>₹{p.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: 0.3 }}>Stock</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: status.color, margin: 0 }}>{p.stock} units</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: 0.3 }}>Margin</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#22C55E', margin: 0 }}>{margin}%</p>
                    </div>
                  </div>

                  {/* Stock bar */}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ background: 'var(--surface-2)', borderRadius: 3, height: 3 }}>
                      <div style={{
                        width: `${Math.min((p.stock / (p.reorder * 2)) * 100, 100)}%`,
                        height: '100%', borderRadius: 3,
                        background: status.color,
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
