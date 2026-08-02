import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    )

    const { data, error } = await supabase
      .from("internships")
      .select("*, employer:employers(company_name, location_county, website_url)")
      .eq("status", "active")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch opportunities" }, { status: 500 })
  }
}
