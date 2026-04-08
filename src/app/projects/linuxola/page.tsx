import { Metadata } from 'next'
import { ProjectPage, generateProjectMetadata, ProjectCallToAction } from '@/components/projects'
import { ProjectPageConfig } from '@/components/projects/types'

const linuxolaConfig: ProjectPageConfig = {
  hero: {
    title: 'Verein Linuxola',
    description: 'Die digitale Kluft zwischen der Schweiz und Afrika überbrücken',
    ctas: [
      {
        text: 'Ausrüstung spenden',
        href: '/get-involved/donate',
        variant: 'primary'
      },
      {
        text: 'Freiwillig engagieren',
        href: '/get-involved/volunteer',
        variant: 'outline'
      }
    ]
  },
  sections: [
    {
      title: 'Über Linuxola',
      description: 'Der Verein Linuxola wurde am 2. Dezember 2005 von acht Personen aus verschiedenen Regionen der Schweiz gegründet. Zweck des Vereins ist es, unseren Partnern in Afrika den Zugang zur Informationstechnologie und eine Anbindung an die globalen digitalen Gemeingüter zu ermöglichen.',
      backgroundColor: 'white',
      layout: 'single'
    },
    {
      title: '',
      backgroundColor: 'gray',
      layout: 'grid-2',
      cards: [
        {
          title: 'Unsere Mission',
          description: '',
          features: [
            'Bereitstellung von Zugang zu Technologie und Schulungen',
            'Unterstützung nachhaltiger IT-Infrastruktur',
            'Förderung von Open-Source-Lösungen',
            'Aufbau langfristiger Partnerschaften'
          ]
        },
        {
          title: 'Unsere Wirkung',
          description: '',
          features: [
            'Einrichtung von Computerräumen in Schulen und Gemeinden',
            'Ausbildung lokaler IT-Fachkräfte',
            'Implementierung nachhaltiger Technologielösungen',
            'Schaffung dauerhafter Partnerschaften mit afrikanischen Organisationen'
          ]
        }
      ]
    },
    {
      title: 'Benötigte Ausrüstung',
      backgroundColor: 'white',
      layout: 'grid-3',
      cards: [
        {
          title: 'Computer & Laptops',
          description: '',
          features: [
            'Laptops (3-5 Jahre alt)',
            'Desktop-PCs',
            'Monitore',
            'Tastaturen & Mäuse'
          ]
        },
        {
          title: 'Netzwerk',
          description: '',
          features: [
            'Netzwerk-Switches',
            'WLAN-Router',
            'Netzwerkkabel',
            'USV-Systeme'
          ]
        },
        {
          title: 'Zubehör',
          description: '',
          features: [
            'USB-Sticks',
            'Externe Festplatten',
            'Netzteile',
            'RAM-Module'
          ]
        }
      ]
    }
  ],
  metadata: {
    title: 'Verein Linuxola',
    description: 'Linuxola ist eine Schweizer Organisation, die sich dem Zugang zu Informationstechnologie und der Anbindung afrikanischer Partner an die globalen digitalen Gemeingüter widmet.'
  }
}

export const metadata: Metadata = generateProjectMetadata(linuxolaConfig)

export default function LinuxolaPage() {
  return (
    <>
      <ProjectPage config={linuxolaConfig} />
      <ProjectCallToAction
        title="Mache mit"
        actions={[
          {
            title: 'Ausrüstung spenden',
            description: 'deine gebrauchte IT-Ausrüstung kann in afrikanischen Gemeinden einen echten Unterschied machen',
            href: '/get-involved/donate',
            ctaText: 'Jetzt spenden'
          },
          {
            title: 'Freiwillig engagieren',
            description: 'Teile dein technisches Fachwissen und hilf beim Aufbau von Computerräumen',
            href: '/get-involved/volunteer',
            ctaText: 'Engagiere sich'
          },
          {
            title: 'Kontakt',
            description: 'Kontaktiere uns für weitere Informationen',
            href: '/contact',
            ctaText: 'Kontakt aufnehmen'
          }
        ]}
      />
    </>
  )
}
