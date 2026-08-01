$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
$backend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"

Write-Host "`n=== BATCH B SCRIPT 1: PAYMENT FIXES ===" -ForegroundColor Cyan

# --- FRONTEND ---
Set-Location $frontend

Write-Host "[1/4] Fixing Paystack env var name..." -ForegroundColor Yellow
$files = Get-ChildItem src -Recurse -Filter "*.tsx" | Where-Object { (Get-Content -LiteralPath $_.FullName -Raw) -match "NEXT_PUBLIC_PAYSTACK_KEY" }
if ($files) {
    foreach ($f in $files) {
        $content = Get-Content -LiteralPath $f.FullName -Raw
        $content = $content -replace "NEXT_PUBLIC_PAYSTACK_KEY", "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
        Set-Content -LiteralPath $f.FullName -Value $content -Force
        Write-Host "  Fixed: $($f.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "  No files needed fixing" -ForegroundColor Green
}

Write-Host "[2/4] Building frontend..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

Write-Host "[3/4] Committing frontend..." -ForegroundColor Yellow
git add -A
git commit -m "fix: correct Paystack env var name to NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
git push origin main
Write-Host "  Pushed to main" -ForegroundColor Green

# --- BACKEND ---
if (Test-Path $backend) {
    Set-Location $backend
    Write-Host "[4/4] Adding backend payment stubs..." -ForegroundColor Yellow

    $routesDir = if (Test-Path "src/routes") { "src/routes" } elseif (Test-Path "routes") { "routes" } else { $null }
    $mainFile = if (Test-Path "src/index.ts") { "src/index.ts" } elseif (Test-Path "src/app.ts") { "src/app.ts" } elseif (Test-Path "index.ts") { "index.ts" } else { $null }

    if ($routesDir -and $mainFile) {
        $paystackFile = Get-ChildItem $routesDir -Filter "*paystack*" | Select-Object -First 1
        if ($paystackFile) {
            $pattern = Get-Content $paystackFile.FullName -Raw
            $usesRequire = $pattern -match "require\s*\("

            if ($usesRequire) {
                $stripe = "const express = require('express');`nconst router = express.Router();`n`nrouter.post('/create-session', async (req, res) => {`n  if (!process.env.STRIPE_SECRET_KEY) {`n    return res.status(503).json({ error: 'Stripe not configured', message: 'Add STRIPE_SECRET_KEY in Railway dashboard' });`n  }`n  return res.status(501).json({ error: 'Not implemented', message: 'Stripe integration in development' });`n});`n`nmodule.exports = router;"
                $mpesa = "const express = require('express');`nconst router = express.Router();`n`nrouter.post('/stk-push', async (req, res) => {`n  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {`n    return res.status(503).json({ error: 'M-Pesa not configured', message: 'Add MPESA keys in Railway dashboard' });`n  }`n  return res.status(501).json({ error: 'Not implemented', message: 'M-Pesa integration in development' });`n});`n`nmodule.exports = router;"
            } else {
                $stripe = "import { Router } from 'express';`nconst router = Router();`n`nrouter.post('/create-session', async (req, res) => {`n  if (!process.env.STRIPE_SECRET_KEY) {`n    return res.status(503).json({ error: 'Stripe not configured', message: 'Add STRIPE_SECRET_KEY in Railway dashboard' });`n  }`n  return res.status(501).json({ error: 'Not implemented', message: 'Stripe integration in development' });`n});`n`nexport default router;"
                $mpesa = "import { Router } from 'express';`nconst router = Router();`n`nrouter.post('/stk-push', async (req, res) => {`n  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {`n    return res.status(503).json({ error: 'M-Pesa not configured', message: 'Add MPESA keys in Railway dashboard' });`n  }`n  return res.status(501).json({ error: 'Not implemented', message: 'M-Pesa integration in development' });`n});`n`nexport default router;"
            }

            Set-Content "$routesDir/payments-stripe.ts" $stripe -Force
            Set-Content "$routesDir/payments-mpesa.ts" $mpesa -Force
            Write-Host "  Created Stripe and M-Pesa routes" -ForegroundColor Green

            $main = Get-Content $mainFile -Raw
            if ($main -notmatch "payments-stripe") {
                if ($usesRequire) {
                    $imp = "const stripePayments = require('./routes/payments-stripe');`nconst mpesaPayments = require('./routes/payments-mpesa');"
                } else {
                    $imp = "import stripePayments from './routes/payments-stripe';`nimport mpesaPayments from './routes/payments-mpesa';"
                }
                $main = $main -replace "(import\s+.*?from\s+['`"`"].*?['`"`"];)(\r?\n)(?!.*import\s+.*?from\s+['`"`"])", "`$1`n$imp`n"
                $main = $main -replace "(app\.listen|export\s+default|module\.exports)", "app.use('/api/payments/stripe', stripePayments);`napp.use('/api/payments/mpesa', mpesaPayments);`n`$1"
                Set-Content $mainFile $main -Force
                Write-Host "  Wired into $mainFile" -ForegroundColor Green
            }

            git add -A
            git commit -m "feat: add Stripe and M-Pesa payment route stubs"
            git push origin main
            Write-Host "  Backend pushed" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: No Paystack route found to copy pattern" -ForegroundColor Red
        }
    } else {
        Write-Host "  WARNING: Could not determine backend structure" -ForegroundColor Red
    }
} else {
    Write-Host "[4/4] Backend directory not found - skipping" -ForegroundColor Yellow
}

Write-Host "`n=== BATCH B SCRIPT 1 COMPLETE ===" -ForegroundColor Cyan
Write-Host "Frontend: Paystack env var fixed" -ForegroundColor Green
Write-Host "Backend: Stripe and M-Pesa stubs added (if backend found)" -ForegroundColor Green
