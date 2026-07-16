'use client'

// ============================================
// ELIMUX AD PORTAL - ADVERTISER DASHBOARD
// /advertiser/dashboard
// ============================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, XCircle, Megaphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { advertiserFetch, ADVERTISER_LOGIN_PATH } from '@/lib/advertiserAuth'
import AdvertiserNav from '@/components/AdvertiserNav'

interface DashboardStats {
  balance: number
  total_spent: number
  total_campaigns: number
  active_campaigns: number
  total_impressions: number
  total_clicks: number
  total_ctr: string
}

interface Campaign {
  id: string
  name: string
  status: string
  campaign_type: string
  budget: number
  total_spent: number
  total_impressions: number
  total_clicks: number
  start_date: string
  end_date: string
  created_at: string
}

export default function AdvertiserDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profileStatus, setProfileStatus] = useState<string>('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push(ADVERTISER_LOGIN_PATH)
        return
      }

      const profileRes = await advertiserFetch('/api/advertiser/profile')

      if (profileRes.status === 404) {
        router.push('/advertiser/register')
        return
      }

      const profileData = await profileRes.json()
      setProfileStatus(profileData.data?.status || 'pending')

      if (profileData.data?.status !== 'approved') {
        setLoading(false)
        return
      }

      const statsRes = await advertiserFetch('/api/advertiser/stats')
      const statsData = await statsRes.json()
      if (statsData.success) setStats(statsData.data)

      const campaignsRes = await advertiserFetch('/api/campaigns')
      const campaignsData = await campaignsRes.json()
      if (campaignsData.success) setCampaigns(campaignsData.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-muted/20 text-muted',
      pending_review: 'bg-primary-500/10 text-primary-400',
      approved: 'bg-primary-500/10 text-primary-400',
      active: 'bg-elimux-success/10 text-elimux-success',
      paused: 'bg-elimux-warning/10 text-elimux-warning',
      completed: 'bg-primary-500/10 text-primary-400',
      rejected: 'bg-elimux-danger/10 text-elimux-danger',
    }
    return colors[status] || 'bg-muted/20 text-muted'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (profileStatus === 'pending') {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-elimux-card border border-border rounded-xl p-8">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Pending Approval</h2>
            <p className="text-muted">Your advertiser profile is under review. You will receive an email once approved.</p>
          </div>
        </div>
      </div>
    )
  }

  if (profileStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-elimux-card border border-border rounded-xl p-8">
            <div className="w-16 h-16 bg-elimux-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-elimux-danger" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Application Rejected</h2>
            <p className="text-muted mb-4">Your advertiser application was not approved. Please contact support.</p>
            <button
              onClick={() => router.push('/contact')}
              className="bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold px-6 py-2 rounded-lg"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elimux-dark">
      <AdvertiserNav />
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Advertiser Dashboard</h1>
            <p className="text-muted mt-1">Manage campaigns and track performance</p>
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

        {stats && (
          <div id="analytics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-elimux-card rounded-xl border border-border p-6">
              <div className="text-sm text-muted mb-1">Account Balance</div>
              <div className="text-2xl font-bold text-foreground">${stats.balance.toFixed(2)}</div>
              <div className="text-xs text-elimux-success mt-1">Available for campaigns</div>
            </div>
            <div className="bg-elimux-card rounded-xl border border-border p-6">
              <div className="text-sm text-muted mb-1">Total Spent</div>
              <div className="text-2xl font-bold text-foreground">${stats.total_spent.toFixed(2)}</div>
              <div className="text-xs text-muted mt-1">Lifetime spending</div>
            </div>
            <div className="bg-elimux-card rounded-xl border border-border p-6">
              <div className="text-sm text-muted mb-1">Active Campaigns</div>
              <div className="text-2xl font-bold text-primary-400">{stats.active_campaigns}</div>
              <div className="text-xs text-muted mt-1">of {stats.total_campaigns} total</div>
            </div>
            <div className="bg-elimux-card rounded-xl border border-border p-6">
              <div className="text-sm text-muted mb-1">Total CTR</div>
              <div className="text-2xl font-bold text-primary-400">{stats.total_ctr}%</div>
              <div className="text-xs text-muted mt-1">
                {stats.total_clicks} clicks / {stats.total_impressions} impressions
              </div>
            </div>
          </div>
        )}

        <div id="campaigns" className="bg-elimux-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Your Campaigns</h2>
            <span className="text-sm text-muted">{campaigns.length} campaigns</span>
          </div>

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Impressions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-elimux-dark/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{campaign.name}</div>
                        <div className="text-sm text-muted">{campaign.campaign_type.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">${campaign.budget.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-foreground">${campaign.total_spent.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.total_impressions.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{campaign.total_clicks.toLocaleString()}</td>
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
