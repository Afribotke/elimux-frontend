'use client'

// ============================================
// ELIMUX AD PORTAL - CAMPAIGN DETAIL & ANALYTICS
// /advertiser/campaigns/detail?id=...
//
// A query param, not a [id] dynamic segment - this site is a full static
// export (output: 'export'), which requires generateStaticParams() to
// enumerate every value of a dynamic segment at build time. Campaigns are
// created continuously by advertisers at runtime, so a newly created one
// wouldn't have a page until the next full site rebuild. The rest of the
// advertiser portal already avoids this by using static single-segment
// routes with client-side data fetching - this follows the same pattern.
// ============================================

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, MousePointerClick, Percent, Wallet, ArrowLeft } from 'lucide-react'
import { advertiserFetch, ADVERTISER_LOGIN_PATH } from '@/lib/advertiserAuth'
import { supabase } from '@/lib/supabase'
import AdvertiserNav from '@/components/AdvertiserNav'
import CampaignTrendChart from '@/components/advertiser/CampaignTrendChart'

interface Campaign {
  id: string
  title: string
  description?: string
  placement: string
  status: string
  budget: number
  duration_days?: number
  start_date?: string
  end_date?: string
  impressions: number
  clicks: number
  created_at: string
}

interface Analytics {
  campaign_id: string
  impressions: number
  clicks: number
  ctr: number
  daily_stats: { date: string; impressions: number; clicks: number }[]
}

const DAY_RANGES = [7, 30, 90]

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-muted/20 text-muted',
    pending_review: 'bg-primary-500/10 text-primary-400',
    active: 'bg-elimux-success/10 text-elimux-success',
    paused: 'bg-elimux-warning/10 text-elimux-warning',
    completed: 'bg-primary-500/10 text-primary-400',
    rejected: 'bg-elimux-danger/10 text-elimux-danger',
  }
  return colors[status] || 'bg-muted/20 text-muted'
}

function CampaignDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = searchParams.get('id') || ''

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCampaign = useCallback(async () => {
    const res = await advertiserFetch(`/api/campaigns/${campaignId}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to load campaign')
    setCampaign(data.data)
  }, [campaignId])

  const fetchAnalytics = useCallback(
    async (rangeDays: number) => {
      const res = await advertiserFetch(`/api/campaigns/${campaignId}/analytics?days=${rangeDays}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load analytics')
      setAnalytics(data.data)
    },
    [campaignId]
  )

  useEffect(() => {
    const load = async () => {
      if (!campaignId) {
        setError('No campaign specified')
        setLoading(false)
        return
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push(ADVERTISER_LOGIN_PATH)
          return
        }
        await Promise.all([fetchCampaign(), fetchAnalytics(days)])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId])

  const handleDaysChange = async (rangeDays: number) => {
    setDays(rangeDays)
    try {
      await fetchAnalytics(rangeDays)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-elimux-dark">
        <AdvertiserNav />
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm">
            {error || 'Campaign not found'}
          </div>
        </div>
      </div>
    )
  }

  const impressionsSeries = (analytics?.daily_stats || []).map((d) => ({ date: d.date, value: d.impressions }))
  const clicksSeries = (analytics?.daily_stats || []).map((d) => ({ date: d.date, value: d.clicks }))

  return (
    <div className="min-h-screen bg-elimux-dark">
      <AdvertiserNav />
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <button
          onClick={() => router.push('/advertiser/campaigns')}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All campaigns
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-foreground">{campaign.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-muted">
              {campaign.placement.replace('_', ' ')}
              {campaign.description ? ` · ${campaign.description}` : ''}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-elimux-card border border-border rounded-xl p-6">
            <div className="text-sm text-muted mb-1 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Budget
            </div>
            <div className="text-2xl font-bold text-foreground">KES {campaign.budget.toFixed(2)}</div>
          </div>
          <div className="bg-elimux-card border border-border rounded-xl p-6">
            <div className="text-sm text-muted mb-1 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Impressions
            </div>
            <div className="text-2xl font-bold text-foreground">{(analytics?.impressions ?? campaign.impressions).toLocaleString()}</div>
          </div>
          <div className="bg-elimux-card border border-border rounded-xl p-6">
            <div className="text-sm text-muted mb-1 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4" /> Clicks
            </div>
            <div className="text-2xl font-bold text-foreground">{(analytics?.clicks ?? campaign.clicks).toLocaleString()}</div>
          </div>
          <div className="bg-elimux-card border border-border rounded-xl p-6">
            <div className="text-sm text-muted mb-1 flex items-center gap-2">
              <Percent className="w-4 h-4" /> CTR
            </div>
            <div className="text-2xl font-bold text-primary-400">{(analytics?.ctr ?? 0).toFixed(2)}%</div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {DAY_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => handleDaysChange(r)}
              className={`px-3 py-1 rounded border text-sm ${
                days === r ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-border text-muted'
              }`}
            >
              Last {r} days
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CampaignTrendChart label="Impressions" data={impressionsSeries} />
          <CampaignTrendChart label="Clicks" data={clicksSeries} />
        </div>

        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Daily Breakdown</h2>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-elimux-dark sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Impressions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Clicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(analytics?.daily_stats || []).map((d) => (
                  <tr key={d.date} className="hover:bg-elimux-dark/50">
                    <td className="px-6 py-3 text-sm text-foreground">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-sm text-foreground tabular-nums">{d.impressions.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-foreground tabular-nums">{d.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CampaignDetailPage() {
  return (
    <Suspense fallback={null}>
      <CampaignDetailContent />
    </Suspense>
  )
}
