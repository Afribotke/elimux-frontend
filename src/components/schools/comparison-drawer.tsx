'use client';

import { X } from 'lucide-react';
import type { SeniorSchool } from '@/lib/schools-data';

interface Props {
  schools: SeniorSchool[];
  onRemove: (id: string) => void;
  onClose: () => void;
  open: boolean;
}

const ROWS: { label: string; get: (s: SeniorSchool) => string }[] = [
  { label: 'Cluster', get: (s) => s.cluster_type },
  { label: 'Region', get: (s) => s.region },
  { label: 'County', get: (s) => s.county },
  { label: 'Gender', get: (s) => s.gender },
  { label: 'Accommodation', get: (s) => s.accommodation_type },
  { label: 'Type', get: (s) => s.school_type },
];

// Plain-Tailwind fixed drawer - this project has no shadcn Sheet component
// installed (no components.json / CLI config), so this stands in for one.
export function ComparisonDrawer({ schools, onRemove, onClose, open }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Compare Schools ({schools.length})</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {schools.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-12">Add up to 3 schools to compare them side by side.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 font-medium">&nbsp;</th>
                  {schools.map((s) => (
                    <th key={s.id} className="text-left px-5 py-3 min-w-[180px]">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-gray-900">{s.name}</span>
                        <button onClick={() => onRemove(s.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-gray-100">
                    <td className="px-5 py-3 text-xs font-medium text-gray-500">{row.label}</td>
                    {schools.map((s) => (
                      <td key={s.id} className="px-5 py-3 text-gray-700">{row.get(s)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
