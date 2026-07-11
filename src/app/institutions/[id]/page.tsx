import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProgramCard from '@/components/ProgramCard'
import DetailActions from '@/components/DetailActions'
import TrackPageView from '@/components/TrackPageView'
import { MapPin, Users, Globe, Star, CheckCircle, ArrowLeft, GraduationCap } from 'lucide-react'

export async function generateStaticParams() {
  // Supabase/PostgREST caps an unpaginated select at 1000 rows - with 8,968+
  // active institutions, a single unpaginated query silently truncated the
  // static path list, 404ing every institution past the first 1000. Page
  // through with .range() until a page comes back short.
  const pageSize = 1000
  const allIds: string[] = []
  let page = 0

  while (true) {
    const { data } = await supabase
      .from('institutions')
      .select('id')
      .eq('is_active', true)
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (!data || data.length === 0) break
    allIds.push(...data.map((institution) => institution.id))
    if (data.length < pageSize) break
    page++
  }

  // output: 'export' requires at least one static path per dynamic route;
  // fall back to a placeholder that correctly 404s when no institutions exist yet.
  if (allIds.length === 0) return [{ id: '_placeholder' }]
  return allIds.map((id) => ({ id }))
}

export default async function InstitutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: institution } = await supabase
    .from('institutions')
    .select('*, type:institution_types(name, icon), country:countries(name, flag_emoji)')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!institution) {
    notFound()
  }

  const { data: programs } = await supabase
    .from('programs')
    .select('*, category:program_categories(name, color, icon)')
    .eq('institution_id', id)
    .eq('is_active', true)
    .order('name')

  return (
    <main className="min-h-screen py-12 px-4">
      <TrackPageView eventType="page_view" metadata={{ path: `/institutions/${id}`, institution_id: id }} />
      <div className="max-w-4xl mx-auto">
        <Link
          href="/institutions"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Institutions
        </Link>

        <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {institution.logo_url ? (
                <img src={institution.logo_url} alt={institution.name} className="w-full h-full object-cover" decoding="async" />
              ) : (
                <Globe className="w-8 h-8 text-muted" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{institution.name}</h1>
                  {institution.is_verified && <CheckCircle className="w-6 h-6 text-success flex-shrink-0" />}
                </div>
                <DetailActions
                  itemId={institution.id}
                  itemType="institution"
                  name={institution.name}
                  description={institution.description}
                />
              </div>

              {institution.type && <p className="text-sm text-primary-400 mb-1">{institution.type.name}</p>}

              <p className="text-sm text-muted mb-4 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {institution.city || 'N/A'}
                {institution.country?.name && `, ${institution.country.name}`}
                {institution.country?.flag_emoji && ` ${institution.country.flag_emoji}`}
              </p>

              {institution.description && (
                <p className="text-muted leading-relaxed mb-4">{institution.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted">
                {institution.founded_year && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning" />
                    Est. {institution.founded_year}
                  </span>
                )}
                {institution.student_count && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-primary-400" />
                    {institution.student_count.toLocaleString()} students
                  </span>
                )}
                {institution.website_url && (
                  <a
                    href={institution.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary-400" />
          Programs ({programs?.length || 0})
        </h2>

        {programs && programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <Link key={program.id} href={`/programs/${program.id}/`}>
                <ProgramCard program={program} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted">No programs listed for this institution yet.</p>
        )}
      </div>
    </main>
  )
}
