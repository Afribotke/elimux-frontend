import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface KJSAResult {
  subject: string;
  level: 'EE' | 'ME' | 'AE' | 'BE';
}

const LEVEL_VALUE: Record<string, number> = { EE: 4, ME: 3, AE: 2, BE: 1 };

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { results, target_pathway_id } = body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'KJSA results array required' }, { status: 400 });
    }

    // Step 1: Get all pathways and their requirements
    const { data: pathways, error: pathwayError } = await supabase
      .schema('pathways')
      .from('pathways')
      .select('*, tracks(*), pathway_kjsa_requirements(*)');

    if (pathwayError) {
      return NextResponse.json({ error: pathwayError.message }, { status: 500 });
    }

    // Step 2: Analyze each pathway
    const analysis = pathways?.map((pathway: any) => {
      const requirements = pathway.pathway_kjsa_requirements || [];
      let totalScore = 0;
      let maxScore = 0;
      let criticalMet = 0;
      let criticalTotal = 0;
      const subjectChecks = [];

      for (const req of requirements) {
        const result = results.find(
          (r: KJSAResult) => r.subject.toLowerCase() === req.subject.toLowerCase()
        );
        const actualLevel = result ? LEVEL_VALUE[result.level] || 0 : 0;
        const requiredLevel = LEVEL_VALUE[req.minimum_level] || 0;
        const meets = actualLevel >= requiredLevel;
        const weightedScore = meets ? actualLevel * (req.weight || 1) : 0;

        totalScore += weightedScore;
        maxScore += 4 * (req.weight || 1);

        if (req.is_critical) {
          criticalTotal++;
          if (meets) criticalMet++;
        }

        subjectChecks.push({
          subject: req.subject,
          required: req.minimum_level,
          actual: result?.level || 'N/A',
          meets,
          is_critical: req.is_critical,
        });
      }

      const fitPercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      const criticalPassRate = criticalTotal > 0 ? Math.round((criticalMet / criticalTotal) * 100) : 100;

      return {
        pathway,
        fit_percentage: fitPercentage,
        critical_pass_rate: criticalPassRate,
        eligible: criticalPassRate >= 50,
        confidence: fitPercentage >= 75 ? 'high' : fitPercentage >= 50 ? 'medium' : 'low',
        subject_checks: subjectChecks,
      };
    });

    // Step 3: Sort by fit percentage
    const sortedAnalysis = analysis?.sort((a, b) => b.fit_percentage - a.fit_percentage) || [];

    // Step 4: If target pathway specified, get combinations for it
    let recommendedCombinations: any[] = [];
    if (target_pathway_id) {
      const { data: combos } = await supabase
        .schema('pathways')
        .from('subject_combinations')
        .select('*, tracks(pathway_id)')
        .eq('tracks.pathway_id', target_pathway_id)
        .eq('is_active', true)
        .limit(3);

      recommendedCombinations = combos || [];
    }

    return NextResponse.json({
      analysis: sortedAnalysis,
      top_pathway: sortedAnalysis[0]?.pathway || null,
      recommended_combinations: recommendedCombinations,
      strongest_subjects: results
        .filter((r: KJSAResult) => LEVEL_VALUE[r.level] >= 3)
        .map((r: KJSAResult) => r.subject),
      weakest_subjects: results
        .filter((r: KJSAResult) => LEVEL_VALUE[r.level] <= 2)
        .map((r: KJSAResult) => r.subject),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to analyze KJSA results' }, { status: 500 });
  }
}
