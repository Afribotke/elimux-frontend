# Cycle 158 — Coming Soon Gate (Senior Schools + Career)

## 1. Database — Feature Flags
Migration: `migrations/20260905_coming_soon_flags.sql`

## 2. Frontend — Nav Pills Component
File: `components/home/CategoryPills.tsx` (or equivalent nav pills file)

## 3. Styling — Coming Soon Badge + Disabled State
Tailwind classes included in component.

## 4. Post-Deploy Verification
- [ ] Senior Schools pill shows "Coming Soon", click does nothing
- [ ] Career pill shows "Coming Soon", click does nothing  
- [ ] Other pills (Universities, Colleges, etc.) remain fully clickable
- [ ] No 404 or partial page flash on click
END COPY 1
BEGIN COPY 2 → migrations/20260905_coming_soon_flags.sql
(Paste into Supabase SQL Editor, run once)
sql
-- Cycle 158: Feature flags for incomplete modules
INSERT INTO public.feature_flags (key, value, description, updated_at)
VALUES 
  ('senior_schools_enabled', 'false', 'Controls visibility/interactivity of Senior Schools module', now()),
  ('career_pathways_enabled', 'false', 'Controls visibility/interactivity of Career Pathways module', now())
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();
END COPY 2
BEGIN COPY 3 → Replace the nav pills / category filter component entirely.
(Claude to locate the exact file — typically components/home/CategoryPills.tsx or app/page.tsx inline pills)
tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  GraduationCap, 
  Building2, 
  School, 
  BookOpen,
  Briefcase,
  Clock
} from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  comingSoon?: boolean;
}

export default function CategoryPills() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFlags() {
      const { data } = await supabase
        .from('feature_flags')
        .select('key, value')
        .in('key', ['senior_schools_enabled', 'career_pathways_enabled']);
      
      const map: Record<string, boolean> = {};
      data?.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value === 'true';
      });
      setFlags(map);
      setLoading(false);
    }
    loadFlags();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 animate-pulse">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-10 w-32 bg-gray-800 rounded-full" />
        ))}
      </div>
    );
  }

  const categories: Category[] = [
    {
      id: 'universities',
      label: 'Universities',
      icon: <GraduationCap className="w-4 h-4" />,
      href: '/search?type=university',
    },
    {
      id: 'colleges',
      label: 'Colleges',
      icon: <Building2 className="w-4 h-4" />,
      href: '/search?type=college',
    },
    {
      id: 'senior_schools',
      label: 'Senior Schools',
      icon: <School className="w-4 h-4" />,
      href: '#',
      comingSoon: !flags['senior_schools_enabled'],
    },
    {
      id: 'career',
      label: 'Career',
      icon: <Briefcase className="w-4 h-4" />,
      href: '#',
      comingSoon: !flags['career_pathways_enabled'],
    },
    {
      id: 'courses',
      label: 'Courses',
      icon: <BookOpen className="w-4 h-4" />,
      href: '/search?type=course',
    },
  ];

  const handleClick = (cat: Category) => {
    if (cat.comingSoon) return; // Dead click — no navigation
    window.location.href = cat.href;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat)}
          disabled={cat.comingSoon}
          className={`
            relative flex items-center gap-2 px-5 py-2.5 rounded-full 
            whitespace-nowrap text-sm font-medium transition-all
            ${cat.comingSoon 
              ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700/50' 
              : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
            }
          `}
        >
          {cat.icon}
          <span>{cat.label}</span>
          
          {cat.comingSoon && (
            <span className="absolute -top-2 -right-2 flex items-center gap-1 
              bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 
              rounded-full shadow-lg border border-amber-400">
              <Clock className="w-3 h-3" />
              SOON
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
END COPY 3
BEGIN COPY 4 → If the pills are rendered server-side in page.tsx, replace the inline map with this client component call:
tsx
// In app/page.tsx (or wherever the hero pills live)
import CategoryPills from '@/components/home/CategoryPills';

// Replace the old pills JSX with:
<CategoryPills />
END COPY 4
INSTRUCTIONS FOR CLAUDE
Audit — Check which file renders the orange "Senior Schools" pill. Likely candidates:
app/page.tsx
components/home/CategoryPills.tsx
components/hero/SearchCategories.tsx
Apply — If CategoryPills.tsx exists, overwrite with COPY 3. If pills are inline in page.tsx, extract to new components/home/CategoryPills.tsx and insert COPY 4.
Database — Paste COPY 2 into Supabase SQL Editor → Run.
Build — npm run build (expect zero errors).
Verify locally — Confirm:
Senior Schools = gray, non-clickable, amber "SOON" badge
Career = gray, non-clickable, amber "SOON" badge
Universities / Colleges / Courses = orange, clickable, no badge
Commit scope — Only files touched by this cycle:
bash
git add -A && git status
# Confirm only Cycle 158 files are staged
git commit -m "Cycle 158: Coming Soon gate for Senior Schools + Career"
git push origin main
Report back — Screenshot the pill row for approval.
Do not proceed to any other cycle until this is built, verified, and committed.