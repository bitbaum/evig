import { Metadata } from 'next'
import { ProjectPage, generateProjectMetadata, ProjectCallToAction } from '@/components/projects'
import { ProjectPageConfig } from '@/components/projects/types'

const hardwareConfig: ProjectPageConfig = {
  hero: {
    title: 'Hardware-Entwicklung',
    description: 'Innovative Lösungen für nachhaltiges Computing',
    ctas: [
      {
        text: 'An unseren Projekten teilnehmen',
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
      title: 'Über unsere Hardware-Arbeit',
      description: 'Bei revamp-it konzentrieren wir uns darauf, neue Anwendungen für ausgemusterte Computer-Hardware zu finden, die noch voll funktionsfähig ist, aber aufgrund des technologischen Fortschritts nicht mehr für ihren ursprünglichen Zweck geeignet ist.',
      backgroundColor: 'white',
      layout: 'grid-3',
      cards: [
        {
          title: 'Hardware-Wiederverwendung',
          description: 'Neue Funktionalitäten für gebrauchte elektronische Komponenten finden und deren Lebenszyklus verlängern'
        },
        {
          title: 'Energieoptimierung',
          description: 'Entwicklung von energie- und ressourceneffizienten Computerlösungen'
        },
        {
          title: 'Open-Source-Anleitungen',
          description: 'Erstellung umfassender Anleitungen für die Montage von Open-Source-Hardware'
        }
      ]
    },
    {
      title: 'Aktuelle Projekte',
      backgroundColor: 'gray',
      layout: 'grid-2',
      cards: [
        {
          title: '12V-Stromversorgung für rezyklierte Computer',
          description: 'Entwicklung von Lösungen zum Ersatz von 220V-Netzteilen durch 12V-Alternativen für den Einsatz mit erneuerbaren Energiequellen (Solar-, Wind- oder Pedalkraft).',
          features: [
            'Erstellung von Selbstbauanleitungen für 12V-Netzteile',
            'Maximierung der Nutzung von rezyklierten Komponenten',
            'Ermöglichung der Computernutzung in Gebieten mit begrenzter Strominfrastruktur'
          ]
        },
        {
          title: 'EPROM-Wiederverwendung',
          description: 'Sammeln und Umprogrammieren von BIOS-Chips von alten Motherboards, Erweiterungskarten und Druckern.',
          features: [
            'Verwendung eines EPROM-Programmiergeräts zur Chip-Umprogrammierung',
            'Implementierung in Netzwerkkarten mit leeren Sockeln',
            'Ermöglichung des Netzwerk-Boots für LTSP-Clients'
          ]
        },
        {
          title: 'Netzteil-Reparatur',
          description: 'Entwicklung von Fachwissen in der Reparatur von Computer-Netzteilen und dem Austausch von Komponenten.',
          features: [
            'Fokus auf grosse, leicht austauschbare Komponenten',
            'Verlängerung der Lebensdauer von teilweise beschädigten Netzteilen',
            'Erstellung von Reparaturanleitungen und Dokumentationen'
          ]
        },
        {
          title: 'LCD-Monitor-Reparatur',
          description: 'Erweiterung unserer Expertise in der Reparatur von Flachbildschirmen mit kleineren Defekten.',
          features: [
            'Diagnose und Behebung gängiger LCD-Probleme',
            'Reparaturtechniken auf Komponentenebene',
            'Dokumentation erfolgreicher Reparaturmethoden'
          ]
        }
      ]
    },
    {
      title: 'SCSI-Kabel-Wiederverwendung',
      backgroundColor: 'white',
      layout: 'single',
      cards: [
        {
          title: 'SCSI-Kabel-Wiederverwendung',
          description: 'Erforschung neuer Anwendungen für SCSI-Kabel und -Schnittstellen, die einst der Standard für zuverlässige Datenübertragung in Serverumgebungen waren.',
          features: [
            'Finden neuer Verwendungszwecke für robuste SCSI-Kabel',
            'Entwicklung alternativer Anwendungen für SCSI-Schnittstellen',
            'Erstellung von Dokumentationen für Wiederverwendungsmethoden'
          ]
        }
      ]
    }
  ],
  metadata: {
    title: 'Hardware-Entwicklung',
    description: 'Die Hardware-Entwicklungsarbeit von RevampIT konzentriert sich auf die Entdeckung neuer Möglichkeiten für ausgemusterte Computer-Hardware, die Optimierung des Energieverbrauchs und die Erstellung von Anleitungen für die Montage von Open-Source-Hardware.'
  }
}

export const metadata: Metadata = generateProjectMetadata(hardwareConfig)

export default function HardwarePage() {
  return (
    <>
      <ProjectPage config={hardwareConfig} />
      <ProjectCallToAction
        title="Machen Sie mit"
        actions={[
          {
            title: 'Wissen teilen',
            description: 'Bringen Sie Ihr Fachwissen in der Hardware-Reparatur und -Optimierung ein',
            href: '/get-involved/volunteer',
            ctaText: 'Engagieren Sie sich'
          },
          {
            title: 'Hardware spenden',
            description: 'Spenden Sie alte Hardware für unsere Wiederverwendungsprojekte',
            href: '/get-involved/donate',
            ctaText: 'Spenden'
          },
          {
            title: 'Zusammenarbeiten',
            description: 'Arbeiten Sie mit uns an Hardware-Entwicklungsprojekten',
            href: '/contact',
            ctaText: 'Kontaktieren Sie uns'
          }
        ]}
      />
    </>
  )
}
