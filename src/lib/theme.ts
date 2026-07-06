'use client'

import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'elimux-theme'

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : getSystemTheme()
}

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Fixed default matches what the static build (no `window`) and the
  // pre-hydration bootstrap script both assume, so the first client
  // render matches server output exactly - no hydration mismatch.
  const [theme, setTheme] = useState<Theme>('dark')

  // Sync to the real stored/system value after hydration completes.
  // The bootstrap script in layout.tsx already set the correct class
  // on <html> before paint, so this only updates React's own state
  // (e.g. the toggle button's icon) - a normal post-hydration update,
  // not part of the hydration diff.
  useEffect(() => {
    setTheme(getInitialTheme())
  }, [])

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      const root = document.documentElement
      root.classList.remove('dark', 'light')
      root.classList.add(next)
      window.localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return createElement(ThemeContext.Provider, { value: { theme, toggleTheme } }, children)
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
