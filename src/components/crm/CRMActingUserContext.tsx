'use client'

// The admin dashboard is gated by one shared x-admin-key, not per-user
// Supabase sessions (see AdminKeyContext) - there is no "logged in user" to
// derive sent_by/created_by/assigned_by from. This lets whoever is at the
// keyboard pick which crm_team member they're acting as, once, and reuses it
// across every CRM page for the rest of the session.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const ACTING_USER_STORAGE = 'elimux-crm-acting-user'

interface CRMActingUserContextValue {
  actingUserId: string
  setActingUserId: (value: string) => void
}

const CRMActingUserContext = createContext<CRMActingUserContextValue | null>(null)

export function CRMActingUserProvider({ children }: { children: ReactNode }) {
  const [actingUserId, setActingUserIdState] = useState('')

  useEffect(() => {
    const stored = window.sessionStorage.getItem(ACTING_USER_STORAGE)
    if (stored) setActingUserIdState(stored)
  }, [])

  function setActingUserId(value: string) {
    setActingUserIdState(value)
    window.sessionStorage.setItem(ACTING_USER_STORAGE, value)
  }

  return (
    <CRMActingUserContext.Provider value={{ actingUserId, setActingUserId }}>
      {children}
    </CRMActingUserContext.Provider>
  )
}

export function useCRMActingUser() {
  const ctx = useContext(CRMActingUserContext)
  if (!ctx) throw new Error('useCRMActingUser must be used within CRMActingUserProvider')
  return ctx
}
