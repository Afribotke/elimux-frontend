'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'
import { getBursaryApplicantProfile, updateBursaryApplicantProfile, getBursaryAlertPreferences, updateBursaryAlertPreferences } from '@/lib/api'
import { ArrowLeft, CheckCircle2, Bell } from 'lucide-react'

const ALERT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'deadline', label: 'Deadline reminders' },
  { value: 'new_match', label: 'New matching bursaries' },
]

interface AlertFormState {
  alertTypes: string[]
  fieldOfStudy: string
  minAmount: string
  maxAmount: string
}

const EMPTY_ALERT_FORM: AlertFormState = { alertTypes: ['deadline', 'new_match'], fieldOfStudy: '', minAmount: '', maxAmount: '' }

interface FormState {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  institution: string
  course: string
  yearOfStudy: string
  gpa: string
}

const EMPTY_FORM: FormState = {
  fullName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  institution: '',
  course: '',
  yearOfStudy: '',
  gpa: '',
}

const inputClass =
  'w-full px-3 py-2 rounded-md bg-elimux-dark border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500/50'
const labelClass = 'block text-sm font-medium text-muted mb-1'

function BursaryProfileForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [alertForm, setAlertForm] = useState<AlertFormState>(EMPTY_ALERT_FORM)
  const [alertSaving, setAlertSaving] = useState(false)
  const [alertSaved, setAlertSaved] = useState(false)
  const [alertError, setAlertError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data } = await getUserWithTimeout()
    if (!data.user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect ? `/bursary/profile?redirect=${redirect}` : '/bursary/profile')}`)
      return
    }
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/auth/login?redirect=${encodeURIComponent(redirect ? `/bursary/profile?redirect=${redirect}` : '/bursary/profile')}`)
        return
      }
      const { profile } = await getBursaryApplicantProfile(session.access_token)
      if (profile) {
        setForm({
          fullName: profile.fullName || '',
          email: profile.email || data.user.email || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          institution: profile.institution || '',
          course: profile.course || '',
          yearOfStudy: profile.yearOfStudy != null ? String(profile.yearOfStudy) : '',
          gpa: profile.gpa || '',
        })
      } else {
        setForm((f) => ({ ...f, email: data.user.email || '' }))
      }

      const { preferences } = await getBursaryAlertPreferences(session.access_token)
      setAlertForm({
        alertTypes: preferences.alertTypes || [],
        fieldOfStudy: preferences.fieldOfStudy || '',
        minAmount: preferences.minAmount != null ? String(preferences.minAmount) : '',
        maxAmount: preferences.maxAmount != null ? String(preferences.maxAmount) : '',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  function toggleAlertType(type: string) {
    setAlertForm((f) => ({
      ...f,
      alertTypes: f.alertTypes.includes(type) ? f.alertTypes.filter((t) => t !== type) : [...f.alertTypes, type],
    }))
  }

  async function handleAlertSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAlertSaving(true)
    setAlertError(null)
    setAlertSaved(false)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login?redirect=/bursary/profile')
        return
      }
      await updateBursaryAlertPreferences(
        {
          alertTypes: alertForm.alertTypes,
          fieldOfStudy: alertForm.fieldOfStudy || null,
          minAmount: alertForm.minAmount ? Number(alertForm.minAmount) : null,
          maxAmount: alertForm.maxAmount ? Number(alertForm.maxAmount) : null,
        },
        session.access_token
      )
      setAlertSaved(true)
    } catch (err: any) {
      setAlertError(err.message || 'Failed to save alert preferences')
    } finally {
      setAlertSaving(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login?redirect=/bursary/profile')
        return
      }
      await updateBursaryApplicantProfile(
        {
          fullName: form.fullName || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          institution: form.institution || undefined,
          course: form.course || undefined,
          yearOfStudy: form.yearOfStudy ? Number(form.yearOfStudy) : undefined,
          gpa: form.gpa || undefined,
        },
        session.access_token
      )
      setSaved(true)
      if (redirect && form.fullName) {
        setTimeout(() => router.push(redirect), 800)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-elimux-dark flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-elimux-dark">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/bursary" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary-400 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to bursaries
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-2">Applicant Profile</h1>
        <p className="text-muted mb-8">This information is shared with bursary providers when you apply.</p>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">{error}</div>}
        {saved && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-6 flex items-center gap-2 text-primary-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Profile saved.
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-elimux-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input className={inputClass} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" className={inputClass} value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
            </div>
          </div>

          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide pt-2">Academic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Institution</label>
              <input className={inputClass} value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Course / Degree</label>
              <input className={inputClass} value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Year of Study</label>
              <input type="number" min="1" className={inputClass} value={form.yearOfStudy} onChange={(e) => setForm((f) => ({ ...f, yearOfStudy: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>GPA / Grade</label>
              <input className={inputClass} value={form.gpa} onChange={(e) => setForm((f) => ({ ...f, gpa: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>

        <h2 className="text-lg font-bold text-foreground mt-10 mb-2 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Alert Preferences
        </h2>
        <p className="text-muted mb-4">Choose what bursary updates you want to hear about.</p>

        {alertError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 text-red-400">{alertError}</div>}
        {alertSaved && (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 mb-4 flex items-center gap-2 text-primary-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Alert preferences saved.
          </div>
        )}

        <form onSubmit={handleAlertSubmit} className="bg-elimux-card border border-border rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            {ALERT_TYPE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertForm.alertTypes.includes(opt.value)}
                  onChange={() => toggleAlertType(opt.value)}
                  className="rounded border-border"
                />
                {opt.label}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Field of Study</label>
              <input
                className={inputClass}
                placeholder="e.g. STEM"
                value={alertForm.fieldOfStudy}
                onChange={(e) => setAlertForm((f) => ({ ...f, fieldOfStudy: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Min Amount (KES)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={alertForm.minAmount}
                onChange={(e) => setAlertForm((f) => ({ ...f, minAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Max Amount (KES)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={alertForm.maxAmount}
                onChange={(e) => setAlertForm((f) => ({ ...f, maxAmount: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={alertSaving}
              className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50"
            >
              {alertSaving ? 'Saving…' : 'Save Alert Preferences'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default function BursaryProfilePage() {
  return (
    <Suspense fallback={null}>
      <BursaryProfileForm />
    </Suspense>
  )
}
