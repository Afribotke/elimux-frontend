$ErrorActionPreference="Stop"
$backend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-backend"
Set-Location $backend

Write-Host "`n=== BACKEND: STRIPE + M-PESA STUBS ===" -ForegroundColor Cyan

# Detect pattern from existing payments.ts
$template = "src/routes/payments.ts"
if (-not (Test-Path -LiteralPath $template)) {
    Write-Host "ERROR: $template not found" -ForegroundColor Red
    exit 1
}

$pattern = Get-Content -LiteralPath $template -Raw
$usesRequire = $pattern -match "require\s*\("
Write-Host "Backend uses: $(if($usesRequire){'CommonJS (require)'}else{'ESM (import)'})" -ForegroundColor Green

# Create Stripe stub
$stripeFile = "src/routes/payments-stripe.ts"
$stripeContent = if ($usesRequire) {
"const express = require('express');
const router = express.Router();

router.post('/create-session', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured', message: 'Add STRIPE_SECRET_KEY in Railway dashboard' });
  }
  return res.status(501).json({ error: 'Not implemented', message: 'Stripe integration in development' });
});

module.exports = router;"
} else {
"import { Router } from 'express';
const router = Router();

router.post('/create-session', async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured', message: 'Add STRIPE_SECRET_KEY in Railway dashboard' });
  }
  return res.status(501).json({ error: 'Not implemented', message: 'Stripe integration in development' });
});

export default router;"
}
Set-Content -LiteralPath $stripeFile $stripeContent -Force
Write-Host "Created: $stripeFile" -ForegroundColor Green

# Create M-Pesa stub
$mpesaFile = "src/routes/payments-mpesa.ts"
$mpesaContent = if ($usesRequire) {
"const express = require('express');
const router = express.Router();

router.post('/stk-push', async (req, res) => {
  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
    return res.status(503).json({ error: 'M-Pesa not configured', message: 'Add MPESA keys in Railway dashboard' });
  }
  return res.status(501).json({ error: 'Not implemented', message: 'M-Pesa integration in development' });
});

module.exports = router;"
} else {
"import { Router } from 'express';
const router = Router();

router.post('/stk-push', async (req, res) => {
  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET) {
    return res.status(503).json({ error: 'M-Pesa not configured', message: 'Add MPESA keys in Railway dashboard' });
  }
  return res.status(501).json({ error: 'Not implemented', message: 'M-Pesa integration in development' });
});

export default router;"
}
Set-Content -LiteralPath $mpesaFile $mpesaContent -Force
Write-Host "Created: $mpesaFile" -ForegroundColor Green

# Wire into main file
$mainFile = if (Test-Path -LiteralPath "src/index.ts") { "src/index.ts" } elseif (Test-Path -LiteralPath "src/app.ts") { "src/app.ts" } else { $null }
if (-not $mainFile) {
    Write-Host "WARNING: Could not find main entry file" -ForegroundColor Red
    exit 1
}

$main = Get-Content -LiteralPath $mainFile -Raw
if ($main -notmatch "payments-stripe") {
    if ($usesRequire) {
        $imp = "const stripePayments = require('./routes/payments-stripe');`nconst mpesaPayments = require('./routes/payments-mpesa');"
    } else {
        $imp = "import stripePayments from './routes/payments-stripe';`nimport mpesaPayments from './routes/payments-mpesa';"
    }
    $use = "app.use('/api/payments/stripe', stripePayments);`napp.use('/api/payments/mpesa', mpesaPayments);"

    # Add imports after last import (semicolon optional - this codebase's imports have none)
    $main = $main -replace "(import\s+.*?from\s+['`"`"][^'`"`"]*['`"`"];?)(\r?\n)(?!.*import\s+.*?from\s+['`"`"])", "`$1`n$imp`n"

    # Add routes once, right before the final `export default` (avoids double-insertion via app.listen match)
    $main = $main -replace "(export\s+default)", "$use`n`n`$1"

    Set-Content -LiteralPath $mainFile $main -Force
    Write-Host "Wired into $mainFile" -ForegroundColor Green
} else {
    Write-Host "Already wired into $mainFile" -ForegroundColor Green
}

# Commit and push
git add -A
git commit -m "feat: add Stripe and M-Pesa payment route stubs"
git push origin main
Write-Host "Pushed to elimux-backend main" -ForegroundColor Green

Write-Host "`n=== BACKEND FIX COMPLETE ===" -ForegroundColor Cyan
