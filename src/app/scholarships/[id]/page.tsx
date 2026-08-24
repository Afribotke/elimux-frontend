import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import ScholarshipFavoriteButton from '@/components/scholarships/ScholarshipFavoriteButton'
import ScholarshipApplyButton from '@/components/scholarships/ScholarshipApplyButton'
import ScholarshipCard from '@/components/scholarships/ScholarshipCard'
import ScholarshipAlertForm from '@/components/scholarships/ScholarshipAlertForm'
import BackButton from '@/components/BackButton'
import Breadcrumbs from '@/components/Breadcrumbs'
import { ShareButton } from '@/components/share'
import { generateShareMetadata } from '@/lib/share-metadata'
import { Calendar, Wallet, MapPin, ExternalLink, ClipboardList, Bell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params

  const { data: scholarship } = await supabase
    .from('scholarships')
    .select('title, description, provider, institution:institutions(logo_url)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!scholarship) {
    return { title: 'Scholarship Not Found', description: 'This scholarship could not be found on ElimuX.' }
  }

  const description = scholarship.description?.substring(0, 160) || `Apply for ${scholarship.title} on ElimuX.`
  const institution = Array.isArray(scholarship.institution) ? scholarship.institution[0] : scholarship.institution

  return generateShareMetadata({
    title: `${scholarship.title} — Apply on ElimuX`,
    description,
    url: `https://www.elimux.ke/scholarships/${id}`,
    image: institution?.logo_url || 'https://www.elimux.ke/og-scholarship.jpg',
    hashtags: ['ElimuX', 'Scholarship', 'Education'],
  })
}

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: scholarship } = await supabase
    .from('scholarships')
    .select('*, institution:institutions(id, name, city, logo_url), country:countries(id, name, flag_emoji), scholarship_provider:scholarship_providers!scholarships_provider_id_fkey(id, name, slug, logo_url, website, is_partner)')
    .eq('id', id)
    .eq('status', 'active')
    .single()

  if (!scholarship) {
    notFound()
  }

  const shareData = {
    title: `${scholarship.title} — Apply on ElimuX`,
    description: scholarship.description?.substring(0, 160) || `Apply for ${scholarship.title} on ElimuX.`,
    url: `https://www.elimux.ke/scholarships/${scholarship.id}`,
    image: scholarship.institution?.logo_url || 'https://www.elimux.ke/og-scholarship.jpg',
    hashtags: ['ElimuX', 'Scholarship', 'Education'],
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
        <BackButton fallbackHref="/scholarships" label="All Scholarships" className="mb-2" />
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Scholarships', href: '/scholarships' },
            { label: scholarship.title, href: `/scholarships/${scholarship.id}` },
          ]}
          className="px-0 mb-6"
        />

        <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            {scholarship.is_featured && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                Featured
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <ShareButton shareData={shareData} variant="icon-only" />
              <ScholarshipFavoriteButton scholarshipId={scholarship.id} />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{scholarship.title}</h1>
          <p className="text-primary-400 font-medium mb-4">{scholarship.provider}</p>

          {!scholarship.scholarship_provider?.is_partner && (
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-6">
              <p className="text-warning text-sm">
                ElimuX is an independent discovery platform and is not affiliated with{' '}
                {scholarship.scholarship_provider?.name || scholarship.provider}. Always verify deadlines and
                requirements on the official provider website before applying.
              </p>
            </div>
          )}

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

          {!scholarship.scholarship_provider?.is_partner && (
            <p className="text-sm text-muted mb-4">
              This scholarship is listed for discovery only. Apply directly through the official provider.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {scholarship.scholarship_provider?.is_partner && (
              <ScholarshipApplyButton scholarshipId={scholarship.id} />
            )}

            {scholarship.application_url && (
              <a
                href={scholarship.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                Visit Provider Website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
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
