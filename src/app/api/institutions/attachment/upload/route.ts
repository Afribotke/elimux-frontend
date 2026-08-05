import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  )

  // AUTH GUARD: Only authenticated institution owners can upload students
  const cookieHeader = request.headers.get("cookie") || ""
  const authCookie = cookieHeader.split(";").find(c => c.trim().startsWith("sb-ohlgjvenwekpbpkykutz-auth-token="))

  if (!authCookie) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const token = authCookie.split("=")[1].trim()
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  )

  let authResult
  try {
    authResult = await Promise.race([
      supabaseAuth.auth.getUser(token),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Auth service timeout")), 8000)
      )
    ])
  } catch (raceErr: any) {
    if (raceErr?.message === "Auth service timeout") {
      return NextResponse.json({ error: "Authentication service temporarily unavailable. Please try again." }, { status: 503 })
    }
    throw raceErr
  }
  const { data: { user }, error: authError } = authResult as any
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  // Verify user is an institution admin/owner
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = userData?.role || user.user_metadata?.role || "student"
  if (role !== "institution_admin" && role !== "institution_owner" && role !== "admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Institution owner access required" }, { status: 403 })
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
          institution_id: null, // Will be set by trigger or admin
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
