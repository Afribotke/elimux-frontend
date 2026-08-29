'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Shield, FileText } from 'lucide-react';

export default function PathwaysHomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [isParent, setIsParent] = useState<boolean | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleAgeGate = (parent: boolean) => {
    setIsParent(parent);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    sessionStorage.setItem('pathways_dream', query);
    sessionStorage.setItem('pathways_consent', 'true');
    router.push('/pathways/wizard/');
  };

  const examples = [
    'I want to be a lawyer. Show me schools in Nairobi, Nakuru or Nandi.',
    'My daughter loves computers and art. What should she choose?',
    'We want a girls boarding school offering STEM in Kiambu.',
    'My son wants to be a pilot. What subjects does he need?',
  ];

  if (showAgeGate) {
    return (
      <div className="max-w-2xl mx-auto text-center pt-20">
        <h1 className="text-3xl font-bold mb-6">Welcome to ElimuX Pathways</h1>
        <p className="text-gray-600 mb-8">
          This tool helps Grade 9 learners and parents prepare for the KEMIS
          Grade 10 Selection &amp; Placement process.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Are you a parent/guardian or a learner?</h2>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleAgeGate(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              I am a Parent/Guardian
            </button>
            <button
              onClick={() => handleAgeGate(false)}
              className="px-8 py-4 border-2 border-gray-200 rounded-xl hover:border-gray-300"
            >
              I am a Learner
            </button>
          </div>
        </div>

        {isParent === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-800">
              <strong>Hello there!</strong> This tool is designed for parents and guardians
              to use together with their children. Please ask your parent, guardian, or teacher
              to help you with this process.
            </p>
          </div>
        )}

        {isParent === true && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h3 className="font-semibold mb-4">Parental Consent Required</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Under Kenya&apos;s Data Protection Act, we need your consent to process guidance data
              for your child. We collect only anonymized subject preferences and career interests.
              No personal identifiers are required.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                I confirm I am the parent/legal guardian and I consent to ElimuX processing
                anonymized pathway guidance data for my child. I understand I can delete this
                data at any time.
              </span>
            </label>
            <button
              onClick={() => setShowAgeGate(false)}
              disabled={!consentGiven}
              className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Continue to ElimuX Pathways
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto text-center pt-12 pb-16">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Your Perfect Pathway
        </h1>
        <p className="text-lg text-gray-600">
          Tell us your dream career. We will find the right subjects and schools —
          all checked against Ministry rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-12">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What does your child want to become?"
            className="w-full px-6 py-4 pr-32 text-lg border-2 border-blue-200 rounded-2xl focus:border-blue-500 focus:outline-none shadow-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Thinking...' : <><Search className="w-5 h-5" /> Go</>}
          </button>
        </div>
      </form>

      <div className="mb-16">
        <p className="text-sm text-gray-500 mb-3">Or try these examples:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setQuery(ex)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {ex.length > 50 ? ex.substring(0, 50) + '...' : ex}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-left">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <Sparkles className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Matching</h3>
          <p className="text-sm text-gray-600">
            Type your dream in plain English. Our AI maps it to the right pathway, subjects, and schools.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <Shield className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Ministry-Compliant</h3>
          <p className="text-sm text-gray-600">
            Every recommendation follows the official 8-school formula and KEMIS selection rules.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <FileText className="w-8 h-8 text-amber-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Printable Worksheet</h3>
          <p className="text-sm text-gray-600">
            Generate a Three-Way Comparison Worksheet for you, your parent, and your teacher.
          </p>
        </div>
      </div>
    </div>
  );
}
