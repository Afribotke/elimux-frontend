import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import InstitutionCard from '@/components/InstitutionCard'
import AccreditationStatusBadge from '@/components/AccreditationStatusBadge'
import { ArrowLeft, ShieldCheck, Globe, MapPin } from 'lucide-react'

interface AccreditedInstitutionLinkRow {
  id: string
  accreditation_status: string
  accreditation_number: string | null
  institution: {
    id: string
    name: string
    description: string | null
    city: string | null
    website_url: string | null
    logo_url: string | null
    is_verified: boolean
    founded_year: number | null
    student_count: number | null
    type: { name: string; icon: string | null } | null
    country: { name: string; flag_emoji: string | null } | null
  } | null
}

export async function generateStaticParams() {
  const { data } = await supabase.from('accreditation_bodies').select('id').eq('is_active', true)

  if (!data || data.length === 0) return [{ id: '_placeholder' }]
  return data.map((body) => ({ id: body.id }))
}

export default async function AccreditationBodyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: body } = await supabase
    .from('accreditation_bodies')
    .select('*, country:countries(name, flag_emoji)')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!body) {
    notFound()
  }

  const { data: links } = await supabase
    .from('institution_accreditations')
    .select(
      'id, accreditation_status, accreditation_number, institution:institutions(id, name, description, city, website_url, logo_url, is_verified, founded_year, student_count, type:institution_types(name, icon), country:countries(name, flag_emoji))'
    )
    .eq('body_id', id)
    .order('created_at', { ascending: false })
    .returns<AccreditedInstitutionLinkRow[]>()

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/accreditation-bodies"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Accreditation Bodies
        </Link>

        <div className="bg-elimux-card rounded-2xl p-6 md:p-8 border border-border mb-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {body.logo_url ? (
                <img src={body.logo_url} alt={body.name} className="w-full h-full object-cover" decoding="async" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-muted" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{body.name}</h1>
              {body.code && <p className="text-sm text-primary-400 mb-2">{body.code}</p>}

              <p className="text-sm text-muted mb-4 flex items-center gap-1 capitalize">
                <MapPin className="w-3.5 h-3.5" />
                {body.country?.name ? `${body.country.name}${body.country.flag_emoji ? ' ' + body.country.flag_emoji : ''}` : 'International'}
                {' · '}
                {body.body_type}
              </p>

              {body.description && <p className="text-muted leading-relaxed mb-4">{body.description}</p>}

              {body.website_url && (
                <a
                  href={body.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Official website
                </a>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary-400" />
          Accredited Institutions ({links?.length || 0})
        </h2>

        {links && links.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {links
              .filter((link) => link.institution)
              .map((link) => (
                <div key={link.id} className="space-y-2">
                  <Link href={`/institutions/${link.institution!.id}/`}>
                    <InstitutionCard institution={link.institution!} />
                  </Link>
                  <div className="flex items-center gap-2 px-1">
                    <AccreditationStatusBadge status={link.accreditation_status} />
                    {link.accreditation_number && (
                      <span className="text-xs text-muted">No. {link.accreditation_number}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-muted">No institutions accredited by this body yet.</p>
        )}
      </div>
    </main>
  )
}
