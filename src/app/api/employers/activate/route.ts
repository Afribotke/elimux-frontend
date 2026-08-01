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
      .select("id, email, status")
      .eq("invitation_token", token)
      .single()

    if (!employer || employer.status !== "invited") {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: employer.email,
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
        location: location || null,
        website: website || null,
        phone: phone || null,
        description: description || null,
        status: "active",
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
