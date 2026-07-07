'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  listPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from '@/lib/api'
import AddProgramForm, {
  type ProgramFormData,
  type ProgramFormInitialData,
} from '@/components/admin/AddProgramForm'
import { ArrowLeft, GraduationCap, KeyRound, Pencil, Trash2, Plus, Search } from 'lucide-react'

const ADMIN_KEY_STORAGE = 'elimux-admin-key'

interface ProgramRow {
  id: string
  name: string
  institution_id: string | null
  category_id: string | null
  duration_months: number | null
  tuition_fees: number | null
  currency: string | null
  level: string | null
  mode: string | null
  description: string | null
  requirements: string | null
  career_outcomes: string | null
  is_active: boolean
  institution?: { name: string } | null
  category?: { name: string } | null
}

export default function AdminProgramsPage() {
  const [adminKey, setAdminKey] = useState('')
  const [programs, setPrograms] = useState<ProgramRow[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProgramFormInitialData | null>(null)

  useEffect(() => {
    const stored = window.sessionStorage.getItem(ADMIN_KEY_STORAGE)
    if (stored) setAdminKey(stored)
  }, [])

  useEffect(() => {
    async function loadReferenceData() {
      const [{ data: instList }, { data: catList }] = await Promise.all([
        supabase.from('institutions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('program_categories').select('id, name').eq('is_active', true).order('name'),
      ])
      if (instList) setInstitutions(instList)
      if (catList) setCategories(catList)
    }
    loadReferenceData()
  }, [])

  const loadPrograms = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listPrograms({ page, limit: 20, search: search || undefined })
      setPrograms(res.data)
      setTotalPages(res.meta.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    loadPrograms()
  }, [loadPrograms])

  function handleAdminKeyChange(value: string) {
    setAdminKey(value)
    window.sessionStorage.setItem(ADMIN_KEY_STORAGE, value)
  }

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleCreate(data: ProgramFormData) {
    await createProgram(data, adminKey)
    setShowForm(false)
    flashSuccess('Program added successfully.')
    await loadPrograms()
  }

  async function handleUpdate(data: ProgramFormData) {
    if (!editing) return
    await updateProgram(editing.id, data, adminKey)
    setEditing(null)
    flashSuccess('Program updated successfully.')
    await loadPrograms()
  }

  async function handleDelete(program: ProgramRow) {
    if (!window.confirm(`Delete "${program.name}"? This cannot be undone.`)) return
    try {
      await deleteProgram(program.id, adminKey)
      flashSuccess('Program deleted.')
      await loadPrograms()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete program')
    }
  }

  function openEdit(program: ProgramRow) {
    setEditing({
      id: program.id,
      name: program.name,
      institution_id: program.institution_id || '',
      category_id: program.category_id || '',
      duration_months: program.duration_months,
      tuition_fees: program.tuition_fees,
      currency: program.currency || 'USD',
      level: program.level || '',
      mode: program.mode || '',
      description: program.description || '',
      requirements: program.requirements || '',
      career_outcomes: program.career_outcomes || '',
      is_active: program.is_active,
    })
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary-400" />
          Manage Programs
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Program
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="w-4 h-4 text-muted flex-shrink-0" />
        <input
          type="password"
          value={adminKey}
          onChange={(e) => handleAdminKeyChange(e.target.value)}
          placeholder="Admin key (required to add/edit/delete)"
          className="w-full max-w-sm px-3 py-1.5 text-sm rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
        />
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setPage(1)
            setSearch(e.target.value)
          }}
          placeholder="Search programs..."
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
        />
      </div>

      {successMessage && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-success/10 border border-elimux-success/30 text-elimux-success text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading programs...</p>
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Tuition</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-medium">{program.name}</td>
                  <td className="px-4 py-3 text-muted">{program.institution?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted">{program.category?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted">{program.level || '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {program.tuition_fees != null
                      ? `${program.currency || 'USD'} ${program.tuition_fees.toLocaleString()}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={program.is_active ? 'text-elimux-success' : 'text-elimux-danger'}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(program)}
                        className="p-1.5 rounded-lg hover:bg-muted/10 text-muted hover:text-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(program)}
                        className="p-1.5 rounded-lg hover:bg-elimux-danger/10 text-muted hover:text-elimux-danger transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {programs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No programs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {showForm && (
        <AddProgramForm
          institutions={institutions}
          categories={categories}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {editing && (
        <AddProgramForm
          institutions={institutions}
          categories={categories}
          initialData={editing}
          onSubmit={handleUpdate}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  )
}
