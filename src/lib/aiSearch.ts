const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface SearchIntent {
  keywords: string[]
  country: string | null
  category: string | null
  level: string | null
  maxBudget: number | null
}

export type InstitutionMode = 'academic' | 'skills'

export interface ExtractedLocation {
  county?: string
  town?: string
  confidence: 'high' | 'medium' | 'low'
}

export interface AISearchFilters {
  countryId?: string | null
  categoryId?: string | null
  level?: string | null
  maxBudget?: number | null
  institutionMode?: InstitutionMode | null
  // Set when re-running a search from the "Search all of Kenya" clear-location
  // button, so the backend doesn't just re-detect the same location from the
  // query text and put the filter right back.
  ignoreLocation?: boolean
}

export interface AISearchResult {
  intent: SearchIntent
  programs: any[]
  institutions: any[]
  location_detected?: ExtractedLocation | null
}

export async function runAISearch(
  query: string,
  interests: string[],
  careerGoal: string | null,
  filters: AISearchFilters = {},
  signal?: AbortSignal
): Promise<AISearchResult> {
  const res = await fetch(`${API_URL}/api/ai-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      interests,
      careerGoal,
      countryId: filters.countryId ?? null,
      categoryId: filters.categoryId ?? null,
      level: filters.level ?? null,
      maxBudget: filters.maxBudget ?? null,
      institutionMode: filters.institutionMode ?? null,
      ignoreLocation: filters.ignoreLocation ?? false,
    }),
    signal,
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `AI search failed (${res.status})`)
  }

  return json.data
}
