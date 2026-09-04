FILE 1 — lib/locationExtractor.ts
Action: Create new file at lib/locationExtractor.ts
TypeScript
// ============================================================
// lib/locationExtractor.ts
// Extracts county/constituency/town from free-text Kenyan queries
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export interface ExtractedLocation {
  county?: string;
  constituency?: string;
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
  query: string,
  supabase: SupabaseClient
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

  // Strategy 2: Database fuzzy lookup (catches any constituency/town in kenya_locations)
  try {
    // Try full query against town names first
    const { data: townMatch } = await supabase
      .from("kenya_locations")
      .select("county_name, constituency_name, town_name")
      .ilike("town_name", `%${normalized}%`)
      .limit(1)
      .maybeSingle();

    if (townMatch?.town_name) {
      return {
        county: townMatch.county_name,
        constituency: townMatch.constituency_name,
        town: townMatch.town_name,
        confidence: "high",
      };
    }

    // Word-by-word fallback
    for (const word of words) {
      if (word.length < 3) continue;

      const { data: matches } = await supabase
        .from("kenya_locations")
        .select("county_name, constituency_name, town_name")
        .or(
          `county_name.ilike.%${word}%,constituency_name.ilike.%${word}%,town_name.ilike.%${word}%`
        )
        .limit(5);

      if (matches && matches.length > 0) {
        const townHit = matches.find(
          (m) => m.town_name?.toLowerCase() === word
        );
        if (townHit) {
          return {
            county: townHit.county_name,
            constituency: townHit.constituency_name,
            town: townHit.town_name,
            confidence: "high",
          };
        }
        return {
          county: matches[0].county_name,
          constituency: matches[0].constituency_name,
          town: matches[0].town_name || undefined,
          confidence: "medium",
        };
      }
    }
  } catch (err) {
    // If DB lookup fails, return null (search continues without location filter)
    console.error("Location extraction DB error:", err);
  }

  return null;
}

export function stripLocationFromQuery(
  query: string,
  location: ExtractedLocation
): string {
  let cleaned = query;
  const locationWords = [
    location.county,
    location.constituency,
    location.town,
  ].filter(Boolean) as string[];

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
FILE 2 — app/api/ai-search/route.ts
Action: Replace entire file contents.
TypeScript
// ============================================================
// app/api/ai-search/route.ts
// AI-powered search with Kenyan location intelligence
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractLocationFromQuery,
  stripLocationFromQuery,
} from "@/lib/locationExtractor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, filters } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // STEP 1: Extract location from query
    const location = await extractLocationFromQuery(query, supabase);

    // STEP 2: Clean query for keyword search
    const searchQuery = location
      ? stripLocationFromQuery(query, location)
      : query;

    // STEP 3: Build base query
    let dbQuery = supabase
      .from("programs")
      .select(
        `
        *,
        institutions:institution_id (
          id, name, type, county, constituency, town, logo_url, rating, website
        )
      `
      );

    // STEP 4: Apply location filter (CRITICAL FIX)
    const locationConditions: string[] = [];
    if (location?.county) {
      locationConditions.push(`county.ilike.${location.county}`);
      locationConditions.push(`institutions.county.ilike.${location.county}`);
    }
    if (location?.town) {
      locationConditions.push(`town.ilike.${location.town}`);
      locationConditions.push(`institutions.town.ilike.${location.town}`);
    }
    if (locationConditions.length > 0) {
      dbQuery = dbQuery.or(locationConditions.join(","));
    }

    // STEP 5: Apply text search on cleaned query
    if (searchQuery.trim().length > 0) {
      dbQuery = dbQuery.or(
        `name.ilike.%${searchQuery}%,` +
          `description.ilike.%${searchQuery}%,` +
          `category.ilike.%${searchQuery}%,` +
          `institutions.name.ilike.%${searchQuery}%`
      );
    }

    // STEP 6: Apply additional filters
    if (filters?.category) {
      dbQuery = dbQuery.eq("category", filters.category);
    }
    if (filters?.level) {
      dbQuery = dbQuery.eq("level", filters.level);
    }
    if (filters?.institution_type) {
      dbQuery = dbQuery.eq("institutions.type", filters.institution_type);
    }

    // STEP 7: Execute
    const { data: programs, error } = await dbQuery
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("AI Search DB error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: programs || [],
      location_detected: location,
      original_query: query,
      cleaned_query: searchQuery,
      total_count: programs?.length || 0,
    });
  } catch (error) {
    console.error("AI Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
FILE 3 — Frontend AI Search Page
Action: Update your AI search results component. Add the imports, state, handler wiring, badge, and empty state shown below.
Add to imports:
tsx
import { MapPin, X } from "lucide-react";
import type { ExtractedLocation } from "@/lib/locationExtractor";
Add to state hooks:
tsx
const [locationDetected, setLocationDetected] = useState<ExtractedLocation | null>(null);
const [originalQuery, setOriginalQuery] = useState("");
In your search handler (the function that POSTs to /api/ai-search):
tsx
const handleSearch = async (query: string) => {
  setOriginalQuery(query);
  setLoading(true);

  try {
    const res = await fetch("/api/ai-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, filters: activeFilters }),
    });

    const data = await res.json();
    setResults(data.results || []);

    if (data.location_detected) {
      setLocationDetected(data.location_detected);
    } else {
      setLocationDetected(null);
    }
  } catch (err) {
    console.error("Search error:", err);
  } finally {
    setLoading(false);
  }
};
Location badge — place ABOVE the results grid:
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
        handleSearch(originalQuery);
      }}
      className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
    >
      <X className="w-3 h-3" />
      Search all of Kenya
    </button>
  </div>
)}
Empty state — replace existing empty state:
tsx
{results.length === 0 && !loading && (
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
          handleSearch(originalQuery);
        }}
        className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
      >
        Search all of Kenya
      </button>
    )}
  </div>
)}
FILE 4 — scripts/backfill-locations.ts
Action: Create new file at scripts/backfill-locations.ts
TypeScript
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfillLocations() {
  console.log("Fetching programs with institution data...");

  const { data: programs, error } = await supabase
    .from("programs")
    .select("id, institution_id, institutions:institution_id(county, constituency, town)");

  if (error) {
    console.error("Failed to fetch programs:", error);
    process.exit(1);
  }

  console.log(`Found ${programs?.length || 0} programs`);

  let updated = 0;
  let skipped = 0;

  for (const program of programs || []) {
    const institution = program.institutions as unknown as {
      county: string | null;
      constituency: string | null;
      town: string | null;
    } | null;

    if (!institution) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("programs")
      .update({
        county: institution.county,
        constituency: institution.constituency,
        town: institution.town,
      })
      .eq("id", program.id);

    if (updateError) {
      console.error(`Failed to update program ${program.id}:`, updateError);
    } else {
      updated++;
    }
  }

  console.log(`Backfill complete! Updated: ${updated}, Skipped: ${skipped}`);
}

backfillLocations();
EXECUTION ORDER
Execute these commands in sequence. Do not skip steps.
bash
# Step A: Create the extractor
# Paste FILE 1 into lib/locationExtractor.ts

# Step B: Replace the API route
# Paste FILE 2 into app/api/ai-search/route.ts

# Step C: Update frontend
# Paste FILE 3 snippets into your AI search page/component

# Step D: Create backfill script
# Paste FILE 4 into scripts/backfill-locations.ts

# Step E: Run backfill
npx tsx scripts/backfill-locations.ts

# Step F: Build
npm run build
TEST CHECKLIST — Verify Before Commit
Run these searches on the local dev server. All must pass.
#
Query
Expected Result
1
CPA courses in Nairobi
ONLY Nairobi programs; badge shows "Nairobi"
2
accounting certificate Kisumu
ONLY Kisumu programs; badge shows "Kisumu"
3
diploma in Thika
Kiambu/Thika programs; badge shows "Thika, Kiambu"
4
nursing course
ALL Kenya; NO location badge
5
CPA in Westlands
ONLY Westlands, Nairobi; badge shows "Westlands, Nairobi"
If any test fails, stop. Report the failure. Do not commit.
COMMIT
Only after all 5 tests pass:
bash
git add -A
git commit -m "feat: AI search location intelligence — 47 counties, 290 constituencies"
git push origin main
Execute Steps A–F in order. Report back with build result and the 5 test outcomes.