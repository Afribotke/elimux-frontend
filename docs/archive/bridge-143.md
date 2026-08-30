# CYCLE 051-CORRECTION — Import Fixes + Pathway Selection UI

## DECISION
- The old `pathways.*` schema (KJSA wizard, subject_combinations, guidance_sessions) is DEPRECATED. Do not read from or write to it.
- The NEW `career_pathways` / `student_pathway_selections` tables from Cycle 051 are the official replacement.
- Build the missing pathway selection UI so the "My Pathway" tab is never empty.

---

## STEP 1: Fix All Import Paths (project-wide find/replace)

In EVERY file created by Cycle 051, replace:

| Wrong | Correct |
|---|---|
| `@/src/lib/` | `@/lib/` |
| `@/src/components/` | `@/components/` |
| `@/src/hooks/use-auth` | `@/hooks/useAuth` |

Files affected:
- `src/app/schools/page.tsx`
- `src/app/schools/[id]/page.tsx`
- `src/app/api/schools/search/route.ts`
- `src/app/api/schools/pathway-recommendations/route.ts`
- `src/app/api/schools/selections/route.ts`
- `src/app/api/schools/[id]/route.ts`
- `src/components/schools/ai-search-bar.tsx`
- `src/components/schools/school-card.tsx`
- `src/components/schools/add-to-shortlist-button.tsx`
- `src/components/schools/pathway-recommendations.tsx`
- `src/components/schools/my-school-shortlist.tsx`
- `src/components/schools/filter-panel.tsx`
- `src/components/schools/comparison-drawer.tsx`
- `src/lib/schools-data.ts`
- `src/lib/school-search-parser.ts`

Also in `src/app/schools/page.tsx`, change the `useAuth` import line to:
```typescript
import { useAuth } from "@/hooks/useAuth";
STEP 2: Pathway List API
Create file: src/app/api/pathways/route.ts
TypeScript
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("career_pathways")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ data: data || [] });
  } catch (err) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
STEP 3: Pathway Selection API
Create file: src/app/api/pathways/select/route.ts
TypeScript
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pathway_id } = body;
    
    if (!pathway_id) {
      return Response.json({ error: "pathway_id required" }, { status: 400 });
    }

    // Deactivate any existing active selection for this user
    await supabase
      .from("student_pathway_selections")
      .update({ status: "changed" })
      .eq("user_id", user.id)
      .eq("status", "active");

    // Insert new active selection
    const { data, error } = await supabase
      .from("student_pathway_selections")
      .insert({
        user_id: user.id,
        pathway_id,
        status: "active",
      })
      .select("*, pathway:career_pathways(*)")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
STEP 4: Pathway Selection Page
Create file: src/app/pathways/page.tsx
TypeScript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CareerPathway } from "@/lib/schools-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function PathwaysPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pathways, setPathways] = useState<CareerPathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetchPathways();
  }, []);

  const fetchPathways = async () => {
    try {
      const res = await fetch("/api/pathways");
      const json = await res.json();
      if (json.data) setPathways(json.data);
    } catch (err) {
      console.error("Failed to fetch pathways:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (pathwayId: string) => {
    if (!user) {
      router.push("/login?redirect=/pathways");
      return;
    }
    setSelecting(pathwayId);
    try {
      const res = await fetch("/api/pathways/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathway_id: pathwayId }),
      });
      if (res.ok) {
        setSelected(pathwayId);
        setTimeout(() => router.push("/schools?tab=pathway"), 1500);
      }
    } catch (err) {
      console.error("Selection failed:", err);
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-lg text-gray-500">Loading pathways...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" /> Career Pathways
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Choose Your Path</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the career pathway that matches your interests and strengths. 
            We'll recommend the best schools for your choice.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pathways.map((pathway, index) => (
            <motion.div
              key={pathway.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-2 ${
                  selected === pathway.id 
                    ? "border-green-500 bg-green-50" 
                    : "border-transparent hover:border-gray-200"
                }`}
                onClick={() => !selecting && handleSelect(pathway.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{pathway.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{pathway.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{pathway.description}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          Min Cluster: {pathway.required_cluster_min || "Any"}
                        </Badge>
                        {pathway.recommended_regions?.slice(0, 3).map((r) => (
                          <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {selected === pathway.id ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : selecting === pathway.id ? (
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
STEP 5: Update Empty State in PathwayRecommendations
In src/components/schools/pathway-recommendations.tsx, the empty state CTA currently links to /pathways. This is now CORRECT — the page exists. No change needed.
STEP 6: Update Schools Page Detail CTA
In src/app/schools/[id]/page.tsx, the "Next Steps" card links to /pathways. This is now CORRECT. No change needed.
STEP 7: Navigation Integration
Add to main navigation (if not already present):
TypeScript
{
  label: "Career Pathways",
  href: "/pathways",
  icon: <Sparkles className="w-4 h-4" />,
  description: "Choose your career direction"
}
STEP 8: Build & Verify
npm run build → 0 errors
Visit http://localhost:3000/pathways → 8 pathway cards displayed
Click a pathway (logged in) → green checkmark → auto-redirects to /schools?tab=pathway after 1.5s
My Pathway tab now shows recommended schools based on the selected pathway
Old pathways.* tables remain untouched in the database

# CYCLE 051 — School Discovery Module (C1 Phase 1) + Career Pathways Integration

## 0. AUDIT & PRECONDITIONS

Before writing any code, confirm:

- [ ] `supabase` client is configured at `lib/supabase/client.ts` and `lib/supabase/server.ts`
- [ ] shadcn/ui components exist: `button`, `card`, `input`, `badge`, `sheet`, `dialog`, `checkbox`, `skeleton`, `tabs`, `separator`, `toast`
- [ ] Existing auth hook/context is available (user object has `.id`)
- [ ] The `career_pathways` table exists from previous cycles (or will be created below)
- [ ] `next.config.js` allows image domains if adding school placeholder images
- [ ] Node modules are installed (`npm install` passes)

If any component is missing, install via: `npx shadcn add [component-name]`

---

## 1. DATABASE SCHEMA — Career Pathways + Schools Integration

Run this SQL in Supabase Dashboard → SQL Editor (new query, then Run):

```sql
-- ============================================
-- 1.1 SENIOR SCHOOLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS senior_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  knec_code text,
  uic_code text,
  region text NOT NULL,
  county text NOT NULL,
  sub_county text NOT NULL,
  cluster_type text NOT NULL CHECK (cluster_type IN ('C1','C2','C3','C4')),
  school_type text NOT NULL DEFAULT 'Regular',
  accommodation_type text NOT NULL DEFAULT 'Boarding',
  gender text NOT NULL CHECK (gender IN ('Boys','Girls','Mixed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 1.2 FULL-TEXT SEARCH INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_schools_fts 
  ON senior_schools 
  USING gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(county,'') || ' ' || coalesce(sub_county,'') || ' ' || coalesce(region,'')));

-- ============================================
-- 1.3 PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_schools_cluster ON senior_schools(cluster_type);
CREATE INDEX IF NOT EXISTS idx_schools_county ON senior_schools(county);
CREATE INDEX IF NOT EXISTS idx_schools_region ON senior_schools(region);
CREATE INDEX IF NOT EXISTS idx_schools_gender ON senior_schools(gender);
CREATE INDEX IF NOT EXISTS idx_schools_accommodation ON senior_schools(accommodation_type);

-- ============================================
-- 1.4 CAREER PATHWAYS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS career_pathways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  required_cluster_min text CHECK (required_cluster_min IN ('C1','C2','C3','C4')),
  recommended_regions text[] DEFAULT '{}',
  recommended_counties text[] DEFAULT '{}',
  recommended_genders text[] DEFAULT '{}',
  icon text,
  color text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 1.5 STUDENT PATHWAY SELECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS student_pathway_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pathway_id uuid NOT NULL REFERENCES career_pathways(id) ON DELETE CASCADE,
  kcse_grade text,
  cluster_points numeric,
  selected_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active','completed','changed')),
  UNIQUE(user_id, pathway_id)
);

-- ============================================
-- 1.6 STUDENT SCHOOL SELECTIONS (Shortlist)
-- ============================================
CREATE TABLE IF NOT EXISTS student_school_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES senior_schools(id) ON DELETE CASCADE,
  pathway_id uuid REFERENCES career_pathways(id) ON DELETE SET NULL,
  preference_order int DEFAULT 1,
  notes text,
  status text DEFAULT 'shortlisted' CHECK (status IN ('shortlisted','applied','admitted','declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, school_id)
);

-- ============================================
-- 1.7 PATHWAY-SCHOOL MAPPINGS (Admin-curated)
-- ============================================
CREATE TABLE IF NOT EXISTS pathway_school_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id uuid NOT NULL REFERENCES career_pathways(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES senior_schools(id) ON DELETE CASCADE,
  relevance_score int DEFAULT 5 CHECK (relevance_score BETWEEN 1 AND 10),
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(pathway_id, school_id)
);

-- ============================================
-- 1.8 RLS POLICIES
-- ============================================
ALTER TABLE senior_schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Schools viewable by everyone" 
  ON senior_schools FOR SELECT USING (true);

ALTER TABLE career_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Pathways viewable by everyone" 
  ON career_pathways FOR SELECT USING (true);

ALTER TABLE student_pathway_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users view own pathway selections" 
  ON student_pathway_selections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users insert own pathway selections" 
  ON student_pathway_selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users update own pathway selections" 
  ON student_pathway_selections FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE student_school_selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users view own school selections" 
  ON student_school_selections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users insert own school selections" 
  ON student_school_selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users update own school selections" 
  ON student_school_selections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users delete own school selections" 
  ON student_school_selections FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE pathway_school_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Mappings viewable by everyone" 
  ON pathway_school_mappings FOR SELECT USING (true);

-- ============================================
-- 1.9 VERIFY
-- ============================================
SELECT 'senior_schools' as table_name, COUNT(*) as count FROM senior_schools
UNION ALL
SELECT 'career_pathways', COUNT(*) FROM career_pathways
UNION ALL
SELECT 'student_pathway_selections', COUNT(*) FROM student_pathway_selections
UNION ALL
SELECT 'student_school_selections', COUNT(*) FROM student_school_selections
UNION ALL
SELECT 'pathway_school_mappings', COUNT(*) FROM pathway_school_mappings;
Expected result: All 5 tables created with indexes and RLS. Counts should be 0 for all except possibly career_pathways if it existed.
2. DATA INGESTION
2.1 C1 Schools from PDF
In a separate terminal (not in the Next.js project), run:
bash
pip install pdfplumber supabase-py python-dotenv
Create file: scripts/ingest-c1-schools.py
Python
#!/usr/bin/env python3
"""
Extract C1 schools from the attached PDF and seed Supabase.
Run: python scripts/ingest-c1-schools.py
"""

import pdfplumber
import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

PDF_PATH = "C1 - PUBLIC SENIOR SCHOOLS IN KENYA_092956.pdf"

KNOWN_COUNTIES = {
    "baringo", "bomet", "bungoma", "busia", "elgeyo marakwet", "embu", "garissa",
    "homa bay", "isiolo", "kajiado", "kakamega", "kericho", "kiambu", "kilifi",
    "kirinyaga", "kisii", "kisumu", "kitui", "kwale", "laikipia", "lamu", "machakos",
    "makueni", "mandera", "marsabit", "meru", "migori", "mombasa", "muranga",
    "nairobi", "nakuru", "nandi", "narok", "nyamira", "nyandarua", "nyeri", "samburu",
    "siaya", "taita taveta", "tana river", "tharaka nithi", "trans nzoia", "turkana",
    "uasin gishu", "vihiga", "wajir", "west pokot", "bomet", "bungoma"
}

KNOWN_REGIONS = {
    "rift valley", "western", "eastern", "north eastern", "nyanza", "central",
    "coast", "nairobi"
}

def normalize_county(name: str) -> str:
    name = name.lower().strip()
    for county in KNOWN_COUNTIES:
        if county in name:
            return county.title()
    return name.title()

def normalize_region(name: str) -> str:
    name = name.lower().strip()
    for region in KNOWN_REGIONS:
        if region in name:
            return region.title()
    return name.title()

def normalize_gender(g: str) -> str:
    g = g.upper().strip()
    if "BOYS" in g and "GIRLS" in g:
        return "Mixed"
    if "BOYS" in g:
        return "Boys"
    if "GIRLS" in g:
        return "Girls"
    if "MIXED" in g:
        return "Mixed"
    return "Mixed"

def normalize_accommodation(a: str) -> str:
    a = a.upper().strip()
    if "BOARDING" in a and "DAY" in a:
        return "Mixed"
    if "BOARDING" in a:
        return "Boarding"
    if "DAY" in a:
        return "Day"
    return "Boarding"

def extract_schools():
    schools = []
    
    if not os.path.exists(PDF_PATH):
        print(f"ERROR: PDF not found at {PDF_PATH}")
        print("Place the PDF in the project root and retry.")
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
                    
                    if any(h in row[0].upper() for h in ["S/NO", "REGION", "SENIOR SCHOOLS"]):
                        continue
                    
                    cluster = None
                    for cell in row:
                        if cell.upper() in ["C1", "C2", "C3", "C4"]:
                            cluster = cell.upper()
                            break
                    
                    if cluster != "C1":
                        continue
                    
                    try:
                        s_no = row[0].strip()
                        if not s_no.isdigit():
                            continue
                        
                        region = normalize_region(row[1])
                        county = normalize_county(row[2])
                        sub_county = row[3].strip().title() if len(row) > 3 else ""
                        uic = row[4].strip() if len(row) > 4 else ""
                        knec = row[5].strip() if len(row) > 5 else ""
                        
                        name = ""
                        if len(row) > 6:
                            name = row[6].strip()
                        if not name and knec:
                            parts = knec.split(" ", 1)
                            if len(parts) == 2 and parts[0].isdigit():
                                knec = parts[0]
                                name = parts[1]
                        
                        school_type = "Regular"
                        accommodation = "Boarding"
                        gender = "Mixed"
                        
                        for cell in row[7:]:
                            cell_upper = cell.upper()
                            if cell_upper in ["REGULAR", "SNE"]:
                                school_type = cell.title()
                            elif "BOARDING" in cell_upper or "DAY" in cell_upper:
                                accommodation = normalize_accommodation(cell)
                            elif cell_upper in ["BOYS", "GIRLS", "MIXED"]:
                                gender = normalize_gender(cell)
                        
                        if not name or len(name) < 5:
                            continue
                        
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
                        print(f"Skip row due to error: {e}")
                        continue
    
    print(f"Extracted {len(schools)} C1 schools")
    return schools

def seed_supabase(schools):
    if not schools:
        print("No schools to seed")
        return
    
    supabase.table("senior_schools").delete().eq("cluster_type", "C1").execute()
    
    chunk_size = 50
    for i in range(0, len(schools), chunk_size):
        chunk = schools[i:i+chunk_size]
        result = supabase.table("senior_schools").insert(chunk).execute()
        print(f"Inserted chunk {i//chunk_size + 1}: {len(chunk)} schools")
    
    count_result = supabase.table("senior_schools").select("*", count="exact").eq("cluster_type", "C1").execute()
    print(f"Total C1 schools in database: {count_result.count}")

if __name__ == "__main__":
    schools = extract_schools()
    seed_supabase(schools)
2.2 Seed Career Pathways
Create file: scripts/seed-pathways.py
Python
#!/usr/bin/env python3
"""
Seed initial career pathways data.
Run: python scripts/seed-pathways.py
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

PATHWAYS = [
    {
        "code": "STEM",
        "name": "Science, Technology, Engineering & Mathematics",
        "description": "For students strong in sciences and mathematics. Leads to engineering, medicine, IT, and research careers.",
        "required_cluster_min": "C1",
        "recommended_regions": ["Nairobi", "Central", "Rift Valley", "Nyanza"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "🔬",
        "color": "#3b82f6"
    },
    {
        "code": "HUMANITIES",
        "name": "Humanities & Social Sciences",
        "description": "For students passionate about languages, history, geography, and social studies. Leads to law, education, journalism, and public service.",
        "required_cluster_min": "C2",
        "recommended_regions": ["Nairobi", "Central", "Western", "Eastern"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "📚",
        "color": "#8b5cf6"
    },
    {
        "code": "BUSINESS",
        "name": "Business Studies & Commerce",
        "description": "For students interested in economics, accounting, and entrepreneurship. Leads to finance, business management, and marketing.",
        "required_cluster_min": "C2",
        "recommended_regions": ["Nairobi", "Central", "Rift Valley", "Coast"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "💼",
        "color": "#10b981"
    },
    {
        "code": "CREATIVE",
        "name": "Creative Arts & Design",
        "description": "For students with talents in art, music, drama, and design. Leads to architecture, graphic design, performing arts, and media.",
        "required_cluster_min": "C3",
        "recommended_regions": ["Nairobi", "Coast", "Central", "Nyanza"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "🎨",
        "color": "#f59e0b"
    },
    {
        "code": "AGRICULTURE",
        "name": "Agriculture & Environment",
        "description": "For students interested in farming, environmental science, and natural resources. Leads to agribusiness, veterinary, and environmental management.",
        "required_cluster_min": "C3",
        "recommended_regions": ["Rift Valley", "Western", "Nyanza", "Central"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "🌾",
        "color": "#22c55e"
    },
    {
        "code": "HEALTH",
        "name": "Health & Biological Sciences",
        "description": "For students aiming for nursing, pharmacy, laboratory sciences, and allied health professions.",
        "required_cluster_min": "C1",
        "recommended_regions": ["Nairobi", "Nyanza", "Central", "Rift Valley"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "⚕️",
        "color": "#ef4444"
    },
    {
        "code": "TECHNICAL",
        "name": "Technical & Vocational",
        "description": "For students interested in hands-on technical skills. Leads to TVET, engineering trades, and applied technology.",
        "required_cluster_min": "C3",
        "recommended_regions": ["Nairobi", "Rift Valley", "Central", "Coast"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "🔧",
        "color": "#6366f1"
    },
    {
        "code": "HOSPITALITY",
        "name": "Hospitality & Tourism",
        "description": "For students interested in hotel management, tourism, and culinary arts. Leads to hospitality management and travel industry careers.",
        "required_cluster_min": "C3",
        "recommended_regions": ["Coast", "Nairobi", "Rift Valley", "Central"],
        "recommended_genders": ["Boys", "Girls", "Mixed"],
        "icon": "🏨",
        "color": "#ec4899"
    }
]

def seed():
    # Clear existing
    supabase.table("career_pathways").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    result = supabase.table("career_pathways").insert(PATHWAYS).execute()
    print(f"Seeded {len(PATHWAYS)} career pathways")
    
    # Verify
    count = supabase.table("career_pathways").select("*", count="exact").execute()
    print(f"Total pathways in DB: {count.count}")

if __name__ == "__main__":
    seed()
2.3 Run Both Scripts
bash
# Place the PDF in project root first
cp "/path/to/C1 - PUBLIC SENIOR SCHOOLS IN KENYA_092956.pdf" "./C1 - PUBLIC SENIOR SCHOOLS IN KENYA_092956.pdf"

export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-key"

python scripts/ingest-c1-schools.py
python scripts/seed-pathways.py
2.4 Verify in Supabase
Go to Supabase Dashboard → Table Editor:
[ ] senior_schools: 180-210 C1 records
[ ] career_pathways: 8 records seeded
[ ] student_pathway_selections: 0 records (empty, ready for students)
[ ] student_school_selections: 0 records (empty, ready for students)
[ ] pathway_school_mappings: 0 records (will be auto-populated by admin or AI)
3. TYPES & CONSTANTS
Create file: lib/schools-data.ts
TypeScript
export interface SeniorSchool {
  id: string;
  name: string;
  knec_code: string | null;
  uic_code: string | null;
  region: string;
  county: string;
  sub_county: string;
  cluster_type: "C1" | "C2" | "C3" | "C4";
  school_type: string;
  accommodation_type: "Boarding" | "Day" | "Mixed";
  gender: "Boys" | "Girls" | "Mixed";
  created_at: string;
}

export interface CareerPathway {
  id: string;
  code: string;
  name: string;
  description: string;
  required_cluster_min: "C1" | "C2" | "C3" | "C4" | null;
  recommended_regions: string[];
  recommended_counties: string[];
  recommended_genders: string[];
  icon: string;
  color: string;
}

export interface StudentPathwaySelection {
  id: string;
  user_id: string;
  pathway_id: string;
  kcse_grade: string | null;
  cluster_points: number | null;
  selected_at: string;
  status: "active" | "completed" | "changed";
  pathway?: CareerPathway;
}

export interface StudentSchoolSelection {
  id: string;
  user_id: string;
  school_id: string;
  pathway_id: string | null;
  preference_order: number;
  notes: string | null;
  status: "shortlisted" | "applied" | "admitted" | "declined";
  created_at: string;
  school?: SeniorSchool;
  pathway?: CareerPathway;
}

export interface SchoolSearchFilters {
  cluster?: string;
  region?: string;
  county?: string;
  subCounty?: string;
  gender?: string;
  accommodation?: string;
  query?: string;
}

export interface SchoolSearchResult {
  data: SeniorSchool[];
  filters: SchoolSearchFilters;
  count: number;
  page: number;
  limit: number;
}

export interface PathwayRecommendation {
  school: SeniorSchool;
  matchReason: string;
  relevanceScore: number;
}

export const CLUSTER_LABELS: Record<string, { label: string; color: string; description: string }> = {
  C1: { label: "National", color: "bg-amber-100 text-amber-800 border-amber-200", description: "Top-tier national schools" },
  C2: { label: "Extra County", color: "bg-slate-100 text-slate-800 border-slate-200", description: "Extra-county schools" },
  C3: { label: "County", color: "bg-orange-100 text-orange-800 border-orange-200", description: "County-level schools" },
  C4: { label: "Sub-County", color: "bg-blue-100 text-blue-800 border-blue-200", description: "Sub-county schools" },
};

export const GENDER_ICONS: Record<string, string> = {
  Boys: "👦",
  Girls: "👧",
  Mixed: "👥",
};

export const ACCOMMODATION_ICONS: Record<string, string> = {
  Boarding: "🏠",
  Day: "🌅",
  Mixed: "🏠/🌅",
};

export const REGIONS = [
  "Central", "Coast", "Eastern", "Nairobi", "North Eastern", 
  "Nyanza", "Rift Valley", "Western"
];

export const COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu",
  "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
  "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale",
  "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit",
  "Meru", "Migori", "Mombasa", "Muranga", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya",
  "Taita Taveta", "Tana River", "Tharaka Nithi", "Trans Nzoia", 
  "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
];
4. AI SEARCH PARSER (Pathway-Aware)
Create file: lib/school-search-parser.ts
TypeScript
import { SchoolSearchFilters } from "./schools-data";

export function parseSchoolQuery(input: string): SchoolSearchFilters {
  const lower = input.toLowerCase().trim();
  const filters: SchoolSearchFilters = {};
  
  if (!lower) return filters;

  // CLUSTER EXTRACTION
  if (/\bc1\b/.test(lower) || /\bnational\b/.test(lower)) {
    filters.cluster = "C1";
  } else if (/\bc2\b/.test(lower) || /\bextra county\b/.test(lower)) {
    filters.cluster = "C2";
  } else if (/\bc3\b/.test(lower) || /\bcounty school\b/.test(lower)) {
    filters.cluster = "C3";
  } else if (/\bc4\b/.test(lower) || /\bsub county\b/.test(lower)) {
    filters.cluster = "C4";
  }

  // GENDER EXTRACTION
  if (/\bboys\b/.test(lower) && !/\bgirls\b/.test(lower)) {
    filters.gender = "Boys";
  } else if (/\bgirls\b/.test(lower) && !/\bboys\b/.test(lower)) {
    filters.gender = "Girls";
  } else if (/\bmixed\b/.test(lower) || /\bco-ed\b/.test(lower)) {
    filters.gender = "Mixed";
  }

  // ACCOMMODATION EXTRACTION
  if (/\bboarding\b/.test(lower) && !/\bday\b/.test(lower)) {
    filters.accommodation = "Boarding";
  } else if (/\bday\b/.test(lower) && !/\bboarding\b/.test(lower)) {
    filters.accommodation = "Day";
  } else if (/\bboth\b/.test(lower)) {
    if (/\bday\b/.test(lower) || /\bboarding\b/.test(lower)) {
      filters.accommodation = "Mixed";
    }
  }

  // LOCATION EXTRACTION
  const countyMap: Record<string, string> = {
    "nandi": "Nandi", "kiambu": "Kiambu", "nairobi": "Nairobi", "nakuru": "Nakuru",
    "kisumu": "Kisumu", "mombasa": "Mombasa", "kericho": "Kericho", "kakamega": "Kakamega",
    "kisii": "Kisii", "bungoma": "Bungoma", "busia": "Busia", "vihiga": "Vihiga",
    "nyeri": "Nyeri", "muranga": "Muranga", "kirinyaga": "Kirinyaga", "nyandarua": "Nyandarua",
    "machakos": "Machakos", "kitui": "Kitui", "makueni": "Makueni", "embu": "Embu",
    "meru": "Meru", "tharaka nithi": "Tharaka Nithi", "laikipia": "Laikipia",
    "uasin gishu": "Uasin Gishu", "narok": "Narok", "kajiado": "Kajiado",
    "baringo": "Baringo", "west pokot": "West Pokot", "turkana": "Turkana",
    "samburu": "Samburu", "trans nzoia": "Trans Nzoia", "elgeyo marakwet": "Elgeyo Marakwet",
    "bomet": "Bomet", "homa bay": "Homa Bay", "migori": "Migori", "siaya": "Siaya",
    "nyamira": "Nyamira", "kwale": "Kwale", "kilifi": "Kilifi",
    "taita taveta": "Taita Taveta", "lamu": "Lamu", "tana river": "Tana River",
    "garissa": "Garissa", "wajir": "Wajir", "mandera": "Mandera",
    "marsabit": "Marsabit", "isiolo": "Isiolo", "bomet": "Bomet",
  };

  for (const [key, value] of Object.entries(countyMap)) {
    if (lower.includes(key)) {
      filters.county = value;
      break;
    }
  }

  const regionMap: Record<string, string> = {
    "rift valley": "Rift Valley", "western": "Western", "eastern": "Eastern",
    "nyanza": "Nyanza", "central": "Central", "coast": "Coast",
    "north eastern": "North Eastern", "nairobi": "Nairobi",
  };

  if (!filters.county) {
    for (const [key, value] of Object.entries(regionMap)) {
      if (lower.includes(key)) {
        filters.region = value;
        break;
      }
    }
  }

  // FREE TEXT QUERY
  const filterKeywords = [
    "c1", "c2", "c3", "c4", "national", "extra county", "county school", 
    "sub county", "boys", "girls", "mixed", "boarding", "day", "school", 
    "schools", "in", "the", "a", "an", "find", "show", "me", "all", "search",
    ...Object.keys(countyMap), ...Object.keys(regionMap)
  ];
  
  let remaining = lower;
  for (const kw of filterKeywords) {
    remaining = remaining.replace(new RegExp(`\\b${kw}\\b`, "g"), "");
  }
  remaining = remaining.replace(/\s+/g, " ").trim();
  
  if (remaining.length > 2) {
    filters.query = remaining;
  }

  return filters;
}

export function buildSearchDescription(filters: SchoolSearchFilters): string {
  const parts: string[] = [];
  if (filters.cluster) parts.push(`${CLUSTER_LABELS[filters.cluster]?.label || filters.cluster} schools`);
  else parts.push("schools");
  
  if (filters.gender) parts.push(`for ${filters.gender.toLowerCase()}`);
  if (filters.accommodation) parts.push(`(${filters.accommodation.toLowerCase()})`);
  if (filters.county) parts.push(`in ${filters.county}`);
  else if (filters.region) parts.push(`in ${filters.region}`);
  if (filters.query) parts.push(`matching "${filters.query}"`);
  
  return parts.join(" ");
}
5. BACKEND API
5.1 General Search API
Create file: app/api/schools/search/route.ts
TypeScript
import { createClient } from "@/lib/supabase/server";
import { parseSchoolQuery } from "@/lib/school-search-parser";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "24", 10), 100);
    const offset = (page - 1) * limit;

    const supabase = createClient();
    const filters = parseSchoolQuery(q);

    let query = supabase
      .from("senior_schools")
      .select("*", { count: "exact" });

    if (filters.cluster) query = query.eq("cluster_type", filters.cluster);
    if (filters.gender) query = query.eq("gender", filters.gender);
    if (filters.accommodation) query = query.eq("accommodation_type", filters.accommodation);
    if (filters.county) query = query.ilike("county", `%${filters.county}%`);
    if (filters.region) query = query.ilike("region", `%${filters.region}%`);
    if (filters.subCounty) query = query.ilike("sub_county", `%${filters.subCounty}%`);
    if (filters.query) {
      query = query.or(
        `name.ilike.%${filters.query}%,county.ilike.%${filters.query}%,sub_county.ilike.%${filters.query}%`
      );
    }

    if (!filters.cluster && !q.trim()) {
      query = query.eq("cluster_type", "C1");
    }

    const { data, error, count } = await query
      .order("name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("School search error:", error);
      return Response.json(
        { error: "Search failed", details: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      data: data || [],
      filters,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error("Search API error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
5.2 Pathway-Based Recommendations API
Create file: app/api/schools/pathway-recommendations/route.ts
TypeScript
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get student's active pathway
    const { data: pathwaySelection, error: pathwayError } = await supabase
      .from("student_pathway_selections")
      .select("*, pathway:career_pathways(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("selected_at", { ascending: false })
      .limit(1)
      .single();

    if (pathwayError || !pathwaySelection) {
      return Response.json(
        { error: "No active pathway found", data: [] },
        { status: 200 }
      );
    }

    const pathway = pathwaySelection.pathway;

    // Build recommendation query based on pathway preferences
    let query = supabase
      .from("senior_schools")
      .select("*")
      .eq("cluster_type", pathway.required_cluster_min || "C1");

    // Filter by recommended regions if specified
    if (pathway.recommended_regions && pathway.recommended_regions.length > 0) {
      query = query.in("region", pathway.recommended_regions);
    }

    // Filter by recommended counties if specified
    if (pathway.recommended_counties && pathway.recommended_counties.length > 0) {
      query = query.in("county", pathway.recommended_counties);
    }

    // Filter by recommended genders if specified
    if (pathway.recommended_genders && pathway.recommended_genders.length > 0) {
      query = query.in("gender", pathway.recommended_genders);
    }

    const { data: schools, error } = await query
      .order("name", { ascending: true })
      .limit(12);

    if (error) {
      return Response.json(
        { error: "Failed to fetch recommendations" },
        { status: 500 }
      );
    }

    // Get user's existing selections to mark them
    const { data: selections } = await supabase
      .from("student_school_selections")
      .select("school_id")
      .eq("user_id", user.id);

    const selectedIds = new Set(selections?.map((s) => s.school_id) || []);

    const recommendations = (schools || []).map((school) => ({
      school,
      matchReason: `Recommended for ${pathway.name} pathway`,
      relevanceScore: 8,
      isSelected: selectedIds.has(school.id),
    }));

    return Response.json({
      pathway: pathway,
      recommendations,
      total: recommendations.length,
    });
  } catch (err) {
    console.error("Pathway recommendations error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
5.3 Student School Selections API
Create file: app/api/schools/selections/route.ts
TypeScript
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// GET - List user's school selections
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("student_school_selections")
      .select("*, school:senior_schools(*), pathway:career_pathways(*)")
      .eq("user_id", user.id)
      .order("preference_order", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data: data || [] });
  } catch (err) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST - Add a school to selections
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { school_id, pathway_id, notes } = body;

    if (!school_id) {
      return Response.json({ error: "school_id required" }, { status: 400 });
    }

    // Get current max preference order
    const { data: existing } = await supabase
      .from("student_school_selections")
      .select("preference_order")
      .eq("user_id", user.id)
      .order("preference_order", { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.preference_order || 0) + 1;

    const { data, error } = await supabase
      .from("student_school_selections")
      .insert({
        user_id: user.id,
        school_id,
        pathway_id: pathway_id || null,
        preference_order: nextOrder,
        notes: notes || null,
        status: "shortlisted",
      })
      .select("*, school:senior_schools(*), pathway:career_pathways(*)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return Response.json({ error: "School already in your list" }, { status: 409 });
      }
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE - Remove a school from selections
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const selectionId = searchParams.get("id");

    if (!selectionId) {
      return Response.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("student_school_selections")
      .delete()
      .eq("id", selectionId)
      .eq("user_id", user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
5.4 School Detail API
Create file: app/api/schools/[id]/route.ts
TypeScript
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Get school
    const { data: school, error } = await supabase
      .from("senior_schools")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return Response.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Get related pathways (if any mappings exist)
    const { data: mappings } = await supabase
      .from("pathway_school_mappings")
      .select("pathway:career_pathways(*), relevance_score, reason")
      .eq("school_id", params.id)
      .order("relevance_score", { ascending: false })
      .limit(5);

    // Check if user has this school selected
    const { data: { user } } = await supabase.auth.getUser();
    let isSelected = false;
    let selectionId = null;
    
    if (user) {
      const { data: selection } = await supabase
        .from("student_school_selections")
        .select("id")
        .eq("user_id", user.id)
        .eq("school_id", params.id)
        .maybeSingle();
      
      if (selection) {
        isSelected = true;
        selectionId = selection.id;
      }
    }

    return Response.json({
      data: school,
      relatedPathways: mappings || [],
      isSelected,
      selectionId,
    });
  } catch (err) {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
6. FRONTEND PAGES
6.1 Unified School Discovery Page (with Pathway Tab)
Create file: app/schools/page.tsx
TypeScript
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AISearchBar } from "@/components/schools/ai-search-bar";
import { SchoolCard } from "@/components/schools/school-card";
import { FilterPanel } from "@/components/schools/filter-panel";
import { ComparisonDrawer } from "@/components/schools/comparison-drawer";
import { PathwayRecommendations } from "@/components/schools/pathway-recommendations";
import { MySchoolShortlist } from "@/components/schools/my-school-shortlist";
import { SchoolSearchResult, SeniorSchool, StudentSchoolSelection } from "@/lib/schools-data";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidersHorizontal, GraduationCap, Sparkles, Heart, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

function SchoolsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = searchParams.get("tab") || "discover";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SeniorSchool[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<SchoolSearchResult | null>(null);
  const [compareList, setCompareList] = useState<SeniorSchool[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [page, setPage] = useState(1);
  const [shortlist, setShortlist] = useState<StudentSchoolSelection[]>([]);
  const [shortlistCount, setShortlistCount] = useState(0);

  const search = useCallback(async (searchQuery: string, pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/schools/search?q=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=24`
      );
      const json = await res.json();
      if (json.data) {
        if (pageNum === 1) {
          setResults(json.data);
        } else {
          setResults((prev) => [...prev, ...json.data]);
        }
        setMeta(json);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShortlist = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/schools/selections");
      const json = await res.json();
      if (json.data) {
        setShortlist(json.data);
        setShortlistCount(json.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch shortlist:", err);
    }
  }, [user]);

  useEffect(() => {
    search(initialQuery, 1);
    fetchShortlist();
  }, [initialQuery, search, fetchShortlist]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
    const url = newQuery 
      ? `/schools?q=${encodeURIComponent(newQuery)}` 
      : "/schools";
    router.push(url, { scroll: false });
    search(newQuery, 1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    router.push(url.pathname + url.search, { scroll: false });
  };

  const toggleCompare = (school: SeniorSchool) => {
    setCompareList((prev) => {
      const exists = prev.find((s) => s.id === school.id);
      if (exists) {
        return prev.filter((s) => s.id !== school.id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), school];
      }
      return [...prev, school];
    });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    search(query, nextPage);
  };

  const onShortlistUpdate = () => {
    fetchShortlist();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <GraduationCap className="w-4 h-4" />
              School Discovery
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Find Your Perfect School
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Search through all approved public senior schools using natural language. 
              Try: <span className="text-blue-600 font-medium">"girls boarding C1 in Nandi"</span>
            </p>
          </div>

          <AISearchBar 
            initialValue={query} 
            onSearch={handleSearch} 
            isLoading={loading} 
          />

          {meta && (
            <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
              <span>{meta.count} schools found</span>
              <span>•</span>
              <span>8 regions</span>
              <span>•</span>
              <span>47 counties</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full justify-start bg-transparent h-14 p-0 gap-1">
              <TabsTrigger 
                value="discover" 
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 py-3"
              >
                <Search className="w-4 h-4 mr-2" />
                Discover
              </TabsTrigger>
              {user && (
                <TabsTrigger 
                  value="pathway" 
                  className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none px-4 py-3"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  My Pathway
                </TabsTrigger>
              )}
              {user && (
                <TabsTrigger 
                  value="shortlist" 
                  className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 data-[state=active]:border-b-2 data-[state=active]:border-pink-600 rounded-none px-4 py-3"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  My Shortlist
                  {shortlistCount > 0 && (
                    <span className="ml-2 bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full">
                      {shortlistCount}
                    </span>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="discover" className="mt-0">
              <div className="py-8">
                <div className="flex gap-8">
                  <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                      </h3>
                      <FilterPanel onFilterChange={handleSearch} currentQuery={query} />
                    </div>
                  </aside>

                  <div className="flex-1 min-w-0">
                    <div className="lg:hidden flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500">
                        {meta?.count || 0} schools found
                      </span>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm">
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            Filters
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80">
                          <FilterPanel onFilterChange={handleSearch} currentQuery={query} />
                        </SheetContent>
                      </Sheet>
                    </div>

                    {compareList.length > 0 && (
                      <div className="mb-6 bg-white rounded-lg border border-blue-200 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            {compareList.length} selected for comparison
                          </span>
                          <div className="flex gap-2">
                            {compareList.map((s) => (
                              <span key={s.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {s.name.split(" ").slice(0, 2).join(" ")}...
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setCompareList([])}>
                            Clear
                          </Button>
                          <Button size="sm" onClick={() => setShowComparison(true)} disabled={compareList.length < 2}>
                            Compare
                          </Button>
                        </div>
                      </div>
                    )}

                    {loading && results.length === 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <Skeleton key={i} className="h-48 rounded-xl" />
                        ))}
                      </div>
                    ) : results.length === 0 ? (
                      <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No schools found</h3>
                        <p className="text-gray-500 mb-6">Try broadening your search or removing some filters</p>
                        <Button onClick={() => handleSearch("")}>View All C1 Schools</Button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {results.map((school, index) => (
                            <SchoolCard
                              key={school.id}
                              school={school}
                              index={index}
                              isCompared={compareList.some((s) => s.id === school.id)}
                              onToggleCompare={() => toggleCompare(school)}
                              onShortlistUpdate={onShortlistUpdate}
                            />
                          ))}
                        </div>
                        {meta && page < meta.totalPages && (
                          <div className="mt-8 text-center">
                            <Button variant="outline" onClick={loadMore} disabled={loading}>
                              {loading ? "Loading..." : `Load More (${meta.count - results.length} remaining)`}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {user && (
              <TabsContent value="pathway" className="mt-0">
                <div className="py-8">
                  <PathwayRecommendations onShortlistUpdate={onShortlistUpdate} />
                </div>
              </TabsContent>
            )}

            {user && (
              <TabsContent value="shortlist" className="mt-0">
                <div className="py-8">
                  <MySchoolShortlist 
                    selections={shortlist} 
                    onUpdate={onShortlistUpdate}
                  />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <ComparisonDrawer
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        schools={compareList}
      />
    </div>
  );
}

export default function SchoolsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-64 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    }>
      <SchoolsContent />
    </Suspense>
  );
}
6.2 School Detail Page (Pathway-Connected)
Create file: app/schools/[id]/page.tsx
TypeScript
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, MapPin, GraduationCap, Home, Users, 
  Share2, Heart, ExternalLink, Sparkles, BookmarkPlus, BookmarkCheck
} from "lucide-react";
import Link from "next/link";
import { CLUSTER_LABELS, GENDER_ICONS, ACCOMMODATION_ICONS } from "@/lib/schools-data";
import { AddToShortlistButton } from "@/components/schools/add-to-shortlist-button";

interface PageProps {
  params: { id: string };
}

export default async function SchoolDetailPage({ params }: PageProps) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch school with related data
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/schools/${params.id}`, {
    headers: user ? { cookie: "" } : {},
  });
  
  if (!res.ok) {
    notFound();
  }
  
  const { data: school, relatedPathways, isSelected, selectionId } = await res.json();

  const clusterInfo = CLUSTER_LABELS[school.cluster_type];
  const shareText = `${school.name} — ${clusterInfo?.label} School in ${school.county}. Found on ElimuX!`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/schools" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to search
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className={clusterInfo?.color}>{clusterInfo?.label}</Badge>
                <Badge variant="outline">{school.cluster_type}</Badge>
                {relatedPathways && relatedPathways.length > 0 && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Career Pathway Match
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{school.name}</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {school.sub_county}, {school.county} • {school.region}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Share2 className="w-4 h-4" />
                </a>
              </Button>
              <AddToShortlistButton 
                schoolId={school.id} 
                isSelected={isSelected} 
                selectionId={selectionId}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">School Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={<GraduationCap className="w-5 h-5" />} label="School Type" value={school.school_type} />
                  <InfoItem icon={<span className="text-xl">{GENDER_ICONS[school.gender]}</span>} label="Gender" value={school.gender} />
                  <InfoItem icon={<Home className="w-5 h-5" />} label="Accommodation" value={school.accommodation_type} />
                  <InfoItem icon={<Users className="w-5 h-5" />} label="Sub-County" value={school.sub_county} />
                </div>
              </CardContent>
            </Card>

            {/* Related Pathways Section */}
            {relatedPathways && relatedPathways.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Recommended Career Pathways
                  </h2>
                  <div className="space-y-3">
                    {relatedPathways.map((mapping: any) => (
                      <div key={mapping.pathway.id} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <span className="text-2xl">{mapping.pathway.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{mapping.pathway.name}</h4>
                          <p className="text-sm text-gray-600">{mapping.pathway.description}</p>
                          {mapping.reason && (
                            <p className="text-xs text-purple-700 mt-1">{mapping.reason}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Match: {mapping.relevance_score}/10
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Official Codes</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">KNEC Code:</span>
                    <p className="font-mono font-medium">{school.knec_code || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">UIC Code:</span>
                    <p className="font-mono font-medium">{school.uic_code || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Actions</h3>
                <div className="space-y-2">
                  <AddToShortlistButton 
                    schoolId={school.id} 
                    isSelected={isSelected} 
                    selectionId={selectionId}
                    fullWidth
                  />
                  <Button className="w-full" variant="outline" asChild>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share on WhatsApp
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">About {clusterInfo?.label} Schools</h3>
                <p className="text-sm text-gray-600">
                  {clusterInfo?.description}. These schools are part of the official 
                  Ministry of Education selection list for Kenyan students.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Next Steps</h3>
                <div className="space-y-2 text-sm">
                  <Link href="/pathways" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Sparkles className="w-4 h-4" />
                    Take Career Pathway Assessment
                  </Link>
                  <Link href="/schools?tab=shortlist" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <Heart className="w-4 h-4" />
                    View My School Shortlist
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
7. COMPONENTS
7.1 AI Search Bar
Create file: components/schools/ai-search-bar.tsx
TypeScript
"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Mic, X, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  "girls boarding C1 in Nandi",
  "boys schools in Rift Valley",
  "all C1 schools in Kiambu",
  "mixed boarding schools in Nairobi",
  "national schools in Western",
];

export function AISearchBar({ 
  initialValue = "", 
  onSearch, 
  isLoading 
}: { 
  initialValue: string; 
  onSearch: (query: string) => void;
  isLoading: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSuggestionIndex((prev) => (prev + 1) % SUGGESTIONS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported in this browser");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setValue(transcript);
      onSearch(transcript);
    };
    recognition.start();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Try: "${SUGGESTIONS[suggestionIndex]}"`}
            className="w-full pl-12 pr-24 py-6 text-lg rounded-full border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow-sm"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => {
                  setValue("");
                  inputRef.current?.focus();
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleVoiceSearch}
            >
              <Mic className="w-4 h-4 text-gray-500" />
            </Button>
            <Button type="submit" disabled={isLoading} className="h-9 px-4 rounded-full">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {SUGGESTIONS.slice(0, 3).map((s) => (
          <button
            key={s}
            onClick={() => {
              setValue(s);
              onSearch(s);
            }}
            className="text-xs bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-full transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
7.2 School Card (with Shortlist Integration)
Create file: components/schools/school-card.tsx
TypeScript
"use client";

import { SeniorSchool, CLUSTER_LABELS, GENDER_ICONS, ACCOMMODATION_ICONS } from "@/lib/schools-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, ExternalLink, Heart, BookmarkPlus } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface SchoolCardProps {
  school: SeniorSchool;
  index: number;
  isCompared: boolean;
  onToggleCompare: () => void;
  onShortlistUpdate?: () => void;
  showPathwayBadge?: string;
}

export function SchoolCard({ 
  school, 
  index, 
  isCompared, 
  onToggleCompare, 
  onShortlistUpdate,
  showPathwayBadge 
}: SchoolCardProps) {
  const cluster = CLUSTER_LABELS[school.cluster_type];
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToShortlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    
    try {
      const res = await fetch("/api/schools/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id: school.id }),
      });
      
      if (res.ok) {
        toast({ title: "Added to shortlist", description: school.name });
        onShortlistUpdate?.();
      } else if (res.status === 409) {
        toast({ title: "Already in shortlist", variant: "default" });
      } else {
        toast({ title: "Failed to add", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 hover:-translate-y-1"
        style={{ borderTopColor: school.cluster_type === "C1" ? "#f59e0b" : "#6b7280" }}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={cluster?.color}>{cluster?.label}</Badge>
              {showPathwayBadge && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                  {showPathwayBadge}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <Checkbox checked={isCompared} onCheckedChange={onToggleCompare} className="h-4 w-4" />
                Compare
              </label>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
            {school.name}
          </h3>

          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{school.sub_county}, {school.county}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <span className="text-xl block mb-0.5">{GENDER_ICONS[school.gender]}</span>
              <span className="text-xs text-gray-600 font-medium">{school.gender}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <span className="text-xl block mb-0.5">{ACCOMMODATION_ICONS[school.accommodation_type]}</span>
              <span className="text-xs text-gray-600 font-medium">{school.accommodation_type}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/schools/${school.id}`}>
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Details
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleAddToShortlist}
              disabled={isAdding}
              className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
            >
              <BookmarkPlus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
7.3 Add to Shortlist Button
Create file: components/schools/add-to-shortlist-button.tsx
TypeScript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AddToShortlistButtonProps {
  schoolId: string;
  isSelected: boolean;
  selectionId: string | null;
  fullWidth?: boolean;
}

export function AddToShortlistButton({ 
  schoolId, 
  isSelected, 
  selectionId,
  fullWidth = false 
}: AddToShortlistButtonProps) {
  const [selected, setSelected] = useState(isSelected);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async () => {
    setLoading(true);
    
    try {
      if (selected && selectionId) {
        // Remove from shortlist
        const res = await fetch(`/api/schools/selections?id=${selectionId}`, {
          method: "DELETE",
        });
        
        if (res.ok) {
          setSelected(false);
          toast({ title: "Removed from shortlist" });
        } else {
          toast({ title: "Failed to remove", variant: "destructive" });
        }
      } else {
        // Add to shortlist
        const res = await fetch("/api/schools/selections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ school_id: schoolId }),
        });
        
        if (res.ok) {
          setSelected(true);
          toast({ title: "Added to shortlist" });
        } else if (res.status === 409) {
          toast({ title: "Already in shortlist" });
          setSelected(true);
        } else {
          toast({ title: "Failed to add", variant: "destructive" });
        }
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={selected ? "default" : "outline"}
      className={fullWidth ? "w-full" : ""}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : selected ? (
        <BookmarkCheck className="w-4 h-4 mr-2" />
      ) : (
        <BookmarkPlus className="w-4 h-4 mr-2" />
      )}
      {selected ? "Saved" : "Save to Shortlist"}
    </Button>
  );
}
7.4 Pathway Recommendations Panel
Create file: components/schools/pathway-recommendations.tsx
TypeScript
"use client";

import { useEffect, useState } from "react";
import { SeniorSchool, CareerPathway, PathwayRecommendation } from "@/lib/schools-data";
import { SchoolCard } from "./school-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface PathwayRecommendationsProps {
  onShortlistUpdate?: () => void;
}

export function PathwayRecommendations({ onShortlistUpdate }: PathwayRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PathwayRecommendation[]>([]);
  const [pathway, setPathway] = useState<CareerPathway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch("/api/schools/pathway-recommendations");
      const json = await res.json();
      
      if (json.error) {
        setError(json.error);
      } else {
        setRecommendations(json.recommendations || []);
        setPathway(json.pathway || null);
      }
    } catch (err) {
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !pathway) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Active Career Pathway
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Complete your career pathway assessment to see AI-recommended schools 
          based on your interests and academic profile.
        </p>
        <Button asChild>
          <Link href="/pathways">
            Take Pathway Assessment
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pathway Header */}
      <Card className="border-l-4" style={{ borderLeftColor: pathway.color }}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{pathway.icon}</span>
                <Badge style={{ backgroundColor: pathway.color + "20", color: pathway.color, borderColor: pathway.color + "40" }}>
                  Your Pathway
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{pathway.name}</h2>
              <p className="text-gray-600 mt-1">{pathway.description}</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/pathways">
                <BookOpen className="w-4 h-4 mr-2" />
                Review Pathway
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-gray-500">Recommended regions:</span>
            {pathway.recommended_regions?.map((r) => (
              <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Recommended Schools for Your Pathway
          </h3>
          <span className="text-sm text-gray-500">{recommendations.length} schools match</span>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No matching schools found for your pathway yet.</p>
            <p className="text-sm text-gray-400 mt-1">Try the Discover tab to search all schools.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <SchoolCard
                key={rec.school.id}
                school={rec.school}
                index={index}
                isCompared={false}
                onToggleCompare={() => {}}
                onShortlistUpdate={onShortlistUpdate}
                showPathwayBadge="Pathway Match"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
7.5 My School Shortlist
Create file: components/schools/my-school-shortlist.tsx
TypeScript
"use client";

import { StudentSchoolSelection } from "@/lib/schools-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Trash2, ArrowUp, ArrowDown, 
  GraduationCap, Share2, Download 
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

interface MySchoolShortlistProps {
  selections: StudentSchoolSelection[];
  onUpdate: () => void;
}

export function MySchoolShortlist({ selections, onUpdate }: MySchoolShortlistProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleRemove = async (selectionId: string) => {
    try {
      const res = await fetch(`/api/schools/selections?id=${selectionId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast({ title: "Removed from shortlist" });
        onUpdate();
      } else {
        toast({ title: "Failed to remove", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const shareList = () => {
    const text = selections.map((s, i) => 
      `${i + 1}. ${s.school?.name} (${s.school?.county}) — ${s.school?.cluster_type}`
    ).join("\n");
    
    const fullText = `My School Shortlist from ElimuX:\n\n${text}\n\nView more at elimux.ke/schools`;
    window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, "_blank");
  };

  if (selections.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Shortlist is Empty</h3>
        <p className="text-gray-500 mb-6">
          Start discovering schools and save your favorites here for comparison and sharing.
        </p>
        <Button asChild>
          <Link href="/schools">Discover Schools</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My School Shortlist</h2>
          <p className="text-sm text-gray-500">{selections.length} schools saved</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={shareList}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {selections.map((selection, index) => (
          <Card key={selection.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center w-10 h-10 bg-blue-50 rounded-lg flex-shrink-0">
                  <span className="text-lg font-bold text-blue-600">{index + 1}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        <Link href={`/schools/${selection.school_id}`} className="hover:text-blue-600">
                          {selection.school?.name}
                        </Link>
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{selection.school?.sub_county}, {selection.school?.county}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {selection.school?.cluster_type}
                        </Badge>
                        <span>•</span>
                        <span>{selection.school?.gender}</span>
                        <span>•</span>
                        <span>{selection.school?.accommodation_type}</span>
                      </div>
                      {selection.pathway && (
                        <div className="mt-2">
                          <Badge className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {selection.pathway.icon} {selection.pathway.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemove(selection.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
7.6 Filter Panel
Create file: components/schools/filter-panel.tsx
TypeScript
"use client";

import { useState } from "react";
import { SchoolSearchFilters, parseSchoolQuery, REGIONS, COUNTIES } from "@/lib/schools-data";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface FilterPanelProps {
  onFilterChange: (query: string) => void;
  currentQuery: string;
}

export function FilterPanel({ onFilterChange, currentQuery }: FilterPanelProps) {
  const currentFilters = parseSchoolQuery(currentQuery);
  
  const [selectedCluster, setSelectedCluster] = useState<string>(currentFilters.cluster || "");
  const [selectedGender, setSelectedGender] = useState<string>(currentFilters.gender || "");
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>(currentFilters.accommodation || "");
  const [selectedRegion, setSelectedRegion] = useState<string>(currentFilters.region || "");
  const [selectedCounty, setSelectedCounty] = useState<string>(currentFilters.county || "");

  const buildQuery = (
    cluster: string,
    gender: string,
    accommodation: string,
    region: string,
    county: string
  ) => {
    const parts: string[] = [];
    if (cluster) parts.push(cluster.toLowerCase());
    if (gender) parts.push(gender.toLowerCase());
    if (accommodation) parts.push(accommodation.toLowerCase());
    if (county) parts.push(`in ${county.toLowerCase()}`);
    else if (region) parts.push(`in ${region.toLowerCase()}`);
    return parts.join(" ");
  };

  const applyFilters = () => {
    const q = buildQuery(selectedCluster, selectedGender, selectedAccommodation, selectedRegion, selectedCounty);
    onFilterChange(q);
  };

  const clearFilters = () => {
    setSelectedCluster("");
    setSelectedGender("");
    setSelectedAccommodation("");
    setSelectedRegion("");
    setSelectedCounty("");
    onFilterChange("");
  };

  const hasFilters = selectedCluster || selectedGender || selectedAccommodation || selectedRegion || selectedCounty;

  const regionCountyMap: Record<string, string[]> = {
    "Central": ["Kiambu", "Kirinyaga", "Muranga", "Nyeri", "Nyandarua"],
    "Coast": ["Kilifi", "Kwale", "Lamu", "Mombasa", "Taita Taveta", "Tana River"],
    "Eastern": ["Embu", "Isiolo", "Kitui", "Machakos", "Makueni", "Marsabit", "Meru", "Tharaka Nithi"],
    "Nairobi": ["Nairobi"],
    "North Eastern": ["Garissa", "Mandera", "Wajir"],
    "Nyanza": ["Homa Bay", "Kisii", "Kisumu", "Migori", "Nyamira", "Siaya"],
    "Rift Valley": ["Baringo", "Bomet", "Elgeyo Marakwet", "Kajiado", "Kericho", "Laikipia", "Nakuru", "Nandi", "Narok", "Samburu", "Trans Nzoia", "Turkana", "Uasin Gishu", "West Pokot"],
    "Western": ["Bungoma", "Busia", "Kakamega", "Vihiga"],
  };

  const availableCounties = selectedRegion ? regionCountyMap[selectedRegion] || [] : COUNTIES;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">School Level</h4>
        <div className="space-y-2">
          {[
            { key: "C1", label: "National (C1)", color: "bg-amber-100 text-amber-800" },
            { key: "C2", label: "Extra County (C2)", color: "bg-slate-100 text-slate-400", disabled: true },
            { key: "C3", label: "County (C3)", color: "bg-orange-100 text-orange-400", disabled: true },
            { key: "C4", label: "Sub-County (C4)", color: "bg-blue-100 text-blue-400", disabled: true },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => !item.disabled && setSelectedCluster(selectedCluster === item.key ? "" : item.key)}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCluster === item.key 
                  ? "bg-blue-50 border border-blue-200 text-blue-700" 
                  : "hover:bg-gray-50 border border-transparent"
              } ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className={item.disabled ? "text-gray-400" : "text-gray-700"}>{item.label}</span>
              {item.disabled && <Badge variant="outline" className="text-[10px]">Soon</Badge>}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Gender</h4>
        <div className="flex flex-wrap gap-2">
          {["Boys", "Girls", "Mixed"].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(selectedGender === g ? "" : g)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedGender === g
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Accommodation</h4>
        <div className="flex flex-wrap gap-2">
          {["Boarding", "Day", "Mixed"].map((a) => (
            <button
              key={a}
              onClick={() => setSelectedAccommodation(selectedAccommodation === a ? "" : a)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedAccommodation === a
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Region</h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {REGIONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={selectedRegion === r} onCheckedChange={() => setSelectedRegion(selectedRegion === r ? "" : r)} />
              <span className="text-gray-700">{r}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">County</h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {availableCounties.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={selectedCounty === c} onCheckedChange={() => setSelectedCounty(selectedCounty === c ? "" : c)} />
              <span className="text-gray-700">{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 space-y-2">
        <Button className="w-full" onClick={applyFilters}>Apply Filters</Button>
        {hasFilters && (
          <Button variant="ghost" className="w-full" onClick={clearFilters}>Clear All</Button>
        )}
      </div>
    </div>
  );
}
7.7 Comparison Drawer
Create file: components/schools/comparison-drawer.tsx
TypeScript
"use client";

import { SeniorSchool, CLUSTER_LABELS, GENDER_ICONS, ACCOMMODATION_ICONS } from "@/lib/schools-data";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schools: SeniorSchool[];
}

export function ComparisonDrawer({ isOpen, onClose, schools }: ComparisonDrawerProps) {
  if (schools.length < 2) return null;

  const attributes = [
    { label: "Cluster", key: "cluster_type", render: (s: SeniorSchool) => (
      <Badge className={CLUSTER_LABELS[s.cluster_type]?.color}>{s.cluster_type}</Badge>
    )},
    { label: "Region", key: "region" },
    { label: "County", key: "county" },
    { label: "Sub-County", key: "sub_county" },
    { label: "Gender", key: "gender", render: (s: SeniorSchool) => (
      <span>{GENDER_ICONS[s.gender]} {s.gender}</span>
    )},
    { label: "Accommodation", key: "accommodation_type", render: (s: SeniorSchool) => (
      <span>{ACCOMMODATION_ICONS[s.accommodation_type]} {s.accommodation_type}</span>
    )},
    { label: "School Type", key: "school_type" },
    { label: "KNEC Code", key: "knec_code" },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] sm:h-[600px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>School Comparison ({schools.length})</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-gray-500 w-32">Attribute</th>
                {schools.map((s) => (
                  <th key={s.id} className="p-3 text-left min-w-[200px]">
                    <div className="font-bold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.county}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.label} className="border-t border-gray-100">
                  <td className="p-3 text-sm font-medium text-gray-600">{attr.label}</td>
                  {schools.map((s) => (
                    <td key={s.id} className="p-3 text-sm">
                      {attr.render ? attr.render(s) : (
                        <span className="text-gray-900">{(s as any)[attr.key] || "N/A"}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
8. PATHWAY COMPLETION CTA (Link to Schools)
Add this CTA to the end of your existing /pathways result/completion page:
TypeScript
// Add to the bottom of your pathway result page
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight } from "lucide-react";
import Link from "next/link";

<div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    🎯 Ready to Find Your School?
  </h3>
  <p className="text-gray-600 mb-4">
    Based on your {pathwayName} pathway, we've curated the best matching schools for you.
  </p>
  <Button size="lg" asChild>
    <Link href={`/schools?tab=pathway`}>
      <GraduationCap className="w-5 h-5 mr-2" />
      View Recommended Schools
      <ArrowRight className="w-4 h-4 ml-2" />
    </Link>
  </Button>
</div>
9. NAVIGATION INTEGRATION
Add to main navigation:
TypeScript
{
  label: "Schools",
  href: "/schools",
  icon: <GraduationCap className="w-4 h-4" />,
  description: "Find C1-C4 schools with AI search"
}
Homepage CTA:
TypeScript
<Link href="/schools">
  <Button size="lg" className="gap-2">
    <GraduationCap className="w-5 h-5" />
    Discover Schools
    <Badge variant="secondary" className="ml-1">New</Badge>
  </Button>
</Link>
10. DEPLOYMENT CHECKLIST
Database: Run SQL in Supabase → confirm all 5 tables + indexes
Data:
Run python scripts/ingest-c1-schools.py → 180-210 C1 records
Run python scripts/seed-pathways.py → 8 pathway records
Build: npm run build → 0 errors, 0 warnings
Local Test:
/schools → AI search works: "girls boarding c1 in nandi"
/schools?tab=pathway → (login required) shows pathway recommendations
/schools?tab=shortlist → (login required) shows saved schools
School detail → "Save to Shortlist" button works
Shortlist → Share via WhatsApp works
Commit: git add -A && git commit -m "feat: C1 school discovery + career pathways integration"
Push: git push origin main
Production Verify: https://www.elimux.ke/schools → test all 3 tabs
Analytics: Confirm /schools and /schools/[id] page views tracked
11. PHASE 2 ROADMAP
[ ] Ingest C2, C3, C4 PDF data
[ ] Enable C2-C4 cluster filters (remove "Soon" badge)
[ ] Auto-generate pathway_school_mappings via AI matching
[ ] School performance data (KNEC results)
[ ] Map view (county-level)
[ ] Student shortlist export (PDF for Ministry selection forms)
[ ] Parent/teacher view of student shortlist (read-only sharing)