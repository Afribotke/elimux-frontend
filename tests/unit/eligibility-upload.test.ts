// Slice C unit tests: eligibility upload hardening.
// Synthetic data only (example.test addresses, fake UUIDs). In-memory fakes
// for every port. No Supabase, no network, no email, no credentials.
import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { handleUpload, resolveInviteRedirect, HandlerDeps } from "../../src/lib/eligibility-upload/handler"
import { MESSAGES, EligibilityInsert, InviteResult, LookupResult } from "../../src/lib/eligibility-upload/process"

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`
const IA = id(100), IB = id(101)
const INST_USER_A = id(1), NO_INST_USER = id(2), META_ADMIN_USER = id(3)
const REDIRECT = "https://www.example.test/auth/reset-password"

// ---------------- in-memory state ----------------
type Listing = { institution_id: string; registration_number: string; email: string | null; user_id: string | null }
let listings: Listing[]
let inserted: EligibilityInsert[]
let insertOutcome: Map<string, "conflict" | "error"> // keyed by lowercase reg
let throwOnLookupReg: Set<string>
let authAccounts: Map<string, string> // email -> user id (pre-existing accounts)
let inviteCalls: Array<{ email: string; metadata: Record<string, string>; redirectTo: string; extra: number }>
let inviteBehavior: Map<string, InviteResult["kind"]>
let deleted: string[]
let deleteFails: Set<string>
let lookupMode: "rpc" | "unavailable"
let lookupDuplicates: Set<string> // emails the helper would report twice (2+ accounts)
let logs: string[]
let nextUserNo: number
let portsBuilt: number

beforeEach(() => {
  listings = [
    // Institution B already lists these
    { institution_id: IB, registration_number: "UNI-B/001", email: "shared@example.test", user_id: id(500) },
    { institution_id: IB, registration_number: "UNI-B/002", email: "bonly@example.test", user_id: id(501) },
    // Institution A already lists this one
    { institution_id: IA, registration_number: "COM/001/2026", email: "listed@example.test", user_id: id(502) },
  ]
  inserted = []
  insertOutcome = new Map()
  throwOnLookupReg = new Set()
  authAccounts = new Map([["shared@example.test", id(500)], ["bonly@example.test", id(501)], ["listed@example.test", id(502)], ["loner@example.test", id(503)]])
  inviteCalls = []
  inviteBehavior = new Map()
  deleted = []
  deleteFails = new Set()
  lookupMode = "rpc"
  lookupDuplicates = new Set()
  logs = []
  nextUserNo = 900
  portsBuilt = 0
})

function makeDeps(over: Partial<HandlerDeps> & { body?: unknown; userId?: string | null } = {}): HandlerDeps {
  const userId = over.userId === undefined ? INST_USER_A : over.userId
  return {
    getVerifiedUser: over.getVerifiedUser ?? (async () => (userId ? { id: userId } : null)),
    getActiveInstitution: over.getActiveInstitution ?? (async (uid: string) => (uid === INST_USER_A ? { institutionId: IA } : null)),
    readJson: over.readJson ?? (async () => over.body),
    inviteRedirectUrl: over.inviteRedirectUrl === undefined ? REDIRECT : over.inviteRedirectUrl,
    log: (event, details) => { logs.push(`${event} ${JSON.stringify(details)}`) },
    makePorts: over.makePorts ?? (() => {
      portsBuilt++
      return {
        eligibility: {
          async findByRegistrationNumber(reg: string) {
            if (throwOnLookupReg.has(reg.toLowerCase())) throw new Error('pg: relation "secret_internal" does not exist')
            return listings.filter(l => l.registration_number.toLowerCase() === reg.trim().toLowerCase())
              .map(l => ({ institution_id: l.institution_id, email: l.email?.toLowerCase() ?? null }))
          },
          async findByEmailAtInstitution(inst: string, email: string) {
            return listings.filter(l => l.institution_id === inst && l.email?.toLowerCase() === email.toLowerCase())
              .map(l => ({ institution_id: l.institution_id, email: l.email }))
          },
          async insert(row: EligibilityInsert) {
            const forced = insertOutcome.get(row.registration_number.toLowerCase())
            if (forced) return forced
            inserted.push(row)
            listings.push({ institution_id: row.institution_id, registration_number: row.registration_number, email: row.email, user_id: row.user_id })
            return "ok" as const
          },
        },
        auth: {
          async invite(email: string, metadata: Record<string, string>, redirectTo: string, ...rest: unknown[]) {
            inviteCalls.push({ email, metadata, redirectTo, extra: rest.length })
            const forced = inviteBehavior.get(email)
            if (forced === "rate_limited") return { kind: "rate_limited" } as InviteResult
            if (forced === "failed") return { kind: "failed" } as InviteResult
            if (authAccounts.has(email)) return { kind: "exists" } as InviteResult
            const uid = id(nextUserNo++)
            authAccounts.set(email, uid)
            return { kind: "created", userId: uid } as InviteResult
          },
          async deleteUser(uid: string) {
            if (deleteFails.has(uid)) return false
            deleted.push(uid)
            for (const [e, v] of authAccounts) if (v === uid) authAccounts.delete(e)
            return true
          },
        },
        accounts: {
          async findExactlyOneUserIdByEmail(email: string): Promise<LookupResult> {
            if (lookupMode === "unavailable") return { kind: "unavailable" }
            if (lookupDuplicates.has(email)) return { kind: "none" }
            const uid = authAccounts.get(email)
            return uid ? { kind: "found", userId: uid } : { kind: "none" }
          },
        },
      }
    }),
  }
}

const row = (n: number, over: Record<string, unknown> = {}) => ({
  student_name: `Student ${n}`,
  registration_number: `COM/${String(n).padStart(3, "0")}/2027`,
  email: `student${n}@example.test`,
  course: "Computer Science",
  department: "ICT",
  year_of_study: "3",
  phone: "",
  ...over,
})
type Res = { status: number; body: any }
const upload = async (students: unknown[], over: Parameters<typeof makeDeps>[0] = {}): Promise<Res> =>
  (await handleUpload(makeDeps({ body: { students }, ...over }))) as Res
const errOf = (res: { body: any }, r: number) => (res.body.errors as any[]).find(e => e.row === r)
const statusOf = (res: { body: any }, r: number) => (res.body.results as any[]).find(x => x.row === r)?.status
const writes = () => inserted.length + inviteCalls.length + deleted.length

// ======================= AUTHORIZATION =======================
test("authz: no session -> 401; nothing read, built or written", async () => {
  let read = false
  const res = await handleUpload(makeDeps({ userId: null, readJson: async () => { read = true; return { students: [row(1)] } } }))
  assert.equal(res.status, 401)
  assert.deepEqual(res.body, { success: false, error: "Unauthorized" })
  assert.equal(read, false); assert.equal(portsBuilt, 0); assert.equal(writes(), 0)
})

test("authz: identity lookup throwing -> 401", async () => {
  const res = await handleUpload(makeDeps({ getVerifiedUser: async () => { throw new Error("auth down") }, body: { students: [row(1)] } }))
  assert.equal(res.status, 401)
})

test("authz: no active institution account (pending/suspended/none, metadata 'admin', platform admin) -> 403, zero work", async () => {
  for (const uid of [NO_INST_USER, META_ADMIN_USER]) {
    const res = await upload([row(1)], { userId: uid })
    assert.equal(res.status, 403, uid)
    assert.deepEqual(res.body, { error: "Active institution account required" })
  }
  assert.equal(portsBuilt, 0); assert.equal(writes(), 0)
})

test("authz: institution lookup error or throw -> 403 (fail closed)", async () => {
  for (const g of [async () => ({ error: true as const }), async () => { throw new Error("db down") }]) {
    const res = await upload([row(1)], { getActiveInstitution: g as any })
    assert.equal(res.status, 403)
  }
  assert.equal(portsBuilt, 0)
})

test("authz: institution is resolved from the VERIFIED user id only", async () => {
  const seen: string[] = []
  await upload([row(1)], { getActiveInstitution: async (uid: string) => { seen.push(uid); return { institutionId: IA } } })
  assert.deepEqual(seen, [INST_USER_A])
})

test("authz: institution_id in the body is rejected (request-level 400), nothing processed", async () => {
  const res = await handleUpload(makeDeps({ body: { students: [row(1)], institution_id: IB } }))
  assert.equal(res.status, 400)
  assert.equal(portsBuilt, 0); assert.equal(writes(), 0)
})

test("authz: institution_id / user_id / status inside a row -> row invalid, nothing written for it", async () => {
  const res = await upload([row(1, { institution_id: IB }), row(2, { user_id: id(777) }), row(3, { status: "placed" })])
  for (const r of [1, 2, 3]) assert.equal(errOf(res, r)?.code, "invalid", `row ${r}`)
  assert.equal(writes(), 0)
})

test("authz: successful rows are always bound to the caller's institution", async () => {
  const res = await upload([row(1), row(2)])
  assert.equal(res.status, 200)
  assert.equal(inserted.length, 2)
  for (const r of inserted) assert.equal(r.institution_id, IA)
})

// ======================= REQUEST ENVELOPE / CONFIG =======================
test("envelope: empty, >100 rows, non-array, malformed JSON -> 400; exactly 100 -> 200", async () => {
  assert.equal((await upload([])).status, 400)
  assert.equal((await upload(Array.from({ length: 101 }, (_, i) => row(i + 1)))).status, 400)
  assert.equal((await handleUpload(makeDeps({ body: { students: "x" } }))).status, 400)
  assert.equal((await handleUpload(makeDeps({ readJson: async () => { throw new SyntaxError("bad json") } }))).status, 400)
  assert.equal(writes(), 0)
  const ok = await upload(Array.from({ length: 100 }, (_, i) => row(i + 1)))
  assert.equal(ok.status, 200)
  assert.equal(inserted.length, 100)
})

test("config: missing invite redirect -> 503 after authz, nothing written", async () => {
  const res = await upload([row(1)], { inviteRedirectUrl: null })
  assert.equal(res.status, 503)
  assert.equal(writes(), 0)
  assert.equal((await upload([row(1)], { inviteRedirectUrl: null, userId: NO_INST_USER })).status, 403)
})

test("resolveInviteRedirect: server env origin only, always /auth/reset-password, https only", () => {
  assert.equal(resolveInviteRedirect({ SITE_URL: "https://www.example.test/some/path?x=1" }), REDIRECT)
  assert.equal(resolveInviteRedirect({ NEXT_PUBLIC_SITE_URL: "https://www.example.test" }), REDIRECT)
  assert.equal(resolveInviteRedirect({ SITE_URL: "https://a.example.test", NEXT_PUBLIC_SITE_URL: "https://b.example.test" }), "https://a.example.test/auth/reset-password")
  assert.equal(resolveInviteRedirect({ SITE_URL: "http://localhost:3000" }), "http://localhost:3000/auth/reset-password")
  for (const bad of ["", "http://www.example.test", "javascript:alert(1)", "not a url", "https://user:pw@example.test", "ftp://example.test"]) {
    assert.equal(resolveInviteRedirect({ SITE_URL: bad }), null, bad)
  }
  assert.equal(resolveInviteRedirect({}), null)
})

// ======================= VALIDATION =======================
test("year_of_study: integers 1-6 accepted (number or numeric string)", async () => {
  const res = await upload([1, 2, 3, 4, 5, 6].map(y => row(y, { year_of_study: y % 2 ? String(y) : y })))
  assert.equal(res.body.errors.length, 0)
  assert.deepEqual(inserted.map(r => r.year_of_study), [1, 2, 3, 4, 5, 6])
})

test("year_of_study: 0, 7, 'Year 3', 2.5, '', missing -> per-row invalid; never silently defaulted to 1", async () => {
  const bad = [0, 7, "Year 3", 2.5, "", undefined, "-1", "6.0"]
  const res = await upload(bad.map((y, i) => { const r: any = row(i + 1, { year_of_study: y }); if (y === undefined) delete r.year_of_study; return r }))
  bad.forEach((_, i) => {
    const e = errOf(res, i + 1)
    assert.equal(e?.code, "invalid", `case ${i}`)
    assert.equal(e?.field, "year_of_study", `case ${i}`)
  })
  assert.equal(inserted.length, 0)
})

test("row field rules: email, name, reg chars, phone, required, unknown column", async () => {
  const res = await upload([
    row(1, { email: "not-an-email" }),
    row(2, { student_name: "x".repeat(121) }),
    row(3, { registration_number: "COM*001" }),
    row(4, { phone: "call me" }),
    row(5, { course: "" }),
    row(6, { nickname: "Bob" }),
    row(7, { email: "wild%card@example.test" }),
  ])
  assert.deepEqual(res.body.errors.map((e: any) => [e.row, e.code, e.field]), [
    [1, "invalid", "email"], [2, "invalid", "student_name"], [3, "invalid", "registration_number"],
    [4, "invalid", "phone"], [5, "invalid", "course"], [6, "invalid", "nickname"], [7, "invalid", "email"],
  ])
  assert.equal(writes(), 0)
})

test("validation errors never echo submitted values", async () => {
  const res = await upload([row(1, { email: "SECRETVALUE-not-an-email" })])
  assert.ok(!JSON.stringify(res.body).includes("SECRETVALUE"))
})

test("mixed file: valid rows succeed, invalid rows fail with the right row numbers", async () => {
  const res = await upload([row(1), row(2, { year_of_study: 9 }), row(3), row(4, { email: "" })])
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.results.map((r: any) => [r.row, r.status]), [[1, "invited"], [3, "invited"]])
  assert.deepEqual(res.body.errors.map((e: any) => e.row), [2, 4])
  assert.equal(res.body.success, false)
  assert.equal(res.body.created, 2)
  assert.equal(res.body.failed, 2)
})

// ======================= DUPLICATES / CONFLICTS =======================
test("in-file duplicate registration number (case-insensitive) -> ALL rows sharing it fail", async () => {
  const res = await upload([row(1, { registration_number: "DUP/1" }), row(2), row(3, { registration_number: " dup/1 " })])
  assert.equal(errOf(res, 1)?.code, "duplicate_in_file")
  assert.equal(errOf(res, 3)?.code, "duplicate_in_file")
  assert.equal(errOf(res, 1)?.message, MESSAGES.dupReg)
  assert.equal(statusOf(res, 2), "invited")
  assert.equal(inserted.length, 1)
})

test("in-file duplicate email (case-insensitive) -> ALL rows sharing it fail", async () => {
  const res = await upload([row(1, { email: "Same@Example.test" }), row(2, { email: "same@example.test" })])
  assert.deepEqual(res.body.errors.map((e: any) => [e.row, e.code, e.field]), [[1, "duplicate_in_file", "email"], [2, "duplicate_in_file", "email"]])
  assert.equal(writes(), 0)
})

test("a valid row sharing a registration number with an INVALID row is not guessed - it fails too", async () => {
  const res = await upload([row(1, { registration_number: "X/1" }), row(2, { registration_number: "x/1", year_of_study: 0 })])
  assert.equal(errOf(res, 1)?.code, "duplicate_in_file")
  assert.equal(errOf(res, 2)?.code, "invalid")
  assert.equal(writes(), 0)
})

test("already_listed: same reg + same email at THIS institution -> success, no invite, no write; re-upload idempotent", async () => {
  const res = await upload([row(1, { registration_number: "com/001/2026", email: "LISTED@example.test" })])
  assert.equal(statusOf(res, 1), "already_listed")
  assert.equal(res.body.success, true)
  assert.equal(writes(), 0)
  // whole-file re-upload
  const first = await upload([row(10), row(11)])
  assert.equal(first.body.summary.invited, 2)
  const again = await upload([row(10), row(11)])
  assert.equal(again.body.summary.already_listed, 2)
  assert.equal(again.body.summary.invited, 0)
  assert.equal(inserted.length, 2)
})

test("global registration conflict: reg already used at ANOTHER institution -> generic conflict, nothing revealed", async () => {
  const res = await upload([row(1, { registration_number: "uni-b/001", email: "shared@example.test" })])
  const e = errOf(res, 1)
  assert.equal(e?.code, "conflict")
  assert.equal(e?.message, MESSAGES.regInUse)
  const raw = JSON.stringify(res.body)
  assert.ok(!raw.includes(IB), "other institution id leaked")
  assert.ok(!raw.includes("UNI-B"), "stored registration number leaked")
  assert.equal(writes(), 0)
})

test("reg already at THIS institution under a different email -> conflict", async () => {
  const res = await upload([row(1, { registration_number: "COM/001/2026", email: "someoneelse@example.test" })])
  assert.equal(errOf(res, 1)?.code, "conflict")
  assert.equal(errOf(res, 1)?.message, MESSAGES.regInUse)
  assert.equal(writes(), 0)
})

test("email already at THIS institution under a different reg -> conflict", async () => {
  const res = await upload([row(1, { email: "listed@example.test" })])
  assert.equal(errOf(res, 1)?.code, "conflict")
  assert.equal(errOf(res, 1)?.message, MESSAGES.emailHere)
  assert.equal(writes() - inviteCalls.length, 0)
  assert.equal(inviteCalls.length, 0)
})

// ======================= MULTI-INSTITUTION / EXISTING ACCOUNTS =======================
test("multi-institution: same email as Institution B, different reg, lookup finds exactly one -> linked to that account", async () => {
  const res = await upload([row(1, { email: "shared@example.test", registration_number: "UNI-A/777" })])
  assert.equal(statusOf(res, 1), "linked")
  assert.equal(inserted.length, 1)
  assert.equal(inserted[0].user_id, id(500))
  assert.equal(inserted[0].institution_id, IA)
  assert.equal(deleted.length, 0, "pre-existing account must never be deleted")
})

test("existing account not listed anywhere, lookup finds exactly one -> linked", async () => {
  const res = await upload([row(1, { email: "loner@example.test" })])
  assert.equal(statusOf(res, 1), "linked")
  assert.equal(inserted[0].user_id, id(503))
})

test("missing SQL helper (lookup unavailable) -> generic not_allowed, nothing inserted, never user_id = null", async () => {
  lookupMode = "unavailable"
  const res = await upload([row(1, { email: "shared@example.test", registration_number: "UNI-A/777" }), row(2, { email: "loner@example.test" })])
  for (const r of [1, 2]) {
    assert.equal(errOf(res, r)?.code, "not_allowed")
    assert.equal(errOf(res, r)?.message, MESSAGES.notAllowed)
  }
  assert.equal(inserted.length, 0)
  assert.equal(deleted.length, 0)
  assert.ok(logs.some(l => l.startsWith("upload_row_not_allowed") && l.includes("unavailable")))
})

test("lookup with no exact single match (0 or 2+ accounts) -> not_allowed", async () => {
  lookupDuplicates.add("loner@example.test")
  const res = await upload([row(1, { email: "loner@example.test" })])
  assert.equal(errOf(res, 1)?.code, "not_allowed")
  assert.equal(inserted.length, 0)
})

// ======================= INVITES / COMPENSATION =======================
test("new email -> inviteUserByEmail port only: redirect /auth/reset-password, no password/email_confirm anywhere", async () => {
  const res = await upload([row(1)])
  assert.equal(statusOf(res, 1), "invited")
  assert.equal(inviteCalls.length, 1)
  const call = inviteCalls[0]
  assert.equal(call.redirectTo, REDIRECT)
  assert.equal(call.extra, 0)
  assert.deepEqual(Object.keys(call.metadata).sort(), ["registration_number", "role", "student_name"])
  const serialized = JSON.stringify(call).toLowerCase()
  assert.ok(!serialized.includes("password") || serialized.includes("reset-password"))
  assert.ok(!/"password"|email_confirm/.test(serialized))
  assert.equal(inserted[0].user_id, authAccounts.get("student1@example.test"))
  assert.equal(inserted[0].email, "student1@example.test")
  assert.equal(inserted[0].status, "eligible")
  assert.equal(inserted[0].attachment_status, "not_placed")
})

test("email is normalized (trim + lowercase); registration number stored trimmed, as entered", async () => {
  await upload([row(1, { email: "  MiXeD@Example.TEST ", registration_number: "  Com/AbC/9 " })])
  assert.equal(inserted[0].email, "mixed@example.test")
  assert.equal(inserted[0].registration_number, "Com/AbC/9")
})

test("email rate limit -> retry_later, nothing written", async () => {
  inviteBehavior.set("student1@example.test", "rate_limited")
  const res = await upload([row(1), row(2)])
  assert.equal(errOf(res, 1)?.code, "retry_later")
  assert.equal(statusOf(res, 2), "invited")
  assert.equal(res.body.summary.retry_later, 1)
  assert.equal(res.body.summary.failed, 0)
  assert.equal(inserted.length, 1)
})

test("other invite failure -> invite_failed with our message only", async () => {
  inviteBehavior.set("student1@example.test", "failed")
  const res = await upload([row(1)])
  assert.equal(errOf(res, 1)?.code, "invite_failed")
  assert.equal(errOf(res, 1)?.message, MESSAGES.inviteFailed)
  assert.equal(inserted.length, 0)
})

test("insert unique-violation after invite -> conflict + delete ONLY the account created for that row", async () => {
  insertOutcome.set("com/001/2027", "conflict")
  const res = await upload([row(1), row(2)])
  assert.equal(errOf(res, 1)?.code, "conflict")
  assert.equal(statusOf(res, 2), "invited")
  assert.equal(deleted.length, 1)
  assert.equal(deleted[0], id(900)) // the account invited for row 1
  assert.ok(!authAccounts.has("student1@example.test"))
  assert.ok(authAccounts.has("student2@example.test"))
})

test("insert failure for a LINKED existing account -> no deletion of the pre-existing account", async () => {
  insertOutcome.set("uni-a/777", "error")
  const res = await upload([row(1, { email: "shared@example.test", registration_number: "UNI-A/777" })])
  assert.equal(errOf(res, 1)?.code, "server_error")
  assert.equal(deleted.length, 0)
  assert.ok(authAccounts.has("shared@example.test"))
})

test("insert error after invite -> server_error + compensation", async () => {
  insertOutcome.set("com/001/2027", "error")
  const res = await upload([row(1)])
  assert.equal(errOf(res, 1)?.code, "server_error")
  assert.equal(errOf(res, 1)?.message, MESSAGES.serverError)
  assert.deepEqual(deleted, [id(900)])
})

test("compensation failure -> server_error, logged with row + account id (no email), other rows unaffected", async () => {
  insertOutcome.set("com/001/2027", "error")
  deleteFails.add(id(900))
  const res = await upload([row(1), row(2)])
  assert.equal(errOf(res, 1)?.code, "server_error")
  assert.equal(statusOf(res, 2), "invited")
  const line = logs.find(l => l.startsWith("upload_compensation_failed"))
  assert.ok(line && line.includes(id(900)) && line.includes('"row":1'))
  assert.ok(!logs.join("\n").includes("@example.test"), "emails must not be logged")
})

test("a port throwing mid-row -> generic server_error for that row only, no raw error text", async () => {
  throwOnLookupReg.add("com/001/2027")
  const res = await upload([row(1), row(2)])
  assert.equal(errOf(res, 1)?.code, "server_error")
  assert.equal(statusOf(res, 2), "invited")
  assert.ok(!JSON.stringify(res.body).includes("secret_internal"))
})

test("unexpected failure building ports -> generic 500", async () => {
  const res = await upload([row(1)], { makePorts: () => { throw new Error("boom: internal detail") } })
  assert.equal(res.status, 500)
  assert.deepEqual(res.body, { success: false, error: "Upload failed" })
})

// ======================= INVARIANT =======================
test("invariant: across a mixed upload no row is ever written with user_id = null or a foreign institution", async () => {
  lookupMode = "rpc"
  inviteBehavior.set("student4@example.test", "failed")
  insertOutcome.set("com/005/2027", "conflict")
  const res = await upload([
    row(1), row(2, { email: "shared@example.test", registration_number: "UNI-A/9" }), row(3, { email: "loner@example.test" }),
    row(4), row(5), row(6, { registration_number: "uni-b/002" }), row(7, { year_of_study: 7 }),
  ])
  assert.equal(res.status, 200)
  assert.ok(inserted.length >= 3)
  for (const r of inserted) {
    assert.equal(typeof r.user_id, "string")
    assert.ok(r.user_id.length > 0)
    assert.equal(r.institution_id, IA)
  }
  assert.equal(res.body.summary.received, 7)
  assert.equal(res.body.summary.invited + res.body.summary.linked + res.body.summary.already_listed + res.body.summary.failed + res.body.summary.retry_later, 7)
})
