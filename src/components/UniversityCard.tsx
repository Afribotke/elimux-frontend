import Link from 'next/link';
import { Institution } from '@/types';

interface UniversityCardProps {
  university: Institution;
  variant?: 'default' | 'compact';
}

export default function UniversityCard({ university, variant = 'default' }: UniversityCardProps) {
  const isCompact = variant === 'compact';

  return (
    <Link href={`/university/${university.id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className={`flex ${isCompact ? 'p-4' : 'p-6'} items-start space-x-4`}>
          {/* Logo */}
          <div className="flex-shrink-0">
            {university.logo_url ? (
              <img
                src={university.logo_url}
                alt={university.name}
                className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} object-contain rounded-lg bg-gray-50`}
              />
            ) : (
              <div className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} bg-blue-100 rounded-lg flex items-center justify-center`}>
                <span className="text-blue-600 font-bold text-lg">
                  {university.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate ${isCompact ? 'text-sm' : 'text-lg'}`}>
              {university.name}
            </h3>
            <p className={`text-gray-500 ${isCompact ? 'text-xs' : 'text-sm'} mt-0.5`}>
              {university.city}{university.city && university.country ? ', ' : ''}{university.country}
            </p>

            {!isCompact && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  {university.type}
                </span>
                {university.accreditation && (
                  <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                    {university.accreditation}
                  </span>
                )}
                {university.rating > 0 && (
                  <span className="flex items-center px-2.5 py-1 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-full">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {university.rating.toFixed(1)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 text-gray-300 group-hover:text-blue-500 transition-colors">
            <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
