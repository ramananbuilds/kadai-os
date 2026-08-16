import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { backend } from './lib/api'
import { SessionProvider, useSession } from './lib/session'

import Login from './pages/Login'
import NewShop from './pages/NewShop'
import Home from './pages/Home'
import Bill from './pages/Bill'
import Customers from './pages/Customers'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import Rewards from './pages/Rewards'
import Settings from './pages/Settings'

const nav = [
  { to: '/', label: 'Home', icon: '🏠', end: true },
  { to: '/bill', label: 'Bill', icon: '🧾' },
  { to: '/customers', label: 'Members', icon: '👥' },
  { to: '/inventory', label: 'Stock', icon: '📦' },
  { to: '/reports', label: 'Reports', icon: '📊' },
  { to: '/rewards', label: 'Rewards', icon: '🎁' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

/** Authed shell: sidebar on desktop, bottom tabs on small screens. */
function Shell({ children }: { children: React.ReactNode }) {
  const { shop, signOut } = useSession()
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-[10px] bg-[var(--primary)] text-white grid place-items-center text-sm font-bold shrink-0">
          K
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-bold leading-tight truncate">{shop?.name ?? 'Kadai OS'}</p>
          <p className="text-[11px] text-[var(--text-2)] leading-tight">
            Shop OS · {backend === 'memory' ? 'demo backend' : 'live'} · full parity + back-office
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => void signOut()}
          className="text-[13px] font-semibold text-[var(--text-2)] hover:text-[var(--primary)] px-2 py-1"
        >
          Sign out
        </button>
      </header>

      <div className="flex-1 flex">
        <nav className="hidden md:flex flex-col gap-1 w-52 shrink-0 border-r border-[var(--border)] p-3 sticky top-[57px] self-start">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'
                }`
              }
            >
              <span>{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 min-w-0 px-4 sm:px-6 py-5 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur flex pb-[env(safe-area-inset-bottom)]">
        {nav.slice(0, 5).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-semibold ${
                isActive ? 'text-[var(--primary)]' : 'text-[var(--text-2)]'
              }`
            }
          >
            <span className="text-lg leading-none">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
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
        <Route path="/" element={<Gate><Home /></Gate>} />
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
