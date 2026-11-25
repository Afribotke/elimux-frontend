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

  // AUTHORIZATION (admin-trust hotfix): the ONLY path is an active
  // institution_accounts row for the verified user. The old fallback read
  // users.role / user_metadata.role - user_metadata is writable by the user
  // themselves, so any account could set role=admin and bulk-create accounts.
  // That fallback (and its institution_id = null orphan rows) is removed.
  // institution_accounts.user_id is UNIQUE (elimux-sql 21_institution_accounts.sql),
  // so maybeSingle() cannot see multiple rows; any lookup error is a deny.
  const { data: account, error: accountError } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (accountError || !account?.institution_id) {
    return NextResponse.json({ error: "Active institution account required" }, { status: 403 })
  }
  const institutionId: string = account.institution_id

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
          institution_id: institutionId, // always the caller's active institution
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
