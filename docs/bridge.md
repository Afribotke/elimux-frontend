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
plain

### END COPY ← `docs/bridge-051-corrections.md`

---

**What this achieves:**

- The old KJSA wizard stays buried — no integration, no cleanup risk
- The new 8-pathway system is fully functional: pick a path → see matched schools → save to shortlist
- Every import path is corrected so builds pass
- `useAuth` points to the existing hook the app already uses
- The `/pathways` page replaces the old "Coming Soon" wizard with a clean 8-card selector that takes 10 seconds to use

**Tell Claude:** Execute Cycle 051 bridge.md first, then immediately apply the correction script above. Build once at the end.
txt
# CYCLE 051 + 051-CO

TXT
9.16 KB
Edit
Copy
Share
Add consent page, redirect unauthenticated users, skip E2E, rely on build checks
Do not commit or deploy yet. The consent flow deletion is a compliance liability — a platform serving Kenyan minors cannot ship without the Data Protection Act parental consent gate. We fix that first, then commit everything in one go.
Here is the single instruction block for Claude:
START COPY → docs/bridge-051-consent-restore.md
Markdown
Copy
Code
Preview
# CYCLE 051-CONSENT-RESTORE — Re-add Kenya Data Protection parental consent flow

## PROBLEM
The new `/pathways` page (8-card pathway selector) overwrote the existing `/pathways` landing page that contained:
- Age-gate (parent vs. learner selection)
- Kenya Data Protection Act 2019 parental consent flow for minors

This compliance content must be restored before deployment.

## SOLUTION
Move the pathway selector to `/pathways/select`. Restore the consent/age-gate landing page at `/pathways`. Flow:

1. Unauthenticated user visits `/pathways` → sees age-gate + consent flow (as before)
2. Authenticated adult (parent/teacher) → can browse pathways or proceed to `/pathways/select`
3. Authenticated minor (student) → if consent not on record, sees consent requirement; if consent on record, proceeds to `/pathways/select`
4. After selecting a pathway at `/pathways/select` → redirects to `/schools?tab=pathway`

## FILES TO CREATE/MODIFY

### 1. Rename existing `/pathways` page
Rename `src/app/pathways/page.tsx` → `src/app/pathways/select/page.tsx`

Update the export default name from `PathwaysPage` to `PathwaySelectorPage` (optional, for clarity).

In the `handleSelect` function, the redirect stays as:
```typescript
setTimeout(() => router.push("/schools?tab=pathway"), 1500);
2. Restore consent landing page
Create src/app/pathways/page.tsx with the PREVIOUS consent flow content that was there before Cycle 051 overwrote it.
If the previous content is not recoverable from git history, build this minimal replacement:
TypeScript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, GraduationCap, ArrowRight, CheckCircle } from "lucide-react";

export default function PathwaysLandingPage() {
  const router = useRouter();
  const [role, setRole] = useState<"learner" | "parent" | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleProceed = () => {
    if (role === "parent") {
      router.push("/pathways/select");
    } else if (role === "learner" && consentGiven) {
      router.push("/pathways/select");
    }
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
3. Update navigation
In src/components/layout/UnifiedNavBar.tsx (or wherever nav links live), ensure the "Career Pathways" link points to /pathways (the consent landing), NOT /pathways/select.
4. Update Schools detail page CTA
In src/app/schools/[id]/page.tsx, the "Next Steps" card links to /pathways. This should stay as /pathways (so unauthenticated users hit the consent gate first).
5. Build & verify
npm run build → 0 errors
npx tsc --noEmit → 0 errors
Confirm /pathways renders the consent/age-gate
Confirm /pathways/select renders the 8 pathway cards
Confirm selecting a pathway still redirects to /schools?tab=pathway
DEPLOYMENT CHECKLIST (after this fix)
[ ] Build passes (0 errors)
[ ] Typecheck passes (0 errors)
[ ] /pathways shows consent/age-gate
[ ] /pathways/select shows 8 pathway cards
[ ] /schools search works: "girls boarding c1 in nandi"
[ ] /schools?tab=pathway shows recommendations after pathway selection
[ ] /schools?tab=shortlist shows saved schools
[ ] School detail page has Save + Share buttons
[ ] Supabase has 204 C1 schools + 8 pathways
[ ] Commit: git add -A && git commit -m "feat: school discovery C1 + career pathways + consent flow"
[ ] Push: git push origin main
[ ] Production: https://www.elimux.ke/schools verified
