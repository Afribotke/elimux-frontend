import type { Metadata } from 'next';

// page.tsx in this route is a Client Component ('use client', uses
// useSearchParams/useState) - Next.js requires metadata exports to live in
// a Server Component, so this sibling layout carries it instead.
export const metadata: Metadata = {
  title: 'Discover Programs — Universities & TVET',
  description: 'Explore 50,000+ programs from top universities and TVET institutions worldwide. Filter by country, level, category, and fees.',
  alternates: {
    canonical: 'https://www.elimux.ke/programs/',
  },
};

export default function ProgramsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
