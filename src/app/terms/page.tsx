export const metadata = {
  title: "Terms of Service | ElimuX",
  description: "Terms and conditions for using ElimuX platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
        <p className="text-slate-600 mb-8">Last updated: July 23, 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 mb-4">
              By accessing or using ElimuX, you agree to be bound by these Terms of Service. 
              If you do not agree, please do not use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
            <p className="text-slate-600 mb-4">
              You must be at least 16 years old to use ElimuX. By using the platform, 
              you represent that you meet this requirement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-slate-600 mb-4">
              You are responsible for maintaining the confidentiality of your account 
              credentials and for all activities under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Platform Services</h2>
            <p className="text-slate-600 mb-4">
              ElimuX provides education discovery services. We do not guarantee admission 
              to any institution. All program information is provided by institutions and 
              may change without notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Payments</h2>
            <p className="text-slate-600 mb-4">
              All payments are processed securely through Paystack. Refund policies are 
              determined by individual institutions. ElimuX does not handle refunds directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Partner Program</h2>
            <p className="text-slate-600 mb-4">
              Partners must comply with our Partner Guidelines. Commission rates and 
              payout schedules are subject to change with 30 days notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-slate-600 mb-4">
              ElimuX is not liable for any decisions made based on information found on 
              our platform. Always verify details directly with institutions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
            <p className="text-slate-600">
              These terms are governed by the laws of Kenya. Any disputes shall be 
              resolved in the courts of Nairobi.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
