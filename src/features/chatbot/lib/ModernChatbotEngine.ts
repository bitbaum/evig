/**
 * ModernChatbotEngine - Next-generation chatbot with modular architecture
 *
 * This is the main entry point for the modernized chatbot system. It provides
 * a clean API that coordinates all specialized services to deliver intelligent,
 * contextual, and helpful responses.
 *
 * Key improvements over the legacy system:
 * - Modular, single-responsibility services
 * - Advanced semantic understanding
 * - Intelligent navigation assistance
 * - Quality-assured responses
 * - Comprehensive fallback mechanisms
 * - Better TypeScript types and interfaces
 */

import { ChatbotResponse, ConversationContext, Language } from './types'
import { ChatbotOrchestrator } from './services/ChatbotOrchestrator'
import { NavigationService } from './services/NavigationService'
import { logger } from '@/lib/logger'

export class ModernChatbotEngine {
  private orchestrator: ChatbotOrchestrator
  private navigationService: NavigationService
  private conversationHistory: Map<string, string[]> = new Map()

  constructor() {
    this.orchestrator = new ChatbotOrchestrator()
    this.navigationService = new NavigationService()
  }

  /**
   * Process a user message and return an intelligent response
   *
   * @param message - The user's message
   * @param context - Conversation context including current page and language
   * @returns Promise resolving to a comprehensive chatbot response
   */
  async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<ChatbotResponse> {
    // Validate input
    if (!message?.trim()) {
      return this.createEmptyMessageResponse(context.language)
    }

    // Update conversation history
    this.updateConversationHistory(context, message)

    // Process through orchestrator
    const response = await this.orchestrator.processMessage(message, {
      ...context,
      userHistory: this.getConversationHistory(context) || context.userHistory
    })

    // Log interaction for analytics (in a real app, this would go to analytics service)
    this.logInteraction(message, response, context)

    return response
  }

  /**
   * Get intelligent navigation suggestions without processing a specific message
   *
   * @param context - Current conversation context
   * @param query - Optional search query
   * @returns Array of navigation suggestions
   */
  getNavigationSuggestions(
    context: ConversationContext,
    query?: string
  ): ChatbotResponse['suggestions'] {
    return this.navigationService.getNavigationSuggestions(
      query || '',
      context,
      6
    )
  }

  /**
   * Analyze user conversation patterns for insights
   *
   * @param context - Conversation context
   * @returns Analysis of user interests and journey
   */
  analyzeUserJourney(context: ConversationContext): {
    interests: string[]
    recommendedActions: string[]
    conversationStage: 'discovery' | 'consideration' | 'decision' | 'support'
  } {
    const analysis = this.orchestrator.analyzeConversationContext(context)
    const stage = this.determineConversationStage(analysis.interests, context)

    return {
      interests: analysis.interests,
      recommendedActions: analysis.recommendedActions,
      conversationStage: stage
    }
  }

  /**
   * Get welcome message with contextual suggestions
   *
   * @param currentPage - Current page path
   * @param language - User's preferred language
   * @returns Welcome response with relevant suggestions
   */
  getWelcomeMessage(currentPage: string, language: Language): ChatbotResponse {
    const welcomeMessages: Record<Language, Record<string, string>> = {
      de: {
        'default': 'Hallo! Ich bin Ihr Revamp-IT Assistent und helfe Ihnen dabei, genau das zu finden, was Sie suchen. Wie kann ich Ihnen heute helfen?',
        '/': 'Willkommen bei Revamp-IT! Ich helfe Ihnen gerne bei der Entdeckung unserer nachhaltigen IT-Lösungen.',
        '/services': 'Sie schauen sich unsere Dienstleistungen an! Perfekt - ich kann Ihnen helfen, den passenden Service für Ihre Bedürfnisse zu finden.',
        '/about': 'Sie sind auf unserer Über-uns-Seite! Möchten Sie mehr über unsere Mission und unser Team erfahren?',
        '/contact': 'Sie möchten mit uns in Kontakt treten? Perfekt - ich helfe Ihnen gerne bei der Kontaktaufnahme!',
        '/projects': 'Unsere Projekte sind wirklich spannend! Lassen Sie mich Ihnen zeigen, welche Open-Source-Projekte für Sie interessant sein könnten.',
        '/blog': 'Sie lesen unsere Blog-Artikel! Hier finden Sie die neuesten Einblicke in nachhaltige IT. Kann ich Ihnen bei der Navigation helfen?',
        '/workshops': 'Interessieren Sie sich für unsere Workshops? Grossartig - Bildung ist der Schlüssel zur nachhaltigen IT!',
        '/get-involved': 'Fantastisch, dass Sie sich engagieren möchten! Es gibt viele Wege, wie Sie bei Revamp-IT mitmachen können.',
        '/get-involved/volunteer': 'Sie interessieren sich fürs Ehrenamt bei uns? Wunderbar - freiwillige Helfer sind das Herz von Revamp-IT!',
        '/get-involved/donate': 'Vielen Dank, dass Sie uns unterstützen möchten! deine Spende hilft uns, unsere Mission voranzutreiben.',
        '/get-involved/internships': 'Sie schauen sich unsere Praktikumsmöglichkeiten an? Perfekt - wir bieten spannende Lernerfahrungen!',
        '/get-involved/partnerships': 'Sie denken über eine Partnerschaft nach? Grossartig - gemeinsam können wir mehr erreichen!',
        '/get-involved/technical-experts': 'Als technischer Experte können Sie einen enormen Beitrag leisten! Lassen Sie uns sprechen.',
        '/get-involved/work-reintegration': 'Sie informieren sich über unsere Wiedereingliederungsprogramme? Das ist ein wichtiger Teil unserer Mission!'
      },
      en: {
        'default': 'Hello! I\'m your Revamp-IT assistant and I\'m here to help you find exactly what you need. How can I assist you today?',
        '/': 'Welcome to Revamp-IT! I\'m happy to help you discover our sustainable IT solutions.',
        '/services': 'You\'re exploring our services! Perfect - I can help you find the right service for your specific needs.',
        '/about': 'You\'re on our About page! Would you like to learn more about our mission and team?',
        '/contact': 'Looking to get in touch with us? Perfect - I\'m happy to help you with contacting us!',
        '/projects': 'Our projects are really exciting! Let me show you which open-source projects might interest you most.',
        '/blog': 'You\'re reading our blog articles! Here you\'ll find the latest insights into sustainable IT. Can I help you navigate?',
        '/workshops': 'Interested in our workshops? Great - education is key to sustainable IT!',
        '/get-involved': 'Fantastic that you want to get involved! There are many ways you can participate with Revamp-IT.',
        '/get-involved/volunteer': 'You\'re interested in volunteering with us? Wonderful - volunteers are the heart of Revamp-IT!',
        '/get-involved/donate': 'Thank you for wanting to support us! Your donation helps us advance our mission.',
        '/get-involved/internships': 'You\'re looking at our internship opportunities? Perfect - we offer exciting learning experiences!',
        '/get-involved/partnerships': 'Thinking about a partnership? Great - together we can achieve more!',
        '/get-involved/technical-experts': 'As a technical expert, you can make an enormous contribution! Let\'s talk.',
        '/get-involved/work-reintegration': 'You\'re learning about our work reintegration programs? That\'s an important part of our mission!'
      }
    }

    // Handle dynamic service and project pages
    let content: string
    if (currentPage.startsWith('/services/') && !welcomeMessages[language][currentPage]) {
      content = language === 'de'
        ? 'Sie schauen sich einen unserer spezifischen Services an! Ich kann Ihnen gerne Details erklären und passende Lösungen empfehlen.'
        : 'You\'re looking at one of our specific services! I can gladly explain details and recommend suitable solutions.'
    } else if (currentPage.startsWith('/projects/') && !welcomeMessages[language][currentPage]) {
      content = language === 'de'
        ? 'Sie erkunden eines unserer Open-Source-Projekte! Möchten Sie mehr über die technischen Details oder Beitragsmöglichkeiten erfahren?'
        : 'You\'re exploring one of our open-source projects! Would you like to learn more about technical details or contribution opportunities?'
    } else {
      content = welcomeMessages[language][currentPage] || welcomeMessages[language]['default']
    }

    // Get contextual suggestions for the current page
    const suggestions = this.navigationService.getNavigationSuggestions('', {
      currentPage,
      language,
      userHistory: [],
      timeOfDay: new Date().getHours()
    }, 4)

    return {
      content,
      suggestions,
      confidence: 1.0,
      responseType: 'informational',
      followUp: [
        language === 'de' ?
          'Worüber möchten Sie mehr erfahren?' :
          'What would you like to learn more about?'
      ]
    }
  }

  /**
   * Handle special commands (e.g., /help, /reset)
   *
   * @param command - Command string
   * @param context - Conversation context
   * @returns Response for the command
   */
  handleCommand(command: string, context: ConversationContext): ChatbotResponse {
    const language = context.language

    switch (command.toLowerCase()) {
      case '/help':
        return {
          content: language === 'de' ?
            'Ich helfe Ihnen gerne bei der Navigation auf unserer Website! Fragen Sie mich nach unseren Services, dem Online-Shop, Workshops oder wie Sie bei Revamp-IT mitmachen können.' :
            'I\'m happy to help you navigate our website! Ask me about our services, online shop, workshops, or how to get involved with Revamp-IT.',
          suggestions: this.getNavigationSuggestions(context),
          confidence: 1.0,
          responseType: 'informational'
        }

      case '/reset':
        this.clearConversationHistory(context)
        return {
          content: language === 'de' ?
            'Unterhaltung zurückgesetzt. Wie kann ich Ihnen heute helfen?' :
            'Conversation reset. How can I help you today?',
          suggestions: this.getNavigationSuggestions(context),
          confidence: 1.0,
          responseType: 'informational'
        }

      default:
        return {
          content: language === 'de' ?
            'Unbekannter Befehl. Verfügbare Befehle: /help, /reset' :
            'Unknown command. Available commands: /help, /reset',
          suggestions: [],
          confidence: 0.5,
          responseType: 'error'
        }
    }
  }

  private createEmptyMessageResponse(language: Language): ChatbotResponse {
    return {
      content: language === 'de' ?
        'Wie kann ich Ihnen helfen? Stellen Sie mir eine Frage!' :
        'How can I help you? Ask me a question!',
      suggestions: [],
      confidence: 0.5,
      responseType: 'fallback'
    }
  }

  private updateConversationHistory(context: ConversationContext, message: string): void {
    const sessionKey = this.getSessionKey(context)
    const history = this.conversationHistory.get(sessionKey) || []
    history.push(message)

    // Keep only last 10 messages
    if (history.length > 10) {
      history.shift()
    }

    this.conversationHistory.set(sessionKey, history)
  }

  private getConversationHistory(context: ConversationContext): string[] | null {
    const sessionKey = this.getSessionKey(context)
    return this.conversationHistory.get(sessionKey) || null
  }

  private clearConversationHistory(context: ConversationContext): void {
    const sessionKey = this.getSessionKey(context)
    this.conversationHistory.delete(sessionKey)
  }

  private getSessionKey(context: ConversationContext): string {
    // In a real application, this would use a proper session ID
    // For now, we use a combination of page and timestamp
    return `${context.currentPage}_${Math.floor(Date.now() / (1000 * 60 * 30))}` // 30-minute sessions
  }

  private determineConversationStage(
    interests: string[],
    context: ConversationContext
  ): 'discovery' | 'consideration' | 'decision' | 'support' {
    if (interests.includes('contact') || interests.includes('buy')) {
      return 'decision'
    }

    if (interests.includes('repair') || context.currentPage.startsWith('/services')) {
      return 'support'
    }

    if (interests.length > 2 || interests.includes('learn')) {
      return 'consideration'
    }

    return 'discovery'
  }

  private logInteraction(
    message: string,
    response: ChatbotResponse,
    context: ConversationContext
  ): void {
    // In a real application, this would send data to analytics
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Chatbot Interaction:', {
        timestamp: new Date().toISOString(),
        message: message.substring(0, 100), // Truncate for privacy
        confidence: response.confidence,
        responseType: response.responseType,
        suggestionsCount: response.suggestions.length,
        currentPage: context.currentPage,
        language: context.language
      })
    }
  }
}

// Create singleton instance for export
export const modernChatbotEngine = new ModernChatbotEngine()

// Legacy compatibility layer
export const chatbotEngine = {
  processMessage: (message: string, context: ConversationContext) =>
    modernChatbotEngine.processMessage(message, context)
}