export default function PathwaysComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Career Pathways</h1>
        <p className="mt-3 text-gray-600">
          We're aligning our recommendation engine with the official KEMIS Grade 10 selection framework.
          This feature will be available soon.
        </p>
        <div className="mt-6 space-y-3">
          <a
            href="https://selection-placement.kemis.go.ke/pathways"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            Visit Official KEMIS Portal
          </a>
          <a
            href="/"
            className="block w-full rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </a>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Expected launch: September 2026
        </p>
      </div>
    </div>
  );
}
