import type { Metadata } from 'next';
import { generateShareMetadata } from '@/lib/share-metadata';
import SearchPageClient from './SearchPageClient';

// Split from the original single 'use client' file: generateMetadata needs
// searchParams (only available to a page-level export, not a layout, and
// not exportable from a 'use client' file at all) to produce a per-query
// share title/description - moving the interactive UI into its own client
// component lets this file be a plain async Server Component that owns
// generateMetadata correctly, rather than a static approximation that
// can't reflect the actual ?q= being shared.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q || '';

  return generateShareMetadata({
    title: query ? `Search: "${query}" on ElimuX` : 'Search Education Opportunities on ElimuX',
    description: query
      ? `Find scholarships, programs, and institutions matching "${query}" on ElimuX.`
      : 'Search for scholarships, courses, internships, and attachments across Africa.',
    url: `https://www.elimux.ke/search${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    image: 'https://www.elimux.ke/og-search.jpg',
    hashtags: ['ElimuX', 'Education'],
  });
}

export default function SearchPage() {
  return <SearchPageClient />;
}
