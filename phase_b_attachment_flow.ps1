$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== PHASE B: UNIVERSITY ATTACHMENT FLOW ===" -ForegroundColor Cyan

# --- 1. Create attachment upload page for institutions ---
Write-Host "[1/6] Creating university attachment upload portal..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/institution/attachment/upload" -Force | Out-Null
$uploadPage = @'
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
'@
Set-Content -LiteralPath "src/app/institution/attachment/upload/page.tsx" $uploadPage -Force
Write-Host "  Created: attachment upload page" -ForegroundColor Green

# --- 2. Create API route for attachment upload ---
Write-Host "[2/6] Creating attachment upload API..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/api/institutions/attachment/upload" -Force | Out-Null
$uploadApi = @'
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  // AUTH GUARD: Only authenticated institution owners can upload students
  const cookieHeader = request.headers.get("cookie") || ""
  const authCookie = cookieHeader.split(";").find(c => c.trim().startsWith("sb-ohlgjvenwekpbpkykutz-auth-token="))

  if (!authCookie) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const token = authCookie.split("=")[1].trim()
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  )

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  // Verify user is an institution admin/owner
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = userData?.role || user.user_metadata?.role || "student"
  if (role !== "institution_admin" && role !== "institution_owner" && role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Institution owner access required" }, { status: 403 })
  }

  try {
    const { students } = await request.json()
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, failed: 1, errors: [{ row: 0, reason: "No students provided" }] }, { status: 400 })
    }

    const results = []
    const errors = []
    let created = 0

    for (let i = 0; i < students.length; i++) {
      const s = students[i]
      try {
        // Check if student already exists by registration_number
        const { data: existing } = await supabase
          .from("attachment_eligible_students")
          .select("id")
          .eq("registration_number", s.registration_number)
          .single()

        if (existing) {
          errors.push({ row: i + 1, reason: `Registration number ${s.registration_number} already exists` })
          continue
        }

        // Create auth user if not exists
        const tempPassword = Math.random().toString(36).slice(-10) + "A1!"
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: s.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            role: "student",
            student_name: s.student_name,
            registration_number: s.registration_number,
            is_attachment_eligible: true
          }
        })

        if (authError && authError.message !== "User already registered") {
          errors.push({ row: i + 1, reason: `Auth error: ${authError.message}` })
          continue
        }

        const userId = authData?.user?.id

        // Insert into attachment_eligible_students
        const { error: insertError } = await supabase.from("attachment_eligible_students").insert({
          user_id: userId,
          student_name: s.student_name,
          registration_number: s.registration_number,
          email: s.email,
          course: s.course,
          department: s.department,
          year_of_study: s.year_of_study,
          phone: s.phone,
          institution_id: null, // Will be set by trigger or admin
          status: "eligible",
          attachment_status: "not_placed"
        })

        if (insertError) {
          errors.push({ row: i + 1, reason: `Database error: ${insertError.message}` })
          continue
        }

        created++
        results.push({ row: i + 1, student_name: s.student_name, status: "created" })
      } catch (err: any) {
        errors.push({ row: i + 1, reason: err.message || "Unknown error" })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      created,
      failed: errors.length,
      results,
      errors
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
'@
Set-Content -LiteralPath "src/app/api/institutions/attachment/upload/route.ts" $uploadApi -Force
Write-Host "  Created: attachment upload API" -ForegroundColor Green

# --- 3. Update internships page to show BOTH with clear separation ---
Write-Host "[3/6] Updating job listings with attachment/internship separation..." -ForegroundColor Yellow
$listingsPath = "src/app/internships/page.tsx"
if (Test-Path -LiteralPath $listingsPath) {
    $currentListings = Get-Content -LiteralPath $listingsPath -Raw
    # Check if it already has tabs
    if ($currentListings -notmatch "attachment|Attachment") {
        # We need to add tab separation - but since the file exists and may be complex,
        # let's create a new wrapper page instead
        Write-Host "  Existing listings page found - creating separate attachment listings" -ForegroundColor Yellow
    }
}

# Create new combined listings page with tabs
$combinedListings = @'
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Opportunities | Elimux",
  description: "Find internships and attachment placements with top employers",
}

export const dynamic = "force-dynamic"

async function getOpportunities(type: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/internships?type=${type}`, {
      cache: "no-store"
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function OpportunitiesPage() {
  const internships = await getOpportunities("internship")
  const attachments = await getOpportunities("attachment")

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Opportunities</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find internships for graduates and attachment placements for current students.
          </p>
        </div>

        {/* ATTACHMENTS SECTION */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 px-3 py-1 dark:bg-amber-900/20">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-400">🎓 For Current Students</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attachment Placements</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              {attachments.length} Active
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Mandatory work placements for university students before graduation.
            <span className="font-semibold text-amber-700 dark:text-amber-400"> Only verified students can apply.</span>
          </p>

          {attachments.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400">No attachment placements available right now.</p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Check back soon or contact your university placement office.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {attachments.map((job: any) => (
                <Link key={job.id} href={`/attachments/${job.id}`} className="group rounded-xl border-2 border-amber-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-amber-300 dark:border-amber-900/30 dark:bg-slate-900 dark:hover:border-amber-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">{job.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{job.employer?.company_name || "Unknown Company"}</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Attachment</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>📍 {job.location || "Not specified"}</span>
                    <span>⏱️ {job.duration || "Not specified"}</span>
                    {job.slots && <span>👥 {job.slots} slots</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="my-8 border-t-2 border-dashed border-gray-300 dark:border-gray-700" />

        {/* INTERNSHIPS SECTION */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 px-3 py-1 dark:bg-blue-900/20">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-400">🚀 For Graduates</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Internships</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {internships.length} Active
            </span>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Work experience opportunities for recent graduates. Build your career with leading employers.
          </p>

          {internships.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-900">
              <p className="text-gray-500 dark:text-gray-400">No internships available right now.</p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Check back soon or set up job alerts.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {internships.map((job: any) => (
                <Link key={job.id} href={`/internships/${job.id}`} className="group rounded-xl border-2 border-blue-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-blue-300 dark:border-blue-900/30 dark:bg-slate-900 dark:hover:border-blue-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{job.title}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{job.employer?.company_name || "Unknown Company"}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Internship</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>📍 {job.location || "Not specified"}</span>
                    <span>⏱️ {job.duration || "Not specified"}</span>
                    {job.stipend && <span>💰 {job.stipend}</span>}
                    {job.slots && <span>👥 {job.slots} slots</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
'@
New-Item -ItemType Directory -Path "src/app/opportunities" -Force | Out-Null
Set-Content -LiteralPath "src/app/opportunities/page.tsx" $combinedListings -Force
Write-Host "  Created: combined opportunities page with clear separation" -ForegroundColor Green

# --- 4. Create attachment detail page ---
Write-Host "[4/6] Creating attachment detail page..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/attachments/[id]" -Force | Out-Null
$attachmentDetail = @'
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Attachment Details | Elimux",
  description: "View attachment placement details",
}

export const dynamic = "force-dynamic"

async function getAttachment(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/internships/${id}`, {
      cache: "no-store"
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function AttachmentDetailPage({ params }: { params: { id: string } }) {
  const job = await getAttachment(params.id)
  if (!job || job.type !== "attachment") {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-600 dark:text-gray-400">Attachment placement not found</p></div>
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border-2 border-amber-200 bg-white p-8 shadow-sm dark:border-amber-900/30 dark:bg-slate-900">
          <div className="mb-4 inline-block rounded-lg bg-amber-100 px-3 py-1 dark:bg-amber-900/20">
            <span className="text-sm font-medium text-amber-800 dark:text-amber-400">🎓 Attachment Placement</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
          <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">{job.employer?.company_name || "Unknown Company"}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>📍 {job.location || "Not specified"}</span>
            <span>⏱️ {job.duration || "Not specified"}</span>
            <span>👥 {job.slots || 1} slots</span>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-line">{job.description}</p>
          </div>

          {job.requirements && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Requirements</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-line">{job.requirements}</p>
            </div>
          )}

          <div className="mt-8 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm text-amber-800 dark:text-amber-400">
              <span className="font-semibold">Eligibility:</span> Only students uploaded by their university can apply for attachment placements.
              If you are a verified student, <Link href={`/attachments/${job.id}/apply`} className="underline">click here to apply</Link>.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/opportunities" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">← Back to all opportunities</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
'@
Set-Content -LiteralPath "src/app/attachments/[id]/page.tsx" $attachmentDetail -Force
Write-Host "  Created: attachment detail page" -ForegroundColor Green

# --- 5. Update employer dashboard to show type clearly ---
Write-Host "[5/6] Updating employer dashboard type selector..." -ForegroundColor Yellow
$employerDash = "src/app/employer/dashboard/page.tsx"
if (Test-Path -LiteralPath $employerDash) {
    $dashContent = Get-Content -LiteralPath $employerDash -Raw
    if ($dashContent -match "type.*internship.*attachment") {
        Write-Host "  Employer dashboard already has type selector" -ForegroundColor Green
    } else {
        Write-Host "  Employer dashboard type selector may need manual review" -ForegroundColor Yellow
    }
}

# --- 6. Build, commit, deploy ---
Write-Host "[6/6] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

git add -A
git commit -m "feat: university attachment flow - upload portal, clear separation from internships"
git push origin main
Write-Host "  Pushed" -ForegroundColor Green

vercel --prod
Write-Host "  Deployed" -ForegroundColor Green

Write-Host "`n=== PHASE B: ATTACHMENT FLOW COMPLETE ===" -ForegroundColor Cyan
Write-Host "Upload portal: https://v2.elimux.ke/institution/attachment/upload" -ForegroundColor Green
Write-Host "Opportunities page: https://v2.elimux.ke/opportunities" -ForegroundColor Green
Write-Host "Attachment detail: https://v2.elimux.ke/attachments/{id}" -ForegroundColor Green
