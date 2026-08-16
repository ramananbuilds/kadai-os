import { useState } from 'react'

const weekData = [
  { day: 'Mon', value: 32400, bills: 61 },
  { day: 'Tue', value: 41200, bills: 78 },
  { day: 'Wed', value: 38800, bills: 72 },
  { day: 'Thu', value: 52100, bills: 94 },
  { day: 'Fri', value: 67300, bills: 118 },
  { day: 'Sat', value: 89400, bills: 152 },
  { day: 'Sun', value: 48200, bills: 87 },
]

const maxVal = Math.max(...weekData.map(d => d.value))

interface MoreScreenProps {
  dark: boolean
  onToggleDark: () => void
}

export default function MoreScreen({ dark, onToggleDark }: MoreScreenProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'rewards' | 'settings'>('analytics')

  return (
    <div className="animate-fade-in" style={{ background: 'var(--bg)', minHeight: '100%', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 16px', letterSpacing: -0.5 }}>More</h1>

        {/* Sub tabs */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          background: 'var(--surface-2)',
          borderRadius: 12, padding: 4, marginBottom: 20,
          border: '1px solid var(--border)'
        }}>
          {(['analytics', 'rewards', 'settings'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: '8px 4px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: activeTab === t ? 'var(--surface)' : 'transparent',
                color: activeTab === t ? 'var(--text)' : 'var(--text-2)',
                border: 'none', cursor: 'pointer', textTransform: 'capitalize',
                boxShadow: activeTab === t ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {t === 'analytics' ? '📊' : t === 'rewards' ? '🎁' : '⚙️'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'analytics' && <AnalyticsTab />}
      {activeTab === 'rewards' && <RewardsTab />}
      {activeTab === 'settings' && <SettingsTab dark={dark} onToggleDark={onToggleDark} />}
    </div>
  )
}

function AnalyticsTab() {
  return (
    <div style={{ padding: '0 20px' }}>
      {/* Weekly total */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '18px 18px 16px', marginBottom: 16,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 }}>This Week</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: -1 }}>₹3,69,400</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 18px' }}>
          <span style={{ color: '#22C55E', fontWeight: 600 }}>+18.4%</span> vs last week · 662 bills
        </p>

        {/* Bar chart */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {weekData.map((d, i) => (
            <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${(d.value / maxVal) * 72}px`,
                background: i === 5 ? 'var(--primary)' : 'var(--surface-2)',
                transition: 'height 0.4s ease',
                position: 'relative',
                minHeight: 4
              }} />
              <p style={{ fontSize: 9, color: i === 5 ? 'var(--primary)' : 'var(--text-3)', margin: 0, fontWeight: i === 5 ? 700 : 400 }}>{d.day}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Avg. Bill Value', value: '₹558', change: '+4.2%', up: true },
          { label: 'Top Category', value: 'Footwear', change: '32% revenue', up: true },
          { label: 'UPI Payments', value: '74%', change: '↑ from 68%', up: true },
          { label: 'Returns', value: '6 items', change: '₹12,400', up: false },
        ].map(m => (
          <div key={m.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <p style={{ fontSize: 11, color: 'var(--text-2)', margin: '0 0 4px', fontWeight: 500 }}>{m.label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: '0 0 3px' }}>{m.value}</p>
            <p style={{ fontSize: 11, color: m.up ? '#22C55E' : '#EF4444', margin: 0, fontWeight: 600 }}>{m.change}</p>
          </div>
        ))}
      </div>

      {/* Top Products */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Top Selling Products</p>
        </div>
        {[
          { name: 'Nike Air Max 270', revenue: '₹1,34,985', units: 15, share: 85 },
          { name: 'Blue Denim Jacket', revenue: '₹74,970', units: 30, share: 62 },
          { name: 'Oversized Hoodie', revenue: '₹55,972', units: 28, share: 44 },
          { name: 'Floral Summer Dress', revenue: '₹38,850', units: 21, share: 31 },
        ].map((p, i) => (
          <div key={p.name} style={{
            padding: '12px 16px',
            borderBottom: i < 3 ? '1px solid var(--border)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 1px' }}>{p.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{p.units} units sold</p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{p.revenue}</p>
            </div>
            <div style={{ background: 'var(--surface-2)', borderRadius: 3, height: 3 }}>
              <div style={{
                width: `${p.share}%`, height: '100%', borderRadius: 3,
                background: 'var(--primary)'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RewardsTab() {
  return (
    <div style={{ padding: '0 20px' }}>
      {/* Program overview */}
      <div style={{
        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        borderRadius: 20, padding: '20px',
        marginBottom: 16,
        boxShadow: '0 8px 32px rgba(34,197,94,0.3)'
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: '0 0 6px', letterSpacing: 1, textTransform: 'uppercase' }}>
          Loyalty Program
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: -0.5 }}>
          248 Active Members
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Points Issued', value: '4,82,400' },
            { label: 'Rewards Redeemed', value: '₹24,800' },
          ].map(m => (
            <div key={m.label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 3px' }}>{m.label}</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tier config */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Tier Configuration</h3>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
        marginBottom: 16
      }}>
        {[
          { tier: 'Silver', range: '0 – 2,000 pts', perks: '1 pt per ₹10 · Birthday reward', color: '#64748B' },
          { tier: 'Gold', range: '2,000 – 5,000 pts', perks: '1.5x pts · 10% off on footwear', color: '#F59E0B' },
          { tier: 'Platinum', range: '5,000+ pts', perks: '2x pts · Free shipping · VIP access', color: '#818CF8' },
        ].map((t, i) => (
          <div key={t.tier} style={{
            display: 'flex', gap: 12, padding: '14px 16px',
            borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
            alignItems: 'flex-start'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: t.color, marginTop: 4, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{t.tier}</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{t.range}</p>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{t.perks}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active rewards */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px' }}>Active Promotions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { name: 'Weekend Bonanza', desc: '2x points Sat & Sun', status: 'Active', expires: 'Repeating' },
          { name: 'New Member Welcome', desc: '₹200 off first purchase', status: 'Active', expires: 'Ongoing' },
          { name: 'Monsoon Sale', desc: '15% off all dresses', status: 'Scheduled', expires: 'Aug 10–20' },
        ].map(r => (
          <div key={r.name} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: r.status === 'Active' ? 'var(--accent-soft)' : 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
            }}>🎁</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 2px' }}>{r.name}</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{r.desc} · {r.expires}</p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: r.status === 'Active' ? 'var(--accent-soft)' : 'var(--surface-2)',
              color: r.status === 'Active' ? '#166534' : 'var(--text-3)'
            }}>{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsTab({ dark, onToggleDark }: { dark: boolean; onToggleDark: () => void }) {
  const sections = [
    {
      title: 'Store',
      items: [
        { icon: '🏪', label: 'Store Profile', sub: 'Ravi Fashion, New Delhi' },
        { icon: '💳', label: 'Payment Methods', sub: 'UPI, Cash, Card' },
        { icon: '🧾', label: 'GST & Tax', sub: 'GSTIN: 07AABCS1429B1ZP' },
        { icon: '🖨️', label: 'Receipt Printer', sub: 'Epson TM-T82 · Connected' },
      ]
    },
    {
      title: 'App',
      items: [
        { icon: '🌙', label: dark ? 'Light Mode' : 'Dark Mode', sub: 'Switch theme', toggle: true },
        { icon: '🔔', label: 'Notifications', sub: 'Low stock, daily reports' },
        { icon: '🌐', label: 'Language', sub: 'English (India)' },
        { icon: '💾', label: 'Data & Backup', sub: 'Last backup: 2 hours ago' },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: '👤', label: 'Profile', sub: 'Ravi Kumar · Owner' },
        { icon: '👥', label: 'Staff Access', sub: '3 staff members' },
        { icon: '🔐', label: 'Security', sub: 'PIN lock enabled' },
        { icon: '📞', label: 'Support', sub: 'Chat, call, email' },
      ]
    }
  ]

  return (
    <div style={{ padding: '0 20px' }}>
      {/* Store badge */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24
        }}>🏪</div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', margin: '0 0 2px' }}>Ravi Fashion</p>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>Karol Bagh, New Delhi · Shop OS Pro</p>
        </div>
      </div>

      {sections.map(sec => (
        <div key={sec.title} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4 }}>
            {sec.title}
          </p>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
          }}>
            {sec.items.map((item, i) => (
              <button
                key={item.label}
                className="press-effect"
                onClick={item.toggle ? onToggleDark : undefined}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 16px',
                  borderBottom: i < sec.items.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'var(--surface-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0
                }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 1px' }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>{item.sub}</p>
                </div>
                {item.toggle ? (
                  <div style={{
                    width: 42, height: 24, borderRadius: 12,
                    background: dark ? 'var(--primary)' : 'var(--surface-2)',
                    position: 'relative', transition: 'background 0.2s',
                    border: '1px solid var(--border-mid)'
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, left: dark ? 20 : 3,
                      width: 16, height: 16, borderRadius: 8,
                      background: dark ? '#fff' : 'var(--text-3)',
                      transition: 'left 0.2s ease'
                    }} />
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-3)', fontSize: 18 }}>›</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
