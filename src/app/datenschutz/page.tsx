import { Metadata } from 'next'
import { ORG, CONTACT, LOCATIONS } from '@/config/org'

export const metadata: Metadata = {
  title: `Datenschutzerklärung | ${ORG.name}`,
  description: `Datenschutzerklärung von ${ORG.name}`,
}

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">Datenschutzerklärung</h1>

      <section className="prose prose-neutral max-w-none space-y-6">
        <h2>1. Verantwortliche Stelle</h2>
        <p>
          {ORG.legalName}<br />
          {LOCATIONS.store.street}<br />
          {LOCATIONS.store.postalCode} {LOCATIONS.store.city}, {LOCATIONS.store.country}<br />
          E-Mail: {CONTACT.email}
        </p>

        <h2>2. Erhebung und Verarbeitung personenbezogener Daten</h2>
        <p>
          Wir erheben personenbezogene Daten, wenn Sie sich auf unserer Plattform registrieren,
          unsere Dienstleistungen nutzen oder mit uns in Kontakt treten. Dies umfasst:
        </p>
        <ul>
          <li>Name und E-Mail-Adresse (bei Registrierung)</li>
          <li>Kontaktdaten (bei Anfragen und Terminbuchungen)</li>
          <li>Nutzungsdaten (bei Verwendung der Plattform)</li>
        </ul>

        <h2>3. Zweck der Datenverarbeitung</h2>
        <p>Ihre Daten werden verwendet für:</p>
        <ul>
          <li>Bereitstellung und Verwaltung Ihres Benutzerkontos</li>
          <li>Durchführung von Reparaturaufträgen und Dienstleistungen</li>
          <li>Verwaltung von Workshop-Anmeldungen</li>
          <li>Betrieb des P2P-Marktplatzes</li>
          <li>Kommunikation bezüglich unserer Angebote (nur mit Einwilligung)</li>
        </ul>

        <h2>4. Datenweitergabe</h2>
        <p>
          Ihre Daten werden nicht an Dritte verkauft. Eine Weitergabe erfolgt nur, wenn
          dies zur Erbringung unserer Dienstleistungen erforderlich ist (z.B. an
          Reparaturdienstleister bei gebuchten Reparaturen) oder wenn wir gesetzlich
          dazu verpflichtet sind.
        </p>

        <h2>5. Datensicherheit</h2>
        <p>
          Wir setzen technische und organisatorische Massnahmen ein, um Ihre Daten
          vor unbefugtem Zugriff, Verlust oder Missbrauch zu schützen. Passwörter
          werden ausschliesslich gehasht gespeichert.
        </p>

        <h2>6. Cookies</h2>
        <p>
          Unsere Plattform verwendet funktionale Cookies für die Sitzungsverwaltung
          und Authentifizierung. Analytische Cookies werden nur mit Ihrer Einwilligung
          gesetzt.
        </p>

        <h2>7. Ihre Rechte</h2>
        <p>Sie haben das Recht auf:</p>
        <ul>
          <li>Auskunft über Ihre gespeicherten Daten</li>
          <li>Berichtigung unrichtiger Daten</li>
          <li>Löschung Ihrer Daten</li>
          <li>Einschränkung der Verarbeitung</li>
          <li>Datenübertragbarkeit (Datenexport)</li>
          <li>Widerruf erteilter Einwilligungen</li>
        </ul>
        <p>
          Angemeldete Nutzer können eine vollständige Kopie ihrer Daten jederzeit
          selbst herunterladen unter{' '}
          <a href="/dashboard/settings" className="text-green-700 underline">
            Einstellungen → Datenschutz
          </a>
          . Für alle weiteren Anliegen wenden Sie sich bitte an:{' '}
          <a href={`mailto:${CONTACT.email}`} className="text-green-700 underline">{CONTACT.email}</a>
        </p>

        <h2>8. Speicherdauer</h2>
        <p>
          Wir speichern Ihre personenbezogenen Daten nur so lange, wie es für die
          genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen dies
          verlangen. Konto- und Profildaten werden nach Löschung des Kontos entfernt,
          sofern keine gesetzlichen Pflichten (z.B. steuerliche Aufbewahrung von
          Rechnungen) entgegenstehen.
        </p>

        <h2>9. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung erfolgt gestützt auf das Schweizer Datenschutzgesetz (DSG)
          sowie, soweit anwendbar, auf Art. 6 Abs. 1 DSGVO (Vertragserfüllung,
          berechtigte Interessen, Einwilligung).
        </p>

        <h2>10. Anwendbares Recht</h2>
        <p>
          Diese Datenschutzerklärung unterliegt dem Schweizer Datenschutzgesetz (DSG)
          sowie, soweit anwendbar, der Europäischen Datenschutz-Grundverordnung (DSGVO).
          Siehe auch unser <a href="/impressum" className="text-green-700 underline">Impressum</a>.
        </p>

        <p className="mt-12 text-sm text-neutral-500">Stand: März 2026</p>
      </section>
    </main>
  )
}
