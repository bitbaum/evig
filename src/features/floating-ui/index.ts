/**
 * Floating UI Components
 *
 * Centralized location for all floating UI elements including:
 * - RevampCopilot (AI assistant chatbot)
 * - SuggestionButton (comprehensive feedback system)
 *
 * These components provide floating interface elements that appear
 * over the main content for user interaction.
 */

export { default as RevampCopilot } from './components/RevampCopilot'
export { default as SuggestionButton } from './components/SuggestionButton'

// Re-export types
export type {
  FeedbackScope,
  SelectedElement,
  SuggestionFormData,
  SuggestionSubmission,
} from './types'

// Re-export config
export { SCOPE_CONFIG, getQuickSuggestions } from './config/scope-config'
