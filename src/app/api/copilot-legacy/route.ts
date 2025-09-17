import { NextRequest, NextResponse } from 'next/server'

interface NavigationSuggestion {
  label: string
  href: string
  description: string
  external?: boolean
}

interface CopilotResponse {
  response: string
  suggestions: NavigationSuggestion[]
}

// German navigation mapping based on user intents
const NAVIGATION_MAP = {
  services: {
    keywords: [
      // German keywords
      'service', 'dienstleistung', 'reparatur', 'repair', 'reparieren', 'fix', 'upgrade', 'install', 'installieren',
      'hilfe', 'help', 'support', 'unterstützung', 'computer', 'hardware', 'software', 'linux', 'web', 
      'entwicklung', 'development', 'recycling', 'daten', 'data', 'webdesign', 'webentwicklung'
    ],
    suggestions: [
      { label: '🖥️ Computer-Reparatur & Upgrades', href: '/services/computer-repair-upgrades', description: 'Professionelle Reparaturen und Hardware-Upgrades' },
      { label: '💾 Datenrettung & Übertragung', href: '/services/data-recovery-transfer', description: 'Sichere Datenrettung und Migration' },
      { label: '🐧 Linux & Open Source', href: '/services/linux-open-source', description: 'Linux-Installation und Support' },
      { label: '🌐 Webdesign & Entwicklung', href: '/services/web-design-development', description: 'Professionelle Webentwicklung' },
      { label: '🔧 Alle Dienstleistungen', href: '/services', description: 'Übersicht aller Services' }
    ]
  },
  shop: {
    keywords: [
      'shop', 'kaufen', 'buy', 'purchase', 'einkaufen', 'computer', 'laptop', 'refurbished', 'aufbereitet', 
      'hardware', 'equipment', 'geräte', 'machine', 'maschine', 'elektronik'
    ],
    suggestions: [
      { label: '🛒 Refurbished Computer kaufen', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Hochwertige aufbereitete Elektronik', external: true },
      { label: '🔧 Computer zusammenstellen (demnächst)', href: '/services/build-your-computer', description: 'KI-gestützte individuelle Computer-Builds' }
    ]
  },
  donate: {
    keywords: [
      'spenden', 'donate', 'donation', 'spende', 'unterstützen', 'support', 'contribute', 'beitragen', 
      'helfen', 'help', 'fund', 'finanzieren', 'money', 'geld', 'mission'
    ],
    suggestions: [
      { label: '💝 Spenden', href: '/get-involved/donate', description: 'Unsere Nachhaltigkeitsmission unterstützen' },
      { label: '🤝 Partnerschaften', href: '/get-involved/partnerships', description: 'Unternehmenspartnerschaft eingehen' }
    ]
  },
  volunteer: {
    keywords: [
      'freiwillig', 'volunteer', 'helfen', 'help', 'mitmachen', 'join', 'teilnehmen', 'participate', 
      'beitragen', 'contribute', 'arbeiten', 'work', 'praktikum', 'intern', 'erfahrung', 'experience', 'lernen', 'learn'
    ],
    suggestions: [
      { label: '🤝 Freiwilliger werden', href: '/get-involved/volunteer', description: 'Teil unseres Freiwilligen-Teams werden' },
      { label: '💻 Technische Experten', href: '/get-involved/technical-experts', description: 'Technisches Fachwissen teilen' },
      { label: '🎓 Praktikum', href: '/get-involved/internships', description: 'Wertvolle Erfahrungen sammeln' },
      { label: '🔄 Wiedereinstieg', href: '/get-involved/work-reintegration', description: 'Karriere neu starten' }
    ]
  },
  workshops: {
    keywords: [
      'workshop', 'workshops', 'lernen', 'learn', 'training', 'schulung', 'kurs', 'course', 'bildung', 
      'education', 'fähigkeiten', 'skills', 'unterricht', 'teach'
    ],
    suggestions: [
      { label: '🎓 Aktuelle Workshops', href: '/workshops', description: 'Kommende Lernangebote ansehen' },
      { label: '🐧 Linux-Schulungen', href: '/services/linux-open-source', description: 'Professionelle Linux-Bildung' }
    ]
  },
  projects: {
    keywords: [
      'projekt', 'projekte', 'project', 'initiative', 'initiativen', 'arbeit', 'work', 'compirat', 
      'linuxola', 'kivitendo', 'ltsp', 'freiecomputer'
    ],
    suggestions: [
      { label: '💼 Alle Projekte', href: '/projects', description: 'Aktuelle und vergangene Initiativen' },
      { label: '🎓 Compirat', href: '/projects/compirat', description: 'Digitale Inklusion und Computerkompetenz' },
      { label: '🌍 Linuxola', href: '/projects/linuxola', description: 'Afrika mit digitalen Commons verbinden' },
      { label: '🖥️ FreieComputer', href: '/projects/freiecomputer', description: 'Schweizer Label für Computer mit freier Software' }
    ]
  },
  about: {
    keywords: [
      'über uns', 'about', 'mission', 'wer', 'who', 'was', 'what', 'warum', 'why', 'revamp', 
      'unternehmen', 'company', 'organisation', 'organization', 'team'
    ],
    suggestions: [
      { label: '🏢 Über Revamp IT', href: '/about', description: 'Unsere Mission und Wirkung kennenlernen' },
      { label: '🏷️ REVAMPED-Zertifizierung', href: '/revamped', description: 'Unsere nachhaltige Computer-Zertifizierung' },
      { label: '📚 Wissens-Wiki', href: 'https://revamp-it.ch/index.php/de/wiki-de', description: 'Unser gemeinsames Wissensportal', external: true }
    ]
  },
  contact: {
    keywords: [
      'kontakt', 'contact', 'erreichen', 'reach', 'sprechen', 'talk', 'email', 'telefon', 'phone', 
      'adresse', 'address', 'standort', 'location'
    ],
    suggestions: [
      { label: '📞 Kontakt aufnehmen', href: '/contact', description: 'Mit unserem Team in Verbindung treten' }
    ]
  }
}

function analyzeIntent(message: string): { category: string; confidence: number } {
  const normalizedMessage = message.toLowerCase()
  let bestMatch = { category: 'general', confidence: 0 }

  for (const [category, config] of Object.entries(NAVIGATION_MAP)) {
    const matches = config.keywords.filter(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    ).length
    
    const confidence = matches / config.keywords.length
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { category, confidence }
    }
  }

  return bestMatch
}

function generateResponse(message: string, intent: { category: string; confidence: number }, context?: { currentPage?: string; currentSection?: string }): CopilotResponse {
  const responses = {
    services: {
      high: "Gerne helfe ich Ihnen bei der Suche nach dem richtigen Service! Wir bieten Computer-Reparaturen, Datenrettung, Linux-Support, Webentwicklung und viele weitere Dienstleistungen.",
      medium: "Suchen Sie technische Dienstleistungen? Wir sind spezialisiert auf Computer-Reparaturen, Open Source-Lösungen und Webentwicklung.",
      low: "Wir bieten verschiedene technische Dienstleistungen wie Reparaturen, Upgrades und Open Source-Lösungen."
    },
    shop: {
      high: "Perfekt! In unserem Online-Shop finden Sie hochwertige refurbished Computer und Elektronik. Demnächst bieten wir auch individuelle Computer-Builds an!",
      medium: "Möchten Sie etwas kaufen? Schauen Sie sich unseren Shop für qualitativ hochwertige, nachhaltige Elektronik an.",
      low: "In unserem Shop-Bereich finden Sie refurbished Computer und Elektronik."
    },
    donate: {
      high: "Vielen Dank, dass Sie unsere Mission unterstützen möchten! Ihre Spende hilft uns dabei, digitale Nachhaltigkeit und Inklusion zu fördern.",
      medium: "Wir schätzen Ihr Interesse an unserer Unterstützung sehr! Spenden helfen dabei, unsere Nachhaltigkeitsinitiativen zu finanzieren.",
      low: "Sie können unsere Arbeit durch Spenden oder Partnerschaften unterstützen."
    },
    volunteer: {
      high: "Wunderbar! Wir würden Sie gerne in unserem Team begrüßen. Wir haben Möglichkeiten für Freiwillige, technische Experten und Praktikanten.",
      medium: "Interessiert daran zu helfen? Wir haben verschiedene Freiwilligen-Möglichkeiten verfügbar.",
      low: "Es gibt verschiedene Wege, sich in unserer Organisation zu engagieren."
    },
    workshops: {
      high: "Unsere Workshops sind super zum Lernen! Wir bieten Schulungen zu Linux, Open Source-Technologien und digitalen Kompetenzen an.",
      medium: "Wir haben verschiedene Bildungsworkshops und Schulungsmöglichkeiten.",
      low: "Schauen Sie sich unseren Workshop-Bereich für Lernmöglichkeiten an."
    },
    projects: {
      high: "Wir arbeiten an mehreren spannenden Projekten! Von digitaler Inklusion (Compirat) bis zur Verbindung Afrikas mit Open Source (Linuxola).",
      medium: "Unsere Projekte konzentrieren sich auf digitale Nachhaltigkeit und Inklusion weltweit.",
      low: "Wir haben verschiedene Community- und Technologie-Projekte."
    },
    about: {
      high: "Revamp IT widmet sich der digitalen Nachhaltigkeit und Inklusion. Wir bereiten Computer auf, bieten technische Services und fördern Open Source-Lösungen.",
      medium: "Wir sind eine Organisation, die sich auf nachhaltige Technologie und digitale Inklusion konzentriert.",
      low: "Erfahren Sie mehr über unsere Mission und Arbeit im Über uns-Bereich."
    },
    contact: {
      high: "Sie können unser Team über unsere Kontaktseite erreichen. Wir sind da, um bei allen Fragen zu helfen!",
      medium: "Nehmen Sie gerne über unsere Kontaktinformationen Kontakt mit uns auf.",
      low: "Kontaktinformationen sind auf unserer Kontaktseite verfügbar."
    },
    general: {
      high: "Ich bin hier, um Ihnen bei der Navigation auf Revamp IT zu helfen! Ich kann Sie zu unseren Services, dem Shop, Spendenmöglichkeiten, Freiwilligen-Chancen und mehr führen.",
      medium: "Ich kann Ihnen helfen, das zu finden, was Sie auf unserer Website suchen. Wofür interessieren Sie sich?",
      low: "Wie kann ich Ihnen heute bei der Erkundung von Revamp IT helfen?"
    }
  }

  // Add contextual responses based on current page
  if (context?.currentPage) {
    if (context.currentPage === '/services' && intent.category === 'general') {
      return {
        response: "Da Sie bereits auf unserer Services-Seite sind, kann ich Ihnen bei der Auswahl der richtigen Dienstleistung helfen. Suchen Sie etwas Bestimmtes?",
        suggestions: NAVIGATION_MAP.services.suggestions
      }
    } else if (context.currentPage === '/about' && intent.category === 'general') {
      return {
        response: "Sie erfahren gerade mehr über uns! Möchten Sie auch unsere praktischen Services entdecken oder andere Bereiche erkunden?",
        suggestions: [
          { label: '🔧 Dienstleistungen entdecken', href: '/services', description: 'Was wir für Sie tun können' },
          { label: '💼 Projekte ansehen', href: '/projects', description: 'Unsere Initiativen kennenlernen' },
          { label: '🤝 Mitmachen', href: '/get-involved', description: 'Teil unserer Mission werden' }
        ]
      }
    } else if (context.currentPage.includes('/get-involved') && intent.category === 'general') {
      return {
        response: "Toll, dass Sie sich engagieren möchten! Wie möchten Sie am besten bei Revamp IT mitmachen?",
        suggestions: NAVIGATION_MAP.volunteer.suggestions
      }
    }
  }

  const categoryResponses = responses[intent.category as keyof typeof responses] || responses.general
  let responseText: string

  if (intent.confidence > 0.3) {
    responseText = categoryResponses.high
  } else if (intent.confidence > 0.15) {
    responseText = categoryResponses.medium  
  } else {
    responseText = categoryResponses.low
  }

  const suggestions = intent.confidence > 0.1 && NAVIGATION_MAP[intent.category as keyof typeof NAVIGATION_MAP] 
    ? NAVIGATION_MAP[intent.category as keyof typeof NAVIGATION_MAP].suggestions
    : [
        { label: 'Browse Services', href: '/services', description: 'Computer repair, Linux, web development' },
        { label: 'Visit Shop', href: 'https://www.revamp-it.ch/index.php/de/shop-de', description: 'Refurbished computers & electronics', external: true },
        { label: 'Get Involved', href: '/get-involved', description: 'Volunteer, donate, or partner with us' },
        { label: 'Contact Us', href: '/contact', description: 'Reach out to our team' }
      ]

  return {
    response: responseText,
    suggestions: suggestions.slice(0, 4) // Limit to 4 suggestions
  }
}

// Simple rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute  
const MAX_REQUESTS = 10 // 10 messages per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimit.get(ip)

  if (!userLimit) {
    rateLimit.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (userLimit.count < MAX_REQUESTS) {
    userLimit.count++
    return true
  }

  return false
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real
  }
  
  return 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request)
    
    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte warten Sie einen Moment.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { message, history, currentPage, currentSection } = body

    // Validation
    if (!message || typeof message !== 'string' || message.trim().length < 1) {
      return NextResponse.json(
        { error: 'Nachricht ist erforderlich' },
        { status: 400 }
      )
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Nachricht ist zu lang (maximal 500 Zeichen)' },
        { status: 400 }
      )
    }

    // Analyze user intent
    const intent = analyzeIntent(message.trim())
    
    // Generate contextual response with page context
    const context = { currentPage, currentSection }
    const response = generateResponse(message.trim(), intent, context)

    // Log the interaction (for analytics/improvement)
    if (process.env.NODE_ENV === 'development') {
      console.log('🤖 Copilot interaction:', {
        message,
        intent: intent.category,
        confidence: intent.confidence,
        page: currentPage || 'Unknown',
        section: currentSection || 'Unknown',
        ip
      })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Copilot Fehler:', error)
    return NextResponse.json(
      { 
        response: 'Entschuldigung, ich habe gerade technische Probleme. Sie können gerne unser Navigationsmenü nutzen oder uns direkt kontaktieren!',
        suggestions: [
          { label: '📞 Support kontaktieren', href: '/contact', description: 'Direkte Hilfe von unserem Team' }
        ]
      },
      { status: 200 } // Return 200 to avoid breaking the chat flow
    )
  }
}