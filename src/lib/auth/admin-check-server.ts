// SERVER-ONLY (enforced: importing this from a client component is a build error).
//
// DB-backed platform-admin check, mirroring elimux-backend's hasDbAdminRole:
// admin = an active admin_users row matching the verified user's email, OR a
// user_roles row for the verified user's id, with role admin | super_admin.
// Never users.role (write protection unverified) and never user_metadata
// (writable by the user).
//
// Uses the service-role key because admin_users is not readable by the
// anon/authenticated roles. SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_
// prefix, so Next.js never inlines it into client bundles; this is the same
// pattern src/lib/dashboard-stats-server.ts already uses for this page.
import "server-only"
import { createClient } from "@supabase/supabase-js"

const DB_ADMIN_ROLES = ["admin", "super_admin"]

export async function hasDbAdminRoleServer(user: { id: string; email?: string | null }): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  if (!url || !serviceRoleKey) return false // fail closed

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const [adminRow, roleRow] = await Promise.all([
      user.email
        ? admin.from("admin_users").select("role, is_active").eq("email", user.email).maybeSingle()
        : Promise.resolve({ data: null }),
      admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    ])
    const adminUser = adminRow.data as { role?: string; is_active?: boolean } | null
    const role =
      (adminUser && adminUser.is_active !== false ? adminUser.role : undefined) ||
      (roleRow.data as { role?: string } | null)?.role
    return role !== undefined && DB_ADMIN_ROLES.includes(role)
  } catch {
    return false // fail closed
  }
}
