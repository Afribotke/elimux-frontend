'use client'

import { useEffect, useState } from 'react'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { listAdminNitaFlags, type AdminNitaFlag } from '@/lib/api'
import { ShieldAlert } from 'lucide-react'

export default function AdminNitaPage() {
  const { adminKey } = useAdminKey()
  const [flags, setFlags] = useState<AdminNitaFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminKey) return
    listAdminNitaFlags(adminKey)
      .then((res) => setFlags(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load NITA flags'))
      .finally(() => setLoading(false))
  }, [adminKey])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">NITA Compliance</h1>
      <p className="text-gray-500 mb-6">
        Read-only view of open compliance flags. Resolving flags is handled by NITA officers in their own portal.
      </p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : flags.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No open compliance flags.
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
              <ShieldAlert className={`w-5 h-5 mt-0.5 shrink-0 ${
                flag.severity === 'high' ? 'text-red-600' : flag.severity === 'medium' ? 'text-amber-600' : 'text-gray-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">{flag.employer?.company_name || 'Unknown employer'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{flag.flag_type}</span>
                  {flag.severity && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      flag.severity === 'high' ? 'bg-red-100 text-red-700' :
                      flag.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>{flag.severity}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{flag.flag_reason}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {flag.employer?.nita_employer_number ? `NITA #${flag.employer.nita_employer_number} · ` : ''}
                  Flagged {new Date(flag.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
