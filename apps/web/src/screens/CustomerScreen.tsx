import { useState } from 'react'

const customers = [
  {
    id: 1,
    name: 'Priya Sharma',
    initials: 'PS',
    phone: '+91 98765 43210',
    tier: 'Platinum',
    tierColor: '#818CF8',
    tierBg: '#EEF2FF',
    points: 4820,
    lifetime: 142800,
    visits: 34,
    lastVisit: '2 days ago',
    rewards: [
      { name: '₹500 Off Next Purchase', expiry: 'Aug 20', used: false },
      { name: 'Free Delivery', expiry: 'Sep 1', used: false },
    ],
    history: [
      { date: 'Aug 3', items: 'Blue Denim Jacket + Linen Shirt', amount: 3398 },
      { date: 'Jul 28', items: 'Nike Air Max 270', amount: 8999 },
      { date: 'Jul 15', items: 'Floral Dress + Tote Bag', amount: 2449 },
    ],
    favorites: ['Blue Denim Jacket', 'Nike Air Max 270', 'Floral Summer Dress'],
  },
  {
    id: 2,
    name: 'Rohan Verma',
    initials: 'RV',
    phone: '+91 87654 32109',
    tier: 'Gold',
    tierColor: '#F59E0B',
    tierBg: '#FEF3C7',
    points: 2140,
    lifetime: 68400,
    visits: 18,
    lastVisit: '1 week ago',
    rewards: [
      { name: '10% Off Footwear', expiry: 'Aug 31', used: false },
    ],
    history: [
      { date: 'Jul 30', items: 'Nike Air Max 270', amount: 8999 },
      { date: 'Jul 10', items: 'Black Joggers + Belt', amount: 1848 },
    ],
    favorites: ['Nike Air Max 270', 'Black Slim Joggers'],
  },
  {
    id: 3,
    name: 'Aisha Khan',
    initials: 'AK',
    phone: '+91 76543 21098',
    tier: 'Silver',
    tierColor: '#64748B',
    tierBg: '#F1F5F9',
    points: 890,
    lifetime: 24600,
    visits: 8,
    lastVisit: 'Yesterday',
    rewards: [],
    history: [
      { date: 'Aug 4', items: 'Floral Summer Dress', amount: 1850 },
      { date: 'Jun 22', items: 'Canvas Tote Bag', amount: 599 },
    ],
    favorites: ['Floral Summer Dress', 'Canvas Tote Bag'],
  },
]

export default function CustomerScreen() {
  const [selected, setSelected] = useState<typeof customers[0] | null>(null)
  const [search, setSearch] = useState('')

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  if (selected) {
    const nextTierPoints = selected.tier === 'Silver' ? 2000 : selected.tier === 'Gold' ? 5000 : 10000
    const progress = Math.min(selected.points / nextTierPoints, 1)

    return (
      <div className="animate-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 96 }}>
        {/* Back */}
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setSelected(null)}
            className="press-effect"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 18, color: 'var(--text)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >‹</button>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Customer Profile</span>
        </div>

        {/* Membership Card (Apple Wallet style) */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{
            background: `linear-gradient(135deg, ${selected.tierColor}ee 0%, ${selected.tierColor} 100%)`,
            borderRadius: 22, padding: '22px 22px 18px',
            position: 'relative', overflow: 'hidden',
            boxShadow: `0 12px 40px ${selected.tierColor}55`
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ position: 'absolute', bottom: -30, left: -20, width: 100, height: 100, borderRadius: 50, background: 'rgba(255,255,255,0.06)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Shop OS · {selected.tier}
                </p>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
                  {selected.name}
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '4px 0 0' }}>
                  {selected.phone}
                </p>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 22,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff'
              }}>{selected.initials}</div>
            </div>

            {/* Points */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 14, overflow: 'hidden' }}>
              {[
                { label: 'Points', value: selected.points.toLocaleString() },
                { label: 'Visits', value: selected.visits },
                { label: 'Lifetime', value: `₹${(selected.lifetime / 1000).toFixed(0)}K` },
              ].map(m => (
                <div key={m.label} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 3px', fontWeight: 500 }}>{m.label}</p>
                  <p style={{ fontSize: 18, color: '#fff', margin: 0, fontWeight: 800 }}>{m.value}</p>
                </div>
              ))}
            </div>

            {/* Progress to next tier */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                  {selected.points.toLocaleString()} pts · {(nextTierPoints - selected.points).toLocaleString()} to next tier
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{Math.round(progress * 100)}%</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 4 }}>
                <div style={{
                  width: `${progress * 100}%`, height: '100%',
                  background: '#fff', borderRadius: 4,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Rewards */}
        {selected.rewards.length > 0 && (
          <div style={{ padding: '16px 20px 0' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Available Rewards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.rewards.map(r => (
                <div key={r.name} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--accent-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18
                  }}>🎁</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{r.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>Expires {r.expiry}</p>
                  </div>
                  <button style={{
                    padding: '6px 14px', borderRadius: 8,
                    background: 'var(--accent)', border: 'none',
                    fontSize: 13, fontWeight: 600, color: '#fff',
                    cursor: 'pointer'
                  }}>Apply</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Products */}
        <div style={{ padding: '16px 20px 0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Favorites</h3>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {selected.favorites.map(f => (
              <div key={f} style={{
                whiteSpace: 'nowrap', padding: '8px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 20, fontSize: 13, fontWeight: 500,
                color: 'var(--text-2)',
                flexShrink: 0
              }}>❤️ {f}</div>
            ))}
          </div>
        </div>

        {/* Purchase History */}
        <div style={{ padding: '16px 20px 0' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Purchase History</h3>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {selected.history.map((h, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: i < selected.history.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16
                }}>🛍️</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{h.date}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{h.items}</p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>₹{h.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: -0.5 }}>Customers</h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '2px 0 0' }}>248 members · 36 active this week</p>
          </div>
          <button className="press-effect" style={{
            padding: '8px 14px', borderRadius: 10,
            background: 'var(--primary)', border: 'none',
            fontSize: 13, fontWeight: 600, color: '#fff',
            cursor: 'pointer'
          }}>+ Add</button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface)',
          border: '1.5px solid var(--border-mid)',
          borderRadius: 14, padding: '0 14px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: 16, color: 'var(--text-3)' }}>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent',
              fontSize: 15, color: 'var(--text)',
              padding: '12px 0',
              fontFamily: 'Inter, sans-serif'
            }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Platinum', count: 12, color: '#818CF8' },
          { label: 'Gold', count: 48, color: '#F59E0B' },
          { label: 'Silver', count: 188, color: '#64748B' },
        ].map(t => (
          <div key={t.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '10px 12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: t.color }} />
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)', margin: 0 }}>{t.label}</p>
            </div>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>{t.count}</p>
          </div>
        ))}
      </div>

      {/* Customer list */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(c => (
          <button
            key={c.id}
            className="press-effect"
            onClick={() => setSelected(c)}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 16, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              textAlign: 'left', cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)', width: '100%'
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 22,
              background: c.tierBg, border: `2px solid ${c.tierColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: c.tierColor,
              flexShrink: 0
            }}>{c.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{c.name}</p>
                <span style={{
                  fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 6px',
                  background: c.tierBg, color: c.tierColor
                }}>{c.tier}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
                {c.points.toLocaleString()} pts · Last visit {c.lastVisit}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px' }}>
                ₹{(c.lifetime / 1000).toFixed(0)}K
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{c.visits} visits</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
