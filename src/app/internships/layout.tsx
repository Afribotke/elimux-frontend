import type { Metadata } from 'next';

// page.tsx in this route is a Client Component - metadata lives here instead.
export const metadata: Metadata = {
  title: 'Internship Opportunities — Apply Now',
  description: 'Find verified internship opportunities with top employers. AI-powered matching for students and recent graduates.',
  alternates: {
    canonical: 'https://www.elimux.ke/internships/',
  },
};

export default function InternshipsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
