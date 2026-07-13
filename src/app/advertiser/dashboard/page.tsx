'use client';

// ============================================
// ELIMUX AD PORTAL - ADVERTISER DASHBOARD
// /advertiser/dashboard
// ============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
    balance: number;
    total_spent: number;
    total_campaigns: number;
    active_campaigns: number;
    total_impressions: number;
    total_clicks: number;
    total_ctr: string;
}

interface Campaign {
    id: string;
    name: string;
    status: string;
    campaign_type: string;
    budget: number;
    total_spent: number;
    total_impressions: number;
    total_clicks: number;
    start_date: string;
    end_date: string;
    created_at: string;
}

export default function AdvertiserDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profileStatus, setProfileStatus] = useState<string>('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/advertiser/profile`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (profileRes.status === 404) {
                router.push('/advertiser/register');
                return;
            }

            const profileData = await profileRes.json();
            setProfileStatus(profileData.data?.status || 'pending');

            if (profileData.data?.status !== 'approved') {
                setLoading(false);
                return;
            }

            const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/advertiser/stats`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const statsData = await statsRes.json();
            if (statsData.success) setStats(statsData.data);

            const campaignsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const campaignsData = await campaignsRes.json();
            if (campaignsData.success) setCampaigns(campaignsData.data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            pending_review: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-blue-100 text-blue-800',
            active: 'bg-green-100 text-green-800',
            paused: 'bg-orange-100 text-orange-800',
            completed: 'bg-purple-100 text-purple-800',
            rejected: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (profileStatus === 'pending') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Approval</h2>
                        <p className="text-gray-600">
                            Your advertiser profile is under review. You will receive an email once approved.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (profileStatus === 'rejected') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Rejected</h2>
                        <p className="text-gray-600 mb-4">
                            Your advertiser application was not approved. Please contact support.
                        </p>
                        <button
                            onClick={() => router.push('/contact')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Advertiser Dashboard</h1>
                        <p className="text-gray-600 mt-1">Manage campaigns and track performance</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/advertiser/billing')}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Billing
                        </button>
                        <button
                            onClick={() => router.push('/advertiser/campaigns/new')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                        >
                            + New Campaign
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">
                        {error}
                    </div>
                )}

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-sm text-gray-500 mb-1">Account Balance</div>
                            <div className="text-2xl font-bold text-gray-900">${stats.balance.toFixed(2)}</div>
                            <div className="text-xs text-green-600 mt-1">Available for campaigns</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-sm text-gray-500 mb-1">Total Spent</div>
                            <div className="text-2xl font-bold text-gray-900">${stats.total_spent.toFixed(2)}</div>
                            <div className="text-xs text-gray-400 mt-1">Lifetime spending</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-sm text-gray-500 mb-1">Active Campaigns</div>
                            <div className="text-2xl font-bold text-blue-600">{stats.active_campaigns}</div>
                            <div className="text-xs text-gray-400 mt-1">of {stats.total_campaigns} total</div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="text-sm text-gray-500 mb-1">Total CTR</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.total_ctr}%</div>
                            <div className="text-xs text-gray-400 mt-1">{stats.total_clicks} clicks / {stats.total_impressions} impressions</div>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
                        <span className="text-sm text-gray-500">{campaigns.length} campaigns</span>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No campaigns yet</h3>
                            <p className="text-gray-500 mb-4">Create your first campaign to start reaching students</p>
                            <button
                                onClick={() => router.push('/advertiser/campaigns/new')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Create Campaign
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spent</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impressions</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{campaign.name}</div>
                                                <div className="text-sm text-gray-500">{campaign.campaign_type.replace('_', ' ')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                                    {campaign.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">${campaign.budget.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">${campaign.total_spent.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{campaign.total_impressions.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{campaign.total_clicks.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => router.push(`/advertiser/campaigns/${campaign.id}`)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
