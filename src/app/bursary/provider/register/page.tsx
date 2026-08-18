'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Landmark, CheckCircle2, Copy } from 'lucide-react'
import { registerBursaryProvider, type BursaryProviderRegistrationResult } from '@/lib/api'

const PROVIDER_TYPES: { value: string; label: string }[] = [
  { value: 'county', label: 'County Government' },
  { value: 'ngcdf', label: 'NG-CDF' },
  { value: 'ward', label: 'Ward Office' },
  { value: 'ngo', label: 'NGO' },
  { value: 'csr', label: 'Corporate CSR' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'alumni', label: 'Alumni Association' },
  { value: 'school', label: 'School' },
  { value: 'individual', label: 'Individual' },
]

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-elimux-card border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500/50'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

interface FormState {
  name: string
  type: string
  registrationNumber: string
  email: string
  phone: string
  county: string
  subCounty: string
  ward: string
  address: string
  adminName: string
  adminEmail: string
  adminPhone: string
}

const EMPTY_FORM: FormState = {
  name: '',
  type: 'county',
  registrationNumber: '',
  email: '',
  phone: '',
  county: '',
  subCounty: '',
  ward: '',
  address: '',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
}

export default function BursaryProviderRegisterPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BursaryProviderRegistrationResult | null>(null)
  const [copied, setCopied] = useState(false)

  function update(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await registerBursaryProvider({
        name: form.name,
        type: form.type,
        registrationNumber: form.registrationNumber || undefined,
        email: form.email,
        phone: form.phone,
        county: form.county || undefined,
        subCounty: form.subCounty || undefined,
        ward: form.ward || undefined,
        address: form.address || undefined,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPhone: form.adminPhone || undefined,
      })
      setResult(res)
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function copyToken() {
    if (!result) return
    navigator.clipboard.writeText(result.adminInvite.token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (result) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card flex flex-col items-center justify-center px-4 py-20 text-center">
        <CheckCircle2 className="w-14 h-14 text-primary-400 mb-6" />
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Registration received</h1>
        <p className="text-muted mb-8 max-w-md">{result.message}</p>

        <div className="w-full max-w-md rounded-xl bg-elimux-card border border-border p-6 text-left space-y-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Portal URL</p>
            <p className="text-foreground font-medium break-all">{result.tenant.portalUrl}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">Admin invite token</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-foreground bg-background rounded-lg px-3 py-2 break-all border border-border">
                {result.adminInvite.token}
              </code>
              <button
                onClick={copyToken}
                className="shrink-0 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                aria-label="Copy invite token"
              >
                <Copy className="w-4 h-4 text-muted" />
              </button>
            </div>
            {copied && <p className="text-xs text-primary-400 mt-1">Copied</p>}
            <p className="text-xs text-muted mt-2">
              Share this token with {result.adminInvite.email} — the founder distributes it manually for now.
            </p>
          </div>
        </div>

        <Link
          href="https://bursary.elimux.ke"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors mt-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bursary Engine
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          href="https://bursary.elimux.ke"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bursary Engine
        </Link>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-4">
          <Landmark className="w-4 h-4" />
          Provider Registration
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Register as a Funding Provider</h1>
        <p className="text-muted mb-10">
          Create your branded bursary portal. Free to start — no payment required to register.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Organization</h2>
            <div>
              <label className={labelClass}>Organization Name *</label>
              <input required className={inputClass} value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type *</label>
                <select required className={inputClass} value={form.type} onChange={(e) => update('type', e.target.value)}>
                  {PROVIDER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Registration Number</label>
                <input
                  className={inputClass}
                  value={form.registrationNumber}
                  onChange={(e) => update('registrationNumber', e.target.value)}
                  placeholder="KRA PIN, NGO Board no., etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Organization Email *</label>
                <input required type="email" className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Organization Phone *</label>
                <input required className={inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>County</label>
                <input className={inputClass} value={form.county} onChange={(e) => update('county', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Sub-County</label>
                <input className={inputClass} value={form.subCounty} onChange={(e) => update('subCounty', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Ward</label>
                <input className={inputClass} value={form.ward} onChange={(e) => update('ward', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={form.address} onChange={(e) => update('address', e.target.value)} />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">Admin Contact</h2>
            <div>
              <label className={labelClass}>Admin Name *</label>
              <input required className={inputClass} value={form.adminName} onChange={(e) => update('adminName', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Admin Email *</label>
                <input
                  required
                  type="email"
                  className={inputClass}
                  value={form.adminEmail}
                  onChange={(e) => update('adminEmail', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Admin Phone</label>
                <input className={inputClass} value={form.adminPhone} onChange={(e) => update('adminPhone', e.target.value)} />
              </div>
            </div>
          </section>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Registering…' : 'Register Provider'}
          </button>
        </form>
      </div>
    </main>
  )
}
