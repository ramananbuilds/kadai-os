import { useState } from 'react'
import HomeScreen from './HomeScreen'
import BillScreen from './BillScreen'
import CustomerScreen from './CustomerScreen'
import InventoryScreen from './InventoryScreen'
import MoreScreen from './MoreScreen'

type Tab = 'home' | 'bill' | 'customers' | 'inventory' | 'more'
type AppPhase = 'splash' | 'onboarding' | 'login' | 'app'

// Crisp SVG icon set for the tab bar
function IconHome({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M2 9.5L11 2L20 9.5V20C20 20.55 19.55 21 19 21H14V15H8V21H3C2.45 21 2 20.55 2 20V9.5Z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
        strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  )
}

function IconBill({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="1" width="16" height="20" rx="3"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      <path d="M7 7H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M7 11H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
      <path d="M7 15H11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

function IconCustomers({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="9" cy="7" r="4"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      <path d="M1 19C1 15.13 4.13 12 8 12H10C13.87 12 17 15.13 17 19"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round"
      />
      <path d="M15 5C16.66 5 18 6.34 18 8C18 9.66 16.66 11 15 11"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      />
      <path d="M19 19C19 16.79 17.21 15 15 15"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      />
    </svg>
  )
}

function IconInventory({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="3" width="18" height="16" rx="2.5"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      <path d="M2 8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M15 3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="11" cy="14" r="2.5" fill="currentColor" opacity={active ? 0.9 : 0.5}/>
    </svg>
  )
}

function IconMore({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="5" cy="11" r="1.8" fill="currentColor" opacity={active ? 1 : 0.6}/>
      <circle cx="11" cy="11" r="1.8" fill="currentColor" opacity={active ? 1 : 0.6}/>
      <circle cx="17" cy="11" r="1.8" fill="currentColor" opacity={active ? 1 : 0.6}/>
    </svg>
  )
}

const tabs: { id: Tab; label: string; Icon: React.ComponentType<{ active: boolean }> }[] = [
  { id: 'home', label: 'Home', Icon: IconHome },
  { id: 'bill', label: 'Bill', Icon: IconBill },
  { id: 'customers', label: 'Members', Icon: IconCustomers },
  { id: 'inventory', label: 'Stock', Icon: IconInventory },
  { id: 'more', label: 'More', Icon: IconMore },
]

function StatusBar({ dark }: { dark: boolean }) {
  const color = dark ? '#F8FAFC' : '#0F172A'
  return (
    <div style={{
      height: 54, flexShrink: 0,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      background: 'transparent',
      zIndex: 10, position: 'relative'
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>9:41</span>
      {/* Dynamic Island */}
      <div style={{
        position: 'absolute', top: 13, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 34, borderRadius: 20, background: '#000'
      }} />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {/* Signal */}
        <div style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
          {[6, 8, 10, 12].map((h, i) => (
            <div key={i} style={{
              width: 3, height: h, borderRadius: 1.5, background: color,
              opacity: i === 3 ? 0.35 : 1
            }} />
          ))}
        </div>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill={color}/>
          <path d="M4.5 7.5C5.8 6.2 6.8 5.5 8 5.5s2.2.7 3.5 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M1.5 5C3.5 3 5.6 2 8 2s4.5 1 6.5 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        </svg>
        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <div style={{
            width: 25, height: 12, borderRadius: 3,
            border: `1.5px solid ${color}`, padding: '2px',
            display: 'flex', alignItems: 'center'
          }}>
            <div style={{ width: '80%', height: '100%', borderRadius: 1, background: color }}/>
          </div>
          <div style={{ width: 2, height: 5, borderRadius: 1, background: color, opacity: 0.5 }}/>
        </div>
      </div>
    </div>
  )
}

export default function TabbedApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [dark, setDark] = useState(false)

  const navigate = (tab: string) => {
    if (tabs.some(t => t.id === tab)) setActiveTab(tab as Tab)
  }

  return (
    <div
      className={dark ? 'dark' : ''}
      style={{
        minHeight: '100vh',
        maxWidth: 520,
        margin: '0 auto',
        background: 'var(--bg)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      <div
        key={activeTab}
        className="animate-fade-in phone-scrollable"
        style={{ minHeight: 'calc(100vh - 90px)', paddingBottom: 96, position: 'relative' }}
      >
        {activeTab === 'home' && <HomeScreen dark={dark} onNavigate={navigate} />}
        {activeTab === 'bill' && <BillScreen />}
        {activeTab === 'customers' && <CustomerScreen />}
        {activeTab === 'inventory' && <InventoryScreen />}
        {activeTab === 'more' && <MoreScreen dark={dark} onToggleDark={() => setDark(d => !d)} />}
      </div>

      {/* Tab Bar — original Figma markup, pinned to viewport */}
      <div
        className="tab-bar-blur"
        style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 520, zIndex: 100,
          background: dark ? 'rgba(15,23,42,0.9)' : 'rgba(248,250,252,0.9)',
          borderTop: `1px solid ${dark ? 'rgba(248,250,252,0.06)' : 'rgba(15,23,42,0.06)'}`,
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          paddingTop: 8, paddingBottom: 20,
          paddingLeft: 6, paddingRight: 6,
        }}>
          {tabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            const isBill = id === 'bill'

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="press-effect"
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 4,
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {isBill ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, marginTop: -16 }}>
                    <div style={{
                      width: 54, height: 54, borderRadius: 18,
                      background: isActive ? 'var(--primary)' : dark ? '#1E293B' : '#FFFFFF',
                      border: `1.5px solid ${isActive ? 'transparent' : dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isActive
                        ? '0 6px 20px rgba(79,70,229,0.45), 0 2px 8px rgba(79,70,229,0.3)'
                        : '0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                      color: isActive ? '#fff' : dark ? '#94A3B8' : '#64748B',
                    }}>
                      <Icon active={isActive} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--primary)' : dark ? '#64748B' : '#94A3B8',
                      letterSpacing: 0.1, lineHeight: 1,
                    }}>{label}</span>
                  </div>
                ) : (
                  <>
                    <div style={{
                      width: 44, height: 36, borderRadius: 11,
                      background: isActive
                        ? (dark ? 'rgba(129,140,248,0.15)' : 'rgba(79,70,229,0.1)')
                        : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s ease',
                      color: isActive ? 'var(--primary)' : dark ? '#475569' : '#94A3B8',
                    }}>
                      <Icon active={isActive} />
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--primary)' : dark ? '#475569' : '#94A3B8',
                      letterSpacing: 0.1, lineHeight: 1,
                    }}>{label}</span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
