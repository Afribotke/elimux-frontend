'use client'

import { useState } from 'react'
import { GraduationCap, Building2, Tag, Clock, DollarSign, BarChart3, Monitor, FileText, ListChecks, Briefcase, X } from 'lucide-react'

interface Institution {
  id: string
  name: string
}

interface ProgramCategory {
  id: string
  name: string
}

export interface ProgramFormData {
  name: string
  institution_id: string
  category_id: string
  duration_months: number | null
  tuition_fees: number | null
  currency: string
  level: string
  mode: string
  description: string
  requirements: string
  career_outcomes: string
  is_active: boolean
}

export interface ProgramFormInitialData extends ProgramFormData {
  id: string
}

interface AddProgramFormProps {
  institutions: Institution[]
  categories: ProgramCategory[]
  initialData?: ProgramFormInitialData
  onSubmit: (data: ProgramFormData) => Promise<void>
  onClose: () => void
}

export default function AddProgramForm({ institutions, categories, initialData, onSubmit, onClose }: AddProgramFormProps) {
  const isEdit = !!initialData
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    institution_id: initialData?.institution_id ?? '',
    category_id: initialData?.category_id ?? '',
    duration_months: initialData?.duration_months != null ? String(initialData.duration_months) : '',
    tuition_fees: initialData?.tuition_fees != null ? String(initialData.tuition_fees) : '',
    currency: initialData?.currency ?? 'USD',
    level: initialData?.level ?? '',
    mode: initialData?.mode ?? '',
    description: initialData?.description ?? '',
    requirements: initialData?.requirements ?? '',
    career_outcomes: initialData?.career_outcomes ?? '',
    is_active: initialData?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        ...formData,
        duration_months: formData.duration_months ? parseInt(formData.duration_months, 10) : null,
        tuition_fees: formData.tuition_fees ? parseFloat(formData.tuition_fees) : null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'add'} program`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-elimux-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary-400" />
              {isEdit ? 'Edit Program' : 'Add Program'}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Program Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., BSc Computer Science"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Institution *
                </label>
                <select
                  required
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duration (months)
                </label>
                <input
                  type="number"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  placeholder="e.g., 48"
                />
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Tuition Fees
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="px-2 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  >
                    <option value="USD">USD</option>
                    <option value="KES">KES</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tuition_fees}
                    onChange={(e) => setFormData({ ...formData, tuition_fees: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                    placeholder="e.g., 4500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Level
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select level</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Monitor className="w-3 h-3" /> Mode
                </label>
                <select
                  value={formData.mode}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select mode</option>
                  <option value="On-campus">On-campus</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <FileText className="w-3 h-3" /> Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="Brief description of the program..."
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <ListChecks className="w-3 h-3" /> Requirements
              </label>
              <textarea
                rows={3}
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="Entry requirements..."
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Career Outcomes
              </label>
              <textarea
                rows={2}
                value={formData.career_outcomes}
                onChange={(e) => setFormData({ ...formData, career_outcomes: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="Typical career paths after graduating..."
              />
            </div>

            {isEdit && (
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-border"
                />
                Active (visible on site)
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-muted hover:bg-muted/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save Changes' : 'Add Program')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
