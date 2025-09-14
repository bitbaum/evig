// Event system for AI-Native CMS
// Allows for extensible event-driven architecture

export interface AINativeCMSEvents {
  // Suggestion lifecycle events
  'suggestion:created': { suggestion: import('./index').Suggestion }
  'suggestion:updated': { suggestion: import('./index').Suggestion, changes: Partial<import('./index').Suggestion> }
  'suggestion:status_changed': { suggestion: import('./index').Suggestion, oldStatus: import('./index').SuggestionStatus }
  'suggestion:ai_generated': { suggestion: import('./index').Suggestion, instructions: string }
  'suggestion:deleted': { id: string }
  
  // Rate limiting events
  'rate_limit:exceeded': { ip: string, attempts: number }
  'rate_limit:reset': { ip: string }
  
  // Notification events
  'notification:sent': { provider: string, payload: import('./index').NotificationPayload, success: boolean }
  'notification:failed': { provider: string, payload: import('./index').NotificationPayload, error: Error }
  
  // AI events
  'ai:generation_started': { suggestionId: string }
  'ai:generation_completed': { suggestionId: string, instructions: string }
  'ai:generation_failed': { suggestionId: string, error: Error }
  
  // System events
  'cms:initialized': { config: import('./index').AINativeCMSConfig }
  'cms:shutdown': {}
  
  // Plugin events
  'plugin:loaded': { plugin: import('./index').AINativeCMSPlugin }
  'plugin:unloaded': { pluginName: string }
}

export type EventName = keyof AINativeCMSEvents
export type EventPayload<T extends EventName> = AINativeCMSEvents[T]