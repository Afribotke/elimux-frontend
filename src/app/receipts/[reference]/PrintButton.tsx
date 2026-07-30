'use client'

import { Download } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 print:hidden"
    >
      <Download className="h-4 w-4" />
      Download PDF
    </button>
  )
}
