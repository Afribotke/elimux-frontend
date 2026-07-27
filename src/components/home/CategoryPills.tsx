'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

// Emoji matched by keyword in category name
function iconFor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('medicine') || n.includes('health') || n.includes('nursing')) return '🩺';
  if (n.includes('technology') || n.includes('data') || n.includes('information') || n.includes('computer')) return '⚙️';
  if (n.includes('business') || n.includes('finance') || n.includes('accounting') || n.includes('management')) return '💼';
  if (n.includes('engineering')) return '🔧';
  if (n.includes('law') || n.includes('legal')) return '⚖️';
  if (n.includes('education') || n.includes('teaching')) return '🎓';
  if (n.includes('art') || n.includes('design') || n.includes('humanities') || n.includes('media')) return '🎨';
  if (n.includes('agriculture') || n.includes('environment') || n.includes('farming')) return '🌱';
  if (n.includes('aviation') || n.includes('maritime') || n.includes('aerospace')) return '✈️';
  if (n.includes('hospitality') || n.includes('tourism') || n.includes('hotel')) return '🏨';
  if (n.includes('sport') || n.includes('fitness') || n.includes('athletic')) return '🏅';
  if (n.includes('trade') || n.includes('vocational') || n.includes('craft')) return '🔨';
  // Checked before the science/math branch: "Social Sciences" contains
  // "science" too, and should read as social, not science.
  if (n.includes('social') || n.includes('community')) return '👥';
  if (n.includes('policy') || n.includes('governance') || n.includes('public')) return '🛡️';
  if (n.includes('science') || n.includes('math') || n.includes('mathematics')) return '🧪';
  return '📚';
}

// Color per category, keyed by the exact slugified name of every category
// currently in program_categories. Exact match only (no substring fallback):
// partial matching previously let "social-sciences" steal "science"'s color,
// and unmatched categories fell to a bg/text pair that render identically
// (rgb(100,100,100) on rgb(100,100,100)), making the label invisible.
const CATEGORY_COLORS: Record<string, string> = {
  'agriculture-environment': 'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100',
  'architecture-design': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
  'arts-humanities': 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100',
  'aviation-maritime': 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  'business-management': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  'data-analytics': 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  'education-teaching': 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  'engineering-technology': 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
  'finance-accounting': 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
  'hospitality-tourism': 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  'information-technology': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  'law-legal-studies': 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  'media-communication': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100',
  'medicine-health-sciences': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  'nursing-caregiving': 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  'public-policy-governance': 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  'science-mathematics': 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  'social-sciences': 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  'sports-fitness': 'bg-lime-50 text-lime-700 border-lime-200 hover:bg-lime-100',
  'trades-vocational': 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100',
};

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getCategoryColor(name: string): string {
  return CATEGORY_COLORS[slugify(name)] || 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
}

export default function CategoryPills() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('program_categories')
      .select('id, name')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setCategories(data);
        }
        setLoading(false);
      });
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden py-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-36 flex-shrink-0 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {canScrollLeft && (
        <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-md ring-1 ring-border backdrop-blur-sm hover:bg-background" aria-label="Scroll left">
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {categories.map((cat) => {
          const colorClass = getCategoryColor(cat.name);
          return (
            <Link key={cat.id} href={`/programs?category=${cat.id}`} className={`inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 ${colorClass}`}>
              <span className="text-base">{iconFor(cat.name)}</span>
              <span className="whitespace-nowrap">{cat.name}</span>
            </Link>
          );
        })}
      </div>

      {canScrollRight && (
        <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-1.5 shadow-md ring-1 ring-border backdrop-blur-sm hover:bg-background" aria-label="Scroll right">
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
