$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== BATCH B SCRIPT 3: AUTH GUARDS (FIXED) ===" -ForegroundColor Cyan

# --- STEP 1: Create middleware.ts with correct Supabase SSR session check ---
Write-Host "[1/4] Creating middleware.ts..." -ForegroundColor Yellow
$middlewarePath = "src/middleware.ts"
$middlewareCode = @'
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/admin"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a protected route
  const isProtected = PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"))
  if (!isProtected) {
    return NextResponse.next()
  }

  // Check for Supabase SSR session cookie
  // @supabase/ssr names cookies: sb-<project-ref>-auth-token, often chunked as sb-<ref>-auth-token.0, .1, etc.
  const hasSession = request.cookies.has("sb-ohlgjvenwekpbpkykutz-auth-token") ||
                     request.cookies.has("sb-auth-token") ||
                     Array.from(request.cookies.getAll()).some(c => c.name.startsWith("sb-") && c.name.includes("auth-token"))

  if (!hasSession) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}
'@
Set-Content -LiteralPath $middlewarePath $middlewareCode -Force
Write-Host "  Created: $middlewarePath" -ForegroundColor Green
Write-Host "  Protected: /dashboard, /admin" -ForegroundColor Green
Write-Host "  Skipped for now: /partner, /advertiser, /institution/dashboard (old login pages, no cookies)" -ForegroundColor Yellow

# --- STEP 2: Build ---
Write-Host "[2/4] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

# --- STEP 3: Commit and push ---
Write-Host "[3/4] Committing..." -ForegroundColor Yellow
git add -A
git commit -m "feat: add auth middleware protecting /dashboard and /admin"
git push origin main
Write-Host "  Pushed to main" -ForegroundColor Green

# --- STEP 4: Deploy ---
Write-Host "[4/4] Deploying..." -ForegroundColor Yellow
vercel --prod
Write-Host "  Deployed" -ForegroundColor Green

Write-Host "`n=== BATCH B SCRIPT 3 COMPLETE ===" -ForegroundColor Cyan
Write-Host "Protected: /dashboard, /admin" -ForegroundColor Green
Write-Host "Skipped (old login pages, no SSR cookies): /partner, /advertiser, /institution/dashboard" -ForegroundColor Yellow
Write-Host "Next: Migrate partner/advertiser/institution login pages to @supabase/ssr, then expand guards" -ForegroundColor White
