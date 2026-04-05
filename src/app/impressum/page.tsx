import { Metadata } from 'next'
import { ORG, CONTACT, LOCATIONS } from '@/config/org'

export const metadata: Metadata = {
  title: `Impressum | ${ORG.name}`,
  description: `Impressum und rechtliche Angaben von ${ORG.legalName}`,
}

export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Impressum</h1>

      <section className="prose prose-neutral max-w-none space-y-6">
        <h2>Angaben gemäss Schweizer Recht</h2>

        <h3>Organisation</h3>
        <p>
          {ORG.legalName}<br />
          {LOCATIONS.store.street}<br />
          {LOCATIONS.store.postalCode} {LOCATIONS.store.city}<br />
          {LOCATIONS.store.country}
        </p>

        <h3>Kontakt</h3>
        <p>
          E-Mail: <a href={`mailto:${CONTACT.email}`} className="text-green-700 underline">{CONTACT.email}</a><br />
          Telefon: <a href={CONTACT.phoneTel} className="text-green-700 underline">{CONTACT.phone}</a>
        </p>

        <h3>Vertretungsberechtigt</h3>
        <p>Der Vorstand</p>

        <h3>Rechtsform</h3>
        <p>Verein nach Art. 60 ff. ZGB (Schweizerisches Zivilgesetzbuch)</p>

        <h3>Zweck</h3>
        <p>
          {ORG.description} {ORG.name} ist ein gemeinnütziger Verein, der sich für den
          freien Austausch von Technologie, die Förderung von Open-Source-Hardware und
          -Software sowie die nachhaltige Aufarbeitung und Wiederverwendung von
          IT-Geräten einsetzt.
        </p>

        <h2>Haftungsausschluss</h2>
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

        <h2>Haftungsausschluss für Verweise und Links</h2>
        <p>
          Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
          Verantwortungsbereichs. Es wird jegliche Verantwortung für solche Webseiten
          abgelehnt. Der Zugriff und die Nutzung solcher Webseiten erfolgen auf eigene
          Gefahr des jeweiligen Nutzers.
        </p>

        <h2>Urheberrechte</h2>
        <p>
          Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen
          Dateien auf dieser Website gehören ausschliesslich {ORG.legalName} oder den
          speziell genannten Rechteinhabern. Für die Reproduktion jeglicher Elemente ist
          die schriftliche Zustimmung der Urheberrechtsträger im Voraus einzuholen.
        </p>

        <h2>Weitere rechtliche Hinweise</h2>
        <p>
          Siehe auch unsere{' '}
          <a href="/datenschutz" className="text-green-700 underline">Datenschutzerklärung</a>
          {' '}und unsere{' '}
          <a href="/agb" className="text-green-700 underline">Allgemeinen Geschäftsbedingungen</a>.
        </p>

        <p className="mt-12 text-sm text-neutral-500">Stand: April 2026</p>
      </section>
    </main>
  )
}
