'use client';

import { useEffect, useState, useCallback } from 'react';
import ShareResults from '@/components/pathways/ShareResults';
import { generatePathwayPDF, PathwayPDFData } from '@/lib/pathways-pdf';

interface Combination {
  name: string;
  subjects: string[];
  score?: number;
}

export default function PathwayResultsClient({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const [loading, setLoading] = useState(true);
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [error, setError] = useState<string | null>(null);

  // The server component (page.tsx) already awaits and passes searchParams
  // as a prop - no need for the useSearchParams() client hook here. That
  // hook requires a Suspense boundary to avoid bailing out of static
  // rendering (this codebase has hit that exact issue before on the login
  // page), and it would be redundant with the prop anyway.
  const career = (typeof searchParams.career === 'string' ? searchParams.career : '') || '';
  const pathway = (typeof searchParams.pathway === 'string' ? searchParams.pathway : '') || '';
  const track = (typeof searchParams.track === 'string' ? searchParams.track : '') || '';
  const fit = parseInt((typeof searchParams.fit === 'string' ? searchParams.fit : '') || '0');
  const confidence = (typeof searchParams.confidence === 'string' ? searchParams.confidence : '') || 'low';

  useEffect(() => {
    async function loadCombinations() {
      if (!career) {
        setLoading(false);
        return;
      }
      try {
        // The real endpoint is POST /api/pathways/interpret with a
        // { query } body - it re-derives career/pathway/track/combinations
        // from a free-text query, same as the wizard's own Step 1 call.
        // Passing the resolved career name back through it re-fetches the
        // same combinations without needing a second, career-name-lookup
        // endpoint that doesn't exist.
        const res = await fetch('/api/pathways/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: career }),
        });
        if (!res.ok) throw new Error('Failed to load career data');
        const data = await res.json();
        setCombinations(data.combinations || []);
      } catch (err) {
        setError('Could not load subject combinations. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCombinations();
  }, [career]);

  const handleDownloadPDF = useCallback(async () => {
    const pdfData: PathwayPDFData = {
      career,
      pathway,
      track,
      fitPercentage: fit,
      confidence,
      combinations,
      date: new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }),
    };

    try {
      const url = generatePathwayPDF(pdfData);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ElimuX-Pathway-${career.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again or use Print to PDF.');
    }
  }, [career, pathway, track, fit, confidence, combinations]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-gray-600">Loading your pathway...</p>
        </div>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900">No Results Found</h1>
          <p className="mt-2 text-gray-600">Complete the Career Pathway wizard to see your personalized recommendation.</p>
          <a href="/pathways/wizard" className="mt-4 inline-block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
            Start Wizard
          </a>
        </div>
      </div>
    );
  }

  const confidenceColor = confidence === 'high' ? 'text-green-700 bg-green-100' : confidence === 'medium' ? 'text-yellow-700 bg-yellow-100' : 'text-red-700 bg-red-100';
  const barColor = fit >= 70 ? 'bg-green-500' : fit >= 40 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl print:max-w-none">
        {/* Print header (hidden on screen) */}
        <div className="hidden print:block mb-6 pb-4 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-blue-900">ElimuX Career Pathway Report</h1>
          <p className="text-sm text-gray-500">www.elimux.ke | {new Date().toLocaleDateString('en-KE')}</p>
        </div>

        {/* Screen header (hidden on print) */}
        <div className="print:hidden mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Your Career Pathway</h1>
          <p className="mt-2 text-gray-600">Personalized recommendation based on your KJSA analysis</p>
        </div>

        {/* Main Results Card */}
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-lg print:shadow-none print:p-0 print:rounded-none">
          {/* Career / Pathway / Track */}
          <div className="border-b border-gray-100 pb-6 print:border-gray-300">
            <h2 className="text-2xl font-bold text-blue-900">{career}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">{pathway}</span>
              <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">{track}</span>
            </div>
          </div>

          {/* Match Score */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pathway Match Score</h3>
            <div className="mt-3 flex items-center gap-4">
              <div className="text-4xl font-bold text-blue-600">{fit}%</div>
              <div className="flex-1">
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                  <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${fit}%` }} />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${confidenceColor}`}>
                    {confidence} confidence
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              This score is calculated from your KJSA subject preferences and performance indicators.
            </p>
          </div>

          {/* Subject Combinations */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Subject Combinations</h3>
            <p className="mt-1 text-sm text-gray-500">Ranked KCSE subject groupings for this career pathway.</p>

            {error ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : combinations.length > 0 ? (
              <div className="mt-4 space-y-3">
                {combinations.map((combo, idx) => (
                  <div key={idx} className={`rounded-lg border p-4 ${idx === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{combo.name}</span>
                      <div className="flex items-center gap-2">
                        {idx === 0 && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Best Match</span>
                        )}
                        {combo.score && (
                          <span className="text-sm font-bold text-gray-700">{combo.score}%</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {combo.subjects.map((subject, sidx) => (
                        <span key={sidx} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-900">Subject combinations still being curated</p>
                    <p className="mt-1 text-sm text-amber-700">
                      We are expanding our database. Consult your school career guidance counselor for subject selection advice.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3 border-t border-gray-100 pt-6 print:hidden">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>

            <a
              href="/pathways/wizard"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retake Wizard
            </a>
          </div>
        </div>

        {/* Share Section */}
        <div className="print:hidden">
          <ShareResults career={career} pathway={pathway} fitPercentage={fit} />
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
          This report is generated by ElimuX based on KJSA analysis. Consult your school career guidance counselor for final subject selections. | www.elimux.ke
        </div>
      </div>
    </div>
  );
}
