import type { Metadata } from 'next';

// page.tsx in this route is a Client Component - metadata lives here instead.
export const metadata: Metadata = {
  title: 'Find Scholarships — Fully Funded & Partial',
  description: 'Search scholarships for undergraduate, masters, and PhD studies. AI-powered matching based on your profile and grades.',
  alternates: {
    canonical: 'https://www.elimux.ke/scholarships/',
  },
};

export default function ScholarshipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
