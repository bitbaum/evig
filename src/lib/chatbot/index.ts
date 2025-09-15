/**
 * RevampIT Modern Chatbot System
 *
 * A modular, intelligent chatbot system designed specifically for RevampIT's
 * sustainable IT website. Features advanced semantic understanding,
 * intelligent navigation assistance, and quality-assured responses.
 *
 * Architecture:
 * - ModernChatbotEngine: Main orchestrator and public API
 * - Services: Specialized services for different aspects (semantic matching, navigation, quality)
 * - Types: Comprehensive TypeScript interfaces and types
 * - Utils: Utility functions and helpers
 *
 * Key Features:
 * - 🧠 Semantic understanding of user intent
 * - 🎯 Intelligent site navigation assistance
 * - ✅ Quality-assured responses with fallback mechanisms
 * - 🌐 Multi-language support (German/English)
 * - 📊 Conversation analysis and user journey tracking
 * - 🔧 Modular architecture for easy maintenance and extension
 */

// Main engine export
export { ModernChatbotEngine, modernChatbotEngine, chatbotEngine } from './ModernChatbotEngine'

// Core types
export type {
  Language,
  NavigationSuggestion,
  ChatbotResponse,
  ConversationContext,
  UserIntent,
  SemanticPattern,
  SiteSection,
  ResponseTemplate,
  MatchResult,
  NavigationIntent
} from './types'

// Individual services (for advanced use cases)
export { SemanticMatchingService } from './services/SemanticMatchingService'
export { NavigationService } from './services/NavigationService'
export { ResponseQualityService } from './services/ResponseQualityService'
export { ChatbotOrchestrator } from './services/ChatbotOrchestrator'