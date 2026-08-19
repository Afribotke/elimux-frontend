'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Zap, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''
// Gates the /api/bursary/cron/check-alerts endpoint against unauthenticated
// public calls - separate from ADMIN_KEY, but this page already sits behind
// the ADMIN_KEY gate in admin/layout.tsx, so exposing it here is fine.
const CRON_SECRET = 'dd3c9468d69769c626c0e803a93e7f36d4aa8a1a15fb808447ab366547db6670'

interface CronResult {
  fundsWithUpcomingDeadlines: number
  newFundsChecked: number
  deadlineNotified: number
  newMatchNotified: number
}

export default function AdminBursaryCronPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CronResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/api/bursary/cron/check-alerts`, {
        method: 'POST',
        headers: { 'X-Cron-Secret': CRON_SECRET },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
      setResult(json)
      toast.success('Alert check completed')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run alert check'
      setError(message)
      toast.error(message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
        <Zap className="w-6 h-6 text-amber-600" />
        Bursary Alert Check
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Manually trigger deadline reminders (open funds with a deadline in the next 7 days, sent to bookmarkers and
        applicants) and new-match alerts (funds opened in the last 24 hours, sent to students with new-match alerts
        enabled). Safe to re-run - already-notified users are skipped.
      </p>

      <button
        onClick={handleRun}
        disabled={running}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
        {running ? 'Running…' : 'Run Alert Check'}
      </button>

      {error && <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {result && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Funds with upcoming deadlines</p>
            <p className="text-xl font-semibold text-gray-900">{result.fundsWithUpcomingDeadlines}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">New funds checked</p>
            <p className="text-xl font-semibold text-gray-900">{result.newFundsChecked}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Deadline notifications sent</p>
            <p className="text-xl font-semibold text-gray-900">{result.deadlineNotified}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">New-match notifications sent</p>
            <p className="text-xl font-semibold text-gray-900">{result.newMatchNotified}</p>
          </div>
        </div>
      )}
    </main>
  )
}
