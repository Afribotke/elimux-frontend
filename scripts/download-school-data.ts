/**
 * Downloads Kenya school data from the World Bank public dataset and
 * imports it into pathways.schools.
 *
 * Source: https://datacatalog.worldbank.org/search/dataset/0038039/kenya-schools
 * License: CC BY 4.0 (free to use with attribution)
 * Provider: Kenya Ministry of Education
 *
 * Run manually after setting SUPABASE_SERVICE_ROLE_KEY:
 *   npx tsx scripts/download-school-data.ts
 *
 * Requires the pathways schema migration to already be applied and
 * exposed via Supabase's API settings (see the migration file's
 * closing comment) before this script's inserts will succeed.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'pathways' },
});

const WORLD_BANK_URL = 'https://datacatalogfiles.worldbank.org/ddh-published/0038039/DR0090755/kenya%20schools.json';

interface WorldBankSchool {
  name?: string;
  county?: string;
  sub_county?: string;
  lat?: number;
  lon?: number;
  type?: string; // 'Primary', 'Secondary', 'Tertiary'
  sponsor?: string;
}

async function downloadAndImport() {
  console.log('Downloading World Bank Kenya Schools dataset...');

  const response = await fetch(WORLD_BANK_URL);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }

  const schools: WorldBankSchool[] = await response.json();
  console.log(`Downloaded ${schools.length} schools`);

  // Filter for secondary schools only
  const secondarySchools = schools.filter(
    (s) => s.type?.toLowerCase().includes('secondary') || s.type?.toLowerCase().includes('senior')
  );
  console.log(`Filtered to ${secondarySchools.length} secondary schools`);

  // Map to our schema
  const mappedSchools = secondarySchools.map((s) => ({
    name: s.name || 'Unknown School',
    county: s.county || 'Unknown',
    sub_county: s.sub_county || 'Unknown',
    location_lat: s.lat,
    location_lng: s.lon,
    category: 'C4', // Default — will be manually updated from Gazette notices
    gender: 'mixed', // Default — will be manually updated
    accommodation: 'day', // Default — will be manually updated
    data_source_url: 'https://datacatalog.worldbank.org/search/dataset/0038039/kenya-schools',
    data_last_updated: new Date().toISOString(),
    is_active: true,
  }));

  // Batch insert (50 at a time)
  const batchSize = 50;
  for (let i = 0; i < mappedSchools.length; i += batchSize) {
    const batch = mappedSchools.slice(i, i + batchSize);
    const { error } = await supabase.from('schools').insert(batch);
    if (error) {
      console.error(`Batch ${i} error:`, error);
    } else {
      console.log(`Inserted batch ${i} - ${i + batch.length}`);
    }
  }

  console.log(`Import complete. ${mappedSchools.length} secondary schools imported.`);
  console.log('IMPORTANT: Categories (C1/C2/C3/C4) and gender/accommodation are defaults.');
  console.log('These must be manually updated from Kenya Gazette notices and Ministry circulars.');
}

downloadAndImport().catch((err) => {
  console.error(err);
  process.exit(1);
});
