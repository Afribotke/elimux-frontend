// src/components/smarttrack/ShareStats.tsx
// Small stats strip shown on content detail pages — views/unique/shares/top source

'use client';

import { useEffect, useState } from 'react';
import { Eye, Share2, MousePointer, TrendingUp } from 'lucide-react';

interface ShareStatsProps {
  contentType: string;
  contentId: string;
}

interface Stats {
  total_clicks: number;
  unique_clicks: number;
  total_shares: number;
  top_referrer: string;
}

export default function ShareStats({ contentType, contentId }: ShareStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/content?contentType=${contentType}&contentId=${contentId}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setStats(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contentType, contentId]);

  if (loading) return <div className="h-16 bg-gray-100 animate-pulse rounded-lg" />;
  if (!stats) return null;

  const items = [
    { icon: Eye, label: 'Views', value: stats.total_clicks || 0 },
    { icon: MousePointer, label: 'Unique', value: stats.unique_clicks || 0 },
    { icon: Share2, label: 'Shares', value: stats.total_shares || 0 },
    { icon: TrendingUp, label: 'Top Source', value: stats.top_referrer || 'Direct' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-1 p-2">
          <item.icon size={16} className="text-gray-400" />
          <span className="text-lg font-bold text-gray-900">{item.value}</span>
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
