// Request handling for POST /api/institutions/attachment/upload (Slice C).
// Framework-free so authorization is runtime-tested. route.ts supplies the
// production adapters, which make the SAME queries PR #8 made:
//   identity:  cookie session -> supabase.auth.getUser()
//   authz:     institution_accounts.institution_id WHERE user_id = <verified id>
//              AND status = 'active' (maybeSingle; any error or no row = deny)
// Status codes and messages are unchanged from PR #8 (401 / 403).
// No upload path reads user_metadata.role or users.role.
import { uploadRequestSchema } from "./schema"
import { ProcessDeps, UploadOutcome, processUpload } from "./process"

export type InstitutionLookup = { institutionId: string } | { error: true } | null

export interface HandlerDeps {
  /** Verified user from the session, or null. */
  getVerifiedUser(): Promise<{ id: string } | null>
  /** Active institution_accounts row for the verified user id. */
  getActiveInstitution(userId: string): Promise<InstitutionLookup>
  /** Parsed JSON body; throws on malformed JSON. */
  readJson(): Promise<unknown>
  /** From server env only (see resolveInviteRedirect). */
  inviteRedirectUrl: string | null
  /** Data/auth ports, built only after authorization succeeds. */
  makePorts(): Pick<ProcessDeps, "eligibility" | "auth" | "accounts">
  log?: ProcessDeps["log"]
}

export interface HandlerResponse { status: number; body: Record<string, unknown> }

export async function handleUpload(deps: HandlerDeps): Promise<HandlerResponse> {
  // ---- authorization (PR #8 semantics, unchanged) ----
  let user: { id: string } | null = null
  try { user = await deps.getVerifiedUser() } catch { user = null }
  if (!user) return { status: 401, body: { success: false, error: "Unauthorized" } }

  let account: InstitutionLookup = null
  try { account = await deps.getActiveInstitution(user.id) } catch { account = { error: true } }
  if (!account || "error" in account || !account.institutionId) {
    return { status: 403, body: { error: "Active institution account required" } }
  }
  const institutionId = account.institutionId // always the caller's own institution

  // ---- request envelope ----
  let body: unknown
  try { body = await deps.readJson() } catch {
    return { status: 400, body: { success: false, failed: 1, errors: [{ row: 0, code: "invalid", message: "Request body must be JSON" }] } }
  }
  const envelope = uploadRequestSchema.safeParse(body)
  if (!envelope.success) {
    const issue = envelope.error.issues[0]
    const message = issue?.code === "unrecognized_keys" ? "Unexpected field in request" : issue?.message ?? "Invalid request"
    return { status: 400, body: { success: false, failed: 1, errors: [{ row: 0, code: "invalid", message }] } }
  }

  if (!deps.inviteRedirectUrl) {
    deps.log?.("upload_misconfigured", { reason: "invite_redirect_missing" })
    return { status: 503, body: { success: false, error: "Upload is temporarily unavailable" } }
  }

  // ---- processing ----
  let outcome: UploadOutcome
  try {
    outcome = await processUpload(envelope.data.students, {
      institutionId,
      inviteRedirectUrl: deps.inviteRedirectUrl,
      ...deps.makePorts(),
      log: deps.log,
    })
  } catch {
    deps.log?.("upload_unexpected_error", { stage: "process" })
    return { status: 500, body: { success: false, error: "Upload failed" } }
  }

  const { summary } = outcome
  return {
    status: 200,
    body: {
      success: outcome.errors.length === 0,
      summary,
      // legacy fields read by the existing page
      created: summary.invited + summary.linked,
      failed: outcome.errors.length,
      results: outcome.results,
      errors: outcome.errors,
    },
  }
}

/**
 * Invite redirect from SERVER env only, never from the request.
 * Uses only the origin of SITE_URL (or NEXT_PUBLIC_SITE_URL) and always
 * appends /auth/reset-password. https required (http only for localhost).
 */
export function resolveInviteRedirect(env: { SITE_URL?: string; NEXT_PUBLIC_SITE_URL?: string }): string | null {
  const raw = (env.SITE_URL || env.NEXT_PUBLIC_SITE_URL || "").trim()
  if (!raw) return null
  let url: URL
  try { url = new URL(raw) } catch { return null }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1"
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) return null
  if (url.username || url.password) return null
  return `${url.origin}/auth/reset-password`
}
