'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'elimux-compare-selection'
export const MAX_COMPARE = 3

interface CompareContextValue {
  selectedIds: string[]
  isSelected: (id: string) => boolean
  canAddMore: boolean
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

// Mirrors AdminKeyContext's shape: sessionStorage-backed state shared via
// context, so checkboxes scattered across ProgramCard instances and the
// CompareDrawer bar all see the same live selection without prop drilling.
export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY)
      if (stored) setSelectedIds(JSON.parse(stored))
    } catch {
      // ignore malformed/unavailable storage
    }
  }, [])

  const persist = useCallback((ids: string[]) => {
    setSelectedIds(ids)
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [])

  const toggle = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : prev.length < MAX_COMPARE
            ? [...prev, id]
            : prev
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const remove = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = prev.filter((x) => x !== id)
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => persist([]), [persist])

  return (
    <CompareContext.Provider
      value={{
        selectedIds,
        isSelected: (id: string) => selectedIds.includes(id),
        canAddMore: selectedIds.length < MAX_COMPARE,
        toggle,
        remove,
        clear,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompareSelection() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompareSelection must be used within CompareProvider')
  return ctx
}
