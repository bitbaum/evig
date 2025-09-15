/**
 * Suggestion enhancement utilities
 * Provides consistent icon mapping and language improvements for chatbot suggestions
 */

import { NavigationSuggestion, Language } from '../types'
import { ensureIconInLabel } from './IconMapping'

/**
 * Enhanced suggestion templates with consistent icons and language
 */
export const ENHANCED_SUGGESTIONS: Record<string, Record<Language, Pick<NavigationSuggestion, 'label' | 'description'>>> = {
  // Shop/Products
  'shop': {
    'de': {
      label: 'Refurbished Computer kaufen',
      description: 'Hochwertige aufbereitete Elektronik im Online-Shop'
    },
    'en': {
      label: 'Buy Refurbished Computers',
      description: 'High-quality refurbished electronics in our online shop'
    }
  },

  // Services
  'repair': {
    'de': {
      label: 'Computer reparieren lassen',
      description: 'Professionelle Hardware-Reparaturen und Upgrades'
    },
    'en': {
      label: 'Get Computer Repair',
      description: 'Professional hardware repairs and upgrades'
    }
  },
  'linux': {
    'de': {
      label: 'Linux & Open Source',
      description: 'Beratung und Unterstützung für Open-Source-Lösungen'
    },
    'en': {
      label: 'Linux & Open Source',
      description: 'Consulting and support for open-source solutions'
    }
  },
  'web': {
    'de': {
      label: 'Webentwicklung',
      description: 'Professionelle Websites und Web-Anwendungen'
    },
    'en': {
      label: 'Web Development',
      description: 'Professional websites and web applications'
    }
  },
  'cloud': {
    'de': {
      label: 'Cloud-Infrastruktur',
      description: 'Moderne Cloud-Lösungen und Server-Management'
    },
    'en': {
      label: 'Cloud Infrastructure',
      description: 'Modern cloud solutions and server management'
    }
  },
  'ai': {
    'de': {
      label: 'KI-Lösungen',
      description: 'Künstliche Intelligenz für Unternehmen'
    },
    'en': {
      label: 'AI Solutions',
      description: 'Artificial intelligence for enterprises'
    }
  },

  // Involvement
  'donate': {
    'de': {
      label: 'Mission unterstützen',
      description: 'Mit einer Spende nachhaltige IT fördern'
    },
    'en': {
      label: 'Support Our Mission',
      description: 'Promote sustainable IT with a donation'
    }
  },
  'volunteer': {
    'de': {
      label: 'Freiwillig mithelfen',
      description: 'Zeit und Fähigkeiten für nachhaltige IT einsetzen'
    },
    'en': {
      label: 'Volunteer With Us',
      description: 'Use your time and skills for sustainable IT'
    }
  },
  'partnerships': {
    'de': {
      label: 'Partnerschaft eingehen',
      description: 'Unternehmerische Zusammenarbeit mit RevampIT'
    },
    'en': {
      label: 'Become a Partner',
      description: 'Business collaboration with RevampIT'
    }
  },
  'technical-expert': {
    'de': {
      label: 'Als Experte unterstützen',
      description: 'Technisches Fachwissen einbringen'
    },
    'en': {
      label: 'Support as Expert',
      description: 'Contribute your technical expertise'
    }
  },

  // Information
  'about': {
    'de': {
      label: 'Über uns erfahren',
      description: 'Mission, Werte und Team von RevampIT kennenlernen'
    },
    'en': {
      label: 'Learn About Us',
      description: 'Get to know RevampIT\'s mission, values and team'
    }
  },
  'revamped': {
    'de': {
      label: 'REVAMPED-Zertifizierung',
      description: 'Unser nachhaltiges Qualitätssiegel für Computer'
    },
    'en': {
      label: 'REVAMPED Certification',
      description: 'Our sustainable quality seal for computers'
    }
  },
  'wiki': {
    'de': {
      label: 'Wiki besuchen',
      description: 'Umfassendes Wissensportal durchstöbern'
    },
    'en': {
      label: 'Visit Wiki',
      description: 'Browse our comprehensive knowledge portal'
    }
  },

  // Projects
  'projects': {
    'de': {
      label: 'Projekte entdecken',
      description: 'Unsere Open-Source-Initiativen erkunden'
    },
    'en': {
      label: 'Discover Projects',
      description: 'Explore our open-source initiatives'
    }
  },
  'freie-computer': {
    'de': {
      label: 'Freie Computer',
      description: 'Open-Hardware-Computer für maximale Transparenz'
    },
    'en': {
      label: 'Free Computers',
      description: 'Open-hardware computers for maximum transparency'
    }
  },

  // Learning
  'workshops': {
    'de': {
      label: 'Workshops besuchen',
      description: 'Technische Bildung und praktische Kurse'
    },
    'en': {
      label: 'Attend Workshops',
      description: 'Technical education and practical courses'
    }
  },

  // Contact
  'contact': {
    'de': {
      label: 'Kontakt aufnehmen',
      description: 'Direkter Austausch mit unserem Team'
    },
    'en': {
      label: 'Get In Touch',
      description: 'Direct communication with our team'
    }
  },
  'location': {
    'de': {
      label: 'Standort besuchen',
      description: 'Badenerstrasse 816, 8048 Zürich'
    },
    'en': {
      label: 'Visit Our Location',
      description: 'Badenerstrasse 816, 8048 Zurich'
    }
  },
  'consultation': {
    'de': {
      label: 'Beratung anfragen',
      description: 'Kostenlose Erstberatung vereinbaren'
    },
    'en': {
      label: 'Request Consultation',
      description: 'Schedule a free initial consultation'
    }
  },

  // Navigation
  'home': {
    'de': {
      label: 'Zur Startseite',
      description: 'Zurück zur Hauptseite'
    },
    'en': {
      label: 'Go Home',
      description: 'Return to main page'
    }
  },

  // Time-based
  'call-now': {
    'de': {
      label: 'Jetzt anrufen',
      description: 'Wir sind gerade erreichbar!'
    },
    'en': {
      label: 'Call Now',
      description: 'We are available right now!'
    }
  },
  'online-shop-24-7': {
    'de': {
      label: 'Online-Shop besuchen',
      description: 'Rund um die Uhr verfügbar'
    },
    'en': {
      label: 'Visit Online Shop',
      description: 'Available 24/7'
    }
  }
}

/**
 * Enhance a suggestion with consistent icon and language
 */
export function enhanceSuggestion(
  suggestion: NavigationSuggestion,
  language: Language
): NavigationSuggestion {
  // Add icon if missing
  const enhancedLabel = ensureIconInLabel(suggestion.label, suggestion.href, suggestion.category)

  return {
    ...suggestion,
    label: enhancedLabel
  }
}

/**
 * Get enhanced suggestion by key
 */
export function getEnhancedSuggestion(
  key: string,
  href: string,
  language: Language,
  options: Partial<NavigationSuggestion> = {}
): NavigationSuggestion {
  const template = ENHANCED_SUGGESTIONS[key]
  if (!template) {
    return enhanceSuggestion({
      label: options.label || key,
      href,
      description: options.description || '',
      ...options
    }, language)
  }

  const content = template[language]
  return enhanceSuggestion({
    label: content.label,
    href,
    description: content.description,
    ...options
  }, language)
}

/**
 * Create multiple enhanced suggestions
 */
export function createEnhancedSuggestions(
  configs: Array<{
    key: string
    href: string
    options?: Partial<NavigationSuggestion>
  }>,
  language: Language
): NavigationSuggestion[] {
  return configs.map(({ key, href, options = {} }) =>
    getEnhancedSuggestion(key, href, language, options)
  )
}