'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserWithTimeout } from '@/lib/client-auth';

const CSS_VAR_MAP: Record<string, string> = {
  primary: '--brand-primary',
  accent: '--brand-accent',
  background: '--brand-background',
  surface: '--brand-surface',
  text: '--brand-text',
  heading: '--brand-heading',
};

export default function BrandColorInjector() {
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data: { user } } = await getUserWithTimeout();
      if (!user) return;

      const { data: teamMember } = await supabase
        .from('employer_team_members')
        .select('employer_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!teamMember) return;

      const { data: employer } = await supabase
        .from('employers')
        .select('*')
        .eq('id', teamMember.employer_id)
        .single();

      if (cancelled || !employer) return;

      const brandColors = (employer as { brand_colors?: Record<string, string> | null }).brand_colors;
      const primaryColor = (employer as { branding_primary_color?: string | null }).branding_primary_color;

      if (brandColors) {
        for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
          const value = brandColors[key];
          if (value) document.documentElement.style.setProperty(cssVar, value);
        }
      } else if (primaryColor) {
        document.documentElement.style.setProperty(CSS_VAR_MAP.primary, primaryColor);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
