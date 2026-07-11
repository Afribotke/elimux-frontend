'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { applyInstitution, applyProgram, getApplicationStatus, type InstitutionApplicationStatus } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'
import {
  Building2,
  GraduationCap,
  MapPin,
  Globe,
  Mail,
  Phone,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  ClipboardCheck,
  Search,
  Clock,
  XCircle,
  Copy,
} from 'lucide-react'

interface LookupItem {
  id: string
  name: string
}

interface InstitutionDraft {
  name: string
  type_id: string
  country_id: string
  city: string
  website: string
  email: string
  phone: string
  description: string
}

interface ProgramDraft {
  key: number
  name: string
  category_id: string
  level: string
  duration_months: string
  tuition_fees: string
  currency: string
  description: string
}

const EMPTY_INSTITUTION: InstitutionDraft = {
  name: '',
  type_id: '',
  country_id: '',
  city: '',
  website: '',
  email: '',
  phone: '',
  description: '',
}

function emptyProgram(key: number): ProgramDraft {
  return {
    key,
    name: '',
    category_id: '',
    level: '',
    duration_months: '',
    tuition_fees: '',
    currency: 'USD',
    description: '',
  }
}

const LEVELS = ['Certificate', 'Diploma', 'Undergraduate', 'Masters', 'PhD', 'Short Course']

const inputClass =
  'w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'

export default function InstitutionOnboardingPage() {
  const [mode, setMode] = useState<'apply' | 'status'>('apply')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [types, setTypes] = useState<LookupItem[]>([])
  const [countries, setCountries] = useState<LookupItem[]>([])
  const [categories, setCategories] = useState<LookupItem[]>([])

  const [institution, setInstitution] = useState<InstitutionDraft>(EMPTY_INSTITUTION)
  const [institutionApplicationId, setInstitutionApplicationId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  const [programs, setPrograms] = useState<ProgramDraft[]>([emptyProgram(0)])
  const [nextKey, setNextKey] = useState(1)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [statusToken, setStatusToken] = useState('')
  const [statusResult, setStatusResult] = useState<InstitutionApplicationStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLookups() {
      const [{ data: typeData }, { data: countryData }, { data: categoryData }] = await Promise.all([
        supabase.from('institution_types').select('id, name').order('name'),
        supabase.from('countries').select('id, name').eq('is_active', true).order('name'),
        supabase.from('program_categories').select('id, name').eq('is_active', true).order('name'),
      ])
      if (typeData) setTypes(typeData)
      if (countryData) setCountries(countryData)
      if (categoryData) setCategories(categoryData)
    }
    loadLookups()
  }, [])

  async function handleInstitutionSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await applyInstitution(institution)
      setInstitutionApplicationId(data.id)
      setAccessToken(data.access_token)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit institution details')
    } finally {
      setSubmitting(false)
    }
  }

  function updateProgram(key: number, patch: Partial<ProgramDraft>) {
    setPrograms((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)))
  }

  function addProgramRow() {
    setPrograms((prev) => [...prev, emptyProgram(nextKey)])
    setNextKey((k) => k + 1)
  }

  function removeProgramRow(key: number) {
    setPrograms((prev) => (prev.length > 1 ? prev.filter((p) => p.key !== key) : prev))
  }

  async function handleFinalSubmit() {
    if (!institutionApplicationId) return
    setSubmitting(true)
    setError(null)
    try {
      const validPrograms = programs.filter((p) => p.name.trim() !== '')
      await Promise.all(
        validPrograms.map((p) =>
          applyProgram({
            institution_application_id: institutionApplicationId,
            name: p.name,
            category_id: p.category_id,
            level: p.level,
            duration_months: p.duration_months ? Number(p.duration_months) : null,
            tuition_fees: p.tuition_fees ? Number(p.tuition_fees) : null,
            currency: p.currency,
            description: p.description,
            requirements: '',
          })
        )
      )
      // institution_id (not institution_application_id) because that's what's named
      // in the spec - but no real institutions.id exists yet at this point: this
      // application is pending review, and only gets a real institution row (and
      // institution_applications.created_institution_id) once an admin approves it.
      trackEvent('application', { institution_application_id: institutionApplicationId, program_count: validPrograms.length })
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit programs')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!statusToken.trim()) return
    setStatusLoading(true)
    setStatusError(null)
    setStatusResult(null)
    try {
      const { data } = await getApplicationStatus(statusToken.trim())
      setStatusResult(data)
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Application not found')
    } finally {
      setStatusLoading(false)
    }
  }

  function copyToken() {
    if (accessToken) navigator.clipboard.writeText(accessToken)
  }

  const validProgramCount = programs.filter((p) => p.name.trim() !== '').length

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-4">
            <Building2 className="w-4 h-4" />
            Institution Onboarding
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            List Your Institution on ElimuX
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            Reach students across Kenya and Africa searching for their next program. Submit your
            details below — our team reviews every application before it goes live.
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setMode('apply')}
            className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
              mode === 'apply' ? 'bg-primary-500 text-white' : 'text-muted hover:text-foreground border border-border'
            }`}
          >
            Apply
          </button>
          <button
            onClick={() => setMode('status')}
            className={`px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'status' ? 'bg-primary-500 text-white' : 'text-muted hover:text-foreground border border-border'
            }`}
          >
            <Search className="w-4 h-4" /> Check Status
          </button>
        </div>

        {mode === 'status' ? (
          <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border">
            <form onSubmit={handleStatusCheck} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={statusToken}
                onChange={(e) => setStatusToken(e.target.value)}
                placeholder="Paste your application token"
                className={inputClass}
              />
              <button
                type="submit"
                disabled={statusLoading}
                className="px-6 py-3 min-h-[44px] rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {statusLoading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {statusError && (
              <p className="text-elimux-danger text-sm mb-4">{statusError}</p>
            )}

            {statusResult && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">{statusResult.name}</h2>
                  <StatusBadge status={statusResult.status} />
                </div>
                {statusResult.admin_notes && (
                  <p className="text-sm text-muted mb-4 bg-elimux-dark rounded-lg p-3 border border-border">
                    <span className="font-medium text-foreground">Reviewer notes: </span>
                    {statusResult.admin_notes}
                  </p>
                )}
                {statusResult.programs.length > 0 && (
                  <>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Submitted Programs</h3>
                    <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                      {statusResult.programs.map((p) => (
                        <div key={p.id} className="p-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-foreground">{p.name}</span>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <StepIndicator step={step} />

            {error && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleInstitutionSubmit} className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary-400" /> Institution Details
                </h2>

                <div>
                  <label className="text-sm text-muted mb-1 block">Institution Name *</label>
                  <input
                    required
                    value={institution.name}
                    onChange={(e) => setInstitution({ ...institution, name: e.target.value })}
                    className={inputClass}
                    placeholder="e.g., Nairobi Institute of Technology"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted mb-1 block">Type</label>
                    <select
                      value={institution.type_id}
                      onChange={(e) => setInstitution({ ...institution, type_id: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select type</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Country
                    </label>
                    <select
                      value={institution.country_id}
                      onChange={(e) => setInstitution({ ...institution, country_id: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select country</option>
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> City
                  </label>
                  <input
                    value={institution.city}
                    onChange={(e) => setInstitution({ ...institution, city: e.target.value })}
                    className={inputClass}
                    placeholder="e.g., Nairobi"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Website
                  </label>
                  <input
                    type="url"
                    value={institution.website}
                    onChange={(e) => setInstitution({ ...institution, website: e.target.value })}
                    className={inputClass}
                    placeholder="https://www.example.ac.ke"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={institution.email}
                      onChange={(e) => setInstitution({ ...institution, email: e.target.value })}
                      className={inputClass}
                      placeholder="admissions@example.ac.ke"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Phone
                    </label>
                    <input
                      value={institution.phone}
                      onChange={(e) => setInstitution({ ...institution, phone: e.target.value })}
                      className={inputClass}
                      placeholder="+254 700 000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Description
                  </label>
                  <textarea
                    rows={3}
                    value={institution.description}
                    onChange={(e) => setInstitution({ ...institution, description: e.target.value })}
                    className={inputClass}
                    placeholder="Brief description of your institution..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Continue to Programs'}
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5 text-primary-400" /> Programs Offered
                </h2>
                <p className="text-sm text-muted mb-4">
                  Add at least one program. You can add more from your dashboard later.
                </p>

                <div className="space-y-6">
                  {programs.map((program, idx) => (
                    <div key={program.key} className="border border-border rounded-xl p-4 relative">
                      {programs.length > 1 && (
                        <button
                          onClick={() => removeProgramRow(program.key)}
                          className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-elimux-danger hover:bg-elimux-danger/10 transition-colors"
                          aria-label="Remove program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <p className="text-xs uppercase tracking-wide text-muted mb-3">Program {idx + 1}</p>

                      <div className="space-y-3">
                        <input
                          value={program.name}
                          onChange={(e) => updateProgram(program.key, { name: e.target.value })}
                          className={inputClass}
                          placeholder="Program name, e.g., BSc Computer Science"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <select
                            value={program.category_id}
                            onChange={(e) => updateProgram(program.key, { category_id: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Category</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <select
                            value={program.level}
                            onChange={(e) => updateProgram(program.key, { level: e.target.value })}
                            className={inputClass}
                          >
                            <option value="">Level</option>
                            {LEVELS.map((l) => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="number"
                            value={program.duration_months}
                            onChange={(e) => updateProgram(program.key, { duration_months: e.target.value })}
                            className={inputClass}
                            placeholder="Duration (months)"
                          />
                          <input
                            type="number"
                            value={program.tuition_fees}
                            onChange={(e) => updateProgram(program.key, { tuition_fees: e.target.value })}
                            className={inputClass}
                            placeholder="Tuition fees"
                          />
                          <select
                            value={program.currency}
                            onChange={(e) => updateProgram(program.key, { currency: e.target.value })}
                            className={inputClass}
                          >
                            <option value="USD">USD</option>
                            <option value="KES">KES</option>
                            <option value="GBP">GBP</option>
                            <option value="EUR">EUR</option>
                          </select>
                        </div>

                        <textarea
                          rows={2}
                          value={program.description}
                          onChange={(e) => updateProgram(program.key, { description: e.target.value })}
                          className={inputClass}
                          placeholder="Brief program description..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addProgramRow}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg border border-border text-muted hover:text-foreground transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Another Program
                </button>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-3 min-h-[44px] rounded-lg border border-border text-muted hover:bg-muted/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={validProgramCount === 0}
                    className="flex-1 px-4 py-3 min-h-[44px] rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    Review Application
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                  <ClipboardCheck className="w-5 h-5 text-primary-400" /> Review &amp; Submit
                </h2>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Institution</h3>
                  <div className="bg-elimux-dark rounded-lg border border-border p-4 text-sm text-muted space-y-1">
                    <p><span className="text-foreground font-medium">{institution.name}</span></p>
                    {institution.city && <p>{institution.city}</p>}
                    <p>{institution.email}{institution.phone && ` · ${institution.phone}`}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    Programs ({validProgramCount})
                  </h3>
                  <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                    {programs.filter((p) => p.name.trim() !== '').map((p) => (
                      <div key={p.key} className="p-3 text-sm">
                        <p className="text-foreground font-medium">{p.name}</p>
                        <p className="text-muted text-xs">
                          {[p.level, p.duration_months && `${p.duration_months} months`, p.tuition_fees && `${p.currency} ${p.tuition_fees}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-4 py-3 min-h-[44px] rounded-lg border border-border text-muted hover:bg-muted/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 min-h-[44px] rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-elimux-card rounded-2xl p-8 border border-border text-center">
                <div className="w-14 h-14 rounded-full bg-elimux-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-elimux-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Application Submitted!</h2>
                <p className="text-muted mb-6">
                  Our team will review your application. Save the token below to check your status anytime.
                </p>
                <div className="flex items-center gap-2 bg-elimux-dark rounded-lg border border-border p-3 max-w-md mx-auto">
                  <code className="text-xs text-foreground flex-1 truncate text-left">{accessToken}</code>
                  <button
                    onClick={copyToken}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors flex-shrink-0"
                    aria-label="Copy token"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function StepIndicator({ step }: { step: 1 | 2 | 3 | 4 }) {
  const labels = ['Institution', 'Programs', 'Review', 'Done']
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {labels.map((label, idx) => {
        const num = idx + 1
        const active = step === num
        const done = step > num
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                done ? 'bg-elimux-success text-white' : active ? 'bg-primary-500 text-white' : 'bg-muted/20 text-muted'
              }`}
            >
              {num}
            </div>
            <span className={`text-xs hidden sm:inline ${active ? 'text-foreground' : 'text-muted'}`}>{label}</span>
            {idx < labels.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-elimux-success/10 text-elimux-success">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-elimux-danger/10 text-elimux-danger">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-elimux-warning/10 text-elimux-warning">
      <Clock className="w-3 h-3" /> Pending
    </span>
  )
}
