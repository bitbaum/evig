import { Metadata } from 'next'
import { ORG, LOCATIONS, CONTACT } from '@/config/org'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: `AGB | ${ORG.name}`,
  description: `Allgemeine Geschäftsbedingungen von ${ORG.name}`,
}

export default function AGBPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Heading level={1} className="mb-8 text-3xl">Allgemeine Geschäftsbedingungen</Heading>

      <section className="prose prose-neutral max-w-none space-y-6">
        <Heading level={2}>1. Geltungsbereich</Heading>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Dienstleistungen und Angebote
          des {ORG.legalName}, {LOCATIONS.store.fullWithCountry}.
        </p>

        <Heading level={2}>2. Leistungen</Heading>
        <p>
          {ORG.name} ist ein gemeinnütziger Verein, der sich für die nachhaltige Aufarbeitung und
          Weiterverwendung von IT-Geräten einsetzt. Unsere Leistungen umfassen:
        </p>
        <ul>
          <li>Aufarbeitung und Verkauf gebrauchter IT-Geräte</li>
          <li>IT-Reparaturdienstleistungen</li>
          <li>Workshops und Schulungen</li>
          <li>P2P-Marktplatz für gebrauchte Geräte</li>
          <li>IT-Hilfe und Support</li>
        </ul>

        <Heading level={2}>3. Preise und Zahlung</Heading>
        <p>
          Alle Preise verstehen sich in Schweizer Franken (CHF) inklusive Mehrwertsteuer,
          sofern nicht anders angegeben. Die Zahlungsbedingungen werden beim jeweiligen
          Angebot spezifiziert.
        </p>

        <Heading level={2}>4. Vertragsschluss</Heading>
        <p>
          Ein Vertrag kommt durch Bestellung über die Plattform, im Ladenlokal oder
          per E-Mail und anschliessende Bestätigung durch {ORG.name} zustande.
          Darstellungen auf der Website gelten als unverbindliche Einladung zur
          Abgabe eines Angebots.
        </p>

        <Heading level={2}>5. Widerrufsrecht</Heading>
        <p>
          Beim Kauf im Ladenlokal gilt kein gesetzliches Widerrufsrecht, da dies im
          Schweizer Recht für stationäre Geschäfte nicht vorgesehen ist. Bei
          Online-Käufen gewähren wir ein freiwilliges Rückgaberecht von 14 Tagen
          ab Erhalt der Ware, sofern diese ungenutzt und in originalverpacktem
          Zustand zurückgesandt wird. Kontakt: <a href={`mailto:${CONTACT.email}`} className="text-green-700 underline">{CONTACT.email}</a>.
        </p>

        <Heading level={2}>6. Gewährleistung</Heading>
        <p>
          Für aufbereitete Geräte gewährt {ORG.name} eine Garantie gemäss den gesetzlichen
          Bestimmungen. Die genauen Garantiebedingungen werden beim Kauf mitgeteilt.
          Für Geräte, die über den P2P-Marktplatz von Dritten verkauft werden,
          übernimmt {ORG.name} keine Gewährleistung.
        </p>

        <Heading level={2}>7. Haftung</Heading>
        <p>
          {ORG.name} haftet im Rahmen der gesetzlichen Bestimmungen. Die Haftung für
          leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig.
        </p>

        <Heading level={2}>8. Datenschutz</Heading>
        <p>
          Die Bearbeitung personenbezogener Daten erfolgt gemäss unserer{' '}
          <a href="/datenschutz" className="text-green-700 underline">Datenschutzerklärung</a>.
          Angemeldete Nutzer können ihre Daten jederzeit selbst exportieren.
        </p>

        <Heading level={2}>9. Schlussbestimmungen</Heading>
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt. Es gilt Schweizer Recht.
          Gerichtsstand ist Zürich, Schweiz.
        </p>

        <Heading level={2}>10. Änderungen</Heading>
        <p>
          {ORG.name} behält sich vor, diese AGB jederzeit zu ändern. Die jeweils aktuelle
          Fassung ist auf dieser Seite abrufbar. Rechtliche Angaben zum Anbieter finden
          findest du im <a href="/impressum" className="text-green-700 underline">Impressum</a>.
        </p>

        <p className="mt-12 text-sm text-neutral-500">Stand: April 2026</p>
      </section>
    </main>
  )
}
