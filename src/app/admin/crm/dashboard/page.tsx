'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import {
  getCRMStats,
  getCRMTeamStats,
  getCRMActivities,
  getCRMContacts,
  getContactsNeedingEnrichment,
  type CRMDashboardStats,
  type CRMTeamStat,
  type CRMActivity,
} from '@/lib/crm-api'
import { Loader2, Users, Mail, MessageSquare, Sparkles, ArrowRight, Building2, GraduationCap, Landmark, Globe2 } from 'lucide-react'

const ENTITY_ICONS: Record<string, React.ElementType> = {
  university: GraduationCap,
  company: Building2,
  government: Landmark,
  school_public: GraduationCap,
  school_private: GraduationCap,
  partner: Globe2,
  other: Globe2,
}

const FUNNEL_STAGES = ['new', 'contacted', 'responded', 'onboarded'] as const

export default function CRMDashboardPage() {
  const { adminKey } = useAdminKey()
  const [stats, setStats] = useState<CRMDashboardStats | null>(null)
  const [teamStats, setTeamStats] = useState<CRMTeamStat[]>([])
  const [activities, setActivities] = useState<CRMActivity[]>([])
  const [funnel, setFunnel] = useState<Record<string, number>>({})
  const [needsEnrichment, setNeedsEnrichment] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminKey) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey])

  async function load() {
    setLoading(true)
    try {
      const [statsRes, teamRes, activityRes, enrichRes, ...funnelRes] = await Promise.all([
        getCRMStats(adminKey),
        getCRMTeamStats(adminKey),
        getCRMActivities(adminKey, { limit: 15 }),
        getContactsNeedingEnrichment(adminKey, { limit: 1 }),
        ...FUNNEL_STAGES.map((s) => getCRMContacts(adminKey, { status: s, limit: 1 })),
      ])
      setStats(statsRes)
      setTeamStats(teamRes)
      setActivities(activityRes.data)
      setNeedsEnrichment(enrichRes.meta.total)
      const funnelCounts: Record<string, number> = {}
      FUNNEL_STAGES.forEach((s, i) => { funnelCounts[s] = funnelRes[i].meta.total })
      setFunnel(funnelCounts)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (!adminKey) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Admin key required</div>
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const maxFunnel = Math.max(1, ...FUNNEL_STAGES.map((s) => funnel[s] || 0))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview across all outreach.</p>
        </div>
        <Link href="/admin/crm" className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
          All Contacts
        </Link>
      </div>

      {/* Contacts by entity type — get_crm_stats_by_type() groups by
          (entity_type, status), so sum every status row per type for a real total */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(
          (stats?.by_type || []).reduce<Record<string, number>>((acc, row) => {
            acc[row.entity_type] = (acc[row.entity_type] || 0) + Number(row.count)
            return acc
          }, {})
        ).map(([entityType, count]) => {
          const Icon = ENTITY_ICONS[entityType] || Globe2
          return (
            <Link
              key={entityType}
              href={`/admin/crm?entity_type=${entityType}`}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
            >
              <Icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold">{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground capitalize">{entityType.replace(/_/g, ' ')}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Funnel */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold mb-4">Outreach Funnel</h2>
          <div className="space-y-3">
            {FUNNEL_STAGES.map((stage) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-24 text-sm capitalize text-muted-foreground shrink-0">{stage}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full flex items-center justify-end px-2"
                    style={{ width: `${Math.max(4, ((funnel[stage] || 0) / maxFunnel) * 100)}%` }}
                  >
                    <span className="text-xs font-medium text-primary-foreground">{funnel[stage] || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Mail className="h-4 w-4" />Messages Sent (all-time, by channel/status)</h3>
            <div className="flex flex-wrap gap-2">
              {(stats?.messages || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages sent yet.</p>
              ) : (
                (stats?.messages || []).map((m, i) => (
                  <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs capitalize">
                    {m.channel} · {m.status}: <span className="font-medium">{m.count}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Needs enrichment + team activity */}
        <div className="space-y-6">
          <Link
            href="/admin/crm?needs_enrichment=1"
            className="block rounded-xl border border-amber-200 bg-amber-50 p-5 hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-amber-700">{needsEnrichment.toLocaleString()}</p>
                <p className="text-sm text-amber-700">Contacts needing enrichment</p>
              </div>
              <Sparkles className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-xs text-amber-600 mt-2 inline-flex items-center gap-1">
              View list <ArrowRight className="h-3 w-3" />
            </p>
          </Link>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-1.5"><Users className="h-4 w-4" />Team Activity</h2>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {activities.map((a) => (
                  <div key={a.id} className="text-sm">
                    <p className="capitalize">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.user?.name || a.user?.email || 'System'} · {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Per-rep stats */}
      {teamStats.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 overflow-x-auto">
          <h2 className="font-semibold mb-3 flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />Rep Performance</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Rep</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Assigned</th>
                <th className="py-2 pr-4 font-medium">Contacted</th>
                <th className="py-2 pr-4 font-medium">Emails</th>
                <th className="py-2 pr-4 font-medium">SMS</th>
                <th className="py-2 pr-4 font-medium">Opened</th>
                <th className="py-2 pr-4 font-medium">Replied</th>
              </tr>
            </thead>
            <tbody>
              {teamStats.map((r) => (
                <tr key={r.user_id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 font-medium">{r.user_name}</td>
                  <td className="py-2 pr-4 capitalize text-muted-foreground">{r.role}</td>
                  <td className="py-2 pr-4">{r.contacts_assigned}</td>
                  <td className="py-2 pr-4">{r.contacts_contacted}</td>
                  <td className="py-2 pr-4">{r.emails_sent}</td>
                  <td className="py-2 pr-4">{r.sms_sent}</td>
                  <td className="py-2 pr-4">{r.messages_opened}</td>
                  <td className="py-2 pr-4">{r.messages_replied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
