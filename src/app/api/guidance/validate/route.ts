import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schools, combinations, is_sne } = body;

    const errors: string[] = [];
    const warnings: string[] = [];

    // SNE Mode: 4 schools, all C1
    if (is_sne) {
      if (schools.length !== 4) {
        errors.push(`SNE learners must select exactly 4 schools (you have ${schools.length})`);
      }
      const nonC1 = schools.filter((s: any) => s.category !== 'C1');
      if (nonC1.length > 0) {
        errors.push(`All 4 SNE schools must be from C1 category (${nonC1.length} are not)`);
      }
    } else {
      // Regular mode: 8 schools, 3-2-2-1 formula
      if (schools.length !== 8) {
        errors.push(`You must select exactly 8 schools (you have ${schools.length})`);
      }

      const c1Count = schools.filter((s: any) => s.category === 'C1').length;
      const c2Count = schools.filter((s: any) => s.category === 'C2').length;
      const c3Count = schools.filter((s: any) => s.category === 'C3').length;
      const c4Count = schools.filter((s: any) => s.category === 'C4').length;

      if (c1Count !== 3) errors.push(`C1: You must select exactly 3 schools (you have ${c1Count})`);
      if (c2Count !== 2) errors.push(`C2: You must select exactly 2 schools (you have ${c2Count})`);
      if (c3Count !== 2) errors.push(`C3: You must select exactly 2 schools (you have ${c3Count})`);
      if (c4Count !== 1) errors.push(`C4: You must select exactly 1 day school (you have ${c4Count})`);

      // C4 must be day school
      const c4School = schools.find((s: any) => s.category === 'C4');
      if (c4School && c4School.accommodation !== 'day') {
        errors.push(`C4: Your C4 school must be a DAY school (not ${c4School.accommodation})`);
      }

      // Consistency Rule: all combinations in same pathway
      if (combinations && combinations.length > 0) {
        const primaryPathway = combinations[0]?.pathway_id;
        const inconsistent = combinations.filter((c: any) => c.pathway_id !== primaryPathway);
        if (inconsistent.length > 0) {
          errors.push(`Consistency Rule: All combinations must be in the same pathway (${inconsistent.length} are not)`);
        }
      }
    }

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
      warnings,
      summary:
        errors.length === 0
          ? 'Your selection meets all Ministry requirements.'
          : `${errors.length} issue(s) found. Please fix before submitting to KEMIS.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to validate selection' }, { status: 500 });
  }
}
