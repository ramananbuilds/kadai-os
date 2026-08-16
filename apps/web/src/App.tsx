import { useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Gift,
  Home as HomeIcon,
  Monitor,
  Moon,
  Package,
  Receipt,
  Settings as SettingsIcon,
  Sun,
  Users,
} from 'lucide-react'

import { backend } from './lib/api'
import { SessionProvider, useSession } from './lib/session'
import { applyTheme, getThemeMode, type ThemeMode } from './lib/theme'

import Login from './pages/Login'
import NewShop from './pages/NewShop'
import TabbedApp from './screens/TabbedApp'
import Bill from './pages/Bill'
import Customers from './pages/Customers'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Rewards from './pages/Rewards'
import Settings from './pages/Settings'

const nav = [
  { to: '/', label: 'Home', Icon: HomeIcon, end: true },
  { to: '/bill', label: 'Bill', Icon: Receipt },
  { to: '/customers', label: 'Members', Icon: Users },
  { to: '/inventory', label: 'Stock', Icon: Package },
  { to: '/reports', label: 'Reports', Icon: BarChart3 },
  { to: '/rewards', label: 'Rewards', Icon: Gift },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

/** Cycles system → light → dark; the icon shows the current mode. */
function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(getThemeMode)
  const next: Record<ThemeMode, ThemeMode> = { system: 'light', light: 'dark', dark: 'system' }
  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor
  return (
    <button
      title={`Theme: ${mode}`}
      onClick={() => {
        const n = next[mode]
        setMode(n)
        applyTheme(n)
      }}
      className="w-9 h-9 grid place-items-center rounded-[10px] text-[var(--text-2)] hover:text-[var(--primary)] hover:bg-[var(--surface-2)] transition-colors"
    >
      <Icon size={18} />
    </button>
  )
}

/** Authed shell: sidebar on desktop, bottom tabs on small screens. */
function Shell({ children }: { children: React.ReactNode }) {
  const { shop, signOut } = useSession()
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[var(--primary)] text-white grid place-items-center text-sm font-bold shrink-0">K</div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight truncate">{shop?.name ?? 'Kadai OS'}</p>
          <p className="text-[11px] text-[var(--text-2)] leading-tight">
            Kadai OS · {backend === 'memory' ? 'demo backend' : 'live'} · full parity + back-office
          </p>
        </div>
        <div className="flex-1" />
        <ThemeToggle />
        <button
          onClick={() => void signOut()}
          className="text-[13px] font-semibold text-[var(--text-2)] hover:text-[var(--primary)] px-2 py-1"
        >
          Sign out
        </button>
      </header>

      <div className="flex-1 flex">
        <nav className="hidden md:flex flex-col gap-1 w-52 shrink-0 border-r border-[var(--border)] p-3 sticky top-[57px] self-start">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                }`
              }
            >
              <Icon size={17} strokeWidth={2} /> {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-5 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur flex pb-[env(safe-area-inset-bottom)]">
        {nav.slice(0, 5).map(({ to, label, Icon, end }) => {
          const isBill = to === '/bill'
          return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-2)]'
              } ${isBill ? '-mt-5' : ''}`
            }
          >
            {isBill ? (
              <span
                className={`w-[52px] h-[52px] rounded-[17px] grid place-items-center shadow-[0_4px_16px_rgba(0,0,0,0.18)] ${
                  label === 'Bill' ? 'bg-[var(--primary)] text-white shadow-[0_6px_20px_rgba(79,70,229,0.45)]' : 'bg-[var(--surface-2)]'
                }`}
              >
                <Icon size={22} strokeWidth={2} />
              </span>
            ) : (
              <Icon size={20} strokeWidth={2} />
            )}
            {label}
          </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

function Gate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[var(--bg)]">
        <p className="text-[var(--text-2)] text-sm animate-pulse">Loading Kadai OS…</p>
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!session.shopId) return <Navigate to="/new-shop" replace />
  return <Shell>{children}</Shell>
}

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/new-shop" element={<NewShop />} />
        <Route path="/" element={<Gate><TabbedApp /></Gate>} />
        <Route path="/bill" element={<Gate><Bill /></Gate>} />
        <Route path="/customers" element={<Gate><Customers /></Gate>} />
        <Route path="/inventory" element={<Gate><Inventory /></Gate>} />
        <Route path="/reports" element={<Gate><Reports /></Gate>} />
        <Route path="/rewards" element={<Gate><Rewards /></Gate>} />
        <Route path="/settings" element={<Gate><Settings /></Gate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionProvider>
  )
}
