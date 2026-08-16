/**
 * App-wide session state: who is signed in, which shop, and the sync
 * worker's pending count. Screens read this instead of calling the api
 * ad hoc, so a login/logout or a drained outbox re-renders everything
 * that cares.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import type { Shop } from '@kadai-os/core'
import type { Session } from '@kadai-os/api'

import { api } from './api'
import { pendingCount, startSyncWorker } from './outbox'

interface SessionState {
  session: Session | null
  shop: Shop | null
  loading: boolean
  pending: number
  /** Bumps on every remote change in this shop — screens refetch when it moves. */
  version: number
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(0)
  const [version, setVersion] = useState(0)

  async function refresh() {
    const s = await api.getSession()
    setSession(s)
    setShop(s?.shopId ? await api.getShop(s.shopId).catch(() => null) : null)
    setPending(pendingCount())
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
    const stop = startSyncWorker(api)
    const timer = setInterval(() => setPending(pendingCount()), 2000)
    return () => {
      stop()
      clearInterval(timer)
    }
  }, [])

  // Live sync: realtime invalidations (and the outbox drain's mutations)
  // bump the version so screens refetch.
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
    <SessionContext.Provider value={{ session, shop, loading, pending, version, refresh, signOut }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>')
  return ctx
}
