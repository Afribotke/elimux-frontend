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
