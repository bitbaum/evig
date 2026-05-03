/**
 * About Page Data Layer
 *
 * Presentation config for about page.
 * Numbers sourced from org-numbers SSOT.
 *
 * Last reconciled: 2026-02-16
 */

import { getDefaultValue, getDefaultNumeric } from '@/lib/org-numbers.defaults'
import { ORG } from '@/config/org'

export interface AboutMetric {
  value: string
  label: string
}

export interface AboutMetricGroup {
  title: string
  metrics: AboutMetric[]
}

export interface AboutCard {
  title: string
  description: string
  features?: string[]
}

export interface AboutSection {
  title: string
  description?: string
  backgroundColor: 'white' | 'gray'
  layout: 'single' | 'grid-2' | 'grid-3'
  cards: AboutCard[]
}

export interface AboutHero {
  title: string
  description: string
  backgroundColor: string
  ctas: Array<{
    text: string
    href: string
    variant: 'primary' | 'outline'
  }>
}

export interface AboutPageConfig {
  hero: AboutHero
  sections: AboutSection[]
  metrics: AboutMetricGroup[]
  image: {
    src: string
    alt: string
  }
  cta: {
    title: string
    description: string
    buttonText: string
    href: string
  }
}

export const aboutConfig: AboutPageConfig = {
  hero: {
    title: 'Technik ein zweites Leben geben',
    description: `Seit über ${new Date().getFullYear() - getDefaultNumeric('founding_year')} Jahren setzen wir uns gegen die vorschnelle Ausmusterung von Computern ein und fördern nachhaltige IT-Praktiken.`,
    backgroundColor: 'bg-gradient-to-r from-primary-600 to-primary-800',
    ctas: [
      {
        text: 'Mitmachen',
        href: '/get-involved',
        variant: 'primary'
      },
      {
        text: 'Unsere Wirkung',
        href: '/about/impact',
        variant: 'outline'
      },
      {
        text: 'FAQ',
        href: '/faq',
        variant: 'outline'
      }
    ]
  },
  sections: [
    {
      title: 'Unsere Mission',
      description: 'Seit 2003 verändern wir den Umgang mit Technik nachhaltig',
      backgroundColor: 'white',
      layout: 'single',
      cards: [
        {
          title: '10 Jahre sind das Minimum',
          description: `Bei ${ORG.name} glauben wir an das Motto "10 Jahre sind das Minimum für ein Velo – und für einen Laptop auch!" Als gemeinnütziger Verein verändern wir seit 2003 den Umgang mit Technik. Unsere Mission ist klar: Die Lebensdauer von IT-Geräten verlängern und Elektroschrott durch Reparatur, Wiederaufbereitung und nachhaltige Praktiken reduzieren.`,
          features: [
            'Gemeinnütziger Verein seit 2003',
            'Nachhaltige IT-Lösungen für alle',
            'Reparatur statt Entsorgung',
            'Offene Türen für die Community'
          ]
        }
      ]
    },
    {
      title: 'Unsere Wirkung',
      description: 'Drei Bereiche, die unsere Arbeit prägen',
      backgroundColor: 'gray',
      layout: 'grid-3',
      cards: [
        {
          title: 'Hardware-Recycling',
          description: 'Wir reparieren und überholen IT-Geräte jeden Alters und schenken ihnen ein zweites Leben. So reduzieren wir Elektroschrott und ermöglichen Zugang zu Technik für alle.',
          features: [
            'Von alten MacBooks bis zu Vintage-Computern',
            'Jedes Gerät verdient eine zweite Chance',
            'Reduzierung von Elektroschrott',
            'Zugang zu Technik für alle'
          ]
        },
        {
          title: 'Open Source-Software',
          description: 'Wir setzen ausschliesslich auf Linux und andere Open‑Source‑Lösungen. Diese Technologien halten ältere Geräte effizient am Laufen und bieten Sicherheit durch Kontrolle über das eigene System.',
          features: [
            'Linux und Open Source-Lösungen',
            'Keine Installation von Windows oder macOS',
            'Sicherheit durch Kontrolle',
            'Workshops zu nachhaltiger IT',
            'Praxisnahes Wissen vermitteln'
          ]
        },
        {
          title: 'Gemeinschaft & Soziales',
          description: 'Wir schaffen sinnvolle Arbeitsplätze für Menschen, die es auf dem regulären Arbeitsmarkt schwer haben. Mit unserem Tauschsystem kann man Dienstleistungen gegen Technik tauschen.',
          features: [
            'Arbeitsplätze schaffen',
            'Tauschsystem für Technik',
            'Hosting für Schweizer KMU',
            'Daten bleiben in der Schweiz'
          ]
        }
      ]
    },
    {
      title: 'Zahlen & Fakten',
      description: 'Unsere messbare Wirkung seit 2003',
      backgroundColor: 'white',
      layout: 'grid-2',
      cards: [
        {
          title: 'Umweltwirkung',
          description: 'Unser Beitrag zur Nachhaltigkeit',
          features: [
            'Mehrjährige Lebensdauerverlängerung pro Gerät',
            'Zahlreiche Geräte jährlich vor dem Entsorgen gerettet',
            'Hoher Anteil erfolgreich wiederverwendeter gespendeter Geräte'
          ]
        },
        {
          title: 'Soziale Wirkung',
          description: 'Unser Beitrag zur Gemeinschaft',
          features: [
            `${getDefaultValue('people_helped_total')} Menschen seit der Gründung geschult und engagiert`,
            'Ein bedeutender Teil der Praktikant:innen findet den Einstieg in die IT',
            'Zahlreiche erfolgreiche Wiedereinstiege ins Berufsleben'
          ]
        }
      ]
    },
    {
      title: 'Unsere Geschichte',
      description: 'Von einer kleinen Reparaturwerkstatt zu einer Bewegung',
      backgroundColor: 'gray',
      layout: 'single',
      cards: [
        {
          title: 'Seit 2003 für nachhaltige IT',
          description: `Was mit einer einfachen Idee begann – Technik länger nutzen – ist heute ein Vorbild für nachhaltige IT in der Schweiz. Unser Team aus ${getDefaultValue('team_size_community')} engagierten Menschen setzt sich täglich für nachhaltige IT ein. Wir sind Anlaufstelle für Privatpersonen und Unternehmen, die ihren ökologischen Fussabdruck reduzieren und trotzdem auf zuverlässige Technik setzen wollen.`,
          features: [
            `Gegründet ${getDefaultNumeric('founding_year')} in der Toni Molkerei`,
            'Heute eine Bewegung für nachhaltige IT',
            `Team aus ${getDefaultValue('team_size_community')} engagierten Menschen`,
            'Anlaufstelle für Privatpersonen und Unternehmen'
          ]
        }
      ]
    }
  ],
  metrics: [
    {
      title: 'Umweltwirkung',
      metrics: [
        { value: 'Mehrere Jahre', label: 'Durchschnittliche Lebensdauerverlängerung pro Gerät' },
        { value: 'Zahlreiche', label: 'Geräte, die wir jährlich vor dem Entsorgen retten' },
        { value: 'Hoher Anteil', label: 'Gespendete Geräte, die wir erfolgreich wiederverwenden' }
      ]
    },
    {
      title: 'Soziale Wirkung',
      metrics: [
        { value: getDefaultValue('people_helped_total'), label: 'Menschen seit der Gründung geschult/engagiert' },
        { value: 'Viele', label: 'Praktikant:innen finden den Einstieg in die IT oder eine Weiterbildung' },
        { value: 'Zahlreiche', label: 'Erfolgreiche Wiedereinstiege ins Berufsleben durch unser Programm' }
      ]
    }
  ],
  image: {
    src: '/images/Article Pics/storefront.png',
    alt: `${ORG.name} Schaufenster mit Computern und Geräten`
  },
  cta: {
    title: 'Werde Teil unserer Mission',
    description: 'Ob du ein Gerät reparieren lassen möchtest, mehr über nachhaltige IT erfahren willst oder unsere Sache unterstützen möchtest – bei uns bist du willkommen. Gemeinsam machen wir Technik nachhaltiger und zugänglicher für alle.',
    buttonText: 'Mitmachen',
    href: '/get-involved'
  }
}

/**
 * Get about page configuration
 */
export function getAboutConfig(): AboutPageConfig {
  return aboutConfig
}
