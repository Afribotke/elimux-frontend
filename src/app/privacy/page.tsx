export const metadata = {
  title: "Privacy Policy | ElimuX",
  description: "How ElimuX collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
        <p className="text-slate-600 mb-8">Last updated: July 23, 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-slate-600 mb-4">
              ElimuX (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
              when you use our platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mb-2">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 text-slate-600 mb-4">
              <li>Name and contact details (email, phone)</li>
              <li>Educational background and interests</li>
              <li>Location data (country, city)</li>
              <li>Payment information (processed securely via Paystack)</li>
            </ul>

            <h3 className="text-lg font-medium mb-2">2.2 Usage Data</h3>
            <ul className="list-disc pl-6 text-slate-600 mb-4">
              <li>Search queries and filters used</li>
              <li>Pages visited and time spent</li>
              <li>Device and browser information</li>
              <li>IP address and referral source</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-slate-600 mb-4">
              <li>Provide personalized education recommendations</li>
              <li>Process applications and payments</li>
              <li>Send relevant updates and notifications</li>
              <li>Improve our AI search and recommendations</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-slate-600 mb-4">
              Your data is stored securely using Supabase, which employs industry-standard encryption 
              at rest and in transit. We use Row Level Security (RLS) to ensure users can only access 
              their own data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Your Rights (GDPR)</h2>
            <p className="text-slate-600 mb-4">Under GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (&quot;Right to be Forgotten&quot;)</li>
              <li><strong>Portability:</strong> Receive your data in a structured format</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Restriction:</strong> Request limitation of processing</li>
            </ul>
            <p className="text-slate-600">
              To exercise these rights, contact us at privacy@elimux.ke or use the 
              <a href="/data-request" className="text-emerald-600 hover:underline"> Data Request Form</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
            <p className="text-slate-600 mb-4">
              We use cookies to enhance your experience. You can manage cookie preferences 
              through your browser settings. See our <a href="/cookies" className="text-emerald-600 hover:underline">Cookie Policy</a> for details.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
            <p className="text-slate-600 mb-4">We use the following third-party services:</p>
            <ul className="list-disc pl-6 text-slate-600 mb-4">
              <li><strong>Supabase:</strong> Database and authentication</li>
              <li><strong>Paystack:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Hosting and CDN</li>
              <li><strong>Anthropic:</strong> AI search assistance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p className="text-slate-600">
              For privacy-related inquiries, contact us at:<br />
              Email: privacy@elimux.ke<br />
              Address: Nairobi, Kenya
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
