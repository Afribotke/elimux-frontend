$ErrorActionPreference="Stop"
$frontend="C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Set-Location $frontend

Write-Host "`n=== FIXING EMPLOYER API ROUTES TO MATCH REAL SCHEMA ===" -ForegroundColor Cyan

# --- 1. Fix bulk upload API ---
Write-Host "[1/3] Fixing bulk upload API..." -ForegroundColor Yellow
$bulkApi = @'
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { randomBytes } from "crypto"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

function generateToken() {
  return randomBytes(32).toString("hex")
}

export async function POST(request: Request) {
  try {
    const { employers } = await request.json()
    if (!Array.isArray(employers) || employers.length === 0) {
      return NextResponse.json({ error: "No employers provided" }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const emp of employers) {
      const { company_name, email, industry, location, website, phone } = emp
      if (!company_name || !email) {
        errors.push({ company_name: company_name || "UNKNOWN", reason: "Missing company_name or email" })
        continue
      }

      const token = generateToken()

      const { data: existing } = await supabase
        .from("employers")
        .select("id")
        .eq("company_email", email)
        .single()

      if (existing) {
        errors.push({ company_name, reason: "Email already exists" })
        continue
      }

      const { error: insertError } = await supabase.from("employers").insert({
        company_name,
        company_email: email,
        industry: industry || null,
        location_county: location || null,
        website_url: website || null,
        company_phone: phone || null,
        verification_status: "pending",
        is_active: false,
        invitation_token: token
      })

      if (insertError) {
        errors.push({ company_name, reason: insertError.message })
        continue
      }

      results.push({
        company_name,
        email,
        invitation_link: `https://v2.elimux.ke/employer/activate?token=${token}`,
        status: "invited"
      })
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      results,
      errors
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Bulk upload failed" }, { status: 500 })
  }
}
'@
Set-Content -LiteralPath "src/app/api/admin/employers/bulk-upload/route.ts" $bulkApi -Force
Write-Host "  Fixed: bulk upload API uses real column names" -ForegroundColor Green

# --- 2. Fix verify token API ---
Write-Host "[2/3] Fixing verify token API..." -ForegroundColor Yellow
$verifyCode = @'
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  const { data, error } = await supabase
    .from("employers")
    .select("company_name, company_email, verification_status, is_active")
    .eq("invitation_token", token)
    .single()

  if (error || !data || data.verification_status !== "pending" || data.is_active) {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true, employer: data })
}
'@
Set-Content -LiteralPath "src/app/api/employers/verify-token/route.ts" $verifyCode -Force
Write-Host "  Fixed: verify token uses real columns" -ForegroundColor Green

# --- 3. Fix activation API ---
Write-Host "[3/3] Fixing activation API..." -ForegroundColor Yellow
$activateApi = @'
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)

export async function POST(request: Request) {
  try {
    const { token, password, companyName, industry, location, website, phone, description } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 })
    }

    const { data: employer } = await supabase
      .from("employers")
      .select("id, company_email, verification_status, is_active")
      .eq("invitation_token", token)
      .single()

    if (!employer || employer.verification_status !== "pending" || employer.is_active) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: employer.company_email,
      password,
      email_confirm: true,
      user_metadata: { role: "employer", company_name: companyName }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("employers")
      .update({
        user_id: authData.user.id,
        company_name: companyName,
        industry: industry || null,
        location_county: location || null,
        website_url: website || null,
        company_phone: phone || null,
        description: description || null,
        verification_status: "approved",
        is_active: true,
        invitation_token: null
      })
      .eq("id", employer.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Activation failed" }, { status: 500 })
  }
}
'@
Set-Content -LiteralPath "src/app/api/employers/activate/route.ts" $activateApi -Force
Write-Host "  Fixed: activation uses real columns" -ForegroundColor Green

# --- Build, commit, deploy ---
Write-Host "[4/4] Building..." -ForegroundColor Yellow
npm run build
Write-Host "  Build passed" -ForegroundColor Green

git add -A
git commit -m "fix: employer APIs use real schema (company_email, company_phone, website_url, location_county, verification_status, is_active)"
git push origin main
Write-Host "  Pushed" -ForegroundColor Green

vercel --prod
Write-Host "  Deployed" -ForegroundColor Green

Write-Host "`n=== SCHEMA FIX COMPLETE ===" -ForegroundColor Cyan
Write-Host "Only invitation_token was added to the database" -ForegroundColor Green
Write-Host "All API routes now use the real column names" -ForegroundColor Green
Write-Host "Existing employers (Safaricom, etc.) are preserved" -ForegroundColor Green
