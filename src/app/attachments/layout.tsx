import type { Metadata } from 'next';

// page.tsx in this route is a Client Component - metadata lives here instead.
export const metadata: Metadata = {
  title: 'Industrial Attachments — University Placements',
  description: 'Find industrial attachment placements arranged through your university. Hands-on experience with verified employers.',
  alternates: {
    canonical: 'https://www.elimux.ke/attachments/',
  },
};

export default function AttachmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
