import { useState } from 'react'

interface HomeScreenProps {
  dark: boolean
  onNavigate: (tab: string) => void
}

const insights = [
  { icon: '↑', text: 'Revenue up 23% vs last Tuesday', color: '#22C55E' },
  { icon: '⚡', text: '3 items running low — reorder now', color: '#F59E0B' },
  { icon: '★', text: 'Priya Sharma is your top customer this week', color: '#818CF8' },
]

const activity = [
  { name: 'Priya Sharma', item: 'Blue Denim Jacket + 2 items', time: '2m ago', amount: '₹4,280', avatar: 'PS' },
  { name: 'Rohan Verma', item: 'Nike Air Max 270', time: '14m ago', amount: '₹8,999', avatar: 'RV' },
  { name: 'Aisha Khan', item: 'Floral Summer Dress', time: '31m ago', amount: '₹1,850', avatar: 'AK' },
  { name: 'Dev Mehta', item: 'Levi\'s 511 Slim + Belt', time: '1h ago', amount: '₹3,440', avatar: 'DM' },
]

const lowStock = [
  { name: 'White Linen Shirt S', stock: 2, sku: 'WLS-001' },
  { name: 'Black Joggers M', stock: 1, sku: 'BJM-044' },
  { name: 'Canvas Tote Bag', stock: 3, sku: 'CTB-012' },
]

export default function HomeScreen({ dark, onNavigate }: HomeScreenProps) {
  const [insightIdx, setInsightIdx] = useState(0)

  return (
    <div
      className="animate-fade-in"
      style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 96 }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, margin: 0 }}>
              Wednesday, 5 Aug
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: '2px 0 0', letterSpacing: -0.5 }}>
              Good morning, Ravi
            </h1>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: 21,
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(79,70,229,0.35)'
          }}>R</div>
        </div>
      </div>

      {/* Today's Sales Card */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{
          background: 'var(--primary)',
          borderRadius: 20, padding: '20px 20px 18px',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(79,70,229,0.3)'
        }}>
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: 60,
            background: 'rgba(255,255,255,0.06)'
          }} />
          <div style={{
            position: 'absolute', bottom: -20, right: 20,
            width: 80, height: 80, borderRadius: 40,
            background: 'rgba(255,255,255,0.05)'
          }} />
          <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.65)', margin: 0, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Today's Revenue
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '6px 0 4px' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>₹</span>
            <span style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: -1.5, lineHeight: 1 }}>
              48,230
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            <span style={{ color: '#86EFAC', fontWeight: 600 }}>+23.4%</span> vs last Tuesday · 87 bills
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1, marginTop: 18,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12, overflow: 'hidden'
          }}>
            {[
              { label: 'Avg Bill', value: '₹554' },
              { label: 'UPI', value: '72%' },
              { label: 'Returns', value: '2' },
            ].map(m => (
              <div key={m.label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '0 0 2px', fontWeight: 500 }}>{m.label}</p>
                <p style={{ fontSize: 16, color: '#fff', margin: 0, fontWeight: 700 }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { icon: '⚡', label: 'Quick Bill', sub: 'Start billing', action: 'bill', primary: true },
            { icon: '📦', label: 'Barcode Scan', sub: 'Add to cart', action: 'inventory', primary: false },
            { icon: '👥', label: 'Customers', sub: '248 members', action: 'customers', primary: false },
            { icon: '📊', label: 'Reports', sub: 'View analytics', action: 'more', primary: false },
          ].map(q => (
            <button
              key={q.label}
              className="press-effect"
              onClick={() => onNavigate(q.action)}
              style={{
                background: q.primary ? 'var(--primary)' : 'var(--surface)',
                border: `1px solid ${q.primary ? 'transparent' : 'var(--border)'}`,
                borderRadius: 16,
                padding: '14px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: q.primary ? '0 4px 16px rgba(79,70,229,0.25)' : 'var(--shadow-sm)',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{q.icon}</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: q.primary ? '#fff' : 'var(--text)', margin: '0 0 2px' }}>{q.label}</p>
              <p style={{ fontSize: 12, color: q.primary ? 'rgba(255,255,255,0.65)' : 'var(--text-2)', margin: 0 }}>{q.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '14px 16px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          cursor: 'pointer'
        }} onClick={() => setInsightIdx((insightIdx + 1) % insights.length)}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0
          }}>✦</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', margin: '0 0 3px', letterSpacing: 0.3, textTransform: 'uppercase' }}>
              AI Insight
            </p>
            <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              {insights[insightIdx].text}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-end', marginBottom: 2 }}>
            {insights.map((_, i) => (
              <div key={i} style={{
                width: i === insightIdx ? 14 : 4, height: 4, borderRadius: 2,
                background: i === insightIdx ? 'var(--primary)' : 'var(--border-mid)',
                transition: 'width 0.2s ease'
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Recent Activity</h2>
          <button style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            See all
          </button>
        </div>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {activity.map((item, i) => (
            <div key={item.name} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                background: 'var(--primary-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                flexShrink: 0
              }}>{item.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{item.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.item}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px' }}>{item.amount}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Low Stock</h2>
            <div style={{
              background: '#FEF3C7', color: '#92400E',
              fontSize: 11, fontWeight: 700, borderRadius: 6,
              padding: '2px 7px'
            }}>3 items</div>
          </div>
          <button
            className="press-effect"
            onClick={() => onNavigate('inventory')}
            style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Reorder
          </button>
        </div>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {lowStock.map((item, i) => (
            <div key={item.sku} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < lowStock.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: 4,
                background: item.stock === 1 ? '#EF4444' : '#F59E0B',
                flexShrink: 0
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: '0 0 1px' }}>{item.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0, fontFamily: 'monospace' }}>{item.sku}</p>
              </div>
              <div style={{
                background: item.stock === 1 ? '#FEE2E2' : '#FEF3C7',
                color: item.stock === 1 ? '#DC2626' : '#92400E',
                fontSize: 12, fontWeight: 700, borderRadius: 7,
                padding: '3px 9px'
              }}>
                {item.stock} left
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
