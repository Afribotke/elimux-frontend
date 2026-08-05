export const metadata = {
  title: "Cookie Policy | ElimuX",
  description: "How ElimuX uses cookies and how you can manage your preferences.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: August 5, 2026</p>

        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Cookies are small text files stored on your device when you visit ElimuX. They help
              the platform function correctly and let us understand how it&apos;s used.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Cookies We Use</h2>
            <ul className="list-disc pl-6 text-muted-foreground mb-4">
              <li><strong>Essential:</strong> Required for core functionality like login sessions and security. These cannot be disabled.</li>
              <li><strong>Analytics:</strong> Help us understand how visitors use ElimuX so we can improve the platform.</li>
              <li><strong>Marketing:</strong> Used to measure the effectiveness of sponsored content and campaigns.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Managing Your Preferences</h2>
            <p className="text-muted-foreground mb-4">
              You can choose &quot;Essential Only&quot; or &quot;Accept All&quot; from the cookie
              banner shown on your first visit. You can also clear cookies at any time through your
              browser settings to be prompted again.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. More Information</h2>
            <p className="text-muted-foreground">
              For details on how we handle the data collected via cookies, see our{" "}
              <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>.
              For questions, contact us at privacy@elimux.ke.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
