export type ClusterType = 'C1' | 'C2' | 'C3' | 'C4';
export type SchoolGender = 'Boys' | 'Girls' | 'Mixed';
export type AccommodationType = 'Boarding' | 'Day' | 'Both';

export interface SeniorSchool {
  id: string;
  name: string;
  region: string;
  county: string;
  sub_county: string | null;
  cluster_type: ClusterType;
  gender: SchoolGender;
  accommodation_type: AccommodationType;
  school_type: string;
  knec_code: string | null;
  uic_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareerPathway {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  required_cluster_min: ClusterType | null;
  recommended_regions: string[];
  recommended_counties: string[];
  career_tags: string[];
  created_at: string;
}

export interface StudentPathwaySelection {
  id: string;
  user_id: string;
  pathway_id: string;
  status: 'active' | 'changed';
  created_at: string;
  pathway?: CareerPathway;
}

export interface StudentSchoolSelection {
  id: string;
  user_id: string;
  school_id: string;
  pathway_id: string | null;
  notes: string | null;
  created_at: string;
  school?: SeniorSchool;
}

export interface SchoolSearchFilters {
  q?: string;
  region?: string;
  county?: string;
  gender?: SchoolGender;
  accommodation_type?: AccommodationType;
  cluster_type?: ClusterType;
  page?: number;
  limit?: number;
}

// Cluster selectivity ranking used to compare a pathway's required_cluster_min
// against a school's cluster_type - lower index = more selective/elite.
export const CLUSTER_RANK: Record<ClusterType, number> = { C1: 0, C2: 1, C3: 2, C4: 3 };

export function meetsClusterMinimum(school: ClusterType, requiredMin: ClusterType | null): boolean {
  if (!requiredMin) return true;
  return CLUSTER_RANK[school] <= CLUSTER_RANK[requiredMin];
}
