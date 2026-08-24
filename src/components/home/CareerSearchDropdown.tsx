'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Career } from '@/types/home';

const FALLBACK_CAREERS: Career[] = [
  { id: '1', name: 'Doctor', category: 'Medicine & Health', course_count: 1240, slug: 'doctor' },
  { id: '2', name: 'Software Engineer', category: 'Technology', course_count: 2890, slug: 'software-engineer' },
  { id: '3', name: 'Lawyer', category: 'Law', course_count: 856, slug: 'lawyer' },
  { id: '4', name: 'Entrepreneur', category: 'Business', course_count: 1102, slug: 'entrepreneur' },
  { id: '5', name: 'Civil Engineer', category: 'Engineering', course_count: 634, slug: 'civil-engineer' },
  { id: '6', name: 'Teacher', category: 'Education', course_count: 1567, slug: 'teacher' },
  { id: '7', name: 'Nurse', category: 'Medicine & Health', course_count: 982, slug: 'nurse' },
  { id: '8', name: 'Graphic Designer', category: 'Arts & Design', course_count: 743, slug: 'graphic-designer' },
  { id: '9', name: 'Data Scientist', category: 'Technology', course_count: 1120, slug: 'data-scientist' },
  { id: '10', name: 'Accountant', category: 'Business', course_count: 890, slug: 'accountant' },
  { id: '11', name: 'Architect', category: 'Engineering', course_count: 456, slug: 'architect' },
  { id: '12', name: 'Pharmacist', category: 'Medicine & Health', course_count: 678, slug: 'pharmacist' },
];

export default function CareerSearchDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [careers, setCareers] = useState<Career[]>(FALLBACK_CAREERS);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCareers() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('careers')
          .select('id, name, category, course_count, slug')
          .order('name', { ascending: true });
        if (!error && data && data.length > 0) {
          setCareers(data as Career[]);
        }
      } catch {
        // Keep fallback careers
      }
    }
    fetchCareers();
  }, []);

  const filteredCareers = careers.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((career: Career) => {
    setQuery(career.name);
    setIsOpen(false);
    window.location.href = `/search?q=${encodeURIComponent(`I want to become a ${career.name}`)}`;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center gap-2 bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl px-4 py-3 cursor-text shadow-sm hover:border-gray-300 dark:hover:border-primary-400 transition-all focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-1"
        onClick={() => { inputRef.current?.focus(); setIsOpen(true); }}
      >
        <span className="text-gray-400 dark:text-muted text-base">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type a career (e.g. Doctor)..."
          className="flex-1 bg-transparent border-none text-gray-800 dark:text-white text-base outline-none placeholder:text-gray-400 dark:placeholder:text-muted"
        />
        <span
          className="text-gray-400 dark:text-muted text-xs transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ⌄
        </span>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl overflow-hidden z-50 max-h-[280px] overflow-y-auto shadow-lg">
          {filteredCareers.length === 0 ? (
            <div className="p-4 text-center text-gray-400 dark:text-muted text-sm">No careers found</div>
          ) : (
            filteredCareers.map((career) => (
              <div
                key={career.id}
                onClick={() => handleSelect(career)}
                className="px-4 py-3 flex justify-between items-center border-b border-gray-100 dark:border-border last:border-b-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div>
                  <div className="text-gray-800 dark:text-white text-sm font-medium">{career.name}</div>
                  <div className="text-gray-400 dark:text-muted text-xs mt-0.5">
                    {career.course_count.toLocaleString()} courses · {career.category}
                  </div>
                </div>
                <span className="text-gray-400 dark:text-muted text-sm">›</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
