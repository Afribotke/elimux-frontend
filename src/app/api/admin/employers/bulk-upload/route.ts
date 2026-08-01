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
