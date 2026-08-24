import type { Metadata } from 'next';

// page.tsx in this route is a Client Component - metadata lives here instead.
export const metadata: Metadata = {
  title: 'Bursaries — Financial Aid for Students',
  description: 'Discover bursary opportunities to fund your education. Need-based and merit-based financial aid for students in Kenya and beyond.',
  alternates: {
    canonical: 'https://www.elimux.ke/bursary/',
  },
};

export default function BursaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
