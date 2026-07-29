'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/admin/StatCard'
import { ArrowLeft, GraduationCap, CheckCircle2, XCircle } from 'lucide-react'

interface AdminStudentRow {
  id: string
  registration_number: string | null
  full_name: string
  email: string | null
  university_name: string | null
  course_name: string | null
  year_of_study: number | null
  is_university_verified: boolean
  created_at: string
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<AdminStudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      if (err) setError(err.message)
      else setStudents((data || []) as AdminStudentRow[])
      setLoading(false)
    }
    load()
  }, [])

  const verified = students.filter((s) => s.is_university_verified).length

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <GraduationCap className="w-8 h-8 text-primary-400" />
        Students
      </h1>
      <p className="text-muted mb-6">Student profiles registered on the platform.</p>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading students...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <StatCard icon={GraduationCap} label="Total Students" value={String(students.length)} />
            <StatCard icon={CheckCircle2} label="University Verified" value={String(verified)} color="text-elimux-success" />
            <StatCard icon={XCircle} label="Unverified" value={String(students.length - verified)} color="text-elimux-warning" />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Reg. Number</th>
                  <th className="px-4 py-3 font-medium">University</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{s.full_name}</p>
                      {s.email && <p className="text-xs text-muted">{s.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted font-mono text-xs">{s.registration_number || '—'}</td>
                    <td className="px-4 py-3 text-muted">{s.university_name || '—'}</td>
                    <td className="px-4 py-3 text-muted">{s.course_name || '—'}</td>
                    <td className="px-4 py-3 text-muted">{s.year_of_study ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          s.is_university_verified ? 'bg-elimux-success/10 text-elimux-success' : 'bg-elimux-warning/10 text-elimux-warning'
                        }`}
                      >
                        {s.is_university_verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
