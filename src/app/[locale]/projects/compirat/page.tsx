import { Metadata } from 'next'
import { ProjectPage, generateProjectMetadata, ProjectCallToAction } from '@/components/projects'
import { ProjectPageConfig } from '@/components/projects/types'
import { ORG } from '@/config/org'

// Project configuration
const compiratConfig: ProjectPageConfig = {
  hero: {
    title: 'Compirat',
    description: 'Computerkenntnisse und Linux-Bildung für alle',
    ctas: [
      {
        text: 'Freiwilliger werden',
        href: '/get-involved/volunteer',
        variant: 'primary'
      },
      {
        text: 'Kontakt aufnehmen',
        href: '/contact',
        variant: 'outline'
      }
    ]
  },
  sections: [
    {
      title: 'Über Compirat',
      description: 'Ein gemeinsames Projekt von Caritas Zürich und revamp-it, das zugängliche Computerkurse und Internetzugangspunkte für Menschen mit geringem Einkommen im Kanton Zürich anbietet.',
      backgroundColor: 'white',
      layout: 'grid-3',
      cards: [
        {
          title: 'Lokale Kurse',
          description: 'Computer-Einstiegskurse in der Nachbarschaft der Teilnehmer oder in nahegelegenen Standorten'
        },
        {
          title: 'Linux-Fokus',
          description: 'Einführung in Linux als Betriebssystem und Bereitstellung einer kostenlosen und offenen Alternative'
        },
        {
          title: 'Internetzugang',
          description: 'Kostenlose Internetzugangspunkte mit professioneller Betreuung zum Üben und Lernen'
        }
      ]
    },
    {
      title: 'Unser Programm',
      backgroundColor: 'gray',
      layout: 'grid-2',
      cards: [
        {
          title: 'Einstiegskurse',
          description: 'Umfassende Computerkurse für Anfänger, die sich auf grundlegende Fähigkeiten und Linux-Grundlagen konzentrieren.',
          features: [
            'Grundlegende Computerbedienung',
            'Einführung in Linux',
            'Internet- und E-Mail-Grundlagen'
          ]
        },
        {
          title: 'Internetzugangspunkte',
          description: 'Betreute Übungsräume, in denen Teilnehmer ihre Fähigkeiten anwenden und das Internet nutzen können.',
          features: [
            'Professionelle Betreuung',
            'Kostenloser Internetzugang',
            'Übung und Unterstützung'
          ]
        },
        {
          title: 'Fortgeschrittenenkurse',
          description: 'Spezialisierte Kurse für Teilnehmer, die ihr Wissen und ihre Fähigkeiten vertiefen möchten.',
          features: [
            'Fortgeschrittene Linux-Nutzung',
            'Produktivitätstools',
            'Digitale Kommunikation'
          ]
        },
        {
          title: 'Online-Ressourcen',
          description: 'Umfassende Online-Plattform mit Lernmaterialien und Unterstützungsressourcen.',
          features: [
            'Kursmaterialien',
            'Linux-Tutorials',
            'Übungsaufgaben'
          ]
        }
      ]
    }
  ],
  metadata: {
    title: `Compirat - Computerkenntnisse mit Linux | ${ORG.name}`,
    description: 'Ein gemeinsames Projekt von Caritas Zürich und revamp-it, das Computerkurse und Internetzugangspunkte für Menschen mit geringem Einkommen im Kanton Zürich anbietet.'
  }
}

export const metadata: Metadata = generateProjectMetadata(compiratConfig)

export default function CompiratPage() {
  return (
    <>
      <ProjectPage config={compiratConfig} />
      <ProjectCallToAction
        title="Mitmachen"
        actions={[
          {
            title: 'Freiwilliger werden',
            description: 'Unterstütze Kurse und Internetzugangspunkte als Freiwilliger',
            href: '/get-involved/volunteer',
            ctaText: 'Mitmachen'
          },
          {
            title: 'Mehr erfahren',
            description: 'Besuche unsere Website für detaillierte Informationen und Ressourcen',
            href: 'https://www.compirat.ch',
            ctaText: 'Compirat.ch besuchen'
          },
          {
            title: 'Kontakt',
            description: 'Kontaktiere uns für weitere Informationen über unsere Programme',
            href: '/contact',
            ctaText: 'Kontakt aufnehmen'
          }
        ]}
      />
    </>
  )
}
