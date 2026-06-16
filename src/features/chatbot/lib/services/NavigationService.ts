/**
 * NavigationService - Intelligent site navigation and content discovery
 *
 * This service provides intelligent navigation suggestions based on user intent,
 * current context, and site structure. It helps users discover relevant content
 * and navigate the RevampIT website effectively.
 */

import { Language, NavigationSuggestion, SiteSection, ConversationContext } from '../types'
import { ensureIconInLabel } from '@/lib/suggestion-utils'

export class NavigationService {
  private siteStructure: Map<string, SiteSection>
  private keywordIndex: Map<string, string[]>

  constructor() {
    this.siteStructure = new Map()
    this.keywordIndex = new Map()
    this.initializeSiteStructure()
    this.buildKeywordIndex()
  }

  /**
   * Get navigation suggestions based on user input and context
   */
  getNavigationSuggestions(
    query: string,
    context: ConversationContext,
    maxSuggestions = 5
  ): NavigationSuggestion[] {
    const suggestions: NavigationSuggestion[] = []

    // Add intent-based suggestions
    suggestions.push(...this.getIntentBasedSuggestions(query, context.language))

    // Add contextual suggestions based on current page
    suggestions.push(...this.getContextualSuggestions(context.currentPage, context.language))

    // Add related content suggestions
    suggestions.push(...this.getRelatedContentSuggestions(query, context.language))

    // Add popular/recommended suggestions
    suggestions.push(...this.getRecommendedSuggestions(context))

    // Remove duplicates and rank by priority
    const uniqueSuggestions = this.deduplicateAndRank(suggestions)

    return uniqueSuggestions.slice(0, maxSuggestions)
  }

  /**
   * Find sections that match the user's query
   */
  findMatchingSections(query: string, language: Language): SiteSection[] {
    const matches: SiteSection[] = []
    const queryWords = query.toLowerCase().split(/\s+/)

    for (const [path, section] of this.siteStructure) {
      if (!section.languages.includes(language)) continue

      const score = this.calculateSectionMatchScore(section, queryWords)
      if (score > 0.3) {
        matches.push(section)
      }
    }

    return matches.sort((a, b) =>
      this.calculateSectionMatchScore(b, queryWords) -
      this.calculateSectionMatchScore(a, queryWords)
    )
  }

  /**
   * Get suggestions for exploring from the current page
   */
  getExplorationSuggestions(currentPage: string, language: Language): NavigationSuggestion[] {
    const currentSection = this.siteStructure.get(currentPage)
    const suggestions: NavigationSuggestion[] = []

    if (currentSection?.children) {
      // Add child sections
      currentSection.children.forEach(child => {
        suggestions.push({
          label: this.getSectionLabel(child, language),
          href: child.path,
          description: child.description,
          category: this.getSectionCategory(child.path),
          priority: 8
        })
      })
    }

    // Add related sections
    suggestions.push(...this.getRelatedSections(currentPage, language))

    return suggestions
  }

  private initializeSiteStructure() {
    const sections: SiteSection[] = [
      // Main sections
      {
        path: '/',
        name: 'Home',
        description: 'RevampIT main page with overview of our sustainable IT mission',
        languages: ['en', 'de'],
        keywords: ['home', 'main', 'start', 'revampit', 'sustainable', 'it', 'schweiz', 'zurich']
      },
      {
        path: '/about',
        name: 'About Us',
        description: 'Learn about RevampIT mission, team, and impact',
        languages: ['en', 'de'],
        keywords: ['about', 'team', 'mission', 'story', 'impact', 'über', 'uns', 'geschichte']
      },

      // Services section
      {
        path: '/services',
        name: 'Services',
        description: 'Professional IT services and computer repairs',
        languages: ['en', 'de'],
        keywords: ['services', 'repair', 'fix', 'computer', 'laptop', 'dienstleistungen', 'reparatur'],
        children: [
          {
            path: '/services/linux-open-source',
            name: 'Linux & Open Source',
            description: 'Linux consulting, migration, and open-source solutions',
            languages: ['en', 'de'],
            keywords: ['linux', 'ubuntu', 'debian', 'open', 'source', 'migration', 'consulting']
          },
          {
            path: '/services/web-design-development',
            name: 'Web Development',
            description: 'Professional website design and development',
            languages: ['en', 'de'],
            keywords: ['web', 'website', 'development', 'design', 'programming', 'webentwicklung']
          },
        ]
      },

      // Projects section
      {
        path: '/projects',
        name: 'Projects',
        description: 'Open-source projects and community initiatives',
        languages: ['en', 'de'],
        keywords: ['projects', 'open', 'source', 'community', 'initiative', 'projekte'],
        children: [
          {
            path: '/projects/freiecomputer',
            name: 'Freie Computer',
            description: 'Open hardware computer project',
            languages: ['en', 'de'],
            keywords: ['freie', 'computer', 'open', 'hardware', 'free', 'computers']
          },
          {
            path: '/projects/ltsp',
            name: 'LTSP',
            description: 'Linux Terminal Server Project implementation',
            languages: ['en', 'de'],
            keywords: ['ltsp', 'linux', 'terminal', 'server', 'thin', 'client']
          },
          {
            path: '/projects/kivitendo',
            name: 'Kivitendo',
            description: 'Open-source ERP system development',
            languages: ['en', 'de'],
            keywords: ['kivitendo', 'erp', 'business', 'management', 'accounting']
          }
        ]
      },

      // Get Involved section
      {
        path: '/get-involved',
        name: 'Get Involved',
        description: 'Ways to support and participate in RevampIT',
        languages: ['en', 'de'],
        keywords: ['involved', 'volunteer', 'donate', 'support', 'help', 'mitmachen', 'spenden'],
        children: [
          {
            path: '/get-involved/volunteer',
            name: 'Volunteer',
            description: 'Join our team as a volunteer',
            languages: ['en', 'de'],
            keywords: ['volunteer', 'help', 'time', 'skills', 'freiwillig', 'mithelfen']
          },
          {
            path: '/get-involved/donate',
            name: 'Donate',
            description: 'Financial support for sustainable IT',
            languages: ['en', 'de'],
            keywords: ['donate', 'money', 'support', 'financial', 'spenden', 'unterstützen']
          },
          {
            path: '/get-involved/partnerships',
            name: 'Partnerships',
            description: 'Corporate partnerships and collaboration',
            languages: ['en', 'de'],
            keywords: ['partnership', 'corporate', 'business', 'collaboration', 'zusammenarbeit']
          }
        ]
      },

      // Other sections
      {
        path: '/workshops',
        name: 'Workshops',
        description: 'Educational workshops and training programs',
        languages: ['en', 'de'],
        keywords: ['workshop', 'training', 'education', 'course', 'learn', 'schulung', 'kurs']
      },
      {
        path: '/contact',
        name: 'Contact',
        description: 'Get in touch with RevampIT team',
        languages: ['en', 'de'],
        keywords: ['contact', 'phone', 'email', 'address', 'location', 'kontakt', 'telefon']
      },
      {
        path: '/revamped',
        name: 'REVAMPED Certification',
        description: 'Our sustainable computer certification program',
        languages: ['en', 'de'],
        keywords: ['revamped', 'certification', 'sustainable', 'quality', 'guarantee', 'zertifizierung']
      },
      {
        path: '/blog',
        name: 'Blog',
        description: 'Latest news and insights from RevampIT',
        languages: ['en', 'de'],
        keywords: ['blog', 'news', 'articles', 'insights', 'updates', 'nachrichten']
      }
    ]

    sections.forEach(section => {
      this.siteStructure.set(section.path, section)
      if (section.children) {
        section.children.forEach(child => {
          this.siteStructure.set(child.path, child)
        })
      }
    })
  }

  private buildKeywordIndex() {
    for (const [path, section] of this.siteStructure) {
      section.keywords.forEach(keyword => {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, [])
        }
        this.keywordIndex.get(keyword)!.push(path)
      })
    }
  }

  private getIntentBasedSuggestions(query: string, language: Language): NavigationSuggestion[] {
    const suggestions: NavigationSuggestion[] = []
    const queryLower = query.toLowerCase()

    // Shopping/buying intent
    if (queryLower.match(/(buy|shop|purchase|kaufen|bestellen)/)) {
      suggestions.push({
        label: language === 'de' ? '🛒 Refurbished Computer kaufen' : '🛒 Buy Refurbished Computers',
        href: '/marketplace',
        description: language === 'de' ? 'Hochwertige aufbereitete Elektronik' : 'High-quality refurbished electronics',
        category: 'product',
        priority: 15
      })
    }

    // Repair intent
    if (queryLower.match(/(repair|fix|broken|problem|reparier|kaputt|defekt)/)) {
      suggestions.push({
        label: language === 'de' ? '🔧 Computer reparieren lassen' : '🔧 Get Computer Repair',
        href: '/services',
        description: language === 'de' ? 'Professionelle Reparaturen und Upgrades' : 'Professional repairs and upgrades',
        category: 'service',
        priority: 15
      })
    }

    // Learning intent
    if (queryLower.match(/(learn|workshop|course|training|lernen|kurs|schulung)/)) {
      suggestions.push({
        label: language === 'de' ? '📚 Workshops besuchen' : '📚 Attend Workshops',
        href: '/workshops',
        description: language === 'de' ? 'Technische Bildung und Kurse' : 'Technical education and courses',
        category: 'info',
        priority: 14
      })
    }

    // Volunteering intent
    if (queryLower.match(/(volunteer|help|support|freiwillig|helfen|mithelfen)/)) {
      suggestions.push({
        label: language === 'de' ? '🤝 Freiwillig mithelfen' : '🤝 Volunteer',
        href: '/get-involved/volunteer',
        description: language === 'de' ? 'Zeit und Fähigkeiten spenden' : 'Donate your time and skills',
        category: 'involvement',
        priority: 13
      })
    }

    return suggestions
  }

  private getContextualSuggestions(currentPage: string, language: Language): NavigationSuggestion[] {
    const suggestions: NavigationSuggestion[] = []
    const section = this.siteStructure.get(currentPage)

    if (!section) return suggestions

    // Add parent section if we're in a subsection
    if (currentPage.includes('/') && currentPage !== '/') {
      const parentPath = currentPage.substring(0, currentPage.lastIndexOf('/')) || '/'
      const parentSection = this.siteStructure.get(parentPath)

      if (parentSection) {
        suggestions.push({
          label: `📁 ${this.getSectionLabel(parentSection, language)}`,
          href: parentPath,
          description: language === 'de' ? 'Zurück zum Hauptbereich' : 'Back to main section',
          priority: 7
        })
      }
    }

    // Add sibling sections
    const parentPath = currentPage.includes('/') ?
      currentPage.substring(0, currentPage.lastIndexOf('/')) || '/' : '/'
    const parentSection = this.siteStructure.get(parentPath)

    if (parentSection?.children) {
      parentSection.children
        .filter(child => child.path !== currentPage)
        .forEach(sibling => {
          suggestions.push({
            label: this.getSectionLabel(sibling, language),
            href: sibling.path,
            description: sibling.description,
            priority: 6
          })
        })
    }

    return suggestions
  }

  private getRelatedContentSuggestions(query: string, language: Language): NavigationSuggestion[] {
    const suggestions: NavigationSuggestion[] = []
    const queryWords = query.toLowerCase().split(/\s+/)

    for (const [path, section] of this.siteStructure) {
      if (!section.languages.includes(language)) continue

      const matchScore = this.calculateSectionMatchScore(section, queryWords)
      if (matchScore > 0.4) {
        suggestions.push({
          label: this.getSectionLabel(section, language),
          href: path,
          description: section.description,
          priority: Math.round(matchScore * 10)
        })
      }
    }

    return suggestions
  }

  private getRecommendedSuggestions(context: ConversationContext): NavigationSuggestion[] {
    const language = context.language
    const timeHour = context.timeOfDay || new Date().getHours()

    // Business hours recommendations
    if (timeHour >= 9 && timeHour <= 17) {
      return [
        {
          label: language === 'de' ? '📞 Jetzt anrufen' : '📞 Call Now',
          href: '/contact',
          description: language === 'de' ? 'Wir sind gerade erreichbar!' : 'We are available right now!',
          category: 'contact',
          priority: 12
        }
      ]
    }

    // Evening/weekend recommendations
    return [
      {
        label: language === 'de' ? '🛒 Online Shop besuchen' : '🛒 Visit Online Shop',
        href: '/marketplace',
        description: language === 'de' ? '24/7 verfügbar' : '24/7 available',
        category: 'product',
        priority: 11
      }
    ]
  }

  private calculateSectionMatchScore(section: SiteSection, queryWords: string[]): number {
    let score = 0
    const totalWords = queryWords.length

    if (totalWords === 0) return 0

    queryWords.forEach(word => {
      // Check section keywords
      if (section.keywords.some(keyword => keyword.includes(word) || word.includes(keyword))) {
        score += 1
      }

      // Check section name
      if (section.name.toLowerCase().includes(word)) {
        score += 0.8
      }

      // Check section description
      if (section.description.toLowerCase().includes(word)) {
        score += 0.5
      }
    })

    return Math.min(score / totalWords, 1)
  }

  private getSectionLabel(section: SiteSection, language: Language): string {
    // You could maintain translation maps here
    return section.name
  }

  private getSectionCategory(path: string): NavigationSuggestion['category'] {
    if (path.startsWith('/services')) return 'service'
    if (path.startsWith('/get-involved')) return 'involvement'
    if (path === '/contact') return 'contact'
    if (path.includes('shop')) return 'product'
    return 'info'
  }

  private getRelatedSections(currentPage: string, language: Language): NavigationSuggestion[] {
    // Simple related content based on section hierarchy
    const suggestions: NavigationSuggestion[] = []

    // Add common navigation paths based on current location
    if (currentPage.startsWith('/services')) {
      suggestions.push({
        label: language === 'de' ? '🛒 Computer kaufen' : '🛒 Buy Computer',
        href: '/marketplace',
        description: language === 'de' ? 'Alternative: Gebrauchten Computer kaufen' : 'Alternative: Buy refurbished computer',
        priority: 5
      })
    }

    return suggestions
  }

  private deduplicateAndRank(suggestions: NavigationSuggestion[]): NavigationSuggestion[] {
    const seen = new Set<string>()
    const unique: NavigationSuggestion[] = []

    suggestions
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .forEach(suggestion => {
        if (!seen.has(suggestion.href)) {
          seen.add(suggestion.href)
          unique.push(suggestion)
        }
      })

    return unique
  }
}
