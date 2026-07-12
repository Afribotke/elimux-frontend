import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ScholarshipFavoriteButton from '@/components/scholarships/ScholarshipFavoriteButton'
import ScholarshipCard from '@/components/scholarships/ScholarshipCard'
import ScholarshipAlertForm from '@/components/scholarships/ScholarshipAlertForm'
import { Calendar, Wallet, MapPin, ArrowLeft, ExternalLink, ClipboardList, Bell } from 'lucide-react'

export async function generateStaticParams() {
  // Same pagination fix as programs/[id] and institutions/[id]: PostgREST
  // caps an unpaginated select at 1000 rows.
  const pageSize = 1000
  const allIds: string[] = []
  let page = 0

  while (true) {
    const { data } = await supabase
      .from('scholarships')
      .select('id')
      .eq('status', 'active')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (!data || data.length === 0) break
    allIds.push(...data.map((s) => s.id))
    if (data.length < pageSize) break
    page++
  }

  // output: 'export' requires at least one static path per dynamic route.
  if (allIds.length === 0) return [{ id: '_placeholder' }]
  return allIds.map((id) => ({ id }))
}

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: scholarship } = await supabase
    .from('scholarships')
    .select('*, institution:institutions(id, name, city, logo_url), country:countries(id, name, flag_emoji)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!scholarship) {
    notFound()
  }

  let relatedQuery = supabase
    .from('scholarships')
    .select('*, institution:institutions(name), country:countries(name)')
    .eq('status', 'active')
    .neq('id', id)
    .limit(3)

  relatedQuery = scholarship.country_id
    ? relatedQuery.eq('country_id', scholarship.country_id)
    : relatedQuery.order('is_featured', { ascending: false })

  const { data: related } = await relatedQuery

  const daysLeft = Math.ceil((new Date(scholarship.application_deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/scholarships"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Scholarships
        </Link>

        <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            {scholarship.is_featured && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                Featured
              </div>
            )}
            <div className="ml-auto">
              <ScholarshipFavoriteButton scholarshipId={scholarship.id} />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{scholarship.title}</h1>
          <p className="text-primary-400 font-medium mb-6">{scholarship.provider}</p>

          <div className="flex flex-wrap gap-3 text-sm mb-6">
            {(scholarship.institution?.name || scholarship.country?.name) && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-elimux-dark text-muted">
                <MapPin className="w-4 h-4 text-primary-400" />
                {scholarship.institution?.name}
                {scholarship.institution?.name && scholarship.country?.name && ', '}
                {scholarship.country?.name}
              </span>
            )}
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-elimux-dark text-muted">
              <Calendar className="w-4 h-4 text-primary-400" />
              {daysLeft > 0 ? `${daysLeft} days left to apply` : 'Deadline passed'}
            </span>
            {scholarship.amount && (
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-elimux-dark text-muted">
                <Wallet className="w-4 h-4 text-success" />
                {scholarship.currency} {scholarship.amount}
                {scholarship.coverage_type && ` (${scholarship.coverage_type})`}
              </span>
            )}
          </div>

          {scholarship.description && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">About</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line">{scholarship.description}</p>
            </div>
          )}

          {scholarship.eligibility && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Eligibility</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line">{scholarship.eligibility}</p>
            </div>
          )}

          {scholarship.benefits && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2">Benefits</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line">{scholarship.benefits}</p>
            </div>
          )}

          {scholarship.required_documents && scholarship.required_documents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-primary-400" />
                Required Documents
              </h2>
              <ul className="list-disc list-inside text-muted space-y-1">
                {scholarship.required_documents.map((doc: string) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </div>
          )}

          {scholarship.application_url && (
            <a
              href={scholarship.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              Apply Now
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="mt-8 bg-elimux-card rounded-2xl p-6 md:p-8 border border-border">
          <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-400" />
            Get Alerted
          </h2>
          <p className="text-sm text-muted mb-5">
            Get notified by email when scholarships like this one are added.
          </p>
          <ScholarshipAlertForm defaultKeywords={scholarship.title} defaultCountryId={scholarship.country_id} />
        </div>

        {related && related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Related Scholarships</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {related.map((s) => (
                <Link key={s.id} href={`/scholarships/${s.id}/`}>
                  <ScholarshipCard scholarship={s} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
