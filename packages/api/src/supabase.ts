/**
 * Supabase driver — Phase 1–2. This file is the ONLY place in the entire
 * codebase where @supabase/supabase-js may be imported. The migration path
 * off Supabase (self-hosted Postgres, or a custom API server in front of
 * the same schema) is: reimplement this one file against KadaiDriver.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { KadaiDriver } from './driver'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export function createSupabaseDriver(config: SupabaseConfig): KadaiDriver {
  // Client construction proves the dependency and the seam. Domain calls
  // arrive with the SQL schema (Phase 1) and RPC layer (Phase 2).
  const _client: SupabaseClient = createClient(config.url, config.anonKey)
  void _client

  const todo = (method: string) => {
    throw new Error(
      `KadaiApi: supabase driver "${method}" is not implemented yet — it lands with the Phase 1–2 SQL schema and RPC layer.`,
    )
  }

  return new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (typeof prop === 'symbol') return undefined
      return () => todo(prop)
    },
  }) as unknown as KadaiDriver
}
