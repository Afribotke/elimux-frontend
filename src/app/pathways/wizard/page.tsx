'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';

type WizardStep = 'dream' | 'location' | 'preferences' | 'kjsa' | 'results';

const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'dream', label: 'Your Dream' },
  { key: 'location', label: 'Location' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'kjsa', label: 'KJSA Results' },
  { key: 'results', label: 'Results' },
];

const NEXT_STEP: Record<WizardStep, WizardStep | null> = {
  dream: 'location',
  location: 'preferences',
  preferences: 'kjsa',
  kjsa: 'results',
  results: null,
};

const PREV_STEP: Record<WizardStep, WizardStep | null> = {
  dream: null,
  location: 'dream',
  preferences: 'location',
  kjsa: 'preferences',
  results: 'kjsa',
};

export default function PathwaysWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('dream');
  const [dream, setDream] = useState('');
  const [homeCounty, setHomeCounty] = useState('');
  const [homeSubCounty, setHomeSubCounty] = useState('');
  const [gender, setGender] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [kjsaResults, setKjsaResults] = useState<Array<{ subject: string; level: string }>>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem('pathways_dream');
    if (saved) setDream(saved);
  }, []);

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const handleNext = () => {
    const next = NEXT_STEP[step];
    if (next) setStep(next);
    else router.push('/pathways/results/');
  };

  const handleBack = () => {
    const prev = PREV_STEP[step];
    if (prev) setStep(prev);
    else router.push('/pathways/');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex-1 flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm min-h-[320px]">
        <h2 className="text-xl font-semibold mb-6">{STEPS[currentStepIndex].label}</h2>

        {step === 'dream' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What does your child want to become?
            </label>
            <input
              type="text"
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Doctor, Software Engineer, Lawyer..."
            />
          </div>
        )}

        {step === 'location' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Home County</label>
              <input
                type="text"
                value={homeCounty}
                onChange={(e) => setHomeCounty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Nairobi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-County</label>
              <input
                type="text"
                value={homeSubCounty}
                onChange={(e) => setHomeSubCounty(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Westlands"
              />
            </div>
          </div>
        )}

        {step === 'preferences' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gender of School</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                <option value="">No preference</option>
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation</label>
              <select
                value={accommodation}
                onChange={(e) => setAccommodation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
              >
                <option value="">No preference</option>
                <option value="boarding">Boarding</option>
                <option value="day">Day</option>
                <option value="boarding_and_day">Boarding &amp; Day</option>
              </select>
            </div>
          </div>
        )}

        {step === 'kjsa' && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Enter subject performance levels manually. No photo or PDF uploads — you enter the
              results yourself, as required under Kenya&apos;s Data Protection Act.
            </p>
            <p className="text-sm text-gray-500">
              {kjsaResults.length} subject{kjsaResults.length === 1 ? '' : 's'} entered so far.
            </p>
            <button
              type="button"
              onClick={() => setKjsaResults((prev) => [...prev, { subject: '', level: '' }])}
              className="mt-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-blue-300 hover:text-blue-700"
            >
              + Add a subject
            </button>
          </div>
        )}

        {step === 'results' && (
          <p className="text-gray-600">Preparing your pathway recommendations...</p>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-gray-300 flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          {step === 'results' ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
