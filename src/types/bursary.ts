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

export interface BursaryBookmark {
  bookmarkId: string
  bookmarkedAt: string
  fund: BursaryFund
}

export interface BursaryNotification {
  id: string
  type: string
  title: string
  message: string
  fundId: string | null
  applicationId: string | null
  isRead: boolean
  createdAt: string
}

export interface BursaryAlertPreferences {
  alertTypes: string[]
  fieldOfStudy: string | null
  minAmount: number | null
  maxAmount: number | null
}

export interface BursaryProviderTenant {
  id: string
  slug: string
  name: string
  type: string
  status: 'pending' | 'active' | 'suspended'
  registrationNumber: string | null
  verificationStatus: string | null
  contact: Record<string, unknown> | null
  adminUsers: string[]
  activeModules: string[]
  createdAt: string
  updatedAt: string
}

export interface BursaryProviderAdminRole {
  id: string
  tenantId: string
  userId: string | null
  role: string
  status: 'invited' | 'active' | 'revoked'
  invitedAt: string | null
  acceptedAt: string | null
  tenant?: BursaryProviderTenant
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
