'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  fetchAdminUsersList,
  updateAdminUserRole,
  updateAdminUserStatus,
  deleteAdminUser,
  type AdminUserRow,
} from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import StatCard from '@/components/admin/StatCard'
import { DataTable, type Column } from '@/components/admin/DataTable'
import { UserDetailDrawer } from '@/components/admin/UserDetailDrawer'
import { ArrowLeft, Users, UserCheck, UserX, Loader2, Trash2, Download } from 'lucide-react'

// The backend's GET /api/auth/users only supports page/limit, no search or
// role-filter query params (checked src/lib/api.ts - this is a frontend-only
// repo, can't add server-side search without touching the backend repo) -
// so this fetches a single generous page and lets DataTable do search/
// filter/sort/pagination entirely client-side. Correct at the platform's
// current scale (10 total users, checked live against the DB). Revisit with
// real server-side search if the user base grows past a few hundred - past
// FETCH_LIMIT, users would silently stop appearing in the list.
const FETCH_LIMIT = 500

type UserRowWithRole = AdminUserRow & { effectiveRole: string }

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export default function AdminUsersPage() {
  const { adminKey } = useAdminKey()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [drawerUser, setDrawerUser] = useState<AdminUserRow | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetchAdminUsersList(adminKey, 1, FETCH_LIMIT)
      setUsers(res.data)
      setTotalCount(res.count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    load()
  }, [load])

  // DataTable sorts/searches/filters on plain row properties, so the
  // "effective role" (admin_users override vs the plain role column) is
  // computed once here rather than taught to the generic table component.
  const rows: UserRowWithRole[] = useMemo(
    () => users.map((u) => ({ ...u, effectiveRole: u.admin_users?.length ? u.admin_users[0].role : u.role })),
    [users]
  )

  const roleOptions = useMemo(() => {
    const roles = new Set(rows.map((r) => r.effectiveRole))
    return Array.from(roles)
      .sort()
      .map((r) => ({ value: r, label: r }))
  }, [rows])

  async function handleRoleChange(id: string, role: string) {
    if (!adminKey) return
    setActioningId(id)
    try {
      await updateAdminUserRole(id, role, adminKey)
      toast.success('Role updated')
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
      setDrawerUser((prev) => (prev && prev.id === id ? { ...prev, role } : prev))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setActioningId(null)
    }
  }

  async function handleToggleStatus(user: AdminUserRow) {
    if (!adminKey) return
    setActioningId(user.id)
    try {
      const nextActive = !user.is_active
      await updateAdminUserStatus(user.id, nextActive, adminKey)
      toast.success(nextActive ? 'User activated' : 'User suspended')
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: nextActive } : u)))
      setDrawerUser((prev) => (prev && prev.id === user.id ? { ...prev, is_active: nextActive } : prev))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActioningId(null)
    }
  }

  async function handleDelete(user: AdminUserRow) {
    if (!adminKey) return
    if (!confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return
    setActioningId(user.id)
    try {
      await deleteAdminUser(user.id, adminKey)
      toast.success('User deleted')
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setTotalCount((c) => c - 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setActioningId(null)
    }
  }

  // No bulk endpoint exists on the backend - loops the existing single-user
  // endpoint instead. Fine at this platform's scale; worth a real bulk
  // endpoint backend-side if selections regularly exceed a few dozen users.
  async function handleBulkStatus(selected: UserRowWithRole[], nextActive: boolean) {
    if (!adminKey || selected.length === 0) return
    const ids = selected.map((u) => u.id)
    const results = await Promise.allSettled(ids.map((id) => updateAdminUserStatus(id, nextActive, adminKey)))
    const failed = results.filter((r) => r.status === 'rejected').length
    setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, is_active: nextActive } : u)))
    if (failed > 0) toast.error(`${failed} of ${ids.length} updates failed`)
    else toast.success(`${ids.length} user${ids.length === 1 ? '' : 's'} ${nextActive ? 'activated' : 'suspended'}`)
  }

  // Same reuse-the-existing-single-user-endpoint pattern as handleBulkStatus
  // above - no bulk delete endpoint exists on the backend, so this loops
  // deleteAdminUser via Promise.allSettled instead of a new API route.
  //
  // Self-deletion guard note: this admin panel authenticates with one
  // shared x-admin-key (AdminKeyProvider), not per-admin Supabase sessions -
  // there is no "current logged-in admin's user ID" anywhere in this
  // architecture to compare the selection against, since any key holder is
  // indistinguishable from any other. Guarding against the platform's
  // primary admin account by email instead, matching this project's
  // standing policy of never touching admin@elimux.ke.
  const PROTECTED_ADMIN_EMAIL = 'admin@elimux.ke'

  async function handleBulkDelete(selected: UserRowWithRole[]) {
    if (!adminKey || selected.length === 0) return

    const protectedSelection = selected.find((u) => u.email === PROTECTED_ADMIN_EMAIL)
    if (protectedSelection) {
      toast.error('Cannot delete the primary admin account')
      return
    }

    const count = selected.length
    if (!confirm(`Permanently delete ${count} user(s)? This cannot be undone.`)) return

    const ids = selected.map((u) => u.id)
    const results = await Promise.allSettled(ids.map((id) => deleteAdminUser(id, adminKey)))
    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    setUsers((prev) => prev.filter((u) => !ids.includes(u.id)))
    setTotalCount((c) => c - succeeded)

    if (failed > 0) toast.error(`Deleted ${succeeded} of ${count} users - ${failed} failed`)
    else toast.success(`Deleted ${succeeded} user${succeeded === 1 ? '' : 's'} successfully`)
  }

  function handleExportCsv() {
    const header = ['Email', 'Name', 'Role', 'Status', 'Last Login', 'Joined']
    const csvRows = rows.map((u) => [
      u.email,
      u.full_name || '',
      u.admin_users?.length ? `${u.admin_users[0].role} (admin)` : u.role,
      u.is_active ? 'Active' : 'Suspended',
      u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString() : '',
      new Date(u.created_at).toISOString(),
    ])
    const csv = [header, ...csvRows].map((r) => r.map((v) => csvEscape(String(v))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `elimux-users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeCount = users.filter((u) => u.is_active).length

  const columns: Column<UserRowWithRole>[] = [
    { key: 'email', header: 'Email' },
    { key: 'full_name', header: 'Name', render: (u) => u.full_name || '—' },
    {
      key: 'effectiveRole',
      header: 'Role',
      render: (u) =>
        u.admin_users?.length ? (
          <span
            className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400"
            title="Admin role lives in admin_users, not this dropdown - it can't be changed here"
          >
            {u.admin_users[0].role} (admin)
          </span>
        ) : (
          <span className="capitalize">{u.role}</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (u) => (
        <span
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
            u.is_active ? 'bg-elimux-success/10 text-elimux-success' : 'bg-elimux-danger/10 text-elimux-danger'
          }`}
        >
          {u.is_active ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      render: (u) => new Date(u.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (u) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggleStatus(u)}
            disabled={actioningId === u.id}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-50 ${
              u.is_active ? 'text-elimux-danger hover:bg-elimux-danger/10' : 'text-elimux-success hover:bg-elimux-success/10'
            }`}
          >
            {actioningId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : u.is_active ? 'Suspend' : 'Activate'}
          </button>
          <button
            onClick={() => handleDelete(u)}
            disabled={actioningId === u.id}
            className="p-1.5 rounded-lg text-muted hover:text-elimux-danger hover:bg-elimux-danger/10 disabled:opacity-50"
            title="Delete user"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-start justify-between mb-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-primary-400" />
          Users
        </h1>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <p className="text-muted mb-6">Manage platform user accounts, roles, and access.</p>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard icon={Users} label="Total Users" value={String(totalCount)} />
        <StatCard icon={UserCheck} label="Active" value={String(activeCount)} color="text-elimux-success" />
        <StatCard icon={UserX} label="Suspended" value={String(users.length - activeCount)} color="text-elimux-warning" />
      </div>

      <DataTable<UserRowWithRole>
        data={rows}
        columns={columns}
        loading={loading}
        searchKeys={['email', 'full_name']}
        filters={[{ key: 'effectiveRole', label: 'roles', options: roleOptions }]}
        bulkActions={[
          { label: 'Activate', action: (sel) => handleBulkStatus(sel, true) },
          { label: 'Suspend', action: (sel) => handleBulkStatus(sel, false), variant: 'danger' },
          { label: 'Delete', action: (sel) => handleBulkDelete(sel), variant: 'danger' },
        ]}
        onRowClick={(u) => setDrawerUser(u)}
        emptyMessage="No users match your search/filter."
      />

      <UserDetailDrawer
        user={drawerUser}
        isOpen={!!drawerUser}
        onClose={() => setDrawerUser(null)}
        onUpdateRole={handleRoleChange}
        onToggleStatus={handleToggleStatus}
        actioning={actioningId === drawerUser?.id}
      />
    </main>
  )
}
