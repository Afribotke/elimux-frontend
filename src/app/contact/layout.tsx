import type { Metadata } from 'next';

// page.tsx in this route is a Client Component - metadata lives here instead.
// title.absolute bypasses the root layout's "%s | ElimuX" template - this
// title already contains "ElimuX" once ("Contact ElimuX..."); the template
// would otherwise append a second, redundant "| ElimuX".
export const metadata: Metadata = {
  title: {
    absolute: 'Contact ElimuX — Get in Touch',
  },
  description: 'Contact the ElimuX team for partnerships, support, or inquiries. We help students discover education and career opportunities worldwide.',
  alternates: {
    canonical: 'https://www.elimux.ke/contact/',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
