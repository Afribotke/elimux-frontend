=== CYCLE 052 — COMMIT BULK DELETE + NEXT PRIORITY: ADMIN APPLICATIONS PAGE ===

## PART 1: COMMIT AND PUSH

Commit the bulk delete change from Cycle 051.

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): bulk delete users via Promise.allSettled

- Add handleBulkDelete matching existing handleBulkStatus pattern
- Wire into DataTable bulkActions as danger variant
- Guard against deleting admin@elimux.ke account
- Zero new files, zero new API routes, zero auth changes"
git push origin main
Wait for Vercel deploy to complete. Confirm the commit hash is live on www.elimux.ke.
PART 2: YOUR LIVE VERIFICATION (hands-only)
On the deployed site:
Log in as admin, enter the shared admin key
Select 2-3 known test accounts (not real users)
Click the red "Delete (N)" bulk action button
Confirm the dialog
Verify:
[ ] Toast shows correct success count
[ ] Deleted users disappear from table
[ ] Selection clears automatically
[ ] admin@elimux.ke cannot be selected for bulk delete (guard works)
Test bulk activate/suspend still work (no regression)
Report back: pass or fail with specific error
PART 3: NEXT PRIORITY — ADMIN APPLICATIONS PAGE
Once bulk delete is verified, the next admin dashboard gap is Applications visibility. Students apply to institutions/programs; admins need to see, filter, and manage those applications.
AUDIT OF CURRENT STATE
Built:
applications table exists in database
Students can submit applications via frontend
Admin dashboard shell with sidebar navigation
Gap:
No /admin/applications page
No visibility into pending, approved, rejected applications
No bulk approval/rejection workflow
No filtering by institution, program, status, date range
WHAT CLAUDE MUST DO
New file: src/app/admin/applications/page.tsx
This follows the exact same architecture as the existing /admin/users page: client-side auth via AdminKeyProvider, data fetched via @/lib/api, table rendered with the same DataTable component pattern.
New file: src/lib/api/admin-applications.ts
Add these functions alongside the existing admin API functions:
TypeScript
export async function fetchAdminApplications(
  adminKey: string,
  params?: {
    status?: string;
    institution_id?: string;
    program_id?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
  }
) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.institution_id) query.set('institution_id', params.institution_id);
  if (params?.program_id) query.set('program_id', params.program_id);
  if (params?.from_date) query.set('from_date', params.from_date);
  if (params?.to_date) query.set('to_date', params.to_date);
  if (params?.page) query.set('page', String(params.page));
  if (params?.per_page) query.set('per_page', String(params.per_page));
  
  const res = await fetch(`${API_URL}/api/admin/applications?${query.toString()}`, {
    headers: { 'x-admin-key': adminKey },
  });
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
}

export async function updateApplicationStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  adminKey: string,
  notes?: string
) {
  const res = await fetch(`${API_URL}/api/admin/applications/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error('Failed to update application status');
  return res.json();
}

export async function bulkUpdateApplicationStatus(
  ids: string[],
  status: 'approved' | 'rejected',
  adminKey: string
) {
  const res = await fetch(`${API_URL}/api/admin/applications/bulk-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ ids, status }),
  });
  if (!res.ok) throw new Error('Failed to bulk update applications');
  return res.json();
}
File to modify: src/app/admin/users/page.tsx (or the admin layout/sidebar)
Add a navigation link to /admin/applications in the admin sidebar, following the exact same pattern as the existing /admin/users link. Use the same icon style and active-state logic.
New file: src/app/admin/applications/page.tsx
tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAdminKey } from '@/components/admin/AdminKeyProvider';
import { fetchAdminApplications, updateApplicationStatus, bulkUpdateApplicationStatus } from '@/lib/api/admin-applications';
import { DataTable } from '@/components/admin/DataTable';
import { toast } from 'sonner';

interface Application {
  id: string;
  student_name: string;
  student_email: string;
  institution_name: string;
  program_name: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  notes: string | null;
}

export default function AdminApplicationsPage() {
  const { adminKey } = useAdminKey();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '25');
  const statusFilter = searchParams.get('status') || '';
  
  const loadApplications = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const data = await fetchAdminApplications(adminKey, {
        status: statusFilter || undefined,
        page,
        per_page: perPage,
      });
      setApplications(data.applications || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter, page, perPage]);
  
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);
  
  const updateQuery = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);
  
  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    if (!adminKey) return;
    try {
      await updateApplicationStatus(id, status, adminKey);
      toast.success(`Application ${status}`);
      await loadApplications();
    } catch {
      toast.error('Failed to update status');
    }
  };
  
  const handleBulkApprove = async () => {
    if (!adminKey || selectedRows.size === 0) return;
    try {
      await bulkUpdateApplicationStatus(Array.from(selectedRows), 'approved', adminKey);
      toast.success(`Approved ${selectedRows.size} application(s)`);
      setSelectedRows(new Set());
      await loadApplications();
    } catch {
      toast.error('Bulk approval failed');
    }
  };
  
  const handleBulkReject = async () => {
    if (!adminKey || selectedRows.size === 0) return;
    try {
      await bulkUpdateApplicationStatus(Array.from(selectedRows), 'rejected', adminKey);
      toast.success(`Rejected ${selectedRows.size} application(s)`);
      setSelectedRows(new Set());
      await loadApplications();
    } catch {
      toast.error('Bulk rejection failed');
    }
  };
  
  const columns = [
    { key: 'student_name', header: 'Student', sortable: true },
    { key: 'institution_name', header: 'Institution', sortable: true },
    { key: 'program_name', header: 'Program', sortable: true },
    { 
      key: 'status', 
      header: 'Status', 
      render: (app: Application) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
          app.status === 'approved' ? 'bg-green-100 text-green-800' :
          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-amber-100 text-amber-800'
        }`}>
          {app.status}
        </span>
      )
    },
    { 
      key: 'submitted_at', 
      header: 'Submitted', 
      render: (app: Application) => new Date(app.submitted_at).toLocaleDateString('en-KE')
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (app: Application) => (
        app.status === 'pending' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange(app.id, 'approved')}
              className="rounded bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusChange(app.id, 'rejected')}
              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      )
    },
  ];
  
  const bulkActions = [
    {
      label: `Approve (${selectedRows.size})`,
      onClick: handleBulkApprove,
      variant: 'success' as const,
      disabled: selectedRows.size === 0,
    },
    {
      label: `Reject (${selectedRows.size})`,
      onClick: handleBulkReject,
      variant: 'danger' as const,
      disabled: selectedRows.size === 0,
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} total applications</p>
        </div>
      </div>
      
      <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => updateQuery({ status: e.target.value, page: '1' })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
      <DataTable
        data={applications}
        columns={columns}
        loading={loading}
        selectedRows={selectedRows}
        onSelectRows={setSelectedRows}
        bulkActions={bulkActions}
        pagination={{
          page,
          perPage,
          total,
          onPageChange: p => updateQuery({ page: String(p) }),
        }}
      />
    </div>
  );
}
Note: If DataTable component props differ from what's shown above (e.g., different prop names for pagination or bulk actions), adjust to match the real component interface. Do not modify DataTable.tsx itself — adapt the page to use whatever props it actually accepts.
VERIFICATION CHECKLIST (Applications Page)
After Claude builds this:
Build: npm run build — zero errors.
Type check: npx tsc --noEmit — clean.
Navigation: Confirm /admin/applications link appears in sidebar and is clickable.
Page load: Visit /admin/applications with admin key. Confirm:
[ ] Table loads with application data
[ ] Status filter dropdown works
[ ] Pending applications show Approve/Reject buttons
[ ] Approved/Rejected applications show "—" in actions column
Single action: Click Approve on a pending application. Confirm:
[ ] Toast shows success
[ ] Status badge changes to green "Approved"
[ ] Action buttons disappear
Bulk action: Select 2 pending applications, click Bulk Approve. Confirm both update.
No regression: Admin users page still works correctly.
Do NOT commit or push until all 7 items are checked.