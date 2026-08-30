'use client';

import Link from 'next/link';
import { MapPin, Users, Home } from 'lucide-react';
import type { SeniorSchool } from '@/lib/schools-data';
import { AddToShortlistButton } from '@/components/schools/add-to-shortlist-button';

const CLUSTER_COLOR: Record<string, string> = {
  C1: 'bg-green-100 text-green-800',
  C2: 'bg-blue-100 text-blue-800',
  C3: 'bg-amber-100 text-amber-800',
  C4: 'bg-gray-100 text-gray-700',
};

export function SchoolCard({ school }: { school: SeniorSchool }) {
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all">
      <div className="absolute top-4 right-4">
        <AddToShortlistButton schoolId={school.id} />
      </div>

      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${CLUSTER_COLOR[school.cluster_type]}`}>
        {school.cluster_type}
      </span>

      <Link href={`/schools/${school.id}`} className="block">
        <h3 className="font-bold text-gray-900 pr-8 hover:text-blue-700 transition-colors">{school.name}</h3>
      </Link>

      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{school.county}{school.sub_county ? `, ${school.sub_county}` : ''} — {school.region}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{school.gender}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{school.accommodation_type}</span>
        </div>
      </div>

      <Link
        href={`/schools/${school.id}`}
        className="mt-4 block text-center text-sm font-medium text-blue-700 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-colors"
      >
        View Details
      </Link>
    </div>
  );
}
