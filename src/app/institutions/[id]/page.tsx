import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProgramCard from '@/components/ProgramCard'
import DetailActions from '@/components/DetailActions'
import TrackPageView from '@/components/TrackPageView'
import AccreditationStatusBadge from '@/components/AccreditationStatusBadge'
import BackButton from '@/components/BackButton'
import Breadcrumbs from '@/components/Breadcrumbs'
import { ReviewsSection } from '@/components/ReviewsSection'
import InstitutionLogo from '@/components/InstitutionLogo'
import { MapPin, Users, Globe, Star, CheckCircle, GraduationCap, ShieldCheck, FileText } from 'lucide-react'

interface InstitutionAccreditationJoinRow {
  id: string
  accreditation_number: string | null
  accreditation_status: string
  valid_from: string | null
  valid_until: string | null
  document_url: string | null
  body: { id: string; name: string; code: string | null; logo_url: string | null; body_type: string } | null
}

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

  const { data: accreditations } = await supabase
    .from('institution_accreditations')
    .select(
      'id, accreditation_number, accreditation_status, valid_from, valid_until, document_url, body:accreditation_bodies(id, name, code, logo_url, body_type)'
    )
    .eq('institution_id', id)
    .order('created_at', { ascending: false })
    .returns<InstitutionAccreditationJoinRow[]>()

  return (
    <main className="min-h-screen py-12 px-4">
      <TrackPageView eventType="page_view" metadata={{ path: `/institutions/${id}`, institution_id: id }} />
      <div className="max-w-4xl mx-auto">
        <BackButton fallbackHref="/institutions" label="All Institutions" className="mb-2" />
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Institutions', href: '/institutions' },
            { label: institution.name, href: `/institutions/${institution.id}` },
          ]}
          className="px-0 mb-6"
        />

        <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border mb-8">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden p-2">
              <InstitutionLogo name={institution.name} logoUrl={institution.logo_url} websiteUrl={institution.website_url} />
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

        {accreditations && accreditations.length > 0 && (
          <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
              Accreditation ({accreditations.length})
            </h2>

            <div className="space-y-3">
              {accreditations.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {a.body?.logo_url ? (
                      <img
                        src={a.body.logo_url}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <ShieldCheck className="w-9 h-9 text-muted flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{a.body?.name || 'Accreditation body'}</p>
                      {a.accreditation_number && (
                        <p className="text-xs text-muted">No. {a.accreditation_number}</p>
                      )}
                      {(a.valid_from || a.valid_until) && (
                        <p className="text-xs text-muted">
                          {a.valid_from ? new Date(a.valid_from).toLocaleDateString() : '—'}
                          {' – '}
                          {a.valid_until ? new Date(a.valid_until).toLocaleDateString() : 'Ongoing'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <AccreditationStatusBadge status={a.accreditation_status} />
                    {a.document_url && (
                      <a
                        href={a.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Document
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border mt-8">
          <ReviewsSection institutionId={institution.id} />
        </div>
      </div>
    </main>
  )
}
