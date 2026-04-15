import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye, Target, BarChart3, Briefcase, FileText, Users } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { getCompactMetrics } from '@/data/impact-metrics'
import { ORG, CONTACT } from '@/config/org'

export const metadata: Metadata = {
  title: `Transparenz | ${ORG.name}`,
  description: `Was wir tun und wie wir es tun. Einblick in Mission, Zahlen und Arbeitsweise von ${ORG.name}.`,
  openGraph: {
    title: `Transparenz | ${ORG.name}`,
    description: `Was wir tun und wie wir es tun. Einblick in Mission, Zahlen und Arbeitsweise von ${ORG.name}.`,
    type: 'website',
    locale: 'de_CH',
    url: `${ORG.website}/transparenz`,
    siteName: ORG.name,
  },
}

const PLATFORMS = [
  {
    title: 'Marktplatz',
    description: 'Community-Plattform für gebrauchte IT-Geräte. Nutzer können Inserate erstellen, kaufen und verkaufen — ohne Gebühren.',
    href: '/marketplace',
  },
  {
    title: 'IT-Hilfe',
    description: 'Vermittlung von freiwilligen Technikern für Computer-Reparaturen. Hilfe von Mensch zu Mensch, lokal und unkompliziert.',
    href: '/it-hilfe',
  },
  {
    title: 'Workshops',
    description: 'Kurse zu Linux, Hardware, Programmierung und KI. Wissen teilen und voneinander lernen — vor Ort in Zürich.',
    href: '/workshops',
  },
]

export default function TransparenzPage() {
  const compactMetrics = getCompactMetrics()

  return (
    <div className="bg-white">
      {/* Hero */}
      <PageHero
        theme="about"
        icon={Eye}
        title="Transparenz"
        subtitle="Was wir tun und wie wir es tun"
      />

      {/* Section 1: Mission */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 flex-shrink-0" aria-hidden="true">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              Unsere Mission
            </Heading>
          </div>
          <p className="text-lg text-gray-600 leading-8">
            {ORG.description} Als {ORG.legalForm} (gegründet {ORG.foundingYear}) setzen wir uns dafür ein,
            dass gebrauchte Hardware ein zweites Leben bekommt, offene Software für alle verfügbar ist,
            und Menschen den Umgang mit Technologie selbstbestimmt erlernen können.
          </p>
        </div>
      </div>

      {/* Section 2: Zahlen & Fakten */}
      <div className="bg-green-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100" aria-hidden="true">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              Zahlen & Fakten
            </Heading>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {compactMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl p-4 sm:p-6 text-center border border-gray-100">
                <dd className="text-2xl sm:text-3xl font-bold text-green-600">{metric.value}</dd>
                <dt className="mt-1 text-xs sm:text-sm text-gray-600">{metric.label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-8 text-center">
            <Link
              href="/about/impact"
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              Detaillierte Wirkungszahlen ansehen <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 3: How We Work */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100" aria-hidden="true">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              Wie wir arbeiten
            </Heading>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Unsere drei Community-Plattformen verbinden Menschen mit Technologie.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <Link
                key={platform.title}
                href={platform.href}
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <Heading level={3} className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  {platform.title}
                </Heading>
                <p className="mt-2 text-sm text-gray-600">{platform.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-green-600">
                  Zur Plattform <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Finanzen */}
      <div className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0" aria-hidden="true">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              Finanzen
            </Heading>
          </div>
          <p className="text-lg text-gray-600 leading-8">
            Als gemeinnütziger Verein legen wir unsere Finanzen offen. Der Jahresbericht wird an der
            Generalversammlung präsentiert und ist für Mitglieder einsehbar.
          </p>
          <div className="mt-6">
            <Link
              href="/mitglied-werden"
              className="text-sm font-semibold text-green-600 hover:text-green-700"
            >
              Mitglied werden und Einblick erhalten <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 5: Vorstand */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0" aria-hidden="true">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              Vorstand
            </Heading>
          </div>
          <p className="text-lg text-gray-600 leading-8">
            {ORG.name} wird von einem ehrenamtlichen Vorstand geführt.
            Kontakt:{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-semibold text-green-600 hover:text-green-700 underline"
            >
              {CONTACT.email}
            </a>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/mitglied-werden"
              className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 text-center"
            >
              Mitglied werden
            </Link>
            <Link
              href="/get-involved/donate"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-green-600 border border-green-600 hover:bg-green-50 text-center"
            >
              Spenden
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
