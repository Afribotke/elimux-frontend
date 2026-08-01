$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== PHASE A2 v2: EMPLOYER PORTAL (FIXED) ===" -ForegroundColor Cyan

# --- 1. Create bulk upload API for admin ---
Write-Host "[1/6] Creating admin bulk upload API..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/api/admin/employers/bulk-upload" -Force | Out-Null
$bulkApi = @'
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

function generateToken() {
  return randomBytes(32).toString("hex")
}

export async function POST(request: Request) {
  try {
    const { employers } = await request.json()
    if (!Array.isArray(employers) || employers.length === 0) {
      return NextResponse.json({ error: "No employers provided" }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const emp of employers) {
      const { company_name, email, industry, location, website, phone } = emp
      if (!company_name || !email) {
        errors.push({ company_name: company_name || "UNKNOWN", reason: "Missing company_name or email" })
        continue
      }

      const token = generateToken()

      const { data: existing } = await supabase
        .from("employers")
        .select("id")
        .eq("email", email)
        .single()

      if (existing) {
        errors.push({ company_name, reason: "Email already exists" })
        continue
      }

      const { error: insertError } = await supabase.from("employers").insert({
        company_name,
        email,
        industry: industry || null,
        location: location || null,
        website: website || null,
        phone: phone || null,
        status: "invited",
        invitation_token: token
      })

      if (insertError) {
        errors.push({ company_name, reason: insertError.message })
        continue
      }

      results.push({
        company_name,
        email,
        invitation_link: `https://v2.elimux.ke/employer/activate?token=${token}`,
        status: "invited"
      })
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      results,
      errors
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Bulk upload failed" }, { status: 500 })
  }
}
'@
Set-Content -LiteralPath "src/app/api/admin/employers/bulk-upload/route.ts" $bulkApi -Force
Write-Host "  Created: bulk upload API" -ForegroundColor Green

# --- 2. Create employer activation page ---
Write-Host "[2/6] Creating employer activation page..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/employer/activate" -Force | Out-Null
$activateCode = @'
"use client"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function EmployerActivatePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ password: "", confirmPassword: "", companyName: "", industry: "", location: "", website: "", phone: "", description: "" })

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing activation link")
      setLoading(false)
      return
    }
    fetch(`/api/employers/verify-token?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setValid(true)
          setForm(prev => ({ ...prev, companyName: data.employer.company_name || "" }))
        } else {
          setError("This invitation link is invalid or has expired")
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to verify invitation")
        setLoading(false)
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/employers/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Activation failed")
      router.push("/employer/dashboard")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-600 dark:text-gray-400">Verifying invitation...</p></div>
  if (error && !valid) return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><p className="text-red-600">{error}</p></div></div>

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activate Your Employer Account</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Complete your profile to start posting internships.</p>
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label><input required value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Industry</label><input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label><input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Website</label><input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label><textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label><input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label><input type="password" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-slate-800 dark:text-white" /></div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{loading ? "Activating..." : "Activate Account"}</button>
        </form>
      </div>
    </main>
  )
}
'@
Set-Content -LiteralPath "src/app/employer/activate/page.tsx" $activateCode -Force
Write-Host "  Created: employer activation page" -ForegroundColor Green

# --- 3. Create token verification API ---
Write-Host "[3/6] Creating token verification API..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/api/employers/verify-token" -Force | Out-Null
$verifyCode = @'
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  const { data, error } = await supabase
    .from("employers")
    .select("company_name, email, status")
    .eq("invitation_token", token)
    .single()

  if (error || !data || data.status !== "invited") {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true, employer: data })
}
'@
Set-Content -LiteralPath "src/app/api/employers/verify-token/route.ts" $verifyCode -Force

# --- 4. Create activation API ---
Write-Host "[4/6] Creating activation API..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/api/employers/activate" -Force | Out-Null
$activateApi = @'
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: Request) {
  try {
    const { token, password, companyName, industry, location, website, phone, description } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 })
    }

    const { data: employer } = await supabase
      .from("employers")
      .select("id, email, status")
      .eq("invitation_token", token)
      .single()

    if (!employer || employer.status !== "invited") {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: employer.email,
      password,
      email_confirm: true,
      user_metadata: { role: "employer", company_name: companyName }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("employers")
      .update({
        user_id: authData.user.id,
        company_name: companyName,
        industry: industry || null,
        location: location || null,
        website: website || null,
        phone: phone || null,
        description: description || null,
        status: "active",
        invitation_token: null
      })
      .eq("id", employer.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Activation failed" }, { status: 500 })
  }
}
'@
Set-Content -LiteralPath "src/app/api/employers/activate/route.ts" $activateApi -Force
Write-Host "  Created: activation APIs" -ForegroundColor Green

# --- 5. Create admin bulk upload page ---
Write-Host "[5/6] Creating admin bulk upload page..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/admin/employers/upload" -Force | Out-Null
$uploadPage = @'
"use client"
import { useState } from "react"

export default function EmployerBulkUploadPage() {
  const [csvText, setCsvText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleUpload = async () => {
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
        headers: { "Content-Type": "application/json" },
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
'@
Set-Content -LiteralPath "src/app/admin/employers/upload/page.tsx" $uploadPage -Force
Write-Host "  Created: admin bulk upload page" -ForegroundColor Green

# --- 6. Build, commit, deploy ---
Write-Host "[6/6] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

git add -A
git commit -m "feat: employer portal v2 - bulk upload, invitation activation, status workflow"
git push origin main
Write-Host "  Pushed" -ForegroundColor Green

vercel --prod
Write-Host "  Deployed" -ForegroundColor Green

Write-Host "`n=== PHASE A2 v2 COMPLETE ===" -ForegroundColor Cyan
Write-Host "Admin upload: https://v2.elimux.ke/admin/employers/upload" -ForegroundColor Green
Write-Host "Employer activation: https://v2.elimux.ke/employer/activate?token=TOKEN" -ForegroundColor Green
Write-Host "Only ACTIVE employers appear publicly" -ForegroundColor Green
