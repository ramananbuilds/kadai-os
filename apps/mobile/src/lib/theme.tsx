/** Manual theme control: system / light / dark, persisted in the SQLite kv
 *  store. The shared tokens from @kadai-os/ui carry both palettes. */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'

import { kvGet, kvSet } from './outbox'

export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeState {
  dark: boolean
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeState>({ dark: false, mode: 'system', setMode: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemDark = useColorScheme() === 'dark'
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = kvGet('theme')
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  })

  useEffect(() => {
    kvSet('theme', mode)
  }, [mode])

  const dark = mode === 'system' ? systemDark : mode === 'dark'
  return <ThemeContext.Provider value={{ dark, mode, setMode }}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeState {
  return useContext(ThemeContext)
}
