-- ============================================================
-- FIX 1: SEED SUBJECT COMBINATIONS
-- Table: pathways.subject_combinations
-- ============================================================

-- Clear any existing rows (idempotent)
TRUNCATE pathways.subject_combinations RESTART IDENTITY;

-- Social Sciences / Humanities & Business Studies
INSERT INTO pathways.subject_combinations (career_id, pathway_id, track_id, combination_name, subjects, rank, suitability_score, created_at) VALUES
((SELECT id FROM pathways.careers WHERE name = 'Lawyer'), (SELECT id FROM pathways.pathways WHERE name = 'Social Sciences'), (SELECT id FROM pathways.tracks WHERE name = 'Humanities & Business Studies'), 'Option A: History, Geography, CRE, Business Studies', ARRAY['History','Geography','Christian Religious Education','Business Studies'], 1, 95, now()),
((SELECT id FROM pathways.careers WHERE name = 'Lawyer'), (SELECT id FROM pathways.pathways WHERE name = 'Social Sciences'), (SELECT id FROM pathways.tracks WHERE name = 'Humanities & Business Studies'), 'Option B: History, Geography, CRE, Agriculture', ARRAY['History','Geography','Christian Religious Education','Agriculture'], 2, 88, now()),
((SELECT id FROM pathways.careers WHERE name = 'Lawyer'), (SELECT id FROM pathways.pathways WHERE name = 'Social Sciences'), (SELECT id FROM pathways.tracks WHERE name = 'Humanities & Business Studies'), 'Option C: History, Geography, Business Studies, Agriculture', ARRAY['History','Geography','Business Studies','Agriculture'], 3, 82, now()),
((SELECT id FROM pathways.careers WHERE name = 'Lawyer'), (SELECT id FROM pathways.pathways WHERE name = 'Social Sciences'), (SELECT id FROM pathways.tracks WHERE name = 'Humanities & Business Studies'), 'Option D: History, CRE, Business Studies, Mathematics', ARRAY['History','Christian Religious Education','Business Studies','Mathematics'], 4, 75, now());

-- STEM / Physical Sciences (example for Engineer career if it exists, else generic STEM)
INSERT INTO pathways.subject_combinations (career_id, pathway_id, track_id, combination_name, subjects, rank, suitability_score, created_at) VALUES
((SELECT id FROM pathways.careers WHERE name = 'Engineer' LIMIT 1), (SELECT id FROM pathways.pathways WHERE name = 'STEM'), (SELECT id FROM pathways.tracks WHERE name = 'Physical Sciences'), 'Option A: Mathematics, Physics, Chemistry, Biology', ARRAY['Mathematics','Physics','Chemistry','Biology'], 1, 98, now()),
((SELECT id FROM pathways.careers WHERE name = 'Engineer' LIMIT 1), (SELECT id FROM pathways.pathways WHERE name = 'STEM'), (SELECT id FROM pathways.tracks WHERE name = 'Physical Sciences'), 'Option B: Mathematics, Physics, Chemistry, Computer Studies', ARRAY['Mathematics','Physics','Chemistry','Computer Studies'], 2, 95, now()),
((SELECT id FROM pathways.careers WHERE name = 'Engineer' LIMIT 1), (SELECT id FROM pathways.pathways WHERE name = 'STEM'), (SELECT id FROM pathways.tracks WHERE name = 'Physical Sciences'), 'Option C: Mathematics, Physics, Biology, Agriculture', ARRAY['Mathematics','Physics','Biology','Agriculture'], 3, 88, now());

-- Arts & Sports (generic)
INSERT INTO pathways.subject_combinations (career_id, pathway_id, track_id, combination_name, subjects, rank, suitability_score, created_at) VALUES
((SELECT id FROM pathways.careers WHERE name = 'Musician' LIMIT 1), (SELECT id FROM pathways.pathways WHERE name = 'Arts & Sports'), (SELECT id FROM pathways.tracks WHERE name = 'Arts & Sports'), 'Option A: Music, Art & Design, Home Science, French', ARRAY['Music','Art and Design','Home Science','French'], 1, 92, now()),
((SELECT id FROM pathways.careers WHERE name = 'Musician' LIMIT 1), (SELECT id FROM pathways.pathways WHERE name = 'Arts & Sports'), (SELECT id FROM pathways.tracks WHERE name = 'Arts & Sports'), 'Option B: Art & Design, Music, Home Science, German', ARRAY['Art and Design','Music','Home Science','German'], 2, 85, now());

-- Verify
SELECT c.name AS career, p.name AS pathway, t.name AS track, sc.combination_name, sc.rank, sc.suitability_score
FROM pathways.subject_combinations sc
JOIN pathways.careers c ON sc.career_id = c.id
JOIN pathways.pathways p ON sc.pathway_id = p.id
JOIN pathways.tracks t ON sc.track_id = t.id
ORDER BY c.name, sc.rank;
After running: Confirm the verify query returns at least 3 ranked rows for the Lawyer career.
FIX 2: Wire KJSA response into Step 4.4 UI
File to edit: src/app/pathways/wizard/page.tsx
What to change: After the POST /api/kjsa/analyze call succeeds, BEFORE advancing to Step 5, render a green confirmation box showing the top pathway fit percentage and confidence. Only advance to Step 5 after the user clicks a "Continue to Results" button inside that box.
Exact integration point: Find the function/component handling Step 4 (KJSA step). Look for where fetch('/api/kjsa/analyze', ...) is called. After the JSON is received and validated, store the response in state and conditionally render the green box. Do NOT call setStep(5) immediately after the fetch resolves.
Here is the exact UI block to insert. Place this inside the Step 4 render section, conditionally shown when kjsaResult state is populated:
tsx
// ADD THIS STATE at the top of the wizard component (near other useState declarations):
// const [kjsaResult, setKjsaResult] = useState<{
//   topPathway: { name: string; fit_percentage: number; confidence: string };
//   allPathways: Array<{ name: string; fit_percentage: number; confidence: string }>;
// } | null>(null);

// ADD THIS inside the Step 4 render block, AFTER the KJSA form/questions
// but BEFORE the Next button (or replace the Next button when kjsaResult exists):

{kjsaResult && (
  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-green-900">Analysis Complete</h3>
        <p className="mt-1 text-sm text-green-700">
          Based on your KJSA responses, you have a strong fit for:
        </p>
        
        <div className="mt-4 rounded-lg bg-white p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-900">{kjsaResult.topPathway.name}</span>
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
              {kjsaResult.topPathway.fit_percentage}% fit
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Confidence:</span>
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
              kjsaResult.topPathway.confidence === 'high' 
                ? 'bg-green-100 text-green-800' 
                : kjsaResult.topPathway.confidence === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {kjsaResult.topPathway.confidence.charAt(0).toUpperCase() + kjsaResult.topPathway.confidence.slice(1)}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">All pathway fits:</p>
          {kjsaResult.allPathways.map((pw, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-md bg-white/60 px-3 py-2 text-sm">
              <span className="text-gray-700">{pw.name}</span>
              <div className="flex items-center gap-3">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className={`h-full rounded-full ${
                      pw.fit_percentage >= 70 ? 'bg-green-500' : pw.fit_percentage >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                    }`} 
                    style={{ width: `${pw.fit_percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right font-medium text-gray-900">{pw.fit_percentage}%</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep(5)}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Continue to Results
          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
)}
Logic change for the fetch handler: When the KJSA form submits, the fetch should:
Set loading state
POST to /api/kjsa/analyze
On 200: parse JSON, call setKjsaResult(parsed), STOP — do NOT advance step
On error: show error toast, keep user on Step 4
Only when kjsaResult is truthy does the green box render. Only clicking "Continue to Results" advances to Step 5.
FIX 3: Wire KJSA response into Step 4.5 (Results) UI
File to edit: src/app/pathways/results/page.tsx
What to change: The Results page currently receives career, pathway, and track correctly. It needs to also receive and display the KJSA fit_percentage and confidence. Additionally, it must gracefully handle the case where subject_combinations is empty (show a helpful message instead of a blank section).
Assumption: The Results page receives wizard state via URL query params, localStorage, or context. However the data flows, ensure fit_percentage and confidence are passed through and rendered.
Here are the three sections to add/modify in the Results page:
Section A — Add the Fit Score Card near the top of the results (below career/pathway/track header):
tsx
{/* ADD THIS BLOCK inside the results container, after the Career/Pathway/Track header info */}
{wizardData?.kjsaAnalysis && (
  <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-blue-700">Pathway Match Score</p>
        <p className="mt-1 text-2xl font-bold text-blue-900">
          {wizardData.kjsaAnalysis.fit_percentage}%
          <span className="ml-2 text-sm font-medium text-blue-700">
            ({wizardData.kjsaAnalysis.confidence === 'high' ? 'High' : wizardData.kjsaAnalysis.confidence === 'medium' ? 'Medium' : 'Low'} confidence)
          </span>
        </p>
      </div>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
    </div>
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-200">
      <div 
        className="h-full rounded-full bg-blue-600 transition-all duration-500" 
        style={{ width: `${wizardData.kjsaAnalysis.fit_percentage}%` }}
      />
    </div>
    <p className="mt-2 text-xs text-blue-600">
      This score is calculated from your KJSA (Kenya Junior Secondary Assessment) subject preferences and performance indicators.
    </p>
  </div>
)}
Section B — Update the Subject Combinations section to handle empty state gracefully:
Find the existing "Subject Combinations" section. Replace its render logic with:
tsx
{/* SUBJECT COMBINATIONS SECTION */}
<div className="mt-8">
  <h3 className="text-lg font-semibold text-gray-900">Subject Combinations</h3>
  <p className="mt-1 text-sm text-gray-500">
    Recommended KCSE subject groupings for this career, ranked by suitability.
  </p>
  
  {subjectCombinations && subjectCombinations.length > 0 ? (
    <div className="mt-4 space-y-3">
      {subjectCombinations.map((combo: any, idx: number) => (
        <div 
          key={combo.id || idx} 
          className={`rounded-lg border p-4 ${
            idx === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${
              idx === 0 ? 'text-green-900' : 'text-gray-900'
            }`}>
              {combo.combination_name}
              {idx === 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Best Match
                </span>
              )}
            </span>
            <span className="text-sm font-bold text-gray-700">{combo.suitability_score}%</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {combo.subjects?.map((subject: string, sidx: number) => (
              <span 
                key={sidx} 
                className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
              >
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
          <p className="text-sm font-medium text-amber-900">Subject combinations coming soon</p>
          <p className="mt-1 text-sm text-amber-700">
            We are curating the optimal subject combinations for this career. 
            In the meantime, consult your school career guidance counselor or 
            check the KICD guidelines for {pathwayName || 'this pathway'}.
          </p>
        </div>
      </div>
    </div>
  )}
</div>
Section C — Ensure kjsaAnalysis is passed from Wizard → Results:
However the wizard passes state to the Results page (URL params, localStorage, or React context), ensure these two fields are included:
TypeScript
interface KjsaAnalysisPayload {
  fit_percentage: number;
  confidence: 'high' | 'medium' | 'low';
  top_pathway_name: string;
}
If using localStorage, update the key where wizard data is stored to include kjsaAnalysis. If using query params, append &fit=88&confidence=high. If using context/provider, thread it through.
VERIFICATION CHECKLIST
After Claude applies all three fixes:
SQL Verification: Run the verify query at the bottom of Fix 1. Confirm at least 4 rows for Lawyer, 3 for Engineer, 2 for Musician.
Build: npm run build — must pass with zero TypeScript errors.
Step 4.4 Test: Walk through wizard to KJSA step. Submit answers. Confirm:
[ ] Green "Analysis Complete" box appears
[ ] Top pathway shows correct fit_percentage%
[ ] Confidence badge shows (High/Medium/Low)
[ ] "All pathway fits" mini-bar-chart renders for all 3 pathways
[ ] Clicking "Continue to Results" advances to Step 5
[ ] NO automatic advance before the green box is seen
Step 4.5 Test: On Results page, confirm:
[ ] "Pathway Match Score" card shows with percentage and confidence
[ ] Progress bar renders under the score
[ ] Subject Combinations section shows at least 3 ranked options for Lawyer
[ ] Each combination shows subject pills and suitability score
[ ] "Best Match" badge on rank 1
Edge Case: If you test a career with no seeded combinations (e.g., a career not in the seed list), confirm the amber "coming soon" message renders instead of a blank section.
Do NOT proceed to Phase 3 until all 5 items above are checked.
