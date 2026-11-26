// Core of the eligibility upload (Slice C). Pure orchestration over injected
// ports - no Next.js, Supabase or network imports - so every rule is
// unit-testable with in-memory fakes.
//
// Rules (Kimi/founder decisions, 2026-11-26):
//  - registration_number is GLOBALLY unique; compared case-insensitively,
//    stored trimmed and as entered.
//  - A student may be listed by several institutions, but only under
//    different registration numbers.
//  - In-file duplicate registration number or email -> every row sharing it
//    fails (duplicate_in_file).
//  - Same reg + same email already at this institution -> already_listed
//    (success, no write; re-upload is idempotent).
//  - Reg already used anywhere else -> conflict (generic; never says where).
//  - Email already at this institution under another reg -> conflict.
//  - New email -> invite (no password, no email_confirm).
//  - Existing account -> linked only if the safe lookup port confirms
//    exactly one account; otherwise not_allowed. NEVER user_id = null.
//  - Compensation deletes only an account created in this request for this row.
import { UploadRow, emailKey, firstIssue, regKey, uploadRowSchema } from "./schema"

export interface ExistingListing {
  institution_id: string
  /** normalized (lowercase) email of the listing, if any */
  email: string | null
}

export interface EligibilityInsert {
  user_id: string
  institution_id: string
  student_name: string
  registration_number: string
  email: string
  course: string
  department: string
  year_of_study: number
  phone: string | null
  status: "eligible"
  attachment_status: "not_placed"
}

export interface EligibilityPort {
  /** Listings at ANY institution whose registration_number equals `registrationNumber` case-insensitively. */
  findByRegistrationNumber(registrationNumber: string): Promise<ExistingListing[]>
  /** Listings at THIS institution whose email equals `email` case-insensitively. */
  findByEmailAtInstitution(institutionId: string, email: string): Promise<ExistingListing[]>
  /** Unique violation: 'email_conflict' = the (institution, email) index;
   *  'conflict' = registration number (or any other / unrecognised unique key). */
  insert(row: EligibilityInsert): Promise<InsertOutcome>
}

export type InsertOutcome = "ok" | "conflict" | "email_conflict" | "error"

/** L-12: unique index on (institution_id, lower(btrim(email))) - draft SQL 63. */
export const EMAIL_UNIQUE_CONSTRAINT = "aes_institution_email_ci_key"

/** Classifies a Postgres 23505 by constraint name. Anything not positively the
 *  email index stays the generic registration-number conflict (current
 *  behaviour), so an unknown constraint never produces a misleading message. */
export function classifyUniqueViolation(err: { message?: string | null; details?: string | null }): "conflict" | "email_conflict" {
  const text = `${err.message ?? ""} ${err.details ?? ""}`
  return new RegExp(`"${EMAIL_UNIQUE_CONSTRAINT}"`).test(text) ? "email_conflict" : "conflict"
}

export type InviteResult =
  | { kind: "created"; userId: string }
  | { kind: "exists" }
  | { kind: "rate_limited" }
  | { kind: "failed" }

export interface AuthPort {
  /** Must call inviteUserByEmail (never createUser with a password / email_confirm). */
  invite(email: string, metadata: Record<string, string>, redirectTo: string): Promise<InviteResult>
  /** Compensation only. Returns false if the delete failed. */
  deleteUser(userId: string): Promise<boolean>
}

export type LookupResult = { kind: "found"; userId: string } | { kind: "none" } | { kind: "unavailable" }

export interface AccountLookupPort {
  /** 'found' only for exactly one auth account; 0 or 2+ -> 'none'; helper missing/error -> 'unavailable'. */
  findExactlyOneUserIdByEmail(email: string): Promise<LookupResult>
}

export type LogFn = (event: string, details: Record<string, string | number | boolean>) => void

export interface ProcessDeps {
  institutionId: string
  inviteRedirectUrl: string
  eligibility: EligibilityPort
  auth: AuthPort
  accounts: AccountLookupPort
  log?: LogFn
}

export type RowStatus = "invited" | "linked" | "already_listed"
export type ErrorCode =
  | "invalid" | "duplicate_in_file" | "conflict" | "not_allowed" | "retry_later" | "invite_failed" | "server_error"

export interface RowResult { row: number; status: RowStatus }
export interface RowError { row: number; field?: string; code: ErrorCode; message: string }

export interface UploadOutcome {
  results: RowResult[]
  errors: RowError[]
  summary: { received: number; invited: number; linked: number; already_listed: number; failed: number; retry_later: number }
}

export const MESSAGES = {
  dupReg: "Registration number appears more than once in this file",
  dupEmail: "Email appears more than once in this file",
  regInUse: "Registration number is already in use",
  emailHere: "This email is already listed at your institution under a different registration number",
  notAllowed: "This email can't be added. Ask the student to contact support.",
  retryLater: "Too many invitations right now. Upload this row again later.",
  inviteFailed: "Could not send the invitation for this row",
  serverError: "Could not save this row",
} as const

export async function processUpload(rawRows: unknown[], deps: ProcessDeps): Promise<UploadOutcome> {
  const log: LogFn = deps.log ?? (() => undefined)
  const results: RowResult[] = []
  const errors: RowError[] = []
  const rowErr = (row: number, code: ErrorCode, message: string, field?: string) =>
    errors.push(field ? { row, field, code, message } : { row, code, message })

  // ---- Phase 1: validate every row (no I/O) ----
  const valid: Array<{ row: number; data: UploadRow }> = []
  const invalidRows = new Set<number>()
  rawRows.forEach((raw, i) => {
    const row = i + 1
    const parsed = uploadRowSchema.safeParse(raw)
    if (parsed.success) valid.push({ row, data: parsed.data })
    else {
      invalidRows.add(row)
      const { field, message } = firstIssue(parsed.error)
      rowErr(row, "invalid", message, field)
    }
  })

  // ---- Phase 2: in-file duplicates (over ALL rows with a usable value) ----
  const regRows = new Map<string, number[]>()
  const emailRows = new Map<string, number[]>()
  rawRows.forEach((raw, i) => {
    const r = raw as Record<string, unknown> | null
    if (r && typeof r.registration_number === "string" && r.registration_number.trim()) {
      const k = regKey(r.registration_number)
      regRows.set(k, [...(regRows.get(k) ?? []), i + 1])
    }
    if (r && typeof r.email === "string" && r.email.trim()) {
      const k = emailKey(r.email)
      emailRows.set(k, [...(emailRows.get(k) ?? []), i + 1])
    }
  })
  const dupReg = new Set([...regRows.values()].filter(v => v.length > 1).flat())
  const dupEmail = new Set([...emailRows.values()].filter(v => v.length > 1).flat())

  // ---- Phase 3: per-row checks, account resolution, insert ----
  for (const { row, data } of valid) {
    if (dupReg.has(row)) { rowErr(row, "duplicate_in_file", MESSAGES.dupReg, "registration_number"); continue }
    if (dupEmail.has(row)) { rowErr(row, "duplicate_in_file", MESSAGES.dupEmail, "email"); continue }

    let createdUserId: string | null = null
    try {
      const email = emailKey(data.email)

      // Registration number: globally unique.
      const regMatches = await deps.eligibility.findByRegistrationNumber(data.registration_number)
      if (regMatches.length > 0) {
        const sameHere = regMatches.every(m => m.institution_id === deps.institutionId) &&
          regMatches.some(m => m.email === email)
        if (sameHere) results.push({ row, status: "already_listed" })
        else rowErr(row, "conflict", MESSAGES.regInUse, "registration_number")
        continue
      }

      // Email already at THIS institution under a different registration number.
      const emailHere = await deps.eligibility.findByEmailAtInstitution(deps.institutionId, email)
      if (emailHere.length > 0) { rowErr(row, "conflict", MESSAGES.emailHere, "email"); continue }

      // Account: invite new, or link an existing one via the safe lookup port.
      let userId: string
      let status: RowStatus
      const invite = await deps.auth.invite(
        email,
        { student_name: data.student_name, registration_number: data.registration_number, role: "student" },
        deps.inviteRedirectUrl
      )
      if (invite.kind === "created") {
        createdUserId = invite.userId
        userId = invite.userId
        status = "invited"
      } else if (invite.kind === "exists") {
        const found = await deps.accounts.findExactlyOneUserIdByEmail(email)
        if (found.kind !== "found") {
          log("upload_row_not_allowed", { row, lookup: found.kind })
          rowErr(row, "not_allowed", MESSAGES.notAllowed, "email")
          continue
        }
        userId = found.userId
        status = "linked"
      } else if (invite.kind === "rate_limited") {
        rowErr(row, "retry_later", MESSAGES.retryLater)
        continue
      } else {
        log("upload_row_invite_failed", { row })
        rowErr(row, "invite_failed", MESSAGES.inviteFailed)
        continue
      }

      if (!userId) throw new Error("missing user id") // defensive: never insert user_id = null

      const outcome = await deps.eligibility.insert({
        user_id: userId,
        institution_id: deps.institutionId,
        student_name: data.student_name,
        registration_number: data.registration_number,
        email,
        course: data.course,
        department: data.department,
        year_of_study: data.year_of_study,
        phone: data.phone ?? null,
        status: "eligible",
        attachment_status: "not_placed",
      })
      if (outcome === "ok") {
        results.push({ row, status })
        createdUserId = null // committed: nothing to compensate
        continue
      }
      await compensate(row, createdUserId, deps, log, rowErr, outcome === "error" ? null : outcome)
      createdUserId = null
    } catch {
      log("upload_row_exception", { row })
      await compensate(row, createdUserId, deps, log, rowErr, null)
    }
  }

  errors.sort((a, b) => a.row - b.row)
  results.sort((a, b) => a.row - b.row)
  const count = (s: RowStatus) => results.filter(r => r.status === s).length
  return {
    results,
    errors,
    summary: {
      received: rawRows.length,
      invited: count("invited"),
      linked: count("linked"),
      already_listed: count("already_listed"),
      failed: errors.filter(e => e.code !== "retry_later").length,
      retry_later: errors.filter(e => e.code === "retry_later").length,
    },
  }
}

/** Deletes ONLY an account created in this request for this row; never a pre-existing one. */
async function compensate(
  row: number,
  createdUserId: string | null,
  deps: ProcessDeps,
  log: LogFn,
  rowErr: (row: number, code: ErrorCode, message: string, field?: string) => void,
  conflict: "conflict" | "email_conflict" | null
) {
  if (createdUserId) {
    let ok = false
    try { ok = await deps.auth.deleteUser(createdUserId) } catch { ok = false }
    if (!ok) {
      // Needs manual cleanup: row number + account id only (no email/PII).
      log("upload_compensation_failed", { row, user_id: createdUserId })
      rowErr(row, "server_error", MESSAGES.serverError)
      return
    }
  }
  if (conflict === "email_conflict") rowErr(row, "conflict", MESSAGES.emailHere, "email")
  else if (conflict === "conflict") rowErr(row, "conflict", MESSAGES.regInUse, "registration_number")
  else rowErr(row, "server_error", MESSAGES.serverError)
}
