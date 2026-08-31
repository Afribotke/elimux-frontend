'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DtbAcademyWizard } from '@/components/financing/dtb/DtbAcademyWizard';
import { useAuth } from '@/hooks/useAuth';
import type { SeniorSchool } from '@/lib/schools-data';

function WizardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const schoolId = params.get('school') || '';
  const fee = Number(params.get('fee') || 85000);

  const [school, setSchool] = useState<SeniorSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!schoolId) { setNotFound(true); setLoading(false); return; }
    let cancelled = false;
    fetch(`/api/schools/${schoolId}`)
      .then(async (r) => {
        if (!r.ok) { if (!cancelled) setNotFound(true); return; }
        const json = await r.json();
        if (!cancelled) setSchool(json.data);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [schoolId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/login?redirect=/financing/dtb-academy?school=${schoolId}&fee=${fee}`);
    }
  }, [authLoading, user, router, schoolId, fee]);

  if (loading || authLoading || !user) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (notFound || !school) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-bold mb-2">School Not Found</h1>
      </div>
    );
  }

  return (
    <DtbAcademyWizard
      schoolId={school.id}
      schoolName={school.name}
      feeAmount={fee}
      userName={user.full_name || ''}
    />
  );
}

export default function DtbAcademyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-secondary">Loading...</div>}>
      <WizardContent />
    </Suspense>
  );
}
