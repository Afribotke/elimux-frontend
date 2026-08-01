import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

export interface DashboardStats {
  institutions: number
  programs: number
  students: number
  applications: number
  revenue: number
}

export async function getDashboardStatsServer(): Promise<DashboardStats> {
  const [
    { count: institutions },
    { count: programs },
    { count: students },
    { count: applications },
    { count: revenue }
  ] = await Promise.all([
    supabaseServer.from("institutions").select("*", { count: "exact", head: true }),
    supabaseServer.from("programs").select("*", { count: "exact", head: true }),
    supabaseServer.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabaseServer.from("applications").select("*", { count: "exact", head: true }),
    supabaseServer.from("payments").select("*", { count: "exact", head: true }).eq("status", "completed")
  ])

  return {
    institutions: institutions || 0,
    programs: programs || 0,
    students: students || 0,
    applications: applications || 0,
    revenue: revenue || 0
  }
}
