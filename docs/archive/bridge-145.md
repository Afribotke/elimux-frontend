# CYCLE 052 — C2 School Ingestion + UI Enablement + Consent Flow Restore

## 0. PRECONDITIONS (verify before starting)

- [ ] C1 data is live in Supabase: `SELECT count(*) FROM senior_schools WHERE cluster_type = 'C1'` returns 204
- [ ] C2 PDF exists at `C:\Users\ELON\Projects-2026\IDEA STORE\C2 - PUBLIC SENIOR SCHOOLS IN KENYA_093006.pdf`
- [ ] Project builds clean: `npm run build` passes 0 errors
- [ ] All Cycle 051 files are in place and committed (or staged)

If build fails, fix before proceeding.

---

## 1. C2 PDF INGESTION

### 1.1 Copy PDF to project root

```powershell
Copy-Item "C:\Users\ELON\Projects-2026\IDEA STORE\C2 - PUBLIC SENIOR SCHOOLS IN KENYA_093006.pdf" ".\C2 - PUBLIC SENIOR SCHOOLS IN KENYA_093006.pdf"
1.2 Update ingestion script
Edit scripts/ingest-c1-schools.py (rename to scripts/ingest-schools.py if you prefer, or just edit in place):
Changes needed:
Accept cluster type as a command-line argument (default to "C1" if not provided)
Accept PDF path as a command-line argument
Change the hardcoded cluster = "C1" check to use the passed cluster type
Change the delete query to use the passed cluster type
C2-specific parsing fixes: The C2 PDF uses pipe-delimited tables on some pages and has these anomalies:
Row numbers sometimes appear as merged ranges (e.g., 108 109, 129 130 131 132) — skip these or split them
Region column sometimes has duplicates like RIFT RIFT or WESTERN WESTERN — normalize by taking the first word or using the known region map
Some rows have gender values like GIRLS BOYS on a single line — treat as "Mixed"
Some accommodation values include DAY / BOARDING — treat as "Mixed"
Empty cells in the middle of rows — handle gracefully
Updated script structure:
Python
#!/usr/bin/env python3
import sys
import pdfplumber
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Arguments: python scripts/ingest-schools.py <pdf_path> <cluster_type>
PDF_PATH = sys.argv[1] if len(sys.argv) > 1 else "C1 - PUBLIC SENIOR SCHOOLS IN KENYA_092956.pdf"
TARGET_CLUSTER = sys.argv[2].upper() if len(sys.argv) > 2 else "C1"

# ... existing normalization functions ...

def extract_schools():
    schools = []
    if not os.path.exists(PDF_PATH):
        print(f"ERROR: PDF not found at {PDF_PATH}")
        return []
    
    with pdfplumber.open(PDF_PATH) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            print(f"Processing page {page_num}...")
            tables = page.extract_tables()
            
            for table in tables:
                for row in table:
                    if not row or len(row) < 8:
                        continue
                    
                    row = [str(cell).strip() if cell else "" for cell in row]
                    
                    # Skip header rows
                    if any(h in row[0].upper() for h in ["S/NO", "REGION", "SENIOR SCHOOLS", "CLUST", "MEANT FOR"]):
                        continue
                    
                    # Detect cluster type
                    cluster = None
                    for cell in row:
                        if cell.upper() in ["C1", "C2", "C3", "C4"]:
                            cluster = cell.upper()
                            break
                    
                    if cluster != TARGET_CLUSTER:
                        continue
                    
                    try:
                        # C2 has merged row numbers like "108 109" — clean up
                        s_no_raw = row[0].strip()
                        s_no_parts = s_no_raw.split()
                        if not s_no_parts or not s_no_parts[-1].isdigit():
                            continue
                        
                        # Region: handle "RIFT RIFT" → "RIFT", "WESTERN WESTERN" → "WESTERN"
                        region_raw = row[1].strip().upper()
                        region = normalize_region(region_raw)
                        
                        county = normalize_county(row[2])
                        sub_county = row[3].strip().title() if len(row) > 3 else ""
                        uic = row[4].strip() if len(row) > 4 else ""
                        knec = row[5].strip() if len(row) > 5 else ""
                        
                        name = ""
                        if len(row) > 6: name = row[6].strip()
                        if not name and knec:
                            parts = knec.split(" ", 1)
                            if len(parts) == 2 and parts[0].isdigit():
                                knec = parts[0]
                                name = parts[1]
                        
                        if not name or len(name) < 5:
                            continue
                        
                        school_type = "Regular"
                        accommodation = "Boarding"
                        gender = "Mixed"
                        
                        for cell in row[7:]:
                            cu = cell.upper().strip()
                            if cu in ["REGULAR", "SNE"]: 
                                school_type = cell.title()
                            elif "BOARDING" in cu and "DAY" in cu:
                                accommodation = "Mixed"
                            elif "BOARDING" in cu:
                                accommodation = "Boarding"
                            elif "DAY" in cu:
                                accommodation = "Day"
                            elif cu in ["BOYS", "GIRLS", "MIXED"]:
                                gender = normalize_gender(cell)
                            elif "BOYS" in cu and "GIRLS" in cu:
                                gender = "Mixed"
                        
                        schools.append({
                            "name": name,
                            "knec_code": knec if knec.isdigit() else None,
                            "uic_code": uic if len(uic) <= 10 else None,
                            "region": region,
                            "county": county,
                            "sub_county": sub_county,
                            "cluster_type": cluster,
                            "school_type": school_type,
                            "accommodation_type": accommodation,
                            "gender": gender,
                        })
                        
                    except Exception as e:
                        print(f"Skip row on page {page_num}: {e}")
                        continue
    
    print(f"Extracted {len(schools)} {TARGET_CLUSTER} schools")
    return schools

def seed_supabase(schools):
    if not schools:
        print("No schools to seed")
        return
    # Delete only the target cluster
    supabase.table("senior_schools").delete().eq("cluster_type", TARGET_CLUSTER).execute()
    
    chunk_size = 50
    for i in range(0, len(schools), chunk_size):
        chunk = schools[i:i+chunk_size]
        supabase.table("senior_schools").insert(chunk).execute()
        print(f"Inserted chunk {i//chunk_size + 1}: {len(chunk)} schools")
    
    count = supabase.table("senior_schools").select("*", count="exact").eq("cluster_type", TARGET_CLUSTER).execute()
    print(f"Total {TARGET_CLUSTER} schools in database: {count.count}")

if __name__ == "__main__":
    seed_supabase(extract_schools())
1.3 Run ingestion
bash
export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"
python scripts/ingest-schools.py "C2 - PUBLIC SENIOR SCHOOLS IN KENYA_093006.pdf" C2
1.4 Verify
Run in Supabase SQL Editor:
sql
SELECT cluster_type, COUNT(*) FROM senior_schools GROUP BY cluster_type;
Expected: C1 = 204, C2 = ~690-700 (target: 692 based on PDF row count).
If C2 count is significantly off (e.g., < 600 or > 750), debug the parser:
Check for rows being skipped due to the s_no validation
Check for region normalization failures
Check for name extraction from merged cells
Add debug prints for skipped rows and fix the parser
Do NOT proceed to UI changes until C2 count is within 650-720 range.
2. UI CHANGES — Enable C2
2.1 Filter Panel
File: src/components/schools/filter-panel.tsx
Change the C2 entry from disabled to enabled:
TypeScript
{ key: "C2", label: "Extra County (C2)", color: "bg-slate-100 text-slate-800", disabled: false },
Remove the disabled prop handling for C2 specifically (or set disabled: false for all).
2.2 Search API — Remove C1 default
File: src/app/api/schools/search/route.ts
Remove or comment out this block:
TypeScript
// REMOVE THIS:
// if (!filters.cluster && !q.trim()) {
//   query = query.eq("cluster_type", "C1");
// }
With C2 live, the default "Discover" view should show ALL schools when no query is entered. The C1-only default was a Phase 1 placeholder.
2.3 Pathway Recommendations API — Fix cluster logic
File: src/app/api/schools/pathway-recommendations/route.ts
Change:
TypeScript
// OLD (wrong — only shows exact cluster match):
let query = supabase.from("senior_schools").select("*")
  .eq("cluster_type", pathway.required_cluster_min || "C1");

// NEW (correct — shows all schools at or above the required tier):
let query = supabase.from("senior_schools").select("*")
  .lte("cluster_type", pathway.required_cluster_min || "C1");
Why: A C2 pathway (e.g., Humanities) should show C1 schools (better tier) AND C2 schools (meets minimum). lte on text works because 'C1' < 'C2' < 'C3' < 'C4' lexicographically.
2.4 Hero stats update
File: src/app/schools/page.tsx
Update the stats line to reflect C2 inclusion:
TypeScript
<span>{meta.count} schools found</span><span>•</span><span>8 regions</span><span>•</span><span>47 counties</span><span>•</span><span>C1 + C2</span>
3. CONSENT FLOW RESTORATION (Blocker from Cycle 051)
File: src/app/pathways/page.tsx currently shows the 8-card pathway selector. This overwrote the Kenya Data Protection Act parental consent flow.
3.1 Move selector to sub-route
Rename src/app/pathways/page.tsx → src/app/pathways/select/page.tsx
Update the export name and keep all existing logic.
3.2 Restore consent landing page
Create src/app/pathways/page.tsx:
TypeScript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, GraduationCap, ArrowRight } from "lucide-react";

export default function PathwaysLandingPage() {
  const router = useRouter();
  const [role, setRole] = useState<"learner" | "parent" | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleProceed = () => {
    router.push("/pathways/select");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <GraduationCap className="w-4 h-4" /> Career Pathways
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Discover Your Future</h1>
          <p className="text-gray-600">Choose the career direction that matches your strengths and interests.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Who are you?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setRole("learner")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  role === "learner" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <GraduationCap className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-semibold">I am a Learner</h3>
                <p className="text-sm text-gray-500">Student exploring career options</p>
              </button>
              <button
                onClick={() => setRole("parent")}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  role === "parent" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold">I am a Parent / Guardian</h3>
                <p className="text-sm text-gray-500">Helping a student choose their path</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {role === "learner" && (
          <Card className="mb-6 border-amber-200">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-600" /> Parental Consent Required
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Under the Kenya Data Protection Act 2019, learners under 18 require parental or guardian consent 
                before using career assessment tools. Please confirm that your parent or guardian has given permission.
              </p>
              <label className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">
                  I confirm that my parent or guardian has reviewed and consented to my use of this career pathway tool.
                </span>
              </label>
            </CardContent>
          </Card>
        )}

        {role && (role === "parent" || consentGiven) && (
          <div className="text-center">
            <Button size="lg" onClick={handleProceed} className="gap-2">
              Continue to Pathway Selection
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
3.3 Update navigation links
Any link to /pathways stays as /pathways (hits the consent gate). The selector is now at /pathways/select.
4. BUILD & VERIFY
bash
npm run build
npx tsc --noEmit
Verify in Supabase:
sql
SELECT cluster_type, COUNT(*) as count FROM senior_schools GROUP BY cluster_type ORDER BY cluster_type;
-- Expected: C1 = 204, C2 = ~690
Verify locally (if memory allows):
/schools → default view shows C1 + C2 schools (no cluster filter applied)
Filter panel → C2 is clickable
Search "C2 schools in Kiambu" → returns only C2 schools in Kiambu
Search "girls boarding in Nandi" → returns C1 + C2 girls boarding schools in Nandi
/pathways → shows consent/age-gate
/pathways/select → shows 8 pathway cards
Select a C2 pathway (e.g., Humanities) → My Pathway tab shows C1 + C2 schools
5. COMMIT & PUSH
bash
git add -A
git commit -m "feat: ingest C2 schools (~692), enable C2 filters, fix pathway cluster logic, restore consent flow"
git push origin main
Then deploy to production and verify live.
6. PHASE 3 PREP (do not build yet)
C3 and C4 PDFs are in C:\Users\ELON\Projects-2026\IDEA STORE\
The same ingestion script will handle them — just change the cluster argument
C3 and C4 filters remain disabled with "Soon" badge until their data is ingested


# Cycle 048 — C3 School Data Ingestion & Search Index Update

## 0. AUDIT CHECKPOINT (Claude: run first, report back)
- [ ] Confirm `public.schools` table exists with columns matching C1/C2 ingest
- [ ] Confirm existing clusters in DB: C1 = ~1,400 rows, C2 = ~1,350 rows
- [ ] Confirm `cluster` column accepts 'C3'
- [ ] Check if `uic` + `knec` composite unique constraint exists

## 1. PARSER SCRIPT (Save as `scripts/parse_c3.py`)

Run this script in the project root to generate `data/c3_schools.json`:

```python
import re
import json
import PyPDF2

regions = ['RIFT VALLEY', 'NORTH EASTERN', 'EASTERN', 'WESTERN', 'NYANZA', 'COAST', 'CENTRAL', 'NAIROBI']

def parse_record(text):
    text = text.strip()
    # Fix concatenation issues
    for old, new in [
        ('SCHOOLC3','SCHOOL C3'),('SCHOC3','SCHOOL C3'),('SECONDARYC3','SECONDARY C3'),
        ('HIGH SCHOOLC3','HIGH SCHOOL C3'),('HIGHC3','HIGH C3'),('GIRLSC3','GIRLS C3'),
        ('BOYSC3','BOYS C3'),('BOARDINGC3','BOARDING C3'),('DAYC3','DAY C3'),
        ('MIXEDC3','MIXED C3'),('PUBLICC3','PUBLIC C3'),('SABOTIC3','SABOTI C3'),
        ('KAPSILIOTC3','KAPSILIOT C3'),('KIMONINGC3','KIMONING C3'),('KILOMEC3','KILOME C3'),
        ('MURAMBAC3','MURAMBA C3'),('KAPTELC3','KAPTEL C3'),('CHEPKUNYUKC3','CHEPKUNYUK C3'),
        ('SEPTONOKC3','SEPTONOK C3'),('KITHUKIC3','KITHUKI C3'),('BWAKEC3','BWAKE C3'),
        ('KIMILILIC3','KIMILILI C3'),('KOIBARAKC3','KOIBARAK C3'),('KANGETAC3','KANGETA C3'),
        ('GITARAKAC3','GITARAKA C3'),('RIAKANAUC3','RIAKANAU C3'),('NTHILANIC3','NTHILANI C3'),
        ('MIRITHUC3','MIRITHU C3'),('KIRANJAC3','KIRANJA C3'),('SCC3','SC C3'),
    ]:
        text = text.replace(old, new)
    
    # Fix region-county merge
    text = re.sub(r'(RIFT VALLEY|NORTH EASTERN|EASTERN|WESTERN|NYANZA|COAST|CENTRAL|NAIROBI)([A-Z])', r'\\1 \\2', text)
    
    m = re.match(r'(\\d+)', text)
    if not m: return None
    serial = int(m.group(1))
    text = text[len(m.group(1)):].strip()
    
    region = next((r for r in regions if text.startswith(r)), None)
    if not region: return None
    text = text[len(region):].strip()
    
    uic_m = re.search(r'\\s([A-Z0-9]{3,5})\\s+(\\d{5,12})\\s+', text)
    if not uic_m: return None
    uic, knec = uic_m.group(1), uic_m.group(2)
    if len(uic) > 4: uic = uic[-4:]
    
    before = text[:uic_m.start()].strip()
    after = text[uic_m.end():]
    
    c3_m = re.search(r'\\bC3\\b', after)
    if not c3_m: return None
    name = after[:c3_m.start()].strip()
    rest = after[c3_m.end():].strip().replace('PUBLI C', 'PUBLIC')
    
    prog = re.search(r'(REGULAR|INTEGRATED|SNE|INTERGRATED)', rest, re.I)
    prog_type = prog.group(1).upper() if prog else 'REGULAR'
    if prog_type == 'INTERGRATED': prog_type = 'INTEGRATED'
    
    dis = re.search(r'(NONE|VI|PH|HI|HIPHVI)', rest, re.I)
    disability = dis.group(1).upper() if dis else 'NONE'
    
    accom = re.search(r'(BOARDING|DAY|HYBRID)', rest, re.I)
    accommodation = accom.group(1).upper() if accom else 'BOARDING'
    
    gend = re.search(r'(GIRLS|BOYS|MIXED|GIRL|BOY)\\s*$', rest, re.I)
    gender = 'GIRLS' if gend and gend.group(1).upper()=='GIRL' else 'BOYS' if gend and gend.group(1).upper()=='BOY' else gend.group(1).upper() if gend else 'MIXED'
    
    counties = ['BARINGO','BOMET','BUNGOMA','BUSIA','ELGEYO MARAKWET','EMBU','GARISSA','HOMA BAY','ISIOLO','KAJIADO','KAKAMEGA','KERICHO','KIAMBU','KILIFI','KIRINYAGA','KISII','KISUMU','KITUI','KWALE','LAIKIPIA','LAMU','MACHAKOS','MAKUENI','MANDERA','MARSABIT','MERU','MIGORI','MOMBASA','MURANGA','NAIROBI','NAKURU','NANDI','NAROK','NYAMIRA','NYANDARUA','NYERI','SAMBURU','SIAYA','TAITA TAVETA','TANA RIVER','THARAKA NITHI','TRANS NZOIA','TURKANA','UASIN GISHU','VIHIGA','WAJIR','WEST POKOT']
    county = None
    for c in sorted(counties, key=len, reverse=True):
        if before.startswith(c):
            county = c
            sub = before[len(c):].strip()
            break
    if not county:
        parts = before.split(None, 1)
        county = parts[0] if parts else before
        sub = parts[1] if len(parts)>1 else ''
    
    return {
        's_no': serial, 'region': region, 'county': county, 'sub_county': sub,
        'uic': uic, 'knec': knec, 'school_name': name, 'cluster': 'C3',
        'type': 'PUBLIC', 'program_type': prog_type, 'disability_type': disability,
        'accommodation_type': accommodation, 'gender': gender
    }

def main():
    with open('data/C3 - PUBLIC SENIOR SCHOOLS IN KENYA_093027.pdf', 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        full = ''.join(p.extract_text()+'\\n' for p in reader.pages)
    
    lines = [l.strip() for l in full.split('\\n') if l.strip()]
    # Filter headers
    skip = {'SENIOR SCHOOLS CLUSTER 3', 'S/No.', 'ERTYPE', 'ITY TYPE', 'N TYPE', 'Meant for GMEC', 'ER'}
    lines = [l for l in lines if not any(l.startswith(s) for s in skip) and l != 'ER']
    
    recs, cur = [], []
    for line in lines:
        if re.match(r'^\\d+\\s', line) or re.match(r'^\\d+[A-Z]', line):
            if cur: recs.append(' '.join(cur))
            cur = [line]
        else:
            cur.append(line)
    if cur: recs.append(' '.join(cur))
    
    parsed = [r for r in (parse_record(rec) for rec in recs) if r]
    with open('data/c3_schools.json', 'w', encoding='utf-8') as f:
        json.dump(parsed, f, indent=2, ensure_ascii=False)
    print(f'Parsed {len(parsed)} C3 schools to data/c3_schools.json')

if __name__ == '__main__':
    main()
2. EXECUTION STEPS
Ensure PDF is in place: Copy C3 - PUBLIC SENIOR SCHOOLS IN KENYA_093027.pdf to data/ folder
Run parser: python scripts/parse_c3.py
Verify output: cat data/c3_schools.json | jq '. | length' → expect ~1,350
Insert into Supabase (use service role key):
sql
-- Insert C3 schools (run via Supabase SQL Editor or psql)
INSERT INTO public.schools (
  s_no, region, county, sub_county, uic, knec, school_name,
  cluster, type, program_type, disability_type, accommodation_type, gender
)
SELECT
  (elem->>'s_no')::int,
  elem->>'region',
  elem->>'county',
  elem->>'sub_county',
  elem->>'uic',
  elem->>'knec',
  elem->>'school_name',
  elem->>'cluster',
  elem->>'type',
  elem->>'program_type',
  elem->>'disability_type',
  elem->>'accommodation_type',
  elem->>'gender'
FROM jsonb_array_elements(
  (SELECT pg_read_file('data/c3_schools.json')::jsonb)
) AS elem
ON CONFLICT (uic, knec) DO NOTHING;
If pg_read_file is unavailable, use the Node.js seed script pattern from C1/C2 instead.
Verify DB count:
sql
SELECT cluster, COUNT(*) FROM public.schools GROUP BY cluster;
-- Expected: C1 ~1,400 | C2 ~1,350 | C3 ~1,350
3. FRONTEND SEARCH UPDATE
Update the school search page to include C3 in the cluster filter:
tsx
// In the cluster filter dropdown/component
const clusters = [
  { value: 'C1', label: 'Cluster 1 (National & Extra-County)' },
  { value: 'C2', label: 'Cluster 2 (County Schools)' },
  { value: 'C3', label: 'Cluster 3 (Sub-County Schools)' },
];
Ensure the AI search prompt includes C3 context:
plain
User is searching for C3 (Sub-County) public secondary schools in Kenya.
Available filters: region, county, sub_county, gender, accommodation_type.
4. VERIFICATION CHECKLIST
[ ] data/c3_schools.json generated with ≥1,340 records
[ ] DB insert completes without unique-constraint violations
[ ] SELECT COUNT(*) WHERE cluster='C3' returns ≥1,340
[ ] Frontend cluster filter shows C3 option
[ ] Search returns C3 schools when cluster=C3 is selected
[ ] No PII or student data is stored (only school metadata)
5. STAGING & DEPLOY
[ ] Stage: git add data/c3_schools.json scripts/parse_c3.py
[ ] DO NOT commit until Kimi confirms
[ ] After Kimi confirms: commit, push, verify on Vercel
