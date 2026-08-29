'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  listAdminApplications,
  approveApplication,
  rejectApplication,
  approveProgramApplication,
  rejectProgramApplication,
  type AdminInstitutionApplication,
} from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import StatCard from '@/components/admin/StatCard'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { InstitutionApplicationDrawer } from '@/components/admin/InstitutionApplicationDrawer'
import { ArrowLeft, FileCheck2, Clock, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminApplicationsPage() {
  const { adminKey } = useAdminKey()
  const [applications, setApplications] = useState<AdminInstitutionApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [drawerApp, setDrawerApp] = useState<AdminInstitutionApplication | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await listAdminApplications(adminKey)
      setApplications(res.data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    load()
  }, [load])

  // Keep the drawer's data in sync with whatever the table just refreshed to
  // (e.g. after approving a nested program, the drawer should show the new
  // status without the user having to close and reopen it).
  useEffect(() => {
    if (!drawerApp) return
    const fresh = applications.find((a) => a.id === drawerApp.id)
    if (fresh) setDrawerApp(fresh)
  }, [applications, drawerApp?.id])

  async function handleApprove(id: string) {
    if (!adminKey) return
    setActioningId(id)
    try {
      await approveApplication(id, adminKey)
      toast.success('Application approved')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setActioningId(null)
    }
  }

  async function handleReject(id: string) {
    if (!adminKey) return
    setActioningId(id)
    try {
      await rejectApplication(id, adminKey)
      toast.success('Application rejected')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setActioningId(null)
    }
  }

  async function handleApproveProgram(id: string) {
    if (!adminKey) return
    setActioningId(id)
    try {
      await approveProgramApplication(id, adminKey)
      toast.success('Program approved')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve program')
    } finally {
      setActioningId(null)
    }
  }

  async function handleRejectProgram(id: string) {
    if (!adminKey) return
    setActioningId(id)
    try {
      await rejectProgramApplication(id, adminKey)
      toast.success('Program rejected')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject program')
    } finally {
      setActioningId(null)
    }
  }

  // No bulk endpoint exists on the backend for institution applications
  // either - same reuse-the-single-item-endpoint pattern already
  // established for /admin/users' bulk activate/suspend/delete.
  async function handleBulkApprove(selected: AdminInstitutionApplication[]) {
    if (!adminKey || selected.length === 0) return
    const ids = selected.map((a) => a.id)
    const results = await Promise.allSettled(ids.map((id) => approveApplication(id, adminKey)))
    const failed = results.filter((r) => r.status === 'rejected').length
    await load()
    if (failed > 0) toast.error(`${failed} of ${ids.length} approvals failed`)
    else toast.success(`${ids.length} application${ids.length === 1 ? '' : 's'} approved`)
  }

  async function handleBulkReject(selected: AdminInstitutionApplication[]) {
    if (!adminKey || selected.length === 0) return
    const ids = selected.map((a) => a.id)
    const results = await Promise.allSettled(ids.map((id) => rejectApplication(id, adminKey)))
    const failed = results.filter((r) => r.status === 'rejected').length
    await load()
    if (failed > 0) toast.error(`${failed} of ${ids.length} rejections failed`)
    else toast.success(`${ids.length} application${ids.length === 1 ? '' : 's'} rejected`)
  }

  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const approvedCount = applications.filter((a) => a.status === 'approved').length
  const rejectedCount = applications.filter((a) => a.status === 'rejected').length

  const statusOptions = useMemo(
    () => [
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
    ],
    []
  )

  const columns: Column<AdminInstitutionApplication>[] = [
    { key: 'name', header: 'Institution' },
    { key: 'type', header: 'Type', render: (a) => a.type?.name || '—' },
    { key: 'country', header: 'Country', render: (a) => a.country?.name || '—' },
    { key: 'email', header: 'Email' },
    {
      key: 'programs',
      header: 'Programs',
      sortable: false,
      render: (a) => String(a.programs.length),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            a.status === 'approved'
              ? 'bg-elimux-success/10 text-elimux-success'
              : a.status === 'rejected'
              ? 'bg-elimux-danger/10 text-elimux-danger'
              : 'bg-elimux-warning/10 text-elimux-warning'
          }`}
        >
          {a.status}
        </span>
      ),
    },
    {
      key: 'submitted_at',
      header: 'Submitted',
      render: (a) => new Date(a.submitted_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (a) =>
        a.status === 'pending' ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleApprove(a.id)}
              disabled={actioningId === a.id}
              className="rounded bg-elimux-success/10 px-2 py-1 text-xs font-medium text-elimux-success hover:bg-elimux-success/20 disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(a.id)}
              disabled={actioningId === a.id}
              className="rounded bg-elimux-danger/10 px-2 py-1 text-xs font-medium text-elimux-danger hover:bg-elimux-danger/20 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
  ]

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <FileCheck2 className="w-8 h-8 text-primary-400" />
        Applications
      </h1>
      <p className="text-muted mb-6">Institution onboarding applications, with nested program applications.</p>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard icon={Clock} label="Pending" value={String(pendingCount)} color="text-elimux-warning" />
        <StatCard icon={CheckCircle2} label="Approved" value={String(approvedCount)} color="text-elimux-success" />
        <StatCard icon={XCircle} label="Rejected" value={String(rejectedCount)} color="text-elimux-danger" />
      </div>

      <DataTable<AdminInstitutionApplication>
        data={applications}
        columns={columns}
        loading={loading}
        searchKeys={['name', 'email']}
        filters={[{ key: 'status', label: 'status', options: statusOptions }]}
        bulkActions={[
          { label: 'Approve', action: (sel) => handleBulkApprove(sel) },
          { label: 'Reject', action: (sel) => handleBulkReject(sel), variant: 'danger' },
        ]}
        onRowClick={(a) => setDrawerApp(a)}
        emptyMessage="No applications match your search/filter."
      />

      <InstitutionApplicationDrawer
        application={drawerApp}
        isOpen={!!drawerApp}
        onClose={() => setDrawerApp(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onApproveProgram={handleApproveProgram}
        onRejectProgram={handleRejectProgram}
        actioningId={actioningId}
      />
    </main>
  )
}
