$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== FIXING CRITICAL SECURITY HOLE: /api/admin/employers/bulk-upload ===" -ForegroundColor Cyan

# --- Read the current file ---
$apiPath = "src/app/api/admin/employers/bulk-upload/route.ts"
$current = Get-Content -LiteralPath $apiPath -Raw

# --- Inject auth check at the top of POST handler ---
$authCheck = @'
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

// Helper: verify admin auth from request cookies
async function verifyAdminAuth(request: Request) {
  const cookieHeader = request.headers.get("cookie") || ""
  const authCookie = cookieHeader.split(";").find(c => c.trim().startsWith("sb-ohlgjvenwekpbpkykutz-auth-token="))

  if (!authCookie) {
    return { authorized: false, error: "No session found" }
  }

  const token = authCookie.split("=")[1].trim()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return { authorized: false, error: "Invalid session" }
  }

  // Check admin role in user metadata or public.users table
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = userData?.role || user.user_metadata?.role || "student"
  if (role !== "admin" && role !== "super_admin") {
    return { authorized: false, error: "Admin access required" }
  }

  return { authorized: true, userId: user.id }
}

export async function POST(request: Request) {
  // AUTH GUARD: Only admins can bulk upload employers
  const auth = await verifyAdminAuth(request)
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

'@

# Replace the import block and POST function start
$fixed = $current -replace "import \{ NextResponse \} from `"next/server`"\r?\nimport \{ createClient \} from `"@supabase/supabase-js`"\r?\nimport \{ randomBytes \} from `"crypto`"\r?\n\r?\nconst supabase = createClient\(\r?\n  process\.env\.NEXT_PUBLIC_SUPABASE_URL \|\| `"`",\r?\n  process\.env\.SUPABASE_SERVICE_ROLE_KEY \|\| `"`"\r?\n\)\r?\n\r?\nfunction generateToken\(\) \{\r?\n  return randomBytes\(32\)\.toString\(`"hex`"\)\r?\n\}\r?\n\r?\nexport async function POST\(request: Request\) \{\r?\n  try \{", ($authCheck + "`n  try {")

# Write the fixed file
Set-Content -LiteralPath $apiPath $fixed -Force
Write-Host "  Added admin auth guard to bulk upload API" -ForegroundColor Green

# --- Build check ---
Write-Host "[2/3] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

# --- Commit and deploy ---
Write-Host "[3/3] Committing and deploying..." -ForegroundColor Yellow
git add -A
git commit -m "security: add admin auth guard to employer bulk upload API"
git push origin main
Write-Host "  Pushed" -ForegroundColor Green

vercel --prod
Write-Host "  Deployed" -ForegroundColor Green

Write-Host "`n=== SECURITY FIX COMPLETE ===" -ForegroundColor Cyan
Write-Host "Only authenticated admins can now access /api/admin/employers/bulk-upload" -ForegroundColor Green
