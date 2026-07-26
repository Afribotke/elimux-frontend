/**
 * KCSE Grade Hierarchy and Comparison Utilities
 * Kenya Certificate of Secondary Education
 * Order: A > A- > B+ > B > B- > C+ > C > C- > D+ > D > D- > E
 */

export const KCSE_GRADES = [
  { grade: 'A', label: 'A (Plain)', numeric: 12 },
  { grade: 'A-', label: 'A- (Minus)', numeric: 11 },
  { grade: 'B+', label: 'B+ (Plus)', numeric: 10 },
  { grade: 'B', label: 'B (Plain)', numeric: 9 },
  { grade: 'B-', label: 'B- (Minus)', numeric: 8 },
  { grade: 'C+', label: 'C+ (Plus)', numeric: 7 },
  { grade: 'C', label: 'C (Plain)', numeric: 6 },
  { grade: 'C-', label: 'C- (Minus)', numeric: 5 },
  { grade: 'D+', label: 'D+ (Plus)', numeric: 4 },
  { grade: 'D', label: 'D (Plain)', numeric: 3 },
  { grade: 'D-', label: 'D- (Minus)', numeric: 2 },
  { grade: 'E', label: 'E', numeric: 1 },
] as const;

export type KcseGrade = typeof KCSE_GRADES[number]['grade'];

export function gradeToNumeric(grade: string): number {
  const found = KCSE_GRADES.find(g => g.grade === grade.trim().toUpperCase());
  return found?.numeric ?? 0;
}

export function numericToGrade(numeric: number): KcseGrade | null {
  const found = KCSE_GRADES.find(g => g.numeric === numeric);
  return found?.grade ?? null;
}

/**
 * Check if a student grade qualifies for a program
 * @param studentGrade - Student KCSE grade (e.g., "C-")
 * @param requiredGrade - Program minimum grade (e.g., "D+")
 * @returns true if student grade is equal or better than required
 */
export function qualifies(studentGrade: string, requiredGrade: string): boolean {
  return gradeToNumeric(studentGrade) >= gradeToNumeric(requiredGrade);
}

/**
 * Get all grades that a student qualifies for
 * e.g., C- student qualifies for C-, D+, D, D-, E
 */
export function getQualifyingGrades(studentGrade: string): KcseGrade[] {
  const studentNumeric = gradeToNumeric(studentGrade);
  return KCSE_GRADES.filter(g => g.numeric <= studentNumeric).map(g => g.grade);
}

/**
 * Get grade color for UI badges
 */
export function getGradeColor(grade: string): { bg: string; text: string } {
  const numeric = gradeToNumeric(grade);
  if (numeric >= 11) return { bg: '#22c55e22', text: '#22c55e' };
  if (numeric >= 8)  return { bg: '#84cc1622', text: '#84cc16' };
  if (numeric >= 6)  return { bg: '#eab30822', text: '#eab308' };
  if (numeric >= 5)  return { bg: '#f59e0b22', text: '#f59e0b' };
  if (numeric >= 3)  return { bg: '#f9731622', text: '#f97316' };
  return { bg: '#ef444422', text: '#ef4444' };
}
