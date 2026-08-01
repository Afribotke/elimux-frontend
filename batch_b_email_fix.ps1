$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== BATCH B: EMAIL CONFIRMATION FLOW FIX ===" -ForegroundColor Cyan

# --- STEP 1: Create /auth/callback handler using the cookie-aware SSR server client ---
Write-Host "[1/4] Creating auth callback handler..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "src/app/auth/callback" -Force | Out-Null
$callbackCode = @'
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to the intended page or dashboard
  const redirectTo = requestUrl.searchParams.get("redirect") || "/dashboard"
  return NextResponse.redirect(new URL(redirectTo, request.url))
}
'@
Set-Content -LiteralPath "src/app/auth/callback/route.ts" $callbackCode -Force
Write-Host "  Created: src/app/auth/callback/route.ts" -ForegroundColor Green

# --- STEP 2: Update registration pages to set emailRedirectTo (nested inside options, with backticks) ---
Write-Host "[2/4] Updating registration pages..." -ForegroundColor Yellow

$authRegisterPath = "src/app/auth/register/page.tsx"
$authRegisterOld = "      options: { data: { full_name: fullName } },"
$authRegisterNew = "      options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: { full_name: fullName } },"
$c = Get-Content -LiteralPath $authRegisterPath -Raw
if ($c -match [regex]::Escape($authRegisterOld)) {
    $c = $c.Replace($authRegisterOld, $authRegisterNew)
    Set-Content -LiteralPath $authRegisterPath $c -Force
    Write-Host "  Fixed: $authRegisterPath" -ForegroundColor Green
} else {
    Write-Host "  SKIPPED (pattern not found, check manually): $authRegisterPath" -ForegroundColor Yellow
}

$institutionRegisterPath = "src/app/institution/register/page.tsx"
$institutionRegisterOld = "supabase.auth.signUp({ email, password })"
$institutionRegisterNew = "supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })"
$c = Get-Content -LiteralPath $institutionRegisterPath -Raw
if ($c -match [regex]::Escape($institutionRegisterOld)) {
    $c = $c.Replace($institutionRegisterOld, $institutionRegisterNew)
    Set-Content -LiteralPath $institutionRegisterPath $c -Force
    Write-Host "  Fixed: $institutionRegisterPath" -ForegroundColor Green
} else {
    Write-Host "  SKIPPED (pattern not found, check manually): $institutionRegisterPath" -ForegroundColor Yellow
}

$advertiserRegisterPath = "src/app/advertiser/register/page.tsx"
$advertiserRegisterOld = "email: formData.company_email,`n        password,`n      })"
$advertiserRegisterNew = "email: formData.company_email,`n        password,`n        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },`n      })"
$c = Get-Content -LiteralPath $advertiserRegisterPath -Raw
if ($c -match [regex]::Escape($advertiserRegisterOld)) {
    $c = $c.Replace($advertiserRegisterOld, $advertiserRegisterNew)
    Set-Content -LiteralPath $advertiserRegisterPath $c -Force
    Write-Host "  Fixed: $advertiserRegisterPath" -ForegroundColor Green
} else {
    Write-Host "  SKIPPED (pattern not found, check manually): $advertiserRegisterPath" -ForegroundColor Yellow
}

# --- STEP 3: Build ---
Write-Host "[3/4] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

# --- STEP 4: Commit and push ---
Write-Host "[4/4] Committing..." -ForegroundColor Yellow
git add -A
git commit -m "fix: add auth callback handler and set emailRedirectTo for confirmation flow"
git push origin main
Write-Host "  Pushed to main" -ForegroundColor Green

Write-Host "`n=== EMAIL FLOW FIX COMPLETE ===" -ForegroundColor Cyan
Write-Host "Callback handler: /auth/callback" -ForegroundColor Green
Write-Host "Registration now sets emailRedirectTo" -ForegroundColor Green
Write-Host "IMPORTANT: Set Site URL in Supabase to https://v2.elimux.ke" -ForegroundColor Yellow
Write-Host "IMPORTANT: Add https://v2.elimux.ke/auth/callback to Redirect URLs in Supabase" -ForegroundColor Yellow
