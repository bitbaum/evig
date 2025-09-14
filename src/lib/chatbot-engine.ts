import { smartSuggestionEngine, extractUserIntent } from './smart-suggestions'

export interface ChatbotResponse {
  content: string
  suggestions: NavigationSuggestion[]
  confidence: number
  followUp?: string[]
}

export interface NavigationSuggestion {
  label: string
  href: string
  description: string
  external?: boolean
  icon?: string
  priority?: number
}

export interface ConversationContext {
  currentPage: string
  userHistory: string[]
  language: 'en' | 'de'
  sessionData?: Record<string, any>
}

export class ChatbotEngine {
  private faqDatabase: Map<string, ChatbotResponse>
  private keywordMatcher: KeywordMatcher
  private contextAnalyzer: ContextAnalyzer

  constructor() {
    this.faqDatabase = new Map()
    this.keywordMatcher = new KeywordMatcher()
    this.contextAnalyzer = new ContextAnalyzer()
    this.initializeFAQ()
  }

  async processMessage(
    message: string,
    context: ConversationContext
  ): Promise<ChatbotResponse> {
    // Clean and normalize input
    const normalizedMessage = this.normalizeInput(message)
    
    // Extract user intent for smart suggestions
    const userIntent = extractUserIntent(message)
    
    // Try exact FAQ match first
    const faqResponse = this.findFAQMatch(normalizedMessage, context.language)
    if (faqResponse && faqResponse.confidence > 0.8) {
      // Enhance FAQ response with smart suggestions
      faqResponse.suggestions = this.enhanceWithSmartSuggestions(
        faqResponse.suggestions,
        context,
        userIntent
      )
      return faqResponse
    }

    // Try keyword-based matching
    const keywordResponse = await this.keywordMatcher.findMatch(
      normalizedMessage,
      context
    )
    if (keywordResponse && keywordResponse.confidence > 0.6) {
      // Enhance keyword response with smart suggestions
      keywordResponse.suggestions = this.enhanceWithSmartSuggestions(
        keywordResponse.suggestions,
        context,
        userIntent
      )
      return keywordResponse
    }

    // Context-based response
    const contextResponse = this.contextAnalyzer.generateContextualResponse(
      normalizedMessage,
      context
    )
    if (contextResponse) {
      // Enhance context response with smart suggestions
      contextResponse.suggestions = this.enhanceWithSmartSuggestions(
        contextResponse.suggestions,
        context,
        userIntent
      )
      return contextResponse
    }

    // Fallback response with smart suggestions
    return this.generateFallbackResponse(context, userIntent)
  }

  private normalizeInput(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
  }

  private findFAQMatch(message: string, language: 'en' | 'de'): ChatbotResponse | null {
    const key = `${language}:${message}`
    return this.faqDatabase.get(key) || null
  }

  private enhanceWithSmartSuggestions(
    baseSuggestions: NavigationSuggestion[],
    context: ConversationContext,
    userIntent?: string
  ): NavigationSuggestion[] {
    const smartContext = {
      currentPage: context.currentPage,
      userIntent,
      previousInteractions: context.userHistory,
      timeOfDay: new Date().getHours(),
      language: context.language
    }

    const smartSuggestions = smartSuggestionEngine.generateSmartSuggestions(smartContext)
    
    // Merge base suggestions with smart suggestions, prioritizing smart ones
    const merged = [...smartSuggestions, ...baseSuggestions]
    
    // Remove duplicates and return top 5
    const unique = merged.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.href === suggestion.href)
    )
    
    return unique.slice(0, 5)
  }

  private generateFallbackResponse(context: ConversationContext, userIntent?: string): ChatbotResponse {
    const responses = context.language === 'de' ? {
      content: "Entschuldigung, ich verstehe Ihre Frage nicht ganz. Hier sind einige Bereiche, bei denen ich Ihnen helfen kann:",
      suggestions: this.enhanceWithSmartSuggestions([], context, userIntent)
    } : {
      content: "I'm sorry, I don't quite understand your question. Here are some areas I can help you with:",
      suggestions: this.enhanceWithSmartSuggestions([], context, userIntent)
    }

    return {
      ...responses,
      confidence: 0.5,
      followUp: context.language === 'de' 
        ? ['Können Sie Ihre Frage anders formulieren?', 'Suchen Sie nach etwas Bestimmtem?']
        : ['Could you rephrase your question?', 'Are you looking for something specific?']
    }
  }

  private getDefaultSuggestions(language: 'en' | 'de', currentPage: string): NavigationSuggestion[] {
    if (language === 'de') {
      return [
        { label: '🛒 Refurbished Computer kaufen', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Hochwertige aufbereitete Elektronik', external: true },
        { label: '🔧 Computer reparieren lassen', href: '/services', description: 'Professionelle Reparaturen und Upgrades' },
        { label: '💝 Mission unterstützen', href: '/get-involved/donate', description: 'Spenden für nachhaltige IT' },
        { label: '📞 Kontakt aufnehmen', href: '/contact', description: 'Direkt mit uns sprechen' }
      ]
    } else {
      return [
        { label: '🛒 Buy Refurbished Computers', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'High-quality refurbished electronics', external: true },
        { label: '🔧 Get Computer Repair', href: '/services', description: 'Professional repairs and upgrades' },
        { label: '💝 Support Our Mission', href: '/get-involved/donate', description: 'Donate for sustainable IT' },
        { label: '📞 Contact Us', href: '/contact', description: 'Speak directly with us' }
      ]
    }
  }

  private initializeFAQ() {
    // German FAQ responses
    this.addFAQResponse('de', 
      ['was macht revamp it', 'was ist revamp it', 'über revamp it'],
      {
        content: "RevampIT ist eine Schweizer Non-Profit-Organisation, die sich für nachhaltige Technologie einsetzt. Wir bereiten Computer und Elektronikgeräte wieder auf, bieten technische Bildung durch Workshops und fördern Open-Source-Lösungen zur Reduzierung von Elektroschrott.",
        suggestions: [
          { label: '📖 Mehr über uns', href: '/about', description: 'Unsere Mission und Werte' },
          { label: '🏢 Dienstleistungen ansehen', href: '/services', description: 'Was wir anbieten' },
          { label: '🤝 Mitmachen', href: '/get-involved', description: 'Engagiere dich' }
        ],
        confidence: 0.95
      }
    )

    this.addFAQResponse('de',
      ['computer kaufen', 'laptop kaufen', 'refurbished computer', 'wo kaufen'],
      {
        content: "Sie können refurbished Computer in unserem Online-Shop kaufen. Alle Geräte sind sorgfältig getestet und kommen mit einer Garantie. Wir bieten Desktop-PCs, Laptops und Zubehör zu fairen Preisen.",
        suggestions: [
          { label: '🛒 Zum Shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Refurbished Elektronik kaufen', external: true },
          { label: '🏷️ REVAMPED-Zertifizierung', href: '/revamped', description: 'Unsere Qualitätsgarantie' },
          { label: '🔧 Reparatur-Service', href: '/services', description: 'Alternative: Computer reparieren lassen' }
        ],
        confidence: 0.9
      }
    )

    this.addFAQResponse('de',
      ['computer reparatur', 'reparieren lassen', 'defekter computer', 'hardware problem'],
      {
        content: "Wir bieten professionelle Computer-Reparaturen und Hardware-Upgrades. Unsere Techniker können die meisten Probleme diagnostizieren und beheben. Wir reparieren sowohl Desktop-PCs als auch Laptops.",
        suggestions: [
          { label: '🔧 Reparatur-Services', href: '/services', description: 'Alle unsere Reparatur-Dienstleistungen' },
          { label: '📞 Beratung anfragen', href: '/contact', description: 'Kostenlose Erstberatung' },
          { label: '🚀 Hardware-Upgrade', href: '/services', description: 'Computer aufrüsten lassen' }
        ],
        confidence: 0.9
      }
    )

    this.addFAQResponse('de',
      ['spenden', 'geld spenden', 'unterstützen', 'helfen'],
      {
        content: "Vielen Dank für Ihr Interesse! Sie können uns auf verschiedene Weise unterstützen: durch Geldspenden, Gerätespenden oder als Freiwilliger. Jede Unterstützung hilft uns dabei, Technik für alle zugänglich zu machen.",
        suggestions: [
          { label: '💝 Geld spenden', href: '/get-involved/donate', description: 'Finanzielle Unterstützung' },
          { label: '🤝 Freiwillig mithelfen', href: '/get-involved/volunteer', description: 'Zeit und Fähigkeiten spenden' },
          { label: '💻 Geräte spenden', href: '/get-involved', description: 'Alte Computer spenden' }
        ],
        confidence: 0.9
      }
    )

    this.addFAQResponse('de',
      ['workshop', 'kurs', 'lernen', 'schulung'],
      {
        content: "Wir bieten regelmäßig Workshops zu Linux, Open-Source-Software und Hardware-Reparaturen an. Diese Kurse sind für alle Erfahrungsstufen geeignet und helfen dabei, technische Fähigkeiten zu entwickeln.",
        suggestions: [
          { label: '📚 Workshop-Programm', href: '/workshops', description: 'Aktuelle Kursangebote' },
          { label: '📧 Newsletter abonnieren', href: '/contact', description: 'Über neue Kurse informiert bleiben' },
          { label: '🐧 Linux lernen', href: '/services/linux-open-source', description: 'Linux-Unterstützung' }
        ],
        confidence: 0.9
      }
    )

    // English FAQ responses
    this.addFAQResponse('en', 
      ['what does revamp it do', 'what is revamp it', 'about revamp it'],
      {
        content: "RevampIT is a Swiss non-profit organization dedicated to sustainable technology. We refurbish computers and electronic devices, provide technical education through workshops, and promote open-source solutions to reduce electronic waste.",
        suggestions: [
          { label: '📖 Learn more about us', href: '/about', description: 'Our mission and values' },
          { label: '🏢 View our services', href: '/services', description: 'What we offer' },
          { label: '🤝 Get involved', href: '/get-involved', description: 'Join our cause' }
        ],
        confidence: 0.95
      }
    )

    this.addFAQResponse('en',
      ['buy computer', 'buy laptop', 'refurbished computer', 'where to buy'],
      {
        content: "You can buy refurbished computers in our online shop. All devices are carefully tested and come with a warranty. We offer desktop PCs, laptops, and accessories at fair prices.",
        suggestions: [
          { label: '🛒 Visit Shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Buy refurbished electronics', external: true },
          { label: '🏷️ REVAMPED Certification', href: '/revamped', description: 'Our quality guarantee' },
          { label: '🔧 Repair Service', href: '/services', description: 'Alternative: Get your computer repaired' }
        ],
        confidence: 0.9
      }
    )

    this.addFAQResponse('en',
      ['computer repair', 'fix computer', 'broken computer', 'hardware problem'],
      {
        content: "We offer professional computer repairs and hardware upgrades. Our technicians can diagnose and fix most problems. We repair both desktop PCs and laptops.",
        suggestions: [
          { label: '🔧 Repair Services', href: '/services', description: 'All our repair services' },
          { label: '📞 Request consultation', href: '/contact', description: 'Free initial consultation' },
          { label: '🚀 Hardware Upgrade', href: '/services', description: 'Upgrade your computer' }
        ],
        confidence: 0.9
      }
    )

    this.addFAQResponse('en',
      ['donate', 'donation', 'support', 'help'],
      {
        content: "Thank you for your interest! You can support us in various ways: through monetary donations, device donations, or as a volunteer. Every contribution helps us make technology accessible to everyone.",
        suggestions: [
          { label: '💝 Make a donation', href: '/get-involved/donate', description: 'Financial support' },
          { label: '🤝 Volunteer', href: '/get-involved/volunteer', description: 'Donate your time and skills' },
          { label: '💻 Donate devices', href: '/get-involved', description: 'Donate old computers' }
        ],
        confidence: 0.9
      }
    )

    this.addFAQResponse('en',
      ['workshop', 'course', 'learn', 'training'],
      {
        content: "We regularly offer workshops on Linux, open-source software, and hardware repairs. These courses are suitable for all experience levels and help develop technical skills.",
        suggestions: [
          { label: '📚 Workshop Program', href: '/workshops', description: 'Current course offerings' },
          { label: '📧 Subscribe to newsletter', href: '/contact', description: 'Stay informed about new courses' },
          { label: '🐧 Learn Linux', href: '/services/linux-open-source', description: 'Linux support' }
        ],
        confidence: 0.9
      }
    )
  }

  private addFAQResponse(language: 'en' | 'de', patterns: string[], response: ChatbotResponse) {
    patterns.forEach(pattern => {
      this.faqDatabase.set(`${language}:${pattern}`, response)
    })
  }
}

class KeywordMatcher {
  private keywordMap: Map<string, ChatbotResponse>

  constructor() {
    this.keywordMap = new Map()
    this.initializeKeywords()
  }

  async findMatch(message: string, context: ConversationContext): Promise<ChatbotResponse | null> {
    const words = message.split(' ')
    let bestMatch: ChatbotResponse | null = null
    let bestScore = 0

    for (const [keywords, response] of Array.from(this.keywordMap.entries())) {
      const keywordList = keywords.split(',')
      const score = this.calculateMatchScore(words, keywordList)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = { ...response, confidence: score }
      }
    }

    return bestScore > 0.4 ? bestMatch : null
  }

  private calculateMatchScore(messageWords: string[], keywords: string[]): number {
    let matches = 0
    const totalWords = messageWords.length

    for (const word of messageWords) {
      for (const keyword of keywords) {
        if (word.includes(keyword.trim()) || keyword.trim().includes(word)) {
          matches++
          break
        }
      }
    }

    return totalWords > 0 ? matches / totalWords : 0
  }

  private initializeKeywords() {
    // Service-related keywords
    this.keywordMap.set('repair,fix,broken,problem,issue', {
      content: "I can help you with computer repairs! We offer professional hardware diagnostics and repairs for desktops and laptops.",
      suggestions: [
        { label: '🔧 Repair Services', href: '/services', description: 'Professional computer repairs' },
        { label: '📞 Get Quote', href: '/contact', description: 'Request repair quote' }
      ],
      confidence: 0.7
    })

    this.keywordMap.set('linux,open,source,ubuntu,debian', {
      content: "Great! We specialize in Linux and open-source solutions. Our team can help with Linux installations, migrations, and support.",
      suggestions: [
        { label: '🐧 Linux Services', href: '/services/linux-open-source', description: 'Linux consulting and support' },
        { label: '📚 Linux Workshops', href: '/workshops', description: 'Learn Linux skills' }
      ],
      confidence: 0.8
    })

    this.keywordMap.set('web,website,development,design', {
      content: "We offer professional web development services using modern technologies and sustainable practices.",
      suggestions: [
        { label: '🌐 Web Development', href: '/services/web-design-development', description: 'Professional web solutions' },
        { label: '💼 View Projects', href: '/projects', description: 'See our work' }
      ],
      confidence: 0.8
    })
  }
}

class ContextAnalyzer {
  generateContextualResponse(message: string, context: ConversationContext): ChatbotResponse | null {
    const page = context.currentPage

    // Page-specific responses
    if (page === '/services') {
      return {
        content: context.language === 'de' 
          ? "Sie sind auf unserer Services-Seite! Welcher Bereich interessiert Sie am meisten?"
          : "You're on our Services page! Which area interests you most?",
        suggestions: this.getServiceSuggestions(context.language),
        confidence: 0.6
      }
    }

    if (page === '/about') {
      return {
        content: context.language === 'de'
          ? "Möchten Sie mehr über unser Team, unsere Mission oder unsere Erfolgsgeschichten erfahren?"
          : "Would you like to learn more about our team, mission, or success stories?",
        suggestions: this.getAboutSuggestions(context.language),
        confidence: 0.6
      }
    }

    if (page.includes('/projects')) {
      return {
        content: context.language === 'de'
          ? "Unsere Projekte zeigen, wie wir nachhaltige Technologie in die Praxis umsetzen. Interessiert Sie ein bestimmtes Projekt?"
          : "Our projects show how we put sustainable technology into practice. Are you interested in a specific project?",
        suggestions: this.getProjectSuggestions(context.language),
        confidence: 0.6
      }
    }

    return null
  }

  private getServiceSuggestions(language: 'en' | 'de'): NavigationSuggestion[] {
    if (language === 'de') {
      return [
        { label: '🔧 Computer Reparatur', href: '/services', description: 'Hardware-Reparaturen und Upgrades' },
        { label: '🐧 Linux Support', href: '/services/linux-open-source', description: 'Open Source Lösungen' },
        { label: '🌐 Webentwicklung', href: '/services/web-design-development', description: 'Professionelle Websites' },
        { label: '☁️ Cloud-Infrastruktur', href: '/services/cloud-infrastructure', description: 'Cloud-Lösungen' }
      ]
    } else {
      return [
        { label: '🔧 Computer Repair', href: '/services', description: 'Hardware repairs and upgrades' },
        { label: '🐧 Linux Support', href: '/services/linux-open-source', description: 'Open source solutions' },
        { label: '🌐 Web Development', href: '/services/web-design-development', description: 'Professional websites' },
        { label: '☁️ Cloud Infrastructure', href: '/services/cloud-infrastructure', description: 'Cloud solutions' }
      ]
    }
  }

  private getAboutSuggestions(language: 'en' | 'de'): NavigationSuggestion[] {
    if (language === 'de') {
      return [
        { label: '🎯 Unsere Mission', href: '/about', description: 'Was uns antreibt' },
        { label: '👥 Team kennenlernen', href: '/about', description: 'Die Menschen hinter RevampIT' },
        { label: '📊 Unsere Erfolge', href: '/about', description: 'Was wir erreicht haben' },
        { label: '🤝 Partner werden', href: '/get-involved/partnerships', description: 'Mit uns zusammenarbeiten' }
      ]
    } else {
      return [
        { label: '🎯 Our Mission', href: '/about', description: 'What drives us' },
        { label: '👥 Meet the Team', href: '/about', description: 'The people behind RevampIT' },
        { label: '📊 Our Impact', href: '/about', description: 'What we have achieved' },
        { label: '🤝 Become a Partner', href: '/get-involved/partnerships', description: 'Work with us' }
      ]
    }
  }

  private getProjectSuggestions(language: 'en' | 'de'): NavigationSuggestion[] {
    if (language === 'de') {
      return [
        { label: '💻 Hardware-Projekte', href: '/projects/hardware', description: 'Unsere Hardware-Initiativen' },
        { label: '🖥️ Freie Computer', href: '/projects/freiecomputer', description: 'Open-Source Hardware' },
        { label: '🌐 LTSP-Projekt', href: '/projects/ltsp', description: 'Linux Terminal Server' },
        { label: '📊 kivitendo', href: '/projects/kivitendo', description: 'Open-Source ERP' }
      ]
    } else {
      return [
        { label: '💻 Hardware Projects', href: '/projects/hardware', description: 'Our hardware initiatives' },
        { label: '🖥️ Free Computers', href: '/projects/freiecomputer', description: 'Open-source hardware' },
        { label: '🌐 LTSP Project', href: '/projects/ltsp', description: 'Linux Terminal Server' },
        { label: '📊 kivitendo', href: '/projects/kivitendo', description: 'Open-source ERP' }
      ]
    }
  }
}

export const chatbotEngine = new ChatbotEngine()