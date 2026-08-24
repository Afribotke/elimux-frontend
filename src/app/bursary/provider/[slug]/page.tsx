import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Landmark, Mail, Phone, MapPin } from 'lucide-react'
import { fetchBursaryProvider, fetchBursaryProviderFunds } from '@/lib/api'

const TYPE_LABELS: Record<string, string> = {
  county: 'County Government',
  ngcdf: 'NG-CDF',
  ward: 'Ward Office',
  ngo: 'NGO',
  csr: 'Corporate CSR',
  foundation: 'Foundation',
  alumni: 'Alumni Association',
  school: 'School',
  individual: 'Individual',
}

export default async function BursaryProviderPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const provider = await fetchBursaryProvider(slug).catch(() => null)
  if (!provider) notFound()

  const { funds } = await fetchBursaryProviderFunds(slug).catch(() => ({ funds: [] }))

  const contact = (provider.contact || {}) as { email?: string; phone?: string; county?: string; sub_county?: string; ward?: string }

  return (
    <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          href="https://bursary.elimux.ke"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bursary Engine
        </Link>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-4">
          <Landmark className="w-4 h-4" />
          {TYPE_LABELS[provider.type] || provider.type}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{provider.name}</h1>
        <p className="text-muted mb-8">This is the portal for {provider.name}. Coming soon.</p>

        <div className="rounded-xl bg-elimux-card border border-border p-6 space-y-3 mb-10">
          {contact.email && (
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Mail className="w-4 h-4 text-muted shrink-0" />
              {contact.email}
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3 text-sm text-foreground">
              <Phone className="w-4 h-4 text-muted shrink-0" />
              {contact.phone}
            </div>
          )}
          {(contact.county || contact.sub_county || contact.ward) && (
            <div className="flex items-center gap-3 text-sm text-foreground">
              <MapPin className="w-4 h-4 text-muted shrink-0" />
              {[contact.ward, contact.sub_county, contact.county].filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4">Open Funds</h2>
        {funds.length === 0 ? (
          <p className="text-muted text-sm">No open funds yet.</p>
        ) : (
          <div className="space-y-3">
            {funds.map((fund) => (
              <div key={fund.id} className="rounded-xl bg-elimux-card border border-border p-4">
                <p className="font-medium text-foreground">{fund.name}</p>
                {fund.description && <p className="text-sm text-muted mt-1">{fund.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
