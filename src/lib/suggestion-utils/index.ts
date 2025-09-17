/**
 * Shared suggestion utilities for RevampIT application
 * 
 * This module provides consistent suggestion handling across features,
 * including chatbot and feedback systems.
 * 
 * Key exports:
 * - Types: NavigationSuggestion, Language, SuggestionConfig
 * - Icon utilities: getSuggestionIcon, ensureIconInLabel 
 * - Enhancement: enhanceSuggestion, getEnhancedSuggestion, createEnhancedSuggestions
 */

// Core types
export type { NavigationSuggestion, Language, SuggestionConfig, IconConfig } from './types'

// Icon utilities
export { 
  SUGGESTION_ICONS,
  getSuggestionIcon, 
  ensureIconInLabel 
} from './iconMapping'

// Suggestion enhancement
export {
  ENHANCED_SUGGESTIONS,
  enhanceSuggestion,
  getEnhancedSuggestion,
  createEnhancedSuggestions
} from './suggestionEnhancer'