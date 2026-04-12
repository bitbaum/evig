/**
 * SemanticMatchingService - Intelligent semantic understanding of user queries
 *
 * This service provides advanced semantic matching capabilities that go beyond
 * simple keyword matching. It understands context, intent, and meaning to provide
 * more accurate and helpful responses to user queries.
 */

import { Language, UserIntent, SemanticPattern, ChatbotResponse, NavigationSuggestion } from '../types'

export class SemanticMatchingService {
  private patterns: Map<string, SemanticPattern[]>
  private responseTemplates: Map<string, ResponseTemplate[]>

  constructor() {
    this.patterns = new Map()
    this.responseTemplates = new Map()
    this.initializePatterns()
    this.initializeResponseTemplates()
  }

  /**
   * Extract user intent from a message using semantic analysis
   */
  extractUserIntent(message: string, language: Language): UserIntent {
    const messageLower = message.toLowerCase()
    const words = messageLower.split(/\s+/)
    const intents = this.analyzeIntentPatterns(messageLower, words, language)

    // Find the highest confidence intent
    const primaryIntent = intents.length > 0
      ? intents.reduce((best, current) => current.confidence > best.confidence ? current : best)
      : { category: 'unknown' as const, confidence: 0 }

    // Extract entities (specific items mentioned)
    const entities = this.extractEntities(message, primaryIntent.category)

    return {
      category: primaryIntent.category,
      confidence: primaryIntent.confidence,
      entities,
      secondaryIntents: intents
        .filter(intent => intent !== primaryIntent && intent.confidence > 0.3)
        .map(intent => intent.category)
    }
  }

  /**
   * Find the best semantic match for a user query
   */
  findSemanticMatch(message: string, language: Language): ChatbotResponse | null {
    const intent = this.extractUserIntent(message, language)

    if (intent.confidence < 0.4) {
      return null // Not confident enough
    }

    // Look for response templates matching this intent
    const templates = this.responseTemplates.get(intent.category) || []
    const template = templates.find(t =>
      !t.conditions?.language || t.conditions.language === language
    )

    if (!template) {
      return null
    }

    // Generate response using template
    const response = this.generateResponseFromTemplate(template, intent, language)
    return response
  }

  /**
   * Analyze semantic similarity between query and content
   */
  calculateSemanticSimilarity(query: string, content: string, language: Language): number {
    const queryWords = this.normalizeAndTokenize(query)
    const contentWords = this.normalizeAndTokenize(content)

    // Simple semantic similarity based on word overlap and synonyms
    let matches = 0
    let totalRelevantWords = queryWords.length

    queryWords.forEach(word => {
      if (contentWords.includes(word)) {
        matches += 1
      } else {
        // Check for synonyms and related terms
        const synonyms = this.getSynonyms(word, language)
        if (synonyms.some(synonym => contentWords.includes(synonym))) {
          matches += 0.7 // Synonym match is worth less than exact match
        }
      }
    })

    return totalRelevantWords > 0 ? matches / totalRelevantWords : 0
  }

  private initializePatterns() {
    // Define semantic patterns for different intents
    const patterns: SemanticPattern[] = [
      // Buying/Shopping patterns
      {
        keywords: ['buy', 'purchase', 'shop', 'get', 'need', 'want'],
        phrases: ['i want to buy', 'looking for', 'need a computer', 'where can i get'],
        intent: 'buy',
        weight: 1.0,
        language: 'en'
      },
      {
        keywords: ['kaufen', 'bestellen', 'brauche', 'möchte', 'suche'],
        phrases: ['ich möchte kaufen', 'wo kann ich', 'brauche einen computer', 'suche nach'],
        intent: 'buy',
        weight: 1.0,
        language: 'de'
      },

      // Repair patterns
      {
        keywords: ['repair', 'fix', 'broken', 'problem', 'issue', 'not working'],
        phrases: ['not working', 'is broken', 'need to fix', 'having problems'],
        intent: 'repair',
        weight: 1.0,
        language: 'en'
      },
      {
        keywords: ['reparieren', 'reparatur', 'kaputt', 'defekt', 'problem', 'funktioniert nicht'],
        phrases: ['ist kaputt', 'funktioniert nicht', 'muss repariert werden'],
        intent: 'repair',
        weight: 1.0,
        language: 'de'
      },

      // Learning patterns
      {
        keywords: ['learn', 'workshop', 'course', 'training', 'education', 'how to'],
        phrases: ['want to learn', 'how do i', 'teach me', 'need training'],
        intent: 'learn',
        weight: 1.0,
        language: 'en'
      },
      {
        keywords: ['lernen', 'kurs', 'workshop', 'schulung', 'wie', 'ausbildung'],
        phrases: ['möchte lernen', 'wie kann ich', 'bringen sie mir bei'],
        intent: 'learn',
        weight: 1.0,
        language: 'de'
      },

      // Volunteering patterns
      {
        keywords: ['volunteer', 'help', 'contribute', 'join', 'participate', 'get involved'],
        phrases: ['want to help', 'how can i contribute', 'get involved', 'volunteer'],
        intent: 'volunteer',
        weight: 1.0,
        language: 'en'
      },
      {
        keywords: ['freiwillig', 'helfen', 'mitmachen', 'engagieren', 'unterstützen'],
        phrases: ['möchte helfen', 'wie kann ich mitmachen', 'freiwillig arbeiten'],
        intent: 'volunteer',
        weight: 1.0,
        language: 'de'
      },

      // Donation patterns
      {
        keywords: ['donate', 'donation', 'support', 'contribute', 'fund', 'sponsor'],
        phrases: ['want to donate', 'how to support', 'make a donation'],
        intent: 'donate',
        weight: 1.0,
        language: 'en'
      },
      {
        keywords: ['spenden', 'spende', 'unterstützen', 'finanzieren'],
        phrases: ['möchte spenden', 'wie kann ich unterstützen', 'eine spende machen'],
        intent: 'donate',
        weight: 1.0,
        language: 'de'
      },

      // Contact patterns
      {
        keywords: ['contact', 'call', 'phone', 'email', 'reach', 'talk', 'speak'],
        phrases: ['how to contact', 'phone number', 'email address', 'get in touch'],
        intent: 'contact',
        weight: 1.0,
        language: 'en'
      },
      {
        keywords: ['kontakt', 'anrufen', 'telefon', 'email', 'sprechen', 'erreichen'],
        phrases: ['wie kontaktieren', 'telefonnummer', 'e-mail adresse', 'in kontakt'],
        intent: 'contact',
        weight: 1.0,
        language: 'de'
      },

      // Navigation patterns
      {
        keywords: ['where', 'find', 'locate', 'show', 'page', 'section'],
        phrases: ['where can i find', 'where is', 'show me', 'take me to'],
        intent: 'navigate',
        weight: 1.0,
        language: 'en'
      },
      {
        keywords: ['wo', 'finden', 'zeigen', 'seite', 'bereich'],
        phrases: ['wo finde ich', 'wo ist', 'zeig mir', 'bring mich zu'],
        intent: 'navigate',
        weight: 1.0,
        language: 'de'
      }
    ]

    // Group patterns by intent
    patterns.forEach(pattern => {
      if (!this.patterns.has(pattern.intent)) {
        this.patterns.set(pattern.intent, [])
      }
      this.patterns.get(pattern.intent)!.push(pattern)
    })
  }

  private initializeResponseTemplates() {
    interface ResponseTemplate {
      template: string
      confidence: number
      conditions?: {
        intent?: string
        language?: Language
      }
    }

    const templates: { [key: string]: ResponseTemplate[] } = {
      buy: [
        {
          template: 'Perfect! You can buy high-quality refurbished computers in our online shop. All devices are thoroughly tested and come with a guarantee.',
          confidence: 0.9,
          conditions: { language: 'en' }
        },
        {
          template: 'Perfekt! Sie können hochwertige refurbished Computer in unserem Online-Shop kaufen. Alle Geräte sind sorgfältig getestet und haben eine Garantie.',
          confidence: 0.9,
          conditions: { language: 'de' }
        }
      ],
      repair: [
        {
          template: 'We offer professional computer repair services! Our experienced technicians can diagnose and fix most hardware issues.',
          confidence: 0.9,
          conditions: { language: 'en' }
        },
        {
          template: 'Wir bieten professionelle Computer-Reparatur-Services! Unsere erfahrenen Techniker können die meisten Hardware-Probleme diagnostizieren und beheben.',
          confidence: 0.9,
          conditions: { language: 'de' }
        }
      ],
      learn: [
        {
          template: 'We regularly offer workshops on Linux, open-source software, and hardware repairs. These courses are suitable for all experience levels.',
          confidence: 0.9,
          conditions: { language: 'en' }
        },
        {
          template: 'Wir bieten regelmässig Workshops zu Linux, Open-Source-Software und Hardware-Reparaturen an. Diese Kurse sind für alle Erfahrungsstufen geeignet.',
          confidence: 0.9,
          conditions: { language: 'de' }
        }
      ],
      volunteer: [
        {
          template: 'Thank you for your interest in volunteering! We welcome people with various skills - from technical expertise to administrative support.',
          confidence: 0.9,
          conditions: { language: 'en' }
        },
        {
          template: 'Vielen Dank für Ihr Interesse als Freiwilliger! Wir heissen Menschen mit verschiedenen Fähigkeiten willkommen - von technischer Expertise bis hin zu administrativer Unterstützung.',
          confidence: 0.9,
          conditions: { language: 'de' }
        }
      ],
      donate: [
        {
          template: 'Thank you for considering a donation! Your support helps us make technology accessible to everyone and reduce electronic waste.',
          confidence: 0.9,
          conditions: { language: 'en' }
        },
        {
          template: 'Vielen Dank, dass Sie eine Spende in Erwägung ziehen! Deine Unterstützung hilft uns, Technologie für alle zugänglich zu machen und Elektroschrott zu reduzieren.',
          confidence: 0.9,
          conditions: { language: 'de' }
        }
      ],
      contact: [
        {
          template: 'You can reach us at our location in Zurich or contact us directly via phone or email. We\'d be happy to help!',
          confidence: 0.9,
          conditions: { language: 'en' }
        },
        {
          template: 'Sie können uns in unserem Standort in Zürich erreichen oder uns direkt per Telefon oder E-Mail kontaktieren. Wir helfen gerne!',
          confidence: 0.9,
          conditions: { language: 'de' }
        }
      ],
      navigate: [
        {
          template: 'I can help you find what you\'re looking for! Here are some suggestions based on your request:',
          confidence: 0.8,
          conditions: { language: 'en' }
        },
        {
          template: 'Ich kann Ihnen helfen zu finden, was Sie suchen! Hier sind einige Vorschläge basierend auf Ihrer Anfrage:',
          confidence: 0.8,
          conditions: { language: 'de' }
        }
      ]
    }

    Object.entries(templates).forEach(([intent, templateList]) => {
      this.responseTemplates.set(intent, templateList)
    })
  }

  private analyzeIntentPatterns(message: string, words: string[], language: Language): Array<{category: UserIntent['category'], confidence: number}> {
    const results: Array<{category: UserIntent['category'], confidence: number}> = []

    for (const [intent, patterns] of this.patterns) {
      let bestScore = 0

      patterns.forEach(pattern => {
        // Skip if language doesn't match
        if (pattern.language && pattern.language !== language) return

        let score = 0

        // Check keyword matches
        const keywordMatches = pattern.keywords.filter(keyword =>
          words.some(word => word.includes(keyword) || keyword.includes(word))
        ).length

        score += (keywordMatches / pattern.keywords.length) * 0.7

        // Check phrase matches
        const phraseMatches = pattern.phrases.filter(phrase =>
          message.includes(phrase)
        ).length

        score += (phraseMatches / pattern.phrases.length) * 0.3

        // Apply pattern weight
        score *= pattern.weight

        if (score > bestScore) {
          bestScore = score
        }
      })

      if (bestScore > 0) {
        results.push({
          category: intent as UserIntent['category'],
          confidence: Math.min(bestScore, 1)
        })
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence)
  }

  private extractEntities(message: string, intent: UserIntent['category']): string[] {
    const entities: string[] = []
    const messageLower = message.toLowerCase()

    // Extract entities based on intent
    switch (intent) {
      case 'buy':
        // Extract product types
        const products = ['computer', 'laptop', 'desktop', 'pc', 'server', 'hardware']
        products.forEach(product => {
          if (messageLower.includes(product)) {
            entities.push(product)
          }
        })
        break

      case 'repair':
        // Extract device types and problems
        const devices = ['computer', 'laptop', 'pc', 'screen', 'keyboard', 'mouse']
        const problems = ['broken', 'slow', 'virus', 'crash', 'blue screen', 'not starting']

        devices.concat(problems).forEach(term => {
          if (messageLower.includes(term)) {
            entities.push(term)
          }
        })
        break

      case 'learn':
        // Extract topics
        const topics = ['linux', 'programming', 'repair', 'networking', 'security']
        topics.forEach(topic => {
          if (messageLower.includes(topic)) {
            entities.push(topic)
          }
        })
        break
    }

    return entities
  }

  private generateResponseFromTemplate(
    template: ResponseTemplate,
    intent: UserIntent,
    language: Language
  ): ChatbotResponse {
    return {
      content: template.template,
      suggestions: [], // Will be populated by NavigationService
      confidence: template.confidence,
      responseType: 'informational'
    }
  }

  private normalizeAndTokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
  }

  private getSynonyms(word: string, language: Language): string[] {
    // Simple synonym mapping - in a real implementation, you might use a more sophisticated approach
    const synonymMaps: Record<Language, Record<string, string[]>> = {
      en: {
        'buy': ['purchase', 'get', 'acquire', 'obtain'],
        'repair': ['fix', 'mend', 'restore', 'service'],
        'computer': ['pc', 'laptop', 'desktop', 'machine'],
        'help': ['assist', 'support', 'aid'],
        'learn': ['study', 'understand', 'master']
      },
      de: {
        'kaufen': ['bestellen', 'erwerben', 'anschaffen'],
        'reparieren': ['reparatur', 'instandsetzen', 'beheben'],
        'computer': ['pc', 'laptop', 'rechner'],
        'helfen': ['unterstützen', 'assistieren'],
        'lernen': ['studieren', 'verstehen', 'beherrschen']
      }
    }

    return synonymMaps[language][word] || []
  }
}

// Re-export the interface for consistency
interface ResponseTemplate {
  template: string
  confidence: number
  conditions?: {
    intent?: string
    language?: Language
  }
}