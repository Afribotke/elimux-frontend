import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ShieldCheck, Globe, ArrowRight } from 'lucide-react'

export const revalidate = 60

export default async function AccreditationBodiesPage() {
  const { data: bodies } = await supabase
    .from('accreditation_bodies')
    .select('*, country:countries(name, flag_emoji)')
    .eq('is_active', true)
    .order('name')

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-primary-400" />
        Accreditation Bodies
      </h1>
      <p className="text-muted mb-8">
        Regulators and quality-assurance bodies that accredit institutions on ElimuX
      </p>

      {bodies && bodies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bodies.map((body) => (
            <Link
              key={body.id}
              href={`/accreditation-bodies/${body.id}/`}
              className="group bg-elimux-card rounded-xl p-5 border border-border hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {body.logo_url ? (
                    <img src={body.logo_url} alt={body.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground truncate">{body.name}</h2>
                  {body.code && <p className="text-sm text-primary-400">{body.code}</p>}
                </div>
              </div>

              {body.description && <p className="text-sm text-muted mb-3 line-clamp-2">{body.description}</p>}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {body.country?.name ? `${body.country.name}${body.country.flag_emoji ? ' ' + body.country.flag_emoji : ''}` : body.body_type}
                </span>
                <span className="flex items-center gap-1 text-primary-400 group-hover:text-primary-300 transition-colors">
                  View institutions
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Globe className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-muted text-lg">No accreditation bodies available yet.</p>
        </div>
      )}
    </main>
  )
}
