'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const ADMIN_KEY_STORAGE = 'elimux-admin-key'

interface AdminKeyContextValue {
  adminKey: string
  setAdminKey: (value: string) => void
}

const AdminKeyContext = createContext<AdminKeyContextValue | null>(null)

export function AdminKeyProvider({ children }: { children: ReactNode }) {
  const [adminKey, setAdminKeyState] = useState('')

  useEffect(() => {
    const stored = window.sessionStorage.getItem(ADMIN_KEY_STORAGE)
    if (stored) setAdminKeyState(stored)
  }, [])

  function setAdminKey(value: string) {
    setAdminKeyState(value)
    window.sessionStorage.setItem(ADMIN_KEY_STORAGE, value)
  }

  return <AdminKeyContext.Provider value={{ adminKey, setAdminKey }}>{children}</AdminKeyContext.Provider>
}

export function useAdminKey() {
  const ctx = useContext(AdminKeyContext)
  if (!ctx) throw new Error('useAdminKey must be used within AdminKeyProvider')
  return ctx
}
