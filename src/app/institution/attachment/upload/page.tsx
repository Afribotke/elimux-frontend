"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface UploadResult {
  success: boolean
  created: number
  failed: number
  errors: Array<{ row: number; reason: string }>
}

export default function AttachmentUploadPage() {
  const router = useRouter()
  const [csvText, setCsvText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleUpload = async () => {
    setLoading(true)
    setResult(null)
    try {
      const lines = csvText.trim().split("\n")
      if (lines.length < 2) {
        setResult({ success: false, created: 0, failed: 1, errors: [{ row: 0, reason: "CSV must have header + at least one data row" }] })
        return
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""))
      const required = ["student_name", "registration_number", "email", "course", "department", "year_of_study"]
      const missing = required.filter(h => !headers.includes(h))
      if (missing.length > 0) {
        setResult({ success: false, created: 0, failed: 1, errors: [{ row: 0, reason: `Missing columns: ${missing.join(", ")}` }] })
        return
      }

      const students = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""))
        const row: any = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || "" })

        if (!row.student_name || !row.registration_number || !row.email) {
          continue
        }

        students.push({
          student_name: row.student_name,
          registration_number: row.registration_number,
          email: row.email,
          course: row.course,
          department: row.department,
          year_of_study: parseInt(row.year_of_study) || 1,
          phone: row.phone || null
        })
      }

      const res = await fetch("/api/institutions/attachment/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students })
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ success: false, created: 0, failed: 1, errors: [{ row: 0, reason: err.message }] })
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
              {result.success ? `Uploaded: ${result.created} students` : `Failed: ${result.failed} errors`}
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-slate-800">
                    <tr><th className="px-3 py-2 text-left">Row</th><th className="px-3 py-2 text-left">Error</th></tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-3 py-2">{e.row}</td>
                        <td className="px-3 py-2 text-red-600">{e.reason}</td>
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
