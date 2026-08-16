/** Manual theme control: light / dark / system, persisted in localStorage.
 *  The .dark class flips the shared tokens from @kadai-os/ui. */

export type ThemeMode = 'system' | 'light' | 'dark'

export function getThemeMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('kadai-theme')
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return 'system'
  }
}

/** Applies the mode, persists it, returns whether dark is active. */
export function applyTheme(mode: ThemeMode): boolean {
  const dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('kadai-theme', mode)
  } catch {
    /* private browsing */
  }
  return dark
}
