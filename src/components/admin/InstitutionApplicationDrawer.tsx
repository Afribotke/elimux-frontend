'use client';

import { X, Mail, Phone, Globe, MapPin, Calendar, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { AdminInstitutionApplication, ProgramApplicationStatus } from '@/lib/api';

interface InstitutionApplicationDrawerProps {
  application: AdminInstitutionApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onApproveProgram: (id: string) => void;
  onRejectProgram: (id: string) => void;
  actioningId: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-elimux-warning/10 text-elimux-warning',
    approved: 'bg-elimux-success/10 text-elimux-success',
    rejected: 'bg-elimux-danger/10 text-elimux-danger',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}

function ProgramRow({
  program,
  onApprove,
  onReject,
  actioning,
}: {
  program: ProgramApplicationStatus;
  onApprove: () => void;
  onReject: () => void;
  actioning: boolean;
}) {
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{program.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {program.level || '—'}
            {program.duration_months ? ` · ${program.duration_months} months` : ''}
            {program.tuition_fees ? ` · ${program.currency || ''} ${program.tuition_fees.toLocaleString()}` : ''}
          </p>
        </div>
        <StatusBadge status={program.status} />
      </div>
      {program.status === 'pending' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onApprove}
            disabled={actioning}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-elimux-success/10 text-elimux-success hover:bg-elimux-success/20 disabled:opacity-50"
          >
            {actioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Approve
          </button>
          <button
            onClick={onReject}
            disabled={actioning}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-elimux-danger/10 text-elimux-danger hover:bg-elimux-danger/20 disabled:opacity-50"
          >
            {actioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} Reject
          </button>
        </div>
      )}
    </div>
  )
}

export function InstitutionApplicationDrawer({
  application,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onApproveProgram,
  onRejectProgram,
  actioningId,
}: InstitutionApplicationDrawerProps) {
  if (!isOpen || !application) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 z-50 h-screen w-full sm:w-96 bg-elimux-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Institution Application</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-elimux-dark">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-foreground">{application.name}</p>
              <StatusBadge status={application.status} />
            </div>
            {application.type?.name && <p className="text-sm text-muted mt-0.5">{application.type.name}</p>}
          </div>

          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-1.5 text-foreground">
              <Mail className="w-3.5 h-3.5 text-muted" /> {application.email}
            </p>
            {application.phone && (
              <p className="flex items-center gap-1.5 text-foreground">
                <Phone className="w-3.5 h-3.5 text-muted" /> {application.phone}
              </p>
            )}
            {application.website && (
              <p className="flex items-center gap-1.5 text-foreground">
                <Globe className="w-3.5 h-3.5 text-muted" /> {application.website}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-foreground">
              <MapPin className="w-3.5 h-3.5 text-muted" />
              {[application.city, application.country?.name].filter(Boolean).join(', ') || '—'}
            </p>
            <p className="flex items-center gap-1.5 text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted" /> Submitted {new Date(application.submitted_at).toLocaleDateString()}
            </p>
          </div>

          {application.description && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-foreground">{application.description}</p>
            </div>
          )}

          {application.admin_notes && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-1">Admin notes</p>
              <p className="text-sm text-foreground">{application.admin_notes}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-2">
              Programs ({application.programs.length})
            </p>
            {application.programs.length === 0 ? (
              <p className="text-sm text-muted">No programs submitted with this application.</p>
            ) : (
              <div className="space-y-2">
                {application.programs.map((p) => (
                  <ProgramRow
                    key={p.id}
                    program={p}
                    onApprove={() => onApproveProgram(p.id)}
                    onReject={() => onRejectProgram(p.id)}
                    actioning={actioningId === p.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {application.status === 'pending' && (
          <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
            <button
              onClick={() => onApprove(application.id)}
              disabled={actioningId === application.id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-elimux-success/10 text-elimux-success hover:bg-elimux-success/20 disabled:opacity-50"
            >
              {actioningId === application.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approve
            </button>
            <button
              onClick={() => onReject(application.id)}
              disabled={actioningId === application.id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-elimux-danger/10 text-elimux-danger hover:bg-elimux-danger/20 disabled:opacity-50"
            >
              {actioningId === application.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Reject
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
