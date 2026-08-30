'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

// Restored from the original committed version (git 06d651a, Cycle 047) after
// Cycle 051's pathway selector overwrote this route. The age-gate and Kenya
// Data Protection Act 2019 parental-consent copy below is verbatim from that
// commit - only the post-consent destination changed: the original routed to
// /pathways/wizard/ (now deprecated/Coming Soon) via a free-text "dream
// career" search feeding the old KJSA pipeline; that pipeline no longer
// exists, so consent now leads straight to /pathways/select, the new
// 8-pathway picker.
export default function PathwaysHomePage() {
  const router = useRouter();
  const [showAgeGate, setShowAgeGate] = useState(true);
  const [isParent, setIsParent] = useState<boolean | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleAgeGate = (parent: boolean) => {
    setIsParent(parent);
  };

  if (showAgeGate) {
    return (
      <div className="max-w-2xl mx-auto text-center pt-20 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Welcome to ElimuX Pathways</h1>
        <p className="text-gray-600 mb-8">
          This tool helps Grade 9 learners and parents prepare for the KEMIS
          Grade 10 Selection &amp; Placement process.
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Are you a parent/guardian or a learner?</h2>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleAgeGate(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              I am a Parent/Guardian
            </button>
            <button
              onClick={() => handleAgeGate(false)}
              className="px-8 py-4 border-2 border-gray-200 rounded-xl text-gray-900 hover:border-gray-300"
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
            <h3 className="font-semibold mb-4 text-gray-900">Parental Consent Required</h3>
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
    <div className="max-w-2xl mx-auto text-center pt-24 pb-16 px-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
        You&apos;re All Set
      </h1>
      <p className="text-lg text-gray-600 mb-10">
        Continue to pick a career pathway - we&apos;ll match it to real senior
        schools you can shortlist.
      </p>
      <button
        onClick={() => router.push('/pathways/select')}
        className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
      >
        Continue to Pathway Selection
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
