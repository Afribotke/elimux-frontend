'use client';

import type { SchoolSearchFilters, SchoolGender, AccommodationType, ClusterType } from '@/lib/schools-data';

const REGIONS = ['Rift Valley', 'North Eastern', 'Nairobi', 'Central', 'Coast', 'Eastern', 'Nyanza', 'Western'];
const GENDERS: SchoolGender[] = ['Boys', 'Girls', 'Mixed'];
const ACCOMMODATIONS: AccommodationType[] = ['Boarding', 'Day', 'Both'];
const CLUSTERS: ClusterType[] = ['C1', 'C2', 'C3', 'C4'];

interface Props {
  filters: SchoolSearchFilters;
  onChange: (filters: SchoolSearchFilters) => void;
}

export function FilterPanel({ filters, onChange }: Props) {
  const set = (patch: Partial<SchoolSearchFilters>) => onChange({ ...filters, ...patch, page: 1 });

  const clear = () => onChange({ page: 1, limit: filters.limit });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">Filters</h3>
        <button onClick={clear} className="text-xs text-blue-600 hover:underline">Clear all</button>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-gray-500 mb-2">Region</legend>
        <div className="space-y-1.5">
          {REGIONS.map((region) => (
            <label key={region} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="radio"
                name="region"
                checked={filters.region === region}
                onChange={() => set({ region })}
                className="w-4 h-4 text-blue-600"
              />
              {region}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium text-gray-500 mb-2">Gender</legend>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button
              key={g}
              onClick={() => set({ gender: filters.gender === g ? undefined : g })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.gender === g ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium text-gray-500 mb-2">Accommodation</legend>
        <div className="flex flex-wrap gap-2">
          {ACCOMMODATIONS.map((a) => (
            <button
              key={a}
              onClick={() => set({ accommodation_type: filters.accommodation_type === a ? undefined : a })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.accommodation_type === a ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-medium text-gray-500 mb-2">Cluster</legend>
        <div className="flex flex-wrap gap-2">
          {CLUSTERS.map((c) => (
            <button
              key={c}
              onClick={() => set({ cluster_type: filters.cluster_type === c ? undefined : c })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filters.cluster_type === c ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {filters.cluster_type && filters.cluster_type !== 'C1' && (
          <p className="mt-2 text-xs text-amber-600">Only C1 schools are loaded so far — {filters.cluster_type} results will appear once that data is added.</p>
        )}
      </fieldset>
    </div>
  );
}
