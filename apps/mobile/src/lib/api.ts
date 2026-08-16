/**
 * The mobile app's single backend composition point (web's twin).
 * EXPO_PUBLIC_* env vars → Supabase driver; absent → seeded memory driver
 * so the app demos fully offline with the prototype's data.
 */

import { createKadaiApi, createMemoryDriver, createSupabaseDriver } from '@kadai-os/api'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const api = createKadaiApi(
  supabaseUrl && supabaseAnonKey
    ? createSupabaseDriver({ url: supabaseUrl, anonKey: supabaseAnonKey })
    : createMemoryDriver({ devOtp: '123456' }),
)

export const backend = supabaseUrl && supabaseAnonKey ? 'supabase' : 'memory'
