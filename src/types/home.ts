export interface Career {
  id: string;
  name: string;
  category: string;
  course_count: number;
  slug: string;
}

export interface Program {
  id: string;
  name: string;
  minimum_kcse_grade: string;
  kcse_grade_is_estimated?: boolean;
  duration: string;
  category: string;
  institution: {
    name: string;
    location: string;
    country: string;
  };
}

export type TabType = 'uni' | 'skills';
