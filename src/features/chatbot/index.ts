/**
 * RevampIT Chatbot Feature
 * 
 * A complete feature module for the RevampIT chatbot system.
 * Follows feature-based architecture for better organization and maintainability.
 * 
 * Components:
 * - RevampCopilot: Main chatbot widget
 * - ChatMessage: Individual chat message display
 * - ChatInput: User input component
 * - ChatWindow: Chat conversation display
 * - ChatHeader: Chat header with controls
 * - FloatingButton: Main activation button
 * - LoadingIndicator: Typing indicator
 * 
 * Hooks:
 * - useChatbot: Main chatbot logic and state management
 * 
 * Lib:
 * - Complete chatbot engine and services (moved from /lib/chatbot)
 */

// Main component exports
import RevampCopilotComponent from './components/RevampCopilot'
export { RevampCopilotComponent as RevampCopilot }
export default RevampCopilotComponent

// Individual components (for custom implementations)
export { ChatMessage } from './components/ChatMessage'
export { ChatInput } from './components/ChatInput'
export { ChatWindow } from './components/ChatWindow'
export { ChatHeader } from './components/ChatHeader'
export { FloatingButton } from './components/FloatingButton'
export { LoadingIndicator } from './components/LoadingIndicator'

// Hooks
export { useChatbot } from './hooks/useChatbot'
export type { ChatMessage as ChatMessageType } from './hooks/useChatbot'

// Re-export main engine (for external use)
export { modernChatbotEngine, ModernChatbotEngine } from './lib/ModernChatbotEngine'