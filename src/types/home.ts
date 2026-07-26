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
  duration: string;
  category: string;
  institution: {
    name: string;
    location: string;
    country: string;
  };
}

export type TabType = 'uni' | 'skills';
