import { MapPin, Users, Globe, Star, CheckCircle } from 'lucide-react'
import AccreditationBadgeList from './AccreditationBadgeList'
import InstitutionLogo from './InstitutionLogo'

interface InstitutionCardProps {
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
    type?: { name: string; icon?: string | null } | null
    country?: { name: string; flag_emoji?: string | null } | null
    accreditations?: {
      accreditation_status: string
      body?: { name: string; code: string | null; logo_url: string | null } | null
    }[]
  }
}

export default function InstitutionCard({ institution }: InstitutionCardProps) {
  const accreditationBadges = (institution.accreditations || [])
    .filter((a) => a.accreditation_status === 'active' && a.body)
    .map((a) => ({ code: a.body!.code, name: a.body!.name, logo_url: a.body!.logo_url }))

  return (
    <div className="bg-elimux-card rounded-xl p-5 border border-border hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-lg bg-white border border-border flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
          <InstitutionLogo name={institution.name} logoUrl={institution.logo_url} websiteUrl={institution.website_url} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Verified */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-foreground truncate">
              {institution.name}
            </h3>
            {institution.is_verified && (
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
            )}
          </div>

          {/* Type */}
          {institution.type && (
            <p className="text-sm text-primary-400 mb-1">
              {institution.type.name}
            </p>
          )}

          {/* Accreditation badges */}
          {accreditationBadges.length > 0 && (
            <div className="mb-2">
              <AccreditationBadgeList accreditations={accreditationBadges} />
            </div>
          )}

          {/* Location */}
          <p className="text-sm text-muted mb-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {institution.city || 'N/A'}
            {institution.country?.name && `, ${institution.country.name}`}
            {institution.country?.flag_emoji && ` ${institution.country.flag_emoji}`}
          </p>

          {/* Description */}
          {institution.description && (
            <p className="text-sm text-muted mb-3 line-clamp-2">
              {institution.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-3 text-sm text-muted">
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
              <span
                role="link"
                tabIndex={0}
                className="flex items-center gap-1 text-primary-400 hover:text-primary-300 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.open(institution.website_url!, '_blank', 'noopener,noreferrer')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(institution.website_url!, '_blank', 'noopener,noreferrer')
                  }
                }}
              >
                <Globe className="w-4 h-4" />
                Website
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
