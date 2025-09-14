// Core types for AI-Native CMS
// This file defines all the interfaces and types used across the system

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
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export enum SuggestionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  AI_GENERATED = 'ai_generated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export interface SuggestionInput {
  content: string
  contact?: string
  page: string
  url: string
  metadata?: Record<string, any>
}

export interface AIInstructionContext {
  suggestion: Suggestion
  siteConfig: SiteConfig
  pageContext?: PageContext
}

export interface SiteConfig {
  name: string
  domain: string
  framework: 'nextjs' | 'react' | 'vue' | 'vanilla' | 'other'
  aiProvider: 'openai' | 'anthropic' | 'local' | 'custom'
  fileStructure?: FileStructureHint[]
  customPrompts?: Record<string, string>
}

export interface FileStructureHint {
  pattern: string
  description: string
  type: 'component' | 'style' | 'page' | 'api' | 'config' | 'other'
}

export interface PageContext {
  title?: string
  description?: string
  components?: string[]
  styles?: string[]
  layout?: string
}

// Storage adapter interface
export interface StorageAdapter {
  create(suggestion: SuggestionInput, ip: string): Promise<Suggestion>
  findById(id: string): Promise<Suggestion | null>
  findAll(filters?: SuggestionFilters): Promise<Suggestion[]>
  update(id: string, updates: Partial<Suggestion>): Promise<Suggestion>
  delete(id: string): Promise<boolean>
  getStats(): Promise<SuggestionStats>
}

export interface SuggestionFilters {
  status?: SuggestionStatus
  page?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
  offset?: number
}

export interface SuggestionStats {
  total: number
  byStatus: Record<SuggestionStatus, number>
  byPage: Record<string, number>
  recentActivity: Suggestion[]
}

// Notification provider interface
export interface NotificationProvider {
  name: string
  send(notification: NotificationPayload): Promise<boolean>
  configure(config: Record<string, any>): void
}

export interface NotificationPayload {
  type: 'new_suggestion' | 'status_update' | 'ai_generated'
  suggestion: Suggestion
  subject: string
  message: string
  recipients: string[]
  metadata?: Record<string, any>
}

// AI instruction generator interface
export interface AIInstructionGenerator {
  name: string
  generate(context: AIInstructionContext): Promise<string>
  configure(config: Record<string, any>): void
}

// Rate limiting
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

// Configuration for the entire system
export interface AINativeCMSConfig {
  storage: {
    adapter: 'memory' | 'postgres' | 'mysql' | 'mongodb' | 'custom'
    config: Record<string, any>
  }
  notifications: {
    providers: Array<{
      name: string
      config: Record<string, any>
      enabled: boolean
    }>
  }
  aiInstructions: {
    provider: string
    config: Record<string, any>
  }
  rateLimit: RateLimitConfig
  site: SiteConfig
  ui: {
    theme?: 'light' | 'dark' | 'auto'
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    customStyles?: Record<string, string>
  }
}

// Plugin/integration interfaces
export interface AINativeCMSPlugin {
  name: string
  version: string
  init(cms: AINativeCMSCore): void
  destroy?(): void
}

export interface AINativeCMSCore {
  config: AINativeCMSConfig
  storage: StorageAdapter
  notifications: NotificationProvider[]
  aiGenerator: AIInstructionGenerator
  
  // Core methods
  submitSuggestion(input: SuggestionInput, ip: string): Promise<Suggestion>
  getSuggestions(filters?: SuggestionFilters): Promise<Suggestion[]>
  updateSuggestionStatus(id: string, status: SuggestionStatus): Promise<Suggestion>
  generateAIInstructions(id: string): Promise<string>
  
  // Plugin system
  use(plugin: AINativeCMSPlugin): void
  
  // Events
  on(event: string, callback: Function): void
  emit(event: string, data: any): void
}

// Export all types
export * from './events'