# BRIDGE: TEST CAREER PATHWAYS PHASE 2 — END-TO-END LOCAL VERIFICATION
## Cycle: Pathways-Test-001 | Status: Execute Immediately
## Goal: Verify 100% accuracy before any deploy decision

---

## 0. RULES

- Do NOT commit anything
- Do NOT push anything
- Do NOT deploy anything to www.elimux.ke
- Do NOT modify any existing ElimuX files outside pathways module
- Build must pass with zero errors before testing begins
- Report every test result back to the founder using the template in Section 5
- If any test fails, STOP and report the exact error before proceeding

---

## 1. PRE-TEST CHECKLIST

Before running tests, confirm:

- [ ] Career Pathways files exist in working tree (uncommitted):
  - `src/app/pathways/layout.tsx`
  - `src/app/pathways/page.tsx`
  - `src/app/pathways/wizard/page.tsx`
  - `src/app/pathways/results/page.tsx`
  - `src/app/api/pathways/route.ts`
  - `src/app/api/pathways/interpret/route.ts`
  - `src/app/api/kjsa/route.ts`
  - `src/app/api/kjsa/analyze/route.ts`
  - `src/app/api/schools/route.ts`
  - `src/app/api/schools/match/route.ts`
  - `src/app/api/combinations/route.ts`
  - `src/app/api/careers/route.ts`
  - `src/app/api/guidance/validate/route.ts`

- [ ] Supabase database has `pathways` schema with 14 tables
- [ ] Seed data exists (3 pathways, 6 tracks, 39 subjects, 57 careers, 4 KJSA levels)
- [ ] RLS fix applied (`pathways.kjsa_performance_levels` and `pathways.pathway_kjsa_requirements` have SELECT policies)

---

## 2. BUILD AND SERVE

### Step 2.1: Build

Run in PowerShell:

```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
Expected: ✓ Compiled successfully with exit code 0.
If build fails: Paste the full error output. STOP. Do not proceed.
Step 2.2: Start Production Server
After build succeeds, run:
powershell
npm start
Expected: Ready on http://localhost:3000
Why production mode: npm run dev compiles routes on-demand and crashes with OOM on this machine (~330MB free RAM). npm start serves pre-built files and uses ~100MB RAM — safe and reliable.
Leave this PowerShell window open. Do not close it during testing.
3. API TESTS (Browser URL Bar)
Open your browser. Test these URLs one by one. You should see JSON text on each page.
Test 3.1: Pathways List
URL: http://localhost:3000/api/pathways
Expected: JSON showing 3 pathways:
JSON
{
  "pathways": [
    { "code": "STEM", "name": "STEM" },
    { "code": "SOCIAL_SCIENCES", "name": "Social Sciences" },
    { "code": "ARTS_SPORTS", "name": "Arts & Sports Science" }
  ]
}
Report: Shows 3 pathways? YES / NO
Test 3.2: Career Search
URL: http://localhost:3000/api/careers?q=lawyer
Expected: JSON with "Lawyer" as the first or top result.
Report: Shows "Lawyer" in results? YES / NO
Test 3.3: School Matcher
URL: http://localhost:3000/api/schools/match?county=Nairobi&category=C1
Expected: JSON with a schools array. May be empty if no schools seeded yet — that is OK. The API should respond, not error.
Report: API responds without error? YES / NO
Test 3.4: Career Interpreter (POST)
This API only accepts POST, not GET. Create this test page.
Create file: public/test-pathways.html
Paste this EXACT HTML:
HTML
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ElimuX Pathways API Test</title>
  <style>
    body { font-family: Arial; max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
    .box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    button { padding: 12px 24px; background: #2563EB; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
    .error { color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 6px; border-left: 4px solid #ef4444; }
    .success { color: #059669; background: #ecfdf5; padding: 12px; border-radius: 6px; border-left: 4px solid #059669; }
    input { padding: 10px; font-size: 16px; border: 2px solid #ddd; border-radius: 6px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>🧪 ElimuX Pathways API Test</h1>
  <div class="box">
    <h3>Test 1: Career Interpreter</h3>
    <input type="text" id="careerInput" value="I want to be a lawyer">
    <button onclick="testInterpret()">Test /api/pathways/interpret</button>
    <div id="interpretResult"></div>
  </div>
  <div class="box">
    <h3>Test 2: KJSA Analyzer</h3>
    <button onclick="testKJSA()">Test /api/kjsa/analyze</button>
    <div id="kjsaResult"></div>
  </div>
  <div class="box">
    <h3>Test 3: Rule Validator</h3>
    <button onclick="testValidate()">Test /api/guidance/validate</button>
    <div id="validateResult"></div>
  </div>
  <script>
    const BASE = "http://localhost:3000";
    async function testInterpret() {
      const d = document.getElementById("interpretResult");
      const q = document.getElementById("careerInput").value;
      d.innerHTML = "<p style='color:#666;font-style:italic'>Loading...</p>";
      try {
        const r = await fetch(`${BASE}/api/pathways/interpret`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
        const data = await r.json();
        d.innerHTML = r.ok ? `<div class="success">✅ SUCCESS (HTTP ${r.status})</div><pre>${JSON.stringify(data, null, 2)}</pre>` : `<div class="error">❌ FAILED (HTTP ${r.status})</div><pre>${JSON.stringify(data, null, 2)}</pre>`;
      } catch (e) { d.innerHTML = `<div class="error">❌ ERROR: ${e.message}</div>`; }
    }
    async function testKJSA() {
      const d = document.getElementById("kjsaResult");
      d.innerHTML = "<p style='color:#666;font-style:italic'>Loading...</p>";
      try {
        const r = await fetch(`${BASE}/api/kjsa/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ results: [{subject:"Mathematics",level:"EE"},{subject:"English",level:"ME"},{subject:"Integrated Science",level:"ME"},{subject:"Creative Arts",level:"AE"}] }) });
        const data = await r.json();
        d.innerHTML = r.ok ? `<div class="success">✅ SUCCESS (HTTP ${r.status})</div><pre>${JSON.stringify(data, null, 2)}</pre>` : `<div class="error">❌ FAILED (HTTP ${r.status})</div><pre>${JSON.stringify(data, null, 2)}</pre>`;
      } catch (e) { d.innerHTML = `<div class="error">❌ ERROR: ${e.message}</div>`; }
    }
    async function testValidate() {
      const d = document.getElementById("validateResult");
      d.innerHTML = "<p style='color:#666;font-style:italic'>Loading...</p>";
      try {
        const r = await fetch(`${BASE}/api/guidance/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schools: [{category:"C1"},{category:"C1"},{category:"C1"},{category:"C2"},{category:"C2"},{category:"C3"},{category:"C3"},{category:"C4",accommodation:"day"}], combinations: [{pathway_id:"same"}] }) });
        const data = await r.json();
        d.innerHTML = r.ok ? `<div class="success">✅ SUCCESS (HTTP ${r.status})</div><pre>${JSON.stringify(data, null, 2)}</pre>` : `<div class="error">❌ FAILED (HTTP ${r.status})</div><pre>${JSON.stringify(data, null, 2)}</pre>`;
      } catch (e) { d.innerHTML = `<div class="error">❌ ERROR: ${e.message}</div>`; }
    }
  </script>
</body>
</html>
Then open: http://localhost:3000/test-pathways.html
Click all three buttons. Each should show green "SUCCESS" with JSON data.
Report:
Career Interpreter shows career + pathway + combinations? YES / NO
KJSA Analyzer shows fit percentages above 0? YES / NO
Rule Validator shows valid: true? YES / NO
4. WIZARD END-TO-END TEST
Go to: http://localhost:3000/pathways/wizard
Walk through each step. For each step, report YES or NO.
Step 4.1: Dream
Type: I want to be a lawyer
Click Next
Check: Do you see a blue box with a career recommendation?
Report: Shows recommendation? YES / NO
Step 4.2: Location
Check 2-3 counties (e.g., Nairobi, Nakuru)
Type a sub-county (e.g., "Westlands")
Click Next
Check: Do you see the 47-county checkbox list with readable text?
Report: Counties visible and clickable? YES / NO
Step 4.3: Preferences
Click a gender button (Boys / Girls / Mixed)
Click an accommodation button (Boarding / Day / Both)
Click Next
Check: Do buttons highlight when clicked?
Report: Buttons clickable and highlight? YES / NO
Step 4.4: KJSA Results
Select grades from dropdowns:
Mathematics: EE
English: ME
Integrated Science: ME
Creative Arts: AE
Click Next
Check: Do you see a green box with a pathway fit percentage?
Report: Shows fit percentage above 0? YES / NO
Step 4.5: Results
Check: Do you see ALL of the following:
[ ] Career name
[ ] Pathway recommendation
[ ] Track name
[ ] Subject combinations (at least 3 ranked choices)
[ ] Any fit percentage or confidence score
Report: All items visible? YES / NO
If NO, describe what is missing or what you see instead.
5. REPORT TEMPLATE
Copy this template, fill it in, and send it back:
plain
=== CAREER PATHWAYS PHASE 2 — TEST REPORT ===

Build: PASS / FAIL
Server: Started successfully? YES / NO

--- API TESTS ---
Test 3.1 (Pathways list): YES / NO
Test 3.2 (Career search): YES / NO
Test 3.3 (School matcher): YES / NO
Test 3.4 (Career interpreter): YES / NO
Test 3.4 (KJSA analyzer): YES / NO
Test 3.4 (Rule validator): YES / NO

--- WIZARD TESTS ---
Step 4.1 (Dream): YES / NO
Step 4.2 (Location): YES / NO
Step 4.3 (Preferences): YES / NO
Step 4.4 (KJSA): YES / NO
Step 4.5 (Results): YES / NO

--- ISSUES (if any) ---
Describe any errors, blank pages, missing data, or crashes:
[Your description here]

--- DECISION ---
[ ] Proceed to Phase 3 (PDF + Share)
[ ] Fix issues first (describe above)
6. FALLBACK: IF WIZARD CRASHES
If the wizard page crashes (white screen, red error, or unresponsive):
Step 6.1: Check Server Still Running
Look at the PowerShell window running npm start. Do you still see Ready on http://localhost:3000?
If the window shows an error or closed, the server crashed. Restart:
powershell
npm start
Step 6.2: Use API Test Page Instead
If the wizard crashes but the server is running, use the test page from Section 3.4:
plain
http://localhost:3000/test-pathways.html
This bypasses the wizard frontend and tests the APIs directly.
Step 6.3: If Server Keeps Crashing
Close Chrome tabs (especially YouTube, Maps, heavy pages)
Close other applications
Restart the machine to clear memory leaks
Run npm start again
Retry tests
7. STOP
Do NOT proceed to Phase 3 (PDF + Share) until the founder sends back the completed test report from Section 5 with ALL items marked YES.
If any item is NO, STOP. Report the issue. Wait for fix instructions.
End of bridge spec. Execute exactly as written. Report back using Section 5 template.