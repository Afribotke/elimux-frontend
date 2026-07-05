import { MapPin, Users, Globe, Star, CheckCircle } from 'lucide-react'

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
    type?: { name: string; icon: string | null } | null
    country?: { name: string; flag_emoji: string | null } | null
  }
}

export default function InstitutionCard({ institution }: InstitutionCardProps) {
  return (
    <div className="bg-elimux-card rounded-xl p-5 border border-gray-700/50 hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {institution.logo_url ? (
            <img
              src={institution.logo_url}
              alt={institution.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Globe className="w-8 h-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Verified */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">
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

          {/* Location */}
          <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {institution.city || 'N/A'}
            {institution.country?.name && `, ${institution.country.name}`}
            {institution.country?.flag_emoji && ` ${institution.country.flag_emoji}`}
          </p>

          {/* Description */}
          {institution.description && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {institution.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-3 text-sm text-gray-300">
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
  )
}
