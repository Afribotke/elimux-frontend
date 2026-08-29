import { ReactNode } from 'react';
import Link from 'next/link';

export default function PathwaysLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* KEMIS Verification Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
        <span className="font-semibold">Verify on KEMIS:</span>{' '}
        This is a guidance tool only. Counter-confirm all information on{' '}
        <a
          href="https://selection-placement.kemis.go.ke"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium text-amber-900 hover:text-amber-950"
        >
          selection-placement.kemis.go.ke
        </a>{' '}
        before making final selections.
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/pathways/" className="text-xl font-bold text-blue-700">
            ElimuX Pathways
          </Link>
          <div className="flex gap-4 text-sm">
            <Link href="/pathways/" className="text-gray-600 hover:text-blue-700">Home</Link>
            <Link href="/pathways/wizard/" className="text-gray-600 hover:text-blue-700">Start Guidance</Link>
            <Link href="/" className="text-gray-600 hover:text-blue-700">Back to ElimuX</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer Disclaimer */}
      <footer className="bg-gray-100 border-t mt-12 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-2">
            ElimuX is a search accelerator, not an official Ministry platform.
          </p>
          <p>
            All school data from publicly available Ministry sources. Always verify on the official{' '}
            <a href="https://selection-placement.kemis.go.ke" className="underline text-blue-600">
              KEMIS portal
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
