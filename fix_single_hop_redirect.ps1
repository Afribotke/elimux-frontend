$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== FIX: SINGLE-HOP /internships REDIRECT ===" -ForegroundColor Cyan

# --- 1. Read current middleware.ts ---
Write-Host "[1/4] Reading current middleware..." -ForegroundColor Yellow
$middlewarePath = "src/middleware.ts"
if (-not (Test-Path -LiteralPath $middlewarePath)) {
    Write-Host "ERROR: middleware.ts not found" -ForegroundColor Red
    exit 1
}

$middleware = Get-Content -LiteralPath $middlewarePath -Raw

# --- 2. Add redirect check at the top of the middleware function ---
Write-Host "[2/4] Adding single-hop redirect to middleware..." -ForegroundColor Yellow

# Find the start of the middleware function and insert redirect check
$redirectCheck = @'
  // SINGLE-HOP REDIRECT: /internships → /opportunities/ (runs before trailingSlash normalization)
  if (request.nextUrl.pathname === '/internships' || request.nextUrl.pathname === '/internships/') {
    return NextResponse.redirect(new URL('/opportunities/', request.url), 308)
  }

'@

if ($middleware -notmatch "request\.nextUrl\.pathname === '/internships'") {
    # Insert after the opening brace of the middleware function
    $middleware = $middleware -replace "(export\s+(?:async\s+)?function\s+middleware\s*\([^)]*\)\s*\{)", "`$1`n$redirectCheck"
    Set-Content -LiteralPath $middlewarePath $middleware -Force
    Write-Host "  Added redirect check to middleware" -ForegroundColor Green
} else {
    Write-Host "  Redirect check already exists" -ForegroundColor Green
}

# --- 3. Update matcher to include /internships ---
Write-Host "[3/4] Updating matcher..." -ForegroundColor Yellow
if ($middleware -notmatch "/internships") {
    $middleware = $middleware -replace "(matcher:\s*\[)", "`$1`"/internships`", `"/internships/ `", "
    Set-Content -LiteralPath $middlewarePath $middleware -Force
    Write-Host "  Updated matcher" -ForegroundColor Green
}

# --- 4. Remove redirect from next.config.js (now handled by middleware) ---
Write-Host "[4/4] Removing redundant redirect from next.config.js..." -ForegroundColor Yellow
$nextConfig = Get-Content -LiteralPath "next.config.js" -Raw
if ($nextConfig -match "source:\s*'/internships'") {
    # Remove the redirects block entirely since middleware handles it
    $nextConfig = $nextConfig -replace "async\s+redirects\s*\(\)\s*\{\s*return\s*\[\s*\{[^}]*source:\s*'/internships'[^}]*\}\s*\];\s*\},?\s*", ""
    # Also remove any trailing comma before the closing brace if needed
    $nextConfig = $nextConfig -replace ",\s*(\})", "`$1"
    Set-Content -LiteralPath "next.config.js" $nextConfig -Force
    Write-Host "  Removed redundant redirect from next.config.js" -ForegroundColor Green
}

# --- 5. Build, commit, deploy ---
Write-Host "[5/5] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

git add -A
git commit -m "fix: single-hop redirect /internships -> /opportunities via middleware"
git push origin main
Write-Host "  Pushed" -ForegroundColor Green

vercel --prod
Write-Host "  Deployed" -ForegroundColor Green

# --- 6. Verify ---
Write-Host "[6/6] Verifying single-hop redirect..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
$response = Invoke-WebRequest -Uri "https://v2.elimux.ke/internships" -Method HEAD -MaximumRedirection 0 -ErrorAction SilentlyContinue
Write-Host "  Status: $($response.StatusCode)" -ForegroundColor $(if($response.StatusCode -eq 308){'Green'}else{'Red'})
if ($response.Headers['Location']) {
    Write-Host "  Location: $($response.Headers['Location'])" -ForegroundColor Green
}

Write-Host "`n=== SINGLE-HOP REDIRECT COMPLETE ===" -ForegroundColor Cyan
Write-Host "Middleware handles redirect BEFORE trailingSlash fires" -ForegroundColor Green
Write-Host "Target: /internships -> 308 -> /opportunities/ (single hop)" -ForegroundColor Green
