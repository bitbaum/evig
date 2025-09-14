export interface Suggestion {
  id: string
  content: string
  contact?: string
  page: string
  url: string
  timestamp: string
  ip: string
  status: SuggestionStatus
  aiInstructions?: string
  adminNotes?: string
  priority: 'low' | 'medium' | 'high'
  category: SuggestionCategory
  complexity: 'low' | 'medium' | 'high'
  confidence: number // 0-100, AI confidence in instructions
  createdAt: Date
  updatedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export enum SuggestionStatus {
  PENDING_REVIEW = 'pending_review',
  NEEDS_APPROVAL = 'needs_approval',
  APPROVED = 'approved', 
  READY_FOR_IMPLEMENTATION = 'ready_for_implementation',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  DEFERRED = 'deferred',
  AWAITING_CLARIFICATION = 'awaiting_clarification'
}

export enum SuggestionCategory {
  VISUAL_STYLING = 'visual_styling',
  CONTENT = 'content',
  NAVIGATION = 'navigation',
  FEATURE = 'feature',
  TECHNICAL = 'technical',
  UX = 'ux',
  PERFORMANCE = 'performance',
  ACCESSIBILITY = 'accessibility',
  OTHER = 'other'
}

export interface SuggestionInput {
  content: string
  contact?: string
  page: string
  url: string
  metadata?: Record<string, any>
}

export interface SuggestionFilters {
  status?: SuggestionStatus
  category?: SuggestionCategory
  priority?: 'low' | 'medium' | 'high'
  complexity?: 'low' | 'medium' | 'high'
  page?: string
  search?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface SuggestionStats {
  total: number
  byStatus: Record<SuggestionStatus, number>
  byCategory: Record<SuggestionCategory, number>
  byPriority: Record<string, number>
  byPage: Record<string, number>
  recentActivity: Suggestion[]
  averageResponseTime: number
  completionRate: number
}

export interface AdminAction {
  type: 'approve' | 'reject' | 'defer' | 'request_info' | 'edit_instructions'
  suggestionId: string
  notes?: string
  editedInstructions?: string
  emailMessage?: string
}