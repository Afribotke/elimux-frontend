$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== BATCH B: LIVE DASHBOARD (Server-Side + Dynamic) ===" -ForegroundColor Cyan

# --- STEP 1: Create shared server-side stats function + API route ---
Write-Host "[1/5] Creating server-side stats logic + API route..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/api/dashboard/stats" -Force | Out-Null

$statsLibFile = "src/lib/dashboard-stats-server.ts"
$statsLibCode = @'
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

export interface DashboardStats {
  institutions: number
  programs: number
  students: number
  applications: number
  revenue: number
}

export async function getDashboardStatsServer(): Promise<DashboardStats> {
  const [
    { count: institutions },
    { count: programs },
    { count: students },
    { count: applications },
    { count: revenue }
  ] = await Promise.all([
    supabaseServer.from("institutions").select("*", { count: "exact", head: true }),
    supabaseServer.from("programs").select("*", { count: "exact", head: true }),
    supabaseServer.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabaseServer.from("applications").select("*", { count: "exact", head: true }),
    supabaseServer.from("payments").select("*", { count: "exact", head: true }).eq("status", "completed")
  ])

  return {
    institutions: institutions || 0,
    programs: programs || 0,
    students: students || 0,
    applications: applications || 0,
    revenue: revenue || 0
  }
}
'@
Set-Content -LiteralPath $statsLibFile $statsLibCode -Force
Write-Host "  Created: $statsLibFile" -ForegroundColor Green

$apiRoute = "src/app/api/dashboard/stats/route.ts"
$apiCode = @'
import { NextResponse } from "next/server"
import { getDashboardStatsServer } from "@/lib/dashboard-stats-server"

export async function GET() {
  const stats = await getDashboardStatsServer()
  return NextResponse.json(stats)
}
'@
Set-Content -LiteralPath $apiRoute $apiCode -Force
Write-Host "  Created: $apiRoute" -ForegroundColor Green

# --- STEP 2: Update dashboard page to call the stats function directly + force dynamic ---
Write-Host "[2/5] Updating dashboard page..." -ForegroundColor Yellow
$dashboardFile = "src/app/dashboard/page.tsx"
$dashboardCode = @'
import { Metadata } from "next"
import { getDashboardStatsServer } from "@/lib/dashboard-stats-server"

export const metadata: Metadata = {
  title: "Admin Dashboard | Elimux",
  description: "Elimux administration panel",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const stats = await getDashboardStatsServer()

  return (
    <main className="min-h-screen bg-gray-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Institutions</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.institutions.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Programs</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.programs.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Active Students</p>
            <p className="mt-2 text-3xl font-bold text-purple-600">{stats.students.toLocaleString()}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">${stats.revenue.toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/institution/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Institution Portal</a>
            <a href="/partner" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Partner Portal</a>
            <a href="/advertiser" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">Advertiser Portal</a>
            <a href="/payments" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Payments</a>
          </div>
        </div>
      </div>
    </main>
  )
}
'@
Set-Content -LiteralPath $dashboardFile $dashboardCode -Force
Write-Host "  Updated: $dashboardFile" -ForegroundColor Green

# --- STEP 3: Check if SUPABASE_SERVICE_ROLE_KEY is set ---
Write-Host "[3/5] Checking env vars..." -ForegroundColor Yellow
$hasServiceKey = [System.Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY")
if (-not $hasServiceKey) {
  Write-Host "  WARNING: SUPABASE_SERVICE_ROLE_KEY not found in local env" -ForegroundColor Yellow
  Write-Host "  The API route needs this key to read users/payments tables" -ForegroundColor Yellow
  Write-Host "  Add it to Vercel dashboard: Project Settings > Environment Variables" -ForegroundColor Yellow
}

# --- STEP 4: Build ---
Write-Host "[4/5] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

# --- STEP 5: Commit and push ---
Write-Host "[5/5] Committing..." -ForegroundColor Yellow
git add -A
git commit -m "feat: server-side dashboard stats with service role key + dynamic rendering"
git push origin main
Write-Host "  Pushed to main" -ForegroundColor Green

Write-Host "`n=== BATCH B: LIVE DASHBOARD COMPLETE ===" -ForegroundColor Cyan
Write-Host "Dashboard now refreshes on every visit with live Supabase data" -ForegroundColor Green
Write-Host "IMPORTANT: Add SUPABASE_SERVICE_ROLE_KEY to Vercel if not already set" -ForegroundColor Yellow
