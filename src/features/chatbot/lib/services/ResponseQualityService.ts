/**
 * ResponseQualityService - Ensures high-quality, contextual responses
 *
 * This service evaluates and enhances chatbot responses to ensure they are
 * helpful, contextually appropriate, and provide genuine value to users.
 * It acts as a quality gate and enhancement layer for all responses.
 */

import { ChatbotResponse, ConversationContext, NavigationSuggestion, Language } from '../types'

export class ResponseQualityService {
  private qualityThresholds = {
    minimumConfidence: 0.3,
    preferredConfidence: 0.7,
    maximumSuggestions: 5
  }

  /**
   * Enhance a response with quality improvements
   */
  enhanceResponse(
    response: ChatbotResponse,
    context: ConversationContext,
    originalQuery: string
  ): ChatbotResponse {
    const enhanced = { ...response }

    // Improve response content if confidence is low
    if (enhanced.confidence < this.qualityThresholds.preferredConfidence) {
      enhanced.content = this.improveResponseContent(enhanced.content, context, originalQuery)
    }

    // Enhance suggestions with context
    enhanced.suggestions = this.enhanceSuggestions(enhanced.suggestions, context, originalQuery)

    // Add follow-up questions if appropriate
    enhanced.followUp = this.generateFollowUpQuestions(enhanced, context, originalQuery)

    // Set appropriate response type
    enhanced.responseType = this.determineResponseType(enhanced, context)

    // Ensure minimum quality standards
    enhanced.confidence = Math.max(enhanced.confidence, this.qualityThresholds.minimumConfidence)

    return enhanced
  }

  /**
   * Evaluate if a response meets quality standards
   */
  evaluateResponseQuality(response: ChatbotResponse, context: ConversationContext): {
    score: number
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 0.5 // Base score

    // Check confidence level
    if (response.confidence >= this.qualityThresholds.preferredConfidence) {
      score += 0.2
    } else if (response.confidence < this.qualityThresholds.minimumConfidence) {
      issues.push('Low confidence response')
      suggestions.push('Consider providing more context or alternative suggestions')
    }

    // Check response length and informativeness
    if (response.content.length < 20) {
      issues.push('Response too brief')
      suggestions.push('Expand response with more helpful information')
    } else if (response.content.length > 200) {
      score += 0.1
    }

    // Check navigation suggestions quality
    if (response.suggestions.length === 0) {
      issues.push('No navigation suggestions provided')
      suggestions.push('Add relevant navigation options')
    } else if (response.suggestions.length > this.qualityThresholds.maximumSuggestions) {
      issues.push('Too many suggestions provided')
      suggestions.push('Limit to most relevant suggestions')
    } else {
      score += 0.2
    }

    // Check for contextual relevance
    if (this.isContextuallyRelevant(response, context)) {
      score += 0.1
    }

    return {
      score: Math.min(score, 1),
      issues,
      suggestions
    }
  }

  /**
   * Generate contextually appropriate follow-up questions
   */
  generateFollowUpQuestions(
    response: ChatbotResponse,
    context: ConversationContext,
    originalQuery: string
  ): string[] {
    const followUps: string[] = []
    const language = context.language

    // Based on response type and content, suggest follow-ups
    if (response.responseType === 'informational') {
      followUps.push(
        language === 'de' ?
          'Möchten Sie mehr Details dazu erfahren?' :
          'Would you like to learn more details about this?'
      )
    }

    if (response.responseType === 'navigational') {
      followUps.push(
        language === 'de' ?
          'Soll ich Sie zu einem bestimmten Bereich führen?' :
          'Should I guide you to a specific area?'
      )
    }

    // Add intent-based follow-ups
    if (originalQuery.toLowerCase().includes(language === 'de' ? 'kaufen' : 'buy')) {
      followUps.push(
        language === 'de' ?
          'Haben Sie spezielle Anforderungen an den Computer?' :
          'Do you have specific requirements for the computer?'
      )
    }

    if (originalQuery.toLowerCase().includes(language === 'de' ? 'reparatur' : 'repair')) {
      followUps.push(
        language === 'de' ?
          'Was für ein Problem haben Sie genau?' :
          'What specific problem are you experiencing?'
      )
    }

    return followUps.slice(0, 2) // Limit to 2 follow-ups
  }

  private improveResponseContent(
    content: string,
    context: ConversationContext,
    originalQuery: string
  ): string {
    // Add contextual improvements based on current page
    let improved = content

    // Add page-specific context if relevant
    if (context.currentPage === '/services' && !content.includes('service')) {
      improved = `${improved} ${context.language === 'de' ?
        'Da Sie bereits auf unserer Service-Seite sind, können Sie direkt die gewünschte Dienstleistung auswählen.' :
        'Since you\'re already on our services page, you can directly select the service you need.'
      }`
    }

    // Add encouragement if response seems uncertain
    if (content.includes('sorry') || content.includes('entschuldigung')) {
      improved = improved.replace(
        /sorry|entschuldigung/gi,
        context.language === 'de' ?
          'Lassen Sie mich Ihnen trotzdem helfen' :
          'Let me still help you'
      )
    }

    return improved
  }

  private enhanceSuggestions(
    suggestions: NavigationSuggestion[],
    context: ConversationContext,
    originalQuery: string
  ): NavigationSuggestion[] {
    const enhanced = [...suggestions]

    // Ensure we have diverse suggestion types
    const categories = new Set(enhanced.map(s => s.category))

    // Add missing essential categories if space allows
    if (enhanced.length < this.qualityThresholds.maximumSuggestions) {
      if (!categories.has('contact')) {
        enhanced.push({
          label: context.language === 'de' ? '📞 Kontakt aufnehmen' : '📞 Contact Us',
          href: '/contact',
          description: context.language === 'de' ?
            'Direkte Hilfe von unserem Team' :
            'Direct help from our team',
          category: 'contact',
          priority: 8
        })
      }

      if (!categories.has('info') && !context.currentPage.startsWith('/about')) {
        enhanced.push({
          label: context.language === 'de' ? '📖 Über uns erfahren' : '📖 Learn About Us',
          href: '/about',
          description: context.language === 'de' ?
            'Unsere Mission und Werte' :
            'Our mission and values',
          category: 'info',
          priority: 6
        })
      }
    }

    // Sort by priority and limit
    return enhanced
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, this.qualityThresholds.maximumSuggestions)
  }

  private isContextuallyRelevant(response: ChatbotResponse, context: ConversationContext): boolean {
    const currentPageKeywords = this.extractPageKeywords(context.currentPage)
    const responseText = response.content.toLowerCase()

    // Check if response mentions current page context
    return currentPageKeywords.some(keyword =>
      responseText.includes(keyword.toLowerCase())
    )
  }

  private extractPageKeywords(page: string): string[] {
    const pageKeywords: { [key: string]: string[] } = {
      '/services': ['service', 'repair', 'dienstleistung', 'reparatur'],
      '/about': ['about', 'mission', 'team', 'über', 'mission', 'team'],
      '/projects': ['project', 'initiative', 'projekt', 'initiative'],
      '/get-involved': ['volunteer', 'donate', 'freiwillig', 'spenden'],
      '/contact': ['contact', 'phone', 'email', 'kontakt', 'telefon'],
      '/workshops': ['workshop', 'course', 'learn', 'kurs', 'lernen']
    }

    // Find matching page pattern
    for (const [pattern, keywords] of Object.entries(pageKeywords)) {
      if (page.startsWith(pattern)) {
        return keywords
      }
    }

    return ['revampit', 'computer', 'sustainable', 'nachhaltig']
  }

  private determineResponseType(
    response: ChatbotResponse,
    context: ConversationContext
  ): ChatbotResponse['responseType'] {
    // Analyze response content to determine type
    const content = response.content.toLowerCase()

    if (content.includes('sorry') || content.includes('entschuldigung') || response.confidence < 0.4) {
      return 'error'
    }

    if (response.suggestions.length > 2) {
      return 'navigational'
    }

    if (response.confidence < 0.6) {
      return 'fallback'
    }

    return 'informational'
  }

  /**
   * Create a high-quality fallback response when no good match is found
   */
  createQualityFallbackResponse(
    context: ConversationContext,
    originalQuery: string
  ): ChatbotResponse {
    const language = context.language

    // Analyze query to provide better fallback
    const queryLower = originalQuery.toLowerCase()
    let content: string
    let suggestions: NavigationSuggestion[] = []

    // Provide contextual fallback based on query analysis
    if (queryLower.includes('help') || queryLower.includes('hilfe')) {
      content = language === 'de' ?
        'Ich helfe Ihnen gerne weiter! Hier sind einige Bereiche, in denen ich Sie unterstützen kann:' :
        'I\'d be happy to help you! Here are some areas where I can assist you:'
    } else if (queryLower.includes('where') || queryLower.includes('wo')) {
      content = language === 'de' ?
        'Ich kann Ihnen bei der Navigation auf unserer Website helfen. Was suchen Sie genau?' :
        'I can help you navigate our website. What exactly are you looking for?'
    } else {
      content = language === 'de' ?
        'Entschuldigung, ich verstehe deine Anfrage nicht ganz. Aber ich kann Ihnen in diesen Bereichen helfen:' :
        'Sorry, I don\'t quite understand your request. But I can help you in these areas:'
    }

    // Add comprehensive suggestions
    suggestions = [
      {
        label: language === 'de' ? '🛒 Computer kaufen' : '🛒 Buy Computer',
        href: '/marketplace',
        description: language === 'de' ? 'Refurbished Computer shop' : 'Refurbished computer shop',
        category: 'product',
        priority: 10
      },
      {
        label: language === 'de' ? '🔧 Reparatur-Service' : '🔧 Repair Service',
        href: '/services',
        description: language === 'de' ? 'Computer reparieren lassen' : 'Get your computer repaired',
        category: 'service',
        priority: 9
      },
      {
        label: language === 'de' ? '📚 Workshops' : '📚 Workshops',
        href: '/workshops',
        description: language === 'de' ? 'Technische Bildung' : 'Technical education',
        category: 'info',
        priority: 8
      },
      {
        label: language === 'de' ? '🤝 Mitmachen' : '🤝 Get Involved',
        href: '/get-involved',
        description: language === 'de' ? 'Freiwillig engagieren' : 'Volunteer with us',
        category: 'involvement',
        priority: 7
      },
      {
        label: language === 'de' ? '📞 Kontakt' : '📞 Contact',
        href: '/contact',
        description: language === 'de' ? 'Direkte Hilfe' : 'Direct assistance',
        category: 'contact',
        priority: 6
      }
    ]

    const followUp = [
      language === 'de' ?
        'Können Sie Ihre Frage genauer formulieren?' :
        'Could you be more specific about what you\'re looking for?',
      language === 'de' ?
        'Welcher Bereich interessiert Sie am meisten?' :
        'Which area interests you the most?'
    ]

    return {
      content,
      suggestions,
      confidence: 0.6, // Decent confidence for a quality fallback
      followUp,
      responseType: 'fallback'
    }
  }
}
