'use client'

import { useState } from 'react'
import { Award, X, Plus, Trash2 } from 'lucide-react'
import type {
  ScholarshipFormData,
  ScholarshipSponsor,
  CriteriaType,
  DurationUnit,
  ApplicationStatus,
} from '@/types/scholarships'

const CRITERIA_TYPES: { value: CriteriaType; label: string }[] = [
  { value: 'min_gpa', label: 'Minimum GPA' },
  { value: 'max_gpa', label: 'Maximum GPA' },
  { value: 'course_field', label: 'Course / Field of Study' },
  { value: 'country', label: 'Country' },
  { value: 'county', label: 'County (Kenya)' },
  { value: 'gender', label: 'Gender' },
  { value: 'financial_need', label: 'Financial Need' },
  { value: 'age_min', label: 'Minimum Age' },
  { value: 'age_max', label: 'Maximum Age' },
  { value: 'extracurricular', label: 'Extracurricular Activity' },
  { value: 'career_goal', label: 'Career Goal' },
  { value: 'disability', label: 'Disability Status' },
  { value: 'orphan_status', label: 'Orphan Status' },
  { value: 'work_experience_years', label: 'Work Experience (Years)' },
  { value: 'language_proficiency', label: 'Language Proficiency' },
  { value: 'nationality', label: 'Nationality' },
  { value: 'other', label: 'Other' },
]

const inputClass =
  'w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'
const labelClass = 'text-sm text-muted mb-1 block'

export interface ScholarshipFormInitialData extends ScholarshipFormData {
  id: string
}

interface AddScholarshipFormProps {
  sponsors: ScholarshipSponsor[]
  initialData?: ScholarshipFormInitialData
  onSubmit: (data: ScholarshipFormData) => Promise<void>
  onClose: () => void
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function joinArray(value?: string[] | null) {
  return (value || []).join(', ')
}

function parseArray(value: string) {
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export default function AddScholarshipForm({ sponsors, initialData, onSubmit, onClose }: AddScholarshipFormProps) {
  const isEdit = !!initialData
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    provider: initialData?.provider ?? '',
    provider_id: initialData?.provider_id ?? '',
    description: initialData?.description ?? '',
    eligibility: initialData?.eligibility ?? '',
    benefits: initialData?.benefits ?? '',
    amount: initialData?.amount ?? '',
    currency: initialData?.currency ?? 'KES',
    coverage_type: initialData?.coverage_type ?? '',
    funding_amount: initialData?.funding_amount != null ? String(initialData.funding_amount) : '',
    duration: initialData?.duration != null ? String(initialData.duration) : '',
    duration_unit: (initialData?.duration_unit ?? '') as DurationUnit | '',
    application_opens: toDatetimeLocal(initialData?.application_opens),
    application_deadline: toDatetimeLocal(initialData?.application_deadline),
    notification_date: toDatetimeLocal(initialData?.notification_date),
    application_url: initialData?.application_url ?? '',
    application_process: initialData?.application_process ?? '',
    source_url: initialData?.source_url ?? '',
    study_levels: joinArray(initialData?.study_levels),
    disciplines: joinArray(initialData?.disciplines),
    target_groups: joinArray(initialData?.target_groups),
    required_documents: joinArray(initialData?.required_documents),
    status: initialData?.status ?? 'active',
    application_status: (initialData?.application_status ?? 'upcoming') as ApplicationStatus,
    is_featured: initialData?.is_featured ?? false,
    is_sponsored: initialData?.is_sponsored ?? false,
    sponsor_id: initialData?.sponsor_id ?? '',
  })

  const [eligibilityCriteria, setEligibilityCriteria] = useState(
    initialData?.eligibility_criteria ?? []
  )
  const [documents, setDocuments] = useState(initialData?.documents ?? [])

  function addEligibility() {
    setEligibilityCriteria((prev) => [
      ...prev,
      { criteria_type: 'other' as CriteriaType, criteria_value: '', is_required: true, description: '' },
    ])
  }
  function removeEligibility(i: number) {
    setEligibilityCriteria((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateEligibility(i: number, field: string, value: unknown) {
    setEligibilityCriteria((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  function addDocument() {
    setDocuments((prev) => [
      ...prev,
      { document_name: '', document_description: '', is_required: true, file_type_hint: 'pdf', max_file_size_mb: 5 },
    ])
  }
  function removeDocument(i: number) {
    setDocuments((prev) => prev.filter((_, idx) => idx !== i))
  }
  function updateDocument(i: number, field: string, value: unknown) {
    setDocuments((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        title: form.title,
        provider: form.provider,
        provider_id: form.provider_id || null,
        description: form.description || undefined,
        eligibility: form.eligibility || undefined,
        benefits: form.benefits || undefined,
        amount: form.amount || undefined,
        currency: form.currency || undefined,
        coverage_type: form.coverage_type || undefined,
        funding_amount: form.funding_amount ? parseFloat(form.funding_amount) : null,
        duration: form.duration ? parseInt(form.duration, 10) : null,
        duration_unit: (form.duration_unit || null) as DurationUnit | null,
        application_opens: form.application_opens || undefined,
        application_deadline: form.application_deadline,
        notification_date: form.notification_date || undefined,
        application_url: form.application_url || undefined,
        application_process: form.application_process || undefined,
        source_url: form.source_url || undefined,
        study_levels: parseArray(form.study_levels),
        disciplines: parseArray(form.disciplines),
        target_groups: parseArray(form.target_groups),
        required_documents: parseArray(form.required_documents),
        status: form.status,
        application_status: form.application_status,
        is_featured: form.is_featured,
        is_sponsored: form.is_sponsored,
        sponsor_id: form.is_sponsored ? form.sponsor_id || null : null,
        eligibility_criteria: eligibilityCriteria,
        documents,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} scholarship`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-elimux-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-400" />
              {isEdit ? 'Edit Scholarship' : 'Add Scholarship'}
            </h2>
            <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              <div>
                <label className={labelClass}>Title *</label>
                <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass} placeholder="e.g., Equity Wings to Fly Scholarship" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Provider Name *</label>
                  <input required type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                    className={inputClass} placeholder="e.g., Equity Group Foundation" />
                </div>
                <div>
                  <label className={labelClass}>Link to Sponsor Record</label>
                  <select value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })} className={inputClass}>
                    <option value="">None (text-only provider)</option>
                    {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Funding</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Amount (display text)</label>
                  <input type="text" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={inputClass} placeholder="e.g., Full tuition + stipend" />
                </div>
                <div>
                  <label className={labelClass}>Structured Amount</label>
                  <input type="number" step="0.01" value={form.funding_amount} onChange={(e) => setForm({ ...form, funding_amount: e.target.value })}
                    className={inputClass} placeholder="50000" />
                </div>
                <div>
                  <label className={labelClass}>Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputClass}>
                    <option value="KES">KES</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Coverage Type</label>
                  <input type="text" value={form.coverage_type} onChange={(e) => setForm({ ...form, coverage_type: e.target.value })}
                    className={inputClass} placeholder="e.g., Full ride, Tuition only" />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Duration</label>
                  <div className="flex gap-2">
                    <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className={inputClass} placeholder="4" />
                    <select value={form.duration_unit} onChange={(e) => setForm({ ...form, duration_unit: e.target.value as DurationUnit })}
                      className={`${inputClass} w-40`}>
                      <option value="">Unit</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                      <option value="one_time">One-time</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Dates & Links</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Application Opens</label>
                  <input type="datetime-local" value={form.application_opens} onChange={(e) => setForm({ ...form, application_opens: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Application Deadline *</label>
                  <input required type="datetime-local" value={form.application_deadline} onChange={(e) => setForm({ ...form, application_deadline: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Notification Date</label>
                  <input type="datetime-local" value={form.notification_date} onChange={(e) => setForm({ ...form, notification_date: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Application URL</label>
                  <input type="url" value={form.application_url} onChange={(e) => setForm({ ...form, application_url: e.target.value })} className={inputClass} placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className={labelClass}>Source URL (scraper)</label>
                  <input type="url" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} className={inputClass} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Details</h3>
              <div>
                <label className={labelClass}>Eligibility (text)</label>
                <textarea rows={3} value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} className={inputClass} placeholder="Free-text eligibility description..." />
              </div>
              <div>
                <label className={labelClass}>Benefits</label>
                <textarea rows={2} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Application Process</label>
                <textarea rows={3} value={form.application_process} onChange={(e) => setForm({ ...form, application_process: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Study Levels (comma-separated)</label>
                  <input type="text" value={form.study_levels} onChange={(e) => setForm({ ...form, study_levels: e.target.value })} className={inputClass} placeholder="Undergraduate, Masters, PhD" />
                </div>
                <div>
                  <label className={labelClass}>Disciplines (comma-separated)</label>
                  <input type="text" value={form.disciplines} onChange={(e) => setForm({ ...form, disciplines: e.target.value })} className={inputClass} placeholder="Engineering, Medicine, Business" />
                </div>
                <div>
                  <label className={labelClass}>Target Groups (comma-separated)</label>
                  <input type="text" value={form.target_groups} onChange={(e) => setForm({ ...form, target_groups: e.target.value })} className={inputClass} placeholder="Kenyan citizens, Female, STEM" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Required Documents (comma-separated)</label>
                <input type="text" value={form.required_documents} onChange={(e) => setForm({ ...form, required_documents: e.target.value })} className={inputClass} placeholder="KCSE Certificate, Recommendation Letter, Essay" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Status & Flags</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Site Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Application Status</label>
                  <select value={form.application_status} onChange={(e) => setForm({ ...form, application_status: e.target.value as ApplicationStatus })} className={inputClass}>
                    <option value="upcoming">Upcoming</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded border-border" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={form.is_sponsored} onChange={(e) => setForm({ ...form, is_sponsored: e.target.checked })} className="rounded border-border" />
                  Sponsored
                </label>
              </div>
              {form.is_sponsored && (
                <div>
                  <label className={labelClass}>Sponsor</label>
                  <select value={form.sponsor_id} onChange={(e) => setForm({ ...form, sponsor_id: e.target.value })} className={`${inputClass} md:w-1/2`}>
                    <option value="">Select sponsor...</option>
                    {sponsors.filter((s) => s.tier !== 'free').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Structured Eligibility Criteria (for AI matching)</h3>
                <button type="button" onClick={addEligibility} className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Criterion
                </button>
              </div>
              {eligibilityCriteria.length === 0 ? (
                <p className="text-sm text-muted">No structured criteria. Add criteria for AI matching.</p>
              ) : (
                <div className="space-y-3">
                  {eligibilityCriteria.map((row, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 grid grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="text-xs text-muted mb-1 block">Type</label>
                        <select value={row.criteria_type} onChange={(e) => updateEligibility(i, 'criteria_type', e.target.value)} className={`${inputClass} text-sm py-1.5`}>
                          {CRITERIA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted mb-1 block">Value</label>
                        <input type="text" value={row.criteria_value} onChange={(e) => updateEligibility(i, 'criteria_value', e.target.value)}
                          className={`${inputClass} text-sm py-1.5`} placeholder="e.g., 3.5, Computer Science, Female" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-muted">
                          <input type="checkbox" checked={row.is_required} onChange={(e) => updateEligibility(i, 'is_required', e.target.checked)} className="rounded border-border" />
                          Required
                        </label>
                        <button type="button" onClick={() => removeEligibility(i)} className="text-muted hover:text-elimux-danger">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Structured Document Requirements</h3>
                <button type="button" onClick={addDocument} className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add Document
                </button>
              </div>
              {documents.length === 0 ? (
                <p className="text-sm text-muted">No structured documents added.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((row, i) => (
                    <div key={i} className="border border-border rounded-lg p-3 space-y-3">
                      <div className="grid grid-cols-3 gap-3 items-end">
                        <div className="col-span-2">
                          <label className="text-xs text-muted mb-1 block">Document Name</label>
                          <input type="text" value={row.document_name} onChange={(e) => updateDocument(i, 'document_name', e.target.value)}
                            className={`${inputClass} text-sm py-1.5`} placeholder="e.g., KCSE Certificate" />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-muted">
                            <input type="checkbox" checked={row.is_required} onChange={(e) => updateDocument(i, 'is_required', e.target.checked)} className="rounded border-border" />
                            Required
                          </label>
                          <button type="button" onClick={() => removeDocument(i)} className="text-muted hover:text-elimux-danger">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted mb-1 block">Description</label>
                        <input type="text" value={row.document_description || ''} onChange={(e) => updateDocument(i, 'document_description', e.target.value)}
                          className={`${inputClass} text-sm py-1.5`} placeholder="e.g., Must be signed by principal" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-muted hover:bg-muted/10 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50">
                {loading ? (isEdit ? 'Saving...' : 'Creating...') : (isEdit ? 'Save Changes' : 'Create Scholarship')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
