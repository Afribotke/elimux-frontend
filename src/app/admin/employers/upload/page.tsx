"use client"
import { useState } from "react"
import { useAdminKey } from "@/components/admin/AdminKeyContext"

export default function EmployerBulkUploadPage() {
  const { adminKey } = useAdminKey()
  const [csvText, setCsvText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleUpload = async () => {
    if (!adminKey) return
    setLoading(true)
    setResult(null)
    try {
      const lines = csvText.trim().split("\n")
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
      const employers = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim())
        const emp: any = {}
        headers.forEach((h, idx) => { emp[h] = values[idx] || "" })
        employers.push({
          company_name: emp.company_name || emp.name || emp.company || "",
          email: emp.email || "",
          industry: emp.industry || "",
          location: emp.location || emp.country || emp.city || "",
          website: emp.website || "",
          phone: emp.phone || emp.contact || ""
        })
      }

      const res = await fetch("/api/admin/employers/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ employers })
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Upload Employers</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Paste CSV data to invite employers. Format: company_name,email,industry,location,website,phone</p>
        <textarea
          rows={10}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder="company_name,email,industry,location,website,phone&#10;Acme Corp,hr@acme.com,Technology,Nairobi,https://acme.com,+254712345678&#10;Global Bank,recruit@globalbank.com,Finance,Mombasa,https://globalbank.com,+254723456789"
          className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
        />
        <button onClick={handleUpload} disabled={loading} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Uploading..." : "Upload & Send Invitations"}
        </button>
        {result && (
          <div className="mt-6 space-y-4">
            {result.error && <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-900/20">{result.error}</div>}
            {result.success && (
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-green-600 font-medium">Created: {result.created} | Failed: {result.failed}</p>
                {result.results?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Invitation Links (copy and send manually if email is not configured):</p>
                    <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-slate-800"><tr><th className="px-3 py-2 text-left">Company</th><th className="px-3 py-2 text-left">Link</th></tr></thead>
                        <tbody>
                          {result.results.map((r: any, i: number) => (
                            <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                              <td className="px-3 py-2">{r.company_name}</td>
                              <td className="px-3 py-2 font-mono text-xs text-blue-600 break-all">{r.invitation_link}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
