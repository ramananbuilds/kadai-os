/**
 * The single composition point for the web app's backend.
 *
 * Env vars present → the real Supabase driver. Absent → the in-memory
 * driver seeded with the prototype's demo data (sandbox / offline dev).
 * Screens import { api } and never know which one is running — that is
 * the whole point of the KadaiDriver seam.
 */

import { createKadaiApi, createMemoryDriver, createSupabaseDriver } from '@kadai-os/api'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const api = createKadaiApi(
  supabaseUrl && supabaseAnonKey
    ? createSupabaseDriver({ url: supabaseUrl, anonKey: supabaseAnonKey })
    : createMemoryDriver(),
)

export const backend = supabaseUrl && supabaseAnonKey ? 'supabase' : 'memory'
