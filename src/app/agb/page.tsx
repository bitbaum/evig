import { Metadata } from 'next'
import { ORG, LOCATIONS, CONTACT } from '@/config/org'

export const metadata: Metadata = {
  title: `AGB | ${ORG.name}`,
  description: `Allgemeine Geschäftsbedingungen von ${ORG.name}`,
}

export default function AGBPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Allgemeine Geschäftsbedingungen</h1>

      <section className="prose prose-neutral max-w-none space-y-6">
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Dienstleistungen und Angebote
          des {ORG.legalName}, {LOCATIONS.store.fullWithCountry}.
        </p>

        <h2>2. Leistungen</h2>
        <p>
          RevampIT ist ein gemeinnütziger Verein, der sich für die nachhaltige Aufarbeitung und
          Weiterverwendung von IT-Geräten einsetzt. Unsere Leistungen umfassen:
        </p>
        <ul>
          <li>Aufarbeitung und Verkauf gebrauchter IT-Geräte</li>
          <li>IT-Reparaturdienstleistungen</li>
          <li>Workshops und Schulungen</li>
          <li>P2P-Marktplatz für gebrauchte Geräte</li>
          <li>IT-Hilfe und Support</li>
        </ul>

        <h2>3. Preise und Zahlung</h2>
        <p>
          Alle Preise verstehen sich in Schweizer Franken (CHF) inklusive Mehrwertsteuer,
          sofern nicht anders angegeben. Die Zahlungsbedingungen werden beim jeweiligen
          Angebot spezifiziert.
        </p>

        <h2>4. Vertragsschluss</h2>
        <p>
          Ein Vertrag kommt durch Bestellung über die Plattform, im Ladenlokal oder
          per E-Mail und anschliessende Bestätigung durch {ORG.name} zustande.
          Darstellungen auf der Website gelten als unverbindliche Einladung zur
          Abgabe eines Angebots.
        </p>

        <h2>5. Widerrufsrecht</h2>
        <p>
          Beim Kauf im Ladenlokal gilt kein gesetzliches Widerrufsrecht, da dies im
          Schweizer Recht für stationäre Geschäfte nicht vorgesehen ist. Bei
          Online-Käufen gewähren wir ein freiwilliges Rückgaberecht von 14 Tagen
          ab Erhalt der Ware, sofern diese ungenutzt und in originalverpacktem
          Zustand zurückgesandt wird. Kontakt: <a href={`mailto:${CONTACT.email}`} className="text-green-700 underline">{CONTACT.email}</a>.
        </p>

        <h2>6. Gewährleistung</h2>
        <p>
          Für aufbereitete Geräte gewährt RevampIT eine Garantie gemäss den gesetzlichen
          Bestimmungen. Die genauen Garantiebedingungen werden beim Kauf mitgeteilt.
          Für Geräte, die über den P2P-Marktplatz von Dritten verkauft werden,
          übernimmt RevampIT keine Gewährleistung.
        </p>

        <h2>7. Haftung</h2>
        <p>
          RevampIT haftet im Rahmen der gesetzlichen Bestimmungen. Die Haftung für
          leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig.
        </p>

        <h2>8. Datenschutz</h2>
        <p>
          Die Bearbeitung personenbezogener Daten erfolgt gemäss unserer{' '}
          <a href="/datenschutz" className="text-green-700 underline">Datenschutzerklärung</a>.
          Angemeldete Nutzer können ihre Daten jederzeit selbst exportieren.
        </p>

        <h2>9. Schlussbestimmungen</h2>
        <p>
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die
          Wirksamkeit der übrigen Bestimmungen unberührt. Es gilt Schweizer Recht.
          Gerichtsstand ist Zürich, Schweiz.
        </p>

        <h2>10. Änderungen</h2>
        <p>
          RevampIT behält sich vor, diese AGB jederzeit zu ändern. Die jeweils aktuelle
          Fassung ist auf dieser Seite abrufbar. Rechtliche Angaben zum Anbieter finden
          Sie im <a href="/impressum" className="text-green-700 underline">Impressum</a>.
        </p>

        <p className="mt-12 text-sm text-neutral-500">Stand: April 2026</p>
      </section>
    </main>
  )
}
