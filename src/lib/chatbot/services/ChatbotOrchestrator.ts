/**
 * ChatbotOrchestrator - Main coordination service for intelligent chatbot responses
 *
 * This service orchestrates all chatbot services to provide intelligent,
 * contextual, and helpful responses. It coordinates semantic matching,
 * navigation suggestions, and response quality to create an exceptional
 * user experience.
 */

import { ChatbotResponse, ConversationContext, Language, MatchResult } from '../types'
import { SemanticMatchingService } from './SemanticMatchingService'
import { NavigationService } from './NavigationService'
import { ResponseQualityService } from './ResponseQualityService'
import { IntelligentResponder } from './IntelligentResponder'
import { enhanceSuggestion } from '../utils/SuggestionEnhancer'

export class ChatbotOrchestrator {
  private semanticMatcher: SemanticMatchingService
  private navigationService: NavigationService
  private qualityService: ResponseQualityService
  private intelligentResponder: IntelligentResponder

  constructor() {
    this.semanticMatcher = new SemanticMatchingService()
    this.navigationService = new NavigationService()
    this.qualityService = new ResponseQualityService()
    this.intelligentResponder = new IntelligentResponder()
  }

  /**
   * Process a user message and generate the best possible response
   */
  async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<ChatbotResponse> {
    try {
      // Step 1: Try intelligent pattern-based response (new!)
      const intelligentResponse = this.intelligentResponder.generateIntelligentResponse(message, context)

      if (intelligentResponse && intelligentResponse.confidence > 0.8) {
        return await this.enhanceResponse(intelligentResponse, context, message, 'semantic')
      }

      // Step 2: Try semantic matching for complex queries
      const semanticResponse = this.semanticMatcher.findSemanticMatch(message, context.language)

      if (semanticResponse && semanticResponse.confidence > 0.7) {
        return await this.enhanceResponse(semanticResponse, context, message, 'semantic')
      }

      // Step 3: Try contextual matching based on current page and query
      const contextualResponse = this.generateContextualResponse(message, context)

      if (contextualResponse && contextualResponse.confidence > 0.6) {
        return await this.enhanceResponse(contextualResponse, context, message, 'context')
      }

      // Step 4: Use navigation service for general guidance
      const navigationResponse = this.generateNavigationResponse(message, context)

      if (navigationResponse && navigationResponse.confidence > 0.5) {
        return await this.enhanceResponse(navigationResponse, context, message, 'navigation')
      }

      // Step 5: Generate high-quality fallback response
      const fallbackResponse = this.qualityService.createQualityFallbackResponse(context, message)
      return await this.enhanceResponse(fallbackResponse, context, message, 'fallback')

    } catch (error) {
      console.error('ChatbotOrchestrator error:', error)
      return this.generateErrorResponse(context)
    }
  }

  /**
   * Get contextual suggestions for site navigation
   */
  getNavigationSuggestions(query: string, context: ConversationContext): any[] {
    return this.navigationService.getNavigationSuggestions(query, context)
  }

  /**
   * Analyze conversation context for better responses
   */
  analyzeConversationContext(context: ConversationContext): {
    userJourney: string[]
    interests: string[]
    recommendedActions: string[]
  } {
    const interests: string[] = []
    const recommendedActions: string[] = []

    // Analyze user history to understand interests
    context.userHistory.forEach(message => {
      const intent = this.semanticMatcher.extractUserIntent(message, context.language)
      if (intent.confidence > 0.5) {
        interests.push(intent.category)
      }
    })

    // Generate recommended actions based on interests and current page
    const uniqueInterests = [...new Set(interests)]
    uniqueInterests.forEach(interest => {
      const recommendation = this.getRecommendationForInterest(interest, context)
      if (recommendation) {
        recommendedActions.push(recommendation)
      }
    })

    return {
      userJourney: context.userHistory.slice(-5), // Last 5 interactions
      interests: uniqueInterests,
      recommendedActions
    }
  }

  private async enhanceResponse(
    baseResponse: ChatbotResponse,
    context: ConversationContext,
    originalQuery: string,
    matchType: MatchResult['matchType']
  ): Promise<ChatbotResponse> {
    // Add navigation suggestions
    const navigationSuggestions = this.navigationService.getNavigationSuggestions(
      originalQuery,
      context,
      4 // Leave room for existing suggestions
    )

    // Merge suggestions intelligently and enhance with icons
    const allSuggestions = [...baseResponse.suggestions, ...navigationSuggestions]
    baseResponse.suggestions = this.deduplicateSuggestions(allSuggestions)
      .slice(0, 5)
      .map(suggestion => enhanceSuggestion(suggestion, context.language))

    // Enhance with quality improvements
    const enhancedResponse = this.qualityService.enhanceResponse(
      baseResponse,
      context,
      originalQuery
    )

    // Add metadata about how the response was generated
    ;(enhancedResponse as any).metadata = {
      matchType,
      processingSteps: ['semantic', 'navigation', 'quality'],
      confidence: enhancedResponse.confidence
    }

    return enhancedResponse
  }

  private generateContextualResponse(message: string, context: ConversationContext): ChatbotResponse | null {
    const currentPage = context.currentPage
    const language = context.language
    const messageLower = message.toLowerCase()

    // Page-specific contextual responses
    if (currentPage === '/services' && messageLower.includes('price')) {
      return {
        content: language === 'de' ?
          'Unsere Preise sind fair und transparent. Für eine genaue Kosteneinschätzung kontaktieren Sie uns gerne für ein unverbindliches Angebot.' :
          'Our prices are fair and transparent. For an accurate cost estimate, please contact us for a non-binding quote.',
        suggestions: [
          {
            label: language === 'de' ? '📞 Angebot anfragen' : '📞 Request Quote',
            href: '/contact',
            description: language === 'de' ? 'Kostenlose Beratung' : 'Free consultation',
            priority: 10
          }
        ],
        confidence: 0.8,
        responseType: 'informational'
      }
    }

    if (currentPage === '/about' && messageLower.includes('team')) {
      return {
        content: language === 'de' ?
          'Unser Team besteht aus erfahrenen IT-Experten, die sich für nachhaltige Technologie einsetzen. Wir verbinden technische Expertise mit sozialer Verantwortung.' :
          'Our team consists of experienced IT experts committed to sustainable technology. We combine technical expertise with social responsibility.',
        suggestions: [
          {
            label: language === 'de' ? '🤝 Team beitreten' : '🤝 Join Our Team',
            href: '/get-involved/volunteer',
            description: language === 'de' ? 'Werden Sie Teil unseres Teams' : 'Become part of our team',
            priority: 9
          }
        ],
        confidence: 0.8,
        responseType: 'informational'
      }
    }

    if (currentPage.startsWith('/projects') && messageLower.includes('contribute')) {
      return {
        content: language === 'de' ?
          'Großartig, dass Sie zu unseren Projekten beitragen möchten! Wir begrüßen Beiträge in verschiedenen Formen - von Code bis hin zu Dokumentation und Tests.' :
          'Great that you want to contribute to our projects! We welcome contributions in various forms - from code to documentation and testing.',
        suggestions: [
          {
            label: language === 'de' ? '👨‍💻 Als Entwickler helfen' : '👨‍💻 Help as Developer',
            href: '/get-involved/technical-experts',
            description: language === 'de' ? 'Technische Expertise einbringen' : 'Contribute technical expertise',
            priority: 10
          }
        ],
        confidence: 0.9,
        responseType: 'informational'
      }
    }

    // General contextual patterns
    if (messageLower.includes('location') || messageLower.includes('where') ||
        messageLower.includes('adresse') || messageLower.includes('wo')) {
      return {
        content: language === 'de' ?
          'Sie finden uns an der Badenerstrasse 816 in 8048 Zürich. Wir sind gut mit öffentlichen Verkehrsmitteln erreichbar.' :
          'You can find us at Badenerstrasse 816 in 8048 Zurich. We are easily accessible by public transport.',
        suggestions: [
          {
            label: language === 'de' ? '📍 Wegbeschreibung' : '📍 Directions',
            href: '/contact',
            description: language === 'de' ? 'Anfahrt und Kontaktdaten' : 'Directions and contact details',
            priority: 10
          }
        ],
        confidence: 0.85,
        responseType: 'informational'
      }
    }

    return null
  }

  private generateNavigationResponse(message: string, context: ConversationContext): ChatbotResponse | null {
    const matchingSections = this.navigationService.findMatchingSections(message, context.language)

    if (matchingSections.length === 0) {
      return null
    }

    const language = context.language
    const bestMatch = matchingSections[0]

    return {
      content: language === 'de' ?
        `Basierend auf Ihrer Anfrage könnte "${bestMatch.name}" interessant für Sie sein. ${bestMatch.description}` :
        `Based on your request, "${bestMatch.name}" might be interesting for you. ${bestMatch.description}`,
      suggestions: [
        {
          label: `🎯 ${bestMatch.name}`,
          href: bestMatch.path,
          description: bestMatch.description,
          priority: 10
        },
        ...this.navigationService.getExplorationSuggestions(bestMatch.path, language).slice(0, 3)
      ],
      confidence: 0.7,
      responseType: 'navigational'
    }
  }

  private getRecommendationForInterest(interest: string, context: ConversationContext): string | null {
    const language = context.language

    const recommendations: { [key: string]: { [key in Language]: string } } = {
      'buy': {
        'en': 'Check out our refurbished computer shop for quality devices',
        'de': 'Schauen Sie in unserem Refurbished-Computer-Shop für Qualitätsgeräte'
      },
      'repair': {
        'en': 'Consider our professional repair services',
        'de': 'Erwägen Sie unsere professionellen Reparaturservices'
      },
      'learn': {
        'en': 'Join our educational workshops',
        'de': 'Nehmen Sie an unseren Bildungsworkshops teil'
      },
      'volunteer': {
        'en': 'Explore volunteer opportunities with us',
        'de': 'Entdecken Sie Freiwilligenmöglichkeiten bei uns'
      }
    }

    return recommendations[interest]?.[language] || null
  }

  private deduplicateSuggestions(suggestions: any[]): any[] {
    const seen = new Set<string>()
    return suggestions.filter(suggestion => {
      if (seen.has(suggestion.href)) {
        return false
      }
      seen.add(suggestion.href)
      return true
    })
  }

  private generateErrorResponse(context: ConversationContext): ChatbotResponse {
    const language = context.language

    return {
      content: language === 'de' ?
        'Entschuldigung, ich habe gerade technische Probleme. Sie können unser Hauptmenü nutzen oder uns direkt kontaktieren.' :
        'Sorry, I\'m having technical problems right now. You can use our main menu or contact us directly.',
      suggestions: [
        {
          label: language === 'de' ? '📞 Support kontaktieren' : '📞 Contact Support',
          href: '/contact',
          description: language === 'de' ? 'Direkte Hilfe' : 'Direct assistance',
          priority: 10
        },
        {
          label: language === 'de' ? '🏠 Startseite' : '🏠 Home',
          href: '/',
          description: language === 'de' ? 'Zurück zur Startseite' : 'Back to homepage',
          priority: 8
        }
      ],
      confidence: 0.5,
      responseType: 'error'
    }
  }
}