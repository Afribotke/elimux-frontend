// src/app/institution/dashboard/analytics/page.tsx
// Shows an institution how its own smart links (shared listings) are performing
//
// NOTE: scoped to smart links the signed-in institution user created (via
// /api/analytics/overview, which filters on smart_links.created_by). There is no
// institution_id column on content_performance to join against yet, so this can't
// show performance for listings shared by other staff/students — flagged in bridge.md.

'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, MousePointer, Link2 } from 'lucide-react';

interface SmartLinkRow {
  id: string;
  slug: string;
  content_type: string;
  content_id: string;
  total_clicks: number;
  unique_clicks: number;
  created_at: string;
}

export default function InstitutionAnalyticsPage() {
  const [links, setLinks] = useState<SmartLinkRow[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/overview?days=${days}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setLinks(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) return <div className="p-8">Loading analytics...</div>;

  const totalClicks = links.reduce((sum, l) => sum + (l.total_clicks || 0), 0);
  const totalUnique = links.reduce((sum, l) => sum + (l.unique_clicks || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Analytics</h1>
          <p className="text-gray-500">Track how students discover your shared opportunities</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <Eye className="text-blue-600 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">{totalClicks}</div>
          <div className="text-sm text-gray-600">Total Clicks</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <MousePointer className="text-green-600 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">{totalUnique}</div>
          <div className="text-sm text-gray-600">Unique Visitors</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <Link2 className="text-purple-600 mb-2" size={24} />
          <div className="text-2xl font-bold text-gray-900">{links.length}</div>
          <div className="text-sm text-gray-600">Smart Links Created</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clicks by Content</h3>
        {links.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={links}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="content_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_clicks" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-gray-400">No smart links yet in this period</div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Content</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Slug</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Clicks</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Unique</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-t border-gray-100">
                <td className="px-4 py-3 capitalize text-gray-900">{link.content_type}</td>
                <td className="px-4 py-3 text-gray-500">/s/{link.slug}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{link.total_clicks || 0}</td>
                <td className="px-4 py-3 text-right text-gray-900">{link.unique_clicks || 0}</td>
                <td className="px-4 py-3 text-gray-900">{new Date(link.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
