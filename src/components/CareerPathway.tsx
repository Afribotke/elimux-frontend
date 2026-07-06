'use client'

import { useState } from 'react'
import { Target, ChevronRight } from 'lucide-react'

const CAREER_PATHS = [
  { id: 'doctor', label: 'Doctor', category: 'Medicine', description: 'Medical degree programs, typically 5-6 years' },
  { id: 'software-engineer', label: 'Software Engineer', category: 'Computer Science', description: 'Computer science or software engineering degrees' },
  { id: 'lawyer', label: 'Lawyer', category: 'Law', description: 'Law degree (LLB) plus bar admission' },
  { id: 'entrepreneur', label: 'Entrepreneur', category: 'Business', description: 'Business, finance, or management programs' },
  { id: 'civil-engineer', label: 'Civil Engineer', category: 'Engineering', description: 'Civil or structural engineering degrees' },
  { id: 'teacher', label: 'Teacher', category: 'Education', description: 'Education degrees with a teaching specialization' },
  { id: 'nurse', label: 'Nurse', category: 'Medicine', description: 'Nursing diploma or degree programs' },
  { id: 'graphic-designer', label: 'Graphic Designer', category: 'Arts & Design', description: 'Design, fine arts, or visual communication programs' },
]

interface CareerPathwayProps {
  onSelect: (careerLabel: string, category: string) => void
}

export default function CareerPathway({ onSelect }: CareerPathwayProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function handleSelect(path: (typeof CAREER_PATHS)[number]) {
    setSelectedId(path.id)
    onSelect(path.label, path.category)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <p className="text-center text-sm text-muted mb-4 flex items-center justify-center gap-2">
        <Target className="w-4 h-4 text-primary-400" />
        I want to become a...
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CAREER_PATHS.map((path) => (
          <button
            key={path.id}
            type="button"
            onClick={() => handleSelect(path)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedId === path.id
                ? 'bg-primary-500/10 border-primary-500 text-foreground'
                : 'bg-elimux-card border-border text-muted hover:border-primary-500/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{path.label}</span>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            </div>
            {selectedId === path.id && (
              <p className="text-xs text-muted mt-1">{path.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
