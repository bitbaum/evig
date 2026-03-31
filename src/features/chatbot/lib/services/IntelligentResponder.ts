/**
 * IntelligentResponder - Advanced frontend-only chatbot intelligence
 *
 * This service provides sophisticated response logic without requiring a backend,
 * using pattern matching, context analysis, and intelligent fallbacks
 */

import { ChatbotResponse, ConversationContext } from '../types'
import type { Language, NavigationSuggestion } from '@/lib/suggestion-utils'
import { createEnhancedSuggestions } from '@/lib/suggestion-utils'
import { LOCATIONS } from '@/config/org'

export class IntelligentResponder {
  private responsePatterns: Map<string, ResponsePattern[]>

  constructor() {
    this.responsePatterns = new Map()
    this.initializePatterns()
  }

  /**
   * Generate intelligent response based on query analysis
   */
  generateIntelligentResponse(
    query: string,
    context: ConversationContext
  ): ChatbotResponse | null {
    const queryLower = query.toLowerCase()
    const language = context.language

    // Multi-language pattern matching
    const patterns = this.analyzeQueryPatterns(queryLower, language)

    if (patterns.length === 0) {
      return null
    }

    const bestPattern = patterns[0]
    return this.buildResponseFromPattern(bestPattern, context, query)
  }

  /**
   * Analyze query for intelligent patterns
   */
  private analyzeQueryPatterns(query: string, language: Language): ResponsePattern[] {
    const matches: ResponsePattern[] = []

    for (const [category, patterns] of this.responsePatterns) {
      for (const pattern of patterns) {
        if (pattern.language && pattern.language !== language) continue

        const score = this.calculatePatternScore(query, pattern)
        if (score > 0.3) {
          matches.push({ ...pattern, score })
        }
      }
    }

    return matches.sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  private calculatePatternScore(query: string, pattern: ResponsePattern): number {
    let score = 0
    const words = query.split(/\s+/)

    // Exact phrase matching (highest score)
    if (pattern.phrases) {
      for (const phrase of pattern.phrases) {
        if (query.includes(phrase.toLowerCase())) {
          score += 0.9
        }
      }
    }

    // Keyword matching
    if (pattern.keywords) {
      const keywordMatches = pattern.keywords.filter(keyword =>
        words.some(word => word.includes(keyword) || keyword.includes(word))
      ).length

      score += (keywordMatches / pattern.keywords.length) * 0.6
    }

    // Context boost
    if (pattern.contextBoost) {
      score += pattern.contextBoost
    }

    return Math.min(score, 1)
  }

  private buildResponseFromPattern(
    pattern: ResponsePattern,
    context: ConversationContext,
    originalQuery: string
  ): ChatbotResponse {
    const language = context.language

    // Smart response generation
    let content = pattern.responses[language as Language] || pattern.responses['de'] || pattern.responses['en']

    // Add context-specific elements
    content = this.personalizeResponse(content, context, originalQuery)

    // Generate smart suggestions
    const suggestions = this.generateContextualSuggestions(pattern, context)

    return {
      content,
      suggestions,
      confidence: pattern.score || 0.8,
      responseType: 'informational',
      followUp: pattern.followUp?.[language as Language]
    }
  }

  private personalizeResponse(
    content: string,
    context: ConversationContext,
    query: string
  ): string {
    // Add page-specific context
    if (context.currentPage === '/services' && !content.includes('Service')) {
      const addition = context.language === 'de'
        ? ' Da Sie bereits unsere Services betrachten, können Sie direkt auswählen!'
        : ' Since you\'re already viewing our services, you can choose directly!'
      content += addition
    }

    // Add time-based context
    const hour = new Date().getHours()
    if (hour >= 9 && hour <= 17 && query.includes('kontakt') || query.includes('contact')) {
      const addition = context.language === 'de'
        ? ' Wir sind gerade erreichbar für direkte Hilfe!'
        : ' We\'re available right now for direct help!'
      content += addition
    }

    return content
  }

  private generateContextualSuggestions(
    pattern: ResponsePattern,
    context: ConversationContext
  ): NavigationSuggestion[] {
    const suggestions: NavigationSuggestion[] = []
    const language = context.language

    // Pattern-specific suggestions
    if (pattern.suggestionConfigs) {
      suggestions.push(
        ...createEnhancedSuggestions(pattern.suggestionConfigs, language)
      )
    }

    // Add contextual suggestions based on current page
    if (context.currentPage !== '/' && !suggestions.some(s => s.href === '/')) {
      suggestions.push({
        label: language === 'de' ? 'Zur Startseite' : 'Go Home',
        href: '/',
        description: language === 'de' ? 'Zurück zur Hauptseite' : 'Return to main page',
        priority: 3
      })
    }

    return suggestions.slice(0, 5)
  }

  private initializePatterns() {
    const patterns: { [key: string]: ResponsePattern[] } = {
      // Service inquiries
      'service-general': [
        {
          keywords: ['service', 'dienst', 'angebot', 'leistung', 'reparatur', 'repair'],
          phrases: ['was bietet ihr', 'what do you offer', 'welche services', 'which services'],
          responses: {
            'de': 'Wir bieten umfassende IT-Services: von Computer-Reparaturen über Linux-Consulting bis hin zu Webentwicklung. Alle unsere Dienstleistungen folgen nachhaltigen Prinzipien.',
            'en': 'We offer comprehensive IT services: from computer repairs to Linux consulting and web development. All our services follow sustainable principles.'
          },
          suggestionConfigs: [
            { key: 'repair', href: '/services', options: { priority: 10 } },
            { key: 'linux', href: '/services/linux-open-source', options: { priority: 9 } },
            { key: 'web', href: '/services/web-design-development', options: { priority: 8 } },
            { key: 'consultation', href: '/contact', options: { priority: 7 } }
          ]
        }
      ],

      // Product inquiries
      'product-interest': [
        {
          keywords: ['kaufen', 'computer', 'laptop', 'buy', 'purchase', 'shop'],
          phrases: ['computer kaufen', 'laptop kaufen', 'buy computer', 'where to buy'],
          responses: {
            'de': 'In unserem Online-Shop finden Sie sorgfältig aufbereitete Computer mit REVAMPED-Zertifizierung. Alle Geräte sind getestet und haben eine Garantie.',
            'en': 'In our online shop you\'ll find carefully refurbished computers with REVAMPED certification. All devices are tested and come with a warranty.'
          },
          suggestionConfigs: [
            { key: 'shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', options: { external: true, priority: 10 } },
            { key: 'revamped', href: '/revamped', options: { priority: 9 } },
            { key: 'consultation', href: '/contact', options: { priority: 8 } }
          ]
        }
      ],

      // Sustainability focus
      'sustainability': [
        {
          keywords: ['nachhaltig', 'sustainable', 'umwelt', 'environment', 'green', 'öko'],
          phrases: ['nachhaltige it', 'sustainable technology', 'umweltfreundlich'],
          responses: {
            'de': 'Nachhaltigkeit steht im Zentrum unserer Mission. Wir reduzieren Elektroschrott durch Aufbereitung, fördern Open-Source und schaffen Arbeitsplätze in der Kreislaufwirtschaft.',
            'en': 'Sustainability is at the center of our mission. We reduce e-waste through refurbishment, promote open-source, and create jobs in the circular economy.'
          },
          suggestionConfigs: [
            { key: 'about', href: '/about', options: { priority: 10 } },
            { key: 'revamped', href: '/revamped', options: { priority: 9 } },
            { key: 'projects', href: '/projects', options: { priority: 8 } }
          ]
        }
      ],

      // Involvement
      'involvement': [
        {
          keywords: ['mitmachen', 'helfen', 'volunteer', 'help', 'contribute', 'spenden', 'donate'],
          phrases: ['wie kann ich helfen', 'how can i help', 'mitmachen bei', 'get involved'],
          responses: {
            'de': 'Es gibt viele Wege bei Revamp-IT mitzumachen: als Freiwilliger, mit einer Spende, als technischer Experte oder durch eine Partnerschaft. Jeder Beitrag zählt!',
            'en': 'There are many ways to get involved with Revamp-IT: as a volunteer, with a donation, as a technical expert, or through a partnership. Every contribution counts!'
          },
          suggestionConfigs: [
            { key: 'volunteer', href: '/get-involved/volunteer', options: { priority: 10 } },
            { key: 'donate', href: '/get-involved/donate', options: { priority: 9 } },
            { key: 'technical-expert', href: '/get-involved/technical-experts', options: { priority: 8 } },
            { key: 'partnerships', href: '/get-involved/partnerships', options: { priority: 7 } }
          ]
        }
      ],

      // Technical questions
      'technical': [
        {
          keywords: ['linux', 'open source', 'programmieren', 'programming', 'development'],
          phrases: ['linux support', 'open source', 'programming help'],
          responses: {
            'de': 'Wir sind Linux- und Open-Source-Experten! Ob Migration, Schulungen oder technischer Support - wir helfen bei allen Open-Source-Fragen.',
            'en': 'We are Linux and open-source experts! Whether migration, training, or technical support - we help with all open-source questions.'
          },
          suggestionConfigs: [
            { key: 'linux', href: '/services/linux-open-source', options: { priority: 10 } },
            { key: 'workshops', href: '/workshops', options: { priority: 9 } },
            { key: 'projects', href: '/projects', options: { priority: 8 } }
          ]
        }
      ],

      // Location and contact
      'location-contact': [
        {
          keywords: ['wo', 'where', 'adresse', 'address', 'standort', 'location', 'zürich', 'zurich'],
          phrases: ['wo seid ihr', 'where are you', 'eure adresse', 'your address'],
          responses: {
            'de': `Sie finden uns an der ${LOCATIONS.store.full}. Wir sind gut mit öffentlichen Verkehrsmitteln erreichbar und freuen uns auf Ihren Besuch!`,
            'en': `You can find us at ${LOCATIONS.store.full}. We are easily accessible by public transport and look forward to your visit!`,
          },
          suggestionConfigs: [
            { key: 'location', href: '/contact', options: { priority: 10 } },
            { key: 'contact', href: '/contact', options: { priority: 9 } },
            { key: 'consultation', href: '/contact', options: { priority: 8 } }
          ]
        }
      ]
    }

    // Populate the patterns map
    Object.entries(patterns).forEach(([category, patternList]) => {
      this.responsePatterns.set(category, patternList)
    })
  }
}

interface ResponsePattern {
  keywords?: string[]
  phrases?: string[]
  responses: Record<Language, string>
  suggestionConfigs?: Array<{
    key: string
    href: string
    options?: Partial<NavigationSuggestion>
  }>
  followUp?: Record<Language, string[]>
  language?: Language
  contextBoost?: number
  score?: number
}