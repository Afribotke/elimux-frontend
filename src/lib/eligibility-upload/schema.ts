// Validation for POST /api/institutions/attachment/upload (Slice C).
// Dependency-free apart from zod so it can be unit-tested with node --test.
//
// Live schema facts (metadata check, 2026-11-26):
//   - attachment_eligible_students.registration_number is GLOBALLY UNIQUE
//   - email is not unique; user_id nullable FK -> auth.users(id)
//   - CHECK year_of_study >= 1 AND year_of_study <= 6
import { z } from "zod"

export const MAX_ROWS_PER_REQUEST = 100

/** Request envelope. Strict: any key besides `students` (e.g. institution_id) fails the whole request. */
export const uploadRequestSchema = z
  .object({
    students: z.array(z.unknown()).min(1, "No students provided").max(MAX_ROWS_PER_REQUEST, `At most ${MAX_ROWS_PER_REQUEST} rows per upload`),
  })
  .strict()

const collapse = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v)
const trimmed = (v: unknown) => (typeof v === "string" ? v.trim() : v)
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v)

/** Accepts 3 or "3" (CSV cells are strings); rejects "Year 3", 2.5, 0, 7. No silent default. */
const yearOfStudy = z.preprocess(
  v => (typeof v === "string" && /^\s*\d+\s*$/.test(v) ? Number(v.trim()) : v),
  z.number({ error: "Must be a whole number from 1 to 6" }).int("Must be a whole number from 1 to 6").min(1, "Must be a whole number from 1 to 6").max(6, "Must be a whole number from 1 to 6")
)

/** One CSV data row. Strict: unknown keys (institution_id, user_id, status, ...) are a row error. */
export const uploadRowSchema = z
  .object({
    student_name: z.preprocess(collapse, z.string({ error: "Required" }).min(2, "Must be 2-120 characters").max(120, "Must be 2-120 characters")),
    registration_number: z.preprocess(
      trimmed,
      z.string({ error: "Required" })
        .min(1, "Required")
        .max(50, "Must be at most 50 characters")
        .regex(/^[A-Za-z0-9/._ -]+$/, "Only letters, digits, space and / . _ - are allowed")
    ),
    email: z.preprocess(
      v => (typeof v === "string" ? v.trim().toLowerCase() : v),
      z.email({ error: "Must be a valid email address" })
        .max(254, "Must be a valid email address")
        // also rules out PostgREST/LIKE wildcard characters used by the lookups
        .regex(/^[^*%\\\s]+$/, "Must be a valid email address")
    ),
    course: z.preprocess(collapse, z.string({ error: "Required" }).min(1, "Required").max(150, "Must be at most 150 characters")),
    department: z.preprocess(collapse, z.string({ error: "Required" }).min(1, "Required").max(150, "Must be at most 150 characters")),
    year_of_study: yearOfStudy,
    phone: z.preprocess(
      emptyToNull,
      z.string().trim().max(30, "Must be at most 30 characters").regex(/^[+0-9 ()-]+$/, "Invalid phone number").nullable().optional()
    ),
  })
  .strict()

export type UploadRow = z.infer<typeof uploadRowSchema>

/** Case-insensitive comparison key for registration numbers (stored as entered, trimmed). */
export const regKey = (registrationNumber: string) => registrationNumber.trim().toLowerCase()
/** Normalized email (also the stored form). */
export const emailKey = (email: string) => email.trim().toLowerCase()

/** First issue per row, field name + our own message only (never the submitted value). */
export function firstIssue(err: z.ZodError): { field?: string; message: string } {
  const i = err.issues[0]
  if (i?.code === "unrecognized_keys") {
    return { field: (i as any).keys?.join(", "), message: "Unexpected column(s)" }
  }
  const field = i?.path?.length ? String(i.path[0]) : undefined
  const msg = i?.message && !/^Invalid input/.test(i.message) ? i.message : field ? "Invalid value" : "Invalid row"
  return { field, message: msg }
}
