/**
 * Community Configuration
 *
 * Centralized configuration for all community-related data.
 * SSOT for involvement options, testimonials, partner institutions, and all page content.
 */

import {
  Users, Code, GraduationCap, Handshake, Building2, Gift,
  Leaf, Heart, Globe, Wrench, BookOpen, Briefcase,
  Lightbulb, Cpu, Share2, Target, LucideIcon
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
    description: 'Schliessen Sie sich unserem Team engagierter Freiwilliger an. Keine Vorerfahrung erforderlich - bringen Sie einfach Ihr Interesse und Ihre Begeisterung für unsere Mission mit.',
    icon: Users,
    features: [
      'Mit Hardware und Software arbeiten',
      'Neue Fähigkeiten erlernen',
      'Einen Unterschied in Ihrer Gemeinschaft machen',
      'Gleichgesinnte Menschen treffen'
    ],
    cta: 'Freiwilligenarbeit beginnen',
    href: '/get-involved/volunteer'
  },
  {
    title: 'Technische Experten',
    description: 'Wenn Sie Erfahrung mit Open-Source-Software, Hardware oder Elektronik haben, würden wir uns freuen, Sie in unserem Team zu haben oder Ihnen bei der Umsetzung Ihrer eigenen Ideen zu helfen.',
    icon: Code,
    features: [
      'An sinnvollen Projekten arbeiten',
      'Ihre Expertise teilen',
      'Mit der Gemeinschaft zusammenarbeiten',
      'Neue Lösungen entwickeln'
    ],
    cta: 'Ihre Expertise teilen',
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
    description: 'Unterstützen Sie unsere Mission, Technologie nachhaltig und für alle zugänglich zu machen. Ihr Beitrag hilft uns, unsere wichtige Arbeit fortzusetzen.',
    icon: Gift,
    features: [
      'Nachhaltige Technologie unterstützen',
      'Helfen, Elektroschrott zu reduzieren',
      'Gemeinschaftsprogramme ermöglichen',
      'Technologie zugänglich machen'
    ],
    cta: 'Jetzt spenden',
    href: '/get-involved/donate'
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
    title: 'Schliessen Sie sich unserer Mission an',
    description: 'Werden Sie Teil einer Gemeinschaft, die Technologie nachhaltig und für alle zugänglich macht.'
  },
  coreValues: {
    title: 'Unsere Grundwerte',
    description: 'Bei Revamp-IT arbeiten wir daran, Technologie zugänglich und nachhaltig zu machen, während wir unsere Gemeinschaft aufbauen.'
  },
  cta: {
    title: 'Bereit anzufangen?',
    description: 'Haben Sie Fragen oder möchten Sie mehr erfahren? Wir sind da, um Ihnen beim nächsten Schritt zu helfen.',
    contactButton: 'Kontaktieren Sie uns',
    learnMoreButton: 'Mehr erfahren'
  }
} as const

// Volunteer Page Content
export const VOLUNTEER_PAGE: PageContent = {
  overview: {
    title: 'Warum Freiwilligenarbeit bei Revamp-IT?',
    content: 'Bei Revamp-IT glauben wir, dass jeder Zugang zu Technologie und den Fähigkeiten haben sollte, sie zu nutzen. Als Freiwilliger werden Sie Teil einer Gemeinschaft, die diese Vision verwirklicht. Ob Sie sich für Technologie, Nachhaltigkeit oder Gemeindedienst begeistern - in unserem Team ist Platz für Sie.'
  },
  benefits: [
    {
      title: 'Praktische Erfahrung',
      description: 'Arbeiten Sie direkt mit Hardware und Software und sammeln Sie praktische Erfahrungen in Technologie und Nachhaltigkeit.',
      icon: Wrench
    },
    {
      title: 'Neue Fähigkeiten erlernen',
      description: 'Entwickeln Sie technische und soziale Fähigkeiten durch unsere Schulungsprogramme und Mentoring-Möglichkeiten.',
      icon: BookOpen
    },
    {
      title: 'Gemeinschaftswirkung',
      description: 'Bewirken Sie einen echten Unterschied in Ihrer Gemeinschaft, indem Sie dabei helfen, Technologie für alle zugänglich zu machen.',
      icon: Heart
    },
    {
      title: 'Unserem Team beitreten',
      description: 'Werden Sie Teil eines vielfältigen und leidenschaftlichen Teams, das auf ein gemeinsames Ziel hinarbeitet.',
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
      content: 'Machen Sie sich keine Sorgen, wenn Sie keine technischen Erfahrungen haben. Wir bieten alle Schulungen, die Sie benötigen, und es gibt viele Möglichkeiten, über die technische Arbeit hinaus beizutragen. Was am wichtigsten ist, sind Ihre Begeisterung und Ihre Lernbereitschaft.'
    },
    {
      title: 'Ihre Wirkung',
      content: 'Als Freiwilliger werden Sie Teil einer Bewegung, die Technologie nachhaltiger und zugänglicher macht. Ihr Beitrag hilft uns, Elektroschrott zu reduzieren, Technologie für diejenigen bereitzustellen, die sie benötigen, und eine inklusivere digitale Zukunft für unsere Gemeinschaft aufzubauen.'
    }
  ]
}

// Donate Page Content
export const DONATE_PAGE: PageContent = {
  overview: {
    title: 'Warum spenden?',
    content: 'Ihre Unterstützung ermöglicht es uns, unsere Mission fortzusetzen, Technologie nachhaltig und zugänglich zu machen. Jede Spende, unabhängig von der Grösse, hilft uns, mehr Geräte aufzuarbeiten, mehr Gemeinschaften zu unterstützen und eine nachhaltigere Zukunft zu schaffen.'
  },
  benefits: [
    {
      title: 'Umweltauswirkungen',
      description: 'Helfen Sie, Elektroschrott zu reduzieren und nachhaltige Technologiepraktiken zu fördern.',
      icon: Leaf
    },
    {
      title: 'Gemeinschaftsunterstützung',
      description: 'Ermöglichen Sie Zugang zu Technologie für diejenigen, die sie am meisten benötigen.',
      icon: Heart
    },
    {
      title: 'Bildung & Ausbildung',
      description: 'Unterstützen Sie unsere Bildungsprogramme und Fähigkeitsentwicklungsinitiativen.',
      icon: GraduationCap
    },
    {
      title: 'Nachhaltige Zukunft',
      description: 'Tragen Sie zum Aufbau eines nachhaltigeren Technologie-Ökosystems bei.',
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
      title: 'Ihre Spendenwirkung',
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
      content: 'Wir verpflichten uns, Ihre Spenden effektiv und transparent zu verwenden. Sie erhalten regelmässige Updates darüber, wie Ihr Beitrag eine Wirkung erzielt, und wir führen klare Finanzunterlagen, die zur Überprüfung zur Verfügung stehen.'
    },
    {
      title: 'Vielen Dank',
      content: 'Ihre Grosszügigkeit macht unsere Arbeit möglich. Gemeinsam können wir eine nachhaltigere und zugänglichere Technologiezukunft für alle schaffen.'
    }
  ]
}

// Technical Experts Page Content
export const TECHNICAL_EXPERTS_PAGE: PageContent = {
  overview: {
    title: 'Treten Sie unserem technischen Team bei',
    content: 'Wir suchen immer technische Experten, die unsere Leidenschaft für nachhaltige Technologie und Open-Source-Lösungen teilen. Ob Sie Softwareentwickler, Hardware-Ingenieur oder Systemadministrator sind - Ihre Expertise kann uns dabei helfen, eine grössere Wirkung zu erzielen.'
  },
  benefits: [
    {
      title: 'Open-Source-Entwicklung',
      description: 'Tragen Sie zu unseren Open-Source-Projekten bei und helfen Sie, unsere Software-Lösungen zu verbessern.',
      icon: Code
    },
    {
      title: 'Hardware-Innovation',
      description: 'Arbeiten Sie an Hardware-Projekten, die Technologie nachhaltiger und zugänglicher machen.',
      icon: Cpu
    },
    {
      title: 'Wissensaustausch',
      description: 'Teilen Sie Ihr Fachwissen durch Workshops, Dokumentation und Mentoring.',
      icon: Users
    },
    {
      title: 'Projektleitung',
      description: 'Leiten Sie technische Initiativen und helfen Sie, die Zukunft nachhaltiger Technologie zu gestalten.',
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
        { text: 'Arbeiten Sie an sinnvollen Projekten, die eine echte Wirkung haben' },
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
      content: 'Wir glauben an die Kraft von Open-Source-Software und -Hardware. Als technischer Experte haben Sie die Möglichkeit, zu Open-Source-Projekten beizutragen und dabei zu helfen, Technologie für alle zugänglicher zu machen.'
    }
  ]
}

// Internships Page Content
export const INTERNSHIPS_PAGE: PageContent = {
  overview: {
    title: 'Über unser Praktikumsprogramm',
    content: 'Unser Praktikumsprogramm bietet eine einzigartige Gelegenheit, praktische Erfahrungen in nachhaltiger Technologie zu sammeln und gleichzeitig zu sinnvollen Projekten beizutragen. Ob Sie ein Student sind, der sein Studium ergänzen möchte, oder jemand, der in die Technologiebranche wechseln möchte - unser Programm bietet wertvolle Lern- und Wachstumsmöglichkeiten.'
  },
  benefits: [
    {
      title: 'Praktische Erfahrung',
      description: 'Arbeiten Sie an echten Projekten, die einen Unterschied in der Gemeinschaft machen.',
      icon: Briefcase
    },
    {
      title: 'Berufliche Entwicklung',
      description: 'Lernen Sie von erfahrenen Mentoren und entwickeln Sie wertvolle Fähigkeiten.',
      icon: GraduationCap
    },
    {
      title: 'Teamzusammenarbeit',
      description: 'Arbeiten Sie mit einem vielfältigen Team von Fachleuten und Freiwilligen.',
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
      title: 'Was Sie lernen werden',
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
      content: 'Wir verstehen, dass Studenten und Berufstätige unterschiedliche Zeitpläne haben. Wir bieten flexible Vereinbarungen, um Ihren akademischen oder beruflichen Verpflichtungen gerecht zu werden und gleichzeitig sicherzustellen, dass Sie das Beste aus Ihrer Praktikumserfahrung herausholen.'
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
      description: 'Verstärken Sie die Wirkung Ihrer Organisation durch gemeinsame Initiativen.',
      icon: Target
    },
    {
      title: 'Globales Netzwerk',
      description: 'Verbinden Sie sich mit gleichgesinnten Organisationen und erweitern Sie Ihre Reichweite.',
      icon: Globe
    },
    {
      title: 'Ressourcenteilung',
      description: 'Zugang zu geteilten Ressourcen und Expertise für grössere Effizienz.',
      icon: Share2
    },
    {
      title: 'Strategische Zusammenarbeit',
      description: 'Entwickeln Sie innovative Lösungen durch gemeinsame Anstrengungen.',
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
      content: 'Wir verstehen, dass jede Organisation einzigartige Bedürfnisse und Ziele hat. Unsere Partnerschaftsprogramme sind darauf zugeschnitten, sich an den Zielen Ihrer Organisation auszurichten und gleichzeitig die Wirkung unserer gemeinsamen Bemühungen zu maximieren.'
    }
  ]
}

// Work Reintegration Page Content
export const WORK_REINTEGRATION_PAGE: PageContent = {
  overview: {
    title: 'Über unser Programm',
    content: 'Unser Arbeitsreintegrationsprogramm ist darauf ausgelegt, Menschen dabei zu helfen, ihre Karriere in einem unterstützenden und verständnisvollen Umfeld wieder aufzubauen. Wir konzentrieren uns darauf, praktische Erfahrungen in Technologie und Nachhaltigkeit zu vermitteln und Ihnen dabei zu helfen, die Fähigkeiten und das Selbstvertrauen zu entwickeln, die für eine langfristige Beschäftigung erforderlich sind.'
  },
  benefits: [
    {
      title: 'Fähigkeitsentwicklung',
      description: 'Lernen Sie praktische Fähigkeiten in Technologie und Nachhaltigkeit.',
      icon: GraduationCap
    },
    {
      title: 'Berufliches Wachstum',
      description: 'Erweitern Sie Ihren Lebenslauf mit realer Erfahrung.',
      icon: Briefcase
    },
    {
      title: 'Unterstützendes Umfeld',
      description: 'Arbeiten Sie in einem unterstützenden und verständnisvollen Team.',
      icon: Users
    },
    {
      title: 'Sinnvolle Arbeit',
      description: 'Tragen Sie zu Projekten bei, die einen Unterschied machen.',
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
      title: 'Was Sie lernen werden',
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
      content: 'Wir verstehen, dass jeder Weg einzigartig ist. Unser Programm ist flexibel und kann auf Ihre spezifischen Bedürfnisse und Ziele zugeschnitten werden. Wir arbeiten mit Ihnen zusammen, um einen Plan zu erstellen, der Ihre erfolgreiche Wiedereingliederung in das Arbeitsleben unterstützt.'
    },
    {
      title: 'Vertraulichkeit',
      content: 'Wir wahren während des gesamten Programms strenge Vertraulichkeit. Ihre Privatsphäre und Würde sind unsere obersten Prioritäten, und wir stellen sicher, dass alle Informationen mit äusserster Sorgfalt und Respekt behandelt werden.'
    }
  ]
}
