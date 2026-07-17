'use client'

// ============================================
// ELIMUX AD PORTAL - CAMPAIGNS LIST
// /advertiser/campaigns
// ============================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import { advertiserFetch, ADVERTISER_LOGIN_PATH } from '@/lib/advertiserAuth'
import { supabase } from '@/lib/supabase'
import AdvertiserNav from '@/components/AdvertiserNav'

interface Campaign {
  id: string
  title: string
  status: string
  placement: string
  budget: number
  impressions: number
  clicks: number
  created_at: string
}

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

export default function CampaignsListPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push(ADVERTISER_LOGIN_PATH)
        return
      }

      const res = await advertiserFetch('/api/campaigns')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load campaigns')
      setCampaigns(data.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elimux-dark">
      <AdvertiserNav />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
            <p className="text-muted mt-1">All your advertising campaigns</p>
          </div>
          <button
            onClick={() => router.push('/advertiser/campaigns/new')}
            className="bg-primary-600 hover:bg-primary-700 text-elimux-dark px-4 py-2 rounded-lg font-medium"
          >
            + New Campaign
          </button>
        </div>

        {error && (
          <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm mb-6">
            {error}
          </div>
        )}

        <div className="bg-elimux-card rounded-xl border border-border overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No campaigns yet</h3>
              <p className="text-muted mb-4">Create your first campaign to start reaching students</p>
              <button
                onClick={() => router.push('/advertiser/campaigns/new')}
                className="bg-primary-600 hover:bg-primary-700 text-elimux-dark px-6 py-2 rounded-lg font-medium"
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-elimux-dark">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Impressions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="hover:bg-elimux-dark/50 cursor-pointer"
                      onClick={() => router.push(`/advertiser/campaigns/${campaign.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{campaign.title}</div>
                        <div className="text-sm text-muted">{campaign.placement.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">${campaign.budget.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.impressions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
