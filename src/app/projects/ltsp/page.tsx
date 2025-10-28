import { Metadata } from 'next'
import { ProjectPage, generateProjectMetadata } from '@/components/projects'
import { ProjectPageConfig } from '@/components/projects/types'
import { Server, Users, Settings, CheckCircle, Rocket, Phone } from 'lucide-react'

const ltspConfig: ProjectPageConfig = {
  hero: {
    title: 'LTSP - Linux Terminal Server Project',
    description: 'Verlängerung der Lebensdauer älterer Computer durch serverbasiertes Computing',
    backgroundColor: 'bg-gradient-to-r from-green-600 to-blue-700'
  },
  sections: [
    {
      title: '',
      backgroundColor: 'gray',
      layout: 'grid-2',
      cards: [
        {
          title: 'Über LTSP',
          description: 'Das Linux Terminal Server Project (LTSP) ermöglicht es mehreren Benutzern, gleichzeitig an älteren Computern zu arbeiten, indem sie mit einem leistungsstarken Server verbunden werden. Dies optimiert die Ressourcennutzung und verlängert die Lebensdauer der Hardware.'
        },
        {
          title: 'Wie es funktioniert',
          description: '',
          features: [
            'Anwendungen laufen auf einem zentralen Server',
            'Thin Clients oder alte PCs fungieren als Terminals',
            'Effizientes Ressourcenmanagement',
            'Konsistente Benutzererfahrung',
            'Minimale Anforderungen an die Client-Rechner'
          ]
        }
      ]
    },
    {
      title: '',
      backgroundColor: 'gray',
      layout: 'grid-3',
      cards: [
        {
          title: 'Vorteile',
          description: '',
          features: [
            'Verlängerung der Hardware-Lebensdauer',
            'Reduzierung der Wartungskosten',
            'Zentralisierte Verwaltung & Updates',
            'Verbesserte Sicherheit',
            'Geringerer Energieverbrauch'
          ]
        },
        {
          title: 'Implementierung',
          description: '',
          features: [
            'Server-Einrichtung & Konfiguration',
            'Client-Vorbereitung',
            'Netzwerkoptimierung',
            'Benutzerverwaltung & Sicherheit',
            'Laufender Support'
          ]
        },
        {
          title: 'Anwendungsfälle',
          description: '',
          features: [
            'Schulen & Bildung',
            'Öffentliche Computerräume',
            'Unternehmen',
            'Gemeindezentren',
            'Gemeinnützige Organisationen'
          ]
        }
      ]
    },
    {
      title: '',
      backgroundColor: 'gray',
      layout: 'grid-2',
      cards: [
        {
          title: 'Erste Schritte',
          description: '',
          features: [
            'Bewertung Ihrer Infrastruktur',
            'Planung Ihrer Implementierung',
            'Einrichtung von Server & Clients',
            'Schulung der Mitarbeiter',
            'Laufender Support'
          ]
        },
        {
          title: 'Kontaktieren Sie uns',
          description: 'Möchten Sie mehr darüber erfahren, wie LTSP Ihrer Organisation zugute kommen kann? Kontaktieren Sie uns, um Ihre Bedürfnisse zu besprechen und wie wir Ihnen bei der Implementierung dieser leistungsstarken Lösung helfen können.'
        }
      ]
    }
  ],
  metadata: {
    title: 'LTSP - Linux Terminal Server Project',
    description: 'Das Linux Terminal Server Project ermöglicht es mehreren Benutzern, gleichzeitig an älteren Computern zu arbeiten, indem sie mit einem leistungsstarken Server verbunden werden, was die Ressourcennutzung optimiert und die Lebensdauer der Hardware verlängert.'
  }
}

export const metadata: Metadata = generateProjectMetadata(ltspConfig)

export default function LTSPPage() {
  return <ProjectPage config={ltspConfig} />
}
