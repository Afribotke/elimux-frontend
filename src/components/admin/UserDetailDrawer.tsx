'use client';

import { X, Mail, Calendar, Clock, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import type { AdminUserRow } from '@/lib/api';

const ASSIGNABLE_ROLES = ['student', 'partner', 'advertiser', 'institution'];

interface UserDetailDrawerProps {
  user: AdminUserRow | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRole: (userId: string, role: string) => void;
  onToggleStatus: (user: AdminUserRow) => void;
  actioning: boolean;
}

export function UserDetailDrawer({
  user,
  isOpen,
  onClose,
  onUpdateRole,
  onToggleStatus,
  actioning,
}: UserDetailDrawerProps) {
  if (!isOpen || !user) return null;

  const isAdmin = !!user.admin_users?.length;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 z-50 h-screen w-full sm:w-72 bg-elimux-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">User Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elimux-dark">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <div>
            <p className="text-lg font-semibold text-foreground">{user.full_name || 'Unnamed user'}</p>
            <p className="text-sm text-muted flex items-center gap-1.5 mt-1">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Status</p>
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.is_active ? 'bg-elimux-success/10 text-elimux-success' : 'bg-elimux-danger/10 text-elimux-danger'
                }`}
              >
                {user.is_active ? 'Active' : 'Suspended'}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Role</p>
              {isAdmin ? (
                <span
                  className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400"
                  title="Admin role lives in admin_users - it can't be changed here"
                >
                  {user.admin_users[0].role} (admin)
                </span>
              ) : (
                <select
                  value={ASSIGNABLE_ROLES.includes(user.role) ? user.role : ASSIGNABLE_ROLES[0]}
                  onChange={(e) => onUpdateRole(user.id, e.target.value)}
                  disabled={actioning}
                  className="px-2 py-1 rounded-lg bg-elimux-dark border border-border text-foreground text-xs disabled:opacity-50"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-xs text-muted uppercase tracking-wide">Account activity</p>
            <p className="flex items-center gap-1.5 text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted" /> Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
            <p className="flex items-center gap-1.5 text-foreground">
              <Clock className="w-3.5 h-3.5 text-muted" />{' '}
              {user.last_sign_in_at ? `Last login ${new Date(user.last_sign_in_at).toLocaleDateString()}` : 'Never signed in'}
            </p>
          </div>

          {/* Applications submitted + a detailed activity log were both asked
              for here, but neither can be shown honestly from the browser:
              `applications` has no admin-read RLS policy (checked directly -
              only the owning student or the internship's employer can read a
              row), and `analytics_events` is keyed by a device fingerprint,
              not a user id, so there's no reliable way to scope it to one
              account. Both need a real backend admin endpoint (service-role
              key) to build correctly - that's outside this frontend repo. */}
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Applications submitted and a detailed activity log aren&apos;t shown here — both need a backend
              admin endpoint with a service-role key (RLS on <code>applications</code> only allows the
              submitting student or the internship&apos;s employer to read it; <code>analytics_events</code> is
              keyed by device, not by account). Flagged as a backend follow-up, not built as a
              silently-empty placeholder.
            </span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0">
          <button
            onClick={() => onToggleStatus(user)}
            disabled={actioning}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
              user.is_active
                ? 'bg-elimux-danger/10 text-elimux-danger hover:bg-elimux-danger/20'
                : 'bg-elimux-success/10 text-elimux-success hover:bg-elimux-success/20'
            }`}
          >
            {actioning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {user.is_active ? 'Suspend account' : 'Activate account'}
          </button>
        </div>
      </aside>
    </>
  );
}
