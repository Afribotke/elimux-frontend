import { NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'
import { handleUpload, resolveInviteRedirect } from "@/lib/eligibility-upload/handler"
import {
  createAccountLookupPort, createAuthPort, createEligibilityPort,
} from "@/lib/eligibility-upload/supabase-adapters"

// Up to 100 rows, each with sequential invite/lookup/insert calls.
export const maxDuration = 60

// Server-side log: event + row numbers / error codes only (no emails, names or rows).
const log = (event: string, details: Record<string, string | number | boolean>) =>
  console.error(`[eligibility-upload] ${event}`, details)

export async function POST(request: Request) {
  const { createClient: createServiceClient } = await import("@supabase/supabase-js")
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const result = await handleUpload({
    async getVerifiedUser() {
      const supabaseAuth = await createClient()
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
      if (authError || !user) return null
      return { id: user.id }
    },

    // AUTHORIZATION (admin-trust hotfix, PR #8 - unchanged): the ONLY path is
    // an active institution_accounts row for the verified user. No
    // users.role / user_metadata.role fallback (user_metadata is writable by
    // the user). institution_accounts.user_id is UNIQUE (elimux-sql
    // 21_institution_accounts.sql), so maybeSingle() cannot see multiple
    // rows; any lookup error is a deny.
    async getActiveInstitution(userId) {
      const { data: account, error: accountError } = await supabase
        .from('institution_accounts')
        .select('institution_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
      if (accountError) return { error: true }
      return account?.institution_id ? { institutionId: account.institution_id as string } : null
    },

    readJson: () => request.json(),

    inviteRedirectUrl: resolveInviteRedirect({
      SITE_URL: process.env.SITE_URL,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    }),

    makePorts: () => ({
      eligibility: createEligibilityPort(supabase, log),
      auth: createAuthPort(supabase, log),
      accounts: createAccountLookupPort(supabase, log),
    }),

    log,
  })

  return NextResponse.json(result.body, { status: result.status })
}
