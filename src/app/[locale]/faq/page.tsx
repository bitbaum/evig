import type { Metadata } from 'next'
import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'

export const metadata: Metadata = {
  title: `FAQ – Häufige Fragen | ${ORG.name}`,
  description:
    `Antworten auf häufige Fragen zu ${ORG.name}: Linux & Open Source, Reparatur, Nachhaltigkeit und Elektroschrott.`,
}

type FAQItem = { q: string; a: string; link?: { href: string; label: string }; }
type FAQGroup = { category: string; items: FAQItem[] }

const faqs: FAQGroup[] = [
  {
    category: 'Philosophie & Open Source',
    items: [
      {
        q: 'Arbeitet ihr nur mit Open-Source-Software?',
        a: 'Nein. Open Source ist unser bevorzugter Weg – wegen Transparenz, Sicherheit und Langlebigkeit. Wo es sinnvoll ist, nutzen oder integrieren wir aber auch proprietäre Software, immer mit Fokus auf Nutzwert und Nachhaltigkeit.',
      },
      {
        q: 'Warum ist Open Source für euch wichtig?',
        a: 'Open Source stärkt Selbstbestimmung und Reparierbarkeit. Es reduziert Abhängigkeiten und ermöglicht, Geräte länger zu nutzen – zentrale Hebel gegen Elektroschrott.',
      },
      {
        q: 'Was bedeutet „Right to Repair“ für euch?',
        a: 'Wir setzen auf reparierbare Hardware, dokumentierte Prozesse und verfügbare Ersatzteile. So verlängern wir die Lebensdauer von Geräten und schonen Ressourcen.',
      },
    ],
  },
  {
    category: 'Betriebssysteme & Software',
    items: [
      {
        q: 'Arbeitet ihr nur mit Linux oder auch mit Windows und macOS?',
        a: 'Wir arbeiten ausschliesslich mit Linux und Open‑Source‑Software. Wir installieren keine proprietären Betriebssysteme (Windows/macOS). Sehr selten machen wir Ausnahmen, wenn ein Ziel nachweislich nicht mit Open‑Source‑Mitteln erreichbar ist.',
      },
      {
        q: 'Empfehlt ihr Linux für alle?',
        a: 'Unser Standard ist Linux, weil es ressourcenschonend, sicher und nachhaltig ist. Wenn zwingend proprietäre Tools benötigt werden, evaluieren wir Alternativen – und besprechen seltene Ausnahmen transparent.',
      },
      {
        q: 'Unterstützt ihr die Migration zu Linux oder Open‑Source‑Alternativen?',
        a: 'Ja. Von Pilotprojekten bis Rollout begleiten wir Privatpersonen, Vereine und Unternehmen – inklusive Schulungen und Support.',
        link: { href: '/services/linux-open-source', label: 'Linux & Open Source' },
      },
    ],
  },
  {
    category: 'Reparatur & Services',
    items: [
      {
        q: 'Repariert ihr Geräte, die nicht bei euch gekauft wurden?',
        a: 'Ja. Wir reparieren Laptops, PCs und Peripherie verschiedenster Hersteller – unabhängig vom Kaufort.',
      },
      {
        q: 'Repariert ihr Apple‑Geräte?',
        a: 'Hardware ja – sofern Ersatzteile verfügbar und eine Reparatur sinnvoll ist. Betriebssystem‑Installationen sind Linux‑only; wir installieren kein macOS oder Windows.',
      },
      {
        q: 'Wie lange dauern Reparaturen und was kosten sie?',
        a: 'Das hängt von Fehlerbild und Ersatzteilen ab. Wir erstellen auf Wunsch einen Kostenvoranschlag und informieren transparent über Optionen.',
      },
      {
        q: 'Bietet ihr Datenrettung und sichere Datenlöschung an?',
        a: 'Ja. Wir retten Daten nach bestem Aufwand und löschen Datenträger auf Wunsch sicher nach Standard (z. B. mit Open-Source-Tools).',
        link: { href: '/services/data-recovery-transfer', label: 'Datenrettung & Übertragung' },
      },
      {
        q: 'Kann ich ohne Termin vorbeikommen?',
        a: 'Gerne. Für komplexe Fälle oder Business-Termine empfehlen wir eine kurze Kontaktaufnahme vorab.',
        link: { href: '/contact', label: 'Kontakt & Öffnungszeiten' },
      },
    ],
  },
  {
    category: 'Nachhaltigkeit & Elektroschrott',
    items: [
      {
        q: 'Wie reduziert ihr Elektroschrott konkret?',
        a: 'Durch Reparaturen, Wiederverwendung von Komponenten, Refurbishing und fachgerechtes Recycling. Zudem beraten wir zu langlebigen Setups und ressourcenschonender Software.',
      },
      {
        q: 'Nehmt ihr alte Geräte an?',
        a: 'Ja, sofern Wiederverwendung oder fachgerechtes Recycling möglich sind. Wir prüfen Geräte vor Ort und entscheiden transparent über Weiterverwendung oder Zerlegung.',
      },
      {
        q: 'Verwendet ihr gebrauchte Ersatzteile?',
        a: 'Wo technisch sinnvoll, nutzen wir geprüfte Second‑Life‑Teile. Das spart Ressourcen und kann Kosten senken – bei gleicher Funktion.',
      },
      {
        q: 'Warum refurbished statt neu?',
        a: 'Refurbished Geräte verlängern die Nutzungsdauer, sparen CO₂ und Rohstoffe. Mit passenden Upgrades leisten sie oft mehr als genug – zu fairen Preisen.',
      },
    ],
  },
  {
    category: 'Produkte & Garantie',
    items: [
      {
        q: 'Habt ihr refurbished Geräte im Angebot?',
        a: 'Ja. Wir bieten sorgfältig geprüfte und aufbereitete Geräte mit Gewährleistung – transparent dokumentiert.',
        link: { href: '/shop', label: 'Zum Shop' },
      },
      {
        q: 'Was ist die REVAMPED‑Zertifizierung?',
        a: 'REVAMPED kennzeichnet nachhaltige, reparierbare Builds mit dokumentierter Herkunft, klaren Upgrade‑Pfaden und Qualitätssicherung.',
        link: { href: '/revamped', label: 'Mehr zu REVAMPED' },
      },
      {
        q: 'Gibt es Garantie auf eure Geräte?',
        a: 'Ja. Aufbereitete Geräte kommen mit Gewährleistung. Details nennen wir pro Produkt transparent.',
      },
    ],
  },
  {
    category: 'Daten & Privatsphäre',
    items: [
      {
        q: 'Wie geht ihr mit meinen Daten bei Reparaturen um?',
        a: 'Vertraulich und minimal. Wir greifen nur zu, wenn es für die Diagnose nötig ist, und schützen Datenträger technisch und organisatorisch.',
      },
      {
        q: 'Bietet ihr zertifizierte Datenlöschung an?',
        a: 'Wir bieten sichere Löschverfahren mit Protokoll. Sprich uns an, welches Sicherheitsniveau du brauchst.',
      },
    ],
  },
  {
    category: 'Workshops & Engagement',
    items: [
      {
        q: 'Bietet ihr Workshops oder Schulungen an?',
        a: 'Ja. Themen: Linux‑Einführung, Reparatur‑Basics, nachhaltige IT, Open‑Source‑Tools – für Einsteiger:innen bis Fortgeschrittene.',
        link: { href: '/workshops', label: 'Aktuelle Workshops' },
      },
      {
        q: 'Wie kann ich mitmachen oder unterstützen?',
        a: 'Als Freiwillige:r, Partner:in oder Spender:in. Auch Wissen teilen ist willkommen – gemeinsam schaffen wir Wirkung.',
        link: { href: '/get-involved', label: 'Engagiere dich' },
      },
    ],
  },
]

function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs
      .flatMap((g) => g.items)
      .slice(0, 20) // halten wir kompakt
      .map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <FAQSchema />
      <PageHero
        theme="faq"
        icon={HelpCircle}
        title="Häufige Fragen (FAQ)"
        subtitle="Unsere Antworten zu Linux & Open Source, Reparatur, Nachhaltigkeit und fairem Umgang mit Ressourcen – im Sinne unserer Mission gegen Elektroschrott."
      />
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">

            <div className="space-y-8 sm:space-y-10">
              {faqs.map((group) => (
                <section key={group.category}>
                  <Heading level={2} className="text-lg sm:text-xl text-gray-800 mb-3 sm:mb-4">{group.category}</Heading>
                  <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
                    {group.items.map((item, idx) => (
                      <details key={idx} className="group p-4 sm:p-5 open:bg-gray-50/60">
                        <summary className="cursor-pointer list-none flex items-start justify-between">
                          <span className="text-sm sm:text-base text-gray-900 font-medium pr-2">{item.q}</span>
                          <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">▾</span>
                        </summary>
                        <div className="mt-3 text-gray-700 text-xs sm:text-sm">
                          <p>{item.a}</p>
                          {item.link && (
                            <p className="mt-2">
                              <Link href={item.link.href} className="text-blue-600 hover:text-blue-800 underline">
                                {item.link.label}
                              </Link>
                            </p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 text-xs sm:text-sm">
              <p className="text-gray-800">
                Deine Frage ist nicht dabei? Wir helfen gerne persönlich weiter.
                <span className="ml-2">
                  <Link href="/contact" className="text-green-700 hover:text-green-800 underline font-medium">
                    Kontaktiere unser Team
                  </Link>
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
