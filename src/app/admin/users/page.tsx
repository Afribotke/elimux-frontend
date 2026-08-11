'use client'

import { useEffect, useState, useCallback } from 'react'
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
import { ArrowLeft, Users, UserCheck, UserX, Loader2, Trash2 } from 'lucide-react'

const PAGE_SIZE = 25

// Real admin panel access is gated on admin_users/user_roles, not this
// column (see auth.ts) - "admin"/"super_admin" are deliberately left out of
// this dropdown so it can't imply granting admin access it can't actually
// grant. Users already in admin_users show a read-only badge instead.
const ASSIGNABLE_ROLES = ['student', 'partner', 'advertiser', 'institution']

export default function AdminUsersPage() {
  const { adminKey } = useAdminKey()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetchAdminUsersList(adminKey, page, PAGE_SIZE)
      setUsers(res.data)
      setCount(res.count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [adminKey, page])

  useEffect(() => {
    load()
  }, [load])

  async function handleRoleChange(id: string, role: string) {
    if (!adminKey) return
    setActioningId(id)
    try {
      await updateAdminUserRole(id, role, adminKey)
      toast.success('Role updated')
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
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
      setCount((c) => c - 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setActioningId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const activeCount = users.filter((u) => u.is_active).length

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Users className="w-8 h-8 text-primary-400" />
        Users
      </h1>
      <p className="text-muted mb-6">Manage platform user accounts, roles, and access.</p>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading users...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <StatCard icon={Users} label="Total Users" value={String(count)} />
            <StatCard icon={UserCheck} label="Active (this page)" value={String(activeCount)} color="text-elimux-success" />
            <StatCard icon={UserX} label="Suspended (this page)" value={String(users.length - activeCount)} color="text-elimux-warning" />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Login</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted">{u.full_name || '—'}</td>
                    <td className="px-4 py-3">
                      {u.admin_users?.length ? (
                        <span
                          className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400"
                          title="Admin role lives in admin_users, not this dropdown - it can't be changed here"
                        >
                          {u.admin_users[0].role} (admin)
                        </span>
                      ) : (
                        <select
                          value={ASSIGNABLE_ROLES.includes(u.role) ? u.role : ASSIGNABLE_ROLES[0]}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={actioningId === u.id}
                          className="px-2 py-1 rounded-lg bg-elimux-dark border border-border text-foreground text-xs disabled:opacity-50"
                          aria-label={`Role for ${u.email}`}
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.is_active ? 'bg-elimux-success/10 text-elimux-success' : 'bg-elimux-danger/10 text-elimux-danger'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actioningId === u.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium disabled:opacity-50 ${
                            u.is_active
                              ? 'text-elimux-danger hover:bg-elimux-danger/10'
                              : 'text-elimux-success hover:bg-elimux-success/10'
                          }`}
                        >
                          {actioningId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : u.is_active ? (
                            'Suspend'
                          ) : (
                            'Activate'
                          )}
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
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-elimux-card border border-border text-muted disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-elimux-card border border-border text-muted disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
