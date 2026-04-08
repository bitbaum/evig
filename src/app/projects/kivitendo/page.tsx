import { Metadata } from 'next'
import { ProjectPage, generateProjectMetadata, ProjectCallToAction } from '@/components/projects'
import { ProjectPageConfig } from '@/components/projects/types'

const kivitendoConfig: ProjectPageConfig = {
  hero: {
    title: 'Kivitendo',
    description: 'Das einzigartige Open Source CRM & ERP, das durch ständige personalisierte Weiterentwicklung höchste Qualitätsstandards erfüllt',
    backgroundColor: 'bg-gradient-to-r from-blue-600 to-blue-800'
  },
  sections: [
    {
      title: 'Warum Kivitendo wählen?',
      description: 'Eine umfassende Lösung für Auftragsabwicklung, Warenwirtschaft und Finanzbuchhaltung',
      backgroundColor: 'white',
      layout: 'grid-3',
      cards: [
        {
          title: 'Open-Source-Vorteile',
          description: '',
          features: [
            'Hohe Anpassungsfähigkeit an deine Bedürfnisse',
            'Vollständiger Zugriff auf Code und Entwicklungen',
            'Keine fixen Lizenzkosten'
          ]
        },
        {
          title: 'Auftragsabwicklung',
          description: '',
          features: [
            'Kompletter Workflow von Angebot bis Rechnung',
            'Anpassbare Dokumentvorlagen',
            'Direkte E-Mail-Integration'
          ]
        },
        {
          title: 'Finanzbuchhaltung',
          description: '',
          features: [
            'Komplette oder modulare Buchhaltung',
            'Anpassbarer Kontenplan',
            'Import von Kontoauszügen'
          ]
        }
      ]
    },
    {
      title: 'Hauptmerkmale',
      description: 'Umfassende Funktionen für deine Geschäftsanforderungen',
      backgroundColor: 'gray',
      layout: 'grid-2',
      cards: [
        {
          title: 'Geschäftskonfiguration',
          description: 'Konfiguriere das System für deine spezifischen Geschäftsanforderungen',
          features: [
            'Mehrere Währungen & Sprachen',
            'Mandantenfähigkeit',
            'Benutzerdefinierte Benutzergruppen'
          ]
        },
        {
          title: 'Integration & Anpassung',
          description: 'Erweitere die Funktionalität nach deinen Bedürfnissen',
          features: [
            'Webshop-Integration',
            'Benutzerdefinierte Variablen',
            'Prozessautomatisierung'
          ]
        }
      ]
    },
    {
      title: 'Premium-Partnerschaft',
      description: 'Seit Juli 2015 ist revamp-it Premium-Partner des Kivitendo-Projekts. Wir bieten konfiguration und support für dieses Open-Source ERP-System.',
      backgroundColor: 'white',
      layout: 'single',
      cards: [
        {
          title: 'Unsere Dienstleistungen',
          description: 'Wir unterstützen dich bei der Nutzung von Kivitendo',
          features: [
            'Konfiguration & Customization',
            'Support & Wartung',
            'Schulungen und Beratung'
          ]
        }
      ]
    }
  ],
  metadata: {
    title: 'Kivitendo - Open Source CRM & ERP | RevampIT',
    description: 'Das einzigartige Open Source CRM & ERP von RevampIT, das durch ständige personalisierte Weiterentwicklung höchste Qualitätsstandards erfüllt.'
  }
}

export const metadata: Metadata = generateProjectMetadata(kivitendoConfig)

export default function KivitendoPage() {
  return (
    <>
      <ProjectPage config={kivitendoConfig} />
      <ProjectCallToAction
        title="Mehr erfahren"
        actions={[
          {
            title: 'Kivitendo Schweiz',
            description: 'Besuche die offizielle Schweizer Kivitendo-Website',
            href: 'https://www.kivitendo.ch',
            ctaText: 'Website besuchen'
          },
          {
            title: 'Community-Forum',
            description: 'Hol dir Hilfe und teile Wissen mit anderen Benutzern',
            href: 'https://forum.kivitendo.de/',
            ctaText: 'Forum besuchen'
          },
          {
            title: 'Kontakt',
            description: 'Kontaktiere uns für mehr Informationen',
            href: '/contact',
            ctaText: 'Kontakt aufnehmen'
          }
        ]}
      />
    </>
  )
}
