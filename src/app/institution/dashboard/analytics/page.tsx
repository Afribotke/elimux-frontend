'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/institution/dashboard/link-performance');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-gray-500">Redirecting to Link Performance...</p>
    </div>
  );
}
