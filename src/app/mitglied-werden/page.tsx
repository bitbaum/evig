import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, Vote, Calendar, Star, Leaf, Mail } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { ORG, CONTACT } from '@/config/org'

export const metadata: Metadata = {
  title: `Mitglied werden | ${ORG.name}`,
  description: `Werde Mitglied bei ${ORG.name} und gestalte die Zukunft nachhaltiger Technologie aktiv mit. Stimmrecht, Mitbestimmung und exklusive Veranstaltungen.`,
  openGraph: {
    title: `Mitglied werden | ${ORG.name}`,
    description: `Werde Mitglied bei ${ORG.name} und gestalte die Zukunft nachhaltiger Technologie aktiv mit.`,
    type: 'website',
    locale: 'de_CH',
    url: `${ORG.website}/mitglied-werden`,
    siteName: ORG.name,
  },
}

const MEMBERSHIP_BENEFITS = [
  {
    icon: Vote,
    title: 'Stimmrecht an der Generalversammlung',
    description: 'Stimme über wichtige Entscheidungen ab und wähle den Vorstand.',
  },
  {
    icon: Star,
    title: 'Mitbestimmung bei wichtigen Entscheidungen',
    description: 'Bring deine Ideen ein und gestalte die Richtung des Vereins.',
  },
  {
    icon: Calendar,
    title: 'Einladung zu exklusiven Veranstaltungen',
    description: 'Nimm an Mitglieder-Events, Workshops und Netzwerktreffen teil.',
  },
  {
    icon: Leaf,
    title: 'Beitrag zu einer nachhaltigen IT-Zukunft',
    description: 'Unterstütze aktiv die Wiederverwendung von Technologie und offene Software.',
  },
]

const FAQ = [
  {
    question: 'Was macht der Verein genau?',
    answer: `${ORG.legalName} fördert den nachhaltigen Umgang mit Technologie. Wir betreiben einen Community-Marktplatz für gebrauchte IT, vermitteln freiwillige Techniker für Reparaturen und bieten Workshops zu Linux, Hardware und Programmierung an.`,
  },
  {
    question: 'Wann ist die nächste Generalversammlung?',
    answer: 'Die Generalversammlung findet einmal jährlich statt. Mitglieder werden rechtzeitig per E-Mail eingeladen. Den genauen Termin erfahre nach deiner Aufnahme.',
  },
  {
    question: 'Kann ich jederzeit austreten?',
    answer: 'Ja, ein Austritt ist jederzeit möglich. Eine formlose E-Mail an den Vorstand genügt. Bereits bezahlte Jahresbeiträge werden nicht zurückerstattet.',
  },
]

export default function MitgliedWerdenPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <PageHero
        theme="getInvolved"
        icon={Award}
        title="Mitglied werden"
        subtitle="Gestalte die Zukunft von RevampIT aktiv mit"
      />

      {/* Benefits */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} className="tracking-tight text-gray-900">
              Was bedeutet Mitgliedschaft?
            </Heading>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Als Mitglied des {ORG.legalName} hast du echte Mitsprachemöglichkeiten und tragen aktiv zur Mission bei.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {MEMBERSHIP_BENEFITS.map((benefit) => (
              <div key={benefit.title} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 mb-4" aria-hidden="true">
                  <benefit.icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900">{benefit.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee & How to Join */}
      <div className="bg-green-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-200 shadow-sm">
            <Heading level={2} className="tracking-tight text-gray-900 text-center">
              Jahresbeitrag
            </Heading>
            <div className="mt-6 text-center">
              <p className="text-4xl font-bold text-green-600">CHF 50</p>
              <p className="mt-2 text-sm text-gray-600">
                Ermässigt CHF 20 für Studierende und Lernende
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <Heading level={3} className="tracking-tight text-gray-900">
                So wirst du Mitglied
              </Heading>
              <p className="mt-4 text-base text-gray-600">
                Sende eine E-Mail an{' '}
                <a
                  href={`mailto:${CONTACT.email}?subject=Mitgliedschaftsantrag`}
                  className="font-semibold text-green-600 hover:text-green-700 underline"
                >
                  {CONTACT.email}
                </a>{' '}
                mit deinem Namen und deiner Adresse. Wir nehmen deinen Antrag an der nächsten Vorstandssitzung auf.
              </p>
              <div className="mt-6">
                <a
                  href={`mailto:${CONTACT.email}?subject=Mitgliedschaftsantrag`}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Antrag per E-Mail senden
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} className="tracking-tight text-gray-900">
              Häufig gestellte Fragen
            </Heading>
          </div>

          <div className="space-y-6">
            {FAQ.map((item) => (
              <div key={item.question} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-base font-bold text-gray-900">{item.question}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-gray-600">
              Weitere Fragen?{' '}
              <Link href="/contact" className="font-semibold text-green-600 hover:text-green-700">
                Kontaktiere uns
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
