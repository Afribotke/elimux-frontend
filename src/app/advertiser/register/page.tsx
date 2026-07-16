'use client'

// ============================================
// ELIMUX AD PORTAL - ADVERTISER REGISTRATION
// /advertiser/register
// ============================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, CheckCircle, Building2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { advertiserFetch, passwordStrengthError, savePendingAdvertiserRegistration } from '@/lib/advertiserAuth'

const INDUSTRY_TYPES = [
  { value: 'university', label: 'University / College' },
  { value: 'college', label: 'TVET / Technical College' },
  { value: 'agent', label: 'Education Agent / Consultant' },
  { value: 'course_provider', label: 'Online Course Provider' },
  { value: 'other', label: 'Other Education Business' },
]

export default function AdvertiserRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'form' | 'submitted' | 'confirm_email'>('form')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    industry_type: 'university',
    tax_id: '',
    billing_address: {
      street: '',
      city: '',
      country: '',
      postal_code: '',
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith('billing_')) {
      const field = name.replace('billing_', '')
      setFormData((prev) => ({
        ...prev,
        billing_address: { ...prev.billing_address, [field]: value },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    const strengthError = passwordStrengthError(password)
    if (strengthError) {
      setError(strengthError)
      return
    }

    setLoading(true)

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.company_email,
        password,
      })

      if (signUpError) throw new Error(signUpError.message)

      if (!signUpData.session) {
        // Email confirmation is required - save the profile details and
        // finish creating the advertiser profile once the user logs in.
        savePendingAdvertiserRegistration(formData)
        setStatus('confirm_email')
        setLoading(false)
        return
      }

      const response = await advertiserFetch('/api/advertiser/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to register')

      setStatus('submitted')
      setTimeout(() => router.push('/advertiser/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'confirm_email') {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center p-4">
        <div className="bg-elimux-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <Mail className="w-12 h-12 text-primary-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Confirm Your Email</h2>
          <p className="text-muted mb-4">
            We sent a confirmation link to <span className="text-foreground">{formData.company_email}</span>.
            Once confirmed, sign in to finish setting up your advertiser profile.
          </p>
          <Link
            href="/advertiser/login"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-2 px-6 rounded-lg"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'submitted') {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center p-4">
        <div className="bg-elimux-card border border-border rounded-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-elimux-success mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Registration Submitted!</h2>
          <p className="text-muted mb-4">Your advertiser profile has been created and is pending approval.</p>
          <div className="animate-pulse text-sm text-muted">Redirecting...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elimux-dark py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-elimux-card rounded-xl border border-border overflow-hidden">
          <div className="px-8 py-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-400" />
              Become an Advertiser
            </h1>
            <p className="text-muted mt-1 text-sm">Promote your institution on ElimuX</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted mb-1 block">Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  required
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g., University of Nairobi"
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Company Email *</label>
                <input
                  type="email"
                  name="company_email"
                  required
                  value={formData.company_email}
                  onChange={handleChange}
                  placeholder="ads@university.edu"
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password *
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
                <p className="text-xs text-muted mt-1">At least 8 characters, with upper/lowercase letters and a number.</p>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  name="company_phone"
                  value={formData.company_phone}
                  onChange={handleChange}
                  placeholder="+254 700 000 000"
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Website</label>
                <input
                  type="url"
                  name="company_website"
                  value={formData.company_website}
                  onChange={handleChange}
                  placeholder="https://www.university.edu"
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Industry Type *</label>
                <select
                  name="industry_type"
                  required
                  value={formData.industry_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                >
                  {INDUSTRY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Tax ID / KRA PIN</label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  placeholder="A001234567B"
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-muted mb-1 block">Street Address</label>
                  <input
                    type="text"
                    name="billing_street"
                    value={formData.billing_address.street}
                    onChange={handleChange}
                    placeholder="123 Education Street"
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">City</label>
                  <input
                    type="text"
                    name="billing_city"
                    value={formData.billing_address.city}
                    onChange={handleChange}
                    placeholder="Nairobi"
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Country</label>
                  <input
                    type="text"
                    name="billing_country"
                    value={formData.billing_address.country}
                    onChange={handleChange}
                    placeholder="Kenya"
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Postal Code</label>
                  <input
                    type="text"
                    name="billing_postal_code"
                    value={formData.billing_address.postal_code}
                    onChange={handleChange}
                    placeholder="00100"
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>

            <p className="text-sm text-muted text-center">
              Already registered?{' '}
              <Link href="/advertiser/login" className="text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
