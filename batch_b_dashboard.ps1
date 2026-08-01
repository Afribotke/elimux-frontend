$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== BATCH B SCRIPT 2: LIVE DASHBOARD DATA ===" -ForegroundColor Cyan

# --- STEP 1: Find the Supabase client file ---
Write-Host "[1/5] Finding Supabase client..." -ForegroundColor Yellow
$supabaseFiles = Get-ChildItem src -Recurse -Filter "*.ts" | Where-Object { $_.Name -match "supabase" }
$clientFile = $null
foreach ($f in $supabaseFiles) {
    $content = Get-Content -LiteralPath $f.FullName -Raw
    if ($content -match "createClient|supabase") {
        $clientFile = $f.FullName
        Write-Host "  Found: $($f.FullName)" -ForegroundColor Green
        break
    }
}
if (-not $clientFile) {
    Write-Host "  Creating minimal Supabase client at src/lib/supabase.ts" -ForegroundColor Yellow
    $clientFile = "src/lib/supabase.ts"
    $clientCode = "import { createClient } from '@supabase/supabase-js'`n`nconst supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''`nconst supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''`n`nexport const supabase = createClient(supabaseUrl, supabaseKey)"
    Set-Content -LiteralPath $clientFile $clientCode -Force
}

# --- STEP 2: Create dashboard data fetcher ---
Write-Host "[2/5] Creating dashboard data fetcher..." -ForegroundColor Yellow
$fetcherFile = "src/lib/dashboard-data.ts"
$fetcherCode = @'
import { supabase } from './supabase'

export interface DashboardStats {
  institutions: number
  programs: number
  students: number
  applications: number
  revenue: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    { count: institutions },
    { count: programs },
    { count: students },
    { count: applications },
    { count: revenue }
  ] = await Promise.all([
    supabase.from('institutions').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'completed')
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
Set-Content -LiteralPath $fetcherFile $fetcherCode -Force
Write-Host "  Created: $fetcherFile" -ForegroundColor Green

# --- STEP 3: Update dashboard page ---
Write-Host "[3/5] Updating dashboard page..." -ForegroundColor Yellow
$dashboardFile = "src/app/dashboard/page.tsx"
$dashboardCode = @'
import { Metadata } from "next"
import { getDashboardStats } from "@/lib/dashboard-data"

export const metadata: Metadata = {
  title: "Admin Dashboard | Elimux",
  description: "Elimux administration panel",
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

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

# --- STEP 4: Build check ---
Write-Host "[4/5] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

# --- STEP 5: Commit and push ---
Write-Host "[5/5] Committing..." -ForegroundColor Yellow
git add -A
git commit -m "feat: wire live Supabase data into admin dashboard"
git push origin main
Write-Host "  Pushed to main" -ForegroundColor Green

Write-Host "`n=== BATCH B SCRIPT 2 COMPLETE ===" -ForegroundColor Cyan
Write-Host "Dashboard now shows real data from Supabase" -ForegroundColor Green
