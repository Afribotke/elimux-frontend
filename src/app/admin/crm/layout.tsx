'use client'

import { useEffect, useState } from 'react'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { CRMActingUserProvider, useCRMActingUser } from '@/components/crm/CRMActingUserContext'
import { getCRMTeam, type CRMTeamMember } from '@/lib/crm-api'
import { UserCircle2 } from 'lucide-react'

function ActingUserBar() {
  const { adminKey } = useAdminKey()
  const { actingUserId, setActingUserId } = useCRMActingUser()
  const [team, setTeam] = useState<CRMTeamMember[]>([])

  useEffect(() => {
    if (!adminKey) return
    getCRMTeam(adminKey)
      .then((members) => {
        setTeam(members)
        // Auto-pick when there's exactly one team member (true today - just
        // the seeded super_admin) so nobody has to select anything to start.
        if (!actingUserId && members.length === 1) setActingUserId(members[0].user_id)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey])

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 mb-4 text-sm">
      <UserCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground shrink-0">Acting as:</span>
      <select
        value={actingUserId}
        onChange={(e) => setActingUserId(e.target.value)}
        className="rounded-md border border-border bg-background px-2 py-1 text-sm flex-1 max-w-xs"
      >
        <option value="">— select who you are —</option>
        {team.map((m) => (
          <option key={m.user_id} value={m.user_id}>
            {m.user?.name || m.user?.email || m.user_id} ({m.role})
          </option>
        ))}
      </select>
      {!actingUserId && (
        <span className="text-xs text-amber-600">Required to send messages or log actions under your name</span>
      )}
    </div>
  )
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMActingUserProvider>
      <div className="space-y-0">
        <ActingUserBar />
        {children}
      </div>
    </CRMActingUserProvider>
  )
}
