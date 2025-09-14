import { NavigationSuggestion } from './chatbot-engine'
import { Language } from './chatbot-language'

export interface SmartSuggestionContext {
  currentPage: string
  userIntent?: string
  previousInteractions: string[]
  timeOfDay?: number
  language: Language
}

export class SmartSuggestionEngine {
  private interactionHistory: Map<string, number> = new Map()
  private popularSuggestions: Map<string, number> = new Map()

  constructor() {
    this.initializePopularSuggestions()
  }

  generateSmartSuggestions(context: SmartSuggestionContext): NavigationSuggestion[] {
    // Get base suggestions for the page
    const baseSuggestions = this.getPageBasedSuggestions(context.currentPage, context.language)
    
    // Enhance with smart recommendations
    const smartSuggestions = this.enhanceWithIntelligence(baseSuggestions, context)
    
    // Add personalized suggestions based on interaction history
    const personalizedSuggestions = this.addPersonalizedSuggestions(smartSuggestions, context)
    
    // Sort by relevance and return top 4-6
    return this.rankAndLimitSuggestions(personalizedSuggestions, context)
  }

  recordInteraction(suggestionLabel: string, wasSuccessful: boolean) {
    const currentCount = this.interactionHistory.get(suggestionLabel) || 0
    this.interactionHistory.set(suggestionLabel, currentCount + (wasSuccessful ? 2 : 1))
    
    if (wasSuccessful) {
      const popularCount = this.popularSuggestions.get(suggestionLabel) || 0
      this.popularSuggestions.set(suggestionLabel, popularCount + 1)
    }
  }

  private getPageBasedSuggestions(page: string, language: Language): NavigationSuggestion[] {
    const suggestions = {
      '/': language === 'de' ? [
        { label: '🛒 Refurbished Computer kaufen', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Hochwertige aufbereitete Elektronik', external: true, priority: 10 },
        { label: '🔧 Computer reparieren lassen', href: '/services', description: 'Professionelle Reparaturen und Upgrades', priority: 9 },
        { label: '💝 Mission unterstützen', href: '/get-involved/donate', description: 'Spenden für nachhaltige IT', priority: 8 },
        { label: '🤝 Freiwillig mithelfen', href: '/get-involved/volunteer', description: 'Teil unseres Teams werden', priority: 7 },
        { label: '📚 Mehr erfahren', href: '/about', description: 'Über unsere Mission und Werte', priority: 6 }
      ] : [
        { label: '🛒 Buy Refurbished Computers', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'High-quality refurbished electronics', external: true, priority: 10 },
        { label: '🔧 Get Computer Repair', href: '/services', description: 'Professional repairs and upgrades', priority: 9 },
        { label: '💝 Support Our Mission', href: '/get-involved/donate', description: 'Donate for sustainable IT', priority: 8 },
        { label: '🤝 Volunteer', href: '/get-involved/volunteer', description: 'Join our team', priority: 7 },
        { label: '📚 Learn More', href: '/about', description: 'About our mission and values', priority: 6 }
      ],

      '/services': language === 'de' ? [
        { label: '🖥️ Computer-Reparatur', href: '/services', description: 'Hardware-Reparaturen und Upgrades', priority: 10 },
        { label: '💾 Datenrettung', href: '/services', description: 'Sichere Datenwiederherstellung', priority: 9 },
        { label: '🐧 Linux-Support', href: '/services/linux-open-source', description: 'Open Source Lösungen', priority: 8 },
        { label: '🌐 Webentwicklung', href: '/services/web-design-development', description: 'Professionelle Websites', priority: 7 },
        { label: '☁️ Cloud-Lösungen', href: '/services/cloud-infrastructure', description: 'Moderne Cloud-Infrastruktur', priority: 6 },
        { label: '📞 Kostenlose Beratung', href: '/contact', description: 'Unverbindliches Beratungsgespräch', priority: 9 }
      ] : [
        { label: '🖥️ Computer Repair', href: '/services', description: 'Hardware repairs and upgrades', priority: 10 },
        { label: '💾 Data Recovery', href: '/services', description: 'Secure data recovery', priority: 9 },
        { label: '🐧 Linux Support', href: '/services/linux-open-source', description: 'Open source solutions', priority: 8 },
        { label: '🌐 Web Development', href: '/services/web-design-development', description: 'Professional websites', priority: 7 },
        { label: '☁️ Cloud Solutions', href: '/services/cloud-infrastructure', description: 'Modern cloud infrastructure', priority: 6 },
        { label: '📞 Free Consultation', href: '/contact', description: 'No-obligation consultation', priority: 9 }
      ],

      '/about': language === 'de' ? [
        { label: '🏷️ REVAMPED-Zertifizierung', href: '/revamped', description: 'Unsere nachhaltige Computer-Zertifizierung', priority: 10 },
        { label: '📚 Wiki besuchen', href: 'https://revamp-it.ch/index.php/de/wiki-de', description: 'Unser Wissensportal', external: true, priority: 8 },
        { label: '🤝 Mitmachen', href: '/get-involved', description: 'Engagiere dich für nachhaltige IT', priority: 9 },
        { label: '💼 Projekte entdecken', href: '/projects', description: 'Unsere aktuellen Initiativen', priority: 7 },
        { label: '🔧 Dienstleistungen', href: '/services', description: 'Was wir für Sie tun können', priority: 6 }
      ] : [
        { label: '🏷️ REVAMPED Certification', href: '/revamped', description: 'Our sustainable computer certification', priority: 10 },
        { label: '📚 Visit Wiki', href: 'https://revamp-it.ch/index.php/de/wiki-de', description: 'Our knowledge portal', external: true, priority: 8 },
        { label: '🤝 Get Involved', href: '/get-involved', description: 'Join our sustainable IT mission', priority: 9 },
        { label: '💼 Discover Projects', href: '/projects', description: 'Our current initiatives', priority: 7 },
        { label: '🔧 Our Services', href: '/services', description: 'What we can do for you', priority: 6 }
      ],

      '/projects': language === 'de' ? [
        { label: '💻 Hardware-Projekte', href: '/projects/hardware', description: 'Unsere Hardware-Initiativen', priority: 10 },
        { label: '🖥️ Freie Computer', href: '/projects/freiecomputer', description: 'Open-Source Hardware', priority: 9 },
        { label: '🌐 LTSP-Projekt', href: '/projects/ltsp', description: 'Linux Terminal Server', priority: 8 },
        { label: '📊 kivitendo', href: '/projects/kivitendo', description: 'Open-Source ERP', priority: 7 },
        { label: '🤝 Projekt vorschlagen', href: '/contact', description: 'Eigene Projektidee einreichen', priority: 6 }
      ] : [
        { label: '💻 Hardware Projects', href: '/projects/hardware', description: 'Our hardware initiatives', priority: 10 },
        { label: '🖥️ Free Computers', href: '/projects/freiecomputer', description: 'Open-source hardware', priority: 9 },
        { label: '🌐 LTSP Project', href: '/projects/ltsp', description: 'Linux Terminal Server', priority: 8 },
        { label: '📊 kivitendo', href: '/projects/kivitendo', description: 'Open-source ERP', priority: 7 },
        { label: '🤝 Suggest Project', href: '/contact', description: 'Submit your project idea', priority: 6 }
      ],

      '/get-involved': language === 'de' ? [
        { label: '💝 Jetzt spenden', href: '/get-involved/donate', description: 'Finanzielle Unterstützung', priority: 10 },
        { label: '🤝 Freiwillig mithelfen', href: '/get-involved/volunteer', description: 'Zeit und Fähigkeiten spenden', priority: 9 },
        { label: '👨‍💻 Technische Expertise', href: '/get-involved/technical-experts', description: 'Als Experte unterstützen', priority: 8 },
        { label: '💼 Praktikum', href: '/get-involved/internships', description: 'Praktikumsplätze', priority: 7 },
        { label: '🏢 Partnerships', href: '/get-involved/partnerships', description: 'Unternehmenspartnerschaften', priority: 6 }
      ] : [
        { label: '💝 Donate Now', href: '/get-involved/donate', description: 'Financial support', priority: 10 },
        { label: '🤝 Volunteer', href: '/get-involved/volunteer', description: 'Donate your time and skills', priority: 9 },
        { label: '👨‍💻 Technical Expertise', href: '/get-involved/technical-experts', description: 'Support as an expert', priority: 8 },
        { label: '💼 Internships', href: '/get-involved/internships', description: 'Internship opportunities', priority: 7 },
        { label: '🏢 Partnerships', href: '/get-involved/partnerships', description: 'Corporate partnerships', priority: 6 }
      ],

      '/contact': language === 'de' ? [
        { label: '📍 Standort besuchen', href: '/contact', description: 'Badenerstrasse 816, 8048 Zürich', priority: 10 },
        { label: '📧 E-Mail senden', href: 'mailto:info@revamp-it.ch', description: 'Direkte Kontaktaufnahme', external: true, priority: 9 },
        { label: '🔧 Service anfragen', href: '/services', description: 'Computer-Reparatur beauftragen', priority: 8 },
        { label: '🤝 Mitmachen', href: '/get-involved', description: 'Freiwillig engagieren', priority: 7 }
      ] : [
        { label: '📍 Visit Location', href: '/contact', description: 'Badenerstrasse 816, 8048 Zürich', priority: 10 },
        { label: '📧 Send Email', href: 'mailto:info@revamp-it.ch', description: 'Direct contact', external: true, priority: 9 },
        { label: '🔧 Request Service', href: '/services', description: 'Order computer repair', priority: 8 },
        { label: '🤝 Get Involved', href: '/get-involved', description: 'Volunteer engagement', priority: 7 }
      ]
    }

    const basePage = Object.keys(suggestions).find(key => page.startsWith(key)) || '/'
    return suggestions[basePage as keyof typeof suggestions] || suggestions['/']
  }

  private enhanceWithIntelligence(
    baseSuggestions: NavigationSuggestion[], 
    context: SmartSuggestionContext
  ): NavigationSuggestion[] {
    const enhanced = [...baseSuggestions]

    // Add time-based suggestions
    if (context.timeOfDay !== undefined) {
      enhanced.push(...this.getTimeBasedSuggestions(context.timeOfDay, context.language))
    }

    // Add intent-based suggestions
    if (context.userIntent) {
      enhanced.push(...this.getIntentBasedSuggestions(context.userIntent, context.language))
    }

    return enhanced
  }

  private getTimeBasedSuggestions(hour: number, language: Language): NavigationSuggestion[] {
    // Business hours (9-17): Focus on services and contact
    if (hour >= 9 && hour <= 17) {
      return language === 'de' ? [
        { label: '📞 Jetzt anrufen', href: '/contact', description: 'Wir sind gerade erreichbar!', priority: 12 },
        { label: '🔧 Service beauftragen', href: '/services', description: 'Sofortige Bearbeitung möglich', priority: 11 }
      ] : [
        { label: '📞 Call Now', href: '/contact', description: 'We are available right now!', priority: 12 },
        { label: '🔧 Request Service', href: '/services', description: 'Immediate processing possible', priority: 11 }
      ]
    }

    // Evening/weekend: Focus on self-service and information
    return language === 'de' ? [
      { label: '🛒 Online Shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: '24/7 verfügbar', external: true, priority: 12 },
      { label: '📚 Informationen lesen', href: '/about', description: 'Mehr über uns erfahren', priority: 11 }
    ] : [
      { label: '🛒 Online Shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: '24/7 available', external: true, priority: 12 },
      { label: '📚 Read Information', href: '/about', description: 'Learn more about us', priority: 11 }
    ]
  }

  private getIntentBasedSuggestions(intent: string, language: Language): NavigationSuggestion[] {
    const intentMap = {
      'buy': language === 'de' ? [
        { label: '🛒 Zum Shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Refurbished Elektronik kaufen', external: true, priority: 15 }
      ] : [
        { label: '🛒 To Shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Buy refurbished electronics', external: true, priority: 15 }
      ],

      'repair': language === 'de' ? [
        { label: '🔧 Reparatur-Service', href: '/services', description: 'Professionelle Computer-Reparatur', priority: 15 }
      ] : [
        { label: '🔧 Repair Service', href: '/services', description: 'Professional computer repair', priority: 15 }
      ],

      'help': language === 'de' ? [
        { label: '🤝 Freiwillig helfen', href: '/get-involved/volunteer', description: 'Zeit und Fähigkeiten spenden', priority: 15 }
      ] : [
        { label: '🤝 Volunteer Help', href: '/get-involved/volunteer', description: 'Donate time and skills', priority: 15 }
      ],

      'donate': language === 'de' ? [
        { label: '💝 Spenden', href: '/get-involved/donate', description: 'Nachhaltige IT unterstützen', priority: 15 }
      ] : [
        { label: '💝 Donate', href: '/get-involved/donate', description: 'Support sustainable IT', priority: 15 }
      ]
    }

    return intentMap[intent as keyof typeof intentMap] || []
  }

  private addPersonalizedSuggestions(
    suggestions: NavigationSuggestion[], 
    context: SmartSuggestionContext
  ): NavigationSuggestion[] {
    const personalized = [...suggestions]

    // Add suggestions based on interaction history
    for (const [label, count] of Array.from(this.interactionHistory.entries())) {
      if (count > 3) { // User has interacted with this suggestion multiple times
        const existingSuggestion = personalized.find(s => s.label.includes(label))
        if (existingSuggestion) {
          existingSuggestion.priority = (existingSuggestion.priority || 5) + 2
        }
      }
    }

    // Add popular suggestions from all users
    for (const [label, count] of Array.from(this.popularSuggestions.entries())) {
      if (count > 10) { // Popular across users
        const existingSuggestion = personalized.find(s => s.label.includes(label))
        if (existingSuggestion) {
          existingSuggestion.priority = (existingSuggestion.priority || 5) + 1
        }
      }
    }

    return personalized
  }

  private rankAndLimitSuggestions(
    suggestions: NavigationSuggestion[], 
    context: SmartSuggestionContext
  ): NavigationSuggestion[] {
    // Remove duplicates
    const unique = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.href === suggestion.href)
    )

    // Sort by priority (higher first)
    const sorted = unique.sort((a, b) => (b.priority || 5) - (a.priority || 5))

    // Return top 5 suggestions
    return sorted.slice(0, 5)
  }

  private initializePopularSuggestions() {
    // Initialize with some baseline popular suggestions
    this.popularSuggestions.set('🛒', 50) // Shop is very popular
    this.popularSuggestions.set('🔧', 35) // Repair services
    this.popularSuggestions.set('🤝', 25) // Volunteer/involvement
    this.popularSuggestions.set('💝', 20) // Donations
    this.popularSuggestions.set('📞', 30) // Contact
  }
}

export const smartSuggestionEngine = new SmartSuggestionEngine()

// Helper function to extract user intent from message
export function extractUserIntent(message: string): string | undefined {
  const intents = {
    'buy': ['buy', 'purchase', 'shop', 'kaufen', 'bestellen'],
    'repair': ['repair', 'fix', 'broken', 'reparier', 'kaputt', 'defekt'],
    'help': ['help', 'volunteer', 'assist', 'helfen', 'freiwillig', 'mithelfen'],
    'donate': ['donate', 'support', 'contribute', 'spenden', 'unterstützen'],
    'learn': ['learn', 'education', 'workshop', 'course', 'lernen', 'kurs', 'schulung']
  }

  const lowerMessage = message.toLowerCase()
  
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return intent
    }
  }

  return undefined
}