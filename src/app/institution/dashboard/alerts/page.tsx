// src/app/institution/dashboard/alerts/page.tsx
// Notifies an institution admin when their content starts trending (Cycle 028)

'use client';

import { useEffect, useState } from 'react';
import { Bell, Flame, Eye, CheckCircle } from 'lucide-react';

interface TrendingAlert {
  id: string;
  content_type: string;
  content_id: string;
  alert_type: string;
  message: string;
  clicks_at_alert: number;
  sent_at: string;
  read_at: string | null;
}

export default function InstitutionAlertsPage() {
  const [alerts, setAlerts] = useState<TrendingAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/institution/alerts')
      .then((r) => r.json())
      .then((res) => { if (res.success) setAlerts(res.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (alertId: string) => {
    await fetch(`/api/institution/alerts/${alertId}/read`, { method: 'POST' });
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read_at: new Date().toISOString() } : a)));
  };

  if (loading) return <div className="p-8">Loading alerts...</div>;

  const unreadCount = alerts.filter((a) => !a.read_at).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="text-orange-500" size={24} />
        <h1 className="text-2xl font-bold text-gray-900">Trending Alerts</h1>
        {unreadCount > 0 && (
          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
            {unreadCount} new
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Flame size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No trending alerts yet. When your content starts trending, you will see alerts here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.read_at ? 'bg-gray-50 border-gray-200' : 'bg-white border-orange-200 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={16} className={alert.read_at ? 'text-gray-400' : 'text-orange-500'} />
                    <span className={`text-sm font-medium capitalize ${alert.read_at ? 'text-gray-500' : 'text-gray-900'}`}>
                      {alert.alert_type}
                    </span>
                    <span className="text-xs text-gray-400">{alert.content_type}</span>
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Eye size={12} /> {alert.clicks_at_alert} clicks</span>
                    <span>{new Date(alert.sent_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {!alert.read_at && (
                  <button
                    type="button"
                    onClick={() => markRead(alert.id)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title="Mark as read"
                  >
                    <CheckCircle size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
