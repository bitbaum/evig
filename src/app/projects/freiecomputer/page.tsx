import { Metadata } from 'next'
import { ProjectPage, generateProjectMetadata, ProjectCallToAction } from '@/components/projects'
import { ProjectPageConfig } from '@/components/projects/types'

const freiecomputerConfig: ProjectPageConfig = {
  hero: {
    title: 'FreieComputer.ch',
    description: 'Das Schweizer Label für Computer mit vorinstallierter freier Software und garantiertem Support',
    ctas: [
      {
        text: 'Unterstützen Sie unsere Mission',
        href: '/get-involved/volunteer',
        variant: 'primary'
      },
      {
        text: 'Kontakt',
        href: '/contact',
        variant: 'outline'
      }
    ]
  },
  sections: [
    {
      title: 'Über FreieComputer.ch',
      description: 'Zusammen mit engagierten Leuten aus der Open-Source-Community hat revamp-it geholfen, dieses Label zu etablieren, um die Wahlfreiheit in der Informatik zu fördern und Händler zu unterstützen, die Computer mit vorinstallierter freier Software verkaufen.',
      backgroundColor: 'white',
      layout: 'grid-3',
      cards: [
        {
          title: 'Freie Software',
          description: 'Computer mit vorinstalliertem Linux und anderen freien Software-Alternativen'
        },
        {
          title: 'Garantierter Support',
          description: 'Transparente Support-Leistungen mit klaren Kosteninformationen beim Kauf'
        },
        {
          title: 'Community-betrieben',
          description: 'Ein gemeinnütziger Verein, der von der Open-Source-Community getragen wird'
        }
      ]
    },
    {
      title: 'Unsere Mission',
      backgroundColor: 'gray',
      layout: 'grid-2',
      cards: [
        {
          title: 'Das Monopol brechen',
          description: 'Die Dominanz proprietärer Betriebssysteme durch zugängliche Alternativen herausfordern.',
          features: [
            'Förderung von Linux und freier Software',
            'Unterstützung unabhängiger Händler',
            'Schaffung von Bewusstsein für Alternativen'
          ]
        },
        {
          title: 'Wahlfreiheit für Konsumenten',
          description: 'Den Zugang zu Computern mit freier Software für Konsumenten erleichtern.',
          features: [
            'Vorinstallierte freie Software',
            'Transparente Support-Optionen',
            'Klare Kosteninformationen'
          ]
        },
        {
          title: 'Support-Leistungen',
          description: 'Einen reibungslosen Übergang zu freier Software mit umfassendem Support gewährleisten.',
          features: [
            'Garantierte Support-Pakete',
            'Transparente Preisgestaltung',
            'Professionelle Unterstützung'
          ]
        },
        {
          title: 'Community-Impact',
          description: 'Aufbau einer Community, die sich der Förderung freier Software in der Schweiz widmet.',
          features: [
            'Open-Source-Zusammenarbeit',
            'Wissensaustausch',
            'Community-Support'
          ]
        }
      ]
    },
    {
      title: 'Unsere Geschichte',
      backgroundColor: 'white',
      layout: 'single',
      cards: [
        {
          title: 'Unsere Geschichte',
          description: 'Seit der Lancierung von FreieComputer.ch im Jahr 2010 bietet revamp-it zertifizierte Computer unter dem Label zum Verkauf an. Wir arbeiten weiterhin mit engagierten Personen aus der Open-Source-Community zusammen, um das Label bekannter und zugänglicher zu machen.',
          features: [
            'Gegründet 2010',
            'Struktur als gemeinnütziger Verein',
            'Laufende Weiterentwicklung durch die Community'
          ]
        }
      ]
    }
  ],
  metadata: {
    title: 'FreieComputer.ch - Schweizer Label für freie Software',
    description: 'Das Schweizer Label für Computer mit vorinstallierter freier Software und garantiertem Support. Fördert die Wahlfreiheit in der Informatik seit 2010.'
  }
}

export const metadata: Metadata = generateProjectMetadata(freiecomputerConfig)

export default function FreieComputerPage() {
  return (
    <>
      <ProjectPage config={freiecomputerConfig} />
      <ProjectCallToAction
        title="Machen Sie mit"
        actions={[
          {
            title: 'Machen Sie mit',
            description: 'Helfen Sie mit, das Label bekannter und zugänglicher zu machen',
            href: '/get-involved/volunteer',
            ctaText: 'Freiwillig engagieren'
          },
          {
            title: 'Mehr erfahren',
            description: 'Besuchen Sie unsere Website für detaillierte Informationen über das Label',
            href: 'https://www.freiecomputer.ch',
            ctaText: 'Besuchen Sie FreieComputer.ch'
          },
          {
            title: 'Kontakt',
            description: 'Kontaktieren Sie uns, um mehr über unsere Initiative zu erfahren',
            href: '/contact',
            ctaText: 'Kontaktieren Sie uns'
          }
        ]}
      />
    </>
  )
}
