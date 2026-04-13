import type { Metadata } from 'next'
import Link from 'next/link'
import { Award, Vote, Users, Heart, CheckCircle, User as UserIcon } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { ORG, MEMBERSHIP } from '@/config/org'
import { auth } from '@/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { MembershipApplicationForm } from '@/components/membership/MembershipApplicationForm'

export const metadata: Metadata = {
  title: `Mitglied werden | ${ORG.name}`,
  description: `Werde Mitglied bei ${ORG.name}. Stimmrecht bei Vereinsentscheiden, Teil der offiziellen Trägerschaft. CHF ${MEMBERSHIP.fees.regular}/Jahr.`,
  openGraph: {
    title: `Mitglied werden | ${ORG.name}`,
    description: `Werde Mitglied bei ${ORG.name} — Stimmrecht, Mitverantwortung, CHF ${MEMBERSHIP.fees.regular}/Jahr.`,
    type: 'website',
  },
}

const WHAT_YOU_GET = [
  {
    icon: Vote,
    title: 'Stimmrecht bei Vereinsentscheiden',
    description: 'Du wirst automatisch zu Abstimmungen eingeladen und entscheidest mit über die Richtung des Vereins.',
  },
  {
    icon: Users,
    title: 'Offizielle Mitgliederliste',
    description: 'Du bist rechtlich Teil der Trägerschaft des Vereins nach Schweizer Vereinsrecht (ZGB Art. 60 ff).',
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
    answer: 'Ein Nutzerkonto brauchst du für Marktplatz, IT-Hilfe und Workshops — das ist kostenlos. Eine Vereinsmitgliedschaft gibt dir Stimmrecht und macht dich offiziell Teil der Trägerschaft. Die meisten Nutzer:innen werden nie Mitglied — das ist völlig in Ordnung.',
  },
  {
    question: 'Was bekomme ich konkret als Mitglied?',
    answer: 'Stimmrecht bei Vereinsentscheiden und einen Platz auf der offiziellen Mitgliederliste. Wir versprechen keine exklusiven Vorteile — unsere Angebote sind für alle da. Du wirst Mitglied, weil du den Verein mittragen willst.',
  },
  {
    question: 'Wie funktioniert die Aufnahme?',
    answer: 'Formular ausfüllen, Jahresbeitrag überweisen — fertig. Du bist sofort Mitglied. Kein Warten, keine Genehmigung.',
  },
  {
    question: 'Wie zahle ich den Jahresbeitrag?',
    answer: 'Nach dem Beitritt siehst du die Bankverbindung direkt auf der Bestätigungsseite. Überweisung oder TWINT.',
  },
  {
    question: 'Kann ich jederzeit austreten?',
    answer: 'Ja. Eine formlose E-Mail an den Vorstand genügt. Bereits bezahlte Jahresbeiträge werden nicht zurückerstattet.',
  },
]

async function getMemberStatus() {
  const session = await auth()
  if (!session?.user?.id) return { isLoggedIn: false, isMember: false }

  const [user] = await db
    .select({ isMember: users.isMember, memberSince: users.memberSince, memberType: users.memberType })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  return {
    isLoggedIn: true,
    isMember: user?.isMember ?? false,
    memberSince: user?.memberSince,
    memberType: user?.memberType,
  }
}

export default async function MitgliedWerdenPage() {
  const status = await getMemberStatus()

  return (
    <div className="bg-white">
      {/* Compact header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <Award className="w-10 h-10 text-green-600 mx-auto mb-4" />
          <Heading level={1} className="text-2xl sm:text-3xl text-gray-900 mb-3">
            Mitglied werden
          </Heading>
          <p className="text-gray-600 max-w-xl mx-auto">
            Trage den Verein mit — rechtlich, finanziell und demokratisch. Formular ausfüllen, Beitrag überweisen, fertig.
          </p>
        </div>
      </div>

      {/* What you get — honest, 3 items */}
      <div className="py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {WHAT_YOU_GET.map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <item.icon className="h-6 w-6 text-green-600 mb-3" aria-hidden="true" />
                <Heading level={3} className="text-base text-gray-900">{item.title}</Heading>
                <p className="mt-1.5 text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form or status */}
      <div className="bg-green-50 py-10 sm:py-14">
        <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm">
            {status.isMember ? (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <Heading level={2} className="text-xl text-gray-900 mb-2">Du bist Mitglied</Heading>
                <p className="text-gray-600 mb-1">
                  Vielen Dank für deine Unterstützung.
                </p>
                {status.memberSince && (
                  <p className="text-sm text-gray-500 mb-6">
                    Dabei seit {new Date(status.memberSince).toLocaleDateString('de-CH')}
                  </p>
                )}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500"
                >
                  <UserIcon className="h-4 w-4" />
                  Zum Dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <Heading level={2} className="text-xl text-gray-900">
                    Jetzt beitreten
                  </Heading>
                  <p className="text-sm text-gray-500 mt-1">
                    Sofortige Mitgliedschaft — kein Warten
                  </p>
                </div>
                <MembershipApplicationForm />
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Heading level={2} className="text-xl text-gray-900 text-center mb-8">
            Häufige Fragen
          </Heading>
          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.question} className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <Heading level={3} className="text-sm font-bold text-gray-900">{item.question}</Heading>
                <p className="mt-1.5 text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
