/** Web session context — mirrors the mobile app's. */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import type { Shop } from '@kadai-os/core'
import type { Session } from '@kadai-os/api'

import { api } from './api'

interface SessionState {
  session: Session | null
  shop: Shop | null
  loading: boolean
  /** Bumps on every remote change in this shop — pages refetch when it moves. */
  version: number
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  async function refresh() {
    const s = await api.getSession()
    setSession(s)
    setShop(s?.shopId ? await api.getShop(s.shopId).catch(() => null) : null)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  // Live sync: another device's bill, a back-office edit, an outbox drain —
  // all arrive as invalidation signals that bump the version.
  useEffect(() => {
    const shopId = shop?.id
    if (!shopId) return
    return api.subscribe(shopId, () => setVersion((v) => v + 1))
  }, [shop?.id])

  async function signOut() {
    await api.signOut()
    setSession(null)
    setShop(null)
  }

  return (
    <SessionContext.Provider value={{ session, shop, loading, version, refresh, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
