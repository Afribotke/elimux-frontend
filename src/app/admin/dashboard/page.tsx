'use client'

import { useEffect, useState } from 'react'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { getAdminDashboardStats, type AdminDashboardStats } from '@/lib/api'
import { Building2, GraduationCap, Briefcase, FileText, Star, ShieldAlert, TrendingUp, AlertCircle } from 'lucide-react'
import { LoadingState } from '@/components/ui/LoadingState'

export default function AdminDashboardPage() {
  const { adminKey } = useAdminKey()
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminKey) return
    getAdminDashboardStats(adminKey)
      .then((res) => setStats(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load stats'))
      .finally(() => setLoading(false))
  }, [adminKey])

  if (loading) {
    return (
      <div>
        <h1 className="text-display-2 font-bold text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-500 mb-8">Platform-wide entity counts and 30-day growth</p>
        <LoadingState count={4} />
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-5 h-5 shrink-0" />
        {error}
      </div>
    )
  }
  if (!stats) return null

  const { totals: t, growth_30d: g } = stats

  return (
    <div className="animate-fade-in">
      <h1 className="text-balance text-display-2 font-bold text-gray-900 mb-2">Dashboard Overview</h1>
      <p className="text-gray-500 mb-8">Platform-wide entity counts and 30-day growth</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Institutions" value={t.institutions} growth={g.institutions} color="blue" />
        <StatCard icon={GraduationCap} label="Programs" value={t.programs} color="purple" />
        <StatCard icon={Briefcase} label="Employers" value={t.employers} growth={g.employers} color="amber" />
        <StatCard icon={Briefcase} label="Internships" value={t.internships} growth={g.internships} color="emerald" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label="Attachments" value={t.attachments} color="indigo" />
        <StatCard icon={Star} label="Reviews" value={t.reviews} color="gray" />
        <StatCard icon={ShieldAlert} label="Open NITA Flags" value={t.open_nita_flags} color="red" />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  growth,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  growth?: number
  color: 'blue' | 'purple' | 'amber' | 'emerald' | 'indigo' | 'gray' | 'red'
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    gray: 'bg-gray-50 text-gray-700',
    red: 'bg-red-50 text-red-700',
  }

  return (
    <div className={`rounded-2xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-70" />
        {growth !== undefined && (
          <span className="text-xs font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{growth}
          </span>
        )}
      </div>
      <div className="text-display-2 font-bold">{value.toLocaleString()}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  )
}
