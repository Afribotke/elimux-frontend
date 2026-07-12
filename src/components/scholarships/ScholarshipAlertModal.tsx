'use client'

import { X, Bell } from 'lucide-react'
import ScholarshipAlertForm from './ScholarshipAlertForm'

interface ScholarshipAlertModalProps {
  isOpen: boolean
  onClose: () => void
  defaultKeywords?: string
}

export default function ScholarshipAlertModal({ isOpen, onClose, defaultKeywords }: ScholarshipAlertModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-elimux-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-400" />
            Create Alert
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted mb-5">
          Get notified by email when new scholarships match your criteria.
        </p>

        <ScholarshipAlertForm defaultKeywords={defaultKeywords} />
      </div>
    </div>
  )
}
