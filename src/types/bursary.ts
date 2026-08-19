export interface BursaryFund {
  id: string
  tenantId: string
  providerId: string | null
  name: string
  description: string | null
  fundType: string | null
  status: string | null
  totalAmount: number | null
  currency: string | null
  committed: number | null
  disbursed: number | null
  eligibilityRules: Record<string, unknown> | null
  requiredDocuments: unknown
  deadline: string | null
  opensAt: string | null
  providerName: string | null
  providerLogo: string | null
  createdAt: string
  updatedAt: string
}

export interface BursaryApplicantProfile {
  id: string
  fullName: string | null
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  institution: string | null
  course: string | null
  yearOfStudy: number | null
  gpa: string | null
  createdAt: string
  updatedAt: string
}

export interface BursaryApplication {
  id: string
  applicantId: string
  fundId: string
  tenantId: string
  status: string | null
  submissionData: Record<string, unknown>
  eligibilityScore: number | null
  fraudScore: number | null
  documentStatus: Record<string, unknown>
  createdAt: string
  updatedAt: string
  fundName?: string | null
  fundDescription?: string | null
  fundAmount?: number | null
  fundCurrency?: string | null
  fundDeadline?: string | null
  fundStatus?: string | null
}
