// src/app/student/dashboard/impact/page.tsx
// Shows a student how their shares have translated into clicks/applications

'use client';

import { useEffect, useState } from 'react';
import { Eye, Share2, Users, Award, Smartphone, Globe } from 'lucide-react';

interface ImpactData {
  total_shares: number;
  whatsapp_shares: number;
  facebook_shares: number;
  copy_shares: number;
  total_clicks_generated: number;
  applications_generated: number;
  last_share_date: string;
}

export default function StudentImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/student-impact')
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading your impact...</div>;
  if (!data) return <div className="p-8">No sharing activity yet. Start sharing opportunities!</div>;

  const stats = [
    { icon: Share2, label: 'Total Shares', value: data.total_shares, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Eye, label: 'Clicks Generated', value: data.total_clicks_generated, color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Users, label: 'Applications Generated', value: data.applications_generated, color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Award, label: 'Impact Score', value: (data.total_clicks_generated * 2 + data.applications_generated * 10), color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const channels = [
    { icon: Smartphone, label: 'WhatsApp', value: data.whatsapp_shares, color: 'bg-green-500' },
    { icon: Globe, label: 'Facebook', value: data.facebook_shares, color: 'bg-blue-600' },
    { icon: Share2, label: 'Copy Link', value: data.copy_shares, color: 'bg-gray-600' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Impact</h1>
        <p className="text-gray-500">See how your shares are helping others discover opportunities</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4`}>
            <stat.icon className={`${stat.color} mb-2`} size={24} />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Share Channel Breakdown</h2>
        <div className="space-y-3">
          {channels.map((ch) => (
            <div key={ch.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${ch.color} flex items-center justify-center text-white`}>
                <ch.icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{ch.label}</span>
                  <span className="text-gray-500">{ch.value} shares</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full ${ch.color} rounded-full transition-all`}
                    style={{ width: `${data.total_shares > 0 ? (ch.value / data.total_shares) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.last_share_date && (
        <div className="text-sm text-gray-500 text-center">
          Last shared: {new Date(data.last_share_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
