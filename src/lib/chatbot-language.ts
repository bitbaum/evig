import { EXTERNAL_LINKS } from '@/config/org'

export type Language = 'en' | 'de'

export interface ChatbotMessages {
  welcome: {
    default: string
    [key: string]: string
  }
  placeholder: string
  typing: string
  error: string
  fallback: string
  buttons: {
    minimize: string
    maximize: string
    close: string
    send: string
  }
  status: string
}

export const chatbotMessages: Record<Language, ChatbotMessages> = {
  de: {
    welcome: {
      default: 'Hallo! Ich bin dein persönlicher Revamp IT Navigator. Wie kann ich dir heute dabei helfen, das zu finden, was du suchst?',
      '/': 'Hallo! Ich bin dein persönlicher Revamp IT Assistent. Wie kann ich dir heute helfen, unsere nachhaltigen IT-Lösungen zu entdecken?',
      '/about': 'Du bist auf unserer "Über uns" Seite! Möchtest du mehr über unsere Mission erfahren oder zu anderen Bereichen navigieren?',
      '/services': 'Perfekt! Du schaust dir unsere Dienstleistungen an. Suchst du etwas Bestimmtes oder brauchst du Hilfe bei der Auswahl?',
      '/projects': 'Interessant! Du entdeckst unsere Projekte. Möchtest du mehr über ein spezielles Projekt erfahren oder andere Bereiche erkunden?',
      '/workshops': 'Du interessierst dich für unsere Workshops! Suchst du nach bestimmten Kursen oder hast du Fragen zu unserem Bildungsangebot?',
      '/get-involved': 'Fantastisch, dass du dich engagieren möchtest! Wie kannst du am besten bei Revamp IT mitmachen?',
      '/contact': 'Du bist auf unserer Kontaktseite. Brauchst du Hilfe dabei, den richtigen Ansprechpartner zu finden?',
      '/blog': 'Du liest unseren Blog! Suchst du nach bestimmten Themen oder möchtest du andere Bereiche erkunden?'
    },
    placeholder: 'Frag mich nach unseren Services, Shop, Spenden...',
    typing: 'Assistent tippt...',
    error: 'Entschuldigung, ich habe gerade technische Probleme. Du kannst gerne unser Hauptmenü nutzen oder uns direkt kontaktieren!',
    fallback: 'Entschuldigung, ich verstehe deine Frage nicht ganz. Hier sind einige Bereiche, bei denen ich dir helfen kann:',
    buttons: {
      minimize: 'Minimieren',
      maximize: 'Maximieren',
      close: 'Schliessen',
      send: 'Senden'
    },
    status: 'Hier um zu helfen'
  },
  en: {
    welcome: {
      default: 'Hello! I\'m your personal Revamp IT navigator. How can I help you find what you\'re looking for today?',
      '/': 'Hello! I\'m your personal Revamp IT assistant. How can I help you discover our sustainable IT solutions today?',
      '/about': 'You\'re on our "About us" page! Would you like to learn more about our mission or navigate to other areas?',
      '/services': 'Perfect! You\'re looking at our services. Are you looking for something specific or do you need help choosing?',
      '/projects': 'Interesting! You\'re exploring our projects. Would you like to learn more about a specific project or explore other areas?',
      '/workshops': 'You\'re interested in our workshops! Are you looking for specific courses or do you have questions about our educational offerings?',
      '/get-involved': 'Fantastic that you want to get involved! How can you best participate with Revamp IT?',
      '/contact': 'You\'re on our contact page. Do you need help finding the right contact person?',
      '/blog': 'You\'re reading our blog! Are you looking for specific topics or would you like to explore other areas?'
    },
    placeholder: 'Ask me about our services, shop, donations...',
    typing: 'Assistant is typing...',
    error: 'Sorry, I\'m having technical problems right now. Feel free to use our main menu or contact us directly!',
    fallback: 'I\'m sorry, I don\'t quite understand your question. Here are some areas I can help you with:',
    buttons: {
      minimize: 'Minimize',
      maximize: 'Maximize',
      close: 'Close',
      send: 'Send'
    },
    status: 'Here to help'
  }
}

export function detectLanguage(message: string, defaultLang: Language = 'de'): Language {
  // Simple language detection based on common words
  const germanWords = ['ich', 'und', 'der', 'die', 'das', 'ist', 'mit', 'auf', 'für', 'haben', 'sie', 'nicht', 'werden', 'ein', 'zu', 'sein', 'nach', 'wie', 'aber', 'aus', 'über', 'noch', 'nur', 'auch', 'können', 'wir', 'oder', 'wenn', 'was', 'wo', 'warum']
  const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']

  const words = message.toLowerCase().split(/\s+/)
  let germanScore = 0
  let englishScore = 0

  words.forEach(word => {
    if (germanWords.includes(word)) germanScore++
    if (englishWords.includes(word)) englishScore++
  })

  if (englishScore > germanScore) {
    return 'en'
  }
  
  return defaultLang
}

export function getWelcomeMessage(page: string, language: Language): string {
  const messages = chatbotMessages[language].welcome
  return messages[page] || messages.default
}

// Type-safe overloads for getMessage
export function getMessage(key: 'welcome', language: Language): { default: string; [key: string]: string }
export function getMessage(key: 'placeholder' | 'typing' | 'error' | 'fallback' | 'status', language: Language): string
export function getMessage(key: 'buttons', language: Language): { minimize: string; maximize: string; close: string; send: string }
export function getMessage(key: keyof ChatbotMessages, language: Language): ChatbotMessages[keyof ChatbotMessages] {
  return chatbotMessages[language][key]
}

export function getDefaultSuggestions(language: Language, currentPage: string) {
  if (language === 'de') {
    return [
      { label: '🛒 Refurbished Computer kaufen', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Hochwertige aufbereitete Elektronik', external: true },
      { label: '🔧 Computer reparieren lassen', href: '/services', description: 'Professionelle Reparaturen und Upgrades' },
      { label: '💝 Mission unterstützen', href: '/get-involved/donate', description: 'Spenden für nachhaltige IT' },
      { label: '🤝 Freiwillig mithelfen', href: '/get-involved/volunteer', description: 'Teil unseres Teams werden' }
    ]
  } else {
    return [
      { label: '🛒 Buy Refurbished Computers', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'High-quality refurbished electronics', external: true },
      { label: '🔧 Get Computer Repair', href: '/services', description: 'Professional repairs and upgrades' },
      { label: '💝 Support Our Mission', href: '/get-involved/donate', description: 'Donate for sustainable IT' },
      { label: '🤝 Volunteer', href: '/get-involved/volunteer', description: 'Join our team' }
    ]
  }
}

export function getContextualSuggestions(page: string, language: Language) {
  const suggestions = {
    '/': language === 'de' ? [
      { label: '🛒 Refurbished Computer kaufen', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Hochwertige aufbereitete Elektronik', external: true },
      { label: '🔧 Computer reparieren lassen', href: '/services', description: 'Professionelle Reparaturen und Upgrades' },
      { label: '💝 Mission unterstützen', href: '/get-involved/donate', description: 'Spenden für nachhaltige IT' },
      { label: '🤝 Freiwillig mithelfen', href: '/get-involved/volunteer', description: 'Teil unseres Teams werden' }
    ] : [
      { label: '🛒 Buy Refurbished Computers', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'High-quality refurbished electronics', external: true },
      { label: '🔧 Get Computer Repair', href: '/services', description: 'Professional repairs and upgrades' },
      { label: '💝 Support Our Mission', href: '/get-involved/donate', description: 'Donate for sustainable IT' },
      { label: '🤝 Volunteer', href: '/get-involved/volunteer', description: 'Join our team' }
    ],
    
    '/about': language === 'de' ? [
      { label: '🏷️ REVAMPED-Zertifizierung', href: '/revamped', description: 'Unsere nachhaltige Computer-Zertifizierung' },
      { label: '📚 Wiki besuchen', href: EXTERNAL_LINKS.wiki, description: 'Unser Wissensportal', external: true },
      { label: '🔧 Dienstleistungen ansehen', href: '/services', description: 'Was wir für dich tun können' },
      { label: '💼 Projekte entdecken', href: '/projects', description: 'Unsere aktuellen Initiativen' }
    ] : [
      { label: '🏷️ REVAMPED Certification', href: '/revamped', description: 'Our sustainable computer certification' },
      { label: '📚 Visit Wiki', href: EXTERNAL_LINKS.wiki, description: 'Our knowledge portal', external: true },
      { label: '🔧 View Services', href: '/services', description: 'What we can do for you' },
      { label: '💼 Discover Projects', href: '/projects', description: 'Our current initiatives' }
    ],
    
    '/services': language === 'de' ? [
      { label: '🖥️ Computer-Reparatur', href: '/services', description: 'Hardware-Reparaturen und Upgrades' },
      { label: '💾 Datenrettung', href: '/services', description: 'Sichere Datenwiederherstellung' },
      { label: '🐧 Linux-Support', href: '/services/linux-open-source', description: 'Open Source Lösungen' },
      { label: '🌐 Webentwicklung', href: '/services/web-design-development', description: 'Professionelle Websites' }
    ] : [
      { label: '🖥️ Computer Repair', href: '/services', description: 'Hardware repairs and upgrades' },
      { label: '💾 Data Recovery', href: '/services', description: 'Secure data recovery' },
      { label: '🐧 Linux Support', href: '/services/linux-open-source', description: 'Open source solutions' },
      { label: '🌐 Web Development', href: '/services/web-design-development', description: 'Professional websites' }
    ]
  }
  
  const defaultSuggestions = getDefaultSuggestions(language, page)
  return suggestions[page as keyof typeof suggestions] || defaultSuggestions
}