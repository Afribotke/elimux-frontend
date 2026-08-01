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
