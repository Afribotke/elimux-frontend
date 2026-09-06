'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export default function InstitutionAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/institution/alerts');
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load alerts');
      }

      setAlerts(json.data || []);
      setUnreadCount(json.unreadCount || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/institution/alerts/${id}/read`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to mark as read');
      }
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read_at: new Date().toISOString() } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <div>
          <p className="font-medium text-gray-900">Could not load alerts</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
        <button
          onClick={fetchAlerts}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => {
              // Mark all as read (fire and forget, refresh after)
              Promise.all(
                alerts.filter((a) => !a.read_at).map((a) => markAsRead(a.id))
              ).then(() => fetchAlerts());
            }}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center">
          <Bell className="h-10 w-10 text-gray-300" />
          <div>
            <p className="font-medium text-gray-900">No alerts yet</p>
            <p className="text-sm text-gray-500">
              Notifications appear here when students apply to your programs.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                alert.read_at
                  ? 'border-gray-200 bg-white'
                  : 'border-primary/20 bg-primary/5'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'new_application' ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Bell className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="mt-1 text-sm text-gray-600">{alert.message}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </p>
              </div>
              {!alert.read_at && (
                <button
                  onClick={() => markAsRead(alert.id)}
                  className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Mark as read"
                >
                  <Check className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
