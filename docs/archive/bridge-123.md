# ELIMUX CAREER PATHWAYS AI — PHASE 2: AI ENGINE + SCHOOL MATCHING
## Bridge Spec for Claude Code Execution
### Cycle: Pathways-002 | Status: Ready for Build

---

## 0. RULES (Non-Negotiable)

- Use `@/lib/supabase/server` helper (the project's existing pattern), NOT `@supabase/auth-helpers-nextjs`
- All Supabase queries MUST include `.schema('pathways')`
- All new files go in `src/app/pathways/` or `src/app/api/`
- `npm run build` must pass with ZERO errors before reporting completion
- Do NOT modify any existing ElimuX files outside the pathways module
- Do NOT commit or push — stage only, wait for explicit "commit and push" instruction

---

## 1. WHAT PHASE 2 BUILDS

Phase 2 adds the brain of the system:

1. **Career Interpreter** — Natural language → career → pathway → track
2. **KJSA Analyzer** — Manual grades → pathway eligibility → combination ranking
3. **School Matcher** — Filter 9,000+ schools by county, gender, accommodation, category
4. **Rule Enforcer** — Validate 8-school formula (3-2-2-1) and Consistency Rule

---

## 2. CAREER INTERPRETER API

### 2.1 Create: `src/app/api/pathways/interpret/route.ts`

This API takes natural language input and returns the matched career, pathway, and track.

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { query } = body;

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Query string required' }, { status: 400 });
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Step 1: Search career mappings
  const { data: careers, error: careerError } = await supabase
    .schema('pathways')
    .from('career_mappings')
    .select('*, pathways(*), tracks(*)')
    .eq('is_verified', true)
    .or(`career_name.ilike.%${normalizedQuery}%,career_aliases.cs.{${normalizedQuery}}`)
    .limit(10);

  if (careerError) {
    return NextResponse.json({ error: careerError.message }, { status: 500 });
  }

  // Step 2: If no direct match, do keyword matching
  let matchedCareer = careers?.[0];

  if (!matchedCareer) {
    // Keyword-based fallback
    const keywordMap: Record<string, { career: string; pathway: string; track: string }> = {
      'lawyer': { career: 'Lawyer', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
      'doctor': { career: 'Doctor', pathway: 'STEM', track: 'PURE_SCIENCES' },
      'engineer': { career: 'Civil Engineer', pathway: 'STEM', track: 'PURE_SCIENCES' },
      'pilot': { career: 'Pilot', pathway: 'STEM', track: 'PURE_SCIENCES' },
      'nurse': { career: 'Nurse', pathway: 'STEM', track: 'PURE_SCIENCES' },
      'teacher': { career: 'Teacher', pathway: 'SOCIAL_SCIENCES', track: 'LANGUAGES_LITERATURE' },
      'accountant': { career: 'Accountant', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
      'journalist': { career: 'Journalist', pathway: 'SOCIAL_SCIENCES', track: 'LANGUAGES_LITERATURE' },
      'software': { career: 'Software Engineer', pathway: 'STEM', track: 'PURE_SCIENCES' },
      'programmer': { career: 'Software Engineer', pathway: 'STEM', track: 'PURE_SCIENCES' },
      'artist': { career: 'Graphic Designer', pathway: 'ARTS_SPORTS', track: 'ARTS' },
      'musician': { career: 'Musician', pathway: 'ARTS_SPORTS', track: 'ARTS' },
      'actor': { career: 'Actor', pathway: 'ARTS_SPORTS', track: 'ARTS' },
      'athlete': { career: 'Professional Athlete', pathway: 'ARTS_SPORTS', track: 'SPORTS_RECREATION' },
      'chef': { career: 'Chef', pathway: 'STEM', track: 'APPLIED_SCIENCES' },
      'hotel': { career: 'Hotel Manager', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
      'police': { career: 'Police Officer', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
      'business': { career: 'Entrepreneur', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
      'farmer': { career: 'Agricultural Officer', pathway: 'STEM', track: 'APPLIED_SCIENCES' },
      'electrician': { career: 'Electrician', pathway: 'STEM', track: 'APPLIED_SCIENCES' },
    };

    for (const [keyword, mapping] of Object.entries(keywordMap)) {
      if (normalizedQuery.includes(keyword)) {
        const { data: pathwayData } = await supabase
          .schema('pathways')
          .from('pathways')
          .select('id, code, name')
          .eq('code', mapping.pathway)
          .single();

        const { data: trackData } = await supabase
          .schema('pathways')
          .from('tracks')
          .select('id, code, name')
          .eq('code', mapping.track)
          .single();

        matchedCareer = {
          career_name: mapping.career,
          pathway_id: pathwayData?.id,
          track_id: trackData?.id,
          pathways: pathwayData,
          tracks: trackData,
          description: `AI-matched career based on keyword "${keyword}"`,
        };
        break;
      }
    }
  }

  if (!matchedCareer) {
    return NextResponse.json({
      career: null,
      pathway: null,
      track: null,
      confidence: 0,
      message: 'No matching career found. Try being more specific (e.g., "I want to be a lawyer").',
    });
  }

  // Step 3: Get top 3 combinations for this track
  const { data: combinations, error: comboError } = await supabase
    .schema('pathways')
    .from('subject_combinations')
    .select('*')
    .eq('track_id', matchedCareer.track_id)
    .eq('is_active', true)
    .limit(3);

  if (comboError) {
    return NextResponse.json({ error: comboError.message }, { status: 500 });
  }

  return NextResponse.json({
    career: {
      name: matchedCareer.career_name,
      description: matchedCareer.description,
    },
    pathway: matchedCareer.pathways,
    track: matchedCareer.tracks,
    combinations: combinations || [],
    confidence: matchedCareer.career_name ? 0.9 : 0.5,
    message: `Based on your interest, we recommend the ${matchedCareer.pathways?.name} pathway with a focus on ${matchedCareer.tracks?.name}.`,
  });
}
3. KJSA ANALYZER API
3.1 Create: src/app/api/kjsa/analyze/route.ts
This API takes manually entered KJSA results and returns pathway eligibility + ranked combinations.
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface KJSAResult {
  subject: string;
  level: 'EE' | 'ME' | 'AE' | 'BE';
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { results, target_pathway_id } = body;

  if (!results || !Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ error: 'KJSA results array required' }, { status: 400 });
  }

  const levelValue: Record<string, number> = { EE: 4, ME: 3, AE: 2, BE: 1 };

  // Step 1: Get all pathways and their requirements
  const { data: pathways, error: pathwayError } = await supabase
    .schema('pathways')
    .from('pathways')
    .select('*, tracks(*), pathway_kjsa_requirements(*)');

  if (pathwayError) {
    return NextResponse.json({ error: pathwayError.message }, { status: 500 });
  }

  // Step 2: Analyze each pathway
  const analysis = pathways?.map((pathway) => {
    const requirements = pathway.pathway_kjsa_requirements || [];
    let totalScore = 0;
    let maxScore = 0;
    let criticalMet = 0;
    let criticalTotal = 0;
    const subjectChecks = [];

    for (const req of requirements) {
      const result = results.find((r: KJSAResult) => 
        r.subject.toLowerCase() === req.subject.toLowerCase()
      );
      const actualLevel = result ? levelValue[result.level] || 0 : 0;
      const requiredLevel = levelValue[req.minimum_level] || 0;
      const meets = actualLevel >= requiredLevel;
      const weightedScore = meets ? (actualLevel * (req.weight || 1)) : 0;

      totalScore += weightedScore;
      maxScore += 4 * (req.weight || 1);

      if (req.is_critical) {
        criticalTotal++;
        if (meets) criticalMet++;
      }

      subjectChecks.push({
        subject: req.subject,
        required: req.minimum_level,
        actual: result?.level || 'N/A',
        meets,
        is_critical: req.is_critical,
      });
    }

    const fitPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const criticalPassRate = criticalTotal > 0 ? Math.round((criticalMet / criticalTotal) * 100) : 100;

    return {
      pathway,
      fit_percentage: fitPercentage,
      critical_pass_rate: criticalPassRate,
      eligible: criticalPassRate >= 50,
      confidence: fitPercentage >= 75 ? 'high' : fitPercentage >= 50 ? 'medium' : 'low',
      subject_checks: subjectChecks,
    };
  });

  // Step 3: Sort by fit percentage
  const sortedAnalysis = analysis?.sort((a, b) => b.fit_percentage - a.fit_percentage) || [];

  // Step 4: If target pathway specified, get combinations for it
  let recommendedCombinations = [];
  if (target_pathway_id) {
    const { data: combos } = await supabase
      .schema('pathways')
      .from('subject_combinations')
      .select('*, tracks(pathway_id)')
      .eq('tracks.pathway_id', target_pathway_id)
      .eq('is_active', true)
      .limit(3);

    recommendedCombinations = combos || [];
  }

  return NextResponse.json({
    analysis: sortedAnalysis,
    top_pathway: sortedAnalysis[0]?.pathway || null,
    recommended_combinations: recommendedCombinations,
    strongest_subjects: results
      .filter((r: KJSAResult) => levelValue[r.level] >= 3)
      .map((r: KJSAResult) => r.subject),
    weakest_subjects: results
      .filter((r: KJSAResult) => levelValue[r.level] <= 2)
      .map((r: KJSAResult) => r.subject),
  });
}
4. SCHOOL MATCHER API
4.1 Create: src/app/api/schools/match/route.ts
This API filters schools by all criteria and enforces the 8-school formula.
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const county = searchParams.get('county');
  const counties = searchParams.get('counties')?.split(',') || [];
  const category = searchParams.get('category');
  const gender = searchParams.get('gender');
  const accommodation = searchParams.get('accommodation');
  const pathway = searchParams.get('pathway');

  let query = supabase
    .schema('pathways')
    .from('schools')
    .select('*')
    .eq('is_active', true);

  // Filter by county(s)
  if (counties.length > 0) {
    query = query.in('county', counties);
  } else if (county) {
    query = query.eq('county', county);
  }

  if (category) query = query.eq('category', category);
  if (gender) query = query.eq('gender', gender);
  if (accommodation) query = query.eq('accommodation', accommodation);
  if (pathway) query = query.contains('pathways', [pathway]);

  const { data, error } = await query.order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by category for the 8-school formula display
  const grouped = {
    C1: data?.filter((s: any) => s.category === 'C1') || [],
    C2: data?.filter((s: any) => s.category === 'C2') || [],
    C3: data?.filter((s: any) => s.category === 'C3') || [],
    C4: data?.filter((s: any) => s.category === 'C4') || [],
  };

  return NextResponse.json({
    schools: data || [],
    total: data?.length || 0,
    grouped,
    formula: {
      C1: { required: 3, found: grouped.C1.length },
      C2: { required: 2, found: grouped.C2.length },
      C3: { required: 2, found: grouped.C3.length },
      C4: { required: 1, found: grouped.C4.length },
    },
  });
}
5. RULE VALIDATOR API
5.1 Create: src/app/api/guidance/validate/route.ts
This API validates that a user's school selection follows Ministry rules.
TypeScript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { schools, combinations, is_sne } = body;

  const errors: string[] = [];
  const warnings: string[] = [];

  // SNE Mode: 4 schools, all C1
  if (is_sne) {
    if (schools.length !== 4) {
      errors.push(`SNE learners must select exactly 4 schools (you have ${schools.length})`);
    }
    const nonC1 = schools.filter((s: any) => s.category !== 'C1');
    if (nonC1.length > 0) {
      errors.push(`All 4 SNE schools must be from C1 category (${nonC1.length} are not)`);
    }
  } else {
    // Regular mode: 8 schools, 3-2-2-1 formula
    if (schools.length !== 8) {
      errors.push(`You must select exactly 8 schools (you have ${schools.length})`);
    }

    const c1Count = schools.filter((s: any) => s.category === 'C1').length;
    const c2Count = schools.filter((s: any) => s.category === 'C2').length;
    const c3Count = schools.filter((s: any) => s.category === 'C3').length;
    const c4Count = schools.filter((s: any) => s.category === 'C4').length;

    if (c1Count !== 3) errors.push(`C1: You must select exactly 3 schools (you have ${c1Count})`);
    if (c2Count !== 2) errors.push(`C2: You must select exactly 2 schools (you have ${c2Count})`);
    if (c3Count !== 2) errors.push(`C3: You must select exactly 2 schools (you have ${c3Count})`);
    if (c4Count !== 1) errors.push(`C4: You must select exactly 1 day school (you have ${c4Count})`);

    // C4 must be day school
    const c4School = schools.find((s: any) => s.category === 'C4');
    if (c4School && c4School.accommodation !== 'day') {
      errors.push(`C4: Your C4 school must be a DAY school (not ${c4School.accommodation})`);
    }

    // Consistency Rule: all combinations in same pathway
    if (combinations && combinations.length > 0) {
      const primaryPathway = combinations[0]?.pathway_id;
      const inconsistent = combinations.filter((c: any) => c.pathway_id !== primaryPathway);
      if (inconsistent.length > 0) {
        errors.push(`Consistency Rule: All combinations must be in the same pathway (${inconsistent.length} are not)`);
      }
    }
  }

  return NextResponse.json({
    valid: errors.length === 0,
    errors,
    warnings,
    summary: errors.length === 0 
      ? '✅ Your selection meets all Ministry requirements.' 
      : `❌ ${errors.length} issue(s) found. Please fix before submitting to KEMIS.`,
  });
}
6. UPDATE FRONTEND PAGES
6.1 Update: src/app/pathways/wizard/page.tsx
Replace the existing wizard with this version that calls the real APIs.
TypeScript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';

type WizardStep = 'dream' | 'location' | 'preferences' | 'kjsa' | 'results';

export default function PathwaysWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('dream');
  const [dream, setDream] = useState('');
  const [counties, setCounties] = useState<string[]>([]);
  const [homeSubCounty, setHomeSubCounty] = useState('');
  const [gender, setGender] = useState('');
  const [accommodation, setAccommodation] = useState('');
  const [kjsaResults, setKjsaResults] = useState<Array<{subject: string, level: string}>>([]);
  const [interpretation, setInterpretation] = useState<any>(null);
  const [kjsaAnalysis, setKjsaAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('pathways_dream');
    if (saved) setDream(saved);
  }, []);

  const steps = [
    { key: 'dream', label: 'Your Dream' },
    { key: 'location', label: 'Location' },
    { key: 'preferences', label: 'Preferences' },
    { key: 'kjsa', label: 'KJSA Results' },
    { key: 'results', label: 'Results' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const handleNext = async () => {
    if (step === 'dream' && dream.trim()) {
      // Call career interpreter API
      setLoading(true);
      try {
        const res = await fetch('/api/pathways/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: dream }),
        });
        const data = await res.json();
        setInterpretation(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }

    if (step === 'kjsa' && kjsaResults.length > 0) {
      // Call KJSA analyzer API
      setLoading(true);
      try {
        const res = await fetch('/api/kjsa/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            results: kjsaResults,
            target_pathway_id: interpretation?.pathway?.id 
          }),
        });
        const data = await res.json();
        setKjsaAnalysis(data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }

    const nextSteps: Record<WizardStep, WizardStep | null> = {
      dream: 'location',
      location: 'preferences',
      preferences: 'kjsa',
      kjsa: 'results',
      results: null,
    };
    const next = nextSteps[step];
    if (next) setStep(next);
    else router.push('/pathways/results');
  };

  const kenyanCounties = [
    'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
    'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
    'Tharaka-Nithi', 'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua',
    'Nyeri', 'Kirinyaga', 'Murang\'a', 'Kiambu', 'Turkana', 'West Pokot',
    'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi',
    'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Kericho',
    'Bomet', 'Kakamega', 'Vihiga', 'Bungoma', 'Busia', 'Siaya',
    'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Nairobi'
  ];

  const kjsaSubjects = [
    'Mathematics', 'English', 'Kiswahili', 'Integrated Science',
    'Social Studies', 'Creative Arts', 'Agriculture', 'Physical Education',
  ];

  const performanceLevels = ['EE', 'ME', 'AE', 'BE'];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i <= currentStepIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-12 h-1 mx-1 ${i < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        <div className="text-center font-medium text-gray-700">
          Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].label}
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-600">Analyzing...</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {step === 'dream' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">What does your child want to become?</h2>
            <textarea value={dream} onChange={(e) => setDream(e.target.value)} placeholder="e.g., I want to be a lawyer..." className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none" />
            {interpretation && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="font-medium text-blue-900">{interpretation.message}</p>
                <p className="text-sm text-blue-700 mt-1">Confidence: {Math.round((interpretation.confidence || 0) * 100)}%</p>
              </div>
            )}
          </div>
        )}

        {step === 'location' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Which counties?</h2>
            <div className="grid grid-cols-2 gap-2 mb-6 max-h-64 overflow-y-auto">
              {kenyanCounties.map(c => (
                <label key={c} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox" checked={counties.includes(c)} onChange={(e) => {
                    if (e.target.checked) setCounties([...counties, c]);
                    else setCounties(counties.filter(x => x !== c));
                  }} className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
            <input type="text" value={homeSubCounty} onChange={(e) => setHomeSubCounty(e.target.value)} placeholder="Home Sub-County (for C4 day school)" className="w-full p-3 border-2 border-gray-200 rounded-xl" />
          </div>
        )}

        {step === 'preferences' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">School Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Gender</label>
                <div className="flex gap-3">
                  {['boys', 'girls', 'mixed'].map(g => (
                    <button key={g} onClick={() => setGender(g)} className={`px-6 py-3 rounded-xl border-2 capitalize ${gender === g ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Accommodation</label>
                <div className="flex gap-3">
                  {['boarding', 'day', 'both'].map(a => (
                    <button key={a} onClick={() => setAccommodation(a)} className={`px-6 py-3 rounded-xl border-2 capitalize ${accommodation === a ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200'}`}>{a}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'kjsa' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">KJSA Results (Optional)</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800"><strong>⚠️ You are responsible for accuracy.</strong> ElimuX does not verify against KNEC.</p>
            </div>
            <div className="space-y-3">
              {kjsaSubjects.map((subj) => (
                <div key={subj} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{subj}</span>
                  <select className="p-2 border rounded-lg" onChange={(e) => {
                    const existing = kjsaResults.filter(r => r.subject !== subj);
                    if (e.target.value) setKjsaResults([...existing, { subject: subj, level: e.target.value }]);
                    else setKjsaResults(existing);
                  }}>
                    <option value="">Select...</option>
                    {performanceLevels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {kjsaAnalysis && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl">
                <p className="font-medium text-green-900">Top Pathway: {kjsaAnalysis.top_pathway?.name}</p>
                <p className="text-sm text-green-700">Fit: {kjsaAnalysis.analysis?.[0]?.fit_percentage}%</p>
              </div>
            )}
          </div>
        )}

        {step === 'results' && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Your Recommendations</h2>
            {interpretation && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-bold text-blue-900">Career: {interpretation.career?.name}</h3>
                  <p className="text-blue-700">Pathway: {interpretation.pathway?.name}</p>
                  <p className="text-blue-700">Track: {interpretation.track?.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Subject Combinations</h3>
                  {interpretation.combinations?.map((combo: any, i: number) => (
                    <div key={combo.id} className="p-3 border rounded-lg mb-2">
                      <span className="font-bold">{i + 1}. {combo.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={() => {
          const prev: Record<WizardStep, WizardStep | null> = { dream: null, location: 'dream', preferences: 'location', kjsa: 'preferences', results: 'kjsa' };
          const p = prev[step]; if (p) setStep(p);
        }} disabled={step === 'dream'} className="flex items-center gap-2 px-6 py-3 border-2 rounded-xl disabled:opacity-50"><ChevronLeft className="w-5 h-5" /> Back</button>
        <button onClick={handleNext} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50">
          {step === 'results' ? 'View Schools' : 'Next'} <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
7. BUILD VERIFICATION
After creating all files, run:
bash
npm run build
Must pass with exit code 0, zero errors.
Then test these URLs locally:
Table
URL	Expected Result
http://localhost:3000/api/pathways/interpret (POST {"query":"I want to be a lawyer"})	JSON with career, pathway, track, combinations
http://localhost:3000/api/kjsa/analyze (POST {"results":[{"subject":"Mathematics","level":"EE"}], "target_pathway_id":"..."})	JSON with pathway fit analysis
http://localhost:3000/api/schools/match?county=Nairobi&category=C1	JSON with filtered schools
http://localhost:3000/api/guidance/validate (POST {"schools":[...], "combinations":[...]})	JSON with valid true/false and errors array
http://localhost:3000/pathways/wizard	Wizard page with working Next/Back buttons
8. STOP HERE
Do NOT proceed to Phase 3 (PDF + Share) until the founder says "proceed."
Report back with:
Build pass/fail status
Any API errors encountered
Screenshot or description of wizard functionality
