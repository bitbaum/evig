/**
 * Community Configuration
 *
 * Centralized configuration for all community-related data.
 * SSOT for involvement options, testimonials, partner institutions, and all page content.
 */

import {
  Users, Code, GraduationCap, Handshake, Building2, Gift,
  Leaf, Heart, Globe, Wrench, BookOpen, Briefcase,
  Lightbulb, Cpu, Share2, Target, Vote, LucideIcon
} from 'lucide-react'

// Types
export interface InvolvementOption {
  title: string
  description: string
  icon: LucideIcon
  features: string[]
  cta: string
  href: string
}

export interface Testimonial {
  quote: string
  author: string
  role: string
}

export interface PartnerInstitution {
  name: string
  url: string
}

export interface BenefitItem {
  title: string
  description: string
  icon: LucideIcon
}

export interface ListItem {
  text: string
}

export interface PageContent {
  overview: {
    title: string
    content: string
  }
  benefits?: BenefitItem[]
  sections?: {
    title: string
    items: ListItem[]
  }[]
  callouts?: {
    title: string
    content: string
  }[]
}

// Involvement Options Configuration
export const INVOLVEMENT_OPTIONS: InvolvementOption[] = [
  {
    title: 'Freiwilligenarbeit',
    description: 'Schliesse dich unserem Team engagierter Freiwilliger an. Keine Vorerfahrung erforderlich - bring einfach dein Interesse und deine Begeisterung für unsere Mission mit.',
    icon: Users,
    features: [
      'Mit Hardware und Software arbeiten',
      'Neue Fähigkeiten erlernen',
      'Einen Unterschied in deiner Gemeinschaft machen',
      'Gleichgesinnte Menschen treffen'
    ],
    cta: 'Freiwilligenarbeit beginnen',
    href: '/get-involved/volunteer'
  },
  {
    title: 'Technische Experten',
    description: 'Wenn du Erfahrung mit Open-Source-Software, Hardware oder Elektronik hast, würden wir uns freuen, dich in unserem Team zu haben oder dir bei der Umsetzung deiner eigenen Ideen zu helfen.',
    icon: Code,
    features: [
      'An sinnvollen Projekten arbeiten',
      'Deine Expertise teilen',
      'Mit der Gemeinschaft zusammenarbeiten',
      'Neue Lösungen entwickeln'
    ],
    cta: 'Deine Expertise teilen',
    href: '/get-involved/technical-experts'
  },
  {
    title: 'Praktika',
    description: 'Wir bieten Praktikumsmöglichkeiten für diejenigen, die Erfahrungen in Technologie und Nachhaltigkeit sammeln möchten.',
    icon: GraduationCap,
    features: [
      'Praktische Erfahrung',
      'Berufliche Entwicklung',
      'Mentoring-Möglichkeiten',
      'Flexible Vereinbarungen'
    ],
    cta: 'Für Praktikum bewerben',
    href: '/get-involved/internships'
  },
  {
    title: 'Arbeitsintegration',
    description: 'Wir arbeiten mit Institutionen zusammen, um Arbeitsintegrations-möglichkeiten für Menschen zu bieten, die wieder ins Berufsleben einsteigen möchten.',
    icon: Handshake,
    features: [
      'Fähigkeitsentwicklung',
      'Soziale Integration',
      'Professionelle Unterstützung',
      'Sinnvolle Arbeit'
    ],
    cta: 'Mehr erfahren',
    href: '/get-involved/work-reintegration'
  },
  {
    title: 'Partnerschaften',
    description: 'Wir arbeiten mit Bildungseinrichtungen und Organisationen zusammen, um sinnvolle Programme und Möglichkeiten zu schaffen.',
    icon: Building2,
    features: [
      'Bildungsprogramme',
      'Praktikumsplätze',
      'Gemeinschaftsinitiativen',
      'Nachhaltige Lösungen'
    ],
    cta: 'Partner werden',
    href: '/get-involved/partnerships'
  },
  {
    title: 'Spenden',
    description: 'Unterstütze unsere Mission, Technologie nachhaltig und für alle zugänglich zu machen. Dein Beitrag hilft uns, unsere Arbeit fortzusetzen.',
    icon: Gift,
    features: [
      'Nachhaltige Technologie unterstützen',
      'Elektroschrott reduzieren helfen',
      'Community-Programme ermöglichen',
      'Technologie zugänglich machen'
    ],
    cta: 'Jetzt spenden',
    href: '/get-involved/donate'
  },
  {
    title: 'Vereinsmitgliedschaft',
    description: 'Werde offizielles Mitglied des Vereins und übernimm Mitverantwortung. Mitglieder stimmen über wichtige Entscheidungen ab und sind Teil der Trägerschaft des Vereins.',
    icon: Vote,
    features: [
      'Stimmrecht bei Vereinsentscheiden',
      'Teil der offiziellen Mitgliederliste',
      'Jahresbeitrag CHF 50 (ermässigt CHF 20)',
      'Finanzielle Unterstützung der Mission'
    ],
    cta: 'Mitglied werden',
    href: '/mitglied-werden'
  }
]

// Testimonials Configuration
export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "As a refugee, Revamp-IT gave me the opportunity to work with them. I learn a lot and have the freedom to develop skills aligned with my goals. Now I write code and can learn anything I find interesting, as everyone is willing to share knowledge. This is a real community.",
    author: "G.",
    role: "Freiwilliger"
  }
]

// Partner Institutions Configuration
export const PARTNER_INSTITUTIONS: PartnerInstitution[] = [
  {
    name: 'Verein für berufliche und soziale Integration Bezirk Uster',
    url: 'https://www.integration-uster.ch'
  },
  {
    name: 'Arbeitsintegrationsstelle der Gemeinde Rüti',
    url: 'https://www.rueti.ch'
  },
  {
    name: 'HEKS',
    url: 'https://www.heks.ch/'
  },
  {
    name: 'AOZ (Asylorganisation Zürich)',
    url: 'https://www.stadt-zuerich.ch/aoz/de/index.html'
  }
]

// Get Involved Page Configuration
export const GET_INVOLVED_CONFIG = {
  hero: {
    title: 'Schliesse dich unserer Mission an',
    description: 'Werde Teil einer Gemeinschaft, die Technologie nachhaltig und für alle zugänglich macht.'
  },
  coreValues: {
    title: 'Unsere Grundwerte',
    description: 'Bei Revamp-IT arbeiten wir daran, Technologie zugänglich und nachhaltig zu machen, während wir unsere Gemeinschaft aufbauen.'
  },
  cta: {
    title: 'Bereit anzufangen?',
    description: 'Hast du Fragen oder möchtest du mehr erfahren? Wir sind da, um dir beim nächsten Schritt zu helfen.',
    contactButton: 'Kontaktiere uns',
    learnMoreButton: 'Mehr erfahren'
  }
} as const

// Volunteer Page Content
export const VOLUNTEER_PAGE: PageContent = {
  overview: {
    title: 'Warum Freiwilligenarbeit bei Revamp-IT?',
    content: 'Bei Revamp-IT glauben wir, dass jeder Zugang zu Technologie und den Fähigkeiten haben sollte, sie zu nutzen. Als Freiwillige/r wirst du Teil einer Gemeinschaft, die diese Vision verwirklicht. Ob du dich für Technologie, Nachhaltigkeit oder Gemeindedienst begeisterst - in unserem Team ist Platz für dich.'
  },
  benefits: [
    {
      title: 'Praktische Erfahrung',
      description: 'Arbeite direkt mit Hardware und Software und sammle praktische Erfahrungen in Technologie und Nachhaltigkeit.',
      icon: Wrench
    },
    {
      title: 'Neue Fähigkeiten erlernen',
      description: 'Entwickle technische und soziale Fähigkeiten durch unsere Schulungsprogramme und Mentoring-Möglichkeiten.',
      icon: BookOpen
    },
    {
      title: 'Gemeinschaftswirkung',
      description: 'Bewirke einen echten Unterschied in deiner Gemeinschaft, indem du dabei hilfst, Technologie für alle zugänglich zu machen.',
      icon: Heart
    },
    {
      title: 'Unserem Team beitreten',
      description: 'Werde Teil eines vielfältigen und leidenschaftlichen Teams, das auf ein gemeinsames Ziel hinarbeitet.',
      icon: Users
    }
  ],
  sections: [
    {
      title: 'Freiwilligenrollen',
      items: [
        { text: 'Bei der Aufarbeitung und Reparatur von Computern helfen' },
        { text: 'In unseren Workshops und Schulungsprogrammen mithelfen' },
        { text: 'Unsere Gemeinschaftsinitiativen unterstützen' },
        { text: 'Zur Dokumentation und Wissensdatenbank beitragen' },
        { text: 'Bei administrativen Aufgaben und Veranstaltungsorganisation helfen' }
      ]
    },
    {
      title: 'Zeitaufwand',
      items: [
        { text: 'Flexible Terminplanungsoptionen' },
        { text: 'Regelmässige und gelegentliche Möglichkeiten' },
        { text: 'Remote- und Vor-Ort-Optionen' }
      ]
    }
  ],
  callouts: [
    {
      title: 'Keine Erfahrung erforderlich',
      content: 'Mach dir keine Sorgen, wenn du keine technischen Erfahrungen hast. Wir bieten alle Schulungen, die du benötigst, und es gibt viele Möglichkeiten, über die technische Arbeit hinaus beizutragen. Was am wichtigsten ist, sind deine Begeisterung und deine Lernbereitschaft.'
    },
    {
      title: 'Deine Wirkung',
      content: 'Als Freiwillige/r wirst du Teil einer Bewegung, die Technologie nachhaltiger und zugänglicher macht. Dein Beitrag hilft uns, Elektroschrott zu reduzieren, Technologie für diejenigen bereitzustellen, die sie benötigen, und eine inklusivere digitale Zukunft für unsere Gemeinschaft aufzubauen.'
    }
  ]
}

// Donate Page Content
export const DONATE_PAGE: PageContent = {
  overview: {
    title: 'Warum spenden?',
    content: 'Deine Unterstützung ermöglicht es uns, unsere Mission fortzusetzen, Technologie nachhaltig und zugänglich zu machen. Jede Spende, unabhängig von der Grösse, hilft uns, mehr Geräte aufzuarbeiten, mehr Gemeinschaften zu unterstützen und eine nachhaltigere Zukunft zu schaffen.'
  },
  benefits: [
    {
      title: 'Umweltauswirkungen',
      description: 'Helfen Sie, Elektroschrott zu reduzieren und nachhaltige Technologiepraktiken zu fördern.',
      icon: Leaf
    },
    {
      title: 'Gemeinschaftsunterstützung',
      description: 'Ermögliche Zugang zu Technologie für diejenigen, die sie am meisten benötigen.',
      icon: Heart
    },
    {
      title: 'Bildung & Ausbildung',
      description: 'Unterstütze unsere Bildungsprogramme und Fähigkeitsentwicklungsinitiativen.',
      icon: GraduationCap
    },
    {
      title: 'Nachhaltige Zukunft',
      description: 'Trage zum Aufbau eines nachhaltigeren Technologie-Ökosystems bei.',
      icon: Globe
    }
  ],
  sections: [
    {
      title: 'Spendmöglichkeiten',
      items: [
        { text: 'Einmalige Spenden' },
        { text: 'Monatliche wiederkehrende Spenden' },
        { text: 'Unternehmens-Matching-Programme' },
        { text: 'Sachspenden von Technologie' },
        { text: 'Vermächtnisspenden' }
      ]
    },
    {
      title: 'Deine Spendenwirkung',
      items: [
        { text: 'Technologie-Aufarbeitung und -Verteilung' },
        { text: 'Bildungsprogramme und Workshops' },
        { text: 'Öffentlichkeitsarbeit in der Gemeinschaft' },
        { text: 'Forschung und Entwicklung' },
        { text: 'Operative Unterstützung' }
      ]
    },
    {
      title: 'Unternehmensspenden',
      items: [
        { text: 'Mitarbeiter-Matching-Programme' },
        { text: 'Unternehmens-Sponsoring-Möglichkeiten' },
        { text: 'Technologie-Spendenprogramme' },
        { text: 'Freiwilligen-Engagement-Initiativen' }
      ]
    }
  ],
  callouts: [
    {
      title: 'Transparenz und Verantwortlichkeit',
      content: 'Wir verpflichten uns, deine Spenden effektiv und transparent zu verwenden. Du erhältst regelmässige Updates darüber, wie dein Beitrag eine Wirkung erzielt, und wir führen klare Finanzunterlagen, die zur Überprüfung zur Verfügung stehen.'
    },
    {
      title: 'Vielen Dank',
      content: 'Deine Grosszügigkeit macht unsere Arbeit möglich. Gemeinsam können wir eine nachhaltigere und zugänglichere Technologiezukunft für alle schaffen.'
    }
  ]
}

// Technical Experts Page Content
export const TECHNICAL_EXPERTS_PAGE: PageContent = {
  overview: {
    title: 'Tritt unserem technischen Team bei',
    content: 'Wir suchen immer technische Experten, die unsere Leidenschaft für nachhaltige Technologie und Open-Source-Lösungen teilen. Ob du Softwareentwickler, Hardware-Ingenieur oder Systemadministrator bist - deine Expertise kann uns dabei helfen, eine grössere Wirkung zu erzielen.'
  },
  benefits: [
    {
      title: 'Open-Source-Entwicklung',
      description: 'Trage zu unseren Open-Source-Projekten bei und hilf, unsere Software-Lösungen zu verbessern.',
      icon: Code
    },
    {
      title: 'Hardware-Innovation',
      description: 'Arbeite an Hardware-Projekten, die Technologie nachhaltiger und zugänglicher machen.',
      icon: Cpu
    },
    {
      title: 'Wissensaustausch',
      description: 'Teile dein Fachwissen durch Workshops, Dokumentation und Mentoring.',
      icon: Users
    },
    {
      title: 'Projektleitung',
      description: 'Leite technische Initiativen und hilf, die Zukunft nachhaltiger Technologie zu gestalten.',
      icon: Lightbulb
    }
  ],
  sections: [
    {
      title: 'Fachbereiche',
      items: [
        { text: 'Softwareentwicklung (Python, JavaScript, Linux)' },
        { text: 'Hardware-Entwicklung und -Reparatur' },
        { text: 'Systemadministration' },
        { text: 'Netzwerk-Engineering' },
        { text: 'Datenbankmanagement' },
        { text: 'Sicherheit und Datenschutz' },
        { text: 'Technische Dokumentation' }
      ]
    },
    {
      title: 'Aktuelle Projekte',
      items: [
        { text: 'Entwicklung von Open-Source-Buchhaltungssoftware' },
        { text: 'Automatisierung der Hardware-Aufarbeitung' },
        { text: 'Entwicklung von Bildungsplattformen' },
        { text: 'Systemadministrations-Tools' },
        { text: 'Dokumentation und Wissensdatenbank' }
      ]
    },
    {
      title: 'Vorteile der Mitgliedschaft',
      items: [
        { text: 'Arbeite an sinnvollen Projekten, die eine echte Wirkung haben' },
        { text: 'Zusammenarbeit mit einem vielfältigen Expertenteam' },
        { text: 'Zugang zu unserer Werkstatt und unseren Testeinrichtungen' },
        { text: 'Möglichkeiten zur Führung und Betreuung anderer' },
        { text: 'Flexible Beitragsmöglichkeiten' }
      ]
    }
  ],
  callouts: [
    {
      title: 'Open-Source-Fokus',
      content: 'Wir glauben an die Kraft von Open-Source-Software und -Hardware. Als technischer Experte hast du die Möglichkeit, zu Open-Source-Projekten beizutragen und dabei zu helfen, Technologie für alle zugänglicher zu machen.'
    }
  ]
}

// Internships Page Content
export const INTERNSHIPS_PAGE: PageContent = {
  overview: {
    title: 'Über unser Praktikumsprogramm',
    content: 'Unser Praktikumsprogramm bietet eine einzigartige Gelegenheit, praktische Erfahrungen in nachhaltiger Technologie zu sammeln und gleichzeitig zu sinnvollen Projekten beizutragen. Ob du ein Student bist, der sein Studium ergänzen möchte, oder jemand, der in die Technologiebranche wechseln möchte - unser Programm bietet wertvolle Lern- und Wachstumsmöglichkeiten.'
  },
  benefits: [
    {
      title: 'Praktische Erfahrung',
      description: 'Arbeite an echten Projekten, die einen Unterschied in der Gemeinschaft machen.',
      icon: Briefcase
    },
    {
      title: 'Berufliche Entwicklung',
      description: 'Lerne von erfahrenen Mentoren und entwickle wertvolle Fähigkeiten.',
      icon: GraduationCap
    },
    {
      title: 'Teamzusammenarbeit',
      description: 'Arbeite mit einem vielfältigen Team von Fachleuten und Freiwilligen.',
      icon: Users
    },
    {
      title: 'Lernmöglichkeiten',
      description: 'Zugang zu Schulungsressourcen und Workshops.',
      icon: BookOpen
    }
  ],
  sections: [
    {
      title: 'Verfügbare Positionen',
      items: [
        { text: 'Hardware-Aufarbeitung und -Reparatur' },
        { text: 'Softwareentwicklung' },
        { text: 'Systemadministration' },
        { text: 'Projektmanagement' },
        { text: 'Gemeinschaftsarbeit' },
        { text: 'Technische Dokumentation' }
      ]
    },
    {
      title: 'Was du lernen wirst',
      items: [
        { text: 'Hardware- und Software-Fehlerbehebung' },
        { text: 'Projektmanagement und Zusammenarbeit' },
        { text: 'Technische Dokumentation und Kommunikation' },
        { text: 'Gemeinschaftsengagement und Öffentlichkeitsarbeit' },
        { text: 'Nachhaltige Technologiepraktiken' }
      ]
    },
    {
      title: 'Anforderungen',
      items: [
        { text: 'In relevanten Studien eingeschrieben sein oder diese abgeschlossen haben' },
        { text: 'Leidenschaft für Technologie und Nachhaltigkeit haben' },
        { text: 'Sich für die Programmdauer verpflichten können' },
        { text: 'Grundlegende Computerfähigkeiten haben' },
        { text: 'Bereit sein zu lernen und beizutragen' }
      ]
    }
  ],
  callouts: [
    {
      title: 'Flexible Vereinbarungen',
      content: 'Wir verstehen, dass Studenten und Berufstätige unterschiedliche Zeitpläne haben. Wir bieten flexible Vereinbarungen, um deinen akademischen oder beruflichen Verpflichtungen gerecht zu werden und gleichzeitig sicherzustellen, dass du das Beste aus deiner Praktikumserfahrung herausholst.'
    }
  ]
}

// Partnerships Page Content
export const PARTNERSHIPS_PAGE: PageContent = {
  overview: {
    title: 'Warum mit uns zusammenarbeiten?',
    content: 'Bei Revamp-IT glauben wir an die Kraft der Zusammenarbeit, um sinnvolle Veränderungen zu bewirken. Unsere Partnerschaften kombinieren Expertise, Ressourcen und gemeinsame Werte, um nachhaltige Technologielösungen zu schaffen, die Gemeinschaften und der Umwelt zugutekommen.'
  },
  benefits: [
    {
      title: 'Geteilte Wirkung',
      description: 'Verstärke die Wirkung deiner Organisation durch gemeinsame Initiativen.',
      icon: Target
    },
    {
      title: 'Globales Netzwerk',
      description: 'Verbinde dich mit gleichgesinnten Organisationen und erweitere deine Reichweite.',
      icon: Globe
    },
    {
      title: 'Ressourcenteilung',
      description: 'Zugang zu geteilten Ressourcen und Expertise für grössere Effizienz.',
      icon: Share2
    },
    {
      title: 'Strategische Zusammenarbeit',
      description: 'Entwickle innovative Lösungen durch gemeinsame Anstrengungen.',
      icon: Users
    }
  ],
  sections: [
    {
      title: 'Partnerschaftsmodelle',
      items: [
        { text: 'Unternehmenspartnerschaften' },
        { text: 'Zusammenarbeit mit Bildungseinrichtungen' },
        { text: 'Allianzen mit gemeinnützigen Organisationen' },
        { text: 'Technologieanbieter-Partnerschaften' },
        { text: 'Zusammenarbeit mit Gemeinschaftsorganisationen' }
      ]
    },
    {
      title: 'Zusammenarbeitsbereiche',
      items: [
        { text: 'Technologie-Aufarbeitungsprogramme' },
        { text: 'Bildungsinitiativen' },
        { text: 'Forschung und Entwicklung' },
        { text: 'Gemeinschafts-Öffentlichkeitsprogramme' },
        { text: 'Nachhaltigkeitsprojekte' }
      ]
    }
  ],
  callouts: [
    {
      title: 'Massgeschneiderte Partnerschaftsprogramme',
      content: 'Wir verstehen, dass jede Organisation einzigartige Bedürfnisse und Ziele hat. Unsere Partnerschaftsprogramme sind darauf zugeschnitten, sich an den Zielen eurer Organisation auszurichten und gleichzeitig die Wirkung unserer gemeinsamen Bemühungen zu maximieren.'
    }
  ]
}

// Work Reintegration Page Content
export const WORK_REINTEGRATION_PAGE: PageContent = {
  overview: {
    title: 'Über unser Programm',
    content: 'Unser Arbeitsreintegrationsprogramm ist darauf ausgelegt, Menschen dabei zu helfen, ihre Karriere in einem unterstützenden und verständnisvollen Umfeld wieder aufzubauen. Wir konzentrieren uns darauf, praktische Erfahrungen in Technologie und Nachhaltigkeit zu vermitteln und dir dabei zu helfen, die Fähigkeiten und das Selbstvertrauen zu entwickeln, die für eine langfristige Beschäftigung erforderlich sind.'
  },
  benefits: [
    {
      title: 'Fähigkeitsentwicklung',
      description: 'Lerne praktische Fähigkeiten in Technologie und Nachhaltigkeit.',
      icon: GraduationCap
    },
    {
      title: 'Berufliches Wachstum',
      description: 'Erweitere deinen Lebenslauf mit realer Erfahrung.',
      icon: Briefcase
    },
    {
      title: 'Unterstützendes Umfeld',
      description: 'Arbeite in einem unterstützenden und verständnisvollen Team.',
      icon: Users
    },
    {
      title: 'Sinnvolle Arbeit',
      description: 'Trage zu Projekten bei, die einen Unterschied machen.',
      icon: Heart
    }
  ],
  sections: [
    {
      title: 'Programmmerkmale',
      items: [
        { text: 'Strukturierte Arbeitserfahrung in der Technologie' },
        { text: 'Berufliche Entwicklung und Ausbildung' },
        { text: 'Individuelle Unterstützung und Betreuung' },
        { text: 'Flexible Terminplanungsoptionen' },
        { text: 'Schrittweise Arbeitsbelastungserhöhung' }
      ]
    },
    {
      title: 'Was du lernen wirst',
      items: [
        { text: 'Computer-Hardware und -Software' },
        { text: 'Technische Fehlerbehebung' },
        { text: 'Kundenservice' },
        { text: 'Teamzusammenarbeit' },
        { text: 'Projektmanagement' }
      ]
    },
    {
      title: 'Unterstützungsdienstleistungen',
      items: [
        { text: 'Regelmässige Check-ins und Fortschrittsüberprüfungen' },
        { text: 'Zugang zu Beratungsdienstleistungen' },
        { text: 'Arbeitsplatzanpassungen' },
        { text: 'Karriereführung und -planung' },
        { text: 'Networking-Möglichkeiten' }
      ]
    }
  ],
  callouts: [
    {
      title: 'Individualisierter Ansatz',
      content: 'Wir verstehen, dass jeder Weg einzigartig ist. Unser Programm ist flexibel und kann auf deine spezifischen Bedürfnisse und Ziele zugeschnitten werden. Wir arbeiten mit dir zusammen, um einen Plan zu erstellen, der deine erfolgreiche Wiedereingliederung in das Arbeitsleben unterstützt.'
    },
    {
      title: 'Vertraulichkeit',
      content: 'Wir wahren während des gesamten Programms strenge Vertraulichkeit. Deine Privatsphäre und Würde sind unsere obersten Prioritäten, und wir stellen sicher, dass alle Informationen mit äusserster Sorgfalt und Respekt behandelt werden.'
    }
  ]
}
