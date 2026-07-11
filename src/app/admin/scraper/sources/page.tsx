'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  listScrapingSources,
  createScrapingSource,
  updateScrapingSource,
  deleteScrapingSource,
  type ScrapingSource,
} from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, Rss, Plus, Trash2, Ban, CheckCircle2 } from 'lucide-react'

const SOURCE_TYPES = ['website', 'api', 'rss'] as const
const CRAWL_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const

export default function AdminScraperSourcesPage() {
  const { adminKey } = useAdminKey()
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([])
  const [sources, setSources] = useState<ScrapingSource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [institutionId, setInstitutionId] = useState('')
  const [url, setUrl] = useState('')
  const [sourceType, setSourceType] = useState<(typeof SOURCE_TYPES)[number]>('website')
  const [crawlFrequency, setCrawlFrequency] = useState<(typeof CRAWL_FREQUENCIES)[number]>('weekly')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('institutions')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => data && setInstitutions(data))
  }, [])

  const load = useCallback(() => {
    if (!adminKey) return
    setLoading(true)
    listScrapingSources(adminKey)
      .then((res) => setSources(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load sources'))
      .finally(() => setLoading(false))
  }, [adminKey])

  useEffect(() => {
    load()
  }, [load])

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!institutionId || !url) return
    setSubmitting(true)
    setError(null)
    try {
      await createScrapingSource({ institution_id: institutionId, url, source_type: sourceType, crawl_frequency: crawlFrequency }, adminKey)
      setUrl('')
      flashSuccess('Source added.')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add source')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleFrequencyChange(id: string, crawl_frequency: string) {
    try {
      await updateScrapingSource(id, { crawl_frequency: crawl_frequency as (typeof CRAWL_FREQUENCIES)[number] }, adminKey)
      flashSuccess('Crawl frequency updated.')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source')
    }
  }

  async function handleToggleActive(source: ScrapingSource) {
    try {
      await updateScrapingSource(source.id, { is_active: !source.is_active }, adminKey)
      flashSuccess(source.is_active ? 'Source deactivated.' : 'Source activated.')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update source')
    }
  }

  async function handleRemove(source: ScrapingSource) {
    if (!window.confirm(`Remove the source "${source.url}"? This cannot be undone.`)) return
    try {
      await deleteScrapingSource(source.id, adminKey)
      flashSuccess('Source removed.')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove source')
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin/scraper" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Scraper
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <Rss className="w-8 h-8 text-primary-400" />
        Scraping Sources
      </h1>

      <form onSubmit={handleAdd} className="bg-elimux-card border border-border rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add source
        </h2>
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            required
            className="px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500 md:w-56"
          >
            <option value="">Select institution</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://institution.ac.ke/programs"
            className="flex-1 px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
          />
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as (typeof SOURCE_TYPES)[number])}
            className="px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={crawlFrequency}
            onChange={(e) => setCrawlFrequency(e.target.value as (typeof CRAWL_FREQUENCIES)[number])}
            className="px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
          >
            {CRAWL_FREQUENCIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {submitting ? 'Adding...' : 'Add Source'}
          </button>
        </div>
      </form>

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
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Crawl frequency</th>
                <th className="px-4 py-3 font-medium">Last crawled</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{source.institution?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted truncate max-w-xs">
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400">
                      {source.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-muted">{source.source_type}</td>
                  <td className="px-4 py-3">
                    <select
                      value={source.crawl_frequency}
                      onChange={(e) => handleFrequencyChange(source.id, e.target.value)}
                      className="px-2 py-1 rounded-lg bg-elimux-dark border border-border text-foreground text-xs focus:outline-none focus:border-primary-500"
                    >
                      {CRAWL_FREQUENCIES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {source.last_crawled_at ? new Date(source.last_crawled_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={source.is_active ? 'text-elimux-success' : 'text-elimux-danger'}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(source)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          source.is_active
                            ? 'hover:bg-elimux-danger/10 text-muted hover:text-elimux-danger'
                            : 'hover:bg-elimux-success/10 text-muted hover:text-elimux-success'
                        }`}
                        aria-label={source.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {source.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleRemove(source)}
                        className="p-1.5 rounded-lg hover:bg-elimux-danger/10 text-muted hover:text-elimux-danger transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No scraping sources yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
