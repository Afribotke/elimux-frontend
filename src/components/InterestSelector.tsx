'use client'

import { useRouter } from 'next/navigation'
import { HeartPulse, Cpu, Briefcase, Cog, Scale, GraduationCap, Palette, FlaskConical } from 'lucide-react'

export interface Interest {
  id: string
  label: string
  icon: typeof HeartPulse
  categoryId: string
}

export const INTERESTS: Interest[] = [
  { id: 'medicine', label: 'Medicine & Health', icon: HeartPulse, categoryId: 'e3ad1136-0529-4a56-befe-f2cef3b54f54' },
  { id: 'tech', label: 'Technology', icon: Cpu, categoryId: '8bacfcaf-75ef-4486-b080-5e805b71f00a' },
  { id: 'business', label: 'Business', icon: Briefcase, categoryId: 'cbe38c0f-0066-4b0c-bab0-ee464630cf28' },
  { id: 'engineering', label: 'Engineering', icon: Cog, categoryId: '50594df3-1187-461b-bf79-6a28a2057f7e' },
  { id: 'law', label: 'Law', icon: Scale, categoryId: 'e41010c9-36fa-4670-a7dd-eb30f2f9d500' },
  { id: 'education', label: 'Education', icon: GraduationCap, categoryId: '68b64d3b-9a9b-4f3e-8afe-27570989f193' },
  { id: 'arts', label: 'Arts & Design', icon: Palette, categoryId: '95f8121d-8f2d-4b2a-be2f-edbb4a64aa74' },
  { id: 'science', label: 'Science', icon: FlaskConical, categoryId: '5280fc0a-aa9f-4e51-8861-d97caa067af4' },
]

export default function InterestSelector() {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {INTERESTS.map((interest) => {
        const Icon = interest.icon
        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => router.push(`/programs?category=${interest.categoryId}`)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 bg-elimux-card border border-border text-muted hover:border-primary-500/50 hover:text-foreground active:scale-95"
          >
            <Icon className="w-3.5 h-3.5" />
            {interest.label}
          </button>
        )
      })}
    </div>
  )
}
