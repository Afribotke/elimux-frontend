'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, MapPin, Users, Home, ArrowLeft, Hash } from 'lucide-react';
import type { SeniorSchool } from '@/lib/schools-data';
import { AddToShortlistButton } from '@/components/schools/add-to-shortlist-button';

export default function SchoolDetailPage() {
  const params = useParams<{ id: string }>();
  const [school, setSchool] = useState<SeniorSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/schools/${params.id}`)
      .then(async (r) => {
        if (!r.ok) { if (!cancelled) setNotFound(true); return; }
        const json = await r.json();
        if (!cancelled) setSchool(json.data);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (notFound || !school) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">School Not Found</h1>
        <Link href="/schools" className="text-blue-600 hover:underline text-sm">Back to School Discovery</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/schools" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to School Discovery
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 mb-3">
              {school.cluster_type}
            </span>
            <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          </div>
          <AddToShortlistButton schoolId={school.id} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <MapPin className="w-4 h-4 text-gray-400" />
            {school.county}{school.sub_county ? `, ${school.sub_county}` : ''} — {school.region}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="w-4 h-4 text-gray-400" /> {school.gender}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Home className="w-4 h-4 text-gray-400" /> {school.accommodation_type} · {school.school_type}
          </div>
          {(school.knec_code || school.uic_code) && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Hash className="w-4 h-4 text-gray-400" />
              {school.knec_code ? `KNEC ${school.knec_code}` : ''}{school.knec_code && school.uic_code ? ' · ' : ''}{school.uic_code ? `UIC ${school.uic_code}` : ''}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-2">Next Steps</h2>
          <p className="text-sm text-gray-600 mb-4">
            Not sure if this school fits your goals? Take the Career Pathway Assessment to get schools matched to your interests.
          </p>
          <Link
            href="/pathways"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Take Career Pathway Assessment
          </Link>
        </div>
      </div>
    </div>
  );
}
