import ComingSoonPage from '@/components/ComingSoonPage';

export const metadata = {
  title: 'Schools — Coming Soon | ElimuX',
  description: 'Kenyan school discovery is being updated with complete C1–C4 data.',
};

export default function SchoolsPage() {
  return (
    <ComingSoonPage
      title="Schools"
      description="We're integrating complete Kenyan school data (C1–C4) with verified county and constituency information. Coming back stronger soon."
    />
  );
}
