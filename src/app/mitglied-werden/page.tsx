import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, Vote, Users, Heart, CheckCircle, User as UserIcon, Calendar } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { auth } from '@/auth'
import { db } from '@/db'
import { users, membershipApplications } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { MembershipApplicationForm } from '@/components/membership/MembershipApplicationForm'

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

const MEMBERSHIP_REALITIES = [
  {
    icon: Vote,
    title: 'Stimmrecht bei Vereinsentscheiden',
    description: 'Als Mitglied wirst du automatisch zu Abstimmungen eingeladen. Du entscheidest mit über die Richtung des Vereins.',
  },
  {
    icon: Users,
    title: 'Offizielle Mitgliederliste',
    description: 'Du bist rechtlich gesehen Teil der Trägerschaft des Vereins nach Schweizer Vereinsrecht (ZGB Art. 60 ff).',
  },
  {
    icon: Heart,
    title: 'Finanzielle Unterstützung',
    description: 'Dein Jahresbeitrag hilft uns, den Verein nachhaltig zu finanzieren — unabhängig von externen Geldgebern.',
  },
]

const FAQ = [
  {
    question: 'Was ist der Unterschied zwischen einem Nutzerkonto und einer Mitgliedschaft?',
    answer: 'Ein Nutzerkonto brauchst du, um auf dem Marktplatz zu kaufen/verkaufen, Reparaturen anzufragen oder Workshops zu buchen — das ist kostenlos und für alle offen. Eine Vereinsmitgliedschaft ist etwas anderes: Du wirst rechtlich Teil der Trägerschaft des Vereins und erhältst Stimmrecht bei Entscheiden. Die meisten Nutzer:innen werden nie Mitglied — das ist völlig in Ordnung.',
  },
  {
    question: 'Muss ich ein Konto haben, um Mitglied zu werden?',
    answer: 'Nein. Du kannst den Antrag auch ohne bestehenden Account einreichen. Sobald der Vorstand deinen Antrag bestätigt, erstellen wir dir ein Mitglieder-Konto — oder wir verknüpfen die Mitgliedschaft mit deinem bestehenden Konto, falls du bereits eines hast.',
  },
  {
    question: 'Was bekomme ich konkret als Mitglied?',
    answer: 'Ehrliche Antwort: Du bekommst Stimmrecht bei Vereinsentscheiden und stehst auf der offiziellen Mitgliederliste. Das ist es. Wir versprechen keine exklusiven Vorteile, weil wir an einen offenen Verein glauben — unsere Angebote sind für alle da, nicht nur für Mitglieder. Du wirst Mitglied, weil du den Verein mittragen willst, nicht wegen Perks.',
  },
  {
    question: 'Wie läuft eine Abstimmung ab?',
    answer: `Wenn der Vorstand einen Entscheid zur Abstimmung stellt, werden alle Mitglieder automatisch per E-Mail eingeladen. Du kannst online abstimmen und die Diskussion zum Entscheid verfolgen. Die Ergebnisse sind für alle Mitglieder transparent einsehbar.`,
  },
  {
    question: 'Was macht der Verein genau?',
    answer: `${ORG.legalName} fördert den nachhaltigen Umgang mit Technologie. Wir betreiben einen Community-Marktplatz für gebrauchte IT, vermitteln Techniker für Reparaturen und bieten Workshops zu Linux, Hardware und Programmierung an.`,
  },
  {
    question: 'Wie zahle ich den Jahresbeitrag?',
    answer: 'Nach Annahme deines Antrags erhältst du eine Rechnung per E-Mail mit allen Zahlungsinformationen. Die Zahlung erfolgt per Banküberweisung oder TWINT.',
  },
  {
    question: 'Kann ich jederzeit austreten?',
    answer: 'Ja, ein Austritt ist jederzeit möglich. Eine formlose E-Mail an den Vorstand genügt. Bereits bezahlte Jahresbeiträge werden nicht zurückerstattet.',
  },
]

async function getMembershipStatus() {
  const session = await auth()
  if (!session?.user?.id) return { isLoggedIn: false, isMember: false, hasPendingApplication: false }

  const [user] = await db
    .select({
      isMember: users.isMember,
      memberSince: users.memberSince,
      memberType: users.memberType,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const [pending] = await db
    .select({ id: membershipApplications.id, createdAt: membershipApplications.createdAt })
    .from(membershipApplications)
    .where(
      and(
        eq(membershipApplications.userId, session.user.id),
        eq(membershipApplications.status, 'pending')
      )
    )
    .orderBy(desc(membershipApplications.createdAt))
    .limit(1)

  return {
    isLoggedIn: true,
    isMember: user?.isMember ?? false,
    memberSince: user?.memberSince,
    memberType: user?.memberType,
    hasPendingApplication: !!pending,
    pendingSince: pending?.createdAt,
  }
}

export default async function MitgliedWerdenPage() {
  const status = await getMembershipStatus()

  return (
    <div className="bg-white">
      {/* Hero */}
      <PageHero
        theme="getInvolved"
        icon={Award}
        title="Mitglied werden"
        subtitle="Trage den Verein mit — rechtlich, finanziell und demokratisch"
      />

      {/* Honest intro */}
      <div className="pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <Heading level={2} className="text-lg text-amber-900 mb-2">
              Ehrlich: Du musst nicht Mitglied werden
            </Heading>
            <p className="text-amber-900 text-sm leading-relaxed">
              Alle unsere Angebote — Marktplatz, IT-Hilfe, Workshops — sind für alle offen und bleiben es. Du musst kein Mitglied werden, um mitzumachen. Eine Vereinsmitgliedschaft ist etwas anderes: Du wirst <strong>rechtlich Teil der Trägerschaft</strong> des Vereins und übernimmst Mitverantwortung. Das ist kein Upgrade mit Perks — es ist ein Bekenntnis zum Verein.
            </p>
          </div>
        </div>
      </div>

      {/* What membership actually gives you */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Heading level={2} className="tracking-tight text-gray-900">
              Was du als Mitglied wirklich bekommst
            </Heading>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Drei konkrete Dinge — keine leeren Versprechen.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-3 max-w-5xl mx-auto">
            {MEMBERSHIP_REALITIES.map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 mb-4" aria-hidden="true">
                  <item.icon className="h-5 w-5 text-green-600" />
                </div>
                <Heading level={3} className="text-base font-bold text-gray-900">{item.title}</Heading>
                <p className="mt-2 text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form / Status */}
      <div className="bg-green-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-200 shadow-sm">
            {status.isMember ? (
              // Already a member
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <Heading level={2} className="tracking-tight text-gray-900">Du bist Mitglied!</Heading>
                <p className="mt-3 text-gray-600">
                  Vielen Dank für deine Unterstützung. Als Mitglied hast du Stimmrecht an Entscheiden und der Generalversammlung.
                </p>
                {status.memberSince && (
                  <p className="mt-2 text-sm text-gray-500">
                    Mitglied seit {new Date(status.memberSince).toLocaleDateString('de-CH')}
                  </p>
                )}
                <Link
                  href="/dashboard"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                >
                  <UserIcon className="h-4 w-4" />
                  Zum Dashboard
                </Link>
              </div>
            ) : status.hasPendingApplication ? (
              // Pending application
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                  <Calendar className="w-8 h-8 text-yellow-600" />
                </div>
                <Heading level={2} className="tracking-tight text-gray-900">Dein Antrag wird geprüft</Heading>
                <p className="mt-3 text-gray-600">
                  Wir haben deinen Mitgliedschaftsantrag erhalten und werden ihn an der nächsten Vorstandssitzung besprechen. Du erhältst eine E-Mail sobald eine Entscheidung getroffen wurde.
                </p>
                {status.pendingSince && (
                  <p className="mt-2 text-sm text-gray-500">
                    Eingereicht am {new Date(status.pendingSince).toLocaleDateString('de-CH')}
                  </p>
                )}
              </div>
            ) : (
              // Show form
              <>
                <Heading level={2} className="tracking-tight text-gray-900 text-center">
                  Jetzt Mitglied werden
                </Heading>
                <div className="mt-4 text-center">
                  <p className="text-4xl font-bold text-green-600">CHF 50</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Ermässigt CHF 20 für Studierende und Lernende · Jahresbeitrag
                  </p>
                </div>
                <div className="mt-8">
                  <MembershipApplicationForm />
                </div>
              </>
            )}
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
                <Heading level={3} className="text-base font-bold text-gray-900">{item.question}</Heading>
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
