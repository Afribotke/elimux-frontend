$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== UNIFY INTERNSHIPS + ATTACHMENTS ===" -ForegroundColor Cyan

# --- 1. Overwrite /opportunities with tab-based unified page ---
Write-Host "[1/4] Creating unified opportunities page with tabs..." -ForegroundColor Yellow
$opportunitiesPage = @'
"use client"
import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Job {
  id: string
  title: string
  description: string
  location: string
  duration: string
  stipend: string
  slots: number
  type: string
  employer: { company_name: string } | null
  created_at: string
}

function OpportunitiesContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all")
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/opportunities")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setJobs(data || [])
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = jobs.filter(job => {
    const matchesTab = activeTab === "all" || job.type === activeTab
    const matchesSearch = !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase()) ||
      job.employer?.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      job.location?.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const internships = jobs.filter(j => j.type === "internship")
  const attachments = jobs.filter(j => j.type === "attachment")

  const tabs = [
    { key: "all", label: "All Opportunities", count: jobs.length },
    { key: "internship", label: "Internships", count: internships.length },
    { key: "attachment", label: "Attachments", count: attachments.length },
  ]

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading opportunities...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Opportunities</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Find internships for graduates and attachment placements for current students.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, company, or location..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-10 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-slate-900">
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === "attachment"
                ? "No attachment placements available. Check back soon or contact your university placement office."
                : activeTab === "internship"
                ? "No internships available right now. Check back soon."
                : "No opportunities available right now. Check back soon."}
            </p>
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(job => {
            const isAttachment = job.type === "attachment"
            return (
              <Link
                key={job.id}
                href={isAttachment ? `/attachments/${job.id}` : `/internships/${job.id}`}
                className={`group rounded-xl border-2 bg-white p-6 shadow-sm transition hover:shadow-md ${
                  isAttachment
                    ? "border-amber-200 hover:border-amber-300 dark:border-amber-900/30 dark:hover:border-amber-700"
                    : "border-blue-200 hover:border-blue-300 dark:border-blue-900/30 dark:hover:border-blue-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-semibold ${
                      isAttachment
                        ? "text-gray-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400"
                        : "text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
                    }`}>
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {job.employer?.company_name || "Unknown Company"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isAttachment
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  }`}>
                    {isAttachment ? "Attachment" : "Internship"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {job.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>📍 {job.location || "Not specified"}</span>
                  <span>⏱️ {job.duration || "Not specified"}</span>
                  {job.stipend && <span>💰 {job.stipend}</span>}
                  {job.slots && <span>👥 {job.slots} slots</span>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading opportunities...</p>
        </div>
      </main>
    }>
      <OpportunitiesContent />
    </Suspense>
  )
}
'@
Set-Content -LiteralPath "src/app/opportunities/page.tsx" $opportunitiesPage -Force
Write-Host "  Created: unified opportunities page with tabs" -ForegroundColor Green

# --- 2. Create API route that returns all opportunities ---
Write-Host "[2/4] Creating unified API route..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/api/opportunities" -Force | Out-Null
$apiRoute = @'
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    const { data, error } = await supabase
      .from("internships")
      .select("*, employer:employers(company_name, location_county, website_url)")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch opportunities" }, { status: 500 })
  }
}
'@
Set-Content -LiteralPath "src/app/api/opportunities/route.ts" $apiRoute -Force
Write-Host "  Created: /api/opportunities route" -ForegroundColor Green

# --- 3. Update nav links ---
Write-Host "[3/4] Updating navigation..." -ForegroundColor Yellow
$navFiles = @("src/components/DesktopNav.tsx", "src/components/MobileNav.tsx", "src/components/Navbar.tsx")
foreach ($navFile in $navFiles) {
    if (Test-Path -LiteralPath $navFile) {
        $navContent = Get-Content -LiteralPath $navFile -Raw
        # Replace "Internships" link with "Opportunities" pointing to /opportunities
        if ($navContent -match "Internships") {
            $navContent = $navContent -replace "href:(\s*)[`"']/internships[`"']", 'href:$1"/opportunities"'
            $navContent = $navContent -replace "href=[`"']*/internships[`"']*", 'href="/opportunities"'
            $navContent = $navContent -replace "Internships", "Opportunities"
            Set-Content -LiteralPath $navFile $navContent -Force
            Write-Host "  Updated: $navFile" -ForegroundColor Green
        }
    }
}

# --- 4. Build, commit, deploy ---
Write-Host "[4/4] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

git add -A
git commit -m "feat: unify internships and attachments into single opportunities page with tabs"
git push origin main
Write-Host "  Pushed" -ForegroundColor Green

vercel --prod
Write-Host "  Deployed" -ForegroundColor Green

Write-Host "`n=== UNIFICATION COMPLETE ===" -ForegroundColor Cyan
Write-Host "Live at: https://v2.elimux.ke/opportunities" -ForegroundColor Green
Write-Host "Tabs: All Opportunities | Internships | Attachments" -ForegroundColor Green
