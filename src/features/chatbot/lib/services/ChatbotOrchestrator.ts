/**
 * ChatbotOrchestrator - Main coordination service for intelligent chatbot responses
 *
 * This service orchestrates all chatbot services to provide intelligent,
 * contextual, and helpful responses. It coordinates semantic matching,
 * navigation suggestions, and response quality to create an exceptional
 * user experience.
 */

import { ChatbotResponse, ConversationContext, MatchResult } from '../types'
import type { Language, NavigationSuggestion } from '@/lib/suggestion-utils'
import { SemanticMatchingService } from './SemanticMatchingService'
import { NavigationService } from './NavigationService'
import { ResponseQualityService } from './ResponseQualityService'
import { IntelligentResponder } from './IntelligentResponder'
import { enhanceSuggestion } from '@/lib/suggestion-utils'
import { logger } from '@/lib/logger'

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
      logger.error('ChatbotOrchestrator error', { error })
      return this.generateErrorResponse(context)
    }
  }

  /**
   * Get contextual suggestions for site navigation
   */
  getNavigationSuggestions(query: string, context: ConversationContext): NavigationSuggestion[] {
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
    // Note: metadata is not part of ChatbotResponse type, but useful for debugging
    const responseWithMetadata = enhancedResponse as ChatbotResponse & { metadata?: { matchType: MatchResult['matchType']; processingSteps: string[]; confidence: number } }
    responseWithMetadata.metadata = {
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

    // Page-specific contextual responses with enhanced awareness

    // Services page responses
    if (currentPage === '/services') {
      if (messageLower.includes('price') || messageLower.includes('cost') || messageLower.includes('preis')) {
        return {
          content: language === 'de' ?
            'Da Sie sich auf unserer Services-Seite befinden: Unsere Preise sind fair und transparent. Für eine genaue Kosteneinschätzung zu unseren IT-Services kontaktieren Sie uns gerne für ein unverbindliches Angebot.' :
            'Since you\'re on our services page: Our prices are fair and transparent. For an accurate cost estimate for our IT services, please contact us for a non-binding quote.',
          suggestions: [
            {
              label: language === 'de' ? '📞 Service-Angebot anfragen' : '📞 Request Service Quote',
              href: '/contact',
              description: language === 'de' ? 'Kostenlose Beratung für Services' : 'Free consultation for services',
              priority: 10
            }
          ],
          confidence: 0.85,
          responseType: 'informational'
        }
      }

      if (messageLower.includes('help') || messageLower.includes('service') || messageLower.includes('hilfe') || messageLower.includes('unterstützen')) {
        return {
          content: language === 'de' ?
            'Perfect, Sie sind bereits auf unserer Services-Seite! Ich kann Ihnen helfen, den passenden IT-Service für Ihre Bedürfnisse zu finden. Welcher Bereich interessiert Sie am meisten?' :
            'Perfect, you\'re already on our services page! I can help you find the right IT service for your needs. Which area interests you most?',
          suggestions: [
            {
              label: language === 'de' ? '🔧 IT-Reparatur' : '🔧 IT Repair',
              href: '/services',
              description: language === 'de' ? 'Computer und Geräte reparieren' : 'Repair computers and devices',
              priority: 10
            },
            {
              label: language === 'de' ? '☁️ Cloud-Lösungen' : '☁️ Cloud Solutions',
              href: '/services/cloud-infrastructure',
              description: language === 'de' ? 'Moderne Cloud-Services' : 'Modern cloud services',
              priority: 9
            }
          ],
          confidence: 0.9,
          responseType: 'informational'
        }
      }
    }

    // About page responses
    if (currentPage === '/about') {
      if (messageLower.includes('team') || messageLower.includes('who') || messageLower.includes('wer')) {
        return {
          content: language === 'de' ?
            'Sie sind auf unserer Über-uns-Seite - perfekt! Unser Team besteht aus erfahrenen IT-Experten, die sich für nachhaltige Technologie einsetzen. Wir verbinden technische Expertise mit sozialer Verantwortung.' :
            'You\'re on our about page - perfect! Our team consists of experienced IT experts committed to sustainable technology. We combine technical expertise with social responsibility.',
          suggestions: [
            {
              label: language === 'de' ? '🤝 Team beitreten' : '🤝 Join Our Team',
              href: '/get-involved/volunteer',
              description: language === 'de' ? 'Werden Sie Teil unseres Teams' : 'Become part of our team',
              priority: 9
            }
          ],
          confidence: 0.85,
          responseType: 'informational'
        }
      }

      if (messageLower.includes('mission') || messageLower.includes('goal') || messageLower.includes('ziel')) {
        return {
          content: language === 'de' ?
            'Toll, dass Sie mehr über unsere Mission erfahren möchten! Hier auf der Über-uns-Seite finden Sie alle Details zu unserer Vision für nachhaltige IT und soziale Verantwortung.' :
            'Great that you want to learn more about our mission! Here on the about page you\'ll find all details about our vision for sustainable IT and social responsibility.',
          suggestions: [
            {
              label: language === 'de' ? '🌱 Nachhaltigkeit' : '🌱 Sustainability',
              href: '/about',
              description: language === 'de' ? 'Unsere grüne IT-Mission' : 'Our green IT mission',
              priority: 10
            }
          ],
          confidence: 0.85,
          responseType: 'informational'
        }
      }
    }

    // Volunteer page responses
    if (currentPage === '/get-involved/volunteer') {
      if (messageLower.includes('how') || messageLower.includes('start') || messageLower.includes('wie') || messageLower.includes('anfangen')) {
        return {
          content: language === 'de' ?
            'Sie sind bereits auf der richtigen Seite für Freiwilligenarbeit! Hier finden Sie alle Informationen, wie Sie bei RevampIT ehrenamtlich helfen können. Der erste Schritt ist oft ein Gespräch mit uns.' :
            'You\'re already on the right page for volunteering! Here you\'ll find all information on how you can volunteer with RevampIT. The first step is often a conversation with us.',
          suggestions: [
            {
              label: language === 'de' ? '💬 Gespräch vereinbaren' : '💬 Schedule Meeting',
              href: '/contact',
              description: language === 'de' ? 'Erstes Kennenlernen' : 'Initial meeting',
              priority: 10
            }
          ],
          confidence: 0.9,
          responseType: 'informational'
        }
      }
    }

    // Contact page responses
    if (currentPage === '/contact') {
      if (messageLower.includes('call') || messageLower.includes('phone') || messageLower.includes('anrufen') || messageLower.includes('telefon')) {
        return {
          content: language === 'de' ?
            'Sie sind auf unserer Kontakt-Seite! Hier finden Sie alle unsere Kontaktmöglichkeiten. Für einen direkten Anruf nutzen Sie die Telefonnummer auf dieser Seite.' :
            'You\'re on our contact page! Here you\'ll find all our contact options. For a direct call, use the phone number on this page.',
          suggestions: [
            {
              label: language === 'de' ? '📧 E-Mail senden' : '📧 Send Email',
              href: '/contact',
              description: language === 'de' ? 'Direkter E-Mail-Kontakt' : 'Direct email contact',
              priority: 10
            }
          ],
          confidence: 0.85,
          responseType: 'informational'
        }
      }
    }

    // Projects page responses
    if (currentPage.startsWith('/projects')) {
      if (messageLower.includes('contribute') || messageLower.includes('help') || messageLower.includes('beitragen') || messageLower.includes('helfen')) {
        return {
          content: language === 'de' ?
            'Großartig, dass Sie zu unseren Projekten beitragen möchten! Sie schauen sich gerade unsere Projekte an - perfekt! Wir begrüßen Beiträge in verschiedenen Formen - von Code bis hin zu Dokumentation und Tests.' :
            'Great that you want to contribute to our projects! You\'re looking at our projects right now - perfect! We welcome contributions in various forms - from code to documentation and testing.',
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
    }

    // Workshop page responses - be proactive and helpful for text-messaging users
    if (currentPage === '/workshops') {
      if (messageLower.includes('help') || messageLower.includes('hilfe') || messageLower.includes('what') || messageLower.includes('was') ||
          messageLower.includes('offer') || messageLower.includes('anbieten') || messageLower.includes('learn') || messageLower.includes('lernen') ||
          messageLower.includes('course') || messageLower.includes('kurs') || messageLower.includes('workshop') ||
          messageLower.includes('education') || messageLower.includes('bildung')) {
        return {
          content: language === 'de' ?
            'Perfekt! Sie sind bereits auf unserer Workshop-Seite. Hier bieten wir verschiedene Bildungsangebote zur nachhaltigen IT an. Ich kann Ihnen helfen, die richtigen Workshops für Ihre Bedürfnisse zu finden. Was interessiert Sie besonders?' :
            'Perfect! You\'re already on our workshops page. Here we offer various educational programs about sustainable IT. I can help you find the right workshops for your needs. What interests you particularly?',
          suggestions: [
            {
              label: language === 'de' ? '💻 IT-Grundlagen' : '💻 IT Basics',
              href: '/workshops',
              description: language === 'de' ? 'Einführung in nachhaltige IT' : 'Introduction to sustainable IT',
              priority: 10
            },
            {
              label: language === 'de' ? '🔧 Reparatur-Workshops' : '🔧 Repair Workshops',
              href: '/workshops',
              description: language === 'de' ? 'Lerner Computer reparieren' : 'Learn to repair computers',
              priority: 9
            },
            {
              label: language === 'de' ? '🌱 Nachhaltigkeit' : '🌱 Sustainability',
              href: '/workshops',
              description: language === 'de' ? 'Umweltfreundliche Technologie' : 'Eco-friendly technology',
              priority: 8
            }
          ],
          confidence: 0.9,
          responseType: 'informational'
        }
      }

      if (messageLower.includes('when') || messageLower.includes('schedule') || messageLower.includes('wann') || messageLower.includes('termine')) {
        return {
          content: language === 'de' ?
            'Sie sind auf unserer Workshop-Seite! Hier finden Sie alle aktuellen Termine und Informationen zu unseren Bildungsangeboten. Die Workshops sind eine großartige Möglichkeit zu lernen!' :
            'You\'re on our workshops page! Here you\'ll find all current dates and information about our educational offerings. Workshops are a great way to learn!',
          suggestions: [
            {
              label: language === 'de' ? '📅 Nächste Termine' : '📅 Upcoming Dates',
              href: '/workshops',
              description: language === 'de' ? 'Aktuelle Workshop-Termine' : 'Current workshop dates',
              priority: 10
            }
          ],
          confidence: 0.85,
          responseType: 'informational'
        }
      }

      // General questions on workshops page - be helpful and proactive
      if (messageLower.includes('how') || messageLower.includes('wie') || messageLower.includes('cost') || messageLower.includes('price') ||
          messageLower.includes('kosten') || messageLower.includes('preis') || messageLower.includes('register') || messageLower.includes('anmelden')) {
        return {
          content: language === 'de' ?
            'Auf unserer Workshop-Seite finden Sie alle Details zu Kosten, Anmeldung und Inhalten. Die Workshops sind erschwinglich gestaltet, damit Bildung für alle zugänglich ist. Schauen Sie sich die verfügbaren Angebote an!' :
            'On our workshops page you\'ll find all details about costs, registration, and content. The workshops are affordably priced to make education accessible to everyone. Check out the available offerings!',
          suggestions: [
            {
              label: language === 'de' ? '💰 Kosten & Anmeldung' : '💰 Costs & Registration',
              href: '/workshops',
              description: language === 'de' ? 'Workshop-Details ansehen' : 'View workshop details',
              priority: 10
            }
          ],
          confidence: 0.8,
          responseType: 'informational'
        }
      }

      // Fallback for any question on workshops page - be helpful for text-messaging users
      return {
        content: language === 'de' ?
          'Sie sind auf unserer Workshop-Seite! Hier finden Sie alle Informationen zu unseren Bildungsangeboten in nachhaltiger IT. Kann ich Ihnen bei etwas Bestimmtem helfen - zum Beispiel bei Terminen, Kosten oder bestimmten Themen?' :
          'You\'re on our workshops page! Here you\'ll find all information about our educational offerings in sustainable IT. Can I help you with something specific - like dates, costs, or particular topics?',
        suggestions: [
          {
            label: language === 'de' ? '📚 Alle Workshops' : '📚 All Workshops',
            href: '/workshops',
            description: language === 'de' ? 'Übersicht aller Angebote' : 'Overview of all offerings',
            priority: 10
          },
          {
            label: language === 'de' ? '💬 Fragen stellen' : '💬 Ask Questions',
            href: '/contact',
            description: language === 'de' ? 'Direkte Beratung' : 'Direct consultation',
            priority: 8
          }
        ],
        confidence: 0.6,
        responseType: 'informational'
      }
    }

    // General contextual patterns with page awareness
    if (messageLower.includes('location') || messageLower.includes('where') ||
        messageLower.includes('adresse') || messageLower.includes('wo')) {
      const pageContext = currentPage === '/contact' ?
        (language === 'de' ? ' Sie sind bereits auf der richtigen Seite dafür!' : ' You\'re already on the right page for that!') : ''

      return {
        content: language === 'de' ?
          `Sie finden uns an der Badenerstrasse 816 in 8048 Zürich. Wir sind gut mit öffentlichen Verkehrsmitteln erreichbar.${pageContext}` :
          `You can find us at Badenerstrasse 816 in 8048 Zurich. We are easily accessible by public transport.${pageContext}`,
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

    // Handle page-specific navigation confusion
    if ((messageLower.includes('service') || messageLower.includes('dienst')) && !currentPage.startsWith('/service')) {
      return {
        content: language === 'de' ?
          `Sie fragen nach Services, befinden sich aber aktuell auf ${currentPage}. Lassen Sie mich Ihnen helfen, zur richtigen Seite zu navigieren!` :
          `You\'re asking about services, but you\'re currently on ${currentPage}. Let me help you navigate to the right page!`,
        suggestions: [
          {
            label: language === 'de' ? '🔧 Zu Services' : '🔧 Go to Services',
            href: '/services',
            description: language === 'de' ? 'Unsere IT-Services ansehen' : 'View our IT services',
            priority: 10
          }
        ],
        confidence: 0.75,
        responseType: 'navigational'
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

    return recommendations[interest]?.[language as keyof typeof recommendations[string]] || null
  }

  private deduplicateSuggestions(suggestions: NavigationSuggestion[]): NavigationSuggestion[] {
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