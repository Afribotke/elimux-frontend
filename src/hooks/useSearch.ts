import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Program, Institution, SearchFilters, AISearchResult } from '@/types';

interface SearchState {
  programs: Program[];
  institutions: Institution[];
  aiResult: AISearchResult | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({
    programs: [],
    institutions: [],
    aiResult: null,
    loading: false,
    error: null,
    totalCount: 0
  });

  const search = useCallback(async (query: string, filters?: SearchFilters, useAI: boolean = false) => {
    setState(prev => ({ ...prev, loading: true, error: null, aiResult: null }));
    
    try {
      let programQuery = supabase
        .from('programs')
        .select('*, institution:institutions(*)', { count: 'exact' })
        .ilike('name', `%${query}%`);

      let institutionQuery = supabase
        .from('institutions')
        .select('*', { count: 'exact' })
        .ilike('name', `%${query}%`);

      if (filters?.country) {
        institutionQuery = institutionQuery.eq('country', filters.country);
        programQuery = programQuery.eq('institutions.country', filters.country);
      }
      if (filters?.level) {
        programQuery = programQuery.eq('level', filters.level);
      }
      if (filters?.field) {
        programQuery = programQuery.contains('tags', [filters.field]);
      }
      if (filters?.minTuition !== undefined) {
        programQuery = programQuery.gte('tuition_fees', filters.minTuition);
      }
      if (filters?.maxTuition !== undefined) {
        programQuery = programQuery.lte('tuition_fees', filters.maxTuition);
      }

      const [programRes, institutionRes] = await Promise.all([
        programQuery.limit(20),
        institutionQuery.limit(20)
      ]);

      const programs = (programRes.data as Program[]) || [];
      const institutions = (institutionRes.data as Institution[]) || [];
      const totalCount = (programRes.count || 0) + (institutionRes.count || 0);

      let aiResult: AISearchResult | null = null;

      if (useAI && query.length > 10) {
        try {
          const aiRes = await fetch('/api/ai-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, filters })
          });
          if (aiRes.ok) {
            aiResult = await aiRes.json();
          }
        } catch {
          // AI search is optional, don't fail the whole search
        }
      }

      setState({
        programs,
        institutions,
        aiResult,
        loading: false,
        error: null,
        totalCount
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Search failed. Please try again.'
      }));
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState({
      programs: [],
      institutions: [],
      aiResult: null,
      loading: false,
      error: null,
      totalCount: 0
    });
  }, []);

  return { ...state, search, clearSearch };
}
