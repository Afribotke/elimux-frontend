'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface Props {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export function SchoolSearchBar({ onSearch, initialValue = '' }: Props) {
  const [value, setValue] = useState(initialValue);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSearch(value); }}
      className="relative"
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Try 'boarding girls schools in Nakuru' or a school name"
        className="w-full pl-12 pr-24 py-3.5 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  );
}
