// SERVER-ONLY production adapters for the eligibility upload (Slice C).
// Uses the service-role client passed in by route.ts.
import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { AccountLookupPort, AuthPort, EligibilityPort, LogFn } from "./process"

/** SQL helper prepared (NOT applied) in elimux-sql; see the Slice C PR. */
export const LOOKUP_RPC = "eligibility_lookup_auth_users_by_email"

/** Escape LIKE metacharacters so ilike() is an exact, case-insensitive match.
 *  Schema validation already forbids * % and \ in these values; `_` is allowed and escaped. */
function likeExact(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")
}

export function createEligibilityPort(db: SupabaseClient, log: LogFn): EligibilityPort {
  return {
    async findByRegistrationNumber(registrationNumber) {
      const { data, error } = await db
        .from("attachment_eligible_students")
        .select("institution_id, email")
        .ilike("registration_number", likeExact(registrationNumber.trim()))
        .limit(20)
      if (error) { log("upload_query_failed", { query: "reg", code: error.code ?? "unknown" }); throw new Error("query failed") }
      return (data ?? []).map(r => ({
        institution_id: r.institution_id as string,
        email: typeof r.email === "string" ? r.email.trim().toLowerCase() : null,
      }))
    },

    async findByEmailAtInstitution(institutionId, email) {
      const { data, error } = await db
        .from("attachment_eligible_students")
        .select("institution_id, email")
        .eq("institution_id", institutionId)
        .ilike("email", likeExact(email))
        .limit(20)
      if (error) { log("upload_query_failed", { query: "email", code: error.code ?? "unknown" }); throw new Error("query failed") }
      return (data ?? []).map(r => ({
        institution_id: r.institution_id as string,
        email: typeof r.email === "string" ? r.email.trim().toLowerCase() : null,
      }))
    },

    async insert(row) {
      const { error } = await db.from("attachment_eligible_students").insert(row)
      if (!error) return "ok"
      if (error.code === "23505") return "conflict"
      log("upload_insert_failed", { code: error.code ?? "unknown" })
      return "error"
    },
  }
}

export function createAuthPort(db: SupabaseClient, log: LogFn): AuthPort {
  return {
    async invite(email, metadata, redirectTo) {
      // Invite only: Supabase creates an UNCONFIRMED account with NO password
      // and emails a link; the student sets a password on /auth/reset-password.
      const { data, error } = await db.auth.admin.inviteUserByEmail(email, { data: metadata, redirectTo })
      if (!error && data?.user?.id) return { kind: "created", userId: data.user.id }
      const code = (error as { code?: string } | null)?.code
      const status = (error as { status?: number } | null)?.status
      if (code === "email_exists" || code === "user_already_exists") return { kind: "exists" }
      if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || status === 429) {
        return { kind: "rate_limited" }
      }
      log("upload_invite_failed", { code: code ?? "unknown", status: status ?? 0 })
      return { kind: "failed" }
    },

    async deleteUser(userId) {
      const { error } = await db.auth.admin.deleteUser(userId)
      if (error) log("upload_delete_failed", { code: (error as { code?: string }).code ?? "unknown" })
      return !error
    },
  }
}

export function createAccountLookupPort(db: SupabaseClient, log: LogFn): AccountLookupPort {
  return {
    async findExactlyOneUserIdByEmail(email) {
      // The helper may not be deployed yet. Any error (incl. "function not
      // found") => 'unavailable' => the row gets the generic not_allowed error.
      const { data, error } = await db.rpc(LOOKUP_RPC, { p_emails: [email] })
      if (error) {
        log("upload_lookup_unavailable", { code: error.code ?? "unknown" })
        return { kind: "unavailable" }
      }
      const rows = (Array.isArray(data) ? data : []) as Array<{ user_id?: unknown; email?: unknown }>
      const matches = rows.filter(r => typeof r.user_id === "string" && r.email === email)
      return matches.length === 1 ? { kind: "found", userId: matches[0].user_id as string } : { kind: "none" }
    },
  }
}
