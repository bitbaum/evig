import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AGB | RevampIT',
  description: 'Allgemeine Geschäftsbedingungen von RevampIT',
}

export default function AGBPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Allgemeine Geschäftsbedingungen</h1>

      <section className="prose prose-neutral max-w-none space-y-6">
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Dienstleistungen und Angebote
          des Vereins RevampIT, Birmensdorferstrasse 379, 8055 Zürich, Schweiz.
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

        <h2>4. Gewährleistung</h2>
        <p>
          Für aufbereitete Geräte gewährt RevampIT eine Garantie gemäss den gesetzlichen
          Bestimmungen. Die genauen Garantiebedingungen werden beim Kauf mitgeteilt.
          Für Geräte, die über den P2P-Marktplatz von Dritten verkauft werden,
          übernimmt RevampIT keine Gewährleistung.
        </p>

        <h2>5. Haftung</h2>
        <p>
          RevampIT haftet im Rahmen der gesetzlichen Bestimmungen. Die Haftung für
          leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig.
        </p>

        <h2>6. Datenschutz</h2>
        <p>
          Die Bearbeitung personenbezogener Daten erfolgt gemäss unserer{' '}
          <a href="/datenschutz" className="text-green-700 underline">Datenschutzerklärung</a>.
        </p>

        <h2>7. Anwendbares Recht und Gerichtsstand</h2>
        <p>
          Es gilt Schweizer Recht. Gerichtsstand ist Zürich, Schweiz.
        </p>

        <h2>8. Änderungen</h2>
        <p>
          RevampIT behält sich vor, diese AGB jederzeit zu ändern. Die jeweils aktuelle
          Fassung ist auf dieser Seite abrufbar.
        </p>

        <p className="mt-12 text-sm text-neutral-500">Stand: März 2026</p>
      </section>
    </main>
  )
}
