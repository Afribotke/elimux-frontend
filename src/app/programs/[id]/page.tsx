import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DetailActions from '@/components/DetailActions'
import { Clock, DollarSign, MapPin, BookOpen, ArrowLeft, GraduationCap, ClipboardList } from 'lucide-react'

export async function generateStaticParams() {
  const { data } = await supabase.from('programs').select('id').eq('is_active', true)
  // output: 'export' requires at least one static path per dynamic route;
  // fall back to a placeholder that correctly 404s when no programs exist yet.
  if (!data || data.length === 0) return [{ id: '_placeholder' }]
  return data.map((program) => ({ id: program.id }))
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: program } = await supabase
    .from('programs')
    .select('*, institution:institutions(id, name, city, country:countries(name)), category:program_categories(name, color, icon)')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!program) {
    notFound()
  }

  const categoryColor = program.category?.color || '#FFC107'

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/programs"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Programs
        </Link>

        <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            {program.category && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
              >
                <BookOpen className="w-3 h-3" />
                {program.category.name}
              </div>
            )}
            <DetailActions
              itemId={program.id}
              itemType="program"
              name={program.name}
              description={program.description}
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{program.name}</h1>

          {program.institution && (
            <Link
              href={`/institutions/${program.institution.id}/`}
              className="text-sm text-primary-400 hover:text-primary-300 mb-6 flex items-center gap-1.5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              {program.institution.name}
              {program.institution.city && `, ${program.institution.city}`}
              {program.institution.country?.name && `, ${program.institution.country.name}`}
            </Link>
          )}

          <div className="flex flex-wrap gap-3 text-sm mb-6">
            {program.duration_months && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-elimux-dark text-muted">
                <Clock className="w-4 h-4 text-primary-400" />
                {program.duration_months} months
              </span>
            )}
            {program.tuition_fees && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-elimux-dark text-muted">
                <DollarSign className="w-4 h-4 text-success" />
                {program.currency || 'USD'} {program.tuition_fees.toLocaleString()}
              </span>
            )}
            {program.level && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-elimux-dark text-muted">
                <GraduationCap className="w-4 h-4 text-primary-400" />
                {program.level}
              </span>
            )}
            {program.mode && (
              <span className="px-3 py-1.5 rounded-lg bg-elimux-dark text-muted">{program.mode}</span>
            )}
          </div>

          {program.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">
                About this program
              </h2>
              <p className="text-muted leading-relaxed">{program.description}</p>
            </div>
          )}

          {program.requirements && (
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-primary-400" />
                Requirements
              </h2>
              <p className="text-muted leading-relaxed">{program.requirements}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
