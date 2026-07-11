'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { runScraper, listScraperJobs, type ScraperJob } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, Bot, Play, GitCompare, Rss, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'

const STATUS_STYLE: Record<ScraperJob['status'], string> = {
  pending: 'bg-elimux-warning/10 text-elimux-warning',
  running: 'bg-primary-500/10 text-primary-400',
  completed: 'bg-elimux-success/10 text-elimux-success',
  failed: 'bg-elimux-danger/10 text-elimux-danger',
}

const STATUS_ICON: Record<ScraperJob['status'], typeof Clock> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
}

export default function AdminScraperPage() {
  const { adminKey } = useAdminKey()
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([])
  const [institutionId, setInstitutionId] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [runError, setRunError] = useState<string | null>(null)

  const [jobs, setJobs] = useState<ScraperJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('institutions')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => data && setInstitutions(data))
  }, [])

  const loadJobs = useCallback(() => {
    if (!adminKey) return
    setJobsLoading(true)
    listScraperJobs(adminKey, { limit: 20 })
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]))
      .finally(() => setJobsLoading(false))
  }, [adminKey])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  async function handleRun(e: React.FormEvent) {
    e.preventDefault()
    if (!institutionId || !sourceUrl) return
    setRunning(true)
    setRunResult(null)
    setRunError(null)
    try {
      const res = await runScraper(institutionId, sourceUrl, adminKey)
      setRunResult(
        `Job ${res.data.job.status}: found ${res.data.job.programs_found} program(s), filed ${res.data.changes_filed} change(s) for review.`
      )
      setSourceUrl('')
      loadJobs()
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Scraper run failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary-400" />
          Data Scraper
        </h1>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/scraper/changes" className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300">
            <GitCompare className="w-4 h-4" /> Review Changes
          </Link>
          <Link href="/admin/scraper/sources" className="flex items-center gap-1.5 text-primary-400 hover:text-primary-300">
            <Rss className="w-4 h-4" /> Manage Sources
          </Link>
        </div>
      </div>

      <form onSubmit={handleRun} className="bg-elimux-card border border-border rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium text-foreground mb-4">Run scraper</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <select
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            required
            className="px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500 md:w-64"
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
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            required
            placeholder="https://institution.ac.ke/programs"
            className="flex-1 px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
          />
          <button
            type="submit"
            disabled={running}
            className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running...' : 'Run Scraper'}
          </button>
        </div>
        {runResult && <p className="text-sm text-elimux-success mt-3">{runResult}</p>}
        {runError && <p className="text-sm text-elimux-danger mt-3">{runError}</p>}
      </form>

      <h2 className="text-sm font-medium text-foreground mb-4">Job history</h2>
      {jobsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Institution</th>
                <th className="px-4 py-3 font-medium">Source URL</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Found / Created / Updated</th>
                <th className="px-4 py-3 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const Icon = STATUS_ICON[job.status]
                return (
                  <tr key={job.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{job.institution?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted truncate max-w-xs">
                      <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400">
                        {job.source_url}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[job.status]}`}>
                        <Icon className={`w-3 h-3 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {job.programs_found} / {job.programs_created} / {job.programs_updated}
                    </td>
                    <td className="px-4 py-3 text-muted whitespace-nowrap">
                      {job.started_at ? new Date(job.started_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                )
              })}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No scraper runs yet.
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
