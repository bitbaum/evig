// Main entry point for AI-Native CMS React Components
export { SuggestionWidget } from './components/SuggestionWidget'
export { AdminDashboard } from './components/AdminDashboard'

// Re-export core types for convenience
export type {
  Suggestion,
  SuggestionStatus,
  SuggestionFilters,
  AINativeCMSConfig,
  SiteConfig
} from '@ai-native-cms/core'

// Component prop types
export type { SuggestionWidgetProps } from './components/SuggestionWidget'
export type { AdminDashboardProps } from './components/AdminDashboard'

// React hooks for AI-Native CMS
export { useAINativeCMS } from './hooks/useAINativeCMS'
export { useSuggestions } from './hooks/useSuggestions'

// Provider component for React context
export { AINativeCMSProvider } from './providers/AINativeCMSProvider'