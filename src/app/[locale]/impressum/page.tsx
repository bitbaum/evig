import { Metadata } from 'next'
import Link from 'next/link'
import { ORG, CONTACT, LOCATIONS } from '@/config/org'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: `Impressum | ${ORG.name}`,
  description: `Impressum und rechtliche Angaben von ${ORG.legalName}`,
}

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Heading level={1} className="mb-8 text-3xl">Impressum</Heading>

      <section className="prose prose-neutral max-w-none space-y-6">
        <Heading level={2}>Angaben gemäss Schweizer Recht</Heading>

        <Heading level={3}>Organisation</Heading>
        <p>
          {ORG.legalName}<br />
          {LOCATIONS.store.street}<br />
          {LOCATIONS.store.postalCode} {LOCATIONS.store.city}<br />
          {LOCATIONS.store.country}
        </p>

        <Heading level={3}>Kontakt</Heading>
        <p>
          E-Mail: <a href={`mailto:${CONTACT.email}`} className="text-green-700 underline">{CONTACT.email}</a><br />
          Telefon: <a href={CONTACT.phoneTel} className="text-green-700 underline">{CONTACT.phone}</a>
        </p>

        <Heading level={3}>Vertretungsberechtigt</Heading>
        <p>Der Vorstand</p>

        <Heading level={3}>Rechtsform</Heading>
        <p>Verein nach Art. 60 ff. ZGB (Schweizerisches Zivilgesetzbuch)</p>

        <Heading level={3}>Zweck</Heading>
        <p>
          {ORG.description} {ORG.name} ist ein gemeinnütziger Verein, der sich für den
          freien Austausch von Technologie, die Förderung von Open-Source-Hardware und
          -Software sowie die nachhaltige Aufarbeitung und Wiederverwendung von
          IT-Geräten einsetzt.
        </p>

        <Heading level={2}>Haftungsausschluss</Heading>
        <p>
          Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit,
          Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen
          auf dieser Website.
        </p>
        <p>
          Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller
          Art, welche aus dem Zugriff oder der Nutzung beziehungsweise Nichtnutzung der
          veröffentlichten Informationen, durch Missbrauch der Verbindung oder durch
          technische Störungen entstanden sind, werden ausgeschlossen.
        </p>
        <p>
          Alle Angebote sind unverbindlich. Der Autor behält es sich ausdrücklich vor,
          Teile der Seiten oder das gesamte Angebot ohne gesonderte Ankündigung zu
          verändern, zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder
          endgültig einzustellen.
        </p>

        <Heading level={2}>Haftungsausschluss für Verweise und Links</Heading>
        <p>
          Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
          Verantwortungsbereichs. Es wird jegliche Verantwortung für solche Webseiten
          abgelehnt. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene
          Gefahr des jeweiligen Nutzers.
        </p>

        <Heading level={2}>Urheberrechte</Heading>
        <p>
          Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen
          Dateien auf dieser Website gehören ausschliesslich {ORG.legalName} oder den
          speziell genannten Rechteinhabern. Für die Reproduktion jeglicher Elemente ist
          die schriftliche Zustimmung der Urheberrechtsträger im Voraus einzuholen.
        </p>

        <Heading level={2}>Weitere rechtliche Hinweise</Heading>
        <p>
          Siehe auch unsere{' '}
          <Link href="/datenschutz" className="text-green-700 underline">Datenschutzerklärung</Link>
          {' '}und unsere{' '}
          <Link href="/agb" className="text-green-700 underline">Allgemeinen Geschäftsbedingungen</Link>.
        </p>

        <p className="mt-12 text-sm text-neutral-500">Stand: April 2026</p>
      </section>
    </main>
  )
}
