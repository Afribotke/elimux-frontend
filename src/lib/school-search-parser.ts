import type { SchoolSearchFilters } from '@/lib/schools-data';

const GENDER_WORDS: Record<string, 'Boys' | 'Girls' | 'Mixed'> = {
  boys: 'Boys', boy: 'Boys',
  girls: 'Girls', girl: 'Girls',
  mixed: 'Mixed', 'co-ed': 'Mixed', coed: 'Mixed',
};

const ACCOMMODATION_WORDS: Record<string, 'Boarding' | 'Day' | 'Both'> = {
  boarding: 'Boarding', boarder: 'Boarding',
  day: 'Day',
};

const REGIONS = ['rift valley', 'north eastern', 'nairobi', 'central', 'coast', 'eastern', 'nyanza', 'western'];

const COUNTIES = [
  'mombasa', 'kwale', 'kilifi', 'tana river', 'lamu', 'taita taveta', 'garissa', 'wajir', 'mandera',
  'marsabit', 'isiolo', 'meru', 'tharaka nithi', 'embu', 'kitui', 'machakos', 'makueni', 'nyandarua',
  'nyeri', 'kirinyaga', "murang'a", 'muranga', 'kiambu', 'turkana', 'west pokot', 'samburu', 'trans nzoia',
  'uasin gishu', 'elgeyo marakwet', 'nandi', 'baringo', 'laikipia', 'nakuru', 'narok', 'kajiado', 'kericho',
  'bomet', 'kakamega', 'vihiga', 'bungoma', 'busia', 'siaya', 'kisumu', 'homa bay', 'migori', 'kisii',
  'nyamira', 'nairobi',
];

/**
 * Parses free-text search into structured filters (e.g. "boarding girls
 * schools in nakuru" -> {gender: 'Girls', accommodation_type: 'Boarding',
 * county: 'Nakuru'}). Rule-based, not an LLM call - the remainder after
 * stripping recognized tokens is passed through as a plain name/text search.
 */
export function parseSchoolSearchQuery(raw: string): SchoolSearchFilters {
  const filters: SchoolSearchFilters = {};
  let remaining = ` ${raw.toLowerCase()} `;

  for (const [word, gender] of Object.entries(GENDER_WORDS)) {
    if (remaining.includes(` ${word} `)) {
      filters.gender = gender;
      remaining = remaining.replace(` ${word} `, ' ');
      break;
    }
  }

  for (const [word, accommodation] of Object.entries(ACCOMMODATION_WORDS)) {
    if (remaining.includes(` ${word} `)) {
      filters.accommodation_type = accommodation;
      remaining = remaining.replace(` ${word} `, ' ');
      break;
    }
  }

  const clusterMatch = remaining.match(/\bc([1-4])\b/);
  if (clusterMatch) {
    filters.cluster_type = `C${clusterMatch[1]}` as SchoolSearchFilters['cluster_type'];
    remaining = remaining.replace(clusterMatch[0], ' ');
  }

  const foundCounty = COUNTIES.find((c) => remaining.includes(c));
  if (foundCounty) {
    filters.county = foundCounty.replace(/\b\w/g, (c) => c.toUpperCase());
    remaining = remaining.replace(foundCounty, ' ');
  }

  const foundRegion = REGIONS.find((r) => remaining.includes(r));
  if (foundRegion) {
    filters.region = foundRegion.replace(/\b\w/g, (c) => c.toUpperCase());
    remaining = remaining.replace(foundRegion, ' ');
  }

  remaining = remaining
    .replace(/\b(schools?|in|for|near|the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (remaining) filters.q = remaining;

  return filters;
}
