import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getDashboardStatsServer } from "@/lib/dashboard-stats-server"
import { hasDbAdminRoleServer } from "@/lib/auth/admin-check-server"

// Admin-only. Previously returned platform aggregate stats to anyone.
// Identity: verified Supabase session (auth.getUser() validates the session
// with the auth server). Admin evidence: admin_users / user_roles only.
export async function GET() {
  const supabase = await createClient()
  let user: { id: string; email?: string | null } | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) user = data.user
  } catch {
    user = null
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!(await hasDbAdminRoleServer(user))) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const stats = await getDashboardStatsServer()
  return NextResponse.json(stats)
}
