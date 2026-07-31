'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const internshipId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [internship, setInternship] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  // Kept separate from `error` so a logged-out visitor gets a real "Log in to
  // apply" call to action instead of collapsing into the generic red error
  // box - previously the only way out of that box was "Browse internships",
  // a dead end with no path back to actually applying.
  const [notLoggedIn, setNotLoggedIn] = useState(false)

  const [form, setForm] = useState({
    coverLetter: '',
    portfolioLinks: '',
    videoIntroUrl: '',
    resumeUrl: '',
    enrollmentLetterUrl: '',
  })

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setNotLoggedIn(true)
          return
        }

        const { data: internData } = await supabase
          .from('internships')
          .select('*')
          .eq('id', internshipId)
          .single()

        if (!internData) {
          setError('Internship not found')
          return
        }

        setInternship(internData)

        const { data: profileData } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setStudent(profileData || null)
        if (profileData?.resume_url) {
          setForm(f => ({ ...f, resumeUrl: profileData.resume_url }))
        }
      } catch (err: any) {
        // Without this, any thrown error (auth session parse failure, network
        // rejection) left loading stuck at true forever with no visible error -
        // the page just hung on "Loading...".
        console.error('Failed to load application page:', err)
        setError(err?.message || 'Something went wrong loading this page. Please refresh and try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [internshipId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const payload = {
        student_id: user.id,
        internship_id: internshipId,
        cover_letter: form.coverLetter,
        portfolio_links: form.portfolioLinks ? form.portfolioLinks.split(',').map(s => s.trim()).filter(Boolean) : [],
        video_intro_url: form.videoIntroUrl || undefined,
        enrollment_letter_url: form.enrollmentLetterUrl || undefined,
        // The applications table has no dedicated resume_url column; the
        // backend's free-form `answers` map is the sanctioned extension point
        // for exactly this kind of per-application field without a schema
        // change. Falls back to the resume already on the student's profile.
        ...(form.resumeUrl ? { answers: { resume_url: form.resumeUrl } } : {}),
      }
      
      const res = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'Failed to submit')
      
      setSuccess(true)
      setTimeout(() => router.push('/internships/my-applications/'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>
  
  if (success) return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h2 className="text-2xl font-bold text-green-600 mb-4">Application Submitted!</h2>
      <p className="text-muted-foreground mb-4">Redirecting to your applications...</p>
      <Link href="/internships/" className="text-primary hover:underline">Back to Internships</Link>
    </div>
  )

  if (notLoggedIn) return (
    <div className="container mx-auto px-4 py-8 max-w-md text-center">
      <div className="border rounded-lg bg-card p-8">
        <h2 className="text-xl font-bold mb-2">Log in to apply</h2>
        <p className="text-muted-foreground mb-6">You need an account to submit this application.</p>
        <Link href={`/auth/login?redirect=/internships/${internshipId}/apply`}>
          <Button className="w-full">Log In to Apply</Button>
        </Link>
        <Link href="/internships/" className="text-sm text-muted-foreground hover:underline mt-4 inline-block">
          Browse internships instead
        </Link>
      </div>
    </div>
  )

  if (error && !internship) return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-4 bg-red-50 text-red-800 rounded">{error}</div>
      <Link href="/internships/" className="text-primary hover:underline mt-4 inline-block">Browse internships</Link>
    </div>
  )
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/internships/${internshipId}/`} className="text-sm text-muted-foreground hover:underline">
          ← Back to position
        </Link>
      </div>
      
      <div className="border rounded-lg bg-card">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Apply: {internship?.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {internship?.profession_category} • {internship?.location_county || 'Remote'} • {internship?.duration_weeks} weeks
          </p>
          
          {internship?.target_audience === 'attachment_only' && (
            <div className="mt-3 p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200">
              <strong>Attachment Position:</strong> Prioritized for currently enrolled students.
            </div>
          )}
          {internship?.target_audience === 'internship_only' && (
            <div className="mt-3 p-3 bg-purple-50 text-purple-800 text-sm rounded border border-purple-200">
              <strong>Internship Position:</strong> For graduates seeking experience.
            </div>
          )}
          {internship?.requires_university_verification && (
            <div className="mt-3 p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
              <strong>Verification Required:</strong> University enrollment proof needed.
            </div>
          )}
          
          {student?.student_type && (
            <div className="mt-3 text-sm">
              <span className="font-medium">Your profile:</span>{' '}
              <span className="capitalize">{student.student_type}</span>
              {student.is_university_verified && <span className="text-green-600 ml-2">✓ Verified</span>}
            </div>
          )}
        </div>
        
        <div className="p-6">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-800 text-sm rounded">{error}</div>}
          
          {!student ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Complete your student profile before applying.</p>
              <Link href="/student/profile/">
                <Button>Complete Profile</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter <span className="text-red-500">*</span></Label>
                <Textarea
                  id="coverLetter"
                  value={form.coverLetter}
                  onChange={e => setForm({...form, coverLetter: e.target.value})}
                  placeholder="Explain why you're a good fit for this role..."
                  rows={6}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolioLinks">Portfolio Links (comma-separated)</Label>
                <Input
                  id="portfolioLinks"
                  value={form.portfolioLinks}
                  onChange={e => setForm({...form, portfolioLinks: e.target.value})}
                  placeholder="https://github.com/you, https://yourportfolio.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="videoIntroUrl">Video Introduction URL</Label>
                <Input
                  id="videoIntroUrl"
                  type="url"
                  value={form.videoIntroUrl}
                  onChange={e => setForm({...form, videoIntroUrl: e.target.value})}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resumeUrl">Resume / CV Link</Label>
                <Input
                  id="resumeUrl"
                  type="url"
                  value={form.resumeUrl}
                  onChange={e => setForm({...form, resumeUrl: e.target.value})}
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  {student?.resume_url
                    ? 'Pre-filled from your profile. Change it to submit a different resume for this application.'
                    : 'Upload to Google Drive/Dropbox and paste the shareable link.'}
                </p>
              </div>

              {internship?.requires_university_verification && (
                <div className="space-y-2">
                  <Label htmlFor="enrollmentLetterUrl">Enrollment Letter URL <span className="text-red-500">*</span></Label>
                  <Input
                    id="enrollmentLetterUrl"
                    type="url"
                    value={form.enrollmentLetterUrl}
                    onChange={e => setForm({...form, enrollmentLetterUrl: e.target.value})}
                    placeholder="Link to enrollment verification document"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Upload to Google Drive/Dropbox and paste the shareable link.</p>
                </div>
              )}
              
              <div className="pt-4 flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Link href={`/internships/${internshipId}/`}>
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
