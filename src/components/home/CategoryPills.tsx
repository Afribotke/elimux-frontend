'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: '', name: 'Medicine & Health Sciences' },
  { id: '', name: 'Information Technology' },
  { id: '', name: 'Business & Management' },
  { id: '', name: 'Engineering & Technology' },
  { id: '', name: 'Law & Legal Studies' },
  { id: '', name: 'Education & Teaching' },
  { id: '', name: 'Arts & Humanities' },
  { id: '', name: 'Science & Mathematics' },
];

function iconFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('medicine') || n.includes('health') || n.includes('nursing')) return '💊';
  if (n.includes('technology') || n.includes('data') || n.includes('information')) return '⚙️';
  if (n.includes('business') || n.includes('finance') || n.includes('accounting')) return '💼';
  if (n.includes('engineering')) return '🔧';
  if (n.includes('law')) return '⚖️';
  if (n.includes('education') || n.includes('teaching')) return '🎓';
  if (n.includes('art') || n.includes('design') || n.includes('humanities') || n.includes('media')) return '🎨';
  if (n.includes('science') || n.includes('math')) return '🧪';
  if (n.includes('agriculture') || n.includes('environment')) return '🌱';
  if (n.includes('aviation') || n.includes('maritime')) return '✈️';
  if (n.includes('hospitality') || n.includes('tourism')) return '🏨';
  if (n.includes('sport') || n.includes('fitness')) return '🏅';
  if (n.includes('trade') || n.includes('vocational')) return '🔨';
  if (n.includes('social')) return '👥';
  if (n.includes('policy') || n.includes('governance')) return '🏛️';
  return '📚';
}

export default function CategoryPills() {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('program_categories')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 0) setCategories(data);
      });
  }, []);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [categories]);

  return (
    <div className="relative mb-6">
      {canScrollLeft && (
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          ‹
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto py-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.id ? `/programs?category=${cat.id}` : '/programs'}
            className="shrink-0 inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-full text-sm hover:border-gray-400 hover:text-gray-900 transition-all"
          >
            <span>{iconFor(cat.name)}</span>
            <span>{cat.name}</span>
          </Link>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all"
        >
          ›
        </button>
      )}

      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5]" />
      )}
    </div>
  );
}
