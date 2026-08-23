'use client'

import { Fragment, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardCheck, CheckCircle2, XCircle, ChevronDown, ChevronUp, Building2 } from 'lucide-react'

// MOCK DATA — no backend API exists for this yet.
//
// `university_student_uploads` (public schema) is the real table this page
// should eventually read from — it matches "university-uploaded student
// eligibility batches" exactly (university_id, uploaded_by, file_name,
// total_records, successful_records, failed_records, upload_status,
// error_log, metadata). Confirmed via direct query: the table exists but
// currently has zero rows, and there is no backend route for it at all
// (grepped elimux-backend/src — nothing).
//
// It also has no approval-decision column — `upload_status` tracks
// technical processing state ('processing' | presumably 'completed' /
// 'failed'), not an admin approve/reject decision. Needed for real
// integration, not built here per the instruction's own "frontend first,
// do not block on backend" guidance:
//   1. A status column (or a separate `approval_status`) with
//      pending/approved/rejected, defaulting to 'pending' on insert.
//   2. GET  /api/admin/university-uploads?status=&page=&search=
//        -> { data: [...], pagination: { total, page, limit } }
//      joining `universities`/`institutions` for the display name.
//   3. POST /api/admin/university-uploads/:id/approve
//   4. POST /api/admin/university-uploads/:id/reject  { reason }
//      (both should follow the same adminAuth pattern as
//      admin-bursary-providers.ts)
//
// Until that exists, this page runs entirely on local mock state so the
// UI/UX can be reviewed and wired up in one pass once the API lands.

interface ApprovalRow {
  id: string
  universityName: string
  batchId: string
  studentCount: number
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected'
  fileName: string
  successfulRecords: number
  failedRecords: number
}

const MOCK_ROWS: ApprovalRow[] = [
  { id: '1', universityName: 'University of Nairobi', batchId: 'UON-2026-08-014', studentCount: 342, uploadedAt: '2026-08-21T09:12:00Z', status: 'pending', fileName: 'attachment_eligible_aug2026.csv', successfulRecords: 338, failedRecords: 4 },
  { id: '2', universityName: 'Kenyatta University', batchId: 'KU-2026-08-009', studentCount: 210, uploadedAt: '2026-08-20T14:03:00Z', status: 'pending', fileName: 'ku_eligibility_batch9.xlsx', successfulRecords: 210, failedRecords: 0 },
  { id: '3', universityName: 'Jomo Kenyatta University of Agriculture and Technology', batchId: 'JKUAT-2026-08-003', studentCount: 156, uploadedAt: '2026-08-19T11:47:00Z', status: 'approved', fileName: 'jkuat_batch3_final.csv', successfulRecords: 150, failedRecords: 6 },
  { id: '4', universityName: 'Moi University', batchId: 'MU-2026-08-007', studentCount: 98, uploadedAt: '2026-08-18T08:30:00Z', status: 'rejected', fileName: 'moi_students_batch7.csv', successfulRecords: 40, failedRecords: 58 },
  { id: '5', universityName: 'Egerton University', batchId: 'EU-2026-08-002', studentCount: 121, uploadedAt: '2026-08-17T16:20:00Z', status: 'pending', fileName: 'egerton_aug_eligibility.xlsx', successfulRecords: 121, failedRecords: 0 },
  { id: '6', universityName: 'Technical University of Kenya', batchId: 'TUK-2026-08-005', studentCount: 76, uploadedAt: '2026-08-16T10:05:00Z', status: 'approved', fileName: 'tuk_batch5.csv', successfulRecords: 76, failedRecords: 0 },
  { id: '7', universityName: 'Strathmore University', batchId: 'SU-2026-08-011', studentCount: 64, uploadedAt: '2026-08-15T13:40:00Z', status: 'pending', fileName: 'strathmore_students_2026.csv', successfulRecords: 61, failedRecords: 3 },
]

const TABS: { value: 'pending' | 'approved' | 'rejected' | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

const PAGE_SIZE = 5

export default function AdminApprovalsPage() {
  const [rows, setRows] = useState<ApprovalRow[]>(MOCK_ROWS)
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(
    () => (tab === 'all' ? rows : rows.filter((r) => r.status === tab)),
    [rows, tab]
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function setStatus(id: string, status: ApprovalRow['status']) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
  }

  function handleApprove(row: ApprovalRow) {
    if (!confirm(`Approve batch "${row.batchId}" (${row.studentCount} students) from ${row.universityName}?`)) return
    setStatus(row.id, 'approved')
    toast.success(`${row.batchId} approved (mock — no backend yet)`)
  }

  function handleReject(row: ApprovalRow) {
    if (!confirm(`Reject batch "${row.batchId}" from ${row.universityName}?`)) return
    setStatus(row.id, 'rejected')
    toast.success(`${row.batchId} rejected (mock — no backend yet)`)
  }

  return (
    <main className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
        <ClipboardCheck className="w-6 h-6 text-amber-600" />
        Approvals
      </h1>
      <p className="text-sm text-gray-500 mb-2">Review university-uploaded student eligibility batches.</p>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6 inline-block">
        Running on mock data — no backend API exists yet for <code>university_student_uploads</code>. See the top of this file for the exact endpoints and schema addition needed.
      </p>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setTab(t.value)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {pageRows.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No batches in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">University</th>
                  <th className="px-4 py-3 font-medium">Batch ID</th>
                  <th className="px-4 py-3 font-medium"># Students</th>
                  <th className="px-4 py-3 font-medium">Upload Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageRows.map((row) => (
                  <Fragment key={row.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {row.universityName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.batchId}</td>
                      <td className="px-4 py-3 text-gray-600">{row.studentCount}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(row.uploadedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : row.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                            aria-label="View details"
                          >
                            {expandedId === row.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {row.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(row)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(row)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === row.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">File Name</p>
                              <p className="text-gray-700">{row.fileName}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">Successful Records</p>
                              <p className="text-gray-700">{row.successfulRecords}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">Failed Records</p>
                              <p className="text-gray-700">{row.failedRecords}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">Batch ID</p>
                              <p className="text-gray-700">{row.batchId}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            Page {page} of {totalPages} ({filtered.length} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
