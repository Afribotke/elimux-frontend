import { NextResponse } from "next/server"
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { createClient: createServiceClient } = await import("@supabase/supabase-js")
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  const supabaseAuth = await createClient()
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  // UNIFIED PERMISSION: institution_accounts (active) is the primary path now,
  // matching the rest of the institution portal. Kept the original users.role
  // check as a fallback rather than dropping it silently - the brief's rewrite
  // pattern would have removed platform admin/super_admin's ability to use this
  // endpoint too (they don't have an institution_accounts row), which wasn't
  // asked for and looked like an unintended side effect of "unify", not a
  // deliberate access removal.
  let institutionId: string | null = null

  const { data: account } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (account) {
    institutionId = account.institution_id
  } else {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = userData?.role || user.user_metadata?.role || "student"
    if (role !== "institution_admin" && role !== "institution_owner" && role !== "admin" && role !== "super_admin") {
      return NextResponse.json({ error: "Institution owner access required" }, { status: 403 })
    }
    // Legacy role-based path: no institution_accounts row to resolve an id
    // from, same as the original code (institution_id left null below,
    // "Will be set by trigger or admin").
  }

  try {
    const { students } = await request.json()
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, failed: 1, errors: [{ row: 0, reason: "No students provided" }] }, { status: 400 })
    }

    const results = []
    const errors = []
    let created = 0

    for (let i = 0; i < students.length; i++) {
      const s = students[i]
      try {
        // Check if student already exists by registration_number
        const { data: existing } = await supabase
          .from("attachment_eligible_students")
          .select("id")
          .eq("registration_number", s.registration_number)
          .single()

        if (existing) {
          errors.push({ row: i + 1, reason: `Registration number ${s.registration_number} already exists` })
          continue
        }

        // Create auth user if not exists
        const tempPassword = Math.random().toString(36).slice(-10) + "A1!"
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: s.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            role: "student",
            student_name: s.student_name,
            registration_number: s.registration_number,
            is_attachment_eligible: true
          }
        })

        if (authError && authError.message !== "User already registered") {
          errors.push({ row: i + 1, reason: `Auth error: ${authError.message}` })
          continue
        }

        const userId = authData?.user?.id

        // Insert into attachment_eligible_students
        const { error: insertError } = await supabase.from("attachment_eligible_students").insert({
          user_id: userId,
          student_name: s.student_name,
          registration_number: s.registration_number,
          email: s.email,
          course: s.course,
          department: s.department,
          year_of_study: s.year_of_study,
          phone: s.phone,
          institution_id: institutionId, // Will be set by trigger or admin if null (legacy role path)
          status: "eligible",
          attachment_status: "not_placed"
        })

        if (insertError) {
          errors.push({ row: i + 1, reason: `Database error: ${insertError.message}` })
          continue
        }

        created++
        results.push({ row: i + 1, student_name: s.student_name, status: "created" })
      } catch (err: any) {
        errors.push({ row: i + 1, reason: err.message || "Unknown error" })
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      created,
      failed: errors.length,
      results,
      errors
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 })
  }
}
