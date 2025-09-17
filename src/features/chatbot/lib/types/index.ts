/**
 * Core types and interfaces for the RevampIT chatbot system
 *
 * This file defines all the TypeScript interfaces and types used throughout
 * the chatbot system to ensure type safety and clear contracts between modules.
 */

// Import and re-export shared types
import type { Language, NavigationSuggestion } from '@/lib/suggestion-utils'
export type { Language, NavigationSuggestion }

export interface ChatbotResponse {
  /** The main response content */
  content: string
  /** Navigation suggestions to show */
  suggestions: NavigationSuggestion[]
  /** Confidence score (0-1) indicating response quality */
  confidence: number
  /** Optional follow-up questions to suggest */
  followUp?: string[]
  /** Response type for UI styling */
  responseType?: 'informational' | 'navigational' | 'error' | 'fallback'
}

export interface ConversationContext {
  /** Current page path */
  currentPage: string
  /** Recent user message history */
  userHistory: string[]
  /** User's preferred language */
  language: Language
  /** Additional session data */
  sessionData?: Record<string, any>
  /** Time of day (0-23) for contextual responses */
  timeOfDay?: number
}

export interface SemanticPattern {
  /** Keywords that trigger this pattern */
  keywords: string[]
  /** Phrases that match this pattern */
  phrases: string[]
  /** Intent category */
  intent: string
  /** Confidence weight */
  weight: number
  /** Language-specific patterns */
  language?: Language
}

export interface SiteSection {
  /** Section path */
  path: string
  /** Section name */
  name: string
  /** Section description */
  description: string
  /** Available in languages */
  languages: Language[]
  /** Child sections */
  children?: SiteSection[]
  /** Keywords associated with this section */
  keywords: string[]
}

export interface ResponseTemplate {
  /** Template content with placeholders */
  template: string
  /** Required context variables */
  requiredContext: string[]
  /** Confidence score for this template */
  confidence: number
  /** When to use this template */
  conditions?: {
    intent?: string
    page?: string
    language?: Language
  }
}

export interface UserIntent {
  /** Primary intent category */
  category: 'buy' | 'repair' | 'learn' | 'volunteer' | 'donate' | 'contact' | 'navigate' | 'unknown'
  /** Confidence in this intent detection */
  confidence: number
  /** Extracted entities (e.g., product types, service names) */
  entities: string[]
  /** Secondary intents */
  secondaryIntents?: string[]
}

export interface MatchResult {
  /** The matched response */
  response: ChatbotResponse
  /** How this match was found */
  matchType: 'exact' | 'semantic' | 'keyword' | 'context' | 'navigation' | 'fallback'
  /** Confidence score */
  confidence: number
}

export interface NavigationIntent {
  /** What the user wants to find */
  target: string
  /** How specific the request is */
  specificity: 'exact' | 'category' | 'general'
  /** Suggested paths */
  suggestedPaths: string[]
}