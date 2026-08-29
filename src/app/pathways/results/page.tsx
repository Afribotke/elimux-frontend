'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

// Phase 1 shell: layout and navigation only. Recommendation logic,
// KJSA analysis, and school matching land in a later phase.
export default function PathwaysResultsPage() {
  return (
    <div className="max-w-3xl mx-auto text-center pt-8 pb-16">
      <FileText className="w-12 h-12 text-blue-600 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Results Are Coming Soon</h1>
      <p className="text-gray-600 mb-8">
        Pathway matching, subject combination recommendations, and school suggestions
        are part of a later build phase. This page is a placeholder shell for now.
      </p>
      <Link
        href="/pathways/wizard/"
        className="inline-block px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-gray-300"
      >
        Back to Guidance Wizard
      </Link>
    </div>
  );
}
