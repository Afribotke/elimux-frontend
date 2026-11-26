"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const MAX_ROWS = 100 // must match MAX_ROWS_PER_REQUEST on the server
const COLUMNS = ["student_name", "registration_number", "email", "course", "department", "year_of_study", "phone"] as const
const REQUIRED = COLUMNS.filter(c => c !== "phone")

interface RowError { row: number; line?: number; field?: string; code?: string; message?: string; reason?: string }
interface UploadResult {
  success: boolean
  created: number
  failed: number
  summary?: { received: number; invited: number; linked: number; already_listed: number; failed: number; retry_later: number }
  errors: RowError[]
  error?: string
}

/** Minimal RFC 4180 line parser: handles "quoted, fields" and "" escapes. */
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else cur += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") { out.push(cur); cur = "" }
    else cur += ch
  }
  out.push(cur)
  return out.map(v => v.trim())
}

export default function AttachmentUploadPage() {
  const router = useRouter()
  const [csvText, setCsvText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const fail = (message: string) =>
    setResult({ success: false, created: 0, failed: 1, errors: [{ row: 0, message }] })

  const handleUpload = async () => {
    setLoading(true)
    setResult(null)
    try {
      const lines = csvText.replace(/\r\n?/g, "\n").split("\n")
      const headerIdx = lines.findIndex(l => l.trim() !== "")
      if (headerIdx < 0) return fail("CSV must have a header row and at least one data row")

      const headers = parseCsvLine(lines[headerIdx]).map(h => h.toLowerCase())
      const missing = REQUIRED.filter(h => !headers.includes(h))
      if (missing.length > 0) return fail(`Missing columns: ${missing.join(", ")}`)

      // Every non-blank data line is sent as-is: the server validates each row
      // (nothing is silently skipped or defaulted). lineOf[i] = CSV line number.
      const students: Record<string, string>[] = []
      const lineOf: number[] = []
      for (let i = headerIdx + 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue
        const values = parseCsvLine(lines[i])
        const row: Record<string, string> = {}
        COLUMNS.forEach(c => {
          const idx = headers.indexOf(c)
          if (idx >= 0) row[c] = values[idx] ?? ""
        })
        students.push(row)
        lineOf.push(i + 1)
      }
      if (students.length === 0) return fail("CSV must have a header row and at least one data row")
      if (students.length > MAX_ROWS) {
        return fail(`At most ${MAX_ROWS} students per upload (this file has ${students.length}). Split the file and upload each part.`)
      }

      const res = await fetch("/api/institutions/attachment/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students })
      })
      const data: UploadResult = await res.json()
      if (!res.ok && !data.errors) return fail(data.error || "Upload failed")
      setResult({
        ...data,
        errors: (data.errors || []).map(e => ({ ...e, line: e.row > 0 ? lineOf[e.row - 1] : undefined }))
      })
    } catch (err: any) {
      fail(err?.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Attachment Students</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload students who are eligible for mandatory attachment placements before graduation.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">CSV Format</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Required columns: <span className="font-mono text-blue-600">student_name, registration_number, email, course, department, year_of_study</span>
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Optional: <span className="font-mono text-gray-500">phone</span>
          </p>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
            <code className="text-xs text-gray-700 dark:text-gray-300">
              student_name,registration_number,email,course,department,year_of_study,phone<br/>
              John Doe,COM/001/2023,john@university.ac.ke,Computer Science,ICT,3,254712345678<br/>
              Jane Smith,COM/002/2023,jane@university.ac.ke,Software Engineering,ICT,3,254723456789
            </code>
          </div>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Up to {MAX_ROWS} students per upload. <span className="font-mono">year_of_study</span> must be a whole number from 1 to 6.
            New students are emailed an invitation to set their password. Uploading the same file again is safe.
          </p>

        </div>

        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <textarea
            rows={10}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            placeholder="Paste CSV data here..."
            className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload Students"}
          </button>
        </div>

        {result && (
          <div className={`mt-6 rounded-xl p-6 shadow-sm ${result.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            <p className={`font-medium ${result.success ? "text-green-600" : "text-red-600"}`}>
              {result.summary
                ? `Invited: ${result.summary.invited} · Linked existing accounts: ${result.summary.linked} · Already listed: ${result.summary.already_listed} · Failed: ${result.summary.failed} · Try again later: ${result.summary.retry_later}`
                : result.success ? `Uploaded: ${result.created} students` : `Failed: ${result.failed} errors`}
            </p>
            {result.summary && result.summary.invited > 0 && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Invited students receive an email to set their password.
              </p>
            )}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 text-left">Line</th><th className="px-3 py-2 text-left">Field</th><th className="px-3 py-2 text-left">Error</th></tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-3 py-2">{e.line ?? (e.row || "-")}</td>
                        <td className="px-3 py-2 font-mono text-xs">{e.field || ""}</td>
                        <td className="px-3 py-2 text-red-600">{e.message || e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
