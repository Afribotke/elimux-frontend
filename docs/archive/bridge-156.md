AUDIT ACKNOWLEDGMENT
Claude's audit is 100% correct. My Cycle 155 brief was built against the wrong architecture. The real system:
Backend: elimux-backend Express app (src/routes/ai-search.ts), NOT a Next.js API route
Institutions table: Has city (which = county for Kenyan rows), NOT county/town columns
Search pipeline: LLM intent extraction (Claude) → keyword scoring → Supabase query. Location must slot into this pipeline, not replace it
Frontend: Complex handleSearch with AbortController, careerGoal, separate programs/institutions arrays. Changes must be additive
I approve Claude's adapted plan. Proceed on that basis.
PART 1 — Backend Location Extractor
File: elimux-backend/src/lib/locationExtractor.ts
Action: Create new file.
TypeScript
// ============================================================
// elimux-backend/src/lib/locationExtractor.ts
// Extracts Kenyan county/constituency/town from free-text queries
// ============================================================

import { supabase } from "./supabase";

export interface ExtractedLocation {
  county?: string;
  town?: string;
  confidence: "high" | "medium" | "low";
}

const LOCATION_ALIASES: Record<string, { county: string; town?: string }> = {
  nairobi: { county: "Nairobi" },
  nrb: { county: "Nairobi" },
  cbd: { county: "Nairobi", town: "Nairobi CBD" },
  westlands: { county: "Nairobi", town: "Westlands" },
  kilimani: { county: "Nairobi", town: "Kilimani" },
  karen: { county: "Nairobi", town: "Karen" },
  eastleigh: { county: "Nairobi", town: "Eastleigh" },
  kibera: { county: "Nairobi", town: "Kibera" },
  umoja: { county: "Nairobi", town: "Umoja" },
  donholm: { county: "Nairobi", town: "Donholm" },
  kayole: { county: "Nairobi", town: "Kayole" },
  pipeline: { county: "Nairobi", town: "Pipeline" },
  kasarani: { county: "Nairobi", town: "Kasarani" },
  ruiru: { county: "Kiambu", town: "Ruiru" },
  juja: { county: "Kiambu", town: "Juja" },
  thika: { county: "Kiambu", town: "Thika" },
  kikuyu: { county: "Kiambu", town: "Kikuyu" },
  limuru: { county: "Kiambu", town: "Limuru" },
  kabete: { county: "Kiambu", town: "Kabete" },
  mombasa: { county: "Mombasa" },
  msa: { county: "Mombasa" },
  nyali: { county: "Mombasa", town: "Nyali" },
  bamburi: { county: "Mombasa", town: "Bamburi" },
  kisauni: { county: "Mombasa", town: "Kisauni" },
  likoni: { county: "Mombasa", town: "Likoni" },
  kisumu: { county: "Kisumu" },
  ksm: { county: "Kisumu" },
  ahero: { county: "Kisumu", town: "Ahero" },
  muhoroni: { county: "Kisumu", town: "Muhoroni" },
  sondu: { county: "Kisumu", town: "Sondu" },
  nakuru: { county: "Nakuru" },
  nax: { county: "Nakuru" },
  naivasha: { county: "Nakuru", town: "Naivasha" },
  gilgil: { county: "Nakuru", town: "Gilgil" },
  eldoret: { county: "Uasin Gishu", town: "Eldoret" },
  eld: { county: "Uasin Gishu", town: "Eldoret" },
  machakos: { county: "Machakos", town: "Machakos" },
  athiriver: { county: "Machakos", town: "Athi River" },
  "athi river": { county: "Machakos", town: "Athi River" },
  syokimau: { county: "Machakos", town: "Syokimau" },
  mlolongo: { county: "Machakos", town: "Mlolongo" },
  kitengela: { county: "Kajiado", town: "Kitengela" },
  ongata: { county: "Kajiado", town: "Ongata Rongai" },
  "ongata rongai": { county: "Kajiado", town: "Ongata Rongai" },
  rongai: { county: "Kajiado", town: "Ongata Rongai" },
  ngong: { county: "Kajiado", town: "Ngong" },
  kajiado: { county: "Kajiado", town: "Kajiado" },
  kakamega: { county: "Kakamega", town: "Kakamega" },
  mumias: { county: "Kakamega", town: "Mumias" },
  butere: { county: "Kakamega", town: "Butere" },
  bungoma: { county: "Bungoma", town: "Bungoma" },
  webuye: { county: "Bungoma", town: "Webuye" },
  kimilili: { county: "Bungoma", town: "Kimilili" },
  busia: { county: "Busia", town: "Busia" },
  siaya: { county: "Siaya", town: "Siaya" },
  bondo: { county: "Siaya", town: "Bondo" },
  vihiga: { county: "Vihiga", town: "Vihiga" },
  luanda: { county: "Vihiga", town: "Luanda" },
  homabay: { county: "Homa Bay", town: "Homa Bay" },
  "homa bay": { county: "Homa Bay", town: "Homa Bay" },
  migori: { county: "Migori", town: "Migori" },
  rongo: { county: "Migori", town: "Rongo" },
  awendo: { county: "Migori", town: "Awendo" },
  nyamira: { county: "Nyamira", town: "Nyamira" },
  kisii: { county: "Kisii", town: "Kisii" },
  ogembo: { county: "Kisii", town: "Ogembo" },
  bomet: { county: "Bomet", town: "Bomet" },
  kericho: { county: "Kericho", town: "Kericho" },
  kapsabet: { county: "Nandi", town: "Kapsabet" },
  kitale: { county: "Trans Nzoia", town: "Kitale" },
  kapenguria: { county: "West Pokot", town: "Kapenguria" },
  lodwar: { county: "Turkana", town: "Lodwar" },
  maralal: { county: "Samburu", town: "Maralal" },
  nanyuki: { county: "Laikipia", town: "Nanyuki" },
  nyahururu: { county: "Laikipia", town: "Nyahururu" },
  kabarnet: { county: "Baringo", town: "Kabarnet" },
  iten: { county: "Elgeyo Marakwet", town: "Iten" },
  narok: { county: "Narok", town: "Narok" },
  kilgoris: { county: "Narok", town: "Kilgoris" },
  nyeri: { county: "Nyeri", town: "Nyeri" },
  karatina: { county: "Nyeri", town: "Karatina" },
  othaya: { county: "Nyeri", town: "Othaya" },
  embu: { county: "Embu", town: "Embu" },
  runyenjes: { county: "Embu", town: "Runyenjes" },
  meru: { county: "Meru", town: "Meru" },
  nkubu: { county: "Meru", town: "Nkubu" },
  maua: { county: "Meru", town: "Maua" },
  muranga: { county: "Muranga", town: "Muranga" },
  kangema: { county: "Muranga", town: "Kangema" },
  kerugoya: { county: "Kirinyaga", town: "Kerugoya" },
  kutus: { county: "Kirinyaga", town: "Kutus" },
  wote: { county: "Makueni", town: "Wote" },
  kitui: { county: "Kitui", town: "Kitui" },
  mwingi: { county: "Kitui", town: "Mwingi" },
  makueni: { county: "Makueni", town: "Makueni" },
  kilifi: { county: "Kilifi", town: "Kilifi" },
  malindi: { county: "Kilifi", town: "Malindi" },
  watamu: { county: "Kilifi", town: "Watamu" },
  kwale: { county: "Kwale", town: "Kwale" },
  ukunda: { county: "Kwale", town: "Ukunda" },
  diani: { county: "Kwale", town: "Ukunda" },
  voi: { county: "Taita Taveta", town: "Voi" },
  wundanyi: { county: "Taita Taveta", town: "Wundanyi" },
  taveta: { county: "Taita Taveta", town: "Taveta" },
  lamu: { county: "Lamu", town: "Lamu" },
  hola: { county: "Tana River", town: "Hola" },
  garissa: { county: "Garissa", town: "Garissa" },
  wajir: { county: "Wajir", town: "Wajir" },
  mandera: { county: "Mandera", town: "Mandera" },
  marsabit: { county: "Marsabit", town: "Marsabit" },
  moyale: { county: "Marsabit", town: "Moyale" },
  isiolo: { county: "Isiolo", town: "Isiolo" },
};

const LOCATION_PREPOSITIONS = [
  "in", "at", "near", "around", "within", "close to", "next to",
  "located in", "based in", "situated in", "found in",
];

export async function extractLocationFromQuery(
  query: string
): Promise<ExtractedLocation | null> {
  if (!query || query.trim().length < 2) return null;

  const normalized = query.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  // Strategy 1: Hardcoded alias map (fastest, no DB call)
  for (const [alias, mapping] of Object.entries(LOCATION_ALIASES)) {
    const regex = new RegExp(
      `\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "i"
    );
    if (regex.test(normalized)) {
      return {
        county: mapping.county,
        town: mapping.town,
        confidence: "high",
      };
    }
  }

  // Strategy 2: Database fuzzy lookup against kenya_locations
  try {
    const { data: townMatch } = await supabase
      .from("kenya_locations")
      .select("county_name, town_name")
      .ilike("town_name", `%${normalized}%`)
      .limit(1)
      .maybeSingle();

    if (townMatch?.town_name) {
      return {
        county: townMatch.county_name,
        town: townMatch.town_name,
        confidence: "high",
      };
    }

    for (const word of words) {
      if (word.length < 3) continue;

      const { data: matches } = await supabase
        .from("kenya_locations")
        .select("county_name, town_name")
        .or(
          `county_name.ilike.%${word}%,town_name.ilike.%${word}%`
        )
        .limit(5);

      if (matches && matches.length > 0) {
        const townHit = matches.find(
          (m) => m.town_name?.toLowerCase() === word
        );
        if (townHit) {
          return {
            county: townHit.county_name,
            town: townHit.town_name,
            confidence: "high",
          };
        }
        return {
          county: matches[0].county_name,
          town: matches[0].town_name || undefined,
          confidence: "medium",
        };
      }
    }
  } catch (err) {
    console.error("Location extraction DB error:", err);
  }

  return null;
}

export function stripLocationFromQuery(
  query: string,
  location: ExtractedLocation
): string {
  let cleaned = query;
  const locationWords = [location.county, location.town].filter(
    Boolean
  ) as string[];

  for (const word of locationWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `\\b(${LOCATION_PREPOSITIONS.join("|")})?\\s*${escaped}\\b`,
      "gi"
    );
    cleaned = cleaned.replace(regex, "");
  }
  return cleaned.replace(/\s+/g, " ").trim();
}
PART 2 — Wire into Backend AI Search Route
File: elimux-backend/src/routes/ai-search.ts
Action: Modify existing route. Add imports at top, then wire location extraction into the search flow.
Add to imports at top of file:
TypeScript
import {
  extractLocationFromQuery,
  stripLocationFromQuery,
} from "../lib/locationExtractor";
In the route handler, BEFORE the LLM intent call, add:
TypeScript
// ── LOCATION EXTRACTION (runs before LLM intent) ──
const location = await extractLocationFromQuery(query);

// If location detected, strip it from query before sending to LLM
// so "CPA in Nairobi" becomes "CPA" for keyword extraction
const queryForLLM = location
  ? stripLocationFromQuery(query, location)
  : query;
Then change the LLM call to use queryForLLM instead of query:
TypeScript
// Change this line:
// const intent = await extractSearchIntent(query, interests, careerGoal);
// To this:
const intent = await extractSearchIntent(queryForLLM, interests, careerGoal);
In the programs query builder, AFTER existing filters but BEFORE .limit(), add:
TypeScript
// ── LOCATION FILTER (Kenya-specific) ──
if (location?.county) {
  programsQuery = programsQuery.ilike("county", location.county);
  if (location.town) {
    programsQuery = programsQuery.ilike("town", location.town);
  }
}
In the institutions query builder (optional, for institution-mode searches), add:
TypeScript
// For institution queries, filter by city (which = county for Kenyan rows)
if (location?.county) {
  institutionsQuery = institutionsQuery.ilike("city", location.county);
}
In the response JSON, add location_detected:
TypeScript
return res.json({
  success: true,
  data: {
    intent,
    programs,
    institutions,
    related_programs: relatedPrograms,
    ctas,
    meta,
    location_detected: location, // ← ADD THIS
  },
});
PART 3 — SQL Backfill (Run in Supabase Dashboard)
Action: Run this single SQL statement in Supabase SQL Editor.
sql
-- Backfill programs.county from institutions.city for Kenyan institutions
UPDATE programs p
SET county = i.city
FROM institutions i
WHERE p.institution_id = i.id
  AND i.country = 'Kenya'
  AND i.city IS NOT NULL
  AND p.county IS NULL;

-- Verify
SELECT COUNT(*) as backfilled FROM programs WHERE county IS NOT NULL;
Expected: ~12,738 rows updated (all Kenyan programs).
PART 4 — Frontend Type Update
File: elimux-frontend/src/lib/aiSearch.ts
Action: Add location_detected to the return type.
Find the interface/type for the AI search response (likely AISearchResult or similar) and add:
TypeScript
location_detected?: {
  county?: string;
  town?: string;
  confidence: string;
} | null;
PART 5 — Frontend Badge & Empty State (Additive Only)
File: elimux-frontend/src/app/ai-search/page.tsx
Action: Add state and UI additively. Do NOT replace existing handleSearch.
Add to state hooks (find existing useState declarations and add below):
tsx
const [locationDetected, setLocationDetected] = useState<{
  county?: string;
  town?: string;
  confidence: string;
} | null>(null);
In the existing handleSearch function, after receiving the API response, add:
tsx
// Inside handleSearch, after: const data = await runAISearch(...)
// Add this line:
setLocationDetected(data.location_detected || null);
Location badge — place ABOVE the programs grid (find where programs.length > 0 renders and add above):
tsx
{locationDetected && (
  <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl mb-6">
    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
    <span className="text-sm text-blue-800">
      Showing results for{" "}
      <strong>
        {locationDetected.town
          ? `${locationDetected.town}, ${locationDetected.county}`
          : locationDetected.county}
      </strong>
    </span>
    <button
      onClick={() => {
        setLocationDetected(null);
        // Re-run search without location context
        handleSearch(searchQuery);
      }}
      className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
    >
      <X className="w-3 h-3" />
      Search all of Kenya
    </button>
  </div>
)}
Add to imports (if not already present):
tsx
import { MapPin, X } from "lucide-react";
Location-aware empty state — find the existing empty state for programs and wrap it:
tsx
{programs.length === 0 && !loading && (
  <div className="text-center py-16">
    <MapPin className="w-14 h-14 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      {locationDetected
        ? `No courses found in ${locationDetected.county}`
        : "No courses found"}
    </h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">
      {locationDetected
        ? `We couldn't find any matching courses in ${locationDetected.town || locationDetected.county}. Try searching all of Kenya or a different location.`
        : "We couldn't find any courses matching your search. Try different keywords."}
    </p>
    {locationDetected && (
      <button
        onClick={() => {
          setLocationDetected(null);
          handleSearch(searchQuery);
        }}
        className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
      >
        Search all of Kenya
      </button>
    )}
  </div>
)}
EXECUTION ORDER
Execute in this exact sequence:
Step
Action
Repo
1
Create elimux-backend/src/lib/locationExtractor.ts
backend
2
Modify elimux-backend/src/routes/ai-search.ts (imports + 4 wiring points)
backend
3
Run SQL backfill in Supabase SQL Editor
Supabase
4
Update type in elimux-frontend/src/lib/aiSearch.ts
frontend
5
Add state + badge + empty state to elimux-frontend/src/app/ai-search/page.tsx
frontend
6
Build backend: cd elimux-backend && npm run build
backend
7
Build frontend: cd elimux-frontend && npm run build
frontend
8
Deploy backend (Railway)
backend
9
Deploy frontend (Vercel)
frontend
TEST CHECKLIST — All Must Pass Before Commit
#
Query
Expected
1
CPA courses in Nairobi
Only Nairobi programs; badge shows "Nairobi"
2
accounting certificate Kisumu
Only Kisumu programs; badge shows "Kisumu"
3
diploma in Thika
Kiambu/Thika programs; badge shows "Thika, Kiambu"
4
nursing course
All Kenya; NO location badge
5
CPA in Westlands
Only Westlands, Nairobi; badge shows "Westlands, Nairobi"
If any test fails, stop. Report the failure. Do not commit or deploy.
COMMIT (After All Tests Pass)
bash
# Backend
cd elimux-backend
git add -A
git commit -m "feat: AI search location intelligence — extract county/town from query, filter programs by location"
git push origin main

# Frontend
cd elimux-frontend
git add -A
git commit -m "feat: AI search location badge — show detected county/town, location-aware empty state"
git push origin main
Execute Steps 1–7 in order. Report back with build results and the 5 test outcomes.
