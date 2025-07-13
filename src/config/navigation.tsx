import React from 'react'

export interface NavigationItem {
  name: string
  href: string
  description?: string
  external?: boolean
  subItems?: NavigationItem[]
  highlight?: boolean
  isSection?: boolean
  badge?: string
  icon?: React.ReactNode
  isMultiColumn?: boolean
  dropdownAlignment?: 'left' | 'center' | 'right'
}

export const mainNavigation: NavigationItem[] = [
  {
    name: 'Über uns',
    href: '/about',
    description: 'Erfahre mehr über unsere Mission und Wirkung',
    subItems: [
      {
        name: 'REVAMPED-Zertifizierung',
        href: '/revamped',
        description: 'Unsere exklusive Auszeichnung für nachhaltige Computer-Builds'
      },
      {
        name: 'Wiki',
        href: 'https://revamp-it.ch/index.php/de/wiki-de',
        description: 'Unser gemeinsames Wissensportal',
        external: true
      }
    ]
  },
  {
    name: 'Dienstleistungen',
    href: '/services',
    description: 'Unsere Reparatur-, Aufbereitungs- und Recycling-Angebote',
    isMultiColumn: true,
    subItems: [
      {
        name: 'Hardware-Dienstleistungen',
        href: '#',
        isSection: true
      },
      {
        name: 'Computer-Reparatur & Upgrades',
        href: '/services/computer-repair-upgrades',
        description: 'Fachgerechte Reparaturen und Upgrades für alle Geräte'
      },
      {
        name: 'Datenrettung & Übertragung',
        href: '/services/data-recovery-transfer',
        description: 'Sichere Datenrettung und Übertragungsdienste'
      },
      {
        name: 'Hardware-Recycling',
        href: '/services/hardware-recycling',
        description: 'Verantwortungsvolles Recycling von IT-Geräten'
      },
      {
        name: 'Software-Lösungen',
        href: '#',
        isSection: true
      },
      {
        name: 'Webdesign & Entwicklung',
        href: '/services/web-design-development',
        description: 'Professionelle Webentwicklung mit Open Source-Technologien'
      },
      {
        name: 'Linux & Open Source',
        href: '/services/linux-open-source',
        description: 'Professionelle Linux-Installation und Support'
      },
      {
        name: 'Open Source-Lösungen',
        href: '/services/open-source-solutions',
        description: 'Open Source-Software-Implementierung und Support'
      },
      {
        name: 'Demnächst',
        href: '#',
        isSection: true
      },
      {
        name: 'Baue deinen Computer',
        href: '/services/build-your-computer',
        description: 'KI-gestützte, individuelle Computer-Builds mit globaler Teilebeschaffung',
        badge: 'Bald'
      },
      {
        name: 'Enterprise AI-Lösungen',
        href: '/services/enterprise-ai-solutions',
        description: 'Private, lokale KI-Systeme für Unternehmen',
        badge: 'Bald'
      },
      {
        name: 'Cloud-Infrastruktur',
        href: '/services/cloud-infrastructure',
        description: 'Nachhaltiges Cloud-Hosting und Infrastruktur',
        badge: 'Bald'
      },
      {
        name: 'Server-Management',
        href: '/services/server-management',
        description: 'Professionelle Server-Einrichtung und Wartung',
        badge: 'Bald'
      },
      {
        name: 'IoT-Lösungen',
        href: '/services/iot-solutions',
        description: 'Internet of Things mit Open Source-Hardware',
        badge: 'Bald'
      }
    ]
  },
  {
    name: 'Shop',
    href: 'https://www.revamp-it.ch/index.php/de/shop-de',
    description: 'Refurbished Elektronik kaufen',
    external: true
  },
  {
    name: 'Projekte',
    href: '/projects',
    description: 'Unsere aktuellen und vergangenen Initiativen',
    isMultiColumn: true,
    subItems: [
      {
        name: 'Software-Projekte',
        href: '#',
        isSection: true
      },
      {
        name: 'Kivitendo',
        href: '/projects/kivitendo',
        description: 'Open Source ERP-System-Implementierung'
      },
      {
        name: 'LTSP',
        href: '/projects/ltsp',
        description: 'Linux Terminal Server Project für effizientes Multi-User-Computing'
      },
      {
        name: 'Hardware-Projekte',
        href: '#',
        isSection: true
      },
      {
        name: 'Hardware',
        href: '/projects/hardware',
        description: 'Nachhaltige Hardware-Entwicklung und Upcycling'
      },
      {
        name: 'Community-Projekte',
        href: '#',
        isSection: true
      },
      {
        name: 'Compirat',
        href: '/projects/compirat',
        description: 'Digitale Inklusion und Computerkompetenz für alle'
      },
      {
        name: 'FreieComputer',
        href: '/projects/freiecomputer',
        description: 'Schweizer Label für Computer mit freier Software'
      },
      {
        name: 'Linuxola',
        href: '/projects/linuxola',
        description: 'Afrika mit der globalen digitalen Commons verbinden'
      }
    ]
  },
  {
    name: 'Workshops',
    href: '/workshops',
    description: 'Aktuelle Workshops und Lernangebote'
  },
  {
    name: 'Engagiere dich',
    href: '/get-involved',
    description: 'Freiwilligenarbeit und Unterstützung unserer Mission',
    isMultiColumn: true,
    dropdownAlignment: 'right',
    subItems: [
      {
        name: 'Individuelles Engagement',
        href: '#',
        isSection: true
      },
      {
        name: 'Freiwillige',
        href: '/get-involved/volunteer',
        description: 'Werde Teil unseres Freiwilligen-Teams'
      },
      {
        name: 'Technische Expert:innen',
        href: '/get-involved/technical-experts',
        description: 'Teile dein Fachwissen mit uns'
      },
      {
        name: 'Lernmöglichkeiten',
        href: '#',
        isSection: true
      },
      {
        name: 'Praktika',
        href: '/get-involved/internships',
        description: 'Sammle wertvolle Erfahrungen'
      },
      {
        name: 'Wiedereinstieg',
        href: '/get-involved/work-reintegration',
        description: 'Starte deine Karriere neu mit uns'
      },
      {
        name: 'Unterstützung für Organisationen',
        href: '#',
        isSection: true
      },
      {
        name: 'Partnerschaften',
        href: '/get-involved/partnerships',
        description: 'Werde Unternehmenspartner:in'
      },
      {
        name: 'Spenden',
        href: '/get-involved/donate',
        description: 'Unterstütze unsere Mission finanziell'
      }
    ]
  },
  {
    name: 'Blog',
    href: '/blog',
    description: 'Neuigkeiten, Ratgeber und Einblicke zu Nachhaltigkeit und Technik'
  },
  {
    name: 'Kontakt',
    href: '/contact',
    description: 'Kontaktiere unser Team',
    highlight: true
  }
]

export interface SocialLink {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export const socialLinks: SocialLink[] = []