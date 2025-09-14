import { 
  StorageAdapter, 
  Suggestion, 
  SuggestionInput, 
  SuggestionFilters, 
  SuggestionStatus,
  SuggestionStats 
} from '../types'
import { v4 as uuidv4 } from 'uuid'

export class MemoryStorageAdapter implements StorageAdapter {
  private suggestions = new Map<string, Suggestion>()
  
  constructor(private config: Record<string, any> = {}) {}

  async create(input: SuggestionInput, ip: string): Promise<Suggestion> {
    const id = uuidv4()
    const now = new Date()
    
    const suggestion: Suggestion = {
      id,
      content: input.content,
      contact: input.contact,
      page: input.page,
      url: input.url,
      timestamp: now.toISOString(),
      ip,
      status: SuggestionStatus.PENDING,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    }

    this.suggestions.set(id, suggestion)
    return { ...suggestion }
  }

  async findById(id: string): Promise<Suggestion | null> {
    const suggestion = this.suggestions.get(id)
    return suggestion ? { ...suggestion } : null
  }

  async findAll(filters?: SuggestionFilters): Promise<Suggestion[]> {
    let suggestions = Array.from(this.suggestions.values())

    if (filters) {
      if (filters.status) {
        suggestions = suggestions.filter(s => s.status === filters.status)
      }
      
      if (filters.page) {
        suggestions = suggestions.filter(s => s.page === filters.page)
      }
      
      if (filters.dateFrom) {
        suggestions = suggestions.filter(s => s.createdAt >= filters.dateFrom!)
      }
      
      if (filters.dateTo) {
        suggestions = suggestions.filter(s => s.createdAt <= filters.dateTo!)
      }
      
      // Sort by creation date (newest first)
      suggestions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      if (filters.offset) {
        suggestions = suggestions.slice(filters.offset)
      }
      
      if (filters.limit) {
        suggestions = suggestions.slice(0, filters.limit)
      }
    }

    return suggestions.map(s => ({ ...s }))
  }

  async update(id: string, updates: Partial<Suggestion>): Promise<Suggestion> {
    const existing = this.suggestions.get(id)
    if (!existing) {
      throw new Error(`Suggestion with id ${id} not found`)
    }

    const updated = {
      ...existing,
      ...updates,
      id, // Ensure ID cannot be changed
      updatedAt: new Date()
    }

    this.suggestions.set(id, updated)
    return { ...updated }
  }

  async delete(id: string): Promise<boolean> {
    return this.suggestions.delete(id)
  }

  async getStats(): Promise<SuggestionStats> {
    const suggestions = Array.from(this.suggestions.values())
    
    const byStatus = {
      [SuggestionStatus.PENDING]: 0,
      [SuggestionStatus.PROCESSING]: 0,
      [SuggestionStatus.AI_GENERATED]: 0,
      [SuggestionStatus.IN_PROGRESS]: 0,
      [SuggestionStatus.COMPLETED]: 0,
      [SuggestionStatus.REJECTED]: 0
    }

    const byPage: Record<string, number> = {}

    for (const suggestion of suggestions) {
      byStatus[suggestion.status]++
      
      if (byPage[suggestion.page]) {
        byPage[suggestion.page]++
      } else {
        byPage[suggestion.page] = 1
      }
    }

    // Get recent activity (last 10 suggestions)
    const recentActivity = suggestions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(s => ({ ...s }))

    return {
      total: suggestions.length,
      byStatus,
      byPage,
      recentActivity
    }
  }

  // Memory adapter specific methods
  clear(): void {
    this.suggestions.clear()
  }

  size(): number {
    return this.suggestions.size
  }

  // Optional lifecycle methods
  async init?(): Promise<void> {
    // Nothing to initialize for memory adapter
  }

  async destroy?(): Promise<void> {
    this.suggestions.clear()
  }
}