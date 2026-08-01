import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ valid: false }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("employers")
    .select("company_name, email, status")
    .eq("invitation_token", token)
    .single()

  if (error || !data || data.status !== "invited") {
    return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true, employer: data })
}
